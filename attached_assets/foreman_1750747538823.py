#!/usr/bin/env python3
"""
Project Chimera - Foreman Module
AST Transformation Engine with atomic transactions and rollback support
"""

import os
import sys
import json
import shutil
import argparse
import logging
import tempfile
import subprocess
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from dataclasses import dataclass
from contextlib import contextmanager

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s", "module": "foreman", "metadata": %(metadata)s}',
    handlers=[logging.StreamHandler()]
)

class StructuredLogger:
    """Structured logger for JSON output"""
    
    def __init__(self, logger_name: str = "foreman"):
        self.logger = logging.getLogger(logger_name)
    
    def info(self, message: str, **metadata):
        extra = {'metadata': json.dumps(metadata)}
        self.logger.info(message, extra=extra)
    
    def error(self, message: str, **metadata):
        extra = {'metadata': json.dumps(metadata)}
        self.logger.error(message, extra=extra)
    
    def debug(self, message: str, **metadata):
        extra = {'metadata': json.dumps(metadata)}
        self.logger.debug(message, extra=extra)

logger = StructuredLogger()

@dataclass
class TransformCommand:
    """Represents a transformation command"""
    target_ast_path: str
    property: str
    new_value: Any
    component_path: str = ""

class FileBackupManager:
    """Manages file backups for atomic transactions"""
    
    def __init__(self):
        self.backups: Dict[str, str] = {}
        self.temp_dir = None
    
    def __enter__(self):
        self.temp_dir = tempfile.mkdtemp(prefix='chimera_backup_')
        logger.info("Created backup directory", backup_dir=self.temp_dir)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            # Exception occurred, restore all files
            logger.error("Exception occurred, restoring backups", 
                        exception=str(exc_val), 
                        files_to_restore=list(self.backups.keys()))
            self.restore_all()
        
        # Clean up temp directory
        if self.temp_dir and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
            logger.info("Cleaned up backup directory", backup_dir=self.temp_dir)
    
    def backup_file(self, file_path: str) -> str:
        """Create backup of a file"""
        if file_path in self.backups:
            return self.backups[file_path]
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Cannot backup non-existent file: {file_path}")
        
        backup_name = f"backup_{len(self.backups)}_{Path(file_path).name}"
        backup_path = os.path.join(self.temp_dir, backup_name)
        
        shutil.copy2(file_path, backup_path)
        self.backups[file_path] = backup_path
        
        logger.debug("File backed up", 
                    original_file=file_path, 
                    backup_path=backup_path)
        
        return backup_path
    
    def restore_file(self, file_path: str) -> bool:
        """Restore a single file from backup"""
        if file_path not in self.backups:
            logger.error("No backup found for file", file_path=file_path)
            return False
        
        backup_path = self.backups[file_path]
        try:
            shutil.copy2(backup_path, file_path)
            logger.info("File restored from backup", 
                       file_path=file_path, 
                       backup_path=backup_path)
            return True
        except Exception as e:
            logger.error("Failed to restore file", 
                        file_path=file_path, 
                        error=str(e))
            return False
    
    def restore_all(self) -> None:
        """Restore all backed up files"""
        for file_path in self.backups:
            self.restore_file(file_path)

class ASTTransformationEngine:
    """Core AST transformation engine using code generation"""
    
    def __init__(self):
        self.project_data = {}
        self.schema_validator = SchemaValidator()
    
    def load_project_data(self, project_data_path: str = "project_data.json") -> None:
        """Load project data from JSON file"""
        try:
            with open(project_data_path, 'r', encoding='utf-8') as f:
                self.project_data = json.load(f)
            
            logger.info("Project data loaded successfully", 
                       file_path=project_data_path,
                       components_count=self._count_components())
        
        except Exception as e:
            logger.error("Failed to load project data", 
                        file_path=project_data_path, 
                        error=str(e))
            raise
    
    def _count_components(self) -> int:
        """Count total components in project"""
        count = 0
        def count_recursive(node):
            nonlocal count
            if isinstance(node, dict):
                if node.get('type') == 'Component':
                    count += 1
                for value in node.values():
                    if isinstance(value, (list, dict)):
                        count_recursive(value)
            elif isinstance(node, list):
                for item in node:
                    count_recursive(item)
        
        count_recursive(self.project_data)
        return count
    
    def parse_command(self, command_str: str) -> TransformCommand:
        """Parse transformation command string"""
        logger.debug("Parsing transformation command", command=command_str)
        
        # Expected format: "astPath.property=newValue"
        try:
            if '=' not in command_str:
                raise ValueError("Command must contain '=' separator")
            
            left_part, new_value = command_str.split('=', 1)
            
            if '.' not in left_part:
                raise ValueError("Command must specify property with '.' separator")
            
            ast_path, property_name = left_part.rsplit('.', 1)
            
            # Try to parse new_value as JSON for complex types
            try:
                new_value = json.loads(new_value)
            except json.JSONDecodeError:
                # Keep as string if not valid JSON
                pass
            
            command = TransformCommand(
                target_ast_path=ast_path,
                property=property_name,
                new_value=new_value
            )
            
            logger.info("Command parsed successfully", 
                       ast_path=command.target_ast_path,
                       property=command.property,
                       new_value_type=type(command.new_value).__name__)
            
            return command
        
        except Exception as e:
            logger.error("Failed to parse command", 
                        command=command_str, 
                        error=str(e))
            raise
    
    def generate_intended_state(self, command: TransformCommand) -> Dict[str, Any]:
        """Generate intended state by applying command to project data"""
        logger.info("Generating intended state", 
                   ast_path=command.target_ast_path,
                   property=command.property)
        
        # Create deep copy of project data
        import copy
        intended_state = copy.deepcopy(self.project_data)
        
        # Find and modify the target element
        target_found = self._apply_transformation(intended_state, command)
        
        if not target_found:
            raise ValueError(f"Target AST path not found: {command.target_ast_path}")
        
        logger.info("Intended state generated successfully",
                   ast_path=command.target_ast_path,
                   property=command.property)
        
        return intended_state
    
    def _apply_transformation(self, data: Any, command: TransformCommand, current_path: str = "") -> bool:
        """Recursively apply transformation to data structure"""
        if isinstance(data, dict):
            # Check if this node has the target astPath
            if data.get('astPath') == command.target_ast_path:
                if command.property in data:
                    old_value = data[command.property]
                    data[command.property] = command.new_value
                    
                    logger.debug("Transformation applied",
                               ast_path=command.target_ast_path,
                               property=command.property,
                               old_value=old_value,
                               new_value=command.new_value)
                    return True
                else:
                    logger.error("Property not found in target element",
                               ast_path=command.target_ast_path,
                               property=command.property,
                               available_properties=list(data.keys()))
                    return False
            
            # Recursively search in nested structures
            for key, value in data.items():
                if self._apply_transformation(value, command, f"{current_path}.{key}"):
                    return True
        
        elif isinstance(data, list):
            for i, item in enumerate(data):
                if self._apply_transformation(item, command, f"{current_path}[{i}]"):
                    return True
        
        return False
    
    def generate_code_from_ast(self, ast_data: Dict[str, Any], target_path: str) -> Tuple[str, str]:
        """Generate before/after code strings from AST data"""
        logger.info("Generating code from AST", target_path=target_path)
        
        # Find the component containing the target path
        component_data = self._find_component_by_ast_path(ast_data, target_path)
        
        if not component_data:
            raise ValueError(f"Component not found for AST path: {target_path}")
        
        # Generate code using mock code generator (in production, use @babel/generator)
        before_code = self._generate_component_code(component_data, target_path, is_before=True)
        after_code = self._generate_component_code(component_data, target_path, is_before=False)
        
        logger.debug("Code generation completed",
                    target_path=target_path,
                    before_code_length=len(before_code),
                    after_code_length=len(after_code))
        
        return before_code, after_code
    
    def _find_component_by_ast_path(self, data: Any, target_path: str) -> Optional[Dict[str, Any]]:
        """Find component containing the target AST path"""
        if isinstance(data, dict):
            if data.get('type') == 'Component':
                # Check if this component contains the target path
                if self._contains_ast_path(data, target_path):
                    return data
            
            for value in data.values():
                result = self._find_component_by_ast_path(value, target_path)
                if result:
                    return result
        
        elif isinstance(data, list):
            for item in data:
                result = self._find_component_by_ast_path(item, target_path)
                if result:
                    return result
        
        return None
    
    def _contains_ast_path(self, data: Any, target_path: str) -> bool:
        """Check if data structure contains the target AST path"""
        if isinstance(data, dict):
            if data.get('astPath') == target_path:
                return True
            
            for value in data.values():
                if self._contains_ast_path(value, target_path):
                    return True
        
        elif isinstance(data, list):
            for item in data:
                if self._contains_ast_path(item, target_path):
                    return True
        
        return False
    
    def _generate_component_code(self, component_data: Dict[str, Any], target_path: str, is_before: bool = True) -> str:
        """Generate React component code from component data"""
        # This is a simplified mock implementation
        # In production, use @babel/generator with proper AST manipulation
        
        component_name = component_data.get('name', 'Unknown')
        
        # Mock code generation based on component structure
        code_lines = [
            f"function {component_name}() {{",
            "  return (",
            "    <div>",
        ]
        
        # Add elements
        for element in component_data.get('definition', {}).get('elements', []):
            element_code = self._generate_element_code(element, target_path, is_before)
            code_lines.extend([f"      {line}" for line in element_code.split('\n')])
        
        code_lines.extend([
            "    </div>",
            "  );",
            "}"
        ])
        
        return '\n'.join(code_lines)
    
    def _generate_element_code(self, element: Dict[str, Any], target_path: str, is_before: bool) -> str:
        """Generate code for a single element"""
        element_type = element.get('type', 'div')
        props = element.get('props', {})
        
        # If this is the target element and we're generating 'after' code, modify it
        is_target = element.get('astPath') == target_path
        
        if is_target and not is_before:
            # Apply mock transformation (in real implementation, use actual changes)
            element_type = element_type  # Keep same for this mock
        
        # Generate JSX
        if props:
            props_str = ' '.join([f'{k}="{v}"' for k, v in props.items()])
            return f"<{element_type} {props_str}></{element_type}>"
        else:
            return f"<{element_type}></{element_type}>"
    
    def execute_file_transformation(self, component_path: str, before_code: str, after_code: str) -> None:
        """Execute file transformation using string replacement"""
        logger.info("Executing file transformation", 
                   file_path=component_path,
                   before_code_length=len(before_code),
                   after_code_length=len(after_code))
        
        if not os.path.exists(component_path):
            raise FileNotFoundError(f"Component file not found: {component_path}")
        
        # Read current file content
        with open(component_path, 'r', encoding='utf-8') as f:
            current_content = f.read()
        
        # Perform replacement
        if before_code not in current_content:
            logger.error("Before code not found in file",
                        file_path=component_path,
                        before_code_preview=before_code[:100])
            raise ValueError("Before code not found in target file")
        
        new_content = current_content.replace(before_code, after_code, 1)
        
        # Write modified content
        with open(component_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        logger.info("File transformation completed successfully",
                   file_path=component_path,
                   content_length_change=len(new_content) - len(current_content))
    
    def verify_transformation(self, component_path: str, intended_state: Dict[str, Any]) -> bool:
        """Verify transformation by running surveyor and comparing states"""
        logger.info("Starting transformation verification", file_path=component_path)
        
        try:
            # Run surveyor on modified file
            result = subprocess.run([
                sys.executable, 'surveyor.py', component_path, '--verify'
            ], capture_output=True, text=True, check=True)
            
            actual_state = json.loads(result.stdout)
            
            # Compare intended vs actual state
            verification_result = self._deep_compare(intended_state, actual_state)
            
            if verification_result:
                logger.info("Transformation verification successful", 
                           file_path=component_path)
            else:
                logger.error("Transformation verification failed",
                           file_path=component_path,
                           differences="State mismatch detected")
            
            return verification_result
        
        except subprocess.CalledProcessError as e:
            logger.error("Surveyor verification failed",
                        file_path=component_path,
                        error=e.stderr,
                        exit_code=e.returncode)
            return False
        
        except Exception as e:
            logger.error("Verification process failed",
                        file_path=component_path,
                        error=str(e))
            return False
    
    def _deep_compare(self, obj1: Any, obj2: Any, path: str = "") -> bool:
        """Deep comparison of two data structures"""
        if type(obj1) != type(obj2):
            logger.debug("Type mismatch in deep comparison",
                        path=path,
                        type1=type(obj1).__name__,
                        type2=type(obj2).__name__)
            return False
        
        if isinstance(obj1, dict):
            if set(obj1.keys()) != set(obj2.keys()):
                logger.debug("Key mismatch in deep comparison",
                           path=path,
                           keys1=sorted(obj1.keys()),
                           keys2=sorted(obj2.keys()))
                return False
            
            for key in obj1:
                if not self._deep_compare(obj1[key], obj2[key], f"{path}.{key}"):
                    return False
        
        elif isinstance(obj1, list):
            if len(obj1) != len(obj2):
                logger.debug("List length mismatch in deep comparison",
                           path=path,
                           length1=len(obj1),
                           length2=len(obj2))
                return False
            
            for i, (item1, item2) in enumerate(zip(obj1, obj2)):
                if not self._deep_compare(item1, item2, f"{path}[{i}]"):
                    return False
        
        else:
            if obj1 != obj2:
                logger.debug("Value mismatch in deep comparison",
                           path=path,
                           value1=obj1,
                           value2=obj2)
                return False
        
        return True

class SchemaValidator:
    """Validate project data against chimera schema"""
    
    def __init__(self):
        self.schema = self._load_schema()
    
    def _load_schema(self) -> Dict[str, Any]:
        """Load chimera schema from file"""
        try:
            with open('chimera.schema.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error("Failed to load chimera schema", error=str(e))
            return {}
    
    def validate(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate data against schema"""
        errors = []
        
        # Basic validation (in production, use jsonschema library)
        if not isinstance(data, dict):
            errors.append("Root data must be an object")
            return False, errors
        
        required_fields = ['projectName', 'rootDirectory', 'tree']
        for field in required_fields:
            if field not in data:
                errors.append(f"Missing required field: {field}")
        
        if 'tree' in data and not isinstance(data['tree'], dict):
            errors.append("Tree field must be an object")
        
        return len(errors) == 0, errors

class ChimeraForeman:
    """Main foreman orchestrator for AST transformations"""
    
    def __init__(self):
        self.transformation_engine = ASTTransformationEngine()
    
    def execute_command(self, command_str: str) -> bool:
        """Execute a transformation command with full workflow"""
        logger.info("Starting command execution", command=command_str)
        
        try:
            # Parse command
            command = self.transformation_engine.parse_command(command_str)
            
            # Load project data
            self.transformation_engine.load_project_data()
            
            # Generate intended state
            intended_state = self.transformation_engine.generate_intended_state(command)
            
            # Find target component file
            component_path = self._find_component_file(command.target_ast_path)
            if not component_path:
                raise ValueError(f"Component file not found for AST path: {command.target_ast_path}")
            
            # Use atomic file operations
            with FileBackupManager() as backup_manager:
                # Backup target file
                backup_manager.backup_file(component_path)
                
                # Generate code strings
                before_code, after_code = self.transformation_engine.generate_code_from_ast(
                    self.transformation_engine.project_data, command.target_ast_path
                )
                
                # Execute transformation
                self.transformation_engine.execute_file_transformation(
                    component_path, before_code, after_code
                )
                
                # Verify transformation
                verification_success = self.transformation_engine.verify_transformation(
                    component_path, intended_state
                )
                
                if not verification_success:
                    raise Exception("Transformation verification failed")
                
                logger.info("Command executed successfully", 
                           command=command_str,
                           component_path=component_path)
                
                # Call pipeline if verification successful  
                self._call_pipeline()
                
                return True
        
        except Exception as e:
            logger.error("Command execution failed",
                        command=command_str,
                        error=str(e))
            return False
    
    def _find_component_file(self, ast_path: str) -> Optional[str]:
        """Find the file path for a component containing the AST path"""
        # Extract component name from AST path
        path_parts = ast_path.split('/')
        if len(path_parts) > 1 and 'FunctionDeclaration' in path_parts[1]:
            # Extract component name from FunctionDeclaration[name=ComponentName]
            func_part = path_parts[1]
            if '[name=' in func_part and ']' in func_part:
                component_name = func_part.split('[name=')[1].split(']')[0]
                
                # Search for component file
                search_paths = [
                    f"client/src/components/{component_name}.jsx",
                    f"client/src/components/{component_name}.tsx",
                    f"client/src/pages/{component_name}.jsx", 
                    f"client/src/pages/{component_name}.tsx",
                ]
                
                for path in search_paths:
                    if os.path.exists(path):
                        logger.debug("Component file found",
                                   ast_path=ast_path,
                                   component_name=component_name,
                                   file_path=path)
                        return path
        
        logger.error("Component file not found", ast_path=ast_path)
        return None
    
    def _call_pipeline(self) -> None:
        """Call pipeline script for build and deployment"""
        try:
            logger.info("Calling pipeline for build and deployment")
            
            result = subprocess.run([
                sys.executable, 'pipeline.py'
            ], capture_output=True, text=True, check=True)
            
            logger.info("Pipeline executed successfully",
                       stdout=result.stdout)
        
        except subprocess.CalledProcessError as e:
            logger.error("Pipeline execution failed",
                        error=e.stderr,
                        exit_code=e.returncode)
            raise

def main():
    """Main entry point for foreman"""
    parser = argparse.ArgumentParser(description='Chimera Foreman - AST Transformation Engine')
    parser.add_argument('--command', '-c', required=True, help='Transformation command to execute')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    # Configure logging
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        foreman = ChimeraForeman()
        success = foreman.execute_command(args.command)
        
        if success:
            logger.info("Foreman completed successfully")
            return 0
        else:
            logger.error("Foreman failed")
            return 1
    
    except Exception as e:
        logger.error("Foreman execution failed", error=str(e))
        return 1

if __name__ == '__main__':
    sys.exit(main())

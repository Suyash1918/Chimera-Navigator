#!/usr/bin/env python3
"""
Project Chimera - Foreman Module
AST Transformation Engine with atomic transactions and rollback support
"""

import os
import json
import sys
import argparse
import subprocess
import shutil
import tempfile
from pathlib import Path
import logging
from typing import Dict, Any, Tuple, Optional, List
from dataclasses import dataclass

# Setup structured logging
class StructuredLogger:
    """Structured logger for JSON output"""
    
    def __init__(self, logger_name: str = "foreman"):
        self.logger = logging.getLogger(logger_name)
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(message)s')
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    def info(self, message: str, **metadata):
        log_entry = {"level": "INFO", "message": message, **metadata}
        self.logger.info(json.dumps(log_entry))
    
    def error(self, message: str, **metadata):
        log_entry = {"level": "ERROR", "message": message, **metadata}
        self.logger.error(json.dumps(log_entry))
    
    def debug(self, message: str, **metadata):
        log_entry = {"level": "DEBUG", "message": message, **metadata}
        self.logger.debug(json.dumps(log_entry))

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
        self.backup_dir = None
        self.backed_up_files = {}
        
    def __enter__(self):
        self.backup_dir = tempfile.mkdtemp(prefix="chimera_backup_")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            # Error occurred, restore all files
            self.restore_all()
        
        # Clean up backup directory
        if self.backup_dir and os.path.exists(self.backup_dir):
            shutil.rmtree(self.backup_dir)
    
    def backup_file(self, file_path: str) -> str:
        """Create backup of a file"""
        if not os.path.exists(file_path):
            return None
            
        backup_path = os.path.join(self.backup_dir, os.path.basename(file_path))
        shutil.copy2(file_path, backup_path)
        self.backed_up_files[file_path] = backup_path
        return backup_path
    
    def restore_file(self, file_path: str) -> bool:
        """Restore a single file from backup"""
        if file_path in self.backed_up_files:
            backup_path = self.backed_up_files[file_path]
            if os.path.exists(backup_path):
                shutil.copy2(backup_path, file_path)
                return True
        return False
    
    def restore_all(self) -> None:
        """Restore all backed up files"""
        for original_path in self.backed_up_files:
            self.restore_file(original_path)

class ASTTransformationEngine:
    """Core AST transformation engine using code generation"""
    
    def __init__(self):
        self.logger = StructuredLogger("foreman")
        self.project_data = None
        self.component_count = 0
        
    def load_project_data(self, project_data_path: str = "project_data.json") -> None:
        """Load project data from JSON file"""
        try:
            with open(project_data_path, 'r') as f:
                self.project_data = json.load(f)
            
            self.component_count = self._count_components()
            self.logger.info("Project data loaded successfully", 
                           components=self.component_count,
                           project_name=self.project_data.get("projectName", "Unknown"))
        except FileNotFoundError:
            self.logger.error("Project data file not found", path=project_data_path)
            raise
        except json.JSONDecodeError as e:
            self.logger.error("Invalid JSON in project data", error=str(e))
            raise
    
    def _count_components(self) -> int:
        """Count total components in project"""
        def count_recursive(node):
            count = 0
            if isinstance(node, dict):
                if node.get("type") == "Component":
                    count += 1
                if "children" in node:
                    for child in node["children"]:
                        count += count_recursive(child)
            return count
        
        return count_recursive(self.project_data)
    
    def parse_command(self, command_str: str) -> TransformCommand:
        """Parse transformation command string"""
        # Expected format: "target_ast_path.property=new_value"
        try:
            if "=" not in command_str:
                raise ValueError("Command must contain '=' to specify property assignment")
            
            left_side, new_value = command_str.split("=", 1)
            
            if "." not in left_side:
                raise ValueError("Command must specify property with dot notation")
            
            parts = left_side.split(".")
            target_ast_path = ".".join(parts[:-1])
            property_name = parts[-1]
            
            # Try to parse new_value as JSON, fallback to string
            try:
                parsed_value = json.loads(new_value)
            except json.JSONDecodeError:
                parsed_value = new_value.strip('"\'')
            
            command = TransformCommand(
                target_ast_path=target_ast_path,
                property=property_name,
                new_value=parsed_value
            )
            
            self.logger.info("Command parsed successfully", 
                           target=target_ast_path,
                           property=property_name,
                           new_value=str(parsed_value)[:100])
            
            return command
            
        except Exception as e:
            self.logger.error("Failed to parse command", command=command_str, error=str(e))
            raise ValueError(f"Invalid command format: {str(e)}")
    
    def generate_intended_state(self, command: TransformCommand) -> Dict[str, Any]:
        """Generate intended state by applying command to project data"""
        if not self.project_data:
            raise ValueError("Project data not loaded")
        
        # Create deep copy for intended state
        intended_state = json.loads(json.dumps(self.project_data))
        
        # Apply transformation
        success = self._apply_transformation(intended_state, command)
        
        if not success:
            raise ValueError(f"Could not apply transformation to path: {command.target_ast_path}")
        
        self.logger.info("Intended state generated", 
                        target_path=command.target_ast_path,
                        property=command.property)
        
        return intended_state
    
    def _apply_transformation(self, data: Any, command: TransformCommand, current_path: str = "") -> bool:
        """Recursively apply transformation to data structure"""
        if isinstance(data, dict):
            # Check if current path matches target
            if current_path == command.target_ast_path:
                if command.property in data:
                    data[command.property] = command.new_value
                    return True
                else:
                    # Add new property
                    data[command.property] = command.new_value
                    return True
            
            # Recursively check children
            for key, value in data.items():
                new_path = f"{current_path}.{key}" if current_path else key
                if self._apply_transformation(value, command, new_path):
                    return True
                    
                # Check for arrays and nested structures
                if isinstance(value, (list, dict)):
                    if self._apply_transformation(value, command, new_path):
                        return True
        
        elif isinstance(data, list):
            for i, item in enumerate(data):
                new_path = f"{current_path}.{i}" if current_path else str(i)
                if self._apply_transformation(item, command, new_path):
                    return True
        
        return False
    
    def generate_code_from_ast(self, ast_data: Dict[str, Any], target_path: str) -> Tuple[str, str]:
        """Generate before/after code strings from AST data"""
        
        # Find the component containing the target AST path
        component = self._find_component_by_ast_path(ast_data, target_path)
        if not component:
            raise ValueError(f"Component not found for AST path: {target_path}")
        
        command.component_path = component["path"]
        
        # Generate before and after code
        before_code = self._generate_component_code(component, target_path, is_before=True)
        after_code = self._generate_component_code(component, target_path, is_before=False)
        
        return before_code, after_code
    
    def _find_component_by_ast_path(self, data: Any, target_path: str) -> Optional[Dict[str, Any]]:
        """Find component containing the target AST path"""
        def search_recursive(node, path=""):
            if isinstance(node, dict):
                if node.get("type") == "Component":
                    if self._contains_ast_path(node, target_path):
                        return node
                
                if "children" in node:
                    for child in node["children"]:
                        result = search_recursive(child, path)
                        if result:
                            return result
            return None
        
        return search_recursive(data)
    
    def _contains_ast_path(self, data: Any, target_path: str) -> bool:
        """Check if data structure contains the target AST path"""
        def check_recursive(obj, current_path=""):
            if isinstance(obj, dict):
                if current_path == target_path:
                    return True
                for key, value in obj.items():
                    new_path = f"{current_path}.{key}" if current_path else key
                    if check_recursive(value, new_path):
                        return True
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    new_path = f"{current_path}.{i}" if current_path else str(i)
                    if check_recursive(item, new_path):
                        return True
            return False
        
        return check_recursive(data)
    
    def _generate_component_code(self, component_data: Dict[str, Any], target_path: str, is_before: bool = True) -> str:
        """Generate React component code from component data"""
        component_name = component_data.get("name", "UnknownComponent")
        definition = component_data.get("definition", {})
        elements = definition.get("elements", [])
        
        # Generate imports
        imports = component_data.get("imports", [])
        import_lines = []
        for imp in imports:
            if imp.get("specifiers"):
                specs = ", ".join(imp["specifiers"])
                import_lines.append(f"import {{ {specs} }} from '{imp['source']}';")
        
        # Generate component body
        jsx_content = ""
        for element in elements:
            jsx_content += self._generate_element_code(element, target_path, is_before)
        
        # Complete component template
        code = f"""
{chr(10).join(import_lines)}

export function {component_name}() {{
  return (
    {jsx_content}
  );
}}

export default {component_name};
""".strip()
        
        return code
    
    def _generate_element_code(self, element: Dict[str, Any], target_path: str, is_before: bool) -> str:
        """Generate code for a single element"""
        element_type = element.get("type", "div")
        props = element.get("props", {})
        
        # Build props string
        props_str = ""
        for prop_name, prop_value in props.items():
            if prop_name == "children":
                continue  # Handle children separately
            
            if isinstance(prop_value, str):
                props_str += f' {prop_name}="{prop_value}"'
            elif isinstance(prop_value, (bool, int, float)):
                props_str += f' {prop_name}={{{prop_value}}}'
            else:
                props_str += f' {prop_name}={{{json.dumps(prop_value)}}}'
        
        # Handle children
        children = props.get("children", [])
        children_str = ""
        
        if isinstance(children, list):
            for child in children:
                if isinstance(child, dict):
                    if child.get("type") == "text":
                        children_str += child.get("content", "")
                    else:
                        children_str += self._generate_element_code(child, target_path, is_before)
                else:
                    children_str += str(child)
        
        if children_str:
            return f"<{element_type}{props_str}>{children_str}</{element_type}>"
        else:
            return f"<{element_type}{props_str} />"
    
    def execute_file_transformation(self, component_path: str, before_code: str, after_code: str) -> None:
        """Execute file transformation using string replacement"""
        
        if not os.path.exists(component_path):
            raise FileNotFoundError(f"Component file not found: {component_path}")
        
        # Read current file content
        with open(component_path, 'r', encoding='utf-8') as f:
            current_content = f.read()
        
        # Perform string replacement
        if before_code in current_content:
            new_content = current_content.replace(before_code, after_code, 1)
            
            # Write back to file
            with open(component_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            self.logger.info("File transformation executed", 
                           file=component_path,
                           before_length=len(before_code),
                           after_length=len(after_code))
        else:
            raise ValueError(f"Before code not found in {component_path}")
    
    def verify_transformation(self, component_path: str, intended_state: Dict[str, Any]) -> bool:
        """Verify transformation by running surveyor and comparing states"""
        try:
            # Run surveyor on the modified file
            result = subprocess.run([
                sys.executable, "server/surveyor.py", "--verify", component_path
            ], capture_output=True, text=True, check=True)
            
            actual_state = json.loads(result.stdout)
            
            # Deep comparison of intended vs actual state
            is_match = self._deep_compare(intended_state, actual_state)
            
            self.logger.info("Verification completed", 
                           file=component_path,
                           match=is_match)
            
            return is_match
            
        except subprocess.CalledProcessError as e:
            self.logger.error("Surveyor verification failed", 
                            error=e.stderr,
                            return_code=e.returncode)
            return False
        except json.JSONDecodeError as e:
            self.logger.error("Invalid JSON from surveyor", error=str(e))
            return False
    
    def _deep_compare(self, obj1: Any, obj2: Any, path: str = "") -> bool:
        """Deep comparison of two data structures"""
        if type(obj1) != type(obj2):
            self.logger.debug("Type mismatch", path=path, type1=type(obj1).__name__, type2=type(obj2).__name__)
            return False
        
        if isinstance(obj1, dict):
            if set(obj1.keys()) != set(obj2.keys()):
                self.logger.debug("Key mismatch", path=path, keys1=list(obj1.keys()), keys2=list(obj2.keys()))
                return False
            
            for key in obj1:
                if not self._deep_compare(obj1[key], obj2[key], f"{path}.{key}"):
                    return False
        
        elif isinstance(obj1, list):
            if len(obj1) != len(obj2):
                self.logger.debug("Length mismatch", path=path, len1=len(obj1), len2=len(obj2))
                return False
            
            for i, (item1, item2) in enumerate(zip(obj1, obj2)):
                if not self._deep_compare(item1, item2, f"{path}[{i}]"):
                    return False
        
        else:
            if obj1 != obj2:
                self.logger.debug("Value mismatch", path=path, val1=obj1, val2=obj2)
                return False
        
        return True

class SchemaValidator:
    """Validate project data against chimera schema"""
    
    def __init__(self):
        self.logger = StructuredLogger("validator")
    
    def _load_schema(self) -> Dict[str, Any]:
        """Load chimera schema from file"""
        schema_path = "chimera.schema.json"
        try:
            with open(schema_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            self.logger.error("Schema file not found", path=schema_path)
            return {}
    
    def validate(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate data against schema"""
        errors = []
        
        # Basic structure validation
        required_fields = ["projectName", "rootDirectory", "tree"]
        for field in required_fields:
            if field not in data:
                errors.append(f"Missing required field: {field}")
        
        # Tree structure validation
        if "tree" in data:
            tree_errors = self._validate_tree(data["tree"])
            errors.extend(tree_errors)
        
        is_valid = len(errors) == 0
        
        if is_valid:
            self.logger.info("Schema validation passed")
        else:
            self.logger.error("Schema validation failed", errors=errors)
        
        return is_valid, errors
    
    def _validate_tree(self, tree: Dict[str, Any]) -> List[str]:
        """Validate tree structure recursively"""
        errors = []
        
        if not isinstance(tree, dict):
            errors.append("Tree must be an object")
            return errors
        
        required_tree_fields = ["type", "name", "path"]
        for field in required_tree_fields:
            if field not in tree:
                errors.append(f"Tree missing required field: {field}")
        
        if "children" in tree and isinstance(tree["children"], list):
            for i, child in enumerate(tree["children"]):
                child_errors = self._validate_tree(child)
                errors.extend([f"children[{i}].{error}" for error in child_errors])
        
        return errors

class ChimeraForeman:
    """Main foreman orchestrator for AST transformations"""
    
    def __init__(self):
        self.logger = StructuredLogger("foreman")
        self.engine = ASTTransformationEngine()
        self.validator = SchemaValidator()
    
    def execute_command(self, command_str: str) -> bool:
        """Execute a transformation command with full workflow"""
        
        try:
            self.logger.info("Starting transformation", command=command_str)
            
            # Load project data
            self.engine.load_project_data()
            
            # Parse command
            command = self.engine.parse_command(command_str)
            
            # Generate intended state
            intended_state = self.engine.generate_intended_state(command)
            
            # Validate intended state
            is_valid, validation_errors = self.validator.validate(intended_state)
            if not is_valid:
                self.logger.error("Intended state validation failed", errors=validation_errors)
                return False
            
            # Find component file
            component_path = self._find_component_file(command.target_ast_path)
            if not component_path:
                self.logger.error("Component file not found for AST path", path=command.target_ast_path)
                return False
            
            # Use atomic file operations
            with FileBackupManager() as backup_manager:
                backup_manager.backup_file(component_path)
                
                # Generate code transformation
                before_code, after_code = self.engine.generate_code_from_ast(
                    intended_state, command.target_ast_path
                )
                
                # Execute transformation
                self.engine.execute_file_transformation(component_path, before_code, after_code)
                
                # Verify transformation
                if not self.engine.verify_transformation(component_path, intended_state):
                    self.logger.error("Verification failed, rolling back")
                    return False
            
            # Success - call pipeline
            self._call_pipeline()
            
            self.logger.info("Transformation completed successfully")
            return True
            
        except Exception as e:
            self.logger.error("Transformation failed", error=str(e))
            return False
    
    def _find_component_file(self, ast_path: str) -> Optional[str]:
        """Find the file path for a component containing the AST path"""
        
        if not self.engine.project_data:
            return None
        
        def search_tree(node, target_path):
            if isinstance(node, dict):
                if node.get("type") == "Component":
                    if self.engine._contains_ast_path(node, target_path):
                        return node.get("path")
                
                if "children" in node:
                    for child in node["children"]:
                        result = search_tree(child, target_path)
                        if result:
                            return result
            return None
        
        return search_tree(self.engine.project_data, ast_path)
    
    def _call_pipeline(self) -> None:
        """Call pipeline script for build and deployment"""
        try:
            subprocess.run([sys.executable, "server/pipeline.py"], check=True)
            self.logger.info("Pipeline executed successfully")
        except subprocess.CalledProcessError as e:
            self.logger.error("Pipeline execution failed", return_code=e.returncode)

def main():
    """Main entry point for foreman"""
    parser = argparse.ArgumentParser(description='Chimera Foreman - AST Transformation Engine')
    parser.add_argument('--command', '-c', required=True, 
                       help='Transformation command (e.g., "element.props.className=new-class")')
    
    args = parser.parse_args()
    
    foreman = ChimeraForeman()
    success = foreman.execute_command(args.command)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
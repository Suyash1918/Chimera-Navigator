#!/usr/bin/env python3
"""
Project Chimera - Surveyor Module
AST Parser for React/TypeScript components with enhanced features
"""

import os
import json
import sys
import argparse
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
import subprocess

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s", "module": "surveyor"}',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

class ASTPathGenerator:
    """Generate deterministic AST paths for universal element addressing"""
    
    @staticmethod
    def generate_path(node: Dict[str, Any], ancestors: List[Dict[str, Any]] = None) -> str:
        """Generate a unique AST path for the given node"""
        if ancestors is None:
            ancestors = []
        
        path_parts = []
        node_chain = ancestors + [node]
        
        for i, n in enumerate(node_chain):
            node_type = n.get('type', 'Unknown')
            selector = node_type
            
            # Add identifying attributes based on node type
            if node_type == 'FunctionDeclaration' and n.get('id', {}).get('name'):
                selector += f"[name={n['id']['name']}]"
            elif node_type == 'JSXElement' and n.get('openingElement', {}).get('name', {}).get('name'):
                element_name = n['openingElement']['name']['name']
                selector += f"[openingElement.name={element_name}]"
            elif node_type == 'VariableDeclarator' and n.get('id', {}).get('type'):
                selector += f"[id.type={n['id']['type']}]"
            elif node_type == 'CallExpression' and n.get('callee', {}).get('name'):
                callee_name = n['callee']['name']
                if callee_name.startswith('use'):  # React hook
                    selector += f"[callee.name={callee_name}]"
            
            # Add index for disambiguation if needed
            if i > 0:
                parent = node_chain[i-1]
                siblings = ASTPathGenerator._get_siblings(parent, node_type)
                if len(siblings) > 1:
                    try:
                        index = siblings.index(n)
                        selector += f"[{index}]"
                    except ValueError:
                        # Fallback to position-based indexing
                        selector += f"[{i}]"
            
            path_parts.append(selector)
        
        return '/' + '/'.join(path_parts)
    
    @staticmethod
    def _get_siblings(parent: Dict[str, Any], node_type: str) -> List[Dict[str, Any]]:
        """Get all siblings of the same type from parent node"""
        siblings = []
        
        # Common properties that contain child nodes
        child_props = ['body', 'declarations', 'elements', 'children', 'consequent', 'alternate']
        
        for prop in child_props:
            if prop in parent and isinstance(parent[prop], list):
                siblings.extend([child for child in parent[prop] if child.get('type') == node_type])
        
        return siblings

class ReactHookDetector:
    """Detect and analyze React hooks in components"""
    
    HOOK_PATTERNS = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext']
    
    @classmethod
    def detect_hooks(cls, ast_node: Dict[str, Any], ancestors: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Detect all React hooks in the AST"""
        if ancestors is None:
            ancestors = []
        
        hooks = []
        
        # Check if current node is a hook call
        if cls._is_hook_call(ast_node):
            hook_data = cls._parse_hook_call(ast_node, ancestors)
            if hook_data:
                hooks.append(hook_data)
        
        # Recursively check children
        children = cls._get_child_nodes(ast_node)
        for child in children:
            hooks.extend(cls.detect_hooks(child, ancestors + [ast_node]))
        
        return hooks
    
    @classmethod
    def _is_hook_call(cls, node: Dict[str, Any]) -> bool:
        """Check if node represents a React hook call"""
        return (
            node.get('type') == 'CallExpression' and
            node.get('callee', {}).get('name', '').startswith('use') and
            any(node.get('callee', {}).get('name', '').startswith(pattern) 
                for pattern in cls.HOOK_PATTERNS)
        )
    
    @classmethod
    def _parse_hook_call(cls, node: Dict[str, Any], ancestors: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Parse a hook call and extract relevant information"""
        hook_name = node.get('callee', {}).get('name')
        if not hook_name:
            return None
        
        ast_path = ASTPathGenerator.generate_path(node, ancestors)
        source_location = {
            'startLine': node.get('loc', {}).get('start', {}).get('line', 0),
            'endLine': node.get('loc', {}).get('end', {}).get('line', 0)
        }
        
        hook_data = {
            'type': hook_name,
            'astPath': ast_path,
            'sourceLocation': source_location
        }
        
        # Parse useState specifics
        if hook_name == 'useState':
            parent = ancestors[-1] if ancestors else {}
            if (parent.get('type') == 'VariableDeclarator' and 
                parent.get('id', {}).get('type') == 'ArrayPattern'):
                elements = parent.get('id', {}).get('elements', [])
                if len(elements) >= 2:
                    hook_data['state'] = elements[0].get('name', '')
                    hook_data['setter'] = elements[1].get('name', '')
                
                # Extract initial value
                if node.get('arguments') and len(node['arguments']) > 0:
                    initial_arg = node['arguments'][0]
                    hook_data['initialValue'] = cls._extract_literal_value(initial_arg)
        
        # Parse useEffect dependencies
        elif hook_name == 'useEffect':
            if node.get('arguments') and len(node['arguments']) > 1:
                deps_arg = node['arguments'][1]
                if deps_arg.get('type') == 'ArrayExpression':
                    dependencies = []
                    for element in deps_arg.get('elements', []):
                        if element.get('type') == 'Identifier':
                            dependencies.append(element.get('name', ''))
                    hook_data['dependencies'] = dependencies
        
        return hook_data
    
    @classmethod
    def _extract_literal_value(cls, node: Dict[str, Any]) -> Any:
        """Extract literal value from AST node"""
        if node.get('type') == 'Literal':
            return node.get('value')
        elif node.get('type') == 'BooleanLiteral':
            return node.get('value')
        elif node.get('type') == 'NumericLiteral':
            return node.get('value')
        elif node.get('type') == 'StringLiteral':
            return node.get('value')
        return None
    
    @classmethod
    def _get_child_nodes(cls, node: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get all child nodes from a parent"""
        children = []
        
        # Common properties that contain child nodes
        child_props = ['body', 'declarations', 'elements', 'children', 'consequent', 
                      'alternate', 'arguments', 'params', 'init', 'test', 'update']
        
        for prop in child_props:
            if prop in node:
                if isinstance(node[prop], list):
                    children.extend(node[prop])
                elif isinstance(node[prop], dict):
                    children.append(node[prop])
        
        return children

class ImportAnalyzer:
    """Analyze import statements and build dependency mapping"""
    
    @classmethod
    def analyze_imports(cls, ast_node: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Analyze all import statements in the AST"""
        imports = []
        
        # Find all import declarations
        cls._find_imports(ast_node, imports)
        
        return imports
    
    @classmethod
    def _find_imports(cls, node: Dict[str, Any], imports: List[Dict[str, Any]]) -> None:
        """Recursively find import declarations"""
        if node.get('type') == 'ImportDeclaration':
            import_data = cls._parse_import_declaration(node)
            if import_data:
                imports.append(import_data)
        
        # Check children
        children = ReactHookDetector._get_child_nodes(node)
        for child in children:
            cls._find_imports(child, imports)
    
    @classmethod
    def _parse_import_declaration(cls, node: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse an import declaration node"""
        source = node.get('source', {}).get('value')
        if not source:
            return None
        
        specifiers = []
        is_default = False
        
        for spec in node.get('specifiers', []):
            spec_type = spec.get('type')
            if spec_type == 'ImportDefaultSpecifier':
                specifiers.append(spec.get('local', {}).get('name', ''))
                is_default = True
            elif spec_type == 'ImportSpecifier':
                imported_name = spec.get('imported', {}).get('name', '')
                specifiers.append(imported_name)
            elif spec_type == 'ImportNamespaceSpecifier':
                local_name = spec.get('local', {}).get('name', '')
                specifiers.append(f"* as {local_name}")
        
        return {
            'source': source,
            'specifiers': specifiers,
            'isDefault': is_default,
            'isExternal': not (source.startswith('./') or source.startswith('../'))
        }

class ChimeraSurveyor:
    """Main surveyor class for parsing React/TypeScript components"""
    
    def __init__(self):
        self.project_data = {
            'projectName': 'ParsedProject',
            'rootDirectory': 'client',
            'tree': {
                'type': 'directory',
                'name': 'src',
                'path': 'client/src',
                'children': []
            }
        }
    
    def parse_project(self, root_path: str = None, single_file: str = None) -> Dict[str, Any]:
        """Parse entire project or single file"""
        try:
            if single_file:
                logger.info(f"Parsing single file: {single_file}")
                self._parse_file(single_file)
            else:
                root_path = root_path or os.path.join(os.getcwd(), 'client', 'src')
                logger.info(f"Starting project parsing from: {root_path}")
                self._scan_directory(root_path)
            
            logger.info("AST parsing completed successfully")
            return self.project_data
            
        except Exception as e:
            logger.error(f"Parsing failed: {str(e)}")
            raise
    
    def _scan_directory(self, directory: str) -> None:
        """Recursively scan directory for React files"""
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith(('.jsx', '.tsx')):
                    file_path = os.path.join(root, file)
                    try:
                        self._parse_file(file_path)
                    except Exception as e:
                        logger.error(f"Failed to parse {file_path}: {str(e)}")
    
    def _parse_file(self, file_path: str) -> None:
        """Parse a single React/TypeScript file"""
        logger.info(f"Parsing file: {file_path}")
        
        try:
            # Read file content
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Generate mock AST for demonstration
            # In a real implementation, this would use @babel/parser via a Node.js subprocess
            ast = self._generate_mock_ast(file_path, content)
            
            # Parse component information
            component_data = self._parse_component(ast, file_path)
            
            if component_data:
                # Add to project tree
                self._add_to_tree(component_data)
                
                logger.info(f"Successfully parsed component: {component_data['name']}")
        
        except Exception as e:
            logger.error(f"Error parsing file {file_path}: {str(e)}")
            raise
    
    def _generate_mock_ast(self, file_path: str, content: str) -> Dict[str, Any]:
        """Generate a mock AST structure for demonstration"""
        # This is a simplified mock - in production, use actual Babel parser
        component_name = Path(file_path).stem
        
        return {
            'type': 'Program',
            'body': [
                {
                    'type': 'FunctionDeclaration',
                    'id': {'name': component_name, 'type': 'Identifier'},
                    'loc': {'start': {'line': 1}, 'end': {'line': 50}},
                    'body': {
                        'type': 'BlockStatement',
                        'body': [
                            {
                                'type': 'ReturnStatement',
                                'argument': {
                                    'type': 'JSXElement',
                                    'openingElement': {
                                        'name': {'name': 'div', 'type': 'JSXIdentifier'},
                                        'attributes': []
                                    },
                                    'children': []
                                }
                            }
                        ]
                    }
                }
            ]
        }
    
    def _parse_component(self, ast: Dict[str, Any], file_path: str) -> Optional[Dict[str, Any]]:
        """Parse component data from AST"""
        component_name = Path(file_path).stem
        relative_path = os.path.relpath(file_path, os.getcwd())
        
        # Detect hooks
        hooks = ReactHookDetector.detect_hooks(ast)
        
        # Analyze imports
        imports = ImportAnalyzer.analyze_imports(ast)
        
        # Parse JSX elements
        elements = self._parse_jsx_elements(ast)
        
        return {
            'type': 'Component',
            'name': component_name,
            'fileName': Path(file_path).name,
            'path': relative_path,
            'imports': imports,
            'hooks': hooks,
            'definition': {
                'rootElementType': 'div',  # Simplified
                'elements': elements
            }
        }
    
    def _parse_jsx_elements(self, ast_node: Dict[str, Any], ancestors: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Parse JSX elements from AST"""
        if ancestors is None:
            ancestors = []
        
        elements = []
        
        if ast_node.get('type') == 'JSXElement':
            element_data = {
                'astPath': ASTPathGenerator.generate_path(ast_node, ancestors),
                'type': ast_node.get('openingElement', {}).get('name', {}).get('name', 'unknown'),
                'sourceLocation': {
                    'startLine': ast_node.get('loc', {}).get('start', {}).get('line', 0),
                    'endLine': ast_node.get('loc', {}).get('end', {}).get('line', 0)
                },
                'props': self._parse_jsx_attributes(ast_node.get('openingElement', {}).get('attributes', [])),
                'children': []
            }
            
            # Parse children recursively
            for child in ast_node.get('children', []):
                child_elements = self._parse_jsx_elements(child, ancestors + [ast_node])
                element_data['children'].extend(child_elements)
            
            elements.append(element_data)
        
        # Check other node types for JSX elements
        children = ReactHookDetector._get_child_nodes(ast_node)
        for child in children:
            elements.extend(self._parse_jsx_elements(child, ancestors + [ast_node]))
        
        return elements
    
    def _parse_jsx_attributes(self, attributes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parse JSX attributes into props"""
        props = {}
        
        for attr in attributes:
            if attr.get('type') == 'JSXAttribute':
                name = attr.get('name', {}).get('name', '')
                value = attr.get('value')
                
                if value:
                    if value.get('type') == 'Literal':
                        props[name] = value.get('value')
                    elif value.get('type') == 'JSXExpressionContainer':
                        # Simplified expression handling
                        props[name] = '<expression>'
                    else:
                        props[name] = '<complex>'
        
        return props
    
    def _add_to_tree(self, component_data: Dict[str, Any]) -> None:
        """Add component to project tree structure"""
        self.project_data['tree']['children'].append(component_data)
    
    def save_project_data(self, output_path: str = 'project_data.json') -> None:
        """Save project data to JSON file"""
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(self.project_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Project data saved to: {output_path}")
            
        except Exception as e:
            logger.error(f"Failed to save project data: {str(e)}")
            raise

def main():
    """Main entry point for the surveyor"""
    parser = argparse.ArgumentParser(description='Chimera Surveyor - React/TypeScript AST Parser')
    parser.add_argument('path', nargs='?', help='File or directory path to parse')
    parser.add_argument('--output', '-o', default='project_data.json', help='Output JSON file path')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    # Configure logging
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        surveyor = ChimeraSurveyor()
        
        # Determine if parsing single file or entire project
        if args.path and os.path.isfile(args.path):
            project_data = surveyor.parse_project(single_file=args.path)
        else:
            project_data = surveyor.parse_project(root_path=args.path)
        
        # Save results
        surveyor.save_project_data(args.output)
        
        # Output for verification if called from foreman
        if len(sys.argv) > 1 and sys.argv[1] == '--verify':
            print(json.dumps(project_data, indent=2))
        
        logger.info("Surveyor completed successfully")
        return 0
        
    except Exception as e:
        logger.error(f"Surveyor failed: {str(e)}")
        return 1

if __name__ == '__main__':
    sys.exit(main())

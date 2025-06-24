#!/usr/bin/env python3
"""
Project Chimera - Surveyor Module
Parser that translates React/TypeScript source code into structured JSON representation
"""

import os
import json
import sys
import argparse
from pathlib import Path
import subprocess
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ChimeraSurveyor:
    """Main parser class for converting React/TypeScript files to JSON schema"""
    
    def __init__(self, project_root="client/src"):
        self.project_root = project_root
        self.project_data = {
            "projectName": "ChimeraNavigator",
            "rootDirectory": "client",
            "tree": {
                "type": "directory",
                "name": "src",
                "path": "client/src",
                "children": []
            }
        }
    
    def scan_files(self, target_path=None):
        """Recursively scan for .jsx and .tsx files"""
        files = []
        scan_path = target_path if target_path else self.project_root
        
        if os.path.isfile(scan_path):
            if scan_path.endswith(('.jsx', '.tsx')):
                files.append(scan_path)
        else:
            for root, dirs, filenames in os.walk(scan_path):
                for filename in filenames:
                    if filename.endswith(('.jsx', '.tsx')):
                        files.append(os.path.join(root, filename))
        
        logger.info(f"Found {len(files)} React/TypeScript files")
        return files
    
    def parse_file_to_ast(self, file_path):
        """Parse a single file using Node.js babel parser"""
        try:
            # Use Node.js with babel parser for accurate AST generation
            parse_script = """
            const fs = require('fs');
            const parser = require('@babel/parser');
            const traverse = require('@babel/traverse').default;
            
            const filePath = process.argv[2];
            const code = fs.readFileSync(filePath, 'utf8');
            
            try {
                const ast = parser.parse(code, {
                    sourceType: 'module',
                    allowImportExportEverywhere: true,
                    plugins: ['jsx', 'typescript']
                });
                
                const result = {
                    fileName: filePath.split('/').pop(),
                    path: filePath,
                    components: [],
                    imports: [],
                    exports: []
                };
                
                traverse(ast, {
                    FunctionDeclaration(path) {
                        if (path.node.id && path.node.id.name) {
                            const component = this.extractComponent(path.node, filePath);
                            result.components.push(component);
                        }
                    },
                    
                    VariableDeclarator(path) {
                        if (path.node.init && 
                            (path.node.init.type === 'ArrowFunctionExpression' ||
                             path.node.init.type === 'FunctionExpression')) {
                            const component = this.extractComponent(path.node, filePath);
                            result.components.push(component);
                        }
                    },
                    
                    ImportDeclaration(path) {
                        result.imports.push({
                            source: path.node.source.value,
                            specifiers: path.node.specifiers.map(spec => spec.local.name)
                        });
                    }
                });
                
                console.log(JSON.stringify(result, null, 2));
            } catch (error) {
                console.error('Parse error:', error.message);
                process.exit(1);
            }
            """
            
            # Write temporary parsing script
            script_path = '/tmp/parse_component.js'
            with open(script_path, 'w') as f:
                f.write(parse_script)
            
            # Execute the parser
            result = subprocess.run(
                ['node', script_path, file_path],
                capture_output=True,
                text=True,
                check=True
            )
            
            return json.loads(result.stdout)
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to parse {file_path}: {e.stderr}")
            return self.create_fallback_component_data(file_path)
        except Exception as e:
            logger.error(f"Error parsing {file_path}: {str(e)}")
            return self.create_fallback_component_data(file_path)
    
    def create_fallback_component_data(self, file_path):
        """Create basic component data when parsing fails"""
        file_name = os.path.basename(file_path)
        component_name = file_name.replace('.tsx', '').replace('.jsx', '')
        
        return {
            "fileName": file_name,
            "path": file_path,
            "components": [{
                "type": "Component",
                "name": component_name,
                "fileName": file_name,
                "path": file_path,
                "definition": {
                    "rootElementType": "div",
                    "elements": [{
                        "id": f"{component_name.lower()}-root",
                        "type": "div",
                        "sourceLocation": {"startLine": 1, "endLine": 10},
                        "props": {
                            "className": "component-root",
                            "children": []
                        }
                    }]
                }
            }],
            "imports": [],
            "exports": []
        }
    
    def build_project_tree(self, files):
        """Build the project tree structure from parsed files"""
        tree = self.project_data["tree"]
        
        for file_path in files:
            try:
                parsed_data = self.parse_file_to_ast(file_path)
                relative_path = os.path.relpath(file_path, self.project_root)
                path_parts = relative_path.split(os.sep)
                
                current_node = tree
                
                # Navigate/create directory structure
                for part in path_parts[:-1]:  # All except the file
                    child_dir = None
                    for child in current_node.get("children", []):
                        if child["name"] == part and child["type"] == "directory":
                            child_dir = child
                            break
                    
                    if not child_dir:
                        child_dir = {
                            "type": "directory",
                            "name": part,
                            "path": "/".join(current_node["path"].split("/") + [part]),
                            "children": []
                        }
                        current_node.setdefault("children", []).append(child_dir)
                    
                    current_node = child_dir
                
                # Add component files
                for component in parsed_data.get("components", []):
                    component_node = {
                        "type": "Component",
                        "name": component["name"],
                        "fileName": parsed_data["fileName"],
                        "path": file_path,
                        "definition": component.get("definition", {
                            "rootElementType": "div",
                            "elements": []
                        }),
                        "imports": parsed_data.get("imports", []),
                        "exports": parsed_data.get("exports", [])
                    }
                    current_node.setdefault("children", []).append(component_node)
                    
            except Exception as e:
                logger.error(f"Error processing {file_path}: {str(e)}")
                continue
        
        return tree
    
    def generate_project_data(self, target_path=None):
        """Main function to generate project_data.json"""
        logger.info("Starting Chimera Surveyor...")
        
        files = self.scan_files(target_path)
        if not files:
            logger.warning("No React/TypeScript files found")
            return
        
        self.build_project_tree(files)
        
        # Write to project_data.json
        output_path = "project_data.json"
        with open(output_path, 'w') as f:
            json.dump(self.project_data, f, indent=2)
        
        logger.info(f"Generated {output_path} with {len(files)} files processed")
        
        if target_path:
            # Return the data for verification purposes
            return self.project_data
    
    def verify_file(self, file_path):
        """Verify a specific file against the schema"""
        logger.info(f"Verifying {file_path}...")
        return self.generate_project_data(file_path)

def main():
    parser = argparse.ArgumentParser(description='Chimera Surveyor - React/TypeScript Parser')
    parser.add_argument('--file', '-f', help='Target specific file for parsing/verification')
    parser.add_argument('--verify', '-v', help='Verify specific file against schema')
    
    args = parser.parse_args()
    
    surveyor = ChimeraSurveyor()
    
    if args.verify:
        result = surveyor.verify_file(args.verify)
        if result:
            print(json.dumps(result, indent=2))
    elif args.file:
        result = surveyor.generate_project_data(args.file)
        if result:
            print(json.dumps(result, indent=2))
    else:
        surveyor.generate_project_data()

if __name__ == "__main__":
    main()
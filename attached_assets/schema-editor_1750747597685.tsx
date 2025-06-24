import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Save, CheckSquare } from "lucide-react";

const mockSchema = `{
  "projectName": "LuxeCraft",
  "rootDirectory": "client",
  "tree": {
    "type": "directory",
    "name": "src",
    "path": "client/src",
    "children": [
      {
        "type": "Component",
        "name": "HeroSection",
        "fileName": "HeroSection.jsx",
        "path": "client/src/components/HeroSection.jsx",
        "imports": [
          {
            "source": "react",
            "specifiers": ["useState", "useEffect"]
          }
        ],
        "hooks": [
          {
            "type": "useState",
            "astPath": "/VariableDeclarator[id.type=ArrayPattern]",
            "sourceLocation": {
              "startLine": 15,
              "endLine": 18
            }
          }
        ],
        "definition": {
          "rootElementType": "section",
          "elements": [
            {
              "astPath": "/FunctionDeclaration/JSXElement[0]/JSXElement[0]",
              "type": "Heading",
              "sourceLocation": {
                "startLine": 41,
                "endLine": 47
              },
              "props": {
                "level": "h1",
                "className": "text-6xl font-bold text-gray-900",
                "children": [
                  {
                    "astPath": "/JSXText[0]",
                    "type": "text",
                    "content": "Timeless"
                  },
                  {
                    "astPath": "/JSXElement[openingElement.name=span]",
                    "type": "span",
                    "content": "Elegance"
                  }
                ]
              }
            }
          ]
        }
      }
    ]
  }
}`;

export function SchemaEditor() {
  const [schema, setSchema] = useState(mockSchema);
  const [isValid, setIsValid] = useState(true);

  const validateSchema = () => {
    try {
      JSON.parse(schema);
      setIsValid(true);
    } catch {
      setIsValid(false);
    }
  };

  const saveSchema = () => {
    if (isValid) {
      // Save schema logic
      console.log('Schema saved');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Enhanced Schema Editor</h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={validateSchema}>
            <CheckSquare className="mr-1" size={12} />
            Validate
          </Button>
          <Button size="sm" onClick={saveSchema} disabled={!isValid}>
            <Save className="mr-1" size={12} />
            Save Schema
          </Button>
        </div>
      </div>

      {/* JSON Schema Editor */}
      <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto mb-4">
        <textarea
          value={schema}
          onChange={(e) => setSchema(e.target.value)}
          className="w-full h-64 bg-transparent text-gray-100 resize-none outline-none"
          spellCheck={false}
        />
      </div>

      {/* Schema Validation Results */}
      <div className={`border rounded-lg p-4 ${isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <h4 className={`text-sm font-medium mb-2 flex items-center ${isValid ? 'text-green-900' : 'text-red-900'}`}>
          <CheckCircle className="mr-2" size={16} />
          Schema Validation Results
        </h4>
        <div className={`text-sm ${isValid ? 'text-green-800' : 'text-red-800'}`}>
          {isValid ? (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-600" size={12} />
                <span>AST Path syntax is valid</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-600" size={12} />
                <span>Hook structure validation passed</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-600" size={12} />
                <span>Import mapping is complete</span>
              </div>
            </div>
          ) : (
            <div>Schema contains syntax errors. Please check the JSON format.</div>
          )}
        </div>
      </div>
    </div>
  );
}

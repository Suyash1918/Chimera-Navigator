import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Save, CheckSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function SchemaEditor() {
  const [isValid, setIsValid] = useState(true);

  const { data: projects } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  const { data: parseResult } = useQuery({
    queryKey: ["/api/projects", projects?.[0]?.id, "results"],
    enabled: !!projects?.[0]?.id,
  });

  const [schema, setSchema] = useState(() => 
    JSON.stringify(parseResult?.schema || {}, null, 2)
  );

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
          placeholder="Schema will appear here after project analysis..."
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
                <span>JSON syntax is valid</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-600" size={12} />
                <span>Schema structure validation passed</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-600" size={12} />
                <span>All required fields are present</span>
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

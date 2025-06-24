import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Box, Folder, Network } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ImportDependency } from "@shared/schema";

export function DependenciesView() {
  const { data: projects } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  const { data: parseResult } = useQuery({
    queryKey: ["/api/projects", projects?.[0]?.id, "results"],
    enabled: !!projects?.[0]?.id,
  });

  const imports: ImportDependency[] = parseResult?.imports || [];
  const externalImports = imports.filter(imp => imp.isExternal);
  const internalImports = imports.filter(imp => !imp.isExternal);
  const totalImports = imports.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Import Dependencies</h3>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-cyan-100 text-cyan-800">
            {totalImports} imports
          </Badge>
          <Button variant="outline" size="sm">
            <Network className="mr-1" size={12} />
            Visualize Graph
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* External Dependencies */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Box className="text-blue-600 mr-2" size={16} />
            External Libraries
          </h4>
          <div className="space-y-2">
            {externalImports.length > 0 ? (
              externalImports.map((imp, index) => (
                <div key={index} className="bg-white rounded border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm font-medium text-gray-900">{imp.source}</span>
                    <span className="text-xs text-gray-500">{imp.usageCount} uses</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {imp.specifiers.map((spec, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-blue-100 text-blue-800">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                <Box size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No external dependencies</p>
              </div>
            )}
          </div>
        </div>

        {/* Internal Dependencies */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Folder className="text-orange-500 mr-2" size={16} />
            Internal Components
          </h4>
          <div className="space-y-2">
            {internalImports.length > 0 ? (
              internalImports.map((imp, index) => (
                <div key={index} className="bg-white rounded border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm font-medium text-gray-900">{imp.source}</span>
                    <span className="text-xs text-gray-500">{imp.usageCount} uses</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {imp.specifiers.map((spec, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-green-100 text-green-800">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                <Folder size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No internal imports</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dependency Graph Visualization */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <Network className="text-cyan-500 mr-2" size={16} />
          Dependency Graph
        </h4>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="text-gray-500 mb-4">
            <Network size={48} className="mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">Interactive dependency graph visualization</p>
          <Button className="bg-cyan-500 hover:bg-cyan-600">
            Generate Graph
          </Button>
        </div>
      </div>
    </div>
  );
}

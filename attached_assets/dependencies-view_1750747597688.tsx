import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Box, Folder, Network } from "lucide-react";
import type { ImportDependency } from "@shared/schema";

const mockExternalImports: ImportDependency[] = [
  {
    source: 'react',
    specifiers: ['useState', 'useEffect', 'useCallback'],
    isExternal: true,
    usageCount: 3
  },
  {
    source: 'framer-motion',  
    specifiers: ['motion', 'AnimatePresence'],
    isExternal: true,
    usageCount: 2
  }
];

const mockInternalImports: ImportDependency[] = [
  {
    source: './components/Button',
    specifiers: ['Button'],
    isExternal: false,
    usageCount: 5
  },
  {
    source: '../hooks/useAnimation',
    specifiers: ['useAnimation'],
    isExternal: false,
    usageCount: 1
  }
];

export function DependenciesView() {
  const totalImports = mockExternalImports.length + mockInternalImports.length;

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
            {mockExternalImports.map((imp, index) => (
              <div key={index} className="bg-white rounded border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm font-medium text-gray-900">{imp.source}</span>
                  <span className="text-xs text-gray-500">{imp.usageCount} components</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {imp.specifiers.map((spec, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-blue-100 text-blue-800">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Internal Dependencies */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Folder className="text-orange-500 mr-2" size={16} />
            Internal Components
          </h4>
          <div className="space-y-2">
            {mockInternalImports.map((imp, index) => (
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
            ))}
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

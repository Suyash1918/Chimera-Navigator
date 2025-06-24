import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, FileCode, Tag, Heading, Type, Copy, ExpandIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface ASTNode {
  name: string;
  type: string;
  astPath: string;
  children?: ASTNode[];
  props?: Record<string, any>;
  elements?: ASTNode[];
  definition?: {
    elements: ASTNode[];
  };
}

export function ASTViewer() {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState("");

  // Fetch project data from the first available project
  const { data: projects } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  const { data: parseResult } = useQuery({
    queryKey: ["/api/projects", projects?.[0]?.id, "results"],
    enabled: !!projects?.[0]?.id,
  });

  const astData = parseResult?.astData?.tree?.children || [];
  const processedData = astData?.children || astData || [];

  const toggleNode = (astPath: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(astPath)) {
      newExpanded.delete(astPath);
    } else {
      newExpanded.add(astPath);
    }
    setExpandedNodes(newExpanded);
  };

  const selectNode = (astPath: string) => {
    setSelectedPath(astPath);
  };

  const expandAll = () => {
    const allPaths = new Set<string>();
    const collectPaths = (nodes: ASTNode[]) => {
      nodes.forEach(node => {
        if (node.astPath) allPaths.add(node.astPath);
        if (node.children) {
          collectPaths(node.children);
        }
        if (node.definition?.elements) {
          collectPaths(node.definition.elements);
        }
      });
    };
    collectPaths(astData);
    setExpandedNodes(allPaths);
  };

  const copyPath = () => {
    navigator.clipboard.writeText(selectedPath);
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'Component':
        return <FileCode className="text-blue-600" size={16} />;
      case 'JSXElement':
        return <Tag className="text-cyan-500" size={16} />;
      case 'JSXText':
        return <Type className="text-gray-400" size={16} />;
      default:
        return <Tag className="text-gray-400" size={16} />;
    }
  };

  const renderNode = (node: any, depth = 0) => {
    if (!node || !node.astPath) return null;
    
    const isExpanded = expandedNodes.has(node.astPath);
    const hasChildren = (node.children && node.children.length > 0) || 
                       (node.definition?.elements && node.definition.elements.length > 0);

    return (
      <div key={node.astPath || `node-${depth}`} className="space-y-1">
        <div 
          className={cn(
            "ast-node bg-white rounded-md p-3 border border-gray-200 hover:bg-blue-50 hover:translate-x-1 transition-all duration-200 cursor-pointer",
            selectedPath === node.astPath && "border-blue-500 bg-blue-50"
          )}
          style={{ marginLeft: `${depth * 24}px` }}
          onClick={() => selectNode(node.astPath)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {hasChildren && (
                <button onClick={(e) => { e.stopPropagation(); toggleNode(node.astPath); }}>
                  {isExpanded ? 
                    <ChevronDown className="text-gray-400" size={12} /> : 
                    <ChevronRight className="text-gray-400" size={12} />
                  }
                </button>
              )}
              {!hasChildren && <div className="w-3" />}
              {getNodeIcon(node.type)}
              <span className="font-mono text-sm font-medium text-gray-900">{node.name}</span>
              {node.props && Object.keys(node.props).length > 0 && (
                <span className="text-gray-500 text-xs">
                  {Object.entries(node.props).map(([key, value]) => (
                    <span key={key} className="ml-2">
                      {key}={typeof value === 'string' ? `"${value}"` : String(value)}
                    </span>
                  ))}
                </span>
              )}
            </div>
            <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-mono">
              {node.astPath?.split('/').pop() || 'unknown'}
            </code>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="space-y-1">
            {node.children?.map((child: any, index: number) => renderNode(child, depth + 1))}
            {node.definition?.elements?.map((element: any, index: number) => renderNode(element, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">AST Structure & Paths</h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <ExpandIcon className="mr-1" size={12} />
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={copyPath}>
            <Copy className="mr-1" size={12} />
            Copy Paths
          </Button>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
        <div className="space-y-2">
          {processedData && processedData.length > 0 ? (
            processedData.map((node: any, index: number) => renderNode(node, 0))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <FileCode size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No components uploaded yet</p>
              <p className="text-sm">Upload React/TypeScript files to see their AST structure</p>
            </div>
          )}
        </div>
      </div>

      {/* AST Path Generator */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
          <Type className="mr-2" size={16} />
          AST Path Generator
        </h4>
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Click on any element above to generate its AST path..."
            className="flex-1 text-sm border-blue-300 bg-white focus:ring-2 focus:ring-blue-600"
            value={selectedPath}
            readOnly
          />
          <Button size="sm" onClick={copyPath}>
            <Copy size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Code, 
  Zap, 
  Package, 
  FileText, 
  Activity,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle
} from 'lucide-react';
import type { Project, Log } from '@shared/schema';

interface ProjectAnalysisProps {
  project: Project;
}

export function ProjectAnalysis({ project }: ProjectAnalysisProps) {
  // Get analysis results
  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: [`/api/projects/${project.id}/results`],
  });

  // Get project logs
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: [`/api/projects/${project.id}/logs`],
  });

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'WARN':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Code className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Components</p>
              <p className="text-2xl font-bold">
                {analysis?.astData ? Object.keys(analysis.astData).length : 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Zap className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Hooks</p>
              <p className="text-2xl font-bold">
                {Array.isArray(analysis?.hooks) ? analysis.hooks.length : 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Imports</p>
              <p className="text-2xl font-bold">
                {Array.isArray(analysis?.imports) ? analysis.imports.length : 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={`text-xs ${
                project.status === 'completed' ? 'bg-green-100 text-green-800' :
                project.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                project.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hooks">Hooks</TabsTrigger>
          <TabsTrigger value="imports">Imports</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {analysisLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              ) : analysis?.astData ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Components Analysis</h3>
                    <div className="space-y-2">
                      {Object.entries(analysis.astData).map(([filename, data]: [string, any]) => (
                        <div key={filename} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">{filename}</h4>
                            <Badge variant="outline" className="text-xs">
                              {data.hooks?.length || 0} hooks
                            </Badge>
                          </div>
                          {data.summary && (
                            <p className="text-sm text-muted-foreground">
                              {data.summary}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No analysis data available</p>
                  <p className="text-sm mt-1">Upload files to see analysis results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hooks">
          <Card>
            <CardHeader>
              <CardTitle>React Hooks Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {analysisLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : Array.isArray(analysis?.hooks) && analysis.hooks.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {analysis.hooks.map((hook: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{hook.type || 'Unknown'}</Badge>
                          {hook.astPath && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {hook.astPath}
                            </span>
                          )}
                        </div>
                        {hook.state && (
                          <p className="text-sm">
                            <span className="font-medium">State:</span> {hook.state}
                          </p>
                        )}
                        {hook.dependencies && (
                          <p className="text-sm">
                            <span className="font-medium">Dependencies:</span> {hook.dependencies.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hooks detected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imports">
          <Card>
            <CardHeader>
              <CardTitle>Import Dependencies</CardTitle>
            </CardHeader>
            <CardContent>
              {analysisLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : Array.isArray(analysis?.imports) && analysis.imports.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {analysis.imports.map((imp: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{imp.source}</span>
                          <div className="flex gap-2">
                            {imp.isExternal && (
                              <Badge variant="secondary" className="text-xs">External</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {imp.usageCount || 1} usage{(imp.usageCount || 1) !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </div>
                        {imp.specifiers && imp.specifiers.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {imp.specifiers.map((spec: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No imports detected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Processing Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : logs.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {logs.map((log: Log) => (
                      <div key={log.id} className="p-3 border rounded-lg">
                        <div className="flex items-start gap-3">
                          {getLogIcon(log.level)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{log.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimestamp(log.timestamp)}
                            </p>
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                <pre className="whitespace-pre-wrap">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No logs available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/file-upload";
import { ASTViewer } from "@/components/ast-viewer";
import { HooksAnalysis } from "@/components/hooks-analysis";
import { DependenciesView } from "@/components/dependencies-view";
import { SchemaEditor } from "@/components/schema-editor";
import { ProgressTracker } from "@/components/progress-tracker";
import { LogViewer } from "@/components/log-viewer";
import { AuthHeader } from "@/components/auth-header";
import { useChimera } from "@/hooks/use-chimera";
import { ProjectExporter } from "@/lib/project-exporter";
import { Download, Play, Code, Upload, BarChart3 } from "lucide-react";

export default function ChimeraPage() {
  const [activeTab, setActiveTab] = useState("ast");
  const { 
    project, 
    parseStatus, 
    stats, 
    logs, 
    createProject, 
    processFiles, 
    exportSchema, 
    runPipeline 
  } = useChimera();

  const handleDownloadProject = async () => {
    if (!project) return;
    
    try {
      const exportData = {
        name: project.projectName,
        files: [], // Will be populated with actual files
        astData: project.tree,
        metadata: {
          components: stats?.components || 0,
          hooks: stats?.hooks || 0,
          imports: stats?.imports || 0,
          exportedAt: new Date().toISOString()
        }
      };
      
      const blob = await ProjectExporter.exportToZip(exportData);
      ProjectExporter.downloadZip(blob, `${project.projectName}.zip`);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Code className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Project Chimera</h1>
                <p className="text-sm text-gray-600">AST Parser & Code Generator</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={exportSchema}>
                <Download className="mr-2" size={16} />
                Export Schema
              </Button>
              <Button variant="outline" onClick={handleDownloadProject}>
                <Download className="mr-2" size={16} />
                Download Project
              </Button>
              <Button onClick={runPipeline}>
                <Play className="mr-2" size={16} />
                Run Pipeline
              </Button>
              <AuthHeader />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Upload Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Upload className="mr-2" size={20} />
                Upload Files
              </h2>
              <FileUpload onFilesProcessed={processFiles} />
            </div>
            
            {/* Progress Tracker */}
            <div className="mt-6">
              <ProgressTracker status={parseStatus} />
            </div>
            
            {/* Stats Panel */}
            {stats && (
              <div className="mt-6 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="mr-2" size={20} />
                  Statistics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Components</span>
                    <span className="font-medium">{stats.components}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hooks</span>
                    <span className="font-medium">{stats.hooks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Imports</span>
                    <span className="font-medium">{stats.imports}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">AST Paths</span>
                    <span className="font-medium">{stats.astPaths}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Analysis Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b border-gray-200 px-6 py-4">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="ast">AST Structure</TabsTrigger>
                    <TabsTrigger value="hooks">Hooks Analysis</TabsTrigger>
                    <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                    <TabsTrigger value="schema">Schema Editor</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="ast" className="mt-0">
                    <ASTViewer astData={project?.tree || {}} />
                  </TabsContent>

                  <TabsContent value="hooks" className="mt-0">
                    <HooksAnalysis hooksData={[]} />
                  </TabsContent>

                  <TabsContent value="dependencies" className="mt-0">
                    <DependenciesView dependencies={[]} />
                  </TabsContent>

                  <TabsContent value="schema" className="mt-0">
                    <SchemaEditor />
                  </TabsContent>

                  <TabsContent value="logs" className="mt-0">
                    <LogViewer logs={logs} />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
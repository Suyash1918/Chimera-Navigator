import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/components/auth-provider';
import type { Project, ParseStatus } from '@shared/schema';

export function useChimera() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [parseStatus, setParseStatus] = useState<ParseStatus>({
    astGeneration: 'pending',
    hookDetection: 'pending',
    importAnalysis: 'pending',
    schemaValidation: 'pending',
  });

  // Get user projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !!user,
  });

  // Create new project
  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await apiRequest('POST', '/api/projects', data);
      return response.json();
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setCurrentProject(newProject);
    },
  });

  // Upload files to project
  const uploadFilesMutation = useMutation({
    mutationFn: async ({ projectId, files }: { projectId: number; files: File[] }) => {
      // Update parse status to show processing
      setParseStatus({
        astGeneration: 'running',
        hookDetection: 'pending',
        importAnalysis: 'pending',
        schemaValidation: 'pending',
      });

      const fileData = await Promise.all(
        files.map(async (file) => ({
          filename: file.name,
          content: await file.text(),
          path: file.name,
          type: file.name.split('.').pop() || 'js',
        }))
      );

      const response = await apiRequest('POST', `/api/projects/${projectId}/files`, {
        files: fileData,
      });

      // Simulate progress updates
      setTimeout(() => {
        setParseStatus(prev => ({ ...prev, astGeneration: 'complete', hookDetection: 'running' }));
      }, 1000);

      setTimeout(() => {
        setParseStatus(prev => ({ ...prev, hookDetection: 'complete', importAnalysis: 'running' }));
      }, 2000);

      setTimeout(() => {
        setParseStatus(prev => ({ ...prev, importAnalysis: 'complete', schemaValidation: 'running' }));
      }, 3000);

      setTimeout(() => {
        setParseStatus(prev => ({ ...prev, schemaValidation: 'complete' }));
      }, 4000);

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      if (currentProject) {
        queryClient.invalidateQueries({ queryKey: ['/api/projects', currentProject.id, 'results'] });
        queryClient.invalidateQueries({ queryKey: ['/api/projects', currentProject.id, 'logs'] });
      }
    },
    onError: () => {
      setParseStatus({
        astGeneration: 'error',
        hookDetection: 'error',
        importAnalysis: 'error',
        schemaValidation: 'error',
      });
    },
  });

  // Generate AI code review
  const generateReviewMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const response = await apiRequest('POST', `/api/ai/review/${projectId}`);
      return response.json();
    },
  });

  // Helper functions
  const createProject = useCallback((data: { name: string; description?: string }) => {
    return createProjectMutation.mutateAsync(data);
  }, [createProjectMutation]);

  const uploadFiles = useCallback((files: File[]) => {
    if (!currentProject) {
      throw new Error('No current project selected');
    }
    return uploadFilesMutation.mutateAsync({ projectId: currentProject.id, files });
  }, [currentProject, uploadFilesMutation]);

  const generateCodeReview = useCallback((projectId: number) => {
    return generateReviewMutation.mutateAsync(projectId);
  }, [generateReviewMutation]);

  const selectProject = useCallback((project: Project) => {
    setCurrentProject(project);
    // Reset parse status when switching projects
    setParseStatus({
      astGeneration: project.status === 'completed' ? 'complete' : 'pending',
      hookDetection: project.status === 'completed' ? 'complete' : 'pending',
      importAnalysis: project.status === 'completed' ? 'complete' : 'pending',
      schemaValidation: project.status === 'completed' ? 'complete' : 'pending',
    });
  }, []);

  return {
    // State
    projects,
    currentProject,
    parseStatus,
    projectsLoading,
    
    // Mutations
    createProject,
    uploadFiles,
    generateCodeReview,
    selectProject,
    
    // Loading states
    isCreatingProject: createProjectMutation.isPending,
    isUploadingFiles: uploadFilesMutation.isPending,
    isGeneratingReview: generateReviewMutation.isPending,
  };
}

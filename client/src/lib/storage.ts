import { apiRequest } from './queryClient';
import type { 
  User, InsertUser, 
  Project, InsertProject,
  ProjectFile, InsertProjectFile,
  AnalysisResult,
  AiChat,
  Log
} from '@shared/schema';

class StorageClient {
  // Users
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
    try {
      const response = await apiRequest(`/api/users/firebase/${firebaseUid}`);
      return response.user || null;
    } catch (error) {
      return null;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const response = await apiRequest('/api/users', {
      method: 'POST',
      body: user,
    });
    return response.user;
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    const response = await apiRequest('/api/projects');
    return response.projects || [];
  }

  async getProject(id: number): Promise<Project | null> {
    try {
      const response = await apiRequest(`/api/projects/${id}`);
      return response.project || null;
    } catch (error) {
      return null;
    }
  }

  async createProject(project: InsertProject): Promise<Project> {
    const response = await apiRequest('/api/projects', {
      method: 'POST',
      body: project,
    });
    return response.project;
  }

  async deleteProject(id: number): Promise<void> {
    await apiRequest(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Project Files
  async uploadFiles(projectId: number, files: any[]): Promise<ProjectFile[]> {
    const response = await apiRequest(`/api/projects/${projectId}/files`, {
      method: 'POST',
      body: { files },
    });
    return response.files || [];
  }

  async getProjectFiles(projectId: number): Promise<ProjectFile[]> {
    const response = await apiRequest(`/api/projects/${projectId}/files`);
    return response.files || [];
  }

  // Analysis
  async analyzeProject(projectId: number): Promise<AnalysisResult> {
    const response = await apiRequest(`/api/projects/${projectId}/analyze`, {
      method: 'POST',
    });
    return response.analysis;
  }

  async getAnalysisResult(projectId: number): Promise<AnalysisResult | null> {
    try {
      const response = await apiRequest(`/api/projects/${projectId}/analysis`);
      return response.analysis || null;
    } catch (error) {
      return null;
    }
  }

  // AI Chat
  async sendChatMessage(message: string, projectId?: number): Promise<string> {
    const response = await apiRequest('/api/chat', {
      method: 'POST',
      body: { message, projectId },
    });
    return response.reply;
  }

  async getChatHistory(projectId?: number): Promise<AiChat | null> {
    try {
      const url = projectId ? `/api/chat?projectId=${projectId}` : '/api/chat';
      const response = await apiRequest(url);
      return response.chat || null;
    } catch (error) {
      return null;
    }
  }

  // Logs
  async getProjectLogs(projectId: number): Promise<Log[]> {
    const response = await apiRequest(`/api/projects/${projectId}/logs`);
    return response.logs || [];
  }
}

export const storage = new StorageClient();
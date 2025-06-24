import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { aiService } from "./ai-service";
import { insertProjectSchema, insertProjectFileSchema, insertLogSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for AI chat
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    perMessageDeflate: false
  });
  
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'ai_chat') {
          const { userId, projectId, content } = message;
          
          // Get or create chat
          let chat = await storage.getAiChat(userId, projectId);
          if (!chat) {
            chat = await storage.createAiChat({
              userId,
              projectId,
              messages: []
            });
          }

          // Add user message
          const messages = Array.isArray(chat.messages) ? chat.messages : [];
          messages.push({
            role: 'user',
            content,
            timestamp: new Date().toISOString()
          });

          // Get AI response
          const aiResponse = await aiService.generateChatResponse(content, { userId, projectId });
          messages.push({
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date().toISOString()
          });

          // Update chat
          await storage.updateAiChat(chat.id, messages);

          // Send response back
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ai_response',
              content: aiResponse,
              timestamp: new Date().toISOString()
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket error:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process message'
          }));
        }
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    const firebaseUid = req.headers['x-firebase-uid'];
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    req.firebaseUid = firebaseUid;
    next();
  };

  // Get user by Firebase UID
  app.get('/api/users/firebase/:uid', async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.params.uid);
      res.json({ user });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  });

  // Create user
  app.post('/api/users', async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.json({ user });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // Projects
  app.get('/api/projects', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const projects = await storage.getProjectsByUserId(user.id);
      res.json(projects);
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  app.post('/api/projects', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const projectData = insertProjectSchema.parse({
        ...req.body,
        userId: user.id
      });

      const project = await storage.createProject(projectData);
      
      // Log project creation
      await storage.createLog({
        projectId: project.id,
        level: 'INFO',
        message: `Project "${project.name}" created`,
        metadata: {}
      });

      res.json(project);
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  });

  app.get('/api/projects/:id', requireAuth, async (req: any, res) => {
    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Verify ownership
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user || project.userId !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(project);
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  });

  // Project files
  app.post('/api/projects/:id/files', requireAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Verify ownership
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user || project.userId !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { files } = req.body;
      const savedFiles = [];

      // Update project status
      await storage.updateProject(projectId, { status: 'processing' });

      // Save files
      for (const file of files) {
        const fileData = insertProjectFileSchema.parse({
          ...file,
          projectId
        });
        const savedFile = await storage.createProjectFile(fileData);
        savedFiles.push(savedFile);

        await storage.createLog({
          projectId,
          level: 'INFO',
          message: `File "${file.filename}" uploaded`,
          metadata: { filename: file.filename, type: file.type }
        });
      }

      // Start analysis process
      try {
        await aiService.analyzeProject(projectId);
        await storage.updateProject(projectId, { status: 'completed' });
        
        await storage.createLog({
          projectId,
          level: 'SUCCESS',
          message: 'Project analysis completed successfully',
          metadata: { filesCount: savedFiles.length }
        });
      } catch (analysisError) {
        await storage.updateProject(projectId, { status: 'error' });
        await storage.createLog({
          projectId,
          level: 'ERROR',
          message: 'Project analysis failed',
          metadata: { error: analysisError.message }
        });
        throw analysisError;
      }

      res.json({ files: savedFiles });
    } catch (error) {
      console.error('Upload files error:', error);
      res.status(500).json({ error: 'Failed to upload files' });
    }
  });

  // Analysis results
  app.get('/api/projects/:id/results', requireAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Verify ownership
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user || project.userId !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const result = await storage.getAnalysisResult(projectId);
      if (!result) {
        return res.json({ astData: null, hooks: [], imports: [], dependencies: [], schema: null });
      }

      res.json(result);
    } catch (error) {
      console.error('Get analysis results error:', error);
      res.status(500).json({ error: 'Failed to fetch analysis results' });
    }
  });

  // Logs
  app.get('/api/projects/:id/logs', requireAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Verify ownership
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user || project.userId !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const logs = await storage.getProjectLogs(projectId);
      res.json(logs);
    } catch (error) {
      console.error('Get logs error:', error);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  // AI Chat
  app.get('/api/ai/chat/:userId', requireAuth, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const projectId = req.query.projectId ? parseInt(req.query.projectId) : undefined;
      
      const chat = await storage.getAiChat(userId, projectId);
      res.json(chat || { messages: [] });
    } catch (error) {
      console.error('Get chat error:', error);
      res.status(500).json({ error: 'Failed to fetch chat' });
    }
  });

  // AI Code Review
  app.post('/api/ai/review/:projectId', requireAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Verify ownership
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user || project.userId !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const review = await aiService.generateCodeReview(projectId);
      res.json(review);
    } catch (error) {
      console.error('Generate review error:', error);
      res.status(500).json({ error: 'Failed to generate code review' });
    }
  });

  return httpServer;
}

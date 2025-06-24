import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createProjectSchema, createLogSchema } from "@shared/schema";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Project management routes
  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = createProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid project data" });
    }
  });

  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  // File processing routes
  app.post("/api/projects/:id/process", upload.array("files"), async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      const result = await storage.processFiles(projectId, files as any);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to process files" });
    }
  });

  // AST and parsing routes
  app.post("/api/projects/:id/ast-path", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { elementId } = req.body;
      
      const astPath = await storage.generateASTPath(projectId, elementId);
      res.json({ astPath });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate AST path" });
    }
  });

  app.get("/api/projects/:id/status", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const status = await storage.getParseStatus(projectId);
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get parse status" });
    }
  });

  app.get("/api/projects/:id/stats", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const stats = await storage.getProjectStats(projectId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get project stats" });
    }
  });

  app.post("/api/projects/:id/validate", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const isValid = await storage.validateSchema(projectId);
      res.json({ valid: isValid });
    } catch (error) {
      res.status(500).json({ error: "Failed to validate schema" });
    }
  });

  // Logging routes
  app.get("/api/projects/:id/logs", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const logs = await storage.getProjectLogs(projectId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  app.post("/api/projects/:id/logs", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const logData = createLogSchema.parse({
        ...req.body,
        projectId
      });
      const log = await storage.createLog(logData);
      res.json(log);
    } catch (error) {
      res.status(400).json({ error: "Invalid log data" });
    }
  });

  // Parse results routes
  app.get("/api/projects/:id/results", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const result = await storage.getParseResult(projectId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch parse results" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  accountTier: text("account_tier").notNull().default("free"), // 'free' | 'pro'
  credits: integer("credits").default(1), // null for pro accounts (unlimited)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, error
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectFiles = pgTable("project_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  path: text("path").notNull(),
  type: text("type").notNull(), // js, jsx, ts, tsx
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analysisResults = pgTable("analysis_results", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  astData: jsonb("ast_data"),
  hooks: jsonb("hooks"),
  imports: jsonb("imports"),
  dependencies: jsonb("dependencies"),
  schema: jsonb("schema"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiChats = pgTable("ai_chats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),
  messages: jsonb("messages").notNull(), // array of {role, content, timestamp}
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  level: text("level").notNull(), // INFO, DEBUG, WARN, ERROR, SUCCESS
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  aiChats: many(aiChats),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  files: many(projectFiles),
  analysisResults: many(analysisResults),
  logs: many(logs),
  aiChats: many(aiChats),
}));

export const projectFilesRelations = relations(projectFiles, ({ one }) => ({
  project: one(projects, {
    fields: [projectFiles.projectId],
    references: [projects.id],
  }),
}));

export const analysisResultsRelations = relations(analysisResults, ({ one }) => ({
  project: one(projects, {
    fields: [analysisResults.projectId],
    references: [projects.id],
  }),
}));

export const aiChatsRelations = relations(aiChats, ({ one }) => ({
  user: one(users, {
    fields: [aiChats.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [aiChats.projectId],
    references: [projects.id],
  }),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  project: one(projects, {
    fields: [logs.projectId],
    references: [projects.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectFileSchema = createInsertSchema(projectFiles).omit({
  id: true,
  createdAt: true,
});

export const insertAnalysisResultSchema = createInsertSchema(analysisResults).omit({
  id: true,
  createdAt: true,
});

export const insertAiChatSchema = createInsertSchema(aiChats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLogSchema = createInsertSchema(logs).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectFile = typeof projectFiles.$inferSelect;
export type InsertProjectFile = z.infer<typeof insertProjectFileSchema>;

export type AnalysisResult = typeof analysisResults.$inferSelect;
export type InsertAnalysisResult = z.infer<typeof insertAnalysisResultSchema>;

export type AiChat = typeof aiChats.$inferSelect;
export type InsertAiChat = z.infer<typeof insertAiChatSchema>;

export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;

// Schema types for frontend
export interface ParseStatus {
  astGeneration: 'pending' | 'running' | 'complete' | 'error';
  hookDetection: 'pending' | 'running' | 'complete' | 'error';
  importAnalysis: 'pending' | 'running' | 'complete' | 'error';
  schemaValidation: 'pending' | 'running' | 'complete' | 'error';
}

export interface ReactHook {
  type: string;
  astPath: string;
  sourceLocation: {
    startLine: number;
    endLine: number;
  };
  state?: string;
  setter?: string;
  initialValue?: any;
  dependencies?: string[];
}

export interface ImportDependency {
  source: string;
  specifiers: string[];
  isExternal: boolean;
  usageCount: number;
}

export interface ASTNode {
  name: string;
  type: string;
  astPath: string;
  children?: ASTNode[];
  props?: Record<string, any>;
  elements?: ASTNode[];
  definition?: {
    elements: ASTNode[];
  };
  sourceLocation?: {
    startLine: number;
    endLine: number;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

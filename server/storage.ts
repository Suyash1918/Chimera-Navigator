import { 
  users, projects, projectFiles, analysisResults, aiChats, logs,
  type User, type InsertUser,
  type Project, type InsertProject,
  type ProjectFile, type InsertProjectFile,
  type AnalysisResult, type InsertAnalysisResult,
  type AiChat, type InsertAiChat,
  type Log, type InsertLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  updateUserCredits(userId: number, credits: number): Promise<void>;
  upgradeUserAccount(userId: number): Promise<void>;
  canUserCreateProject(userId: number): Promise<boolean>;

  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  // Project Files
  getProjectFiles(projectId: number): Promise<ProjectFile[]>;
  createProjectFile(file: InsertProjectFile): Promise<ProjectFile>;
  deleteProjectFiles(projectId: number): Promise<void>;

  // Analysis Results
  getAnalysisResult(projectId: number): Promise<AnalysisResult | undefined>;
  createAnalysisResult(result: InsertAnalysisResult): Promise<AnalysisResult>;
  updateAnalysisResult(projectId: number, updates: Partial<InsertAnalysisResult>): Promise<AnalysisResult>;

  // AI Chats
  getAiChat(userId: number, projectId?: number): Promise<AiChat | undefined>;
  createAiChat(chat: InsertAiChat): Promise<AiChat>;
  updateAiChat(id: number, messages: any[]): Promise<AiChat>;

  // Logs
  createLog(log: InsertLog): Promise<Log>;
  getProjectLogs(projectId: number): Promise<Log[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserCredits(userId: number, credits: number): Promise<void> {
    await db
      .update(users)
      .set({ credits, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async upgradeUserAccount(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        accountTier: 'pro',
        credits: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async canUserCreateProject(userId: number): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return false;
    
    if (user.accountTier === 'pro') return true;
    return (user.credits || 0) > 0;
  }

  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project> {
    const updatedData = { ...updates, updatedAt: new Date() };
    const [project] = await db.update(projects).set(updatedData).where(eq(projects.id, id)).returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Project Files
  async getProjectFiles(projectId: number): Promise<ProjectFile[]> {
    return await db.select().from(projectFiles).where(eq(projectFiles.projectId, projectId));
  }

  async createProjectFile(insertFile: InsertProjectFile): Promise<ProjectFile> {
    const [file] = await db.insert(projectFiles).values(insertFile).returning();
    return file;
  }

  async deleteProjectFiles(projectId: number): Promise<void> {
    await db.delete(projectFiles).where(eq(projectFiles.projectId, projectId));
  }

  // Analysis Results
  async getAnalysisResult(projectId: number): Promise<AnalysisResult | undefined> {
    const [result] = await db.select().from(analysisResults).where(eq(analysisResults.projectId, projectId));
    return result || undefined;
  }

  async createAnalysisResult(insertResult: InsertAnalysisResult): Promise<AnalysisResult> {
    const [result] = await db.insert(analysisResults).values(insertResult).returning();
    return result;
  }

  async updateAnalysisResult(projectId: number, updates: Partial<InsertAnalysisResult>): Promise<AnalysisResult> {
    const [result] = await db.update(analysisResults).set(updates).where(eq(analysisResults.projectId, projectId)).returning();
    return result;
  }

  // AI Chats
  async getAiChat(userId: number, projectId?: number): Promise<AiChat | undefined> {
    const conditions = projectId 
      ? and(eq(aiChats.userId, userId), eq(aiChats.projectId, projectId))
      : eq(aiChats.userId, userId);
    
    const [chat] = await db.select().from(aiChats).where(conditions).orderBy(desc(aiChats.updatedAt));
    return chat || undefined;
  }

  async createAiChat(insertChat: InsertAiChat): Promise<AiChat> {
    const [chat] = await db.insert(aiChats).values(insertChat).returning();
    return chat;
  }

  async updateAiChat(id: number, messages: any[]): Promise<AiChat> {
    const [chat] = await db.update(aiChats).set({ 
      messages, 
      updatedAt: new Date() 
    }).where(eq(aiChats.id, id)).returning();
    return chat;
  }

  // Logs
  async createLog(insertLog: InsertLog): Promise<Log> {
    const [log] = await db.insert(logs).values(insertLog).returning();
    return log;
  }

  async getProjectLogs(projectId: number): Promise<Log[]> {
    return await db.select().from(logs).where(eq(logs.projectId, projectId)).orderBy(desc(logs.timestamp));
  }
}

export const storage = new DatabaseStorage();

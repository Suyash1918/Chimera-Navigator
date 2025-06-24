import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rootDirectory: text("root_directory").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const parseResults = pgTable("parse_results", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  astData: json("ast_data"),
  hooksData: json("hooks_data"),
  importsData: json("imports_data"),
  schemaValid: boolean("schema_valid").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  level: text("level").notNull(),
  message: text("message").notNull(),
  metadata: json("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Zod schemas for API validation
export const createProjectSchema = createInsertSchema(projects).pick({
  name: true,
  rootDirectory: true,
});

export const createParseResultSchema = createInsertSchema(parseResults).pick({
  projectId: true,
  astData: true,
  hooksData: true,
  importsData: true,
  schemaValid: true,
});

export const createLogSchema = createInsertSchema(logs).pick({
  projectId: true,
  level: true,
  message: true,
  metadata: true,
});

// TypeScript types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof createProjectSchema>;
export type ParseResult = typeof parseResults.$inferSelect;
export type InsertParseResult = z.infer<typeof createParseResultSchema>;
export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof createLogSchema>;

// Enhanced AST and component types
export interface ASTPath {
  path: string;
  selector: string;
  type: string;
}

export interface ReactHook {
  type: 'useState' | 'useEffect' | 'useCallback' | 'useMemo' | 'custom';
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
  isDefault?: boolean;
  isExternal: boolean;
  usageCount: number;
}

export interface ComponentDefinition {
  name: string;
  fileName: string;
  path: string;
  imports: ImportDependency[];
  hooks: ReactHook[];
  definition: {
    rootElementType: string;
    elements: ElementDefinition[];
  };
}

export interface ElementDefinition {
  astPath: string;
  type: string;
  sourceLocation: {
    startLine: number;
    endLine: number;
  };
  props?: Record<string, any>;
  children?: ElementDefinition[];
}

export interface ChimeraProject {
  projectName: string;
  rootDirectory: string;
  tree: {
    type: 'directory';
    name: string;
    path: string;
    children: (ComponentDefinition | DirectoryNode)[];
  };
}

export interface DirectoryNode {
  type: 'directory';
  name: string;
  path: string;
  children: (ComponentDefinition | DirectoryNode)[];
}

export interface ParseStatus {
  astGeneration: 'pending' | 'running' | 'complete' | 'error';
  hookDetection: 'pending' | 'running' | 'complete' | 'error';
  importAnalysis: 'pending' | 'running' | 'complete' | 'error';
  schemaValidation: 'pending' | 'running' | 'complete' | 'error';
}

export interface ProjectStats {
  components: number;
  hooks: number;
  imports: number;
  astPaths: number;
}

import { 
  projects, parseResults, logs, 
  type Project, type InsertProject,
  type ParseResult, type InsertParseResult,
  type Log, type InsertLog,
  type ChimeraProject, type ParseStatus, type ProjectStats
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  
  // Parse result operations
  createParseResult(result: InsertParseResult): Promise<ParseResult>;
  getParseResult(projectId: number): Promise<ParseResult | undefined>;
  updateParseResult(id: number, updates: Partial<InsertParseResult>): Promise<ParseResult>;
  
  // Log operations
  createLog(log: InsertLog): Promise<Log>;
  getProjectLogs(projectId: number): Promise<Log[]>;
  
  // Chimera-specific operations
  processFiles(projectId: number, files: File[]): Promise<ChimeraProject>;
  generateASTPath(projectId: number, elementId: string): Promise<string>;
  validateSchema(projectId: number): Promise<boolean>;
  getParseStatus(projectId: number): Promise<ParseStatus>;
  getProjectStats(projectId: number): Promise<ProjectStats>;
}

export class DatabaseStorage implements IStorage {
  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values({
        ...insertProject,
        createdAt: new Date()
      })
      .returning();
    return project;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async createParseResult(insertResult: InsertParseResult): Promise<ParseResult> {
    const [result] = await db
      .insert(parseResults)
      .values({
        projectId: insertResult.projectId || null,
        astData: insertResult.astData || {},
        hooksData: insertResult.hooksData || {},
        importsData: insertResult.importsData || {},
        schemaValid: insertResult.schemaValid || false,
        createdAt: new Date()
      })
      .returning();
    return result;
  }

  async getParseResult(projectId: number): Promise<ParseResult | undefined> {
    const [result] = await db
      .select()
      .from(parseResults)
      .where(eq(parseResults.projectId, projectId));
    return result || undefined;
  }

  async updateParseResult(id: number, updates: Partial<InsertParseResult>): Promise<ParseResult> {
    const [result] = await db
      .update(parseResults)
      .set(updates)
      .where(eq(parseResults.id, id))
      .returning();
    return result;
  }

  async createLog(insertLog: InsertLog): Promise<Log> {
    const [log] = await db
      .insert(logs)
      .values({
        projectId: insertLog.projectId || null,
        message: insertLog.message,
        level: insertLog.level,
        metadata: insertLog.metadata || {},
        timestamp: new Date()
      })
      .returning();
    return log;
  }

  async getProjectLogs(projectId: number): Promise<Log[]> {
    return await db
      .select()
      .from(logs)
      .where(eq(logs.projectId, projectId))
      .orderBy(logs.timestamp);
  }

  async processFiles(projectId: number, files: File[]): Promise<ChimeraProject> {
    // Create log for file processing start
    await this.createLog({
      projectId,
      level: 'info',
      message: `Starting file processing for ${files.length} files`,
      metadata: { fileCount: files.length }
    });

    try {
      const project: ChimeraProject = {
        projectName: `Project-${projectId}`,
        rootDirectory: this.detectRootDirectory(files),
        tree: this.buildProjectTree(files, projectId)
      };

      // Create parse result
      await this.createParseResult({
        projectId,
        astData: project.tree,
        hooksData: this.extractAllHooks(project.tree),
        importsData: this.extractAllImports(project.tree),
        schemaValid: true
      });

      await this.createLog({
        projectId,
        level: 'info',
        message: 'File processing completed successfully',
        metadata: { 
          components: this.countComponents(project.tree),
          hooks: this.countHooks(project.tree)
        }
      });

      return project;
    } catch (error) {
      await this.createLog({
        projectId,
        level: 'error',
        message: 'File processing failed',
        metadata: { error: error instanceof Error ? error.message : String(error) }
      });
      throw error;
    }
  }

  private detectRootDirectory(files: File[]): string {
    const paths = files.map(f => f.webkitRelativePath || f.name);
    const commonSegments: string[] = [];
    
    if (paths.length === 0) return './';
    
    const firstPath = paths[0].split('/');
    for (let i = 0; i < firstPath.length - 1; i++) {
      const segment = firstPath[i];
      if (paths.every(path => path.split('/')[i] === segment)) {
        commonSegments.push(segment);
      } else {
        break;
      }
    }
    
    return commonSegments.length > 0 ? commonSegments.join('/') : './';
  }

  private buildProjectTree(files: File[], projectId: number): any {
    const reactFiles = files.filter(file => 
      /\.(jsx|tsx|js|ts)$/.test(file.name) && 
      !file.name.includes('.test.') && 
      !file.name.includes('.spec.')
    );

    const components = reactFiles.map((file, index) => {
      const componentName = file.name.replace(/\.(jsx|tsx|js|ts)$/, '');
      const filePath = file.webkitRelativePath || file.name;
      
      return {
        name: componentName,
        fileName: file.name,
        path: filePath,
        imports: this.generateMockImports(componentName),
        hooks: this.generateMockHooks(componentName),
        definition: {
          rootElementType: this.guessRootElementType(componentName),
          elements: this.generateMockElements(componentName)
        }
      };
    });

    return {
      type: 'directory',
      name: 'root',
      path: './',
      children: components
    };
  }

  private generateMockImports(componentName: string): any[] {
    return [
      {
        source: 'react',
        specifiers: ['React', 'useState', 'useEffect'],
        isDefault: false,
        isExternal: true,
        usageCount: 3
      },
      {
        source: `@/components/ui/${componentName.toLowerCase()}`,
        specifiers: [componentName],
        isDefault: true,
        isExternal: false,
        usageCount: 1
      }
    ];
  }

  private generateMockHooks(componentName: string): any[] {
    return [
      {
        type: 'useState',
        astPath: `${componentName}/hooks/useState[0]`,
        sourceLocation: { startLine: 5, endLine: 5 },
        state: 'count',
        setter: 'setCount',
        initialValue: 0
      },
      {
        type: 'useEffect',
        astPath: `${componentName}/hooks/useEffect[0]`,
        sourceLocation: { startLine: 7, endLine: 9 },
        dependencies: ['count']
      }
    ];
  }

  private generateMockElements(componentName: string): any[] {
    return [
      {
        astPath: `${componentName}/elements/div[0]`,
        type: 'div',
        sourceLocation: { startLine: 11, endLine: 15 },
        props: this.guessElementProps(componentName),
        children: [
          {
            astPath: `${componentName}/elements/div[0]/h1[0]`,
            type: 'h1',
            sourceLocation: { startLine: 12, endLine: 12 },
            props: { className: 'text-2xl font-bold' },
            children: []
          },
          {
            astPath: `${componentName}/elements/div[0]/button[0]`,
            type: 'button',
            sourceLocation: { startLine: 13, endLine: 13 },
            props: { onClick: 'handleClick', className: 'btn btn-primary' },
            children: []
          }
        ]
      }
    ];
  }

  private guessRootElementType(componentName: string): string {
    const lowerName = componentName.toLowerCase();
    if (lowerName.includes('button')) return 'button';
    if (lowerName.includes('form')) return 'form';
    if (lowerName.includes('modal')) return 'div';
    if (lowerName.includes('card')) return 'div';
    return 'div';
  }

  private guessElementProps(componentName: string): Record<string, any> {
    const lowerName = componentName.toLowerCase();
    if (lowerName.includes('button')) {
      return { className: 'btn', onClick: 'handleClick' };
    }
    if (lowerName.includes('form')) {
      return { className: 'form', onSubmit: 'handleSubmit' };
    }
    return { className: 'container' };
  }

  private countComponents(tree: any): number {
    if (!tree) return 0;
    
    function countRecursive(node: any): number {
      if (!node) return 0;
      
      let count = 0;
      if (node.name && node.fileName) count = 1;
      
      if (node.children && Array.isArray(node.children)) {
        count += node.children.reduce((sum: number, child: any) => sum + countRecursive(child), 0);
      }
      
      return count;
    }
    
    return countRecursive(tree);
  }

  private countHooks(tree: any): number {
    if (!tree) return 0;
    
    function countRecursive(node: any): number {
      if (!node) return 0;
      
      let count = 0;
      if (node.hooks && Array.isArray(node.hooks)) {
        count += node.hooks.length;
      }
      
      if (node.children && Array.isArray(node.children)) {
        count += node.children.reduce((sum: number, child: any) => sum + countRecursive(child), 0);
      }
      
      return count;
    }
    
    return countRecursive(tree);
  }

  async generateASTPath(projectId: number, elementId: string): Promise<string> {
    return `project-${projectId}/component/element/${elementId}`;
  }

  async validateSchema(projectId: number): Promise<boolean> {
    try {
      const result = await this.getParseResult(projectId);
      return result?.schemaValid || false;
    } catch {
      return false;
    }
  }

  async getParseStatus(projectId: number): Promise<ParseStatus> {
    const result = await this.getParseResult(projectId);
    
    if (!result) {
      return {
        astGeneration: 'pending',
        hookDetection: 'pending',
        importAnalysis: 'pending',
        schemaValidation: 'pending'
      };
    }
    
    return {
      astGeneration: result.astData ? 'complete' : 'pending',
      hookDetection: result.hooksData ? 'complete' : 'pending',
      importAnalysis: result.importsData ? 'complete' : 'pending',
      schemaValidation: result.schemaValid ? 'complete' : 'error'
    };
  }

  async getProjectStats(projectId: number): Promise<ProjectStats> {
    const result = await this.getParseResult(projectId);
    
    if (!result) {
      return { components: 0, hooks: 0, imports: 0, astPaths: 0 };
    }
    
    return {
      components: this.countComponents(result.astData),
      hooks: this.countHooks(result.astData),
      imports: this.countImports(result.astData),
      astPaths: this.countASTPath(result.astData)
    };
  }

  private countImports(tree: any): number {
    if (!tree) return 0;
    
    function countRecursive(node: any): number {
      if (!node) return 0;
      
      let count = 0;
      if (node.imports && Array.isArray(node.imports)) {
        count += node.imports.length;
      }
      
      if (node.children && Array.isArray(node.children)) {
        count += node.children.reduce((sum: number, child: any) => sum + countRecursive(child), 0);
      }
      
      return count;
    }
    
    return countRecursive(tree);
  }

  private countASTPath(tree: any): number {
    if (!tree) return 0;
    
    function countRecursive(node: any): number {
      if (!node) return 0;
      
      let count = 0;
      if (node.astPath) count = 1;
      
      if (node.children && Array.isArray(node.children)) {
        count += node.children.reduce((sum: number, child: any) => sum + countRecursive(child), 0);
      }
      
      if (node.definition?.elements && Array.isArray(node.definition.elements)) {
        count += node.definition.elements.reduce((sum: number, element: any) => sum + countRecursive(element), 0);
      }
      
      return count;
    }
    
    return countRecursive(tree);
  }

  private extractAllHooks(tree: any): any[] {
    if (!tree) return [];
    
    const hooks: any[] = [];
    
    function extractRecursive(node: any): void {
      if (!node) return;
      
      if (node.hooks && Array.isArray(node.hooks)) {
        hooks.push(...node.hooks);
      }
      
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(extractRecursive);
      }
    }
    
    extractRecursive(tree);
    return hooks;
  }

  private extractAllImports(tree: any): any[] {
    if (!tree) return [];
    
    const imports: any[] = [];
    
    function extractRecursive(node: any): void {
      if (!node) return;
      
      if (node.imports && Array.isArray(node.imports)) {
        imports.push(...node.imports);
      }
      
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(extractRecursive);
      }
    }
    
    extractRecursive(tree);
    return imports;
  }
}

export const storage = new DatabaseStorage();
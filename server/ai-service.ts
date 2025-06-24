import OpenAI from "openai";
import { storage } from "./storage";
import { ChatMessage } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export class AIService {
  private checkOpenAI() {
    if (!openai) {
      throw new Error("OpenAI API key not configured. AI features are unavailable.");
    }
  }

  async analyzeCode(code: string, filename: string): Promise<{
    summary: string;
    hooks: any[];
    imports: any[];
    suggestions: string[];
  }> {
    this.checkOpenAI();
    const prompt = `Analyze this ${filename} React/TypeScript code and provide a comprehensive analysis. Return JSON with:
    - summary: Brief description of what the component does
    - hooks: List of React hooks used with their details
    - imports: List of imports with their sources
    - suggestions: Array of improvement suggestions

    Code:
    ${code}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a React/TypeScript code analysis expert. Analyze code and provide structured insights in JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  async generateASTPath(elementDescription: string, componentCode: string): Promise<string> {
    this.checkOpenAI();
    const prompt = `Given this React component code and element description, generate the AST path for the element.
    
    Component Code:
    ${componentCode}
    
    Element Description: ${elementDescription}
    
    Return only the AST path string (e.g., "body.0.children.1.props.onClick")`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AST analysis expert. Generate precise AST paths for React elements."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    return response.choices[0].message.content?.trim() || "";
  }

  async generateChatResponse(
    message: string,
    context: { userId: number; projectId?: number }
  ): Promise<string> {
    this.checkOpenAI();
    let analysisData = null;
    
    if (context.projectId) {
      const analysis = await storage.getAnalysisResult(context.projectId);
      if (analysis) {
        analysisData = {
          components: analysis.astData ? Object.keys(analysis.astData).length : 0,
          hooks: Array.isArray(analysis.hooks) ? analysis.hooks.length : 0,
          imports: Array.isArray(analysis.imports) ? analysis.imports.length : 0,
          astPaths: analysis.astData ? this.countASTNodes(analysis.astData) : 0
        };
      }
    }
    const systemPrompt = `You are ChimeraNavigator AI, an expert code analysis assistant. You help developers understand and improve their React/TypeScript projects.

    ${analysisData ? `Current Project Analysis:
    - Components: ${analysisData.components || 0}
    - Hooks: ${analysisData.hooks || 0}
    - Imports: ${analysisData.imports || 0}
    - AST Paths: ${analysisData.astPaths || 0}
    
    Analysis Data: ${JSON.stringify(analysisData, null, 2)}` : ''}

    You can:
    1. Analyze uploaded React/TypeScript code
    2. Explain AST structures and hook usage
    3. Suggest code improvements
    4. Help with debugging
    5. Generate AST paths for elements
    6. Modify schema files based on natural language commands

    Be helpful, concise, and provide actionable insights.`;

    const openaiMessages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: message }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't process your request.";
  }

  async processSchemaCommand(command: string, currentSchema: any): Promise<{
    success: boolean;
    modifiedSchema: any;
    explanation: string;
  }> {
    this.checkOpenAI();
    const prompt = `You are a schema modification expert. Process this natural language command to modify the JSON schema.

    Current Schema:
    ${JSON.stringify(currentSchema, null, 2)}

    Command: ${command}

    Return JSON with:
    - success: boolean
    - modifiedSchema: the updated schema object
    - explanation: what changes were made

    Examples of commands:
    - "Add a new field called 'description' of type string"
    - "Remove the 'deprecated' field"
    - "Change the 'age' field to be required"
    - "Add validation for email format"`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a JSON schema expert. Modify schemas based on natural language commands."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{"success": false, "modifiedSchema": {}, "explanation": "Failed to process command"}');
  }

  async analyzeProject(projectId: number): Promise<void> {
    this.checkOpenAI();
    const files = await storage.getProjectFiles(projectId);
    const analysisData = {
      astData: {},
      hooks: [],
      imports: [],
      dependencies: [],
      schema: null
    };

    for (const file of files) {
      try {
        const analysis = await this.analyzeCode(file.content, file.filename);
        
        analysisData.astData[file.filename] = {
          summary: analysis.summary,
          hooks: analysis.hooks,
          imports: analysis.imports
        };
        
        analysisData.hooks.push(...analysis.hooks);
        analysisData.imports.push(...analysis.imports);
      } catch (error) {
        console.error(`Failed to analyze ${file.filename}:`, error);
      }
    }

    // Save or update analysis results
    const existingResult = await storage.getAnalysisResult(projectId);
    if (existingResult) {
      await storage.updateAnalysisResult(projectId, analysisData);
    } else {
      await storage.createAnalysisResult({
        projectId,
        ...analysisData
      });
    }
  }

  async generateCodeReview(projectId: number): Promise<any> {
    this.checkOpenAI();
    const analysis = await storage.getAnalysisResult(projectId);
    if (!analysis) {
      throw new Error('No analysis data found for project');
    }

    const prompt = `Generate a comprehensive code review for this React/TypeScript project:

    Analysis Data:
    ${JSON.stringify(analysis, null, 2)}

    Provide a structured review with:
    1. Overall assessment
    2. Strengths
    3. Areas for improvement
    4. Specific recommendations
    5. Best practices suggestions

    Return JSON format.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a senior React/TypeScript code reviewer. Provide detailed, actionable feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  private countASTNodes(astData: any): number {
    let count = 0;
    function countRecursive(obj: any): void {
      if (obj && typeof obj === 'object') {
        if (obj.type || obj.astPath) count++;
        Object.values(obj).forEach(countRecursive);
      }
    }
    countRecursive(astData);
    return count;
  }
}

export const aiService = new AIService();
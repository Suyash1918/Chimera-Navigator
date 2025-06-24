import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { aiService } from "./ai-service";
import { insertProjectSchema, insertProjectFileSchema, insertLogSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
}) : new Stripe("sk_test_placeholder_stripe_secret_key", {
  apiVersion: "2023-10-16",
});

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

      // Check if user can create projects
      const canCreate = await storage.canUserCreateProject(user.id);
      if (!canCreate) {
        return res.status(403).json({ 
          error: 'Insufficient credits. Upgrade to Pro or contact support.',
          accountTier: user.accountTier,
          credits: user.credits
        });
      }

      const projectData = insertProjectSchema.parse({
        ...req.body,
        userId: user.id
      });

      const project = await storage.createProject(projectData);
      
      // Deduct credit for free tier users
      if (user.accountTier === 'free' && user.credits !== null) {
        await storage.updateUserCredits(user.id, user.credits - 1);
      }
      
      await storage.createLog({
        projectId: project.id,
        level: 'INFO',
        message: `Project "${project.name}" created`,
        metadata: { accountTier: user.accountTier, creditsUsed: user.accountTier === 'free' ? 1 : 0 }
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

      // Start analysis process (optional if OpenAI is available)
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
        // If AI analysis fails, still mark upload as successful but note the limitation
        if (analysisError.message.includes('OpenAI API key not configured')) {
          await storage.updateProject(projectId, { status: 'completed' });
          await storage.createLog({
            projectId,
            level: 'WARNING',
            message: 'Files uploaded successfully, AI analysis skipped (OpenAI API key not configured)',
            metadata: { filesCount: savedFiles.length }
          });
        } else {
          await storage.updateProject(projectId, { status: 'error' });
          await storage.createLog({
            projectId,
            level: 'ERROR',
            message: 'Project analysis failed',
            metadata: { error: analysisError.message }
          });
          throw analysisError;
        }
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

  // Account Management
  app.get('/api/users/:id/credits', requireAuth, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const requestingUser = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!requestingUser || requestingUser.id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        accountTier: user.accountTier,
        credits: user.credits,
        canCreateProject: await storage.canUserCreateProject(userId)
      });
    } catch (error) {
      console.error('Get credits error:', error);
      res.status(500).json({ error: 'Failed to get credits' });
    }
  });

  app.post('/api/users/:id/upgrade', requireAuth, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const requestingUser = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!requestingUser || requestingUser.id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await storage.upgradeUserAccount(userId);
      
      await storage.createLog({
        projectId: null,
        level: 'INFO',
        message: `User ${user.email} upgraded to Pro account`,
        metadata: { userId, previousTier: user.accountTier }
      });

      res.json({ success: true, message: 'Account upgraded to Pro' });
    } catch (error) {
      console.error('Upgrade account error:', error);
      res.status(500).json({ error: 'Failed to upgrade account' });
    }
  });

  // Schema Modification Endpoint with Project Chimera Integration
  app.post('/api/ai/modify-schema', requireAuth, async (req: any, res) => {
    try {
      const { command, currentSchema, projectId } = req.body;
      
      if (projectId) {
        const project = await storage.getProject(projectId);
        if (!project) {
          return res.status(404).json({ error: 'Project not found' });
        }

        const user = await storage.getUserByFirebaseUid(req.firebaseUid);
        if (!user || project.userId !== user.id) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      // First get AI recommendation for schema change
      const aiResult = await aiService.processSchemaCommand(command, currentSchema);
      
      if (aiResult.success && projectId) {
        // Execute Project Chimera transformation workflow
        try {
          // Convert AI command to Chimera command format
          const chimeraCommand = `tree.definition.schema=${JSON.stringify(aiResult.modifiedSchema)}`;
          
          // Execute foreman.py with the transformation command
          const { spawn } = require('child_process');
          const foreman = spawn('python3', ['server/foreman.py', '--command', chimeraCommand], {
            cwd: process.cwd(),
            stdio: ['pipe', 'pipe', 'pipe']
          });

          let foremanOutput = '';
          let foremanError = '';

          foreman.stdout.on('data', (data) => {
            foremanOutput += data.toString();
          });

          foreman.stderr.on('data', (data) => {
            foremanError += data.toString();
          });

          foreman.on('close', async (code) => {
            if (code === 0) {
              // Foreman succeeded - update database
              const analysisResult = await storage.getAnalysisResult(projectId);
              if (analysisResult) {
                await storage.updateAnalysisResult(projectId, {
                  schema: aiResult.modifiedSchema
                });
              }

              await storage.createLog({
                projectId,
                level: 'SUCCESS',
                message: `Schema modified via Project Chimera: ${aiResult.explanation}`,
                metadata: { 
                  command, 
                  chimeraCommand,
                  schemaModified: true,
                  foremanOutput: foremanOutput.slice(0, 500)
                }
              });

              res.json({
                success: true,
                modifiedSchema: aiResult.modifiedSchema,
                explanation: `${aiResult.explanation} - Applied via Project Chimera automation`,
                chimeraExecution: {
                  success: true,
                  output: foremanOutput
                }
              });
            } else {
              // Foreman failed - still return AI result but note the automation failure
              await storage.createLog({
                projectId,
                level: 'WARNING',
                message: `Schema AI modification successful, but Chimera automation failed: ${aiResult.explanation}`,
                metadata: { 
                  command,
                  chimeraError: foremanError,
                  returnCode: code
                }
              });

              res.json({
                success: true,
                modifiedSchema: aiResult.modifiedSchema,
                explanation: `${aiResult.explanation} - Note: Automatic code transformation failed`,
                chimeraExecution: {
                  success: false,
                  error: foremanError,
                  code: code
                }
              });
            }
          });

        } catch (chimeraError) {
          // Fallback to regular AI processing if Chimera fails
          await storage.createLog({
            projectId,
            level: 'WARNING',
            message: `Chimera integration failed, using AI-only processing: ${aiResult.explanation}`,
            metadata: { command, chimeraError: chimeraError.message }
          });

          res.json({
            success: true,
            modifiedSchema: aiResult.modifiedSchema,
            explanation: `${aiResult.explanation} - Processed by AI (automation unavailable)`,
            chimeraExecution: {
              success: false,
              error: chimeraError.message
            }
          });
        }
      } else {
        res.json(aiResult);
      }
    } catch (error) {
      console.error('Schema modification error:', error);
      res.status(500).json({ error: 'Failed to modify schema' });
    }
  });

  // Stripe Payment Endpoints
  app.post('/api/stripe/create-subscription', requireAuth, async (req: any, res) => {
    try {
      const { priceId, paymentMethodId } = req.body;
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.displayName,
          metadata: { userId: user.id.toString() }
        });
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        await storage.updateUser(user.id, { stripeCustomerId: customerId });
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        status: subscription.status,
      });

    } catch (error) {
      console.error('Stripe subscription error:', error);
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  });

  app.get('/api/stripe/prices', async (req, res) => {
    try {
      const prices = {
        monthly: {
          id: 'price_1234567890_monthly',
          amount: 3900, // $39.00
          currency: 'usd',
          interval: 'month',
          nickname: 'Pro Monthly'
        },
        quarterly: {
          id: 'price_1234567890_quarterly', 
          amount: 10500, // $105.00 (10% discount)
          currency: 'usd',
          interval: 'month',
          interval_count: 3,
          nickname: 'Pro Quarterly'
        },
        annual: {
          id: 'price_1234567890_annual',
          amount: 39000, // $390.00 (17% discount)
          currency: 'usd', 
          interval: 'year',
          nickname: 'Pro Annual'
        }
      };

      res.json(prices);
    } catch (error) {
      console.error('Get prices error:', error);
      res.status(500).json({ error: 'Failed to get prices' });
    }
  });

  app.post('/api/stripe/webhook', async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';
      
      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle subscription events
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          const subscription = event.data.object;
          const customerId = subscription.customer;
          
          // Find user by Stripe customer ID
          const customer = await stripe.customers.retrieve(customerId);
          const userId = customer.metadata?.userId;
          
          if (userId && subscription.status === 'active') {
            await storage.upgradeUserAccount(parseInt(userId));
            
            await storage.createLog({
              projectId: null,
              level: 'INFO',
              message: `Subscription activated for user ${userId}`,
              metadata: { 
                subscriptionId: subscription.id,
                customerId: customerId,
                status: subscription.status
              }
            });
          }
          break;

        case 'customer.subscription.deleted':
          const deletedSub = event.data.object;
          const deletedCustomerId = deletedSub.customer;
          const deletedCustomer = await stripe.customers.retrieve(deletedCustomerId);
          const deletedUserId = deletedCustomer.metadata?.userId;
          
          if (deletedUserId) {
            // Downgrade to free tier
            await storage.updateUser(parseInt(deletedUserId), { 
              accountTier: 'free',
              credits: 1
            });
          }
          break;
      }

      res.status(200).send('Received');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  return httpServer;
}

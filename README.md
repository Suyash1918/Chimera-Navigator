# ChimeraNavigator - AI-Powered Code Analysis Platform

🚀 **The world's first AI-driven React/TypeScript code analysis platform with automated schema-to-code transformation**

ChimeraNavigator revolutionizes how developers understand, analyze, and improve their React/TypeScript projects through cutting-edge AI and machine learning technologies.

## 🌟 Key Features

### 🔬 **Advanced Code Analysis**
- **AST Parsing**: Deep analysis of React components and TypeScript code
- **Dependency Mapping**: Comprehensive import/export dependency visualization  
- **Hook Detection**: Automatic React hooks usage pattern analysis
- **Component Visualization**: Interactive AST tree navigation and exploration

### 🤖 **AI-Powered Insights** 
- **Schema Modification**: Natural language commands to modify JSON schemas
- **Code Review**: AI-driven suggestions for code improvements
- **Real-time Chat**: Context-aware AI assistant with project knowledge
- **Automated Documentation**: Generate comprehensive project documentation

### ⚡ **Project Chimera ML Integration**
- **surveyor.py**: React/TypeScript → JSON parser with Babel AST
- **foreman.py**: Atomic AST transformation engine with rollback support
- **pipeline.py**: Automated build and deployment with health checks
- **Schema Compliance**: Full validation against Project Chimera specifications

### 💰 **Flexible Subscription Model**
- **Free Trial**: 1 project credit to explore the platform
- **Pro Monthly**: $39/month - Unlimited projects and full AI features
- **Pro Quarterly**: $35/month - 10% savings with quarterly billing  
- **Pro Annual**: $32.50/month - 17% savings with annual commitment

### 🏗️ **AI-to-Code Workflow**
1. **Natural Language Input**: "Add email validation to user schema"
2. **AI Processing**: GPT-4o analyzes and generates modifications
3. **Chimera Translation**: Commands converted to AST transformation format
4. **ML Execution**: Python engine performs atomic code transformations
5. **Verification**: Automatic validation and rollback on failure
6. **Deployment**: Seamless build and deployment automation

## 🎯 **Unique Value Proposition**

### For Individual Developers
- **Instant Project Understanding**: Upload any React/TypeScript project and get immediate AI-powered insights
- **Code Quality Improvement**: Receive actionable suggestions to improve code structure and performance
- **Learning Acceleration**: Understand complex codebases through AI-guided exploration

### For Development Teams  
- **Onboarding Acceleration**: New team members understand codebases 10x faster
- **Technical Debt Reduction**: Identify and fix architectural issues automatically
- **Standards Compliance**: Ensure consistent coding patterns across projects

### For Enterprise
- **Legacy Code Modernization**: Transform old React codebases with AI guidance
- **Risk Assessment**: Identify potential security and performance issues
- **Documentation Generation**: Automatically maintain up-to-date project documentation

## 🛠️ **Technical Architecture**

### Frontend Stack
- **React 18** with TypeScript for type-safe development
- **Vite** for lightning-fast development and building
- **Tailwind CSS + Radix UI** for beautiful, accessible components
- **TanStack Query** for efficient server state management
- **Wouter** for lightweight client-side routing

### Backend Infrastructure  
- **Express.js** RESTful API with TypeScript
- **PostgreSQL** with Drizzle ORM for type-safe database operations
- **WebSocket Server** for real-time AI chat communication
- **Stripe Integration** for secure payment processing
- **Firebase Authentication** with Google OAuth

### AI & ML Pipeline
- **OpenAI GPT-4o** for natural language processing and code analysis
- **Python ML Stack** with Babel parser for AST manipulation
- **JSON Schema Validation** ensuring data integrity
- **Atomic Transactions** with automatic rollback capabilities

## 🚀 **Getting Started**

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Firebase project with Google Auth enabled
- OpenAI API key (for full AI features)
- Stripe account (for payment processing)

### Quick Setup
```bash
# Clone and install
git clone <repository-url>
cd chimera-navigator
npm install

# Database setup  
npm run db:push

# Start development server
npm run dev
```

### Environment Configuration
```bash
# Database (auto-configured in Replit)
DATABASE_URL=postgresql://...

# Firebase Authentication
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id  
VITE_FIREBASE_APP_ID=your_app_id

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_test_... # or sk_live_ for production
VITE_STRIPE_PUBLIC_KEY=pk_test_... # or pk_live_ for production
STRIPE_WEBHOOK_SECRET=whsec_...

# AI Features (optional but recommended)
OPENAI_API_KEY=sk-...
```

## 📊 **Pricing & Plans**

| Feature | Free Trial | Pro Plans |
|---------|------------|-----------|
| Project Credits | 1 | Unlimited |
| AI Analysis | Basic | Advanced |
| Schema Modification | ❌ | ✅ |
| Project Chimera ML | ❌ | ✅ |
| Real-time Chat | Limited | Unlimited |
| Export Capabilities | ❌ | ✅ |
| Priority Support | ❌ | ✅ |

### Pro Plan Options
- **Monthly**: $39/month
- **Quarterly**: $35/month (save 10%)
- **Annual**: $32.50/month (save 17%)

## 🏭 **Production Deployment**

### Replit Deployment (Recommended)
1. Configure all environment variables in Replit Secrets
2. Ensure Firebase domain is authorized
3. Set up Stripe webhook endpoints
4. Click "Deploy" in Replit interface

### Manual Deployment
1. Build the application: `npm run build`
2. Configure production environment variables
3. Set up reverse proxy (nginx recommended)
4. Configure SSL certificates
5. Set up monitoring and logging

## 🔧 **Development Commands**

- `npm run dev` - Start development server
- `npm run db:push` - Push database schema changes
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🤝 **Contributing**

We welcome contributions to ChimeraNavigator! Please see our contributing guidelines for:
- Code style and conventions  
- Testing requirements
- Pull request process
- Issue reporting

## 📄 **License**

MIT License - see LICENSE file for details

## 🔗 **Links**

- **Live Demo**: [chimera-navigator.replit.app]
- **Documentation**: [docs.chimera-navigator.com]
- **Support**: [support@chimera-navigator.com]
- **Discord Community**: [discord.gg/chimera-navigator]

---

**Built with ❤️ by the ChimeraNavigator team - Transforming code analysis through AI innovation**
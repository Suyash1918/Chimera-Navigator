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

## 💼 **Client Usage Scenario**

### Scenario: React Developer Analyzing Legacy Codebase

**Meet Sarah**, a senior React developer who just joined a new company and needs to understand a complex legacy React application with 50+ components.

#### 1. **Initial Setup** (2 minutes)
- Sarah visits ChimeraNavigator and signs in with Google
- Gets 1 free credit for trial analysis
- Creates a new project: "Legacy E-commerce App Analysis"

#### 2. **File Upload** (3 minutes)
- Uploads 25 React/TypeScript files from the legacy app
- Platform automatically detects: 15 components, 8 custom hooks, 45 imports
- Real-time progress tracker shows: "Parsing AST... Detecting hooks... Analyzing dependencies..."

#### 3. **AI Analysis Results** (Instant)
The platform presents:
- **AST Viewer**: Interactive tree showing component hierarchy
- **Hooks Analysis**: "Warning: useState with complex objects in UserProfile.tsx"
- **Dependencies**: "Circular import detected between Header.tsx and Navigation.tsx"
- **Architecture Overview**: Visual diagram of component relationships

#### 4. **AI Chat Interaction** (5 minutes)
Sarah asks the AI assistant:
- **"What's the purpose of the useUserData hook?"**
  - AI: "This custom hook manages user authentication state and profile data. It's used in 8 components but has potential memory leaks due to missing cleanup in useEffect."

- **"How can I improve the UserProfile component?"**
  - AI: "I recommend: 1) Extract inline styles to CSS modules, 2) Memoize expensive calculations, 3) Split into smaller sub-components. Would you like me to generate the refactored code?"

#### 5. **Schema Modification with Project Chimera** (3 minutes)
Sarah wants to add user preferences to the data structure:
- **Command**: "Add a userPreferences object with theme and language fields to the User schema"
- **AI Processing**: Analyzes current User interface structure
- **Chimera Translation**: Converts to AST transformation commands
- **Automated Execution**: Python ML engine modifies relevant files
- **Result**: TypeScript interfaces automatically updated, type errors highlighted

#### 6. **Upgrade Decision** (1 minute)
Impressed by the analysis, Sarah upgrades to Pro Monthly ($39):
- Unlocks unlimited project analysis
- Gains access to advanced AI features
- Can now analyze the entire codebase (100+ files)

#### 7. **Advanced Features** (Ongoing)
With Pro access, Sarah:
- **Bulk Analysis**: Uploads entire repository for comprehensive review
- **Continuous Monitoring**: Sets up alerts for code quality regressions
- **Team Collaboration**: Shares insights with her development team
- **Documentation Generation**: Auto-generates updated architecture docs

### **AI Behavior & Responses**

#### **Context-Aware Responses**
The AI maintains full project context:
- **User**: "Is this component reusable?"
- **AI**: "The ProductCard component in src/components/ProductCard.tsx is moderately reusable. It has 3 hard-coded values and accepts 8 props. To improve reusability, I recommend extracting the price formatting logic and making the action buttons configurable."

#### **Proactive Insights**
- **Security**: "I detected potential XSS vulnerability in ReviewList.tsx line 45 where user input is rendered without sanitization."
- **Performance**: "The ProductGrid component re-renders unnecessarily. Consider wrapping child components with React.memo."
- **Best Practices**: "5 components are missing proper error boundaries. This could cause crashes in production."

#### **Learning & Adaptation**
- Learns from Sarah's preferences and coding style
- Suggests improvements aligned with her team's standards
- Remembers previous questions to provide contextual follow-ups

### **Business Impact for Sarah's Team**

#### **Immediate Benefits** (Week 1)
- 80% faster onboarding for new team members
- Identified and fixed 12 critical issues
- Reduced code review time by 60%

#### **Long-term Value** (Month 1-3)
- Established consistent coding standards
- Automated documentation stays current
- Legacy codebase modernization roadmap created
- Technical debt reduced by 40%

### **ROI Calculation**
- **Sarah's hourly rate**: $75/hour
- **Time saved analyzing codebase**: 20 hours
- **Value delivered**: $1,500
- **ChimeraNavigator cost**: $39/month
- **ROI**: 3,746% in first month

This scenario demonstrates how ChimeraNavigator transforms code analysis from a tedious manual process into an intelligent, automated workflow that provides immediate value and scales with team needs.

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

## ⚠️ **Known Issues & Limitations**

### **Authentication Issues**
- **Firebase Domain Authorization**: Requires manual setup in Firebase Console
  - Go to Firebase Console → Authentication → Settings → Authorized domains
  - Add your domain or `*.replit.dev` for Replit deployments
  - This is a one-time setup requirement

- **Environment Variables**: Firebase configuration must be properly set
  - Missing `VITE_FIREBASE_API_KEY` will cause authentication failures
  - Demo mode available when authentication is unavailable

### **External Dependencies**
- **OpenAI API**: Required for AI features (schema modification, chat)
  - Platform works without it but with limited functionality
  - Need to provide valid `OPENAI_API_KEY` for full experience

- **Stripe Integration**: Required for payment processing
  - Uses placeholder keys in development
  - Need real Stripe keys for production payments

### **Project Chimera ML**
- **Python Dependencies**: Requires Python 3.8+ with specific packages
  - May need manual installation of babel-parser equivalent
  - Some transformations might fail gracefully with fallback to AI-only processing

### **Browser Limitations**
- **Popup Blockers**: May prevent Google sign-in popup
  - Users need to allow popups for the domain
  - Shows appropriate error messages when blocked

### **Workarounds Implemented**
- **Demo Mode**: Available when authentication fails
- **Graceful Degradation**: Core features work without AI integration
- **Error Handling**: User-friendly messages for common failures
- **Fallback Processing**: AI-only schema modification when Python ML fails

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
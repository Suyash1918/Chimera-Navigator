# ChimeraNavigator

A comprehensive React/TypeScript code analysis platform that helps developers understand, analyze, and improve their projects through AI-powered insights.

## Features

### 🔍 Code Analysis
- **AST Generation**: Parse and visualize Abstract Syntax Trees
- **Hook Detection**: Identify and analyze React hooks usage patterns
- **Import Analysis**: Track dependencies and module relationships
- **Component Structure**: Understand component hierarchies and relationships

### 🤖 AI-Powered Insights
- **Intelligent Chat**: Context-aware AI assistant for code questions
- **Code Reviews**: Automated suggestions for improvements
- **Schema Modifications**: Natural language schema editing
- **Pattern Recognition**: Identify anti-patterns and best practices

### 📊 Analytics Dashboard
- **Project Overview**: Visual representation of codebase metrics
- **Progress Tracking**: Real-time analysis status
- **Log Monitoring**: Detailed operation logs
- **File Management**: Upload and organize project files

### 💳 Account Tiers
- **Free Trial**: 1 credit for testing (1 project analysis)
- **Pro Account**: Unlimited credits and full feature access

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Firebase project (for authentication)
- OpenAI API key (optional, for AI features)

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd chimera-navigator
npm install
```

2. **Set up environment variables**
```bash
# Database (automatically provided in Replit)
DATABASE_URL=your_postgresql_url

# Firebase Authentication
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# OpenAI (optional)
OPENAI_API_KEY=your_openai_api_key
```

3. **Initialize database**
```bash
npm run db:push
```

4. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:5000` to access the application.

## Usage Guide

### 1. Account Setup
- Sign in with Google OAuth
- New users automatically get 1 free credit
- Upgrade to Pro for unlimited usage

### 2. Create a Project
- Click "New Project" in the dashboard
- Enter project name and description
- Upload your React/TypeScript files

### 3. File Upload
- Drag and drop files or click to select
- Supports: `.js`, `.jsx`, `.ts`, `.tsx`
- Maximum 10 files per upload (Free), unlimited (Pro)

### 4. Analysis Results
- **AST Viewer**: Navigate code structure
- **Hooks Analysis**: Review React hooks usage
- **Dependencies**: Examine import relationships
- **AI Chat**: Ask questions about your code

### 5. Schema Editing
- Use natural language to modify JSON schemas
- Example: "Add a required email field"
- AI processes commands and updates schema automatically

## API Reference

### Authentication
All API endpoints require Firebase UID in headers:
```javascript
headers: {
  'x-firebase-uid': 'user-firebase-uid'
}
```

### Core Endpoints

#### Projects
```bash
GET    /api/projects              # List user projects
POST   /api/projects              # Create project
GET    /api/projects/:id          # Get project details
POST   /api/projects/:id/files    # Upload files
GET    /api/projects/:id/results  # Get analysis results
GET    /api/projects/:id/logs     # Get project logs
```

#### AI Features
```bash
GET    /api/ai/chat/:userId       # Get chat history
POST   /api/ai/review/:projectId  # Generate code review
```

#### Account Management
```bash
GET    /api/users/firebase/:uid   # Get user by Firebase UID
POST   /api/users                 # Create user
GET    /api/users/:id/credits     # Get user credits
POST   /api/users/:id/upgrade     # Upgrade account
```

### WebSocket API
Connect to `/ws` for real-time AI chat:

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

// Send message
ws.send(JSON.stringify({
  type: 'ai_chat',
  userId: 1,
  projectId: 1,
  content: 'Explain this component'
}));

// Receive response
ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log(response.content);
};
```

## Database Schema

### Users
- `id`: Primary key
- `firebaseUid`: Firebase authentication ID
- `email`: User email
- `accountTier`: 'free' | 'pro'
- `credits`: Available credits (null for pro)

### Projects
- `id`: Primary key
- `userId`: Foreign key to users
- `name`: Project name
- `status`: 'pending' | 'processing' | 'completed' | 'error'

### Project Files
- `id`: Primary key
- `projectId`: Foreign key to projects
- `filename`: File name
- `content`: File content
- `path`: File path
- `type`: File type (js, jsx, ts, tsx)

## Development

### Project Structure
```
chimera-navigator/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities
├── server/                 # Express backend
│   ├── ai-service.ts       # OpenAI integration
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API routes
│   └── storage.ts         # Data access layer
├── shared/                # Shared types/schemas
└── migrations/            # Database migrations
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Apply database schema
npm run check        # Type checking
```

### Adding New Features

1. **Backend API Endpoint**
```typescript
// server/routes.ts
app.post('/api/new-feature', requireAuth, async (req, res) => {
  // Implementation
});
```

2. **Database Schema**
```typescript
// shared/schema.ts
export const newTable = pgTable("new_table", {
  id: serial("id").primaryKey(),
  // ... columns
});
```

3. **Frontend Component**
```typescript
// client/src/components/NewFeature.tsx
export function NewFeature() {
  // Implementation
}
```

## Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Setup
- Ensure all environment variables are configured
- Database should be provisioned and accessible
- Firebase project should have authorized domains

### Monitoring
- Check logs via dashboard
- Monitor WebSocket connections
- Track API response times

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Add proper error handling
- Update documentation

## Troubleshooting

### Common Issues

**"Firebase: Error (auth/invalid-api-key)"**
- Check Firebase configuration
- Verify API key is correct
- Ensure domain is authorized in Firebase Console

**"relation does not exist"**
- Run `npm run db:push` to create tables
- Check database connection

**"AI features unavailable"**
- Add `OPENAI_API_KEY` environment variable
- AI features are optional, core functionality works without it

**"WebSocket connection failed"**
- Check server is running on correct port
- Verify WebSocket endpoint is accessible

### Getting Help
- Check the logs in the dashboard
- Review console errors in browser
- Verify environment variables are set
- Ensure database is accessible

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review troubleshooting guide
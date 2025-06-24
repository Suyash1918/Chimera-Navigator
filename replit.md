# ChimeraNavigator - Code Analysis Platform

## Project Overview
ChimeraNavigator is a comprehensive React/TypeScript code analysis platform that helps developers understand, analyze, and improve their projects through AI-powered insights.

## Core Features

### 1. **Project Management**
- Create and manage multiple React/TypeScript projects
- Upload and organize project files
- Track project status and progress

### 2. **AI-Powered Code Analysis**
- Analyze React components and TypeScript code
- Extract hooks, imports, and dependencies
- Generate Abstract Syntax Tree (AST) data
- Provide code improvement suggestions

### 3. **Interactive Dashboard**
- Visual project overview with analytics
- File management and upload interface
- Real-time progress tracking
- Log viewer for debugging

### 4. **AI Chat Assistant**
- Real-time WebSocket-based chat with AI
- Context-aware responses based on project analysis
- Code review and improvement suggestions
- Natural language schema modifications

### 5. **Advanced Analysis Tools**
- **AST Viewer**: Visualize and navigate code structure
- **Hooks Analysis**: Track React hooks usage patterns
- **Dependencies View**: Analyze project dependencies
- **Schema Editor**: Modify JSON schemas with natural language

### 6. **Authentication & Security**
- Firebase Google OAuth integration
- User session management
- Secure API endpoints with Firebase UID verification

## Technical Architecture

### Backend (Express.js)
- RESTful API with Express.js
- PostgreSQL database with Drizzle ORM
- WebSocket server for real-time AI chat
- File upload and storage management
- AI service integration (OpenAI GPT-4o)

### Frontend (React + Vite)
- Modern React with TypeScript
- Tailwind CSS + Radix UI components
- Real-time WebSocket communication
- Firebase authentication
- Responsive design

### Database Schema
- Users, Projects, ProjectFiles tables
- Analysis results storage
- Chat messages and logs
- Session management

## Recent Changes
- 2024-06-24: Successfully migrated from Replit Agent to Replit environment
- Fixed PostgreSQL database connection and created all required tables
- Made OpenAI service optional to prevent startup crashes
- Added Firebase authentication credentials
- Implemented tiered account system (Free Trial vs Pro)
- Added credit management and account upgrade functionality
- Created AI-powered schema modification system
- Implemented Stripe payment gateway with tiered pricing ($39/month Pro)
- Created Project Chimera Python ML integration (surveyor.py, foreman.py, pipeline.py)
- Added AI-to-Chimera command translation for automated code transformation
- Built subscription management with monthly/quarterly/annual billing
- Fixed Firebase authentication by switching to popup-based sign-in
- Updated comprehensive README with complete platform overview and value proposition
- Application running successfully on port 5000

## User Preferences
- Wants tiered account structure with free trial (1 credit) and pro accounts
- Prefers AI-driven schema modifications through natural language
- Values comprehensive documentation for development team
- Needs Firebase domain authorization fix for authentication to work

## Current Status
✅ Application fully functional with tiered account system
✅ Database schema complete with user credit management  
✅ Authentication system with Firebase integration (requires domain authorization)
✅ Credit-based project creation (Free: 1 credit, Pro: unlimited)
✅ Stripe payment gateway with tiered pricing ($39/month Pro)
✅ AI-powered schema modification (requires OPENAI_API_KEY for full functionality)
✅ Project Chimera Python ML integration complete
✅ AI-to-Chimera command translation working
✅ Account upgrade system with subscription management
✅ Firebase setup helper integrated for domain authorization
✅ Comprehensive developer documentation created
✅ Complete Project Chimera workflow implementation per PDF specifications
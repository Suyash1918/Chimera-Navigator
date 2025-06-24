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
- 2024-01-24: Successfully migrated from Replit Agent to Replit environment
- Fixed PostgreSQL database connection
- Made OpenAI service optional to prevent startup crashes
- Added Firebase authentication credentials
- Application now running on port 5000

## User Preferences
- None specified yet

## Current Status
✅ Application successfully running and ready for use
✅ Database configured and connected
✅ Authentication system active
✅ AI features available (requires OPENAI_API_KEY for full functionality)
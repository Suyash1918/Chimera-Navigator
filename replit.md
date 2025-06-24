# ChimeraNavigator AI - Code Analysis Platform

## Overview

ChimeraNavigator AI is a full-stack web application designed to analyze React, TypeScript, and JavaScript projects. The platform provides AST (Abstract Syntax Tree) analysis, React hooks optimization, import dependency mapping, and AI-powered code insights through an interactive chat interface.

## System Architecture

The application follows a monorepo structure with a clear separation of concerns:

- **Frontend**: React-based SPA built with Vite
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSocket for AI chat functionality
- **Authentication**: Firebase Authentication
- **UI Framework**: shadcn/ui with Tailwind CSS

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Authentication**: Firebase Auth with Google OAuth

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle with PostgreSQL dialect
- **Real-time**: WebSocket server for AI chat functionality
- **AI Integration**: OpenAI GPT-4o for code analysis and chat responses
- **File Processing**: Custom AST parsing for React/TypeScript files

### Database Schema
The application uses PostgreSQL with the following core entities:
- **Users**: Firebase UID integration with profile data
- **Projects**: User-owned code analysis projects
- **Project Files**: Uploaded source code files with metadata
- **Analysis Results**: Parsed AST data, hooks, imports, and dependencies
- **AI Chats**: Conversation history with context-aware responses
- **Logs**: System and processing logs for debugging

## Data Flow

1. **Authentication**: Users authenticate via Firebase Google OAuth
2. **Project Creation**: Users create projects and upload React/TypeScript files
3. **File Processing**: Backend parses files to extract AST, hooks, and dependencies
4. **Analysis Storage**: Results are stored in PostgreSQL for retrieval
5. **AI Chat**: Real-time WebSocket connection enables context-aware AI assistance
6. **Visualization**: Frontend renders analysis results through interactive components

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **firebase**: Authentication and user management
- **openai**: AI-powered code analysis and chat
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives

### Development Tools
- **vite**: Fast development server and build tool
- **typescript**: Type safety and enhanced development experience
- **tailwindcss**: Utility-first CSS framework
- **drizzle-kit**: Database migration and schema management

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

- **Environment**: Node.js 20 with PostgreSQL 16
- **Build Process**: Vite builds the client, esbuild bundles the server
- **Production Command**: Serves static files and API from a single Express server
- **Development**: Hot reloading with Vite middleware integration
- **Port Configuration**: Runs on port 5000 (internal) mapped to port 80 (external)

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API access for AI features
- `VITE_FIREBASE_*`: Firebase configuration for authentication

## Recent Changes

- June 24, 2025: Complete ChimeraNavigator AI platform setup
  ✓ Database schema with PostgreSQL and Drizzle ORM
  ✓ Firebase authentication with Google OAuth
  ✓ OpenAI GPT-4o integration for code analysis
  ✓ React/TypeScript frontend with shadcn/ui
  ✓ WebSocket real-time AI chat functionality
  ✓ File upload and project management system
  ✓ AST analysis and hooks detection framework
  ✓ Project dashboard with analysis visualization

## Changelog

- June 24, 2025: Initial setup and full platform deployment

## User Preferences

Preferred communication style: Simple, everyday language.
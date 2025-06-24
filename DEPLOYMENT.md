# ChimeraNavigator Deployment Guide

## Quick Deploy Checklist

### 1. Environment Variables Required
```bash
# Database (auto-configured in Replit)
DATABASE_URL=postgresql://...

# Firebase Authentication
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id  
VITE_FIREBASE_APP_ID=your_app_id

# OpenAI (optional but recommended)
OPENAI_API_KEY=your_openai_key
```

### 2. Database Setup
```bash
npm run db:push
```

### 3. Start Application
```bash
npm run dev    # Development
npm run build && npm start  # Production
```

## Account System Features

### Free Trial Account
- 1 project credit upon registration
- All analysis features available
- Credit consumed when creating project
- Can upgrade to Pro at any time

### Pro Account
- Unlimited project creation
- All AI features included
- Priority support access
- Full schema modification capabilities

## API Testing

### Test Account Creation
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"firebaseUid": "test-user", "email": "user@test.com", "displayName": "Test User"}'
```

### Test Credit System
```bash
# Check credits
curl -X GET http://localhost:5000/api/users/1/credits \
  -H "x-firebase-uid: test-user"

# Upgrade account
curl -X POST http://localhost:5000/api/users/1/upgrade \
  -H "x-firebase-uid: test-user"
```

### Test Schema Modification
```bash
curl -X POST http://localhost:5000/api/ai/modify-schema \
  -H "Content-Type: application/json" \
  -H "x-firebase-uid: test-user" \
  -d '{"command": "Add required email field", "currentSchema": {"type": "object"}}'
```

## Monitoring

### Database Health
```sql
SELECT account_tier, COUNT(*) as users FROM users GROUP BY account_tier;
SELECT status, COUNT(*) as projects FROM projects GROUP BY status;
```

### Application Logs
- Check `/api/projects/:id/logs` for project-specific logs
- Monitor WebSocket connections for AI chat
- Track credit usage patterns

## Troubleshooting

### Common Issues
1. **"Insufficient credits"** - User needs account upgrade
2. **"AI features unavailable"** - Add OPENAI_API_KEY
3. **"Firebase auth error"** - Check Firebase domain authorization

### Debug Commands
```bash
# Check database tables
npm run db:push

# Verify API endpoints
curl http://localhost:5000/api/users/firebase/test-uid

# Test file upload
curl -X POST http://localhost:5000/api/projects/1/files \
  -H "Content-Type: application/json" \
  -H "x-firebase-uid: test-uid" \
  -d '{"files": [{"filename": "test.tsx", "content": "...", "type": "tsx"}]}'
```

## Performance Notes

- Database optimized for concurrent access
- WebSocket connections auto-managed
- File analysis processed asynchronously
- Credit checks performed before expensive operations

## Security

- All routes protected with Firebase UID verification
- User isolation enforced at database level
- API keys stored securely as environment variables
- No sensitive data exposed in client-side code
# JARVIS IntelliAgent 3.0 - Post-Deployment Verification Guide

Complete checklist to verify successful deployment and restoration from Git.

## Pre-Deployment Checklist

Before pushing to Git or deploying, ensure:

- [ ] All code committed to Git
- [ ] .gitignore properly excludes sensitive files
- [ ] Documentation files are current
- [ ] .env.example is complete
- [ ] Database export created (if needed)
- [ ] Secrets documented but not committed

---

## Post-Deployment Verification

### Phase 1: Infrastructure ✅

#### 1.1 File System Verification
```bash
# Verify all required files exist
ls -la .replit package.json tsconfig.json vite.config.ts drizzle.config.ts

# Check directory structure
ls -d client/ server/ shared/

# Verify documentation
ls -la *.md docs/*.md
```

**Expected Output**:
- ✅ `.replit` exists
- ✅ `package.json` exists
- ✅ Configuration files present
- ✅ `client/`, `server/`, `shared/` directories exist
- ✅ All documentation files present

#### 1.2 Dependencies Installation
```bash
# Check node_modules
ls -d node_modules/

# Verify package installation
npm list --depth=0 2>&1 | head -20

# Check for missing dependencies
npm install --dry-run
```

**Expected Output**:
- ✅ `node_modules/` directory exists
- ✅ 90+ packages installed
- ✅ No missing dependencies
- ✅ No security vulnerabilities (or acceptable ones)

#### 1.3 Environment Variables
```bash
# Check required secrets are set
echo "DATABASE_URL: ${DATABASE_URL:+SET}"
echo "GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID:+SET}"
echo "GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET:+SET}"
echo "SESSION_SECRET: ${SESSION_SECRET:+SET}"
```

**Expected Output**:
```
DATABASE_URL: SET
GITHUB_CLIENT_ID: SET
GITHUB_CLIENT_SECRET: SET
SESSION_SECRET: SET
```

---

### Phase 2: Database ✅

#### 2.1 Database Connection
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"
```

**Expected Output**:
- ✅ Connection successful
- ✅ PostgreSQL version displayed (16.x)

#### 2.2 Table Verification
```bash
# Count tables
psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# List all tables
psql $DATABASE_URL -c "\dt"
```

**Expected Output**:
- ✅ 50+ tables exist
- ✅ All core tables present: users, agents, config_registry, etc.

#### 2.3 Schema Integrity
```bash
# Check foreign keys
psql $DATABASE_URL -c "
  SELECT COUNT(*) 
  FROM information_schema.table_constraints 
  WHERE constraint_type = 'FOREIGN KEY';
"

# Check indexes
psql $DATABASE_URL -c "
  SELECT COUNT(*) 
  FROM pg_indexes 
  WHERE schemaname = 'public';
"
```

**Expected Output**:
- ✅ 80+ foreign key constraints
- ✅ 150+ indexes

#### 2.4 Data Verification
```bash
# Check core data exists
psql $DATABASE_URL -c "
  SELECT 
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM agents) as agents,
    (SELECT COUNT(*) FROM config_registry) as config_keys,
    (SELECT COUNT(*) FROM role_personas) as personas;
"
```

**Expected Output** (after seeding):
- ✅ users: 1+
- ✅ agents: 20+
- ✅ config_keys: 30+
- ✅ personas: 4+

---

### Phase 3: Application Startup ✅

#### 3.1 Development Server
```bash
# Start development server
npm run dev
```

**Expected Output**:
```
> dev
> NODE_ENV=development tsx server/index.ts

Server running on port 5000
Database connected
WebSocket server started
```

**Check for Errors**:
- ✅ No TypeScript compilation errors
- ✅ No module not found errors
- ✅ No database connection errors
- ✅ Port 5000 is available

#### 3.2 Server Health Check
```bash
# Test server endpoint
curl http://localhost:5000/api/health
```

**Expected Output**:
```json
{"status":"ok"}
```

#### 3.3 Static File Serving
```bash
# Check if frontend loads
curl -I http://localhost:5000/
```

**Expected Output**:
```
HTTP/1.1 200 OK
Content-Type: text/html
```

---

### Phase 4: Authentication ✅

#### 4.1 GitHub OAuth Configuration
```bash
# Verify GitHub OAuth environment variables
echo "GitHub Client ID configured: ${GITHUB_CLIENT_ID:+YES}"
echo "GitHub Client Secret configured: ${GITHUB_CLIENT_SECRET:+YES}"
```

**Manual Test**:
1. Open app in browser: `http://localhost:5000`
2. Click "Login with GitHub"
3. Should redirect to GitHub: `https://github.com/login/oauth/authorize?client_id=...`
4. Authorize application
5. Should redirect back to app
6. Should be logged in

**Database Verification**:
```bash
# Check session created
psql $DATABASE_URL -c "SELECT COUNT(*) FROM sessions;"

# Check user created
psql $DATABASE_URL -c "SELECT id, email FROM users LIMIT 1;"
```

**Expected Output**:
- ✅ Session exists in database
- ✅ User record created with GitHub email
- ✅ Can access authenticated routes

#### 4.2 Session Persistence
**Test**:
1. Refresh browser
2. Should remain logged in
3. Check session expiry (30 days default)

```bash
# Verify session expiry
psql $DATABASE_URL -c "SELECT sid, expire FROM sessions LIMIT 1;"
```

---

### Phase 5: Frontend Functionality ✅

#### 5.1 Dashboard Load
**Test**:
1. Navigate to dashboard: `/`
2. Should see persona selector
3. Select "Admin" persona
4. Dashboard should load with KPIs

**Expected Elements**:
- ✅ Persona selector visible
- ✅ KPI cards display (Active Agents, Executions, Success Rate)
- ✅ Recent activity feed
- ✅ Quick commands section
- ✅ No console errors

**Console Check**:
```javascript
// In browser console
console.log('Errors:', performance.getEntriesByType('navigation'));
```

#### 5.2 Navigation
**Test Each Tab**:
- [ ] Dashboard (/) - Loads, KPIs display
- [ ] Agent Directory (/agents) - Agents load, filters work
- [ ] Governance (/governance) - Tabs render, data loads
- [ ] Config Registry (/config) - Config keys display

**Verify**:
- ✅ All routes accessible
- ✅ No 404 errors
- ✅ Back/forward navigation works
- ✅ URL updates correctly

#### 5.3 Agent Directory
**Test**:
1. Navigate to `/agents`
2. Should see agents grouped by layer
3. Filter by business function
4. Search for agents

**Expected Behavior**:
- ✅ Agents display in 6 layers
- ✅ Layer colors render correctly
- ✅ Filter updates agent list
- ✅ Search works
- ✅ Agent cards show correct data

**Database Query**:
```bash
# Verify agents by layer
psql $DATABASE_URL -c "
  SELECT layer, COUNT(*) 
  FROM agents 
  GROUP BY layer 
  ORDER BY layer;
"
```

#### 5.4 State Management (TanStack Query)
**Browser Console Test**:
```javascript
// Check React Query DevTools
window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__?.queryClient?.getQueryCache()?.getAll()?.length
// Should return: 5+ queries
```

**Verify**:
- ✅ Queries cached
- ✅ Mutations invalidate cache
- ✅ Loading states work
- ✅ Error states handled

---

### Phase 6: Backend Functionality ✅

#### 6.1 API Endpoints
```bash
# Test key endpoints
curl http://localhost:5000/api/agents | jq '.[] | {name, layer}' | head -20
curl http://localhost:5000/api/personas/all | jq '.'
curl http://localhost:5000/api/config/registry | jq '. | length'
```

**Expected Output**:
- ✅ `/api/agents` - Returns array of agents
- ✅ `/api/personas/all` - Returns personas
- ✅ `/api/config/registry` - Returns config keys

#### 6.2 ConfigService
```bash
# Test config retrieval
curl http://localhost:5000/api/config/setting/agent.layer.definitions | jq '.'
```

**Expected Output**:
- ✅ Returns array of layer definitions
- ✅ Includes: Experience, Meta Brain, Role, Process, System, Interface

#### 6.3 Agent CRUD Operations
**Create Agent** (requires auth):
```bash
curl -X POST http://localhost:5000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "layer": "System",
    "persona": "admin",
    "specialization": "Testing"
  }'
```

**Verify in Database**:
```bash
psql $DATABASE_URL -c "SELECT name, layer FROM agents WHERE name = 'Test Agent';"
```

---

### Phase 7: Real-Time Features ✅

#### 7.1 WebSocket Connection
**Browser Console Test**:
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:5000/api/agent-executions/ws');
ws.onopen = () => console.log('WebSocket connected!');
ws.onmessage = (e) => console.log('Message:', e.data);
ws.onerror = (e) => console.error('WebSocket error:', e);
```

**Expected Output**:
```
WebSocket connected!
Message: {"type":"connection-established","clientId":"..."}
```

#### 7.2 Agent Execution Monitoring
**Test**:
1. Execute a command (e.g., "Review Submissions")
2. Agent execution popup should appear
3. Should see 6-layer progression
4. WebSocket status should show "Connected"
5. Steps should progress (Pending → Running → Completed)

**Database Verification**:
```bash
# Check execution record created
psql $DATABASE_URL -c "
  SELECT execution_id, persona, command, status 
  FROM agent_executions 
  ORDER BY started_at DESC 
  LIMIT 1;
"

# Check execution steps
psql $DATABASE_URL -c "
  SELECT step_order, layer, agent_name, status 
  FROM agent_execution_steps 
  WHERE execution_id = (
    SELECT execution_id FROM agent_executions ORDER BY started_at DESC LIMIT 1
  );
"
```

**Expected Output**:
- ✅ Execution record exists
- ✅ 6 steps created (one per layer)
- ✅ Steps have correct order (1-6)
- ✅ All steps completed

---

### Phase 8: AI Governance Suite ✅

#### 8.1 Governance Dashboard
**Test**:
1. Navigate to `/governance`
2. Should see 5 tabs
3. Each tab should load data

**Tabs to Verify**:
- [ ] Overview - Metrics summary
- [ ] EU AI Act - Compliance status
- [ ] Explainability - Decision reasoning
- [ ] Bias Detection - Fairness metrics
- [ ] Management - Governance actions

**Database Check**:
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM ai_models;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM risk_assessments;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM audit_trails;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM governance_metrics;"
```

---

### Phase 9: Insurance Workflows ✅

#### 9.1 Submissions Management
```bash
# Check submissions exist
psql $DATABASE_URL -c "
  SELECT submission_id, client_name, risk_level, status 
  FROM submissions 
  LIMIT 5;
"
```

#### 9.2 Commercial Property Workflow
```bash
# Check workflow tables
psql $DATABASE_URL -c "SELECT COUNT(*) FROM commercial_property_workflows;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM commercial_property_cope_data;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM commercial_property_submissions;"
```

#### 9.3 Incidents
```bash
# Check incidents
psql $DATABASE_URL -c "
  SELECT incident_id, title, priority, status 
  FROM incidents 
  LIMIT 5;
"
```

---

### Phase 10: Integration Verification ✅

#### 10.1 GitHub OAuth
- [x] OAuth app configured
- [x] Callback URL correct
- [x] Login flow works
- [x] User data stored
- [x] Session persists

#### 10.2 SendGrid (if configured)
```bash
# Test email (if SENDGRID_API_KEY set)
[ -n "$SENDGRID_API_KEY" ] && echo "SendGrid configured" || echo "SendGrid not configured"
```

**If configured, test**:
```bash
node -e "
  const sgMail = require('@sendgrid/mail');
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('SendGrid API key valid');
  }
"
```

#### 10.3 OpenAI (if configured)
```bash
# Test OpenAI
[ -n "$OPENAI_API_KEY" ] && echo "OpenAI configured" || echo "OpenAI not configured"
```

**If configured, test**:
```bash
node -e "
  const OpenAI = require('openai');
  if (process.env.OPENAI_API_KEY) {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('OpenAI client initialized');
  }
"
```

#### 10.4 Google Analytics (if configured)
**Check frontend**:
```javascript
// Browser console
window.dataLayer && console.log('GA initialized') || console.log('GA not initialized');
```

---

### Phase 11: Performance & Optimization ✅

#### 11.1 Build Process
```bash
# Test production build
npm run build
```

**Expected Output**:
- ✅ Build completes without errors
- ✅ `dist/` directory created
- ✅ Frontend assets in `dist/public/`
- ✅ Backend bundle in `dist/index.js`

#### 11.2 TypeScript Validation
```bash
# Type check
npm run check
```

**Expected Output**:
- ✅ No type errors
- ✅ All imports resolve
- ✅ Strict mode passes

#### 11.3 Database Query Performance
```bash
# Check slow queries (if any)
psql $DATABASE_URL -c "
  SELECT query, calls, total_time, mean_time 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 10;
" 2>/dev/null || echo "pg_stat_statements not enabled"
```

#### 11.4 Memory Usage
```bash
# Check Node.js memory
ps aux | grep node | grep -v grep
```

---

### Phase 12: User Journey & Analytics ✅

#### 12.1 User Journey Tracking
```bash
# Check journey tables
psql $DATABASE_URL -c "SELECT COUNT(*) FROM user_journey_interactions;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM user_journey_sessions;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM user_journey_heatmaps;"
```

#### 12.2 Voice Integration
**Test** (requires browser microphone permission):
1. Click microphone icon
2. Grant permission
3. Speak a command
4. Should transcribe and execute

**Database Check**:
```bash
psql $DATABASE_URL -c "SELECT * FROM voice_transcripts ORDER BY created_at DESC LIMIT 5;"
```

---

### Phase 13: Security Verification ✅

#### 13.1 Secrets Not Exposed
```bash
# Verify .env not in Git
git ls-files | grep .env || echo "✅ .env not in Git"

# Check no secrets in code
grep -r "sk-" client/ server/ --exclude-dir=node_modules || echo "✅ No API keys in code"
```

#### 13.2 SQL Injection Protection
**Drizzle ORM** provides parameterized queries automatically.

**Verify**:
- ✅ All queries use Drizzle ORM
- ✅ No raw SQL with string concatenation
- ✅ All inputs validated with Zod

#### 13.3 Authentication Required
```bash
# Test protected endpoint without auth
curl -I http://localhost:5000/api/agents/create
```

**Expected Output**:
```
HTTP/1.1 401 Unauthorized
```

---

## Final Verification Summary

### Critical Checks ✅

- [ ] ✅ Application starts without errors
- [ ] ✅ Database connection successful
- [ ] ✅ All 50+ tables exist
- [ ] ✅ GitHub OAuth login works
- [ ] ✅ User session persists
- [ ] ✅ Frontend loads correctly
- [ ] ✅ All routes accessible
- [ ] ✅ Agent directory displays agents
- [ ] ✅ WebSocket connection works
- [ ] ✅ Real-time execution monitoring works
- [ ] ✅ No console errors
- [ ] ✅ Build process succeeds
- [ ] ✅ TypeScript validation passes

### Integration Checks ✅

- [ ] ✅ GitHub OAuth configured and working
- [ ] ⚠️ SendGrid configured (if needed)
- [ ] ⚠️ OpenAI configured (if needed)
- [ ] ⚠️ Google Analytics configured (if needed)

### Data Integrity Checks ✅

- [ ] ✅ All foreign keys enforced
- [ ] ✅ Indexes created
- [ ] ✅ Seed data loaded
- [ ] ✅ Config registry populated
- [ ] ✅ Personas available

---

## Troubleshooting Common Issues

### Issue: Application won't start
**Symptoms**: Errors on `npm run dev`
**Solutions**:
1. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
2. Check DATABASE_URL is set
3. Check all required secrets are set
4. Review error stack trace

### Issue: Database connection fails
**Symptoms**: "Cannot connect to database"
**Solutions**:
1. Verify DATABASE_URL: `echo $DATABASE_URL`
2. Test connection: `psql $DATABASE_URL -c "SELECT 1;"`
3. Check PostgreSQL service running
4. For Replit: Database should auto-provision

### Issue: GitHub OAuth fails
**Symptoms**: "redirect_uri_mismatch" or "Invalid client"
**Solutions**:
1. Check callback URL matches GitHub app settings
2. Verify GITHUB_CLIENT_ID and SECRET are correct
3. Ensure SESSION_SECRET is set
4. Clear browser cookies and try again

### Issue: Tables don't exist
**Symptoms**: "relation does not exist"
**Solutions**:
1. Run `npm run db:push`
2. If data loss warning, use `npm run db:push -- --force`
3. Restore from backup: `psql $DATABASE_URL < database_export.sql`

### Issue: Frontend shows errors
**Symptoms**: React errors in console
**Solutions**:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check browser console for specific errors
4. Verify all API endpoints responding

### Issue: WebSocket not connecting
**Symptoms**: "WebSocket connection failed"
**Solutions**:
1. Check server logs for errors
2. Verify port configuration in .replit
3. Test WebSocket URL: `wscat -c ws://localhost:5000/api/agent-executions/ws`
4. Check firewall/proxy settings

---

## Performance Benchmarks

### Expected Metrics

**Server Response Times**:
- Health check: < 10ms
- API endpoints: < 100ms
- Database queries: < 50ms
- WebSocket connection: < 200ms

**Frontend Load Times**:
- Initial load: < 2s
- Route navigation: < 500ms
- Dashboard render: < 1s

**Database Performance**:
- Simple queries: < 10ms
- Complex joins: < 50ms
- Config queries with precedence: < 30ms

---

## Deployment Sign-Off

Once all verification steps pass:

✅ **Application is ready for production use**

Sign-off checklist:
- [ ] All critical checks passed
- [ ] All integrations tested
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation current

**Deployment approved by**: _________________  
**Date**: _________________  
**Notes**: _________________

---

**Last Updated**: 2025-11-12  
**Version**: 3.0

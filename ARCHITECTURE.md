# JARVIS IntelliAgent 3.0 - Architecture Documentation

Complete technical architecture documentation covering frontend, backend, database, and system design.

## Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Database Architecture](#database-architecture)
5. [6-Layer Agent System](#6-layer-agent-system)
6. [Configuration System](#configuration-system)
7. [Authentication & Security](#authentication--security)
8. [Real-Time Communication](#real-time-communication)
9. [Data Flow](#data-flow)
10. [Integration Points](#integration-points)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│  React 18 + TypeScript + Tailwind CSS + shadcn/ui         │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────┐    │
│  │   Routing   │  │   State    │  │   Components     │    │
│  │   Wouter    │  │  TanStack  │  │ Universal Prefix │    │
│  │             │  │   Query    │  │   Radix UI       │    │
│  └─────────────┘  └────────────┘  └──────────────────┘    │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/WebSocket
┌────────────────────────────┴────────────────────────────────┐
│                     Server (Node.js)                        │
│  Express + TypeScript + Drizzle ORM                        │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │    API     │  │   Services   │  │   WebSocket     │    │
│  │   Routes   │  │ ConfigService│  │   Real-time     │    │
│  │            │  │ Orchestration│  │   Monitoring    │    │
│  └────────────┘  └──────────────┘  └─────────────────┘    │
└────────────────────────────┬────────────────────────────────┘
                             │ SQL
┌────────────────────────────┴────────────────────────────────┐
│              Database (PostgreSQL)                          │
│  Neon Serverless PostgreSQL + Drizzle ORM                  │
│  50+ Tables: Agents, Config, Users, Workflows, Governance  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, TypeScript, Vite, Wouter, TanStack Query |
| **UI Framework** | Tailwind CSS, shadcn/ui, Radix UI, Framer Motion |
| **Backend** | Node.js 20, Express.js, TypeScript |
| **Database** | PostgreSQL 16, Drizzle ORM |
| **Authentication** | passport-github2 (OAuth 2.0) |
| **Real-Time** | WebSocket (ws library) |
| **Integrations** | OpenAI, SendGrid, Google Analytics |
| **Build Tools** | Vite, esbuild, TypeScript Compiler |

---

## Frontend Architecture

### Directory Structure

```
client/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui base components
│   │   ├── Universal*.tsx  # Shared multi-persona components
│   │   ├── *Modal.tsx      # Modal dialogs
│   │   └── *.tsx           # Feature components
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── usePersona.tsx  # Persona context
│   │   ├── use-toast.ts    # Toast notifications
│   │   └── *.ts            # Feature-specific hooks
│   │
│   ├── lib/                # Utilities
│   │   ├── queryClient.ts  # TanStack Query config
│   │   ├── personaColors.ts# Persona theming
│   │   ├── stringUtils.ts  # String normalization
│   │   └── utils.ts        # General utilities
│   │
│   ├── pages/              # Wouter route pages
│   │   ├── Dashboard.tsx   # Multi-persona dashboard
│   │   ├── AgentDirectory.tsx
│   │   ├── Governance.tsx  # AI Governance Suite
│   │   └── *.tsx           # Other pages
│   │
│   ├── App.tsx             # Main application component
│   └── main.tsx            # Entry point
│
└── index.html              # HTML template
```

### Routing (Wouter)

```tsx
// client/src/App.tsx
import { Route, Switch } from "wouter";

function App() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/agents" component={AgentDirectory} />
      <Route path="/governance" component={Governance} />
      <Route path="/config" component={ConfigRegistry} />
      <Route component={NotFound} />
    </Switch>
  );
}
```

**Key Features**:
- Client-side routing (no page reloads)
- `Link` component for navigation
- `useLocation` hook for current route
- Nested routing support

### State Management (TanStack Query)

```tsx
// Data fetching pattern
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

// Query example
const { data: agents, isLoading } = useQuery({
  queryKey: ['/api/agents'],
  // queryFn auto-configured in queryClient.ts
});

// Mutation example
const createAgent = useMutation({
  mutationFn: (agent) => 
    apiRequest('/api/agents', { method: 'POST', body: agent }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
  }
});
```

**Key Patterns**:
- Queries for data fetching (GET requests)
- Mutations for data modification (POST/PATCH/DELETE)
- Cache invalidation after mutations
- Array-based query keys for hierarchy: `['/api/recipes', id]`
- Loading and error states via `.isLoading` and `.error`

### Component Patterns

#### Universal Components

Components prefixed with "Universal" are reusable across all personas:

```tsx
// UniversalAgentExecutionPopup.tsx
export function UniversalAgentExecutionPopup({ 
  executionId, 
  persona 
}: Props) {
  const { execution, steps, isConnected } = useAgentExecution(executionId);
  
  return (
    <Dialog>
      {/* 6-layer visualization */}
      {steps.map((step) => (
        <StepCard 
          key={step.id} 
          layer={step.layer}
          status={step.status}
          persona={persona}
        />
      ))}
    </Dialog>
  );
}
```

**Benefits**:
- Consistent UI across personas
- Single source of truth
- Easier maintenance
- Theme-aware via persona colors

#### Form Handling (react-hook-form + Zod)

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAgentSchema } from "@shared/schema";

function AgentForm() {
  const form = useForm({
    resolver: zodResolver(insertAgentSchema),
    defaultValues: {
      name: "",
      layer: "System",
      persona: "admin"
    }
  });

  const onSubmit = async (data) => {
    await createAgent.mutateAsync(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField name="name" />
        <FormField name="layer" />
        <Button type="submit">Create Agent</Button>
      </form>
    </Form>
  );
}
```

### Styling & Theming

**Tailwind CSS Configuration**:
```typescript
// tailwind.config.ts
export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // HSL color variables
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Persona colors from ConfigService
      }
    }
  }
}
```

**Persona Color Schemes**:
```tsx
// Dynamic persona colors from ConfigService
const { personaColors } = usePersonaColorSchemes();

const adminColors = personaColors.admin;
// {
//   primary: "#3b82f6",
//   secondary: "#1e40af",
//   accent: "#60a5fa",
//   background: "#0f172a",
//   glassmorphism: "rgba(15, 23, 42, 0.7)"
// }
```

---

## Backend Architecture

### Directory Structure

```
server/
├── services/                # Business logic services
│   ├── openAIService.ts    # OpenAI integration
│   └── *.ts                # Other services
│
├── index.ts                 # Express server entry
├── routes.ts                # API route definitions
├── storage.ts               # Database abstraction (IStorage)
├── db.ts                    # Drizzle DB connection
├── replitAuth.ts            # GitHub OAuth authentication
├── configService.ts         # Configuration management
├── agentOrchestrationService.ts  # Agent execution
├── intelligentEmailAgents.ts     # Email processing
└── *.ts                     # Seed data and utilities
```

### Express Server (index.ts)

```typescript
import express from "express";
import session from "express-session";
import passport from "passport";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { setupAuth } from "./replitAuth";
import { registerRoutes } from "./routes";

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session management
app.use(session({
  store: new PostgreSQLStore({ connectionString: DATABASE_URL }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));

// Authentication
setupAuth(app);

// API routes
registerRoutes(app);

// WebSocket for real-time monitoring
const wss = new WebSocketServer({ server, path: '/api/agent-executions/ws' });

// Vite dev server (development) or static files (production)
if (NODE_ENV === "production") {
  app.use(express.static("dist/public"));
} else {
  // Vite dev server via vite.ts
}

server.listen(5000);
```

### API Routes (routes.ts)

**Route Organization**:
```typescript
export function registerRoutes(app: Express) {
  // Authentication
  app.get("/api/user", requireAuth, getUser);
  app.post("/api/logout", logout);
  
  // Agents
  app.get("/api/agents", getAgents);
  app.post("/api/agents", requireAuth, createAgent);
  app.patch("/api/agents/:id", requireAuth, updateAgent);
  app.delete("/api/agents/:id", requireAuth, deleteAgent);
  
  // Personas
  app.get("/api/personas/all", getPersonas);
  app.post("/api/personas/register", requireAuth, registerPersona);
  
  // Config
  app.get("/api/config/registry", getConfigRegistry);
  app.get("/api/config/setting/:key", getConfigSetting);
  app.post("/api/config/setting", requireAuth, setConfigSetting);
  
  // Executions
  app.post("/api/agent-executions", requireAuth, createExecution);
  app.get("/api/agent-executions", getExecutions);
  
  // ... 75+ total endpoints
}
```

**Route Pattern**:
- Thin routes (minimal logic)
- Validation via Zod schemas
- Storage interface for DB operations
- Error handling middleware

### Storage Abstraction (storage.ts)

**Interface Definition**:
```typescript
export interface IStorage {
  // Agent operations
  createAgent(agent: InsertAgent): Promise<Agent>;
  getAgents(): Promise<Agent[]>;
  getAgentById(id: number): Promise<Agent | undefined>;
  updateAgent(id: number, updates: Partial<InsertAgent>): Promise<Agent>;
  deleteAgent(id: number): Promise<void>;
  
  // Config operations
  getConfigValue(key: string, scope?: ScopeIdentifiers): Promise<ConfigValue>;
  setConfigValue(config: InsertConfigValue): Promise<ConfigValue>;
  
  // ... 100+ methods
}
```

**Implementation** (DatabaseStorage):
```typescript
export class DatabaseStorage implements IStorage {
  async createAgent(agent: InsertAgent): Promise<Agent> {
    const [result] = await db.insert(agents).values(agent).returning();
    return result;
  }
  
  async getAgents(): Promise<Agent[]> {
    return await db.select().from(agents).orderBy(agents.layer, agents.name);
  }
  
  // ... all interface methods implemented
}

export const storage = new DatabaseStorage();
```

**Benefits**:
- Decouples routes from database
- Easy to test (mock IStorage)
- Consistent error handling
- Type-safe operations

### Services

#### ConfigService

Configuration management with scope precedence and effective dating:

```typescript
export class ConfigService {
  private cache = new LRUCache<string, any>({ max: 1000 });
  
  async getSetting(key: string, scope?: ScopeIdentifiers): Promise<any> {
    // Check cache first
    const cacheKey = this.getCacheKey(key, scope);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Query with scope precedence: workflow > agent > persona > global
    const value = await this.queryWithPrecedence(key, scope);
    this.cache.set(cacheKey, value);
    return value;
  }
  
  async setSetting(key: string, value: any, scope?: ScopeIdentifiers): Promise<void> {
    // Create config value with versioning
    await storage.setConfigValue({ key, value, scope });
    
    // Log change for audit
    await storage.logConfigChange({ key, oldValue, newValue, performedBy });
    
    // Invalidate cache
    this.clearCache(key);
  }
  
  // Snapshot management
  async createSnapshot(name: string): Promise<ConfigSnapshot> { /*...*/ }
  async restoreFromSnapshot(snapshotId: number): Promise<void> { /*...*/ }
  
  // Change history
  async getChangeHistory(key: string): Promise<ConfigChangeLog[]> { /*...*/ }
}

export const configService = new ConfigService();
```

#### AgentOrchestrationService

Manages multi-agent workflow execution:

```typescript
export class AgentOrchestrationService {
  private executionListeners = new Map<string, Function[]>();
  
  subscribeToExecution(executionId: string, callback: Function) {
    if (!this.executionListeners.has(executionId)) {
      this.executionListeners.set(executionId, []);
    }
    this.executionListeners.get(executionId)!.push(callback);
  }
  
  emitExecutionUpdate(executionId: string, update: any) {
    const listeners = this.executionListeners.get(executionId) || [];
    listeners.forEach(callback => callback(update));
  }
  
  async executeWorkflow(command: string, persona: string): Promise<string> {
    // Create execution record
    const execution = await storage.createAgentExecution({
      persona,
      command,
      status: 'running'
    });
    
    // Emit start event
    this.emitExecutionUpdate(execution.executionId, {
      type: 'execution_started',
      executionId: execution.executionId
    });
    
    // Execute layers sequentially
    for (const layer of LAYERS) {
      const agents = await this.getAgentsForLayer(layer, persona);
      await this.executeLayer(execution.executionId, layer, agents);
    }
    
    return execution.executionId;
  }
}
```

---

## Database Architecture

### Schema Overview (50+ Tables)

**Core Entity Tables**:
- `users`, `user_profiles`, `user_preferences`, `user_sessions`
- `agents`, `agent_versions`, `agent_executions`, `agent_execution_steps`
- `role_personas`, `commands`, `activities`, `emails`

**Configuration Tables**:
- `config_registry`, `config_values`, `config_snapshots`, `config_change_logs`
- `business_rules`, `templates`

**Insurance Domain Tables**:
- `submissions`, `incidents`
- `commercial_property_workflows`, `commercial_property_submissions`, `commercial_property_cope_data`

**Governance Tables**:
- `ai_models`, `risk_assessments`, `audit_trails`, `governance_metrics`

**Metadata UI Tables**:
- `form_field_definitions`, `form_templates`, `ui_component_registry`
- `tab_configurations`, `hierarchy_layer_configurations`, `component_feature_configurations`

**Analytics Tables**:
- `user_journey_interactions`, `user_journey_sessions`, `user_journey_heatmaps`
- `voice_transcripts`

### Key Schema Patterns

#### Effective Dating

Many tables support temporal queries:

```typescript
export const configValues = pgTable("config_values", {
  id: serial("id").primaryKey(),
  configKey: varchar("config_key").notNull(),
  value: jsonb("value").notNull(),
  effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
  effectiveTo: timestamp("effective_to"),  // null = active indefinitely
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true)
});
```

**Query Pattern**:
```sql
SELECT * FROM config_values 
WHERE config_key = 'agent.capabilities'
  AND is_active = true
  AND effective_from <= NOW()
  AND (effective_to IS NULL OR effective_to > NOW())
ORDER BY version DESC
LIMIT 1;
```

#### Scope-Based Configuration

Supports hierarchical scope precedence:

```typescript
export const configValues = pgTable("config_values", {
  // ...
  scopeIdentifiers: jsonb("scope_identifiers"),  // {persona, agentId, workflowId}
  // Extracted for efficient queries
  persona: varchar("persona"),
  agentId: integer("agent_id"),
  workflowId: integer("workflow_id")
});
```

**Precedence**: workflow > agent > persona > global

#### JSONB for Flexibility

Many tables use JSONB for flexible data:

```typescript
export const agents = pgTable("agents", {
  // ...
  config: jsonb("config"),  // Flexible agent configuration
  personaGenerationConfig: jsonb("persona_generation_config"),
  dashboardTemplate: jsonb("dashboard_template")
});
```

**Benefits**:
- Schema evolution without migrations
- Complex nested data
- Indexed queries via GIN indexes

### Relationships & Constraints

```typescript
// Foreign key example
export const agentExecutionSteps = pgTable("agent_execution_steps", {
  // ...
  executionId: varchar("execution_id").notNull()
    .references(() => agentExecutions.executionId, { onDelete: "cascade" }),
  agentId: integer("agent_id")
    .references(() => agents.id)
});

// Unique constraint example
export const configValues = pgTable("config_values", {
  // ...
}, (table) => [
  unique("config_values_key_version_scope_unique")
    .on(table.configKey, table.version, table.persona, table.agentId, table.workflowId)
]);

// Index example
export const agents = pgTable("agents", {
  // ...
}, (table) => [
  index("idx_agents_layer").on(table.layer),
  index("idx_agents_persona").on(table.persona),
  index("idx_agents_business_function").on(table.businessFunction)
]);
```

### Migrations

**Using Drizzle Kit**:
```bash
# Generate migration from schema changes
drizzle-kit generate

# Push directly to database (no migration files)
npm run db:push

# Force push (data loss warning)
npm run db:push -- --force
```

**Migration files** (auto-generated in `migrations/`):
- SQL DDL statements
- Version tracked
- Drizzle manages state

---

## 6-Layer Agent System

### Layer Architecture

```
┌────────────────────────────────────────────────────┐
│  1. EXPERIENCE LAYER                               │
│  - Insurance company branding                      │
│  - Multi-tenant configuration                      │
│  - Visual customization                            │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│  2. META BRAIN LAYER                               │
│  - Central orchestration                           │
│  - Agent coordination                              │
│  - Workflow management                             │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│  3. ROLE LAYER                                     │
│  - Persona-specific agents                         │
│  - Rachel Thompson (Underwriter)                   │
│  - John Stevens (IT Support)                       │
│  - Can generate dynamic personas                   │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│  4. PROCESS LAYER                                  │
│  - Multi-step workflows                            │
│  - Risk assessment                                 │
│  - Submission processing                           │
│  - Claims workflow                                 │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│  5. SYSTEM LAYER                                   │
│  - Document processing                             │
│  - Data extraction                                 │
│  - Classification                                  │
│  - Security filtering                              │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│  6. INTERFACE LAYER                                │
│  - Voice interface                                 │
│  - API endpoints                                   │
│  - Email processing                                │
│  - External integrations                           │
└────────────────────────────────────────────────────┘
```

### Agent Execution Flow

```typescript
// Sequential execution through layers
async executeWorkflow(command: string, persona: string) {
  const layers = [
    'Experience',
    'Meta Brain',
    'Role',
    'Process',
    'System',
    'Interface'
  ];
  
  for (const layer of layers) {
    const agents = await getAgentsForLayer(layer, persona);
    
    if (agents.length === 1) {
      // Single agent - sequential
      await executeSingleAgent(agents[0]);
    } else if (agents.length > 1) {
      // Multiple agents - parallel
      await Promise.all(agents.map(agent => executeSingleAgent(agent)));
    }
  }
}
```

### Agent Schema

```typescript
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  layer: varchar("layer").notNull(),  // Which layer
  persona: varchar("persona").notNull().default("admin"),
  specialization: varchar("specialization"),
  config: jsonb("config"),  // Agent-specific configuration
  
  // Performance tracking
  cpuUsage: integer("cpu_usage").default(0),
  successRate: decimal("success_rate").default("0"),
  avgResponseTime: integer("avg_response_time").default(0),
  
  // Governance
  maturityLevel: integer("maturity_level").default(1),
  governanceStatus: varchar("governance_status").default("pending"),
  riskLevel: varchar("risk_level").default("medium"),
  
  // Persona generation
  canGeneratePersona: boolean("can_generate_persona").default(false),
  personaGenerationConfig: jsonb("persona_generation_config"),
  
  // Business context
  businessFunction: varchar("business_function"),  // underwriting, claims, etc.
  slaPerformance: decimal("sla_performance"),
  slaStatus: varchar("sla_status").default("green")
});
```

---

## Configuration System

### ConfigService Architecture

**Design Principles**:
1. **No Hard-Coding**: All business logic in database
2. **Scope Precedence**: workflow > agent > persona > global
3. **Effective Dating**: Time-based configuration
4. **Versioning**: Track all changes
5. **Audit Trail**: Complete change history

### Configuration Flow

```
User Action
     ↓
ConfigService.setSetting(key, value, scope)
     ↓
Create new config_values record
     ↓
Log to config_change_logs
     ↓
Invalidate LRU cache
     ↓
Broadcast update (if needed)
```

### Query Precedence

```sql
-- Precedence query (workflow > agent > persona > global)
SELECT value FROM config_values
WHERE config_key = ?
  AND is_active = true
  AND effective_from <= NOW()
  AND (effective_to IS NULL OR effective_to > NOW())
  AND (
    (workflow_id = ? AND agent_id = ? AND persona = ?) OR  -- workflow scope
    (workflow_id IS NULL AND agent_id = ? AND persona = ?) OR  -- agent scope
    (workflow_id IS NULL AND agent_id IS NULL AND persona = ?) OR  -- persona scope
    (workflow_id IS NULL AND agent_id IS NULL AND persona IS NULL)  -- global scope
  )
ORDER BY 
  CASE 
    WHEN workflow_id IS NOT NULL THEN 1
    WHEN agent_id IS NOT NULL THEN 2
    WHEN persona IS NOT NULL THEN 3
    ELSE 4
  END,
  version DESC
LIMIT 1;
```

---

## Authentication & Security

### GitHub OAuth Flow

```
1. User clicks "Login with GitHub"
     ↓
2. Redirect to GitHub authorization
   https://github.com/login/oauth/authorize?client_id=xxx&redirect_uri=xxx
     ↓
3. User authorizes application
     ↓
4. GitHub redirects to callback with code
   https://your-app.com/api/callback?code=xxx
     ↓
5. Exchange code for access token
   POST https://github.com/login/oauth/access_token
     ↓
6. Fetch user profile from GitHub
   GET https://api.github.com/user
     ↓
7. Create/update user in database
     ↓
8. Create session (PostgreSQL-backed)
     ↓
9. Redirect to dashboard
```

### Session Management

```typescript
app.use(session({
  store: new PostgreSQLStore({
    connectionString: DATABASE_URL,
    tableName: 'sessions',
    ttl: 30 * 24 * 60 * 60  // 30 days
  }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));
```

### Authorization Middleware

```typescript
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || req.user.persona !== 'admin') {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}
```

---

## Real-Time Communication

### WebSocket Architecture

```typescript
// Server-side WebSocket setup
const wss = new WebSocketServer({ 
  server, 
  path: '/api/agent-executions/ws' 
});

wss.on('connection', (ws, req) => {
  const clientId = generateId();
  
  ws.send(JSON.stringify({
    type: 'connection-established',
    clientId
  }));
  
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'subscribe-execution') {
      subscribeToExecution(message.executionId, (update) => {
        ws.send(JSON.stringify(update));
      });
    }
  });
});
```

### Client-side WebSocket Hook

```typescript
const useAgentExecution = (executionId: string) => {
  const [execution, setExecution] = useState(null);
  const [steps, setSteps] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/agent-executions/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({
        type: 'subscribe-execution',
        executionId
      }));
    };
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      switch (update.type) {
        case 'execution_started':
          setExecution(update.execution);
          break;
        case 'step_completed':
          setSteps(prev => [...prev, update.step]);
          break;
      }
    };
    
    return () => ws.close();
  }, [executionId]);
  
  return { execution, steps, isConnected };
};
```

---

## Data Flow

### Request/Response Cycle

```
1. User Action (Click button)
     ↓
2. React Event Handler
     ↓
3. TanStack Query Mutation
     ↓
4. apiRequest() → fetch()
     ↓
5. Express Route Handler
     ↓
6. Validation (Zod schema)
     ↓
7. Storage Interface Method
     ↓
8. Drizzle ORM Query
     ↓
9. PostgreSQL Database
     ↓
10. Response → JSON
     ↓
11. TanStack Query Cache Update
     ↓
12. React Component Re-render
```

### Real-Time Update Flow

```
1. Backend Event (Agent completes step)
     ↓
2. AgentOrchestrationService.emitUpdate()
     ↓
3. WebSocket Broadcast
     ↓
4. Client WebSocket.onmessage()
     ↓
5. useAgentExecution Hook Update
     ↓
6. React State Update
     ↓
7. Component Re-render (Real-time UI)
```

---

## Integration Points

### OpenAI Integration

```typescript
import OpenAI from "openai";

export class OpenAIService {
  private client = new OpenAI({ apiKey: OPENAI_API_KEY });
  
  async complete(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });
    
    return response.choices[0].message.content;
  }
}
```

### SendGrid Integration

```typescript
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(SENDGRID_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  await sgMail.send({
    to,
    from: "noreply@jarvis.com",
    subject,
    html
  });
}
```

### Google Analytics Integration

```typescript
// Track events
function trackEvent(category: string, action: string, label?: string) {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label
    });
  }
}
```

---

## Performance Considerations

### Frontend Optimization

- **Code Splitting**: Lazy load pages with React.lazy()
- **Memoization**: useMemo and useCallback for expensive operations
- **Virtual Lists**: For large agent/submission lists
- **Debouncing**: Search inputs debounced (300ms)
- **Image Optimization**: Lazy loading, responsive images

### Backend Optimization

- **Database Indexing**: Strategic indexes on frequently queried columns
- **Connection Pooling**: PostgreSQL connection pool
- **Caching**: LRU cache in ConfigService
- **Pagination**: Limit queries to 50-100 records
- **Query Optimization**: Covering indexes, JOIN optimization

### Database Optimization

- **Indexes**: On foreign keys, frequently filtered columns
- **JSONB Indexes**: GIN indexes for JSONB queries
- **Composite Indexes**: Multi-column indexes for complex queries
- **Partitioning**: Time-based partitioning for large tables (future)

---

## Security Best Practices

1. **Secrets Management**: Environment variables only, never in code
2. **Authentication**: OAuth 2.0 with GitHub
3. **Authorization**: Role-based access control
4. **Input Validation**: Zod schemas on all inputs
5. **SQL Injection Prevention**: Parameterized queries via Drizzle
6. **XSS Prevention**: React auto-escapes, Content Security Policy
7. **CSRF Protection**: SameSite cookies, CSRF tokens
8. **Rate Limiting**: Implement for API endpoints (future)
9. **Audit Logging**: All critical operations logged

---

## Scalability Considerations

### Current Architecture

- **Single Node.js instance** (Replit autoscale)
- **Serverless PostgreSQL** (Neon auto-scales)
- **Stateless application** (sessions in DB)

### Future Scaling

- **Horizontal Scaling**: Load balancer + multiple Node.js instances
- **Database Replication**: Read replicas for queries
- **Caching Layer**: Redis for frequently accessed data
- **Queue System**: BullMQ for background jobs
- **Microservices**: Split into domain services (future)

---

**Last Updated**: 2025-11-12  
**Version**: 3.0

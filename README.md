# JARVIS IntelliAgent 3.0

An AI-powered insurance automation platform featuring a 6-layer agent architecture with multi-persona dashboards, voice/text interactions, real-time agent orchestration, and database-driven configuration.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Local Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd jarvis-intelliagent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Restore database**
   ```bash
   # See DATABASE_SETUP.md for detailed instructions
   psql your_database < database_schema_only.sql
   ```

5. **Push schema to database**
   ```bash
   npm run db:push
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Access the application**
   - Development: `http://localhost:5000`

### Deployment on Replit

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete Replit deployment instructions.

## 📋 Project Overview

### Key Features
- **6-Layer Agent Architecture**: Experience, Meta Brain, Role, Process, System, Interface
- **Multi-Persona Dashboards**: Admin, Rachel Thompson (Underwriter), John Stevens (IT Support), Broker
- **Real-Time Monitoring**: WebSocket-based agent execution tracking
- **AI Governance Suite**: EU AI Act compliance, explainability, bias detection
- **Voice Integration**: Multi-persona voice command processing
- **Configuration-Driven**: Database-driven ConfigService with scope precedence
- **Insurance Workflows**: Commercial property underwriting, claims, policy management

### Technology Stack

**Frontend**
- React 18 + TypeScript
- Wouter (routing)
- TanStack Query (data fetching)
- Tailwind CSS + shadcn/ui
- Radix UI components
- Framer Motion (animations)

**Backend**
- Node.js + Express
- PostgreSQL + Drizzle ORM
- passport-local + bcrypt (authentication)
- WebSocket (real-time updates)
- OpenAI, SendGrid integrations

**Default Login**: username: `admin` / password: `admin`

## 📁 Project Structure

```
jarvis-intelliagent/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # React components (Universal* prefix for shared)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and helpers
│   │   ├── pages/            # Wouter route pages
│   │   └── App.tsx           # Main app component
│   └── index.html            # HTML entry point
│
├── server/                    # Backend Node.js/Express
│   ├── services/             # Business logic services
│   ├── index.ts              # Express server entry
│   ├── routes.ts             # API route definitions
│   ├── storage.ts            # Database abstraction layer
│   ├── db.ts                 # Drizzle database connection
│   ├── replitAuth.ts         # Local username/password authentication
│   ├── configService.ts      # Configuration management
│   └── *.ts                  # Seed data and services
│
├── shared/                    # Shared TypeScript types
│   ├── schema.ts             # Drizzle database schema (50+ tables)
│   └── registry.ts           # Shared type registry
│
├── migrations/                # Database migrations (auto-generated)
├── attached_assets/           # Static assets (images, etc.)
│
├── .replit                    # Replit configuration
├── package.json               # Node.js dependencies
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite bundler configuration
├── drizzle.config.ts          # Drizzle ORM configuration
├── tailwind.config.ts         # Tailwind CSS configuration
│
├── README.md                  # This file
├── DEPLOYMENT.md              # Deployment guide
├── ARCHITECTURE.md            # Architecture documentation
├── DATABASE_SETUP.md          # Database restoration guide
├── JARVIS_ADMIN_AGILE_BACKLOG.md  # Feature backlog
└── .env.example               # Environment variables template
```

## 🔑 Environment Variables

Required secrets (see `.env.example` for full list):

```env
# Database (Required)
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication (Required)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
SESSION_SECRET=your_session_secret

# Optional Integrations
SENDGRID_API_KEY=your_sendgrid_key
OPENAI_API_KEY=your_openai_key
GA_TRACKING_ID=your_ga_tracking_id
```

### Setting Up GitHub OAuth

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Configure:
   - **Application name**: JARVIS IntelliAgent 3.0
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://your-domain.com/api/callback`
4. Save the Client ID and Client Secret to your `.env` file

## 🗄️ Database

### Schema Overview
The application uses PostgreSQL with 50+ tables managed by Drizzle ORM:

**Core Tables**
- `users`, `user_profiles`, `user_preferences`, `user_sessions`
- `agents`, `agent_versions`, `agent_executions`, `agent_execution_steps`
- `role_personas`, `commands`, `activities`, `emails`

**Insurance Workflows**
- `submissions`, `incidents`, `commercial_property_workflows`
- `commercial_property_submissions`, `commercial_property_cope_data`

**Configuration System**
- `config_registry`, `config_values`, `config_snapshots`, `config_change_logs`
- `business_rules`, `templates`

**AI Governance**
- `ai_models`, `risk_assessments`, `audit_trails`, `governance_metrics`

**Metadata-Driven UI**
- `form_field_definitions`, `form_templates`, `ui_component_registry`
- `tab_configurations`, `hierarchy_layer_configurations`

**User Journey**
- `user_journey_interactions`, `user_journey_sessions`, `user_journey_heatmaps`

See **[shared/schema.ts](./shared/schema.ts)** for complete schema definition.

## 🏗️ Architecture

### 6-Layer Agent Architecture

1. **Experience Layer**: Insurance company branding & configuration
2. **Meta Brain Layer**: Central orchestrator & agent coordination
3. **Role Layer**: Persona-specific agents (Rachel Thompson AUW, John Stevens IT)
4. **Process Layer**: Multi-step workflow orchestration
5. **System Layer**: Core processing agents (Document, Data Extraction)
6. **Interface Layer**: External interaction handlers (Voice, API, Email)

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for detailed architecture documentation.

### Multi-Persona System

**Static Personas** (Predefined)
- **Admin**: Full system access, configuration management
- **Rachel Thompson (AUW)**: Commercial property underwriting
- **John Stevens (IT Support)**: System monitoring, incident management
- **Broker**: Insurance broker workflows

**Dynamic Personas** (Agent-Generated)
- Role agents can be converted to personas
- Custom dashboards and capabilities
- Linked to source agent via `sourceAgentId`

## 🛠️ Development

### Available Scripts

```bash
npm run dev         # Start development server (port 5000)
npm run build       # Build for production
npm run start       # Start production server
npm run check       # TypeScript type checking
npm run db:push     # Push schema changes to database
```

### Development Workflow

1. **Make code changes** in `client/`, `server/`, or `shared/`
2. **Update schema** in `shared/schema.ts` if needed
3. **Push schema changes**: `npm run db:push`
4. **Test locally**: `npm run dev`
5. **Commit to Git**: Follow Git workflow in DEPLOYMENT.md
6. **Deploy**: Push to Replit or hosting platform

### Code Conventions

- **Frontend**: Use Universal* prefix for shared components
- **Backend**: Keep routes thin, use storage interface for DB operations
- **Schema**: Define in `shared/schema.ts`, use Drizzle types
- **Config**: Store business logic in ConfigService, not code
- **Security**: Never commit secrets, use environment variables

## 🔐 Security

- **Authentication**: GitHub OAuth with dynamic callback URLs
- **Session Management**: PostgreSQL-backed sessions (connect-pg-simple)
- **Secrets**: Stored in environment variables, never in code
- **Audit Trails**: Comprehensive logging of all critical operations
- **Data Integrity**: Foreign key constraints, validation at DB level

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide for Git → Replit
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Frontend/backend architecture details
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Database restoration instructions
- **[JARVIS_ADMIN_AGILE_BACKLOG.md](./JARVIS_ADMIN_AGILE_BACKLOG.md)** - Feature inventory (20 epics, 100+ features)
- **[replit.md](./replit.md)** - Project overview and technical architecture

## 🧪 Testing & Verification

After setup, verify:

1. **Authentication**: Can log in with GitHub OAuth
2. **Database**: All 50+ tables exist and have data
3. **Personas**: Can switch between Admin, Rachel, John
4. **Agents**: Agent directory loads with all layers
5. **Real-time**: WebSocket connection for agent execution
6. **Voice**: Voice command interface works (browser permissions)
7. **Workflows**: Can execute commands and see agent orchestration

## 🚀 Deployment

### Replit Deployment

1. Import repository to Replit (see DEPLOYMENT.md)
2. Configure environment variables in Replit Secrets
3. Database will auto-provision (Neon PostgreSQL)
4. Push schema: `npm run db:push`
5. Application auto-starts via `.replit` configuration

### External Hosting

Supports any Node.js hosting platform:
- **Vercel**: Configure for Node.js runtime
- **Railway**: PostgreSQL included
- **Render**: Node.js + PostgreSQL services
- **DigitalOcean App Platform**: Docker or buildpack

See DEPLOYMENT.md for platform-specific instructions.

## 🐛 Troubleshooting

### Common Issues

**Database connection errors**
- Verify DATABASE_URL is correct
- Ensure PostgreSQL service is running
- Check firewall allows connections

**GitHub OAuth fails**
- Verify callback URL matches GitHub OAuth app settings
- Check GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET
- Ensure SESSION_SECRET is set

**Agent execution not showing**
- Check WebSocket connection (browser console)
- Verify agents exist in database
- Check persona has associated agents

**Port conflicts**
- Default port is 5000, change in .replit if needed
- Ensure no other service using port 5000

## 📞 Support

For issues or questions:
1. Check documentation in `/docs` folder
2. Review architecture diagrams in ARCHITECTURE.md
3. Consult feature backlog in JARVIS_ADMIN_AGILE_BACKLOG.md
4. Check database schema in shared/schema.ts

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with:
- React, TypeScript, Tailwind CSS
- Express, PostgreSQL, Drizzle ORM
- Replit platform and infrastructure
- shadcn/ui component library

---

**Version**: 3.0  
**Last Updated**: 2025-11-12  
**Architecture**: 6-Layer Multi-Persona Agent System

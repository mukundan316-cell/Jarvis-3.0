# JARVIS IntelliAgent 3.0 - Production System

## Overview
JARVIS IntelliAgent 3.0 is an AI-powered insurance automation platform featuring a 6-layer agent architecture that supports multi-persona experiences (Admin, Underwriter, IT Support, Broker). It offers voice/text interactions, real-time agent orchestration, and a database-driven configuration system. The platform includes a **Showcase Mode** for demonstrating scenario-based workflows in claims processing, risk assessment, and policy management. The project aims to provide comprehensive insurance automation, leveraging AI for efficiency and market competitiveness.

## User Preferences
- **Communication Style**: Simple, everyday language avoiding technical jargon
- **Development Approach**: Security-first, type-safe, ConfigService-driven, Universal components

## System Architecture

### Core Design Principles
- **Configuration-Driven**: All business logic is database-driven via `ConfigService` with scope-based precedence, eliminating hard-coding.
- **Security & Compliance**: Implements typed authentication interfaces, secure helper functions, and ConfigService-based authorization.
- **Schema First**: Database schema defined in `shared/schema.ts` with camelCase ↔ snake_case consistency and referential integrity.
- **Universal Components**: Reusable components prefixed with "Universal" for consistency across multi-persona interfaces.
- **Case Standardization**: Unified normalization strategy: "store lowercase, compare lowercase, display proper case" using `stringUtils.ts` for consistent case handling.

### Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Wouter routing, TanStack Query.
- **Backend**: Node.js, Express.js, PostgreSQL, Drizzle ORM, GitHub OAuth (passport-github2).
- **Integrations**: SendGrid, Google Analytics, OpenAI, WebSocket for real-time monitoring.

### Multi-Persona Dashboard System
Supports tailored experiences for:
- **Admin**: Full system access, agent creation, configuration management.
- **Rachel Thompson (AUW)**: Commercial property underwriting, submission management.
- **John Stevens (IT Support)**: System monitoring, incident management.
- **Broker**: Insurance broker workflows and client management.
Each persona features custom KPIs, activity panels, and a glassmorphism design with dark slate styling.

### 6-Layer Agent Architecture
1.  **Experience Layer**: Insurance company branding & configuration.
2.  **Meta Brain Layer**: Central orchestrator & agent coordination.
3.  **Role Layer**: Persona-specific agents (e.g., Rachel Thompson AUW).
4.  **Process Layer**: Multi-step workflow orchestration (e.g., Risk Assessment).
5.  **System Layer**: Core processing agents (e.g., Document Processing).
6.  **Interface Layer**: External interaction handlers (e.g., Voice, API).
Supports optional parallel processing with WebSocket real-time monitoring.

### Key Features
- **Dynamic Persona Management**: Unified database-driven framework for persona management and conversion from role agents.
- **Voice Integration**: Multi-persona voice command processing using Web Speech API.
- **Real-Time Monitoring**: WebSocket-based agent execution monitoring.
- **Insurance Workflows**: Claims processing, risk assessment, policy management, commercial property underwriting.
- **AI Governance Suite**: A 5-tab interface providing an overview, EU AI Act compliance, explainability, bias detection, and management.
- **Agent Directory**: Features business function filtering, SLA performance indicators, and version control.
- **Agent Lifecycle Management**: Supports agent CRUD operations via specialized components (`CreateNewAgentModal`, `EditAgentModal`) and includes version control with snapshots and unsaved changes indicators.
- **Showcase Mode**: Scenario-based performance demonstrations.

## External Dependencies
- **Authentication**: GitHub OAuth with dynamic callback URLs (domain-independent)
- **Email**: SendGrid
- **Analytics**: Google Analytics
- **AI/LLM**: OpenAI
- **Database**: PostgreSQL (managed via Drizzle ORM)
- **Real-time Communication**: WebSockets
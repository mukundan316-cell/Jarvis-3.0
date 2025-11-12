import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User profiles for enhanced personalization
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  persona: varchar("persona").notNull().default("admin"), // Links to rolePersonas.personaKey
  jobRole: varchar("job_role"),
  department: varchar("department"),
  experienceLevel: varchar("experience_level"),
  primaryWorkflows: jsonb("primary_workflows"),
  accessLevel: varchar("access_level").default("standard"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("user_profiles_user_persona_unique").on(table.userId, table.persona)
]);

// User preferences for interaction customization
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  persona: varchar("persona").notNull().default("admin"), // Links to rolePersonas.personaKey
  communicationStyle: varchar("communication_style").default("casual"),
  responseLength: varchar("response_length").default("detailed"),
  explanationLevel: varchar("explanation_level").default("intermediate"),
  preferredInputMethod: varchar("preferred_input_method").default("both"),
  autoSuggestions: boolean("auto_suggestions").default(true),
  confirmBeforeActions: boolean("confirm_before_actions").default(true),
  notificationSettings: jsonb("notification_settings"),
  customInstructions: text("custom_instructions"),
  workflowInstructions: jsonb("workflow_instructions"),
  viewMode: varchar("view_mode").default("technical"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("user_preferences_user_persona_unique").on(table.userId, table.persona)
]);

// Experience Layer - Insurance Company Configuration
export const experienceLayer = pgTable("experience_layer", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name").notNull().default("ABC Insurance Ltd"),
  companyConfig: jsonb("company_config"),
  brandingConfig: jsonb("branding_config"),
  personalizationSettings: jsonb("personalization_settings"),
  jarvisCustomizations: jsonb("jarvis_customizations"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meta Brain Layer - Central Orchestrator
export const metaBrainLayer = pgTable("meta_brain_layer", {
  id: serial("id").primaryKey(),
  orchestratorName: varchar("orchestrator_name").notNull().default("JARVIS Meta Brain"),
  orchestrationConfig: jsonb("orchestration_config"),
  agentCoordination: jsonb("agent_coordination"),
  workflowManagement: jsonb("workflow_management"),
  decisionEngine: jsonb("decision_engine"),
  status: varchar("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Personalization configurations table
export const personalizationConfigs = pgTable("personalization_configs", {
  id: serial("id").primaryKey(),
  insurerId: integer("insurer_id").notNull(),
  roleConfig: jsonb("role_config"),
  workflowConfig: jsonb("workflow_config"),
  systemConfig: jsonb("system_config"),
  interfaceConfig: jsonb("interface_config"),
  branding: jsonb("branding"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Role personas baseline configurations with dynamic agent-to-persona conversion support
export const rolePersonas = pgTable("role_personas", {
  id: serial("id").primaryKey(),
  personaKey: varchar("persona_key").notNull().unique(), // admin, rachel, john, broker
  displayName: varchar("display_name").notNull(), // "Admin", "Rachel Thompson", "John Stevens", "Broker"
  agentRole: varchar("agent_role"), // "System Administrator", "Assistant Underwriter", "IT Support Analyst", "Insurance Broker"
  department: varchar("department"), // "Technology", "Underwriting", "IT Support", "Sales"
  avatarUrl: varchar("avatar_url"),
  baselineUserProfile: jsonb("baseline_user_profile"), // Default profile data for this persona
  baselineUserPreferences: jsonb("baseline_user_preferences"), // Default preferences for this persona
  
  // Enhanced fields for dynamic role agent → persona conversion
  sourceAgentId: integer("source_agent_id").references(() => agents.id), // Reference to the role agent that generated this persona
  personaType: varchar("persona_type").notNull().default("static"), // "static" (predefined) or "dynamic" (agent-generated)
  isActive: boolean("is_active").notNull().default(true), // Whether this persona is available for selection
  generationMetadata: jsonb("generation_metadata"), // Metadata about how this persona was generated
  dashboardConfig: jsonb("dashboard_config"), // Dynamic dashboard configuration for this persona
  capabilityManifest: jsonb("capability_manifest"), // What capabilities this persona provides
  accessLevel: varchar("access_level").default("standard"), // "admin", "advanced", "standard"
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User sessions for persona tracking
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  activePersona: varchar("active_persona").notNull().default("admin"),
  sessionData: jsonb("session_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Commands table for interaction logging
export const commands = pgTable("commands", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  input: text("input").notNull(),
  response: text("response"),
  mode: varchar("mode").notNull(), // Voice/Chat/Email/API
  persona: varchar("persona").notNull(),
  agentName: varchar("agent_name"),
  agentType: varchar("agent_type"),
  submissionId: varchar("submission_id"),
  submissionDetails: jsonb("submission_details"),
  status: varchar("status").default("completed"),
  executedAt: timestamp("executed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activities table for system events
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  activity: text("activity").notNull(),
  persona: varchar("persona"),
  status: varchar("status").notNull(),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Errors table for error logging
export const errors = pgTable("errors", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  errorType: varchar("error_type").notNull(), // authentication, command, api, database, agent
  errorMessage: text("error_message").notNull(),
  context: jsonb("context"),
  persona: varchar("persona"),
  submissionId: varchar("submission_id"),
  timestamp: timestamp("timestamp").defaultNow(),
});

/**
 * Agents table for system agents and custom user-created agents
 * 
 * AGENT LAYER CLASSIFICATION GUIDELINES:
 * 
 * Process Agents: Multi-step workflows that:
 * - Take structured input (e.g., broker email + attachments)
 * - Coordinate one or more System/Interface agents to process inputs
 * - Provide structured step output (e.g., intake ticket + queue event)
 * - Have defined SLAs (e.g., <1 min from arrival)
 * - Include control mechanisms (e.g., quarantine policies)
 * - Responsibilities: Workflow orchestration, step progression tracking, agent coordination, state management
 * - Non-Responsibilities: Heavy data parsing/inference, direct external interactions
 * - Decision Checklist: If directly touches external systems → Interface; if single-purpose transformation/inference → System; if orchestrates multiple steps/agents with state → Process
 * - Examples: "Intelligent Email (submission capture)" workflow
 * - Non-Examples: "Intent Extraction Agent" → System (single-purpose data extraction, not multi-step orchestration)
 * 
 * System Agents: Core processing capabilities (single-purpose):
 * - Document classification, data extraction, security filtering
 * - Invoked by Process Agents for specific processing tasks
 * - Examples: "Document Classifier", "Intent Extraction", "Email Security Filter"
 * 
 * Interface Agents: External interaction handlers:
 * - Email monitoring, API endpoints, voice interfaces, dashboard interactions
 * - Handle all external communication and user interactions
 * - Examples: "Email Channel Agent", "Voice Interface Agent", "API Interface Agent"
 * 
 * Role Agents: Persona-based functional roles (always one per persona):
 * - Represent functional roles like Assistant Underwriter, IT Support, Admin
 * - Each persona must have exactly one Role Agent
 * - Examples: "Rachel Thompson (AUW)", "John Stevens (IT Support)", "JARVIS Admin"
 * 
 * MEMORY & CONTEXT PROFILES:
 * - memoryContextProfile ∈ {"session-only", "short-term", "long-term", "episodic", "adaptive-learning"}
 * - layer ∈ {"Experience", "Meta Brain", "Role", "Process", "System", "Interface"}
 * - Memory profiles define how agents handle context retention and learning capabilities
 * 
 * CONFIGURATION & MONITORING:
 * See replit.md Process Agent section for SLAs/quarantine details. All Process/System executions surface in 
 * UniversalAgentExecutionPopup with groupId/isParallel metadata for real-time monitoring.
 */
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(), // Agent display name (e.g., "Rachel Thompson", "Assistant Underwriter")
  agentRole: varchar("agent_role"), // The role title (e.g., "Assistant Underwriter", "IT Support Analyst")
  personaName: varchar("persona_name"), // The person's name (e.g., "Rachel Thompson", "John Stevens")
  memoryContextProfile: varchar("memory_context_profile", { length: 30 }).notNull().default("session-only"), // session-only, short-term, long-term, episodic, adaptive-learning
  layer: varchar("layer").notNull(), // Experience, Meta Brain, Role, Process, System, Interface
  persona: varchar("persona").notNull().default("admin"), // admin, rachel, john
  specialization: varchar("specialization"),
  description: text("description"),
  config: jsonb("config"),
  status: varchar("status").notNull().default("active"),
  functionalStatus: varchar("functional_status").notNull().default("configured"), // active, configured, planned - tracks implementation status
  isCustom: boolean("is_custom").default(false), // Distinguishes user-created agents
  userId: varchar("user_id"), // References user who created custom agent
  cpuUsage: integer("cpu_usage").default(0),
  memoryUsage: integer("memory_usage").default(0),
  activeUsers: integer("active_users").default(0),
  successRate: decimal("success_rate").default("0"),
  avgResponseTime: integer("avg_response_time").default(0),
  lastActivity: timestamp("last_activity").defaultNow(),
  // MDP Governance fields
  maturityLevel: integer("maturity_level").default(1), // 0-4 scale (Rule-based to Autonomous)
  maturityStage: varchar("maturity_stage", { length: 20 }).default("L1"), // L0-L4: Tool Caller → ReAct Loop → Planner+Executor → Multi-Agent Crew → Autonomous System
  agentCategory: varchar("agent_category", { length: 20 }).default("Reactive"), // Reactive, Deliberative, Hybrid, Learning, Collaborative, Autonomous
  governanceStatus: varchar("governance_status", { length: 20 }).default("pending"), // compliant, pending, risk
  riskLevel: varchar("risk_level", { length: 10 }).default("medium"), // low, medium, high, critical
  complianceFrameworks: text("compliance_frameworks").array().default([]), // GDPR, HIPAA, SOX, etc.
  lastAuditDate: timestamp("last_audit_date"),
  complianceNotes: text("compliance_notes"),
  // Command Center Enhancement fields
  businessFunction: varchar("business_function", { length: 50 }), // underwriting, claims, policy, customer_service - ConfigService driven
  slaPerformance: decimal("sla_performance", { precision: 5, scale: 2 }), // SLA performance score 0-100
  slaStatus: varchar("sla_status", { length: 10 }).default("green"), // green, yellow, red
  collaborationStatus: varchar("collaboration_status", { length: 20 }).default("solo"), // solo, coordinated, hybrid
  costBenefitRatio: decimal("cost_benefit_ratio", { precision: 10, scale: 2 }), // Cost/benefit analysis ratio
  businessImpactScore: decimal("business_impact_score", { precision: 8, scale: 2 }), // Revenue/cost impact attribution
  // Agent Lifecycle Management fields
  lifecycleStage: varchar("lifecycle_stage", { length: 20 }).default("development"), // development, testing, production, deprecated, retired
  configVersion: varchar("config_version", { length: 20 }).default("1.0.0"), // Semantic versioning for agent configurations
  retirementDate: timestamp("retirement_date"), // Nullable - scheduled retirement date
  dependsOnAgents: text("depends_on_agents").array().default([]), // Array of agent IDs this agent depends on
  lastConfigUpdate: timestamp("last_config_update").defaultNow(), // Timestamp of last configuration change
  hasUnsavedChanges: boolean("has_unsaved_changes").default(false), // Flag for pending configuration changes
  monthlyCost: decimal("monthly_cost", { precision: 10, scale: 2 }).default("0"), // Monthly operational cost
  costEfficiency: varchar("cost_efficiency", { length: 20 }), // Nullable - low, medium, high, optimal
  costTrend: varchar("cost_trend", { length: 20 }), // Nullable - decreasing, stable, increasing
  costChange: decimal("cost_change", { precision: 10, scale: 2 }), // Nullable - month-over-month cost change
  
  // Enterprise Configuration fields
  slaRequirements: jsonb("sla_requirements"), // Performance targets, availability requirements, etc.
  memoryConfig: jsonb("memory_config"), // Context retention, memory types, session settings
  deploymentConfig: jsonb("deployment_config"), // Cloud targets, scaling policies, resource requirements
  integrationConfig: jsonb("integration_config"), // Data sources, security settings, orchestration patterns
  
  // Enhanced fields for role agent → persona conversion capability
  canGeneratePersona: boolean("can_generate_persona").default(false), // Whether this role agent can become a persona
  personaGenerationConfig: jsonb("persona_generation_config"), // Configuration for persona generation
  personaCapabilities: jsonb("persona_capabilities"), // What capabilities this agent would provide as a persona
  dashboardTemplate: jsonb("dashboard_template"), // Template for dashboard when acting as persona
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent Versions table for configuration history and rollback
export const agentVersions = pgTable("agent_versions", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  version: varchar("version", { length: 20 }).notNull(), // Semantic version number
  configSnapshot: jsonb("config_snapshot").notNull(), // Complete agent configuration at this version
  rollbackData: jsonb("rollback_data"), // Additional data needed for rollback operations
  changeDescription: text("change_description"), // Description of changes in this version
  createdBy: varchar("created_by"), // User who created this version
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique("agent_versions_agent_version_unique").on(table.agentId, table.version),
  index("idx_agent_versions_agent_id").on(table.agentId),
]);

// Agent Resource Usage table for performance monitoring and cost tracking
export const agentResourceUsage = pgTable("agent_resource_usage", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  cpuUsage: decimal("cpu_usage", { precision: 5, scale: 2 }).notNull(), // CPU usage percentage
  memoryUsage: decimal("memory_usage", { precision: 10, scale: 2 }).notNull(), // Memory usage in MB
  costPerHour: decimal("cost_per_hour", { precision: 10, scale: 4 }).notNull(), // Operational cost per hour
  requestCount: integer("request_count").default(0), // Number of requests processed
  errorCount: integer("error_count").default(0), // Number of errors encountered
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_agent_resource_usage_agent_id").on(table.agentId),
  index("idx_agent_resource_usage_timestamp").on(table.timestamp),
]);

// Agent Dependencies table for dependency tracking and impact analysis
export const agentDependencies = pgTable("agent_dependencies", {
  id: serial("id").primaryKey(),
  parentAgentId: integer("parent_agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  dependentAgentId: integer("dependent_agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  dependencyType: varchar("dependency_type", { length: 50 }).notNull(), // workflow, data, service, config
  strength: varchar("strength", { length: 20 }).default("medium"), // weak, medium, strong, critical
  description: text("description"), // Description of the dependency relationship
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique("agent_dependencies_unique").on(table.parentAgentId, table.dependentAgentId, table.dependencyType),
  index("idx_agent_dependencies_parent").on(table.parentAgentId),
  index("idx_agent_dependencies_dependent").on(table.dependentAgentId),
]);

// Agent Test Results table for testing framework functionality
export const agentTestResults = pgTable("agent_test_results", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  testType: varchar("test_type", { length: 50 }).notNull(), // unit, integration, performance, security, compliance
  testName: varchar("test_name", { length: 200 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, running, passed, failed, error, skipped
  results: jsonb("results"), // Detailed test results, metrics, and outputs
  executedAt: timestamp("executed_at").defaultNow(),
  executedBy: varchar("executed_by").references(() => users.id),
  duration: integer("duration"), // Test execution time in milliseconds
  metadata: jsonb("metadata"), // Additional test metadata, configuration, and context
}, (table) => [
  index("idx_agent_test_results_agent_id").on(table.agentId),
  index("idx_agent_test_results_type").on(table.testType),
  index("idx_agent_test_results_status").on(table.status),
  index("idx_agent_test_results_executed_at").on(table.executedAt),
]);

// Insurance submissions table for realistic data
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  submissionId: varchar("submission_id").notNull().unique(),
  brokerName: varchar("broker_name").notNull(),
  clientName: varchar("client_name").notNull(),
  riskLevel: varchar("risk_level").notNull(),
  recommendedLine: varchar("recommended_line"),
  details: jsonb("details"),
  status: varchar("status").notNull().default("pending"),
  assignedTo: varchar("assigned_to"),
  // Enhanced fields for unified briefing framework
  documentationStatus: varchar("documentation_status").default("complete"),
  missingDocuments: text("missing_documents").array(),
  issueFlags: jsonb("issue_flags"),
  actionRequired: varchar("action_required"),
  lastInteractionDate: timestamp("last_interaction_date"),
  rachelNotes: text("rachel_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Incidents table for IT support workflow
export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  incidentId: varchar("incident_id").notNull().unique(),
  title: varchar("title").notNull(),
  description: text("description"),
  priority: varchar("priority").notNull().default("medium"),
  status: varchar("status").notNull().default("open"),
  assignedTo: varchar("assigned_to"),
  reportedBy: varchar("reported_by"),
  resolution: text("resolution"),
  // Enhanced fields for unified briefing framework
  escalationRequired: varchar("escalation_required"),
  criticalFlags: jsonb("critical_flags"),
  actionRequired: varchar("action_required"),
  lastInteractionDate: timestamp("last_interaction_date"),
  johnNotes: text("john_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voice Transcripts for interaction tracking
export const voiceTranscripts = pgTable("voice_transcripts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  persona: varchar("persona").notNull(),
  transcriptText: text("transcript_text").notNull(),
  isCommand: boolean("is_command").default(true),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  processingStatus: varchar("processing_status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Dashboard KPIs and Metrics
export const dashboardKpis = pgTable("dashboard_kpis", {
  id: serial("id").primaryKey(),
  kpiName: varchar("kpi_name", { length: 100 }).notNull().unique(),
  currentValue: varchar("current_value", { length: 100 }).notNull(),
  previousValue: varchar("previous_value", { length: 100 }),
  target: varchar("target", { length: 100 }),
  unit: varchar("unit", { length: 50 }),
  category: varchar("category", { length: 100 }).notNull(),
  trend: varchar("trend", { length: 20 }).default("stable"), // up, down, stable
  // Contextual dual-view KPI fields
  context: varchar("context", { length: 20 }).default("main_dashboard"), // 'main_dashboard' | 'insights_tab'
  displayContext: varchar("display_context", { length: 20 }).default("main"), // 'main' | 'insights' | 'both'
  priority: integer("priority").default(1), // 1-4 for main dashboard, 5+ for insights tab
  viewCategory: varchar("view_category", { length: 20 }).default("both"), // 'technical' | 'business' | 'both'
  personaRelevance: text("persona_relevance").array().default(["{admin}", "{rachel}", "{john}", "{broker}"]), // persona filtering
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meta Brain Settings
export const metaBrainSettings = pgTable("meta_brain_settings", {
  id: serial("id").primaryKey(),
  settingName: varchar("setting_name", { length: 100 }).notNull().unique(),
  settingValue: text("setting_value").notNull(),
  settingType: varchar("setting_type", { length: 50 }).default("string"), // string, number, boolean, json
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orchestration Workflows
export const orchestrationWorkflows = pgTable("orchestration_workflows", {
  id: serial("id").primaryKey(),
  workflowName: varchar("workflow_name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("active"), // active, paused, stopped
  triggerType: varchar("trigger_type", { length: 100 }).notNull(), // schedule, event, manual
  triggerConfig: jsonb("trigger_config"),
  steps: jsonb("steps").notNull(), // workflow steps configuration
  executionCount: integer("execution_count").default(0),
  lastExecuted: timestamp("last_executed"),
  avgExecutionTime: integer("avg_execution_time"), // milliseconds
  successRate: varchar("success_rate", { length: 10 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Data Preparation Layer
export const dataPrepLayers = pgTable("data_prep_layers", {
  id: serial("id").primaryKey(),
  layerName: varchar("layer_name", { length: 100 }).notNull(),
  sourceSystem: varchar("source_system", { length: 100 }).notNull(),
  dataType: varchar("data_type", { length: 100 }).notNull(),
  processingStatus: varchar("processing_status", { length: 50 }).default("ready"),
  recordsProcessed: integer("records_processed").default(0),
  recordsTotal: integer("records_total").default(0),
  lastProcessed: timestamp("last_processed"),
  qualityScore: varchar("quality_score", { length: 10 }).default("0"),
  errorCount: integer("error_count").default(0),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Command Center
export const aiCommands = pgTable("ai_commands", {
  id: serial("id").primaryKey(),
  commandName: varchar("command_name", { length: 255 }).notNull(),
  commandType: varchar("command_type", { length: 100 }).notNull(), // workflow, agent, system, integration
  description: text("description"),
  targetAgents: jsonb("target_agents"), // list of agent IDs or types
  parameters: jsonb("parameters"),
  executionCount: integer("execution_count").default(0),
  avgResponseTime: integer("avg_response_time"), // milliseconds
  successRate: varchar("success_rate", { length: 10 }).default("0"),
  lastExecuted: timestamp("last_executed"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// External System Integrations
export const systemIntegrations = pgTable("system_integrations", {
  id: serial("id").primaryKey(),
  systemName: varchar("system_name", { length: 255 }).notNull(),
  systemType: varchar("system_type", { length: 100 }).notNull(), // salesforce, duckcreek, custom
  connectionStatus: varchar("connection_status", { length: 50 }).default("connected"),
  apiEndpoint: varchar("api_endpoint", { length: 500 }),
  authType: varchar("auth_type", { length: 100 }),
  lastSync: timestamp("last_sync"),
  syncFrequency: varchar("sync_frequency", { length: 100 }), // daily, hourly, realtime
  recordsSynced: integer("records_synced").default(0),
  errorCount: integer("error_count").default(0),
  healthScore: varchar("health_score", { length: 10 }).default("100"),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent Factory Templates
export const agentTemplates = pgTable("agent_templates", {
  id: serial("id").primaryKey(),
  templateName: varchar("template_name", { length: 255 }).notNull(),
  agentType: varchar("agent_type", { length: 100 }).notNull(),
  layer: varchar("layer", { length: 100 }).notNull(),
  description: text("description"),
  capabilities: jsonb("capabilities").notNull(), // list of capabilities
  configuration: jsonb("configuration").notNull(), // default configuration
  dependencies: jsonb("dependencies"), // required services/agents
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const personaBriefings = pgTable("persona_briefings", {
  id: serial("id").primaryKey(),
  persona: varchar("persona", { length: 50 }).notNull().unique(),
  briefingText: text("briefing_text").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertPersonalizationConfigSchema = createInsertSchema(personalizationConfigs).omit({
  id: true,
  createdAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommandSchema = createInsertSchema(commands).omit({
  id: true,
  executedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export const insertErrorSchema = createInsertSchema(errors).omit({
  id: true,
  timestamp: true,
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  cpuUsage: true,
  memoryUsage: true,
  activeUsers: true,
  successRate: true,
  avgResponseTime: true,
  lastActivity: true,
  // Omit auto-calculated fields for persona generation
  lastConfigUpdate: true,
}).extend({
  canGeneratePersona: z.boolean().default(false),
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPersonalizationConfig = z.infer<typeof insertPersonalizationConfigSchema>;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type InsertCommand = z.infer<typeof insertCommandSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertError = z.infer<typeof insertErrorSchema>;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;

// New schema types
export const insertDashboardKpiSchema = createInsertSchema(dashboardKpis).omit({
  id: true,
  updatedAt: true,
});

export const insertMetaBrainSettingSchema = createInsertSchema(metaBrainSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertOrchestrationWorkflowSchema = createInsertSchema(orchestrationWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  executionCount: true,
});

export const insertDataPrepLayerSchema = createInsertSchema(dataPrepLayers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  recordsProcessed: true,
});

export const insertAiCommandSchema = createInsertSchema(aiCommands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  executionCount: true,
});

export const insertSystemIntegrationSchema = createInsertSchema(systemIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  recordsSynced: true,
});

export const insertAgentTemplateSchema = createInsertSchema(agentTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
});

// Agent Lifecycle Management schemas
export const insertAgentVersionSchema = createInsertSchema(agentVersions).omit({
  id: true,
  createdAt: true,
});

export const insertAgentResourceUsageSchema = createInsertSchema(agentResourceUsage).omit({
  id: true,
  timestamp: true,
});

export const insertAgentDependencySchema = createInsertSchema(agentDependencies).omit({
  id: true,
  createdAt: true,
});

export const insertAgentTestResultSchema = createInsertSchema(agentTestResults).omit({
  id: true,
  executedAt: true,
}).extend({
  agentId: z.number().int().positive("Agent ID must be a positive integer"),
  testType: z.enum(["unit", "integration", "performance", "security", "compliance"], { message: "Invalid test type" }),
  testName: z.string().min(1, "Test name is required").max(200, "Test name too long"),
  status: z.enum(["pending", "running", "passed", "failed", "error", "skipped"]).default("pending"),
});

export type InsertDashboardKpi = z.infer<typeof insertDashboardKpiSchema>;
export type InsertMetaBrainSetting = z.infer<typeof insertMetaBrainSettingSchema>;
export type InsertOrchestrationWorkflow = z.infer<typeof insertOrchestrationWorkflowSchema>;
export type InsertDataPrepLayer = z.infer<typeof insertDataPrepLayerSchema>;
export type InsertAiCommand = z.infer<typeof insertAiCommandSchema>;
export type InsertSystemIntegration = z.infer<typeof insertSystemIntegrationSchema>;
export type InsertAgentTemplate = z.infer<typeof insertAgentTemplateSchema>;
export type InsertAgentVersion = z.infer<typeof insertAgentVersionSchema>;
export type InsertAgentResourceUsage = z.infer<typeof insertAgentResourceUsageSchema>;
export type InsertAgentDependency = z.infer<typeof insertAgentDependencySchema>;
export type InsertAgentTestResult = z.infer<typeof insertAgentTestResultSchema>;

export const insertPersonaBriefingSchema = createInsertSchema(personaBriefings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPersonaBriefing = z.infer<typeof insertPersonaBriefingSchema>;

// Commercial Property Workflow Tables

// Commercial Property workflow state management
export const commercialPropertyWorkflows = pgTable("commercial_property_workflows", {
  id: serial("id").primaryKey(),
  submissionId: varchar("submission_id").notNull().unique(),
  userId: varchar("user_id").notNull().references(() => users.id),
  currentStep: integer("current_step").notNull().default(1),
  completedSteps: integer("completed_steps").array().default([]),
  status: varchar("status").notNull().default("in_progress"), // in_progress, completed, cancelled
  stepData: jsonb("step_data").default({}), // stores data for each step
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// COPE (Construction, Occupancy, Protection, Exposure) analysis data
export const commercialPropertyCopeData = pgTable("commercial_property_cope_data", {
  id: serial("id").primaryKey(),
  submissionId: varchar("submission_id").notNull().unique().references(() => commercialPropertyWorkflows.submissionId, { onDelete: "cascade" }),
  // Construction data
  constructionType: varchar("construction_type"), // frame, joisted_masonry, non_combustible, masonry_non_combustible, modified_fire_resistive, fire_resistive
  yearBuilt: integer("year_built"),
  totalFloors: integer("total_floors"),
  basementLevels: integer("basement_levels"),
  // Occupancy data
  primaryOccupancy: varchar("primary_occupancy"),
  occupancyClassification: varchar("occupancy_classification"),
  businessDescription: text("business_description"),
  // Protection data
  sprinklerSystem: boolean("sprinkler_system").default(false),
  sprinklerType: varchar("sprinkler_type"), // wet_pipe, dry_pipe, deluge, pre_action
  fireAlarmSystem: boolean("fire_alarm_system").default(false),
  centralStation: boolean("central_station").default(false),
  securitySystem: boolean("security_system").default(false),
  // Exposure data
  exposureNorth: varchar("exposure_north"),
  exposureSouth: varchar("exposure_south"),
  exposureEast: varchar("exposure_east"),
  exposureWest: varchar("exposure_west"),
  hydrantDistance: integer("hydrant_distance"), // distance in feet
  fireStationDistance: integer("fire_station_distance"), // distance in miles
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Commercial Property specific submission data
export const commercialPropertySubmissions = pgTable("commercial_property_submissions", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => commercialPropertyWorkflows.id, { onDelete: "cascade" }),
  submissionId: varchar("submission_id").notNull().unique().references(() => commercialPropertyWorkflows.submissionId, { onDelete: "cascade" }),
  // Email intake data
  emailSource: varchar("email_source"),
  senderEmail: varchar("sender_email"),
  subject: varchar("subject"),
  attachmentCount: integer("attachment_count").default(0),
  // Document ingestion data
  documentsExtracted: jsonb("documents_extracted"),
  documentValidationStatus: varchar("document_validation_status").default("pending"),
  // Data enrichment results
  externalDataSources: jsonb("external_data_sources"),
  enrichmentScore: decimal("enrichment_score", { precision: 5, scale: 2 }),
  // Comparative analytics
  marketBenchmarks: jsonb("market_benchmarks"),
  competitorAnalysis: jsonb("competitor_analysis"),
  // Appetite triage results
  appetiteScore: decimal("appetite_score", { precision: 5, scale: 2 }),
  appetiteAlignment: varchar("appetite_alignment"), // strong, moderate, weak, none
  // Propensity scoring
  riskPropensityScore: decimal("risk_propensity_score", { precision: 5, scale: 2 }),
  profitabilityScore: decimal("profitability_score", { precision: 5, scale: 2 }),
  // Underwriting copilot analysis
  underwritingRecommendations: jsonb("underwriting_recommendations"),
  riskFactors: jsonb("risk_factors"),
  // Core integration status
  coreSystemStatus: varchar("core_system_status").default("pending"),
  integrationErrors: jsonb("integration_errors"),
  finalPremium: decimal("final_premium", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Profile and Preferences schemas
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  persona: z.enum(["admin", "rachel", "john", "broker"], { message: "Invalid persona" }),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  persona: z.enum(["admin", "rachel", "john", "broker"], { message: "Invalid persona" }),
});

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;

// Commercial Property Workflow schemas
export const insertCommercialPropertyWorkflowSchema = createInsertSchema(commercialPropertyWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommercialPropertyCopeDataSchema = createInsertSchema(commercialPropertyCopeData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommercialPropertySubmissionSchema = createInsertSchema(commercialPropertySubmissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Partial schemas for PATCH operations - exclude immutable fields
export const patchCommercialPropertyWorkflowSchema = insertCommercialPropertyWorkflowSchema.partial().omit({
  submissionId: true,
  userId: true,
});

export const patchCommercialPropertyCopeDataSchema = insertCommercialPropertyCopeDataSchema.partial().omit({
  submissionId: true,
});

export const patchCommercialPropertySubmissionSchema = insertCommercialPropertySubmissionSchema.partial().omit({
  workflowId: true,
  submissionId: true,
});

export type InsertCommercialPropertyWorkflow = z.infer<typeof insertCommercialPropertyWorkflowSchema>;
export type InsertCommercialPropertyCopeData = z.infer<typeof insertCommercialPropertyCopeDataSchema>;
export type InsertCommercialPropertySubmission = z.infer<typeof insertCommercialPropertySubmissionSchema>;
export type PatchCommercialPropertyWorkflow = z.infer<typeof patchCommercialPropertyWorkflowSchema>;
export type PatchCommercialPropertyCopeData = z.infer<typeof patchCommercialPropertyCopeDataSchema>;
export type PatchCommercialPropertySubmission = z.infer<typeof patchCommercialPropertySubmissionSchema>;
export type CommercialPropertyWorkflow = typeof commercialPropertyWorkflows.$inferSelect;
export type CommercialPropertyCopeData = typeof commercialPropertyCopeData.$inferSelect;
export type CommercialPropertySubmission = typeof commercialPropertySubmissions.$inferSelect;

export type PersonalizationConfig = typeof personalizationConfigs.$inferSelect;
export type UserSession = typeof userSessions.$inferSelect;
export type Command = typeof commands.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Error = typeof errors.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type Incident = typeof incidents.$inferSelect;
export type DashboardKpi = typeof dashboardKpis.$inferSelect;
export type MetaBrainSetting = typeof metaBrainSettings.$inferSelect;
export type OrchestrationWorkflow = typeof orchestrationWorkflows.$inferSelect;
export type DataPrepLayer = typeof dataPrepLayers.$inferSelect;
export type AiCommand = typeof aiCommands.$inferSelect;
export type SystemIntegration = typeof systemIntegrations.$inferSelect;
export type AgentTemplate = typeof agentTemplates.$inferSelect;

// User Journey Heatmap tracking tables
export const userJourneyInteractions = pgTable("user_journey_interactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionId: varchar("session_id").notNull(),
  persona: varchar("persona").notNull(), // admin, rachel, john
  interactionType: varchar("interaction_type").notNull(), // command, navigation, voice, click
  targetElement: varchar("target_element"), // component/button identifier
  commandInput: text("command_input"), // actual command or input
  workflowStep: varchar("workflow_step"), // current step in workflow
  duration: integer("duration"), // time spent on interaction (ms)
  coordinates: jsonb("coordinates"), // { x, y } for click heatmap
  viewport: jsonb("viewport"), // { width, height } for responsive analysis
  deviceInfo: jsonb("device_info"), // browser, OS, screen size
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"), // additional context data
});

export const userJourneySessions = pgTable("user_journey_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionId: varchar("session_id").notNull().unique(),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  totalDuration: integer("total_duration"), // session length in seconds
  personaSwitches: integer("persona_switches").default(0),
  commandsExecuted: integer("commands_executed").default(0),
  workflowsCompleted: integer("workflows_completed").default(0),
  primaryPersona: varchar("primary_persona"), // most used persona in session
  sessionGoals: jsonb("session_goals"), // inferred user objectives
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 }), // workflow completion %
  metadata: jsonb("metadata"),
});

export const userJourneyHeatmaps = pgTable("user_journey_heatmaps", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  persona: varchar("persona").notNull(),
  pageRoute: varchar("page_route").notNull(), // /dashboard, /agents, etc.
  componentId: varchar("component_id").notNull(), // specific component
  interactionCount: integer("interaction_count").default(0),
  totalDuration: integer("total_duration").default(0), // cumulative time spent
  avgDuration: decimal("avg_duration", { precision: 10, scale: 2 }),
  clickCoordinates: jsonb("click_coordinates"), // array of {x, y, count}
  heatmapData: jsonb("heatmap_data"), // processed heatmap visualization data
  lastUpdated: timestamp("last_updated").defaultNow(),
  dateRange: varchar("date_range").default("7d"), // 1d, 7d, 30d aggregation
});

// Email system tables
export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  messageId: varchar("message_id").notNull().unique(),
  userId: varchar("user_id").notNull(),
  persona: varchar("persona").notNull(), // admin, rachel, john
  
  // Email details
  toEmail: varchar("to_email").notNull(),
  fromEmail: varchar("from_email").notNull(),
  ccEmails: text("cc_emails").array(),
  bccEmails: text("bcc_emails").array(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  
  // Metadata
  emailType: varchar("email_type").notNull(), // documentation, quote, claims, followup, custom
  priority: varchar("priority").notNull().default("normal"), // low, normal, high, urgent
  deliveryStatus: varchar("delivery_status").notNull().default("sent"), // sent, delivered, read, replied, bounced
  
  // Context linking
  submissionId: varchar("submission_id"),
  incidentId: varchar("incident_id"),
  workflowContext: text("workflow_context"),
  brokerInfo: jsonb("broker_info"),
  
  // Tracking
  sentAt: timestamp("sent_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  repliedAt: timestamp("replied_at"),
  bouncedAt: timestamp("bounced_at"),
  clickTracking: jsonb("click_tracking"),
  
  // Agent information
  generatedBy: jsonb("generated_by"), // agentId, agentName, executionId
  attachments: jsonb("attachments"),
  
  // Intelligent Email Processing - Channel Agent, Security Filter, Doc Classifier, Intent Extractor
  processingStatus: varchar("processing_status").default("pending"), // pending, processing, classified, completed, failed
  securityScanResult: jsonb("security_scan_result"), // virus scan, PII redaction results
  documentClassification: jsonb("document_classification"), // ACORD forms, SOV, loss runs, photos
  extractedIntentData: jsonb("extracted_intent_data"), // LOB, lines, effective dates, coverage details
  processingAgentLogs: jsonb("processing_agent_logs"), // audit trail of agent processing steps
  processingCompletedAt: timestamp("processing_completed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  templateId: varchar("template_id").notNull().unique(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // documentation, quote, claims, followup, custom
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  requiredFields: text("required_fields").array(),
  attachmentTemplates: text("attachment_templates").array(),
  brokerTypes: text("broker_types").array(),
  personas: text("personas").array(), // admin, rachel, john, or all
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Journey Heatmap insert schemas
export const insertUserJourneyInteractionSchema = createInsertSchema(userJourneyInteractions).omit({
  id: true,
  timestamp: true,
});

export const insertUserJourneySessionSchema = createInsertSchema(userJourneySessions).omit({
  id: true,
  startTime: true,
});

export const insertUserJourneyHeatmapSchema = createInsertSchema(userJourneyHeatmaps).omit({
  id: true,
  lastUpdated: true,
});

// Insert schemas
export const insertEmailSchema = createInsertSchema(emails);
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates);

// User Journey Heatmap types
export type UserJourneyInteraction = typeof userJourneyInteractions.$inferSelect;
export type InsertUserJourneyInteraction = z.infer<typeof insertUserJourneyInteractionSchema>;
export type UserJourneySession = typeof userJourneySessions.$inferSelect;
export type InsertUserJourneySession = z.infer<typeof insertUserJourneySessionSchema>;
export type UserJourneyHeatmap = typeof userJourneyHeatmaps.$inferSelect;
export type InsertUserJourneyHeatmap = z.infer<typeof insertUserJourneyHeatmapSchema>;

// Voice Transcript schemas
export const insertVoiceTranscriptSchema = createInsertSchema(voiceTranscripts);
export type VoiceTranscript = typeof voiceTranscripts.$inferSelect;
export type InsertVoiceTranscript = z.infer<typeof insertVoiceTranscriptSchema>;

// Step-Based Form Definitions - Following replit.md NO HARD-CODING principle
export const stepDefinitions = pgTable("step_definitions", {
  id: serial("id").primaryKey(),
  workflowType: varchar("workflow_type").notNull(), // commercial_property, general_underwriting, claims, etc.
  stepNumber: integer("step_number").notNull(),
  stepName: varchar("step_name").notNull(),
  stepTitle: varchar("step_title").notNull(),
  stepDescription: text("step_description"),
  fieldDefinitions: jsonb("field_definitions").notNull(), // Array of field configurations
  constraints: jsonb("constraints"), // Serializable validation constraints instead of Zod schemas
  submitLabel: varchar("submit_label").default("Next"),
  skipable: boolean("skipable").default(false),
  persona: varchar("persona").default("admin"), // admin, rachel, john
  effectiveDate: timestamp("effective_date").defaultNow().notNull(),
  expirationDate: timestamp("expiration_date"),
  status: varchar("status").default("active"), // active, inactive, draft
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Step form submissions for audit trail - Following replit.md AUDIT TRAIL requirement
export const stepFormSubmissions = pgTable("step_form_submissions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  workflowType: varchar("workflow_type").notNull(),
  stepId: integer("step_id").notNull().references(() => stepDefinitions.id),
  submissionData: jsonb("submission_data").notNull(), // Form data submitted
  completedAt: timestamp("completed_at").defaultNow(),
  persona: varchar("persona").notNull(),
  sessionId: varchar("session_id"),
  agentExecution: jsonb("agent_execution"), // Link to agent execution if applicable
});

// Insert schemas following existing patterns
export const insertStepDefinitionSchema = createInsertSchema(stepDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStepFormSubmissionSchema = createInsertSchema(stepFormSubmissions).omit({
  id: true,
  completedAt: true,
});

// AGENT EXECUTION TRACKING SYSTEM - Real-time multi-agent orchestration
// Agent execution requests - Main execution orchestration tracking
export const agentExecutions = pgTable("agent_executions", {
  id: serial("id").primaryKey(),
  executionId: varchar("execution_id").notNull().unique(), // UUID for tracking
  userId: varchar("user_id").notNull().references(() => users.id),
  persona: varchar("persona").notNull(), // rachel, john, admin
  command: text("command").notNull(), // Original user command
  companyContext: jsonb("company_context"), // Experience layer context
  orchestrationStrategy: varchar("orchestration_strategy").default("sequential"), // sequential, parallel, hybrid
  status: varchar("status").notNull().default("initializing"), // initializing, running, completed, error, cancelled
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  totalDuration: integer("total_duration"), // milliseconds
  result: jsonb("result"), // Final execution result
  errorDetails: jsonb("error_details"), // Error information if failed
  agentCount: integer("agent_count").default(0), // Total agents involved
  layersInvolved: jsonb("layers_involved"), // Array of layers used
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_agent_executions_user_id").on(table.userId),
  index("idx_agent_executions_persona").on(table.persona),
  index("idx_agent_executions_status").on(table.status),
  index("idx_agent_executions_started_at").on(table.startedAt),
]);

// Agent execution steps - Individual layer execution tracking
export const agentExecutionSteps = pgTable("agent_execution_steps", {
  id: serial("id").primaryKey(),
  executionId: varchar("execution_id").notNull().references(() => agentExecutions.executionId),
  stepOrder: integer("step_order").notNull(), // Execution order within the flow
  layer: varchar("layer").notNull(), // Experience, Meta Brain, Role, Process, System, Interface
  agentId: integer("agent_id").references(() => agents.id), // Actual agent from database
  agentName: varchar("agent_name").notNull(), // Agent display name
  agentType: varchar("agent_type").notNull(), // Role Agent, Process Agent, etc.
  action: text("action").notNull(), // Specific action performed
  status: varchar("status").notNull().default("pending"), // pending, running, completed, error, skipped
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // milliseconds
  inputData: jsonb("input_data"), // Data passed to agent
  outputData: jsonb("output_data"), // Result from agent execution
  metadata: jsonb("metadata"), // Additional execution metadata
  errorDetails: text("error_details"), // Error message if failed
  parentStepId: integer("parent_step_id").references((): any => agentExecutionSteps.id), // For sub-executions
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_agent_execution_steps_execution_id").on(table.executionId),
  index("idx_agent_execution_steps_layer").on(table.layer),
  index("idx_agent_execution_steps_status").on(table.status),
  index("idx_agent_execution_steps_order").on(table.executionId, table.stepOrder),
  index("idx_agent_execution_steps_agent").on(table.agentId),
]);

// Agent execution logs - Detailed coordination and communication logs
export const agentExecutionLogs = pgTable("agent_execution_logs", {
  id: serial("id").primaryKey(),
  executionId: varchar("execution_id").notNull().references(() => agentExecutions.executionId),
  stepId: integer("step_id").references(() => agentExecutionSteps.id), // Optional step reference
  logLevel: varchar("log_level").notNull().default("info"), // debug, info, warn, error
  source: varchar("source").notNull(), // orchestrator, agent, layer_coordinator, etc.
  message: text("message").notNull(),
  details: jsonb("details"), // Structured log data
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_agent_execution_logs_execution_id").on(table.executionId),
  index("idx_agent_execution_logs_step_id").on(table.stepId),
  index("idx_agent_execution_logs_level").on(table.logLevel),
  index("idx_agent_execution_logs_timestamp").on(table.timestamp),
]);

// Insert schemas for agent execution tracking
export const insertAgentExecutionSchema = createInsertSchema(agentExecutions).omit({
  id: true,
  startedAt: true,
  createdAt: true,
}).extend({
  executionId: z.string().min(1, "Execution ID is required"),
  persona: z.enum(["admin", "rachel", "john"], { message: "Invalid persona" }),
  command: z.string().min(1, "Command is required"),
  orchestrationStrategy: z.enum(["sequential", "parallel", "hybrid"]).default("sequential"),
});

export const insertAgentExecutionStepSchema = createInsertSchema(agentExecutionSteps).omit({
  id: true,
  createdAt: true,
}).extend({
  executionId: z.string().min(1, "Execution ID is required"),
  stepOrder: z.number().int().min(0, "Step order must be non-negative"),
  layer: z.enum(["Experience", "Meta Brain", "Role", "Process", "System", "Interface"], { message: "Invalid layer" }),
  agentName: z.string().min(1, "Agent name is required"),
  agentType: z.string().min(1, "Agent type is required"),
  action: z.string().min(1, "Action is required"),
  status: z.enum(["pending", "running", "completed", "error", "skipped"]).default("pending"),
});

export const insertAgentExecutionLogSchema = createInsertSchema(agentExecutionLogs).omit({
  id: true,
  timestamp: true,
}).extend({
  executionId: z.string().min(1, "Execution ID is required"),
  logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
  source: z.string().min(1, "Source is required"),
  message: z.string().min(1, "Message is required"),
});

// Types
export type Email = typeof emails.$inferSelect;
export type InsertEmail = typeof emails.$inferInsert;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;
export type StepDefinition = typeof stepDefinitions.$inferSelect;
export type StepFormSubmission = typeof stepFormSubmissions.$inferSelect;
export type InsertStepDefinition = z.infer<typeof insertStepDefinitionSchema>;
export type InsertStepFormSubmission = z.infer<typeof insertStepFormSubmissionSchema>;

// Agent execution tracking types
export type AgentExecution = typeof agentExecutions.$inferSelect;
export type InsertAgentExecution = z.infer<typeof insertAgentExecutionSchema>;
export type AgentExecutionStep = typeof agentExecutionSteps.$inferSelect;
export type InsertAgentExecutionStep = z.infer<typeof insertAgentExecutionStepSchema>;
export type AgentExecutionLog = typeof agentExecutionLogs.$inferSelect;
export type InsertAgentExecutionLog = z.infer<typeof insertAgentExecutionLogSchema>;

// CONFIGURATION MANAGEMENT LAYER - Effective-dated configuration system
// Following replit.md "NO HARD-CODING" principle for all business logic and thresholds

// Configuration registry - defines available configuration keys
export const configRegistry = pgTable("config_registry", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // string, number, boolean, json, array
  defaultValue: jsonb("default_value_jsonb"),
  scope: varchar("scope", { length: 50 }).notNull().default("global"), // global, persona, agent, workflow
  category: varchar("category", { length: 100 }).notNull(), // ui, business, security, voice, etc
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Performance indexes for frequently queried columns
  index("idx_config_registry_scope_category").on(table.scope, table.category),
  index("idx_config_registry_type").on(table.type),
  index("idx_config_registry_category").on(table.category),
]);

// Configuration values - effective-dated configuration data with scope precedence
export const configValues = pgTable("config_values", {
  id: serial("id").primaryKey(),
  configKey: varchar("config_key", { length: 255 }).notNull().references(() => configRegistry.key),
  scopeIdentifiers: jsonb("scope_identifiers"), // {persona: 'rachel', agentId: 123, workflowId: 456}
  // Extracted columns from scopeIdentifiers for efficient precedence queries
  persona: varchar("persona"), // maintained via triggers to stay in sync with scopeIdentifiers
  agentId: integer("agent_id"), // maintained via triggers to stay in sync with scopeIdentifiers
  workflowId: integer("workflow_id"), // maintained via triggers to stay in sync with scopeIdentifiers
  value: jsonb("value").notNull(),
  effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
  effectiveTo: timestamp("effective_to"), // null = active indefinitely
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Composite unique constraint to prevent duplicate versions within same scope
  unique("config_values_key_version_scope_unique").on(table.configKey, table.version, table.persona, table.agentId, table.workflowId),
  
  // Data integrity index - will be enhanced with constraints in migration
  index("idx_config_values_current_scope").on(
    table.configKey, 
    table.persona, 
    table.agentId, 
    table.workflowId,
    table.isActive
  ),
  
  // OPTIMIZED: Covering composite index for as-of queries performance
  index("idx_config_values_as_of_query").on(
    table.configKey, 
    table.persona, 
    table.agentId, 
    table.workflowId, 
    table.isActive,
    table.effectiveFrom
  ),
  
  // Additional performance indexes
  index("idx_config_values_effective_dates").on(table.effectiveFrom, table.effectiveTo),
  index("idx_config_values_scope_active").on(table.persona, table.agentId, table.workflowId, table.isActive)
]);

// Business rules engine - effective-dated business logic rules
export const businessRules = pgTable("business_rules", {
  id: serial("id").primaryKey(),
  ruleKey: varchar("rule_key", { length: 255 }).notNull(),
  ruleEngine: varchar("rule_engine", { length: 50 }).notNull().default("jsonlogic"), // jsonlogic, cel, simple
  expression: jsonb("expression").notNull(), // rule logic in chosen engine format
  params: jsonb("params"), // rule parameters
  scopeIdentifiers: jsonb("scope_identifiers"), // {persona: 'rachel', agentId: 123, workflowId: 456}
  // Extracted columns from scopeIdentifiers for efficient precedence queries
  persona: varchar("persona"), // maintained via triggers to stay in sync with scopeIdentifiers
  agentId: integer("agent_id"), // maintained via triggers to stay in sync with scopeIdentifiers
  workflowId: integer("workflow_id"), // maintained via triggers to stay in sync with scopeIdentifiers
  effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
  effectiveTo: timestamp("effective_to"), // null = active indefinitely
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  description: text("description").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Composite unique constraint to prevent duplicate versions within same scope
  unique("business_rules_key_version_scope_unique").on(table.ruleKey, table.version, table.persona, table.agentId, table.workflowId),
  
  // Data integrity index - will be enhanced with constraints in migration
  index("idx_business_rules_current_scope").on(
    table.ruleKey,
    table.persona, 
    table.agentId, 
    table.workflowId,
    table.isActive
  ),
  
  // OPTIMIZED: Covering composite index for as-of queries performance
  index("idx_business_rules_as_of_query").on(
    table.ruleKey,
    table.persona, 
    table.agentId,
    table.workflowId,
    table.isActive,
    table.effectiveFrom,
    table.ruleEngine
  ),
  
  // Additional performance indexes
  index("idx_business_rules_effective_dates").on(table.effectiveFrom, table.effectiveTo),
  index("idx_business_rules_scope_active").on(table.persona, table.agentId, table.workflowId, table.isActive),
  index("idx_business_rules_engine").on(table.ruleEngine)
]);

// Templates - effective-dated content templates for emails, voice, UI
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  templateKey: varchar("template_key", { length: 255 }).notNull(),
  channel: varchar("channel", { length: 50 }).notNull(), // email, voice, ui, sms
  content: jsonb("content").notNull(), // template content with placeholders
  locale: varchar("locale", { length: 10 }).notNull().default("en-US"),
  scopeIdentifiers: jsonb("scope_identifiers"), // {persona: 'rachel', agentId: 123, workflowId: 456}
  // Extracted columns from scopeIdentifiers for efficient precedence queries
  persona: varchar("persona"), // maintained via triggers to stay in sync with scopeIdentifiers
  agentId: integer("agent_id"), // maintained via triggers to stay in sync with scopeIdentifiers
  workflowId: integer("workflow_id"), // maintained via triggers to stay in sync with scopeIdentifiers
  effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
  effectiveTo: timestamp("effective_to"), // null = active indefinitely
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Composite unique constraint to prevent duplicate versions within same scope and locale/channel
  unique("templates_key_version_scope_channel_locale_unique").on(table.templateKey, table.version, table.persona, table.agentId, table.workflowId, table.channel, table.locale),
  
  // Data integrity index - will be enhanced with constraints in migration
  index("idx_templates_current_scope").on(
    table.templateKey,
    table.channel,
    table.locale, 
    table.persona,
    table.agentId,
    table.workflowId,
    table.isActive
  ),
  
  // OPTIMIZED: Covering composite index for as-of queries performance  
  index("idx_templates_as_of_query").on(
    table.templateKey,
    table.channel,
    table.locale,
    table.persona,
    table.agentId,
    table.workflowId,
    table.isActive,
    table.effectiveFrom
  ),
  
  // Additional performance indexes
  index("idx_templates_effective_dates").on(table.effectiveFrom, table.effectiveTo),
  index("idx_templates_scope_active").on(table.persona, table.agentId, table.workflowId, table.isActive),
  index("idx_templates_channel_active").on(table.channel, table.isActive)
]);

// Enhanced insert schemas for configuration management with proper refinements
export const insertConfigRegistrySchema = createInsertSchema(configRegistry).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  key: z.string().min(1, "Configuration key is required").max(255, "Key too long").regex(/^[a-zA-Z0-9_.-]+$/, "Key must contain only alphanumeric characters, dots, dashes, and underscores"),
  description: z.string().min(1, "Description is required").max(1000, "Description too long"),
  type: z.enum(["string", "number", "boolean", "json", "array"], { message: "Invalid configuration type" }),
  scope: z.enum(["global", "persona", "agent", "workflow"], { message: "Invalid scope type" }).default("global"),
  category: z.string().min(1, "Category is required").max(100, "Category too long"),
});

export const insertConfigValueSchema = createInsertSchema(configValues).omit({
  id: true,
  persona: true, // Generated column
  agentId: true, // Generated column
  workflowId: true, // Generated column
  updatedAt: true,
}).extend({
  configKey: z.string().min(1, "Configuration key is required").max(255),
  scopeIdentifiers: z.object({
    persona: z.string().optional(),
    agentId: z.number().int().positive().optional(),
    workflowId: z.number().int().positive().optional(),
  }).optional().nullable(),
  value: z.any().refine(val => val !== null && val !== undefined, "Value is required"),
  effectiveFrom: z.date().default(() => new Date()),
  effectiveTo: z.date().optional().nullable(),
  version: z.number().int().min(1, "Version must be positive").default(1),
  isActive: z.boolean().default(true),
}).refine(data => {
  if (data.effectiveTo && data.effectiveFrom && data.effectiveTo <= data.effectiveFrom) {
    return false;
  }
  return true;
}, { message: "effectiveTo must be after effectiveFrom", path: ["effectiveTo"] });

export const insertBusinessRuleSchema = createInsertSchema(businessRules).omit({
  id: true,
  persona: true, // Generated column
  agentId: true, // Generated column
  workflowId: true, // Generated column
  updatedAt: true,
}).extend({
  ruleKey: z.string().min(1, "Rule key is required").max(255, "Rule key too long"),
  ruleEngine: z.enum(["jsonlogic", "cel", "simple"], { message: "Invalid rule engine" }).default("jsonlogic"),
  expression: z.object({}).passthrough().refine(val => Object.keys(val).length > 0, "Expression cannot be empty"),
  params: z.object({}).passthrough().optional().nullable(),
  scopeIdentifiers: z.object({
    persona: z.string().optional(),
    agentId: z.number().int().positive().optional(),
    workflowId: z.number().int().positive().optional(),
  }).optional().nullable(),
  effectiveFrom: z.date().default(() => new Date()),
  effectiveTo: z.date().optional().nullable(),
  version: z.number().int().min(1, "Version must be positive").default(1),
  isActive: z.boolean().default(true),
  description: z.string().min(1, "Description is required").max(1000, "Description too long"),
}).refine(data => {
  if (data.effectiveTo && data.effectiveFrom && data.effectiveTo <= data.effectiveFrom) {
    return false;
  }
  return true;
}, { message: "effectiveTo must be after effectiveFrom", path: ["effectiveTo"] });

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  persona: true, // Generated column
  agentId: true, // Generated column
  workflowId: true, // Generated column
  updatedAt: true,
}).extend({
  templateKey: z.string().min(1, "Template key is required").max(255, "Template key too long"),
  channel: z.enum(["email", "voice", "ui", "sms"], { message: "Invalid channel type" }),
  content: z.object({}).passthrough().refine(val => Object.keys(val).length > 0, "Content cannot be empty"),
  locale: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/, "Locale must be in format xx-XX").default("en-US"),
  scopeIdentifiers: z.object({
    persona: z.string().optional(),
    agentId: z.number().int().positive().optional(),
    workflowId: z.number().int().positive().optional(),
  }).optional().nullable(),
  effectiveFrom: z.date().default(() => new Date()),
  effectiveTo: z.date().optional().nullable(),
  version: z.number().int().min(1, "Version must be positive").default(1),
  isActive: z.boolean().default(true),
}).refine(data => {
  if (data.effectiveTo && data.effectiveFrom && data.effectiveTo <= data.effectiveFrom) {
    return false;
  }
  return true;
}, { message: "effectiveTo must be after effectiveFrom", path: ["effectiveTo"] });

// Enhanced types for configuration management
export type ConfigRegistry = typeof configRegistry.$inferSelect;
export type ConfigValue = typeof configValues.$inferSelect;
export type BusinessRule = typeof businessRules.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type InsertConfigRegistry = z.infer<typeof insertConfigRegistrySchema>;
export type InsertConfigValue = z.infer<typeof insertConfigValueSchema>;
export type InsertBusinessRule = z.infer<typeof insertBusinessRuleSchema>;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;

// Configuration snapshots for point-in-time restoration
export const configSnapshots = pgTable("config_snapshots", {
  id: serial("id").primaryKey(),
  snapshotName: varchar("snapshot_name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  scopeFilter: jsonb("scope_filter"), // Optional scope filter for partial snapshots
  snapshotData: jsonb("snapshot_data").notNull(), // Complete configuration state
  metricsSummary: jsonb("metrics_summary"), // Count of configs, rules, templates captured
}, (table) => [
  index("idx_config_snapshots_created_by").on(table.createdBy),
  index("idx_config_snapshots_created_at").on(table.createdAt),
]);

// Configuration change audit log for rollback operations
export const configChangeLogs = pgTable("config_change_logs", {
  id: serial("id").primaryKey(),
  operationType: varchar("operation_type", { length: 50 }).notNull(), // set, rollback, snapshot_restore, bulk_update
  configKey: varchar("config_key", { length: 255 }).notNull(),
  configType: varchar("config_type", { length: 50 }).notNull(), // config_value, business_rule, template
  scopeIdentifiers: jsonb("scope_identifiers"),
  // Previous and new states for complete audit trail
  previousState: jsonb("previous_state"),
  newState: jsonb("new_state"),
  // Operation metadata
  performedBy: varchar("performed_by").notNull().references(() => users.id),
  reason: text("reason"), // User-provided reason for change
  rollbackTargetVersion: integer("rollback_target_version"), // For rollback operations
  rollbackTargetDate: timestamp("rollback_target_date"), // For date-based rollbacks
  snapshotId: integer("snapshot_id").references(() => configSnapshots.id), // For snapshot restore operations
  // Impact assessment
  affectedCount: integer("affected_count").default(1), // Number of configs affected
  impactScope: jsonb("impact_scope"), // Details of what was affected
  // Operation result
  success: boolean("success").notNull().default(true),
  errorDetails: jsonb("error_details"), // If operation failed
  executionTimeMs: integer("execution_time_ms"),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_config_change_logs_config_key").on(table.configKey),
  index("idx_config_change_logs_operation_type").on(table.operationType),
  index("idx_config_change_logs_performed_by").on(table.performedBy),
  index("idx_config_change_logs_timestamp").on(table.timestamp),
  index("idx_config_change_logs_config_scope").on(table.configKey, table.configType),
]);

// Insert schemas for new tables
export const insertConfigSnapshotSchema = createInsertSchema(configSnapshots).omit({
  id: true,
  createdAt: true,
}).extend({
  snapshotName: z.string().min(1, "Snapshot name is required").max(255, "Snapshot name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  scopeFilter: z.object({
    persona: z.string().optional(),
    agentId: z.number().int().positive().optional(),
    workflowId: z.number().int().positive().optional(),
  }).optional().nullable(),
});

export const insertConfigChangeLogSchema = createInsertSchema(configChangeLogs).omit({
  id: true,
  timestamp: true,
}).extend({
  operationType: z.enum(["set", "rollback", "snapshot_restore", "bulk_update"], { message: "Invalid operation type" }),
  configKey: z.string().min(1, "Configuration key is required").max(255),
  configType: z.enum(["config_value", "business_rule", "template"], { message: "Invalid config type" }),
  reason: z.string().max(1000, "Reason too long").optional(),
});

// Types for new tables
export type ConfigSnapshot = typeof configSnapshots.$inferSelect;
export type ConfigChangeLog = typeof configChangeLogs.$inferSelect;
export type InsertConfigSnapshot = z.infer<typeof insertConfigSnapshotSchema>;
export type InsertConfigChangeLog = z.infer<typeof insertConfigChangeLogSchema>;

// Note: Partial update schemas can be created in the application layer as needed
// using insertConfigValueSchema.partial(), insertBusinessRuleSchema.partial(), etc.

// ==========================================
// MDP GOVERNANCE & COMPLIANCE EXTENSIONS
// ==========================================

// AI Model Registry for basic model management (MDP)
export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  modelName: varchar("model_name", { length: 100 }).notNull(),
  modelVersion: varchar("model_version", { length: 50 }).notNull(),
  modelType: varchar("model_type", { length: 50 }).notNull(), // underwriting, claims, fraud, customer-service
  deploymentStatus: varchar("deployment_status", { length: 20 }).default("development"), // development, staging, production
  riskLevel: varchar("risk_level", { length: 10 }).default("medium"), // low, medium, high, critical
  lastTested: timestamp("last_tested"),
  performanceScore: decimal("performance_score", { precision: 5, scale: 2 }), // 0-100 score
  notes: text("notes"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ai_models_type").on(table.modelType),
  index("idx_ai_models_status").on(table.deploymentStatus),
]);

// Risk Assessments for agent governance (MDP)
export const riskAssessments = pgTable("risk_assessments", {
  id: serial("id").primaryKey(),
  targetType: varchar("target_type", { length: 20 }).notNull(), // agent, model, workflow
  targetId: varchar("target_id", { length: 50 }).notNull(),
  targetName: varchar("target_name", { length: 100 }).notNull(),
  overallRisk: varchar("overall_risk", { length: 10 }).default("medium"), // low, medium, high, critical
  biasRisk: varchar("bias_risk", { length: 10 }).default("low"),
  privacyRisk: varchar("privacy_risk", { length: 10 }).default("low"),
  robustnessRisk: varchar("robustness_risk", { length: 10 }).default("low"),
  assessedDate: timestamp("assessed_date").defaultNow(),
  assessorId: varchar("assessor_id").notNull().references(() => users.id),
  assessorNotes: text("assessor_notes"),
  mitigationActions: text("mitigation_actions").array(),
  nextReviewDate: timestamp("next_review_date"),
  // Phase 2.1: EU AI Act Compliance Fields
  euAiActCompliance: varchar("eu_ai_act_compliance", { length: 20 }).default("pending"), // compliant, non-compliant, pending, exempt
  euAiActRiskCategory: varchar("eu_ai_act_risk_category", { length: 30 }).default("limited"), // unacceptable, high, limited, minimal
  euAiActRequirements: text("eu_ai_act_requirements").array(), // Required compliance measures
  // Phase 2.1: Decision Reasoning Fields
  decisionReasoning: text("decision_reasoning"), // Detailed explanation of AI decision process
  explainabilityScore: decimal("explainability_score", { precision: 5, scale: 2 }), // 0-100 explainability rating
  decisionFactors: jsonb("decision_factors"), // Key factors influencing the decision
  // Phase 2.1: Enhanced Bias Detection Fields
  biasTestResults: jsonb("bias_test_results"), // Structured bias detection results
  fairnessMetrics: jsonb("fairness_metrics"), // Demographic parity, equalized odds, etc.
  biasCategories: text("bias_categories").array(), // age, gender, race, etc.
  biasDetectionMethod: varchar("bias_detection_method", { length: 50 }), // statistical, ml-based, audit
}, (table) => [
  index("idx_risk_assessments_target").on(table.targetType, table.targetId),
  index("idx_risk_assessments_overall_risk").on(table.overallRisk),
  index("idx_risk_assessments_eu_compliance").on(table.euAiActCompliance),
  index("idx_risk_assessments_eu_risk_category").on(table.euAiActRiskCategory),
]);

// Audit Trails for compliance tracking (MDP)
export const auditTrails = pgTable("audit_trails", {
  id: serial("id").primaryKey(),
  auditType: varchar("audit_type", { length: 50 }).notNull(), // bias, performance, compliance, security, eu-ai-act, decision-reasoning
  targetType: varchar("target_type", { length: 20 }).notNull(), // agent, model, workflow, system
  targetId: varchar("target_id", { length: 50 }).notNull(),
  targetName: varchar("target_name", { length: 100 }).notNull(),
  auditDate: timestamp("audit_date").defaultNow(),
  auditorId: varchar("auditor_id").notNull().references(() => users.id),
  findings: text("findings").array(),
  recommendations: text("recommendations").array(),
  complianceScore: decimal("compliance_score", { precision: 5, scale: 2 }), // 0-100 score
  status: varchar("status", { length: 20 }).default("pending"), // pending, in-progress, completed, failed
  auditDetails: jsonb("audit_details"), // Structured audit data
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  // Phase 2.1: EU AI Act Compliance Tracking
  euAiActAuditType: varchar("eu_ai_act_audit_type", { length: 30 }), // conformity, risk-management, transparency, human-oversight
  euAiActArticles: text("eu_ai_act_articles").array(), // Specific EU AI Act articles being audited
  euAiActComplianceStatus: varchar("eu_ai_act_compliance_status", { length: 20 }), // fully-compliant, partially-compliant, non-compliant
  // Phase 2.1: Decision Reasoning Tracking
  decisionReasoningAudit: jsonb("decision_reasoning_audit"), // Audit of AI decision reasoning quality
  explainabilityGaps: text("explainability_gaps").array(), // Areas where explanations are insufficient
  decisionTraceability: jsonb("decision_traceability"), // Audit trail of decision factors
  // Phase 2.1: Enhanced Bias Detection Tracking
  biasDetectionResults: jsonb("bias_detection_results"), // Comprehensive bias testing results
  fairnessAuditMetrics: jsonb("fairness_audit_metrics"), // Fairness assessment results
  biasRemediationPlan: text("bias_remediation_plan"), // Plan to address detected biases
  biasImpactAssessment: jsonb("bias_impact_assessment"), // Assessment of bias impact on stakeholders
}, (table) => [
  index("idx_audit_trails_type").on(table.auditType),
  index("idx_audit_trails_target").on(table.targetType, table.targetId),
  index("idx_audit_trails_status").on(table.status),
  index("idx_audit_trails_eu_compliance").on(table.euAiActComplianceStatus),
  index("idx_audit_trails_eu_audit_type").on(table.euAiActAuditType),
]);

// Integration Configurations for system connectors (MDP)
export const integrationConfigs = pgTable("integration_configs", {
  id: serial("id").primaryKey(),
  connectorName: varchar("connector_name", { length: 100 }).notNull(),
  connectorType: varchar("connector_type", { length: 50 }).notNull(), // salesforce, guidewire, duckcreek, email, custom
  connectionStatus: varchar("connection_status", { length: 20 }).default("disconnected"), // connected, disconnected, error, testing
  lastSync: timestamp("last_sync"),
  syncFrequency: varchar("sync_frequency", { length: 20 }).default("manual"), // manual, hourly, daily, weekly
  basicConfig: jsonb("basic_config"), // Non-sensitive configuration data
  healthMetrics: jsonb("health_metrics"), // Connection performance data
  errorLog: text("error_log").array(), // Recent error messages
  isActive: boolean("is_active").default(true),
  configuredBy: varchar("configured_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_integration_configs_type").on(table.connectorType),
  index("idx_integration_configs_status").on(table.connectionStatus),
]);

// Governance Metrics for dashboard (MDP)
export const governanceMetrics = pgTable("governance_metrics", {
  id: serial("id").primaryKey(),
  metricType: varchar("metric_type", { length: 50 }).notNull(), // compliance_score, risk_level, audit_coverage
  metricValue: decimal("metric_value", { precision: 10, scale: 2 }).notNull(),
  metricUnit: varchar("metric_unit", { length: 20 }), // percentage, count, score
  targetType: varchar("target_type", { length: 20 }), // system, agent, model
  targetId: varchar("target_id", { length: 50 }),
  recordedDate: timestamp("recorded_date").defaultNow(),
  recordedBy: varchar("recorded_by").references(() => users.id),
  metadata: jsonb("metadata"), // Additional context
}, (table) => [
  index("idx_governance_metrics_type").on(table.metricType),
  index("idx_governance_metrics_date").on(table.recordedDate),
]);

// Insert schemas for MDP governance tables
export const insertAiModelSchema = createInsertSchema(aiModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  modelName: z.string().min(1, "Model name is required").max(100),
  modelVersion: z.string().min(1, "Model version is required").max(50),
  modelType: z.enum(["underwriting", "claims", "fraud", "customer-service"], { message: "Invalid model type" }),
  deploymentStatus: z.enum(["development", "staging", "production"]).default("development"),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});

export const insertRiskAssessmentSchema = createInsertSchema(riskAssessments).omit({
  id: true,
  assessedDate: true,
}).extend({
  targetType: z.enum(["agent", "model", "workflow"], { message: "Invalid target type" }),
  targetId: z.string().min(1, "Target ID is required"),
  targetName: z.string().min(1, "Target name is required"),
  overallRisk: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  biasRisk: z.enum(["low", "medium", "high", "critical"]).default("low"),
  privacyRisk: z.enum(["low", "medium", "high", "critical"]).default("low"),
  robustnessRisk: z.enum(["low", "medium", "high", "critical"]).default("low"),
});

export const insertAuditTrailSchema = createInsertSchema(auditTrails).omit({
  id: true,
  auditDate: true,
}).extend({
  auditType: z.enum(["bias", "performance", "compliance", "security"], { message: "Invalid audit type" }),
  targetType: z.enum(["agent", "model", "workflow", "system"], { message: "Invalid target type" }),
  targetId: z.string().min(1, "Target ID is required"),
  targetName: z.string().min(1, "Target name is required"),
  status: z.enum(["pending", "in-progress", "completed", "failed"]).default("pending"),
});

export const insertIntegrationConfigSchema = createInsertSchema(integrationConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  connectorName: z.string().min(1, "Connector name is required").max(100),
  connectorType: z.enum(["salesforce", "guidewire", "duckcreek", "email", "custom"], { message: "Invalid connector type" }),
  connectionStatus: z.enum(["connected", "disconnected", "error", "testing"]).default("disconnected"),
  syncFrequency: z.enum(["manual", "hourly", "daily", "weekly"]).default("manual"),
});

export const insertGovernanceMetricSchema = createInsertSchema(governanceMetrics).omit({
  id: true,
  recordedDate: true,
}).extend({
  metricType: z.string().min(1, "Metric type is required"),
  metricValue: z.string().regex(/^-?\d+(\.\d+)?$/, "Metric value must be a valid number"),
  targetType: z.enum(["system", "agent", "model"]).optional(),
});

// Role Personas schemas - Enhanced for dynamic agent-to-persona conversion
export const insertRolePersonaSchema = createInsertSchema(rolePersonas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  personaKey: z.string().min(1, "Persona key is required").max(50, "Persona key too long"),
  displayName: z.string().min(1, "Display name is required").max(100, "Display name too long"),
  agentRole: z.string().max(200, "Agent role too long").optional(),
  department: z.string().max(100, "Department name too long").optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional(),
  personaType: z.enum(["static", "dynamic"]).default("static"),
  accessLevel: z.enum(["admin", "advanced", "standard"]).default("standard"),
});

export type RolePersona = typeof rolePersonas.$inferSelect;
export type InsertRolePersona = z.infer<typeof insertRolePersonaSchema>;

// Types for MDP governance tables
export type AiModel = typeof aiModels.$inferSelect;
export type RiskAssessment = typeof riskAssessments.$inferSelect;
export type AuditTrail = typeof auditTrails.$inferSelect;
export type IntegrationConfig = typeof integrationConfigs.$inferSelect;
export type GovernanceMetric = typeof governanceMetrics.$inferSelect;

export type InsertAiModel = z.infer<typeof insertAiModelSchema>;
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;
export type InsertAuditTrail = z.infer<typeof insertAuditTrailSchema>;
export type InsertIntegrationConfig = z.infer<typeof insertIntegrationConfigSchema>;
export type InsertGovernanceMetric = z.infer<typeof insertGovernanceMetricSchema>;

// ==========================================
// METADATA-DRIVEN UI FORM SYSTEM
// ==========================================

// Form Field Definitions for metadata-driven UI components
export const formFieldDefinitions = pgTable("form_field_definitions", {
  id: serial("id").primaryKey(),
  formType: varchar("form_type", { length: 50 }).notNull(), // 'agent_create', 'agent_edit', 'governance', etc.
  fieldKey: varchar("field_key", { length: 100 }).notNull(),
  fieldType: varchar("field_type", { length: 50 }).notNull(), // 'text', 'select', 'multiselect', 'textarea', 'toggle', 'tabs', 'maturity_selector', etc.
  label: varchar("label", { length: 200 }).notNull(),
  description: text("description"),
  placeholder: varchar("placeholder", { length: 200 }),
  validationRules: jsonb("validation_rules"), // Zod validation rules as JSON
  options: jsonb("options"), // For select/multiselect fields - array of {value, label} objects
  dependencies: jsonb("dependencies"), // Conditional field display logic
  uiProps: jsonb("ui_props"), // Styling, layout, className, etc.
  order: integer("order").default(0),
  isRequired: boolean("is_required").default(false),
  isActive: boolean("is_active").default(true),
  // Persona and maturity filtering
  persona: varchar("persona", { length: 50 }), // Filter fields by persona (admin, rachel, john, broker)
  maturityLevel: varchar("maturity_level", { length: 10 }), // Show fields based on agent maturity (L0-L4)
  // ConfigService integration
  scope: varchar("scope", { length: 50 }).default("global"), // ConfigService scope
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_form_field_definitions_form_type").on(table.formType),
  index("idx_form_field_definitions_persona").on(table.persona),
  index("idx_form_field_definitions_maturity").on(table.maturityLevel),
  index("idx_form_field_definitions_active").on(table.isActive),
]);

// Form Templates for predefined form configurations
export const formTemplates = pgTable("form_templates", {
  id: serial("id").primaryKey(),
  templateName: varchar("template_name", { length: 100 }).notNull().unique(),
  formType: varchar("form_type", { length: 50 }).notNull(),
  description: text("description"),
  configuration: jsonb("configuration").notNull(), // Complete form configuration
  persona: varchar("persona", { length: 50 }), // Template for specific persona
  maturityLevel: varchar("maturity_level", { length: 10 }), // Template for specific maturity level
  isDefault: boolean("is_default").default(false), // Default template for form type
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_form_templates_form_type").on(table.formType),
  index("idx_form_templates_persona").on(table.persona),
  index("idx_form_templates_default").on(table.isDefault),
]);

// UI Component Registry for reusable lego blocks
export const uiComponentRegistry = pgTable("ui_component_registry", {
  id: serial("id").primaryKey(),
  componentName: varchar("component_name", { length: 100 }).notNull().unique(),
  componentType: varchar("component_type", { length: 50 }).notNull(), // 'atomic', 'molecular', 'organism'
  category: varchar("category", { length: 50 }).notNull(), // 'form', 'display', 'navigation', 'governance', etc.
  description: text("description"),
  props: jsonb("props"), // Component props schema
  defaultProps: jsonb("default_props"), // Default props values
  configuration: jsonb("configuration"), // ConfigService settings for component
  dependencies: text("dependencies").array(), // Required other components
  personaCompatibility: text("persona_compatibility").array(), // Compatible personas
  maturityLevelSupport: text("maturity_level_support").array(), // Supported maturity levels
  version: varchar("version", { length: 20 }).default("1.0.0"),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ui_component_registry_type").on(table.componentType),
  index("idx_ui_component_registry_category").on(table.category),
  index("idx_ui_component_registry_active").on(table.isActive),
]);

// Insert schemas for metadata-driven UI tables
export const insertFormFieldDefinitionSchema = createInsertSchema(formFieldDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  formType: z.string().min(1, "Form type is required").max(50),
  fieldKey: z.string().min(1, "Field key is required").max(100),
  fieldType: z.enum(["text", "textarea", "select", "multiselect", "toggle", "checkbox", "number", "date", "time", "datetime", "email", "url", "tel", "password", "maturity_selector", "governance_panel", "capability_builder", "version_control", "tabs"], { message: "Invalid field type" }),
  label: z.string().min(1, "Label is required").max(200),
  description: z.string().max(1000).optional(),
  placeholder: z.string().max(200).optional(),
  persona: z.enum(["admin", "rachel", "john", "broker"]).optional(),
  maturityLevel: z.enum(["L0", "L1", "L2", "L3", "L4"]).optional(),
  scope: z.string().max(50).default("global"),
});

export const insertFormTemplateSchema = createInsertSchema(formTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
}).extend({
  templateName: z.string().min(1, "Template name is required").max(100),
  formType: z.string().min(1, "Form type is required").max(50),
  description: z.string().max(1000).optional(),
  persona: z.enum(["admin", "rachel", "john", "broker"]).optional(),
  maturityLevel: z.enum(["L0", "L1", "L2", "L3", "L4"]).optional(),
});

export const insertUiComponentRegistrySchema = createInsertSchema(uiComponentRegistry).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
}).extend({
  componentName: z.string().min(1, "Component name is required").max(100),
  componentType: z.enum(["atomic", "molecular", "organism"], { message: "Invalid component type" }),
  category: z.string().min(1, "Category is required").max(50),
  description: z.string().max(1000).optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must be in semantic versioning format").default("1.0.0"),
});

// Types for metadata-driven UI tables
export type FormFieldDefinition = typeof formFieldDefinitions.$inferSelect;
export type FormTemplate = typeof formTemplates.$inferSelect;
export type UiComponentRegistry = typeof uiComponentRegistry.$inferSelect;

export type InsertFormFieldDefinition = z.infer<typeof insertFormFieldDefinitionSchema>;
export type InsertFormTemplate = z.infer<typeof insertFormTemplateSchema>;
export type InsertUiComponentRegistry = z.infer<typeof insertUiComponentRegistrySchema>;

// ==========================================
// HIERARCHY METADATA SYSTEM
// ==========================================

// Tab Configurations for Command Center and Experience Layer
export const tabConfigurations = pgTable("tab_configurations", {
  id: serial("id").primaryKey(),
  tabKey: varchar("tab_key", { length: 100 }).notNull().unique(),
  tabName: varchar("tab_name", { length: 100 }).notNull(),
  tabType: varchar("tab_type", { length: 50 }).notNull(), // 'command_center', 'experience_layer', 'governance', etc.
  icon: varchar("icon", { length: 100 }), // Lucide icon name
  description: text("description"),
  order: integer("order").default(0),
  isVisible: boolean("is_visible").default(true),
  isActive: boolean("is_active").default(true),
  // Persona and scope filtering
  personaAccess: text("persona_access").array().default(["{admin}", "{rachel}", "{john}", "{broker}"]), // Who can see this tab
  requiredPermissions: text("required_permissions").array(), // Required permissions
  // ConfigService integration
  configurationKeys: text("configuration_keys").array(), // ConfigService keys this tab manages
  // Content configuration
  contentConfig: jsonb("content_config"), // Tab-specific content configuration
  layoutConfig: jsonb("layout_config"), // Layout and styling configuration
  conditionalDisplay: jsonb("conditional_display"), // Rules for when to show tab
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_tab_configurations_type").on(table.tabType),
  index("idx_tab_configurations_active").on(table.isActive),
  index("idx_tab_configurations_visible").on(table.isVisible),
  index("idx_tab_configurations_order").on(table.order),
]);

// Hierarchy Layer Configurations for 6-layer architecture
export const hierarchyLayerConfigurations = pgTable("hierarchy_layer_configurations", {
  id: serial("id").primaryKey(),
  layerKey: varchar("layer_key", { length: 50 }).notNull(), // 'experience', 'meta_brain', 'role', 'process', 'system', 'interface'
  layerName: varchar("layer_name", { length: 100 }).notNull(),
  layerLevel: integer("layer_level").notNull(), // 1-6 corresponding to the hierarchy
  description: text("description"),
  // Data source configuration
  dataSource: varchar("data_source", { length: 100 }).notNull(), // 'experienceLayer', 'metaBrainLayer', 'agents', 'configValues'
  dataSourceQuery: jsonb("data_source_query"), // Query configuration for the data source
  // Display configuration
  displayConfig: jsonb("display_config"), // How this layer should be displayed
  branding: jsonb("branding"), // Layer-specific branding configuration
  // Scope and persona configuration
  scopeIdentifiers: jsonb("scope_identifiers"), // {persona: 'rachel', agentId: 123, workflowId: 456}
  persona: varchar("persona"), // Extracted for efficient queries
  agentId: integer("agent_id"), // Extracted for efficient queries
  workflowId: integer("workflow_id"), // Extracted for efficient queries
  // Effective dating
  effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
  effectiveTo: timestamp("effective_to"), // null = active indefinitely
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("hierarchy_layer_configurations_key_version_scope_unique").on(table.layerKey, table.version, table.persona, table.agentId, table.workflowId),
  index("idx_hierarchy_layer_configurations_key").on(table.layerKey),
  index("idx_hierarchy_layer_configurations_level").on(table.layerLevel),
  index("idx_hierarchy_layer_configurations_active_scope").on(table.layerKey, table.persona, table.agentId, table.workflowId, table.isActive),
  index("idx_hierarchy_layer_configurations_effective_dates").on(table.effectiveFrom, table.effectiveTo),
]);

// Component Feature Configurations for metadata-driven features within tabs
export const componentFeatureConfigurations = pgTable("component_feature_configurations", {
  id: serial("id").primaryKey(),
  featureKey: varchar("feature_key", { length: 100 }).notNull(),
  featureName: varchar("feature_name", { length: 100 }).notNull(),
  componentType: varchar("component_type", { length: 50 }).notNull(), // 'card', 'panel', 'widget', 'chart', etc.
  parentTabKey: varchar("parent_tab_key", { length: 100 }).references(() => tabConfigurations.tabKey),
  parentLayerKey: varchar("parent_layer_key", { length: 50 }).references(() => hierarchyLayerConfigurations.layerKey),
  description: text("description"),
  order: integer("order").default(0),
  isVisible: boolean("is_visible").default(true),
  isActive: boolean("is_active").notNull().default(true),
  // Configuration
  featureConfig: jsonb("feature_config").notNull(), // Component-specific configuration
  dataBinding: jsonb("data_binding"), // How this feature binds to data sources
  interactionConfig: jsonb("interaction_config"), // User interaction configuration
  // Scope and access control
  personaAccess: text("persona_access").array().default(["{admin}", "{rachel}", "{john}", "{broker}"]),
  requiredPermissions: text("required_permissions").array(),
  conditionalDisplay: jsonb("conditional_display"), // Rules for when to show feature
  // Effective dating
  effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
  effectiveTo: timestamp("effective_to"), // null = active indefinitely
  version: integer("version").notNull().default(1),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("component_feature_configurations_key_version_unique").on(table.featureKey, table.version),
  index("idx_component_feature_configurations_parent_tab").on(table.parentTabKey),
  index("idx_component_feature_configurations_parent_layer").on(table.parentLayerKey),
  index("idx_component_feature_configurations_type").on(table.componentType),
  index("idx_component_feature_configurations_active").on(table.isActive),
  index("idx_component_feature_configurations_effective_dates").on(table.effectiveFrom, table.effectiveTo),
]);

// Insert schemas for hierarchy metadata tables
export const insertTabConfigurationSchema = createInsertSchema(tabConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tabKey: z.string().min(1, "Tab key is required").max(100).regex(/^[a-zA-Z0-9_-]+$/, "Tab key must contain only alphanumeric characters, underscores, and hyphens"),
  tabName: z.string().min(1, "Tab name is required").max(100),
  tabType: z.enum(["command_center", "experience_layer", "governance", "agent_directory", "config_registry", "meta_brain", "integrations"], { message: "Invalid tab type" }),
  icon: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  order: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
  isActive: z.boolean().default(true),
  personaAccess: z.array(z.enum(["admin", "rachel", "john", "broker"])).default(["admin", "rachel", "john", "broker"]),
  requiredPermissions: z.array(z.string()).optional(),
  configurationKeys: z.array(z.string()).optional(),
});

export const insertHierarchyLayerConfigurationSchema = createInsertSchema(hierarchyLayerConfigurations).omit({
  id: true,
  persona: true, // Generated column
  agentId: true, // Generated column
  workflowId: true, // Generated column
  updatedAt: true,
}).extend({
  layerKey: z.enum(["experience", "meta_brain", "role", "process", "system", "interface"], { message: "Invalid layer key" }),
  layerName: z.string().min(1, "Layer name is required").max(100),
  layerLevel: z.number().int().min(1).max(6),
  description: z.string().max(1000).optional(),
  dataSource: z.enum(["experienceLayer", "metaBrainLayer", "agents", "configValues", "rolePersonas"], { message: "Invalid data source" }),
  scopeIdentifiers: z.object({
    persona: z.string().optional(),
    agentId: z.number().int().positive().optional(),
    workflowId: z.number().int().positive().optional(),
  }).optional().nullable(),
  effectiveFrom: z.date().default(() => new Date()),
  effectiveTo: z.date().optional().nullable(),
  version: z.number().int().min(1, "Version must be positive").default(1),
  isActive: z.boolean().default(true),
});

export const insertComponentFeatureConfigurationSchema = createInsertSchema(componentFeatureConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  featureKey: z.string().min(1, "Feature key is required").max(100).regex(/^[a-zA-Z0-9_-]+$/, "Feature key must contain only alphanumeric characters, underscores, and hyphens"),
  featureName: z.string().min(1, "Feature name is required").max(100),
  componentType: z.enum(["card", "panel", "widget", "chart", "table", "form", "modal", "button", "tabs"], { message: "Invalid component type" }),
  parentTabKey: z.string().max(100).optional(),
  parentLayerKey: z.enum(["experience", "meta_brain", "role", "process", "system", "interface"]).optional(),
  description: z.string().max(1000).optional(),
  order: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
  isActive: z.boolean().default(true),
  featureConfig: z.object({}).passthrough().refine(val => Object.keys(val).length > 0, "Feature configuration cannot be empty"),
  personaAccess: z.array(z.enum(["admin", "rachel", "john", "broker"])).default(["admin", "rachel", "john", "broker"]),
  requiredPermissions: z.array(z.string()).optional(),
  effectiveFrom: z.date().default(() => new Date()),
  effectiveTo: z.date().optional().nullable(),
  version: z.number().int().min(1, "Version must be positive").default(1),
});

// Types for hierarchy metadata tables
export type TabConfiguration = typeof tabConfigurations.$inferSelect;
export type HierarchyLayerConfiguration = typeof hierarchyLayerConfigurations.$inferSelect;
export type ComponentFeatureConfiguration = typeof componentFeatureConfigurations.$inferSelect;

export type InsertTabConfiguration = z.infer<typeof insertTabConfigurationSchema>;
export type InsertHierarchyLayerConfiguration = z.infer<typeof insertHierarchyLayerConfigurationSchema>;
export type InsertComponentFeatureConfiguration = z.infer<typeof insertComponentFeatureConfigurationSchema>;

import {
  users,
  userSessions,
  commands,
  activities,
  errors,
  agents,
  submissions,
  incidents,
  personalizationConfigs,
  dashboardKpis,
  metaBrainSettings,
  orchestrationWorkflows,
  dataPrepLayers,
  aiCommands,
  systemIntegrations,
  agentTemplates,
  emails,
  emailTemplates,
  experienceLayer,
  metaBrainLayer,
  userProfiles,
  userPreferences,
  rolePersonas,
  userJourneyInteractions,
  userJourneySessions,
  userJourneyHeatmaps,
  voiceTranscripts,
  commercialPropertyWorkflows,
  commercialPropertyCopeData,
  commercialPropertySubmissions,
  stepDefinitions,
  stepFormSubmissions,
  agentExecutions,
  agentExecutionSteps,
  agentExecutionLogs,
  type User,
  type UpsertUser,
  type UserSession,
  type Command,
  type Activity,
  type Error,
  type Agent,
  type Submission,
  type Incident,
  type PersonalizationConfig,
  type DashboardKpi,
  type MetaBrainSetting,
  type OrchestrationWorkflow,
  type DataPrepLayer,
  type AiCommand,
  type SystemIntegration,
  type AgentTemplate,
  type Email,
  type InsertEmail,
  type EmailTemplate,
  type InsertEmailTemplate,
  type AgentExecution,
  type InsertAgentExecution,
  type AgentExecutionStep,
  type InsertAgentExecutionStep,
  type AgentExecutionLog,
  type InsertAgentExecutionLog,
  type UserJourneyInteraction,
  type InsertUserJourneyInteraction,
  type UserJourneySession,
  type InsertUserJourneySession,
  type UserJourneyHeatmap,
  type InsertUserJourneyHeatmap,
  type InsertUserSession,
  type InsertCommand,
  type InsertActivity,
  type InsertError,
  type InsertAgent,
  type InsertSubmission,
  type InsertIncident,
  type InsertPersonalizationConfig,
  type UserProfile,
  type UserPreferences,
  type InsertUserProfile,
  type InsertUserPreferences,
  type RolePersona,
  type InsertRolePersona,
  type InsertDashboardKpi,
  type InsertMetaBrainSetting,
  type InsertOrchestrationWorkflow,
  type InsertDataPrepLayer,
  type InsertAiCommand,
  type InsertSystemIntegration,
  type InsertAgentTemplate,
  type VoiceTranscript,
  type InsertVoiceTranscript,
  type CommercialPropertyWorkflow,
  type InsertCommercialPropertyWorkflow,
  type CommercialPropertyCopeData,
  type InsertCommercialPropertyCopeData,
  type CommercialPropertySubmission,
  type InsertCommercialPropertySubmission,
  type StepDefinition,
  type StepFormSubmission,
  type InsertStepDefinition,
  type InsertStepFormSubmission,
  configRegistry,
  type ConfigRegistry,
  type InsertConfigRegistry,
  tabConfigurations,
  type TabConfiguration,
  type InsertTabConfiguration,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, gte, lte, sql, isNull } from "drizzle-orm";

// Email filter interface for unified email system
interface EmailFilters {
  persona?: string;
  emailType?: string;
  deliveryStatus?: string;
  dateFrom?: Date;
  dateTo?: Date;
  brokerName?: string;
  searchQuery?: string;
}

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Session operations
  getUserSession(userId: string): Promise<UserSession | undefined>;
  upsertUserSession(session: InsertUserSession): Promise<UserSession>;
  
  // Command operations
  createCommand(command: InsertCommand): Promise<Command>;
  getRecentCommands(userId: string, limit: number): Promise<Command[]>;
  updateCommand(id: number, updates: Partial<InsertCommand>): Promise<Command>;
  
  // Activity operations
  createActivity(activity: InsertActivity): Promise<Activity>;
  getRecentActivities(userId: string, limit: number): Promise<Activity[]>;
  
  // Error operations
  createError(error: InsertError): Promise<Error>;
  
  // Agent operations
  createAgent(agent: InsertAgent): Promise<Agent>;
  getAgents(): Promise<Agent[]>;
  getAgentById(id: number): Promise<Agent | undefined>;
  getAgentsByLayer(layer: string): Promise<Agent[]>;
  getAgentByName(name: string): Promise<Agent | undefined>;
  updateAgent(id: number, updates: Partial<InsertAgent>): Promise<Agent>;
  deleteAgent(id: number): Promise<void>;
  createAgentIfNotExists(agentData: InsertAgent): Promise<Agent>;
  
  // Submission operations
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmissions(limit?: number): Promise<Submission[]>;
  getSubmissionsByAssignee(assignedTo: string): Promise<Submission[]>;
  
  // Incident operations
  createIncident(incident: InsertIncident): Promise<Incident>;
  getIncidents(limit?: number): Promise<Incident[]>;
  getIncidentsByAssignee(assignedTo: string): Promise<Incident[]>;
  
  // Personalization operations
  getPersonalizationConfig(insurerId: number): Promise<PersonalizationConfig | undefined>;
  upsertPersonalizationConfig(config: InsertPersonalizationConfig): Promise<PersonalizationConfig>;
  
  // Dashboard KPI operations
  getDashboardKpis(): Promise<DashboardKpi[]>;
  getDashboardKpisByCategory(category: string): Promise<DashboardKpi[]>;
  upsertDashboardKpi(kpi: InsertDashboardKpi): Promise<DashboardKpi>;
  
  // Meta Brain Settings operations
  getMetaBrainSettings(): Promise<MetaBrainSetting[]>;
  getMetaBrainSettingsByCategory(category: string): Promise<MetaBrainSetting[]>;
  updateMetaBrainSetting(settingName: string, settingValue: string): Promise<MetaBrainSetting>;
  
  // Orchestration Workflow operations
  getOrchestrationWorkflows(): Promise<OrchestrationWorkflow[]>;
  createOrchestrationWorkflow(workflow: InsertOrchestrationWorkflow): Promise<OrchestrationWorkflow>;
  updateWorkflowStatus(id: number, status: string): Promise<OrchestrationWorkflow>;
  
  // Data Preparation Layer operations
  getDataPrepLayers(): Promise<DataPrepLayer[]>;
  createDataPrepLayer(layer: InsertDataPrepLayer): Promise<DataPrepLayer>;
  updateDataPrepProgress(id: number, recordsProcessed: number, qualityScore: string): Promise<DataPrepLayer>;
  
  // AI Command Center operations
  getAiCommands(): Promise<AiCommand[]>;
  createAiCommand(command: InsertAiCommand): Promise<AiCommand>;
  updateCommandStats(id: number, executionCount: number, avgResponseTime: number, successRate: string): Promise<AiCommand>;
  
  // System Integration operations
  getSystemIntegrations(): Promise<SystemIntegration[]>;
  createSystemIntegration(integration: InsertSystemIntegration): Promise<SystemIntegration>;
  updateIntegrationHealth(id: number, healthScore: string, errorCount: number): Promise<SystemIntegration>;
  
  // Agent Template operations
  getAgentTemplates(): Promise<AgentTemplate[]>;
  createAgentTemplate(template: InsertAgentTemplate): Promise<AgentTemplate>;
  getAgentTemplatesByLayer(layer: string): Promise<AgentTemplate[]>;
  
  // Email operations
  createEmail(email: InsertEmail): Promise<Email>;
  getEmails(userId: string, filters?: any): Promise<Email[]>;
  getEmailById(id: number): Promise<Email | undefined>;
  updateEmailStatus(id: number, status: string, timestamp?: Date): Promise<Email>;
  getUnprocessedBrokerEmails(brokerDomains: string[]): Promise<Email[]>;
  
  // Email template operations
  getEmailTemplates(persona?: string, type?: string): Promise<EmailTemplate[]>;
  getEmailTemplateById(templateId: string): Promise<EmailTemplate | undefined>;
  
  // Experience Layer operations
  getExperienceLayer(): Promise<any>;
  
  // Meta Brain Layer operations
  getMetaBrainLayer(): Promise<any>;
  
  // Experience Layer configuration operations
  updateExperienceLayer(config: any): Promise<any>;
  
  // User Profile operations
  getUserProfile(userId: string, persona?: string): Promise<UserProfile | undefined>;
  upsertUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  
  // User Preferences operations
  getUserPreferences(userId: string, persona?: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  
  // Role Persona operations
  getAllRolePersonas(): Promise<RolePersona[]>;
  getRolePersona(personaKey: string): Promise<RolePersona | undefined>;
  upsertRolePersona(persona: InsertRolePersona): Promise<RolePersona>;

  // User Journey Heatmap operations
  createJourneyInteraction(interaction: InsertUserJourneyInteraction): Promise<UserJourneyInteraction>;
  getJourneyInteractions(userId: string, sessionId?: string, limit?: number): Promise<UserJourneyInteraction[]>;
  getJourneyInteractionsByPersona(userId: string, persona: string, limit?: number): Promise<UserJourneyInteraction[]>;
  
  createJourneySession(session: InsertUserJourneySession): Promise<UserJourneySession>;
  getJourneySessions(userId: string, limit?: number): Promise<UserJourneySession[]>;
  updateJourneySession(sessionId: string, updates: Partial<InsertUserJourneySession>): Promise<UserJourneySession>;
  endJourneySession(sessionId: string): Promise<UserJourneySession>;
  
  getJourneyHeatmaps(userId: string, persona?: string, dateRange?: string): Promise<UserJourneyHeatmap[]>;
  upsertJourneyHeatmap(heatmap: InsertUserJourneyHeatmap): Promise<UserJourneyHeatmap>;
  generateHeatmapData(userId: string, persona: string, pageRoute: string, componentId: string): Promise<UserJourneyHeatmap>;
  
  // Voice Transcript operations
  createVoiceTranscript(transcript: InsertVoiceTranscript): Promise<VoiceTranscript>;
  getVoiceTranscripts(userId: string, persona?: string, limit?: number): Promise<VoiceTranscript[]>;
  getRecentVoiceTranscripts(userId: string, limit?: number): Promise<VoiceTranscript[]>;
  
  // Commercial Property Workflow operations
  createCommercialPropertyWorkflow(workflow: InsertCommercialPropertyWorkflow): Promise<CommercialPropertyWorkflow>;
  getCommercialPropertyWorkflow(submissionId: string): Promise<CommercialPropertyWorkflow | undefined>;
  updateCommercialPropertyWorkflow(submissionId: string, updates: Partial<InsertCommercialPropertyWorkflow>): Promise<CommercialPropertyWorkflow>;
  deleteCommercialPropertyWorkflow(submissionId: string): Promise<void>;
  
  // Commercial Property COPE Data operations
  createCommercialPropertyCopeData(copeData: InsertCommercialPropertyCopeData): Promise<CommercialPropertyCopeData>;
  getCommercialPropertyCopeData(submissionId: string): Promise<CommercialPropertyCopeData | undefined>;
  updateCommercialPropertyCopeData(submissionId: string, updates: Partial<InsertCommercialPropertyCopeData>): Promise<CommercialPropertyCopeData>;
  
  // Commercial Property Submission operations
  createCommercialPropertySubmission(submission: InsertCommercialPropertySubmission): Promise<CommercialPropertySubmission>;
  getCommercialPropertySubmission(submissionId: string): Promise<CommercialPropertySubmission | undefined>;
  updateCommercialPropertySubmission(submissionId: string, updates: Partial<InsertCommercialPropertySubmission>): Promise<CommercialPropertySubmission>;
  getCommercialPropertySubmissionsByUserId(userId: string, limit?: number): Promise<CommercialPropertySubmission[]>;
  
  // Step Definition operations - Following replit.md NO HARD-CODING principle
  getStepDefinitions(workflowType: string, persona?: string): Promise<StepDefinition[]>;
  createStepDefinition(definition: InsertStepDefinition): Promise<StepDefinition>;
  updateStepDefinition(id: number, updates: Partial<InsertStepDefinition>): Promise<StepDefinition>;
  deleteStepDefinition(id: number): Promise<void>;

  // Tab Configuration operations - Metadata-driven tabs
  getTabConfigurations(): Promise<TabConfiguration[]>;
  getTabConfigurationsByType(tabType: string): Promise<TabConfiguration[]>;
  getTabConfigurationsByPersona(persona: string): Promise<TabConfiguration[]>;
  getTabConfiguration(tabKey: string): Promise<TabConfiguration | undefined>;
  createTabConfiguration(config: InsertTabConfiguration): Promise<TabConfiguration>;
  updateTabConfiguration(id: number, updates: Partial<InsertTabConfiguration>): Promise<TabConfiguration>;
  deleteTabConfiguration(id: number): Promise<void>;
  upsertTabConfiguration(config: InsertTabConfiguration): Promise<TabConfiguration>;
  
  // Step Form Submission operations - Following replit.md AUDIT TRAIL requirement
  createStepFormSubmission(submission: InsertStepFormSubmission): Promise<StepFormSubmission>;
  getStepFormSubmissions(userId: string, workflowType?: string): Promise<StepFormSubmission[]>;
  
  // Configuration Registry operations
  getConfigRegistry(): Promise<ConfigRegistry[]>;
  createConfigRegistryEntry(entry: InsertConfigRegistry): Promise<ConfigRegistry>;
  updateConfigRegistryEntry(id: number, updates: Partial<InsertConfigRegistry>): Promise<ConfigRegistry | null>;
  deleteConfigRegistryEntry(id: number): Promise<ConfigRegistry | null>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Session operations
  async getUserSession(userId: string): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, userId))
      .orderBy(desc(userSessions.updatedAt))
      .limit(1);
    return session;
  }

  async upsertUserSession(sessionData: InsertUserSession): Promise<UserSession> {
    const existing = await this.getUserSession(sessionData.userId);
    
    if (existing) {
      const [session] = await db
        .update(userSessions)
        .set({
          ...sessionData,
          updatedAt: new Date(),
        })
        .where(eq(userSessions.id, existing.id))
        .returning();
      return session;
    } else {
      const [session] = await db
        .insert(userSessions)
        .values(sessionData)
        .returning();
      return session;
    }
  }

  // Command operations
  async createCommand(command: InsertCommand): Promise<Command> {
    const [result] = await db.insert(commands).values(command).returning();
    return result;
  }

  async getRecentCommands(userId: string, limit: number = 100): Promise<Command[]> {
    return await db
      .select()
      .from(commands)
      .where(eq(commands.userId, userId))
      .orderBy(desc(commands.executedAt))
      .limit(limit);
  }

  async updateCommand(id: number, updates: Partial<InsertCommand>): Promise<Command> {
    const [result] = await db
      .update(commands)
      .set(updates)
      .where(eq(commands.id, id))
      .returning();
    return result;
  }

  // Activity operations
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [result] = await db.insert(activities).values(activity).returning();
    return result;
  }

  async getRecentActivities(userId: string, limit: number = 10): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }

  // Error operations
  async createError(error: InsertError): Promise<Error> {
    const [result] = await db.insert(errors).values(error).returning();
    return result;
  }

  // Agent operations
  async createAgent(agent: InsertAgent): Promise<Agent> {
    const [result] = await db.insert(agents).values(agent).returning();
    return result;
  }

  async getAgents(): Promise<Agent[]> {
    return await db.select().from(agents).orderBy(agents.layer, agents.name);
  }

  async getAgentById(id: number): Promise<Agent | undefined> {
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, id));
    return agent;
  }

  async getAgentsByLayer(layer: string): Promise<Agent[]> {
    return await db
      .select()
      .from(agents)
      .where(eq(agents.layer, layer))
      .orderBy(agents.name);
  }

  async getAgentByName(name: string): Promise<Agent | undefined> {
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.name, name));
    return agent;
  }

  async updateAgent(id: number, updates: Partial<InsertAgent>): Promise<Agent> {
    const [result] = await db
      .update(agents)
      .set({
        ...updates,
        lastActivity: new Date() // Update timestamp following audit pattern
      })
      .where(eq(agents.id, id))
      .returning();
    return result;
  }

  async deleteAgent(id: number): Promise<void> {
    await db.delete(agents).where(eq(agents.id, id));
  }

  async createAgentIfNotExists(agentData: InsertAgent): Promise<Agent> {
    const existing = await this.getAgentByName(agentData.name);
    if (existing) {
      return existing;
    }
    return await this.createAgent(agentData);
  }

  // Submission operations
  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [result] = await db.insert(submissions).values(submission).returning();
    return result;
  }

  async getSubmissions(limit: number = 50): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .orderBy(desc(submissions.createdAt))
      .limit(limit);
  }

  async getSubmissionsByAssignee(assignedTo: string): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .where(eq(submissions.assignedTo, assignedTo))
      .orderBy(desc(submissions.createdAt));
  }

  // Incident operations
  async createIncident(incident: InsertIncident): Promise<Incident> {
    const [result] = await db.insert(incidents).values(incident).returning();
    return result;
  }

  async getIncidents(limit: number = 50): Promise<Incident[]> {
    return await db
      .select()
      .from(incidents)
      .orderBy(desc(incidents.createdAt))
      .limit(limit);
  }

  async getIncidentsByAssignee(assignedTo: string): Promise<Incident[]> {
    return await db
      .select()
      .from(incidents)
      .where(eq(incidents.assignedTo, assignedTo))
      .orderBy(desc(incidents.createdAt));
  }

  // Personalization operations
  async getPersonalizationConfig(insurerId: number): Promise<PersonalizationConfig | undefined> {
    const [config] = await db
      .select()
      .from(personalizationConfigs)
      .where(eq(personalizationConfigs.insurerId, insurerId));
    return config;
  }

  async upsertPersonalizationConfig(configData: InsertPersonalizationConfig): Promise<PersonalizationConfig> {
    const existing = await this.getPersonalizationConfig(configData.insurerId);
    
    if (existing) {
      const [config] = await db
        .update(personalizationConfigs)
        .set(configData)
        .where(eq(personalizationConfigs.id, existing.id))
        .returning();
      return config;
    } else {
      const [config] = await db
        .insert(personalizationConfigs)
        .values(configData)
        .returning();
      return config;
    }
  }

  // Dashboard KPI operations
  async getDashboardKpis(): Promise<DashboardKpi[]> {
    return await db.select().from(dashboardKpis).orderBy(dashboardKpis.category, dashboardKpis.kpiName);
  }

  async getDashboardKpisByCategory(category: string): Promise<DashboardKpi[]> {
    return await db.select().from(dashboardKpis).where(eq(dashboardKpis.category, category));
  }

  async upsertDashboardKpi(kpiData: InsertDashboardKpi): Promise<DashboardKpi> {
    const [kpi] = await db
      .insert(dashboardKpis)
      .values(kpiData)
      .onConflictDoUpdate({
        target: dashboardKpis.kpiName,
        set: {
          ...kpiData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return kpi;
  }

  // Meta Brain Settings operations
  async getMetaBrainSettings(): Promise<MetaBrainSetting[]> {
    return await db.select().from(metaBrainSettings).where(eq(metaBrainSettings.isActive, true)).orderBy(metaBrainSettings.category);
  }

  async getMetaBrainSettingsByCategory(category: string): Promise<MetaBrainSetting[]> {
    return await db.select().from(metaBrainSettings).where(and(eq(metaBrainSettings.category, category), eq(metaBrainSettings.isActive, true)));
  }

  async updateMetaBrainSetting(settingName: string, settingValue: string): Promise<MetaBrainSetting> {
    const [setting] = await db
      .update(metaBrainSettings)
      .set({
        settingValue,
        updatedAt: new Date(),
      })
      .where(eq(metaBrainSettings.settingName, settingName))
      .returning();
    return setting;
  }

  // Orchestration Workflow operations
  async getOrchestrationWorkflows(): Promise<OrchestrationWorkflow[]> {
    return await db.select().from(orchestrationWorkflows).orderBy(desc(orchestrationWorkflows.createdAt));
  }

  async createOrchestrationWorkflow(workflowData: InsertOrchestrationWorkflow): Promise<OrchestrationWorkflow> {
    const [workflow] = await db
      .insert(orchestrationWorkflows)
      .values(workflowData)
      .returning();
    return workflow;
  }

  async updateWorkflowStatus(id: number, status: string): Promise<OrchestrationWorkflow> {
    const [workflow] = await db
      .update(orchestrationWorkflows)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(orchestrationWorkflows.id, id))
      .returning();
    return workflow;
  }

  // Data Preparation Layer operations
  async getDataPrepLayers(): Promise<DataPrepLayer[]> {
    return await db.select().from(dataPrepLayers).orderBy(dataPrepLayers.sourceSystem);
  }

  async createDataPrepLayer(layerData: InsertDataPrepLayer): Promise<DataPrepLayer> {
    const [layer] = await db
      .insert(dataPrepLayers)
      .values(layerData)
      .returning();
    return layer;
  }

  async updateDataPrepProgress(id: number, recordsProcessed: number, qualityScore: string): Promise<DataPrepLayer> {
    const [layer] = await db
      .update(dataPrepLayers)
      .set({
        recordsProcessed,
        qualityScore,
        lastProcessed: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(dataPrepLayers.id, id))
      .returning();
    return layer;
  }

  // AI Command Center operations
  async getAiCommands(): Promise<AiCommand[]> {
    return await db.select().from(aiCommands).where(eq(aiCommands.isActive, true)).orderBy(aiCommands.commandType);
  }

  async createAiCommand(commandData: InsertAiCommand): Promise<AiCommand> {
    const [command] = await db
      .insert(aiCommands)
      .values(commandData)
      .returning();
    return command;
  }

  async updateCommandStats(id: number, executionCount: number, avgResponseTime: number, successRate: string): Promise<AiCommand> {
    const [command] = await db
      .update(aiCommands)
      .set({
        executionCount,
        avgResponseTime,
        successRate,
        lastExecuted: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(aiCommands.id, id))
      .returning();
    return command;
  }

  // System Integration operations
  async getSystemIntegrations(): Promise<SystemIntegration[]> {
    return await db.select().from(systemIntegrations).orderBy(systemIntegrations.systemType);
  }

  async createSystemIntegration(integrationData: InsertSystemIntegration): Promise<SystemIntegration> {
    const [integration] = await db
      .insert(systemIntegrations)
      .values(integrationData)
      .returning();
    return integration;
  }

  async updateIntegrationHealth(id: number, healthScore: string, errorCount: number): Promise<SystemIntegration> {
    const [integration] = await db
      .update(systemIntegrations)
      .set({
        healthScore,
        errorCount,
        lastSync: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(systemIntegrations.id, id))
      .returning();
    return integration;
  }

  // Agent Template operations
  async getAgentTemplates(): Promise<AgentTemplate[]> {
    return await db.select().from(agentTemplates).where(eq(agentTemplates.isActive, true)).orderBy(agentTemplates.layer);
  }

  async createAgentTemplate(templateData: InsertAgentTemplate): Promise<AgentTemplate> {
    const [template] = await db
      .insert(agentTemplates)
      .values(templateData)
      .returning();
    return template;
  }

  async getAgentTemplatesByLayer(layer: string): Promise<AgentTemplate[]> {
    return await db.select().from(agentTemplates).where(and(eq(agentTemplates.layer, layer), eq(agentTemplates.isActive, true)));
  }

  // Email operations
  async createEmail(emailData: InsertEmail): Promise<Email> {
    const [email] = await db
      .insert(emails)
      .values(emailData)
      .returning();
    return email;
  }

  async getEmails(userId: string, filters?: any): Promise<Email[]> {
    const conditions = [eq(emails.userId, userId)];
    
    if (filters?.persona) {
      conditions.push(eq(emails.persona, filters.persona));
    }
    if (filters?.emailType) {
      conditions.push(eq(emails.emailType, filters.emailType));
    }
    if (filters?.deliveryStatus) {
      conditions.push(eq(emails.deliveryStatus, filters.deliveryStatus));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(emails.sentAt, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(emails.sentAt, filters.dateTo));
    }
    if (filters?.searchQuery) {
      const searchCondition = or(
        like(emails.subject, `%${filters.searchQuery}%`),
        like(emails.body, `%${filters.searchQuery}%`),
        like(emails.toEmail, `%${filters.searchQuery}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }
    
    const results = await db.select().from(emails)
      .where(and(...conditions))
      .orderBy(desc(emails.sentAt));
    return results;
  }

  async getEmailById(id: number): Promise<Email | undefined> {
    const [email] = await db.select().from(emails).where(eq(emails.id, id));
    return email;
  }

  async updateEmailStatus(id: number, status: string, timestamp?: Date): Promise<Email> {
    const updateData: any = { deliveryStatus: status };
    
    if (timestamp) {
      switch (status) {
        case 'delivered':
          updateData.deliveredAt = timestamp;
          break;
        case 'read':
          updateData.openedAt = timestamp;
          break;
        case 'replied':
          updateData.repliedAt = timestamp;
          break;
        case 'bounced':
          updateData.bouncedAt = timestamp;
          break;
      }
    }

    const [email] = await db
      .update(emails)
      .set(updateData)
      .where(eq(emails.id, id))
      .returning();
    return email;
  }

  async getUnprocessedBrokerEmails(brokerDomains: string[]): Promise<Email[]> {
    // Find emails from broker domains that haven't been processed yet
    const domainConditions = brokerDomains.map(domain => like(emails.fromEmail, `%${domain}`));
    
    const results = await db.select()
      .from(emails)
      .where(and(
        or(...domainConditions),
        or(
          isNull(emails.processingStatus),
          eq(emails.processingStatus, 'pending')
        )
      ))
      .orderBy(desc(emails.createdAt))
      .limit(50); // Limit to 50 most recent unprocessed emails
      
    return results;
  }

  // Email template operations
  async getEmailTemplates(persona?: string, type?: string): Promise<EmailTemplate[]> {
    const conditions = [eq(emailTemplates.isActive, true)];
    
    if (persona) {
      conditions.push(like(emailTemplates.personas, `%${persona}%`));
    }
    if (type) {
      conditions.push(eq(emailTemplates.type, type));
    }
    
    return await db.select().from(emailTemplates)
      .where(and(...conditions))
      .orderBy(emailTemplates.name);
  }

  async getEmailTemplateById(templateId: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.templateId, templateId));
    return template;
  }

  // Experience Layer operations
  async getExperienceLayer(): Promise<any> {
    const [experience] = await db.select().from(experienceLayer).limit(1);
    return experience;
  }

  // Meta Brain Layer operations
  async getMetaBrainLayer(): Promise<any> {
    const [metaBrain] = await db.select().from(metaBrainLayer).limit(1);
    return metaBrain;
  }

  // Experience Layer configuration operations
  async updateExperienceLayer(config: any): Promise<any> {
    try {
      // Update the experience layer configuration in the database
      const [updatedConfig] = await db
        .update(experienceLayer)
        .set({
          companyName: config.companyName,
          companyConfig: config,
          updatedAt: new Date()
        })
        .where(eq(experienceLayer.id, 1))
        .returning();

      return updatedConfig;
    } catch (error) {
      console.error('Error updating experience layer:', error);
      throw error;
    }
  }

  // User Profile operations
  async getUserProfile(userId: string, persona: string = "admin"): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(and(eq(userProfiles.userId, userId), eq(userProfiles.persona, persona)));
    return profile;
  }

  async upsertUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [result] = await db
      .insert(userProfiles)
      .values(profile)
      .onConflictDoUpdate({
        target: [userProfiles.userId, userProfiles.persona],
        set: {
          ...profile,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // User Preferences operations
  async getUserPreferences(userId: string, persona: string = "admin"): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(and(eq(userPreferences.userId, userId), eq(userPreferences.persona, persona)));
    return preferences;
  }

  async upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [result] = await db
      .insert(userPreferences)
      .values(preferences)
      .onConflictDoUpdate({
        target: [userPreferences.userId, userPreferences.persona],
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Persona briefing operations
  async getPersonaBriefing(persona: string): Promise<any> {
    try {
      // Get relevant data for persona briefing
      const [submissions, incidents, activities] = await Promise.all([
        this.getSubmissions(10),
        this.getIncidents(10),
        this.getRecentActivities('system', 10)
      ]);

      return {
        persona,
        submissions: submissions || [],
        incidents: incidents || [],
        activities: activities || [],
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching persona briefing:', error);
      return {
        persona,
        submissions: [],
        incidents: [],
        activities: [],
        timestamp: new Date()
      };
    }
  }

  // User Journey Heatmap operations
  async createJourneyInteraction(interaction: InsertUserJourneyInteraction): Promise<UserJourneyInteraction> {
    const [result] = await db
      .insert(userJourneyInteractions)
      .values(interaction)
      .returning();
    return result;
  }

  async getJourneyInteractions(userId: string, sessionId?: string, limit = 100): Promise<UserJourneyInteraction[]> {
    if (sessionId) {
      return db.select()
        .from(userJourneyInteractions)
        .where(and(eq(userJourneyInteractions.userId, userId), eq(userJourneyInteractions.sessionId, sessionId)))
        .orderBy(desc(userJourneyInteractions.timestamp))
        .limit(limit);
    }
    
    return db.select()
      .from(userJourneyInteractions)
      .where(eq(userJourneyInteractions.userId, userId))
      .orderBy(desc(userJourneyInteractions.timestamp))
      .limit(limit);
  }

  async getJourneyInteractionsByPersona(userId: string, persona: string, limit = 100): Promise<UserJourneyInteraction[]> {
    return db.select()
      .from(userJourneyInteractions)
      .where(and(
        eq(userJourneyInteractions.userId, userId),
        eq(userJourneyInteractions.persona, persona)
      ))
      .orderBy(desc(userJourneyInteractions.timestamp))
      .limit(limit);
  }

  async createJourneySession(session: InsertUserJourneySession): Promise<UserJourneySession> {
    const [result] = await db
      .insert(userJourneySessions)
      .values(session)
      .returning();
    return result;
  }

  async getJourneySessions(userId: string, limit = 50): Promise<UserJourneySession[]> {
    return db.select()
      .from(userJourneySessions)
      .where(eq(userJourneySessions.userId, userId))
      .orderBy(desc(userJourneySessions.startTime))
      .limit(limit);
  }

  async updateJourneySession(sessionId: string, updates: Partial<InsertUserJourneySession>): Promise<UserJourneySession> {
    const [result] = await db
      .update(userJourneySessions)
      .set(updates)
      .where(eq(userJourneySessions.sessionId, sessionId))
      .returning();
    return result;
  }

  async endJourneySession(sessionId: string): Promise<UserJourneySession> {
    const endTime = new Date();
    const [session] = await db.select().from(userJourneySessions).where(eq(userJourneySessions.sessionId, sessionId));
    const totalDuration = session?.startTime ? Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000) : 0;

    const [result] = await db
      .update(userJourneySessions)
      .set({ endTime, totalDuration })
      .where(eq(userJourneySessions.sessionId, sessionId))
      .returning();
    return result;
  }

  async getJourneyHeatmaps(userId: string, persona?: string, dateRange = '7d'): Promise<UserJourneyHeatmap[]> {
    const conditions = [
      eq(userJourneyHeatmaps.userId, userId),
      eq(userJourneyHeatmaps.dateRange, dateRange)
    ];
    
    if (persona) {
      conditions.push(eq(userJourneyHeatmaps.persona, persona));
    }
    
    return db.select()
      .from(userJourneyHeatmaps)
      .where(and(...conditions));
  }

  async upsertJourneyHeatmap(heatmap: InsertUserJourneyHeatmap): Promise<UserJourneyHeatmap> {
    const [result] = await db
      .insert(userJourneyHeatmaps)
      .values(heatmap)
      .onConflictDoUpdate({
        target: [userJourneyHeatmaps.userId, userJourneyHeatmaps.persona, userJourneyHeatmaps.pageRoute, userJourneyHeatmaps.componentId],
        set: {
          interactionCount: sql`${userJourneyHeatmaps.interactionCount} + ${heatmap.interactionCount || 1}`,
          totalDuration: sql`${userJourneyHeatmaps.totalDuration} + ${heatmap.totalDuration || 0}`,
          avgDuration: sql`(${userJourneyHeatmaps.totalDuration} + ${heatmap.totalDuration || 0}) / (${userJourneyHeatmaps.interactionCount} + ${heatmap.interactionCount || 1})`,
          clickCoordinates: heatmap.clickCoordinates,
          heatmapData: heatmap.heatmapData,
          lastUpdated: new Date()
        }
      })
      .returning();
    return result;
  }

  async generateHeatmapData(userId: string, persona: string, pageRoute: string, componentId: string): Promise<UserJourneyHeatmap> {
    // Get interactions for this specific component
    const interactions = await db.select()
      .from(userJourneyInteractions)
      .where(and(
        eq(userJourneyInteractions.userId, userId),
        eq(userJourneyInteractions.persona, persona),
        eq(userJourneyInteractions.targetElement, componentId)
      ));

    // Process click coordinates and generate heatmap data
    const clickCoordinates: Array<{x: number, y: number, count: number}> = [];
    const coordinateMap = new Map();

    interactions.forEach(interaction => {
      if (interaction.coordinates) {
        const coords = interaction.coordinates as {x: number, y: number};
        const key = `${Math.floor(coords.x/10)},${Math.floor(coords.y/10)}`; // Group by 10px grid
        coordinateMap.set(key, (coordinateMap.get(key) || 0) + 1);
      }
    });

    coordinateMap.forEach((count, key) => {
      const [x, y] = key.split(',').map(Number);
      clickCoordinates.push({ x: x * 10, y: y * 10, count });
    });

    const totalDuration = interactions.reduce((sum, i) => sum + (i.duration || 0), 0);
    const avgDuration = interactions.length > 0 ? totalDuration / interactions.length : 0;

    const heatmapData = {
      totalInteractions: interactions.length,
      avgDuration,
      clickDensity: clickCoordinates,
      interactionTypes: interactions.reduce((acc, i) => {
        acc[i.interactionType] = (acc[i.interactionType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return this.upsertJourneyHeatmap({
      userId,
      persona,
      pageRoute,
      componentId,
      interactionCount: interactions.length,
      totalDuration,
      avgDuration: Math.round(avgDuration).toString(),
      clickCoordinates,
      heatmapData
    });
  }

  // Voice Transcript operations
  async createVoiceTranscript(transcriptData: InsertVoiceTranscript): Promise<VoiceTranscript> {
    const [transcript] = await db
      .insert(voiceTranscripts)
      .values(transcriptData)
      .returning();
    return transcript;
  }

  async getVoiceTranscripts(userId: string, persona?: string, limit: number = 50): Promise<VoiceTranscript[]> {
    const conditions = [eq(voiceTranscripts.userId, userId)];
    
    if (persona) {
      conditions.push(eq(voiceTranscripts.persona, persona));
    }
    
    const query = db.select()
      .from(voiceTranscripts)
      .where(and(...conditions))
      .orderBy(desc(voiceTranscripts.createdAt))
      .limit(limit);
    
    
    return query;
  }

  async getRecentVoiceTranscripts(userId: string, limit: number = 10): Promise<VoiceTranscript[]> {
    return db.select()
      .from(voiceTranscripts)
      .where(eq(voiceTranscripts.userId, userId))
      .orderBy(desc(voiceTranscripts.createdAt))
      .limit(limit);
  }

  // Commercial Property Workflow operations
  async createCommercialPropertyWorkflow(workflow: InsertCommercialPropertyWorkflow): Promise<CommercialPropertyWorkflow> {
    const [result] = await db
      .insert(commercialPropertyWorkflows)
      .values(workflow)
      .returning();
    return result;
  }

  async getCommercialPropertyWorkflow(submissionId: string): Promise<CommercialPropertyWorkflow | undefined> {
    const results = await db.select()
      .from(commercialPropertyWorkflows)
      .where(eq(commercialPropertyWorkflows.submissionId, submissionId))
      .limit(1);
    return results[0];
  }

  async updateCommercialPropertyWorkflow(submissionId: string, updates: Partial<InsertCommercialPropertyWorkflow>): Promise<CommercialPropertyWorkflow> {
    const [result] = await db
      .update(commercialPropertyWorkflows)
      .set(updates)
      .where(eq(commercialPropertyWorkflows.submissionId, submissionId))
      .returning();
    return result;
  }

  async deleteCommercialPropertyWorkflow(submissionId: string): Promise<void> {
    await db
      .delete(commercialPropertyWorkflows)
      .where(eq(commercialPropertyWorkflows.submissionId, submissionId));
  }

  // Commercial Property COPE Data operations
  async createCommercialPropertyCopeData(copeData: InsertCommercialPropertyCopeData): Promise<CommercialPropertyCopeData> {
    const [result] = await db
      .insert(commercialPropertyCopeData)
      .values(copeData)
      .returning();
    return result;
  }

  async getCommercialPropertyCopeData(submissionId: string): Promise<CommercialPropertyCopeData | undefined> {
    const results = await db.select()
      .from(commercialPropertyCopeData)
      .where(eq(commercialPropertyCopeData.submissionId, submissionId))
      .limit(1);
    return results[0];
  }

  async updateCommercialPropertyCopeData(submissionId: string, updates: Partial<InsertCommercialPropertyCopeData>): Promise<CommercialPropertyCopeData> {
    const [result] = await db
      .update(commercialPropertyCopeData)
      .set(updates)
      .where(eq(commercialPropertyCopeData.submissionId, submissionId))
      .returning();
    return result;
  }

  // Commercial Property Submission operations
  async createCommercialPropertySubmission(submission: InsertCommercialPropertySubmission): Promise<CommercialPropertySubmission> {
    const [result] = await db
      .insert(commercialPropertySubmissions)
      .values(submission)
      .returning();
    return result;
  }

  async getCommercialPropertySubmission(submissionId: string): Promise<CommercialPropertySubmission | undefined> {
    const results = await db.select()
      .from(commercialPropertySubmissions)
      .where(eq(commercialPropertySubmissions.submissionId, submissionId))
      .limit(1);
    return results[0];
  }

  async updateCommercialPropertySubmission(submissionId: string, updates: Partial<InsertCommercialPropertySubmission>): Promise<CommercialPropertySubmission> {
    const [result] = await db
      .update(commercialPropertySubmissions)
      .set(updates)
      .where(eq(commercialPropertySubmissions.submissionId, submissionId))
      .returning();
    return result;
  }

  async getCommercialPropertySubmissionsByUserId(userId: string, limit: number = 50): Promise<CommercialPropertySubmission[]> {
    const results = await db.select({
      id: commercialPropertySubmissions.id,
      workflowId: commercialPropertySubmissions.workflowId,
      submissionId: commercialPropertySubmissions.submissionId,
      emailSource: commercialPropertySubmissions.emailSource,
      senderEmail: commercialPropertySubmissions.senderEmail,
      subject: commercialPropertySubmissions.subject,
      attachmentCount: commercialPropertySubmissions.attachmentCount,
      documentsExtracted: commercialPropertySubmissions.documentsExtracted,
      documentValidationStatus: commercialPropertySubmissions.documentValidationStatus,
      externalDataSources: commercialPropertySubmissions.externalDataSources,
      enrichmentScore: commercialPropertySubmissions.enrichmentScore,
      marketBenchmarks: commercialPropertySubmissions.marketBenchmarks,
      competitorAnalysis: commercialPropertySubmissions.competitorAnalysis,
      appetiteScore: commercialPropertySubmissions.appetiteScore,
      appetiteAlignment: commercialPropertySubmissions.appetiteAlignment,
      riskPropensityScore: commercialPropertySubmissions.riskPropensityScore,
      profitabilityScore: commercialPropertySubmissions.profitabilityScore,
      underwritingRecommendations: commercialPropertySubmissions.underwritingRecommendations,
      riskFactors: commercialPropertySubmissions.riskFactors,
      coreSystemStatus: commercialPropertySubmissions.coreSystemStatus,
      integrationErrors: commercialPropertySubmissions.integrationErrors,
      finalPremium: commercialPropertySubmissions.finalPremium,
      createdAt: commercialPropertySubmissions.createdAt,
      updatedAt: commercialPropertySubmissions.updatedAt,
    })
      .from(commercialPropertySubmissions)
      .innerJoin(commercialPropertyWorkflows, eq(commercialPropertySubmissions.submissionId, commercialPropertyWorkflows.submissionId))
      .where(eq(commercialPropertyWorkflows.userId, userId))
      .orderBy(desc(commercialPropertySubmissions.createdAt))
      .limit(limit);
    
    return results;
  }
  
  // Step Definition operations - Following replit.md NO HARD-CODING principle
  async getStepDefinitions(workflowType: string, persona?: string): Promise<StepDefinition[]> {
    let whereCondition = and(
      eq(stepDefinitions.workflowType, workflowType),
      eq(stepDefinitions.status, 'active'),
      or(
        sql`${stepDefinitions.expirationDate} IS NULL`,
        gte(stepDefinitions.expirationDate, new Date())
      ),
      lte(stepDefinitions.effectiveDate, new Date())
    );
    
    if (persona) {
      whereCondition = and(
        whereCondition,
        eq(stepDefinitions.persona, persona)
      );
    }
    
    const results = await db.select()
      .from(stepDefinitions)
      .where(whereCondition)
      .orderBy(stepDefinitions.stepNumber);
    
    return results;
  }
  
  async createStepDefinition(definition: InsertStepDefinition): Promise<StepDefinition> {
    const result = await db.insert(stepDefinitions).values(definition).returning();
    return result[0];
  }
  
  async updateStepDefinition(id: number, updates: Partial<InsertStepDefinition>): Promise<StepDefinition> {
    const result = await db.update(stepDefinitions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(stepDefinitions.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Step definition with id ${id} not found`);
    }
    
    return result[0];
  }
  
  async deleteStepDefinition(id: number): Promise<void> {
    await db.delete(stepDefinitions).where(eq(stepDefinitions.id, id));
  }
  
  // Step Form Submission operations - Following replit.md AUDIT TRAIL requirement
  async createStepFormSubmission(submission: InsertStepFormSubmission): Promise<StepFormSubmission> {
    const result = await db.insert(stepFormSubmissions).values(submission).returning();
    return result[0];
  }
  
  async getStepFormSubmissions(userId: string, workflowType?: string): Promise<StepFormSubmission[]> {
    const conditions = [eq(stepFormSubmissions.userId, userId)];
    
    if (workflowType) {
      conditions.push(eq(stepFormSubmissions.workflowType, workflowType));
    }
    
    const results = await db.select()
      .from(stepFormSubmissions)
      .where(and(...conditions))
      .orderBy(desc(stepFormSubmissions.completedAt));
    
    return results;
  }

  // Configuration Registry operations
  async getConfigRegistry(): Promise<ConfigRegistry[]> {
    const results = await db.select()
      .from(configRegistry)
      .orderBy(configRegistry.category, configRegistry.key);
    
    return results;
  }

  async createConfigRegistryEntry(entry: InsertConfigRegistry): Promise<ConfigRegistry> {
    const result = await db.insert(configRegistry).values(entry).returning();
    return result[0];
  }

  async updateConfigRegistryEntry(id: number, updates: Partial<InsertConfigRegistry>): Promise<ConfigRegistry | null> {
    const result = await db.update(configRegistry)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(configRegistry.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : null;
  }

  async deleteConfigRegistryEntry(id: number): Promise<ConfigRegistry | null> {
    const result = await db.delete(configRegistry)
      .where(eq(configRegistry.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : null;
  }

  // Role Persona operations
  async getAllRolePersonas(): Promise<RolePersona[]> {
    return await db.select().from(rolePersonas);
  }

  async getRolePersona(personaKey: string): Promise<RolePersona | undefined> {
    const [persona] = await db
      .select()
      .from(rolePersonas)
      .where(eq(rolePersonas.personaKey, personaKey));
    return persona;
  }

  async upsertRolePersona(persona: InsertRolePersona): Promise<RolePersona> {
    const [result] = await db
      .insert(rolePersonas)
      .values(persona)
      .onConflictDoUpdate({
        target: rolePersonas.personaKey,
        set: {
          ...persona,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Tab Configuration operations - Metadata-driven tabs
  async getTabConfigurations(): Promise<TabConfiguration[]> {
    return await db.select().from(tabConfigurations).orderBy(tabConfigurations.order, tabConfigurations.tabName);
  }

  async getTabConfigurationsByType(tabType: string): Promise<TabConfiguration[]> {
    return await db
      .select()
      .from(tabConfigurations)
      .where(and(eq(tabConfigurations.tabType, tabType), eq(tabConfigurations.isActive, true)))
      .orderBy(tabConfigurations.order, tabConfigurations.tabName);
  }

  async getTabConfigurationsByPersona(persona: string): Promise<TabConfiguration[]> {
    return await db
      .select()
      .from(tabConfigurations)
      .where(
        and(
          sql`${persona} = ANY(${tabConfigurations.personaAccess})`,
          eq(tabConfigurations.isActive, true),
          eq(tabConfigurations.isVisible, true)
        )
      )
      .orderBy(tabConfigurations.order, tabConfigurations.tabName);
  }

  async getTabConfiguration(tabKey: string): Promise<TabConfiguration | undefined> {
    const result = await db
      .select()
      .from(tabConfigurations)
      .where(eq(tabConfigurations.tabKey, tabKey))
      .limit(1);
    return result[0];
  }

  async createTabConfiguration(config: InsertTabConfiguration): Promise<TabConfiguration> {
    const [result] = await db.insert(tabConfigurations).values(config).returning();
    return result;
  }

  async updateTabConfiguration(id: number, updates: Partial<InsertTabConfiguration>): Promise<TabConfiguration> {
    const [result] = await db
      .update(tabConfigurations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tabConfigurations.id, id))
      .returning();
    return result;
  }

  async deleteTabConfiguration(id: number): Promise<void> {
    await db.delete(tabConfigurations).where(eq(tabConfigurations.id, id));
  }

  async upsertTabConfiguration(config: InsertTabConfiguration): Promise<TabConfiguration> {
    const [result] = await db
      .insert(tabConfigurations)
      .values(config)
      .onConflictDoUpdate({
        target: tabConfigurations.tabKey,
        set: {
          ...config,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();

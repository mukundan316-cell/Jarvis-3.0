import { db } from "./db";
import { agents } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Optimal Commercial Property Agent Architecture
 * Following JARVIS framework with 6 agents: 1 Interface + 3 Process + 2 System
 * Based on replit.md guidelines for maintainable, properly-layered agents
 */

export async function seedOptimalCPAgents() {
  console.log("🏢 Seeding Optimal Commercial Property Agent Architecture...");

  const optimalCPAgents = [
    // INTERFACE LAYER (1 agent) - External Interactions
    {
      name: "Commercial Property Intake Agent",
      type: "Interface Agent",
      layer: "Interface",
      // Top-level fields for workflow detection compatibility
      persona: "rachel",
      specialization: "Commercial Property email processing and broker communication",
      description: "Handles commercial property email intake, document uploads, and broker communications for the underwriting workflow",
      agentRole: "CP Email Intake Coordinator",
      config: {
        persona: "rachel",
        specialization: "Commercial Property email processing and broker communication",
        capabilities: [
          "email_processing",
          "document_upload",
          "broker_communication",
          "client_notification"
        ],
        workflow: "cp_intake_coordination",
        integrations: ["email_system", "broker_portal", "document_storage"],
        invokingPersonas: ["rachel"],
        handles: ["Email Intake (Step 1)", "Final client communication"]
      },
      status: "active"
    },

    // PROCESS LAYER (3 agents) - Business Workflows
    {
      name: "CP Submission Orchestrator",
      type: "Process Agent", 
      layer: "Process",
      // Top-level fields for workflow detection compatibility
      persona: "rachel",
      specialization: "Commercial Property workflow coordination and step progression",
      description: "Orchestrates the complete 8-step commercial property underwriting workflow with step progression tracking",
      agentRole: "CP Workflow Orchestrator",
      config: {
        persona: "rachel",
        specialization: "Commercial Property workflow coordination and step progression",
        capabilities: [
          "workflow_coordination",
          "step_progression", 
          "decision_routing",
          "commercial_property_coordination",
          "8_step_workflow_management"
        ],
        workflow: "cp_submission_orchestration",
        integrations: ["workflow_engine", "step_tracker", "decision_engine"],
        invokingPersonas: ["rachel"],
        handles: ["Overall 8-step workflow management"],
        submissionTypes: ["commercial_property"]
      },
      status: "active"
    },

    {
      name: "CP Risk Assessment Agent",
      type: "Process Agent",
      layer: "Process",
      // Top-level fields for workflow detection compatibility
      persona: "rachel",
      specialization: "Commercial Property COPE analysis and risk evaluation",
      description: "Performs detailed COPE analysis, peril evaluation, and comparative analytics for commercial property risk assessment",
      agentRole: "CP Risk Analyst",
      config: {
        persona: "rachel",
        specialization: "Commercial Property COPE analysis and risk evaluation",
        capabilities: [
          "cope_analysis",
          "peril_evaluation", 
          "comparative_analytics",
          "appetite_triage",
          "risk_scoring",
          "exposure_analysis"
        ],
        workflow: "cp_risk_assessment",
        integrations: ["risk_models", "peril_data", "appetite_engine"],
        invokingPersonas: ["rachel"],
        handles: ["Comparative Analytics (Step 4)", "Appetite Triage (Step 5)"]
      },
      status: "active"
    },

    {
      name: "CP Underwriting Decision Agent", 
      type: "Process Agent",
      layer: "Process",
      // Top-level fields for workflow detection compatibility
      persona: "rachel",
      specialization: "Commercial Property propensity scoring and underwriting decisions",
      description: "Provides propensity scoring, decision support, and underwriting guidance for commercial property submissions",
      agentRole: "CP Underwriting Analyst",
      config: {
        persona: "rachel",
        specialization: "Commercial Property propensity scoring and underwriting decisions",
        capabilities: [
          "propensity_scoring",
          "decision_support",
          "quote_recommendations", 
          "underwriting_guidance",
          "risk_propensity_analysis"
        ],
        workflow: "cp_underwriting_decision",
        integrations: ["scoring_engine", "decision_matrix", "quote_generator"],
        invokingPersonas: ["rachel"],
        handles: ["Propensity Scoring (Step 6)", "Underwriting Copilot (Step 7)"]
      },
      status: "active"
    },

    // SYSTEM LAYER (2 agents) - Core Processing
    {
      name: "CP Document Processor",
      type: "System Agent",
      layer: "System",
      // Top-level fields for workflow detection compatibility
      persona: "rachel",
      specialization: "Commercial Property document processing and ACORD form parsing",
      description: "Processes commercial property documents, parses ACORD forms, and validates submission data",
      agentRole: "CP Document Processing Engine",
      config: {
        persona: "rachel", 
        specialization: "Commercial Property document processing and ACORD form parsing",
        capabilities: [
          "acord_form_parsing",
          "document_classification",
          "data_extraction",
          "document_validation",
          "cp_document_processing"
        ],
        workflow: "cp_document_processing",
        integrations: ["document_parser", "acord_processor", "validation_engine"],
        invokingPersonas: ["rachel"],
        handles: ["Document Processing (Step 2)"]
      },
      status: "active"
    },

    {
      name: "CP Data Enrichment Engine",
      type: "System Agent", 
      layer: "System",
      // Top-level fields for workflow detection compatibility
      persona: "rachel",
      specialization: "Commercial Property external data aggregation and enrichment",
      description: "Aggregates external data from geocoding, peril services, and market data APIs to enrich commercial property submissions",
      agentRole: "CP Data Enhancement Engine",
      config: {
        persona: "rachel",
        specialization: "Commercial Property external data aggregation and enrichment",
        capabilities: [
          "external_api_integration",
          "geocoding_services",
          "peril_data_aggregation", 
          "property_valuation",
          "market_data_enrichment",
          "third_party_integrations"
        ],
        workflow: "cp_data_enrichment",
        integrations: ["geocoding_api", "peril_services", "valuation_apis", "market_data"],
        invokingPersonas: ["rachel"],
        handles: ["Data Enrichment (Step 3)"]
      },
      status: "active"
    }
  ];

  // Use storage interface for idempotent seeding
  const { DatabaseStorage } = await import('./storage');
  const storage = new DatabaseStorage();
  
  // Seed each agent individually using createAgentIfNotExists for idempotency
  const createdAgents = [];
  for (const agentData of optimalCPAgents) {
    const createdAgent = await storage.createAgentIfNotExists(agentData as any);
    createdAgents.push(createdAgent);
  }
  
  console.log(`✅ Successfully seeded/verified ${createdAgents.length} optimal CP agents`);
  console.log("🎯 Agent Distribution: 1 Interface + 3 Process + 2 System");
  console.log("📋 Coverage: Complete 8-step CP workflow with proper layer alignment");
  console.log("🔄 Idempotent seeding: Existing agents preserved, new agents created");
}

/**
 * Safely extend existing agents with Commercial Property capabilities
 * Merges new capabilities with existing configs instead of overwriting
 */
export async function extendExistingAgentsForCP() {
  console.log("🔧 Safely extending existing agents with CP capabilities...");

  const { DatabaseStorage } = await import('./storage');
  const storage = new DatabaseStorage();

  // Helper function to safely merge agent config
  const safelyExtendAgent = async (agentName: string, extensionConfig: any) => {
    const existingAgent = await storage.getAgentByName(agentName);
    if (!existingAgent) {
      console.log(`⚠️  Agent "${agentName}" not found, skipping extension`);
      return;
    }

    // Safely merge configurations
    const existingConfig = (existingAgent.config as any) || {};
    const mergedCapabilities = [
      ...(existingConfig.capabilities || []),
      ...extensionConfig.capabilities.filter((cap: string) => 
        !(existingConfig.capabilities || []).includes(cap)
      )
    ];
    
    const mergedSubmissionTypes = [
      ...(existingConfig.submissionTypes || []),
      ...extensionConfig.submissionTypes?.filter((type: string) => 
        !(existingConfig.submissionTypes || []).includes(type)
      ) || []
    ];

    const mergedIntegrations = [
      ...(existingConfig.integrations || []),
      ...extensionConfig.integrations.filter((integ: string) => 
        !(existingConfig.integrations || []).includes(integ)
      )
    ];

    // Update with safely merged config
    await db.update(agents)
      .set({
        config: {
          ...existingConfig,
          capabilities: mergedCapabilities,
          submissionTypes: mergedSubmissionTypes.length > 0 ? mergedSubmissionTypes : (existingConfig.submissionTypes || []),
          integrations: mergedIntegrations
        }
      })
      .where(eq(agents.name, agentName));

    console.log(`✅ Safely extended "${agentName}" with ${extensionConfig.capabilities.length} new capabilities`);
  };

  // Safely extend Submission Processing Workflow
  await safelyExtendAgent("Submission Processing Workflow", {
    capabilities: [
      "commercial_property_coordination" // ADD CP capability
    ],
    submissionTypes: ["commercial_property"], // ADD CP type
    integrations: [] // No new integrations needed
  });

  // Safely extend Risk Assessment Workflow  
  await safelyExtendAgent("Risk Assessment Workflow", {
    capabilities: [
      "cope_analysis", // ADD for CP
      "appetite_evaluation" // ADD for CP
    ],
    integrations: ["peril_data", "appetite_engine"] // ADD CP-specific integrations
  });

  // Safely extend Integration Manager for CP core system integration
  await safelyExtendAgent("Integration Manager", {
    capabilities: [
      "policycenter_integration", // ADD for CP
      "analytics_tracking" // ADD for CP  
    ],
    integrations: ["policy_center", "analytics_platform"] // ADD CP-specific integrations
  });

  console.log("✅ Safely extended 3 existing agents with CP capabilities");
  console.log("🔄 Preserved existing functionality while adding CP support");
  console.log("🛡️  Config merging prevents data loss and conflicts");
}
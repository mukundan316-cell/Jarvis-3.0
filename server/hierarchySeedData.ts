import { db } from './db.js';
import { experienceLayer, metaBrainLayer, agents } from '../shared/schema.js';

// Seed proper 6-layered hierarchy data
export async function seedHierarchyData() {
  console.log('Seeding JARVIS 6-layered hierarchy...');

  try {
    // 1. Experience Layer - Insurance Company Configuration
    await db.delete(experienceLayer);
    await db.insert(experienceLayer).values({
      companyName: 'ABC Insurance Ltd',
      companyConfig: {
        industry: 'insurance',
        type: 'commercial_lines',
        size: 'mid_market',
        specializations: ['property', 'casualty', 'commercial_auto']
      },
      brandingConfig: {
        primaryColor: '#1e40af',
        secondaryColor: '#3b82f6',
        logo: 'abc_insurance_logo.svg',
        theme: 'professional'
      },
      personalizationSettings: {
        defaultPersona: 'admin',
        availablePersonas: ['admin', 'rachel', 'john'],
        voiceEnabled: true,
        morningBriefings: true
      },
      jarvisCustomizations: {
        companyGreeting: 'Welcome to ABC Insurance Ltd JARVIS System',
        workflowPreferences: ['underwriting', 'claims', 'it_support'],
        integrations: ['DuckCreek', 'Salesforce', 'Custom_APIs']
      }
    });

    // 2. Meta Brain Layer - Central Orchestrator
    await db.delete(metaBrainLayer);
    await db.insert(metaBrainLayer).values({
      orchestratorName: 'JARVIS Meta Brain',
      orchestrationConfig: {
        maxConcurrentWorkflows: 50,
        prioritySystem: 'weighted',
        loadBalancing: 'dynamic',
        failoverEnabled: true
      },
      agentCoordination: {
        crossLayerCommunication: true,
        realTimeMonitoring: true,
        performanceTracking: true,
        autonomousDecisions: true
      },
      workflowManagement: {
        autoScaling: true,
        resourceAllocation: 'intelligent',
        queueManagement: 'priority_based',
        errorRecovery: 'automatic'
      },
      decisionEngine: {
        aiPowered: true,
        learningEnabled: true,
        confidenceThreshold: 0.85,
        humanEscalation: true
      }
    });

    // 3. Update existing agents to follow correct layer structure
    // Clear and recreate with proper hierarchy
    await db.delete(agents);

    const hierarchyAgents = [
      // ROLE LAYER - Role Agents (personas)
      {
        name: 'Rachel Thompson (AUW)',
        type: 'Role Agent',
        layer: 'Role',
        config: {
          role: 'assistant_underwriter',
          permissions: ['submission_review', 'policy_evaluation'],
          specialization: 'commercial_lines_underwriting',
          workflowAccess: ['process_agents', 'system_agents', 'interface_agents']
        },
        status: 'active'
      },
      {
        name: 'John Stevens (IT Support)',
        type: 'Role Agent', 
        layer: 'Role',
        config: {
          role: 'it_support_analyst',
          permissions: ['incident_management', 'system_maintenance', 'security_monitoring'],
          specialization: 'technical_support',
          workflowAccess: ['process_agents', 'system_agents', 'interface_agents']
        },
        status: 'active'
      },
      {
        name: 'JARVIS Admin',
        type: 'Role Agent',
        layer: 'Role', 
        config: {
          role: 'system_administrator',
          permissions: ['full_access', 'agent_management', 'system_configuration'],
          specialization: 'platform_administration',
          workflowAccess: ['all_layers']
        },
        status: 'active'
      },

      // PROCESS LAYER - Workflow Agents (invoked by Role Agents)
      // Risk Assessment Workflow removed - agents purged from database
      {
        name: 'Submission Processing Workflow',
        type: 'Process Agent',
        layer: 'Process',
        config: {
          invokingPersonas: ['rachel'],
          workflow: 'submission_evaluation',
          capabilities: ['document_verification', 'completeness_check', 'routing'],
          integrations: ['broker_portal', 'document_management', 'workflow_engine']
        },
        status: 'active'
      },
      {
        name: 'Claims Processing Workflow',
        type: 'Process Agent',
        layer: 'Process',
        config: {
          invokingPersonas: ['rachel'],
          workflow: 'claims_management',
          capabilities: ['claim_intake', 'investigation', 'settlement'],
          integrations: ['claims_system', 'adjuster_network', 'payment_system']
        },
        status: 'active'
      },
      {
        name: 'Incident Management Workflow',
        type: 'Process Agent',
        layer: 'Process',
        config: {
          invokingPersonas: ['john'],
          workflow: 'it_incident_resolution',
          capabilities: ['ticket_creation', 'escalation', 'resolution_tracking'],
          integrations: ['service_desk', 'monitoring_tools', 'knowledge_base']
        },
        status: 'active'
      },

      // SYSTEM LAYER - Core Processing Agents (invoked by Process Agents)
      {
        name: 'Document Processing System',
        type: 'System Agent',
        layer: 'System',
        config: {
          invokingAgents: ['submission_processing', 'claims_processing'],
          capabilities: ['ocr', 'document_classification', 'data_extraction'],
          integrations: ['file_storage', 'ml_models', 'validation_engine']
        },
        status: 'active'
      },
      // Risk Analysis System removed - agents purged from database
      {
        name: 'Security Monitoring System',
        type: 'System Agent',
        layer: 'System',
        config: {
          invokingAgents: ['incident_management'],
          capabilities: ['threat_detection', 'log_analysis', 'vulnerability_scanning'],
          integrations: ['siem', 'firewall', 'endpoint_protection']
        },
        status: 'active'
      },
      {
        name: 'Database Management System',
        type: 'System Agent',
        layer: 'System',
        config: {
          invokingAgents: ['all_process_agents'],
          capabilities: ['data_storage', 'backup', 'performance_optimization'],
          integrations: ['postgresql', 'redis', 'backup_service']
        },
        status: 'active'
      },

      // INTERFACE LAYER - User/External Interaction Agents (invoked by workflows)
      {
        name: 'Voice Interface Agent',
        type: 'Interface Agent',
        layer: 'Interface',
        config: {
          invokingAgents: ['all_process_agents'],
          capabilities: ['speech_recognition', 'text_to_speech', 'voice_commands'],
          integrations: ['web_speech_api', 'voice_synthesis', 'microphone']
        },
        status: 'active'
      },
      {
        name: 'Email Interface Agent',
        type: 'Interface Agent',
        layer: 'Interface',
        config: {
          invokingAgents: ['submission_processing', 'claims_processing'],
          capabilities: ['email_processing', 'automated_responses', 'template_generation'],
          integrations: ['smtp_server', 'email_templates', 'sendgrid']
        },
        status: 'active'
      },
      {
        name: 'API Interface Agent',
        type: 'Interface Agent',
        layer: 'Interface',
        config: {
          invokingAgents: ['all_process_agents'],
          capabilities: ['rest_api', 'webhook_handling', 'data_exchange'],
          integrations: ['external_systems', 'api_gateway', 'authentication']
        },
        status: 'active'
      },
      {
        name: 'Dashboard Interface Agent',
        type: 'Interface Agent',
        layer: 'Interface',
        config: {
          invokingAgents: ['all_process_agents'],
          capabilities: ['data_visualization', 'real_time_updates', 'interactive_controls'],
          integrations: ['react_components', 'chart_libraries', 'websockets']
        },
        status: 'active'
      },
      {
        name: 'Broker Portal Interface',
        type: 'Interface Agent',
        layer: 'Interface',
        config: {
          invokingAgents: ['submission_processing'],
          capabilities: ['submission_portal', 'document_upload', 'status_tracking'],
          integrations: ['web_portal', 'file_management', 'authentication']
        },
        status: 'active'
      },
      {
        name: 'Claims Portal Interface',
        type: 'Interface Agent',
        layer: 'Interface',
        config: {
          invokingAgents: ['claims_processing'],
          capabilities: ['claim_reporting', 'document_submission', 'status_updates'],
          integrations: ['claims_portal', 'file_upload', 'notification_system']
        },
        status: 'active'
      }
    ];

    await db.insert(agents).values(hierarchyAgents);

    console.log('✓ JARVIS 6-layered hierarchy seeded successfully');
    console.log('  - Experience Layer: ABC Insurance Ltd configuration');
    console.log('  - Meta Brain Layer: Central orchestrator');
    console.log('  - Role Layer: 3 Role Agents (Rachel, John, Admin)');
    console.log('  - Process Layer: 4 Workflow Agents');
    console.log('  - System Layer: 4 Core Processing Agents');
    console.log('  - Interface Layer: 6 Interaction Agents');

  } catch (error) {
    console.error('Error seeding hierarchy data:', error);
    throw error;
  }
}
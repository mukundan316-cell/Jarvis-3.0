import { storage } from './storage';
import { db } from './db';
import { 
  dashboardKpis, 
  metaBrainSettings, 
  orchestrationWorkflows, 
  dataPrepLayers, 
  aiCommands, 
  systemIntegrations, 
  agentTemplates,
  personalizationConfigs
} from '@shared/schema';
import { seedRachelAUWAgents } from './rachelAUWAgentsSeed.js';
import { seedHierarchyData } from './hierarchySeedData.js';

export async function seedDashboardData() {
  try {
    console.log('Seeding dashboard data...');

    // First seed the proper 6-layered hierarchy
    await seedHierarchyData();

    // Clear existing data first
    await db.delete(dashboardKpis);
    
    // Seed Dashboard KPIs with 6-layer architecture focus
    const kpiData = [
      // Meta Brain Performance KPIs
      {
        kpiName: 'Meta Brain Orchestration Rate',
        currentValue: '847',
        previousValue: '823',
        target: '900',
        unit: 'tasks/hour',
        category: 'meta_brain',
        trend: 'up'
      },
      {
        kpiName: 'Cross-Layer Agent Coordination',
        currentValue: '94.2',
        previousValue: '91.8',
        target: '95.0',
        unit: '%',
        category: 'meta_brain',
        trend: 'up'
      },
      // Experience Layer KPIs
      {
        kpiName: 'Personalization Engine Accuracy',
        currentValue: '96.8',
        previousValue: '95.1',
        target: '97.0',
        unit: '%',
        category: 'experience',
        trend: 'up'
      },
      {
        kpiName: 'Insurer-Specific Customizations',
        currentValue: '247',
        previousValue: '239',
        target: '260',
        unit: 'configs',
        category: 'experience',
        trend: 'up'
      },
      // Cognitive Layer KPIs
      {
        kpiName: 'AUW Agent Processing Rate',
        currentValue: '312',
        previousValue: '298',
        target: '320',
        unit: 'submissions/day',
        category: 'cognitive',
        trend: 'up'
      },
      {
        kpiName: 'IT Support Resolution Rate',
        currentValue: '89.4',
        previousValue: '87.2',
        target: '90.0',
        unit: '%',
        category: 'cognitive',
        trend: 'up'
      },
      {
        kpiName: 'Risk Analysis Accuracy',
        currentValue: '97.3',
        previousValue: '96.8',
        target: '98.0',
        unit: '%',
        category: 'cognitive',
        trend: 'up'
      },
      // Process Layer KPIs
      {
        kpiName: 'Document Verification Speed',
        currentValue: '2.3',
        previousValue: '2.8',
        target: '2.0',
        unit: 'minutes',
        category: 'process',
        trend: 'up'
      },
      {
        kpiName: 'Automated Risk Assessment',
        currentValue: '78.9',
        previousValue: '76.4',
        target: '80.0',
        unit: '%',
        category: 'process',
        trend: 'up'
      },
      // System Layer KPIs
      {
        kpiName: 'Data Analysis Throughput',
        currentValue: '1,247',
        previousValue: '1,189',
        target: '1,300',
        unit: 'records/hour',
        category: 'system',
        trend: 'up'
      },
      {
        kpiName: 'Content Creation Quality',
        currentValue: '93.7',
        previousValue: '92.1',
        target: '95.0',
        unit: '%',
        category: 'system',
        trend: 'up'
      },
      // Interface Layer KPIs
      {
        kpiName: 'Multi-Modal Response Time',
        currentValue: '185',
        previousValue: '210',
        target: '150',
        unit: 'ms',
        category: 'interface',
        trend: 'up'
      },
      {
        kpiName: 'Voice Recognition Accuracy',
        currentValue: '98.2',
        previousValue: '97.8',
        target: '99.0',
        unit: '%',
        category: 'interface',
        trend: 'up'
      }
    ];

    // Insert KPIs
    try {
      await db.insert(dashboardKpis).values(kpiData);
    } catch (error) {
      console.log('KPIs already exist, skipping...');
    }

    // Clear and seed Meta Brain Settings
    try {
      await db.delete(metaBrainSettings);
    } catch (error) {
      console.log('No existing meta brain settings to clear');
    }
    
    const metaBrainSettingsData = [
      // Meta Brain Core Settings
      {
        settingName: 'orchestration_depth',
        settingValue: '6',
        settingType: 'number',
        category: 'Core Architecture',
        description: 'Number of agent layers managed by Meta Brain',
        isActive: true
      },
      {
        settingName: 'cross_layer_communication',
        settingValue: 'true',
        settingType: 'boolean',
        category: 'Core Architecture',
        description: 'Enable communication between non-adjacent layers',
        isActive: true
      },
      // Experience Layer Settings
      {
        settingName: 'personalization_engine_mode',
        settingValue: 'advanced',
        settingType: 'string',
        category: 'Experience Layer',
        description: 'Personalization engine operating mode',
        isActive: true
      },
      {
        settingName: 'insurer_customization_depth',
        settingValue: '5',
        settingType: 'number',
        category: 'Experience Layer',
        description: 'Levels of insurer-specific customization',
        isActive: true
      },
      // Cognitive Layer Settings
      {
        settingName: 'auw_processing_threads',
        settingValue: '12',
        settingType: 'number',
        category: 'Cognitive Layer',
        description: 'Concurrent AUW agent processing threads',
        isActive: true
      },
      {
        settingName: 'risk_analysis_threshold',
        settingValue: '0.85',
        settingType: 'number',
        category: 'Role Layer',
        description: 'Risk analysis confidence threshold',
        isActive: true
      },
      {
        settingName: 'it_support_escalation_time',
        settingValue: '240',
        settingType: 'number',
        category: 'Role Layer',
        description: 'Minutes before escalating IT support tickets',
        isActive: true
      },
      // Process Layer Settings
      {
        settingName: 'document_verification_ai_model',
        settingValue: 'vision-transformer-v2',
        settingType: 'string',
        category: 'Process Layer',
        description: 'AI model for document verification',
        isActive: true
      },
      {
        settingName: 'automated_risk_assessment_confidence',
        settingValue: '0.92',
        settingType: 'number',
        category: 'Process Layer',
        description: 'Confidence threshold for automated risk decisions',
        isActive: true
      },
      // System Layer Settings
      {
        settingName: 'data_analysis_batch_size',
        settingValue: '1000',
        settingType: 'number',
        category: 'System Layer',
        description: 'Records processed per batch in data analysis',
        isActive: true
      },
      {
        settingName: 'content_generation_model',
        settingValue: 'gpt-4-insurance-fine-tuned',
        settingType: 'string',
        category: 'System Layer',
        description: 'Model for automated content creation',
        isActive: true
      },
      // Interface Layer Settings
      {
        settingName: 'voice_recognition_engine',
        settingValue: 'whisper-large-v3',
        settingType: 'string',
        category: 'Interface Layer',
        description: 'Voice recognition engine for multi-modal interface',
        isActive: true
      },
      {
        settingName: 'api_rate_limit_per_minute',
        settingValue: '1000',
        settingType: 'number',
        category: 'Interface Layer',
        description: 'API calls allowed per minute per client',
        isActive: true
      }
    ];

    for (const setting of metaBrainSettingsData) {
      try {
        await db.insert(metaBrainSettings).values(setting);
      } catch (error) {
        console.log(`Meta Brain setting ${setting.settingName} already exists, skipping...`);
      }
    }

    // Clear and seed Orchestration Workflows
    try {
      await db.delete(orchestrationWorkflows);
    } catch (error) {
      console.log('No existing workflows to clear');
    }
    
    const workflowsData = [
      // Assistant Underwriter-specific workflows
      {
        workflowName: 'Assistant Underwriter Submission Processing',
        description: 'End-to-end Assistant Underwriter submission processing via 6-layer architecture',
        status: 'active',
        triggerType: 'submission_received',
        triggerConfig: { source_systems: ['broker_portal', 'email', 'api'], auto_trigger: true },
        steps: [
          {
            layer: 'Experience',
            agent: 'Personalization Engine',
            action: 'Apply insurer-specific rules and branding',
            timeout: 30
          },
          {
            layer: 'Meta Brain',
            agent: 'Central Orchestrator',
            action: 'Route to appropriate cognitive agents',
            timeout: 15
          },
          {
            layer: 'Cognitive',
            agent: 'AUW Agent',
            action: 'Initial risk assessment and submission validation',
            timeout: 120
          },
          {
            layer: 'Process',
            agent: 'Risk Assessment Agent',
            action: 'Detailed risk analysis and scoring',
            timeout: 180
          },
          {
            layer: 'Process',
            agent: 'Document Verification Agent',
            action: 'Verify and extract key document information',
            timeout: 90
          },
          {
            layer: 'System',
            agent: 'Data Analysis Agent',
            action: 'Cross-reference with external data sources',
            timeout: 60
          },
          {
            layer: 'Interface',
            agent: 'Email Agent',
            action: 'Send acknowledgment and next steps to broker',
            timeout: 30
          }
        ],
        executionCount: 247,
        lastExecuted: new Date(Date.now() - 45 * 60000),
        avgExecutionTime: 485,
        successRate: '94.3'
      },
      // IT Support workflows
      {
        workflowName: 'IT Incident Resolution',
        description: 'Automated IT support incident triage and resolution workflow',
        status: 'active',
        triggerType: 'incident_created',
        triggerConfig: { severity_levels: ['low', 'medium', 'high', 'critical'], auto_assign: true },
        steps: [
          {
            layer: 'Experience',
            agent: 'Personalization Engine',
            action: 'Apply department-specific incident handling rules',
            timeout: 15
          },
          {
            layer: 'Meta Brain',
            agent: 'Central Orchestrator',
            action: 'Prioritize and route to IT support agents',
            timeout: 10
          },
          {
            layer: 'Cognitive',
            agent: 'IT Support Analyst Agent',
            action: 'Initial incident assessment and categorization',
            timeout: 300
          },
          {
            layer: 'Process',
            agent: 'Logging Tickets Agent',
            action: 'Create detailed ticket with categorization',
            timeout: 60
          },
          {
            layer: 'System',
            agent: 'Debugging Agent',
            action: 'Automated diagnostic and log analysis',
            timeout: 180
          },
          {
            layer: 'System',
            agent: 'Automation Code Generation Agent',
            action: 'Generate fix scripts if applicable',
            timeout: 240
          },
          {
            layer: 'Interface',
            agent: 'Chat Agent',
            action: 'Notify user of progress and resolution',
            timeout: 30
          }
        ],
        executionCount: 189,
        lastExecuted: new Date(Date.now() - 23 * 60000),
        avgExecutionTime: 720,
        successRate: '87.8'
      },
      // Cross-layer coordination workflow
      {
        workflowName: 'Meta Brain Health Monitoring',
        description: 'Continuous monitoring and optimization of all 6 agent layers',
        status: 'active',
        triggerType: 'scheduled',
        triggerConfig: { frequency: 'every_5_minutes', health_threshold: 0.85 },
        steps: [
          {
            layer: 'Meta Brain',
            agent: 'Central Orchestrator',
            action: 'Collect performance metrics from all layers',
            timeout: 60
          },
          {
            layer: 'Role',
            agent: 'Monitoring Agent',
            action: 'Analyze layer performance and bottlenecks',
            timeout: 120
          },
          {
            layer: 'System',
            agent: 'Data Analysis Agent',
            action: 'Generate performance insights and recommendations',
            timeout: 180
          },
          {
            layer: 'Process',
            agent: 'User Story Creation Agent',
            action: 'Create optimization tasks if needed',
            timeout: 90
          }
        ],
        executionCount: 2847,
        lastExecuted: new Date(Date.now() - 2 * 60000),
        avgExecutionTime: 142,
        successRate: '99.2'
      }
    ];

    for (const workflow of workflowsData) {
      try {
        await db.insert(orchestrationWorkflows).values(workflow);
      } catch (error) {
        console.log(`Workflow ${workflow.workflowName} already exists, skipping...`);
      }
    }

    // Clear and seed Data Preparation Layers
    try {
      await db.delete(dataPrepLayers);
    } catch (error) {
      console.log('No existing data layers to clear');
    }
    
    const dataLayersData = [
      // Experience Layer Data Sources
      {
        layerName: 'Insurer Customization Profiles',
        sourceSystem: 'Experience Engine',
        dataType: 'Personalization Configs',
        processingStatus: 'processing',
        recordsProcessed: 1247,
        recordsTotal: 1350,
        lastProcessed: new Date(Date.now() - 15 * 60000),
        qualityScore: '96.8',
        errorCount: 3,
        config: { 
          customization_depth: 5, 
          insurer_specific_rules: true,
          branding_templates: 247,
          transformation_rules: 18,
          validation_schemas: 12
        }
      },
      {
        layerName: 'Multi-Tenant Configuration Data',
        sourceSystem: 'Experience Engine',
        dataType: 'Tenant Configurations',
        processingStatus: 'ready',
        recordsProcessed: 2456,
        recordsTotal: 2456,
        lastProcessed: new Date(Date.now() - 8 * 60000),
        qualityScore: '98.3',
        errorCount: 1,
        config: { 
          tenant_count: 247,
          config_templates: 45,
          regional_variants: 15,
          compliance_rules: 23
        }
      },
      // Meta Brain Layer Data Sources
      {
        layerName: 'Cross-Layer Orchestration Logs',
        sourceSystem: 'Meta Brain Central',
        dataType: 'Agent Coordination Data',
        processingStatus: 'ready',
        recordsProcessed: 15847,
        recordsTotal: 15847,
        lastProcessed: new Date(Date.now() - 2 * 60000),
        qualityScore: '99.2',
        errorCount: 0,
        config: { 
          layers_monitored: 6,
          coordination_metrics: true,
          performance_tracking: true,
          workflow_patterns: 156,
          optimization_rules: 34
        }
      },
      {
        layerName: 'Agent Performance Telemetry',
        sourceSystem: 'Meta Brain Central',
        dataType: 'Performance Metrics',
        processingStatus: 'processing',
        recordsProcessed: 45923,
        recordsTotal: 47200,
        lastProcessed: new Date(Date.now() - 1 * 60000),
        qualityScore: '97.8',
        errorCount: 2,
        config: { 
          metric_types: 45,
          sampling_rate: '10s',
          retention_days: 90,
          anomaly_detection: true
        }
      },
      // Role Layer Data Sources
      {
        layerName: 'AUW Processing Queue',
        sourceSystem: 'Role Layer',
        dataType: 'Underwriting Submissions',
        processingStatus: 'processing',
        recordsProcessed: 8234,
        recordsTotal: 8456,
        lastProcessed: new Date(Date.now() - 5 * 60000),
        qualityScore: '94.3',
        errorCount: 12,
        config: { 
          agents: ['AUW', 'Risk Analyst', 'Product Analyst'],
          auto_routing: true,
          priority_queue: true,
          risk_models: 8,
          decision_trees: 24
        }
      },
      {
        layerName: 'IT Support Ticket Analytics',
        sourceSystem: 'Role Layer',
        dataType: 'Support Incidents',
        processingStatus: 'ready',
        recordsProcessed: 3421,
        recordsTotal: 3421,
        lastProcessed: new Date(Date.now() - 8 * 60000),
        qualityScore: '87.8',
        errorCount: 5,
        config: { 
          agents: ['IT Support Analyst', 'Monitoring Agent'],
          escalation_rules: true,
          sla_tracking: true,
          resolution_patterns: 67,
          knowledge_base_articles: 1247
        }
      },
      {
        layerName: 'Customer Interaction Analytics',
        sourceSystem: 'Role Layer',
        dataType: 'Customer Conversations',
        processingStatus: 'processing',
        recordsProcessed: 12567,
        recordsTotal: 13200,
        lastProcessed: new Date(Date.now() - 4 * 60000),
        qualityScore: '91.7',
        errorCount: 8,
        config: { 
          nlp_models: 5,
          sentiment_analysis: true,
          intent_classification: true,
          conversation_flows: 156
        }
      },
      // Process Layer Data Sources
      {
        layerName: 'Document Verification Pipeline',
        sourceSystem: 'Process Layer',
        dataType: 'Insurance Documents',
        processingStatus: 'processing',
        recordsProcessed: 5678,
        recordsTotal: 6234,
        lastProcessed: new Date(Date.now() - 3 * 60000),
        qualityScore: '92.4',
        errorCount: 8,
        config: { 
          verification_agents: ['Document Verification', 'Document Evaluation'],
          ocr_engine: 'vision-transformer-v2',
          confidence_threshold: 0.92,
          document_types: 23,
          validation_rules: 145
        }
      },
      {
        layerName: 'Risk Assessment Data Pipeline',
        sourceSystem: 'Process Layer',
        dataType: 'Risk Profiles',
        processingStatus: 'ready',
        recordsProcessed: 9876,
        recordsTotal: 9876,
        lastProcessed: new Date(Date.now() - 6 * 60000),
        qualityScore: '95.7',
        errorCount: 3,
        config: { 
          risk_factors: 67,
          scoring_algorithms: 12,
          external_data_sources: 8,
          compliance_checks: 24
        }
      },
      {
        layerName: 'Workflow Automation Data',
        sourceSystem: 'Process Layer',
        dataType: 'Process Definitions',
        processingStatus: 'processing',
        recordsProcessed: 2345,
        recordsTotal: 2500,
        lastProcessed: new Date(Date.now() - 7 * 60000),
        qualityScore: '89.2',
        errorCount: 15,
        config: { 
          workflow_templates: 89,
          automation_rules: 234,
          sla_definitions: 45,
          escalation_paths: 67
        }
      },
      // System Layer Data Sources
      {
        layerName: 'Analytics Engine Data',
        sourceSystem: 'System Layer',
        dataType: 'Performance Metrics',
        processingStatus: 'processing',
        recordsProcessed: 45678,
        recordsTotal: 47234,
        lastProcessed: new Date(Date.now() - 1 * 60000),
        qualityScore: '98.1',
        errorCount: 1,
        config: { 
          analysis_agents: ['Data Analysis', 'Debugging', 'Test Designing'],
          real_time_processing: true,
          ml_models: ['forecasting', 'anomaly_detection'],
          data_pipelines: 34,
          transformation_jobs: 123
        }
      },
      {
        layerName: 'Content Generation Data',
        sourceSystem: 'System Layer',
        dataType: 'Generated Content',
        processingStatus: 'ready',
        recordsProcessed: 8943,
        recordsTotal: 8943,
        lastProcessed: new Date(Date.now() - 9 * 60000),
        qualityScore: '93.7',
        errorCount: 4,
        config: { 
          content_types: 15,
          generation_models: 6,
          quality_filters: 23,
          approval_workflows: 12
        }
      },
      {
        layerName: 'External Data Integration',
        sourceSystem: 'System Layer',
        dataType: 'Third-party Data',
        processingStatus: 'processing',
        recordsProcessed: 67834,
        recordsTotal: 69500,
        lastProcessed: new Date(Date.now() - 2 * 60000),
        qualityScore: '96.4',
        errorCount: 6,
        config: { 
          external_sources: 12,
          api_endpoints: 45,
          data_contracts: 23,
          quality_checks: 67
        }
      },
      // Interface Layer Data Sources
      {
        layerName: 'Multi-Modal Interaction Logs',
        sourceSystem: 'Interface Layer',
        dataType: 'User Interactions',
        processingStatus: 'ready',
        recordsProcessed: 23456,
        recordsTotal: 23456,
        lastProcessed: new Date(Date.now() - 4 * 60000),
        qualityScore: '96.5',
        errorCount: 4,
        config: { 
          interfaces: ['Voice', 'Chat', 'Email', 'API'],
          voice_engine: 'whisper-large-v3',
          sentiment_analysis: true,
          interaction_patterns: 156,
          response_templates: 234
        }
      },
      {
        layerName: 'API Gateway Logs',
        sourceSystem: 'Interface Layer',
        dataType: 'API Requests',
        processingStatus: 'processing',
        recordsProcessed: 156789,
        recordsTotal: 158000,
        lastProcessed: new Date(Date.now() - 30000),
        qualityScore: '97.8',
        errorCount: 2,
        config: { 
          endpoints: 89,
          rate_limiting: true,
          authentication_methods: 5,
          monitoring_rules: 34
        }
      },
      {
        layerName: 'Real-time Communication Data',
        sourceSystem: 'Interface Layer',
        dataType: 'Communication Logs',
        processingStatus: 'ready',
        recordsProcessed: 34567,
        recordsTotal: 34567,
        lastProcessed: new Date(Date.now() - 5 * 60000),
        qualityScore: '94.9',
        errorCount: 7,
        config: { 
          channels: ['websocket', 'sse', 'webhook'],
          message_types: 23,
          delivery_guarantees: 'at-least-once',
          encryption: 'AES-256'
        }
      }
    ];

    for (const layer of dataLayersData) {
      try {
        await db.insert(dataPrepLayers).values(layer);
      } catch (error) {
        console.log(`Data layer ${layer.layerName} already exists, skipping...`);
      }
    }

    // Clear and seed AI Commands
    try {
      await db.delete(aiCommands);
    } catch (error) {
      console.log('No existing AI commands to clear');
    }

    const aiCommandsData = [
      // AUW-specific commands
      {
        commandName: 'Process AUW Submission',
        commandType: 'workflow',
        description: 'Automated processing for underwriting submissions through 6-layer architecture',
        targetAgents: ['Experience Agent', 'AUW Agent', 'Risk Assessment Agent', 'Document Verification Agent'],
        parameters: { priority: 'high', auto_approve_threshold: 5000, risk_tolerance: 'medium' },
        executionCount: 247,
        avgResponseTime: 485,
        successRate: '94.3',
        lastExecuted: new Date(Date.now() - 45 * 60000),
        isActive: true
      },
      {
        commandName: 'Risk Analysis Deep Dive',
        commandType: 'analysis',
        description: 'Comprehensive risk analysis using Cognitive and Process layer agents',
        targetAgents: ['Risk Analyst Agent', 'Data Analysis Agent', 'Risk Assessment Agent'],
        parameters: { analysis_depth: 'comprehensive', external_data: true, confidence_threshold: 0.85 },
        executionCount: 156,
        avgResponseTime: 720,
        successRate: '97.8',
        lastExecuted: new Date(Date.now() - 32 * 60000),
        isActive: true
      },
      // IT Support-specific commands
      {
        commandName: 'Incident Auto-Triage',
        commandType: 'triage',
        description: 'Automated incident triage and assignment through Cognitive layer',
        targetAgents: ['IT Support Analyst Agent', 'Monitoring Agent', 'Logging Tickets Agent'],
        parameters: { severity_auto_detect: true, escalation_time: 240, auto_assign: true },
        executionCount: 189,
        avgResponseTime: 120,
        successRate: '89.4',
        lastExecuted: new Date(Date.now() - 12 * 60000),
        isActive: true
      },
      {
        commandName: 'Debug System Issue',
        commandType: 'debugging',
        description: 'Automated debugging using System layer debugging and analysis agents',
        targetAgents: ['Debugging Agent', 'Data Analysis Agent', 'Automation Code Generation Agent'],
        parameters: { log_analysis: true, code_generation: true, fix_suggestions: true },
        executionCount: 78,
        avgResponseTime: 340,
        successRate: '84.2',
        lastExecuted: new Date(Date.now() - 18 * 60000),
        isActive: true
      },
      // Cross-layer coordination commands
      {
        commandName: 'Meta Brain Health Check',
        commandType: 'monitoring',
        description: 'Comprehensive health monitoring across all 6 agent layers',
        targetAgents: ['Central Orchestrator', 'Monitoring Agent', 'Data Analysis Agent'],
        parameters: { all_layers: true, performance_metrics: true, bottleneck_detection: true },
        executionCount: 2847,
        avgResponseTime: 142,
        successRate: '99.2',
        lastExecuted: new Date(Date.now() - 2 * 60000),
        isActive: true
      }
    ];

    for (const command of aiCommandsData) {
      try {
        await db.insert(aiCommands).values(command);
      } catch (error) {
        console.log(`AI command ${command.commandName} already exists, skipping...`);
      }
    }

    // Clear and seed System Integrations
    try {
      await db.delete(systemIntegrations);
    } catch (error) {
      console.log('No existing integrations to clear');
    }

    const integrationsData = [
      // Experience Layer Integrations
      {
        systemName: 'Insurer Branding Portal',
        systemType: 'customization',
        connectionStatus: 'connected',
        apiEndpoint: 'https://api.insurerportal.com/v2/branding',
        authType: 'OAuth 2.0',
        lastSync: new Date(Date.now() - 5 * 60000),
        syncFrequency: 'realtime',
        recordsSynced: 1247,
        errorCount: 2,
        healthScore: '96.8',
        config: { 
          customization_templates: 247,
          real_time_updates: true,
          version: 'v2.3'
        }
      },
      // Cognitive Layer Integrations
      {
        systemName: 'Underwriting Workbench',
        systemType: 'cognitive',
        connectionStatus: 'connected',
        apiEndpoint: 'https://uwb.hexaware.com/api/v3',
        authType: 'API Key',
        lastSync: new Date(Date.now() - 3 * 60000),
        syncFrequency: 'every_5_minutes',
        recordsSynced: 8234,
        errorCount: 5,
        healthScore: '94.3',
        config: { 
          auw_agents: 12,
          concurrent_processing: true,
          risk_models: ['property', 'casualty', 'life']
        }
      },
      {
        systemName: 'IT Service Management',
        systemType: 'itsm',
        connectionStatus: 'connected',
        apiEndpoint: 'https://itsm.hexaware.com/api/v2/incidents',
        authType: 'Bearer Token',
        lastSync: new Date(Date.now() - 8 * 60000),
        syncFrequency: 'realtime',
        recordsSynced: 3421,
        errorCount: 3,
        healthScore: '87.8',
        config: { 
          auto_assignment: true,
          sla_tracking: true,
          escalation_rules: true
        }
      },
      // Process Layer Integrations
      {
        systemName: 'Document Processing Engine',
        systemType: 'document',
        connectionStatus: 'connected',
        apiEndpoint: 'https://docs.hexaware.com/api/v4/process',
        authType: 'Certificate',
        lastSync: new Date(Date.now() - 2 * 60000),
        syncFrequency: 'realtime',
        recordsSynced: 5678,
        errorCount: 1,
        healthScore: '98.2',
        config: { 
          ocr_engine: 'vision-transformer-v2',
          document_types: ['applications', 'claims', 'policies'],
          confidence_threshold: 0.92
        }
      },
      // System Layer Integrations
      {
        systemName: 'Analytics Data Warehouse',
        systemType: 'analytics',
        connectionStatus: 'connected',
        apiEndpoint: 'jdbc:postgresql://dw.hexaware.com:5432/insurance_dw',
        authType: 'Database Auth',
        lastSync: new Date(Date.now() - 1 * 60000),
        syncFrequency: 'realtime',
        recordsSynced: 45678,
        errorCount: 0,
        healthScore: '100.0',
        config: { 
          connection_pool: 50,
          real_time_streaming: true,
          ml_models: ['forecasting', 'anomaly_detection']
        }
      },
      // Interface Layer Integrations
      {
        systemName: 'Multi-Modal Interface Hub',
        systemType: 'interface',
        connectionStatus: 'connected',
        apiEndpoint: 'https://interface.hexaware.com/api/v3/channels',
        authType: 'JWT',
        lastSync: new Date(Date.now() - 30000),
        syncFrequency: 'realtime',
        recordsSynced: 23456,
        errorCount: 2,
        healthScore: '96.5',
        config: { 
          channels: ['voice', 'chat', 'email', 'api'],
          voice_engine: 'whisper-large-v3',
          sentiment_analysis: true
        }
      },
      // External Integrations
      {
        systemName: 'Salesforce CRM',
        systemType: 'salesforce',
        connectionStatus: 'connected',
        apiEndpoint: 'https://hexaware.my.salesforce.com/services/data/v58.0',
        authType: 'OAuth 2.0',
        lastSync: new Date(Date.now() - 10 * 60000),
        syncFrequency: 'every_15_minutes',
        recordsSynced: 12456,
        errorCount: 1,
        healthScore: '98.9',
        config: { 
          sandbox: false,
          api_version: 'v58.0',
          bulk_operations: true
        }
      },
      {
        systemName: 'Duck Creek Policy System',
        systemType: 'duck_creek',
        connectionStatus: 'connected',
        apiEndpoint: 'https://dcs.hexaware.com/policy/api/v2',
        authType: 'API Key',
        lastSync: new Date(Date.now() - 7 * 60000),
        syncFrequency: 'every_10_minutes',
        recordsSynced: 8934,
        errorCount: 2,
        healthScore: '96.1',
        config: { 
          policy_types: ['auto', 'home', 'commercial'],
          real_time_quotes: true
        }
      }
    ];

    for (const integration of integrationsData) {
      try {
        await db.insert(systemIntegrations).values(integration);
      } catch (error) {
        console.log(`Integration ${integration.systemName} already exists, skipping...`);
      }
    }

    // Clear and seed Agent Templates
    try {
      await db.delete(agentTemplates);
    } catch (error) {
      console.log('No existing agent templates to clear');
    }

    const agentTemplatesData = [
      // Experience Layer Templates
      {
        templateName: 'Personalization Engine Template',
        agentType: 'Experience',
        layer: 'Experience',
        description: 'Template for creating insurer-specific personalization agents',
        capabilities: ['Custom Branding', 'Rule Configuration', 'Workflow Personalization', 'UI Customization'],
        configuration: { 
          customization_depth: 5,
          supported_insurers: ['all'],
          real_time_updates: true,
          template_library: 247
        },
        dependencies: ['Branding API', 'Configuration Service'],
        isActive: true,
        usageCount: 15
      },
      // Meta Brain Layer Templates
      {
        templateName: 'Central Orchestrator Template',
        agentType: 'Meta Brain',
        layer: 'Meta Brain',
        description: 'Template for creating central coordination and orchestration agents',
        capabilities: ['Layer Coordination', 'Task Routing', 'Performance Monitoring', 'Load Balancing'],
        configuration: { 
          layers_managed: 6,
          max_concurrent_tasks: 1000,
          health_monitoring: true,
          auto_scaling: true
        },
        dependencies: ['All Layer APIs', 'Monitoring Service', 'Message Queue'],
        isActive: true,
        usageCount: 3
      },
      // Role Layer Templates
      {
        templateName: 'AUW Agent Template',
        agentType: 'Role',
        layer: 'Role',
        description: 'Template for creating automated underwriting agents for different lines of business',
        capabilities: ['Submission Review', 'Risk Assessment', 'Decision Making', 'Exception Handling'],
        configuration: { 
          max_submission_amount: 100000,
          auto_approve_threshold: 5000,
          risk_models: ['property', 'casualty', 'life'],
          processing_threads: 12
        },
        dependencies: ['Risk Assessment Service', 'Document Processing', 'External Data Sources'],
        isActive: true,
        usageCount: 8
      },
      {
        templateName: 'IT Support Analyst Template',
        agentType: 'Role',
        layer: 'Role',
        description: 'Template for creating IT support and incident management agents',
        capabilities: ['Incident Triage', 'Problem Diagnosis', 'Solution Recommendation', 'Escalation Management'],
        configuration: { 
          severity_levels: ['low', 'medium', 'high', 'critical'],
          escalation_time: 240,
          auto_assignment: true,
          knowledge_base_access: true
        },
        dependencies: ['ITSM System', 'Knowledge Base', 'Monitoring Tools'],
        isActive: true,
        usageCount: 6
      },
      // Process Layer Templates
      {
        templateName: 'Document Verification Agent Template',
        agentType: 'Process',
        layer: 'Process',
        description: 'Template for creating document processing and verification agents',
        capabilities: ['OCR Processing', 'Document Classification', 'Data Extraction', 'Validation'],
        configuration: { 
          ocr_engine: 'vision-transformer-v2',
          supported_formats: ['pdf', 'jpg', 'png', 'tiff'],
          confidence_threshold: 0.92,
          batch_processing: true
        },
        dependencies: ['OCR Service', 'Document Storage', 'Validation Rules'],
        isActive: true,
        usageCount: 12
      },
      {
        templateName: 'Risk Assessment Agent Template',
        agentType: 'Process',
        layer: 'Process',
        description: 'Template for creating specialized risk assessment agents',
        capabilities: ['Risk Scoring', 'External Data Integration', 'Model Execution', 'Report Generation'],
        configuration: { 
          risk_models: ['property', 'casualty', 'life', 'cyber'],
          external_sources: ['ISO', 'ACORD', 'Credit Bureaus'],
          scoring_algorithms: ['ml', 'rules_based', 'hybrid'],
          confidence_threshold: 0.85
        },
        dependencies: ['Risk Models', 'External APIs', 'Historical Data'],
        isActive: true,
        usageCount: 9
      },
      // System Layer Templates
      {
        templateName: 'Data Analysis Agent Template',
        agentType: 'System',
        layer: 'System',
        description: 'Template for creating data analysis and insights agents',
        capabilities: ['Data Processing', 'Statistical Analysis', 'ML Model Execution', 'Insights Generation'],
        configuration: { 
          batch_size: 1000,
          ml_models: ['forecasting', 'classification', 'clustering'],
          real_time_processing: true,
          data_sources: ['multiple']
        },
        dependencies: ['Data Warehouse', 'ML Platform', 'Compute Resources'],
        isActive: true,
        usageCount: 7
      },
      {
        templateName: 'Debugging Agent Template',
        agentType: 'System',
        layer: 'System',
        description: 'Template for creating automated debugging and diagnostic agents',
        capabilities: ['Log Analysis', 'Error Detection', 'Root Cause Analysis', 'Fix Suggestion'],
        configuration: { 
          log_sources: ['application', 'system', 'network'],
          analysis_depth: 'comprehensive',
          code_generation: true,
          fix_automation: false
        },
        dependencies: ['Log Aggregation', 'Code Repository', 'Diagnostic Tools'],
        isActive: true,
        usageCount: 4
      },
      // Interface Layer Templates
      {
        templateName: 'Voice Interface Agent Template',
        agentType: 'Interface',
        layer: 'Interface',
        description: 'Template for creating voice interaction agents',
        capabilities: ['Speech Recognition', 'Natural Language Processing', 'Voice Synthesis', 'Context Management'],
        configuration: { 
          voice_engine: 'whisper-large-v3',
          languages: ['en-US', 'es-ES', 'fr-FR'],
          recognition_accuracy: 0.98,
          response_time_ms: 150
        },
        dependencies: ['Voice Engine', 'NLP Service', 'TTS Service'],
        isActive: true,
        usageCount: 11
      },
      {
        templateName: 'API Interface Agent Template',
        agentType: 'Interface',
        layer: 'Interface',
        description: 'Template for creating RESTful API interface agents',
        capabilities: ['Request Processing', 'Response Formatting', 'Authentication', 'Rate Limiting'],
        configuration: { 
          api_version: 'v3',
          rate_limit: 1000,
          authentication: ['jwt', 'api_key', 'oauth'],
          response_formats: ['json', 'xml']
        },
        dependencies: ['API Gateway', 'Auth Service', 'Load Balancer'],
        isActive: true,
        usageCount: 13
      }
    ];

    for (const template of agentTemplatesData) {
      try {
        await db.insert(agentTemplates).values(template);
      } catch (error) {
        console.log(`Agent template ${template.templateName} already exists, skipping...`);
      }
    }

    // Clear and seed Experience Agent Personalization Configurations
    try {
      await db.delete(personalizationConfigs);
    } catch (error) {
      console.log('No existing personalization configs to clear');
    }

    const personalizationData = [
      {
        insurerId: 1,
        roleConfig: {
          companyName: 'Hexaware Technologies Ltd',
          insuranceSector: 'Property & Casualty',
          primaryContact: 'IT Department',
          businessModel: 'B2B2C'
        },
        workflowConfig: {
          businessUnits: ['Commercial Lines', 'Claims', 'Customer Service', 'Personal Lines', 'Underwriting'],
          primaryWorkflows: ['Claims Processing', 'Policy Administration', 'Risk Assessment'],
          automationLevel: 'high',
          approvalWorkflows: true
        },
        systemConfig: {
          companySize: 'enterprise',
          employeeCount: 5000,
          policyHolders: 2500000,
          annualPremium: '12.5B USD',
          dataRetention: '7 years',
          compliance: ['SOX', 'GDPR', 'CCPA']
        },
        interfaceConfig: {
          customTheme: true,
          voiceEnabled: true,
          multiLanguage: ['en-US', 'es-ES', 'fr-FR'],
          mobileOptimized: true,
          accessibilityLevel: 'WCAG AA'
        },
        branding: {
          primaryBrandColor: '#1a365d',
          secondaryBrandColor: '#eab308',
          accentColor: '#2563eb',
          logoUrl: null,
          fontFamily: 'Inter',
          customCSS: true
        }
      }
    ];

    for (const config of personalizationData) {
      try {
        await db.insert(personalizationConfigs).values(config);
      } catch (error) {
        console.log(`Personalization config for insurer ${config.insurerId} already exists, skipping...`);
      }
    }

    // Seed tab configurations for metadata-driven tabs
    const { seedTabConfigurations } = await import('./seedTabConfigurations');
    await seedTabConfigurations();

    console.log('Dashboard data seeding completed successfully');
  } catch (error) {
    console.error('Error seeding dashboard data:', error);
    throw error;
  }
}
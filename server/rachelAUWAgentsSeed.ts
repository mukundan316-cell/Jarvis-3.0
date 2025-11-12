import { db } from './db.js';
import { agents } from '../shared/schema.js';

// Seed Rachel's unique Assistant Underwriter agents based on analysis
export async function seedRachelAUWAgents() {
  console.log('Seeding Rachel Assistant Underwriter specialized agents...');

  // Clear existing Rachel-specific agents (keep the core unified ones)
  try {
    // For now, skip deletion to preserve existing agents
    // await db.delete(agents).where(eq(agents.persona, 'rachel'));
    console.log('Preserving existing Rachel AUW agents during seeding');
  } catch (error) {
    console.log('No existing Rachel AUW agents to clear');
  }

  const rachelAUWAgents = [
    // PROCESS LAYER - Unique Assistant Underwriter Agents (16 agents)
    // Risk Evaluation Pipeline removed - risk assessment agents purged
    {
      name: 'Renewal Processing Workflow',
      type: 'Policy Lifecycle',
      layer: 'Process',
      config: {
        persona: 'rachel',
        specialization: 'Assistant Underwriter policy renewal evaluation and processing',
        capabilities: ['renewal_analysis', 'rate_adjustments', 'coverage_updates'],
        integration: ['policy_history', 'claims_data', 'market_rates']
      },
      status: 'active'
    },
    {
      name: 'Mid-term Adjustment Processor',
      type: 'Policy Management',
      layer: 'Process',
      config: {
        persona: 'rachel',
        specialization: 'Policy modification and endorsement workflow',
        capabilities: ['coverage_changes', 'rate_adjustments', 'endorsements'],
        integration: ['policy_terms', 'underwriting_rules', 'compliance_checks']
      },
      status: 'active'
    },
    {
      name: 'Reinsurance Placement Workflow',
      type: 'Risk Transfer',
      layer: 'Process',
      config: {
        persona: 'rachel',
        specialization: 'Automatic reinsurance treaty allocation and placement',
        capabilities: ['treaty_matching', 'capacity_allocation', 'placement_optimization'],
        integration: ['reinsurer_panels', 'treaty_terms', 'exposure_limits']
      },
      status: 'active'
    },
    {
      name: 'Claims Assessment Workflow',
      type: 'Claims Processing',
      layer: 'Process',
      config: {
        persona: 'rachel',
        specialization: 'End-to-end claims processing from FNOL to settlement',
        capabilities: ['claims_triage', 'coverage_verification', 'settlement_calculation'],
        integration: ['policy_terms', 'claims_history', 'legal_requirements']
      },
      status: 'active'
    },
    {
      name: 'Claims Investigation Pipeline',
      type: 'Investigation',
      layer: 'Process',
      config: {
        persona: 'rachel',
        specialization: 'Automated investigation coordination and management',
        capabilities: ['investigation_assignment', 'evidence_collection', 'expert_coordination'],
        integration: ['investigation_vendors', 'legal_teams', 'adjuster_networks']
      },
      status: 'active'
    },
    {
      name: 'Settlement Processing Workflow',
      type: 'Claims Settlement',
      layer: 'Process',
      config: {
        persona: 'rachel',
        specialization: 'Claims payment authorization and distribution',
        capabilities: ['payment_calculation', 'authorization_routing', 'disbursement_tracking'],
        integration: ['payment_systems', 'accounting_systems', 'regulatory_reporting']
      },
      status: 'active'
    },
    {
      name: 'Subrogation Management Processor',
      type: 'Recovery',
      layer: 'Process',
      config: {
        persona: 'rachel',
        specialization: 'Recovery and subrogation process coordination',
        capabilities: ['recovery_identification', 'legal_coordination', 'collection_tracking'],
        integration: ['legal_systems', 'collection_agencies', 'court_systems']
      },
      status: 'active'
    },
    {
      name: 'Claims Fraud Detection Workflow',
      type: 'Fraud Prevention',
      layer: 'Process',
      config: {
        persona: 'rachel',
        specialization: 'Suspicious claims identification and investigation',
        capabilities: ['pattern_recognition', 'anomaly_detection', 'investigation_triggers'],
        integration: ['fraud_databases', 'investigation_teams', 'law_enforcement']
      },
      status: 'active'
    },
    {
      name: 'Catastrophic Risk Evaluation Processor',
      type: 'CAT Modeling',
      layer: 'Process',
      config: {
        persona: 'rachel',
        specialization: 'CAT modeling and exposure assessment',
        capabilities: ['exposure_modeling', 'scenario_analysis', 'accumulation_tracking'],
        integration: ['cat_models', 'weather_data', 'geographic_systems']
      },
      status: 'active'
    },
    {
      name: 'Portfolio Analysis Workflow',
      type: 'Portfolio Management',
      layer: 'Process',
      config: {
        persona: 'rachel',
        specialization: 'Risk concentration and diversification analysis',
        capabilities: ['concentration_analysis', 'diversification_metrics', 'correlation_modeling'],
        integration: ['portfolio_data', 'risk_models', 'performance_metrics']
      },
      status: 'active'
    },
    {
      name: 'Regulatory Compliance Validation Workflow',
      type: 'Compliance',
      layer: 'Process',
      config: {
        persona: 'rachel',
        specialization: 'Automated compliance checking and validation',
        capabilities: ['regulation_checking', 'filing_validation', 'audit_preparation'],
        integration: ['regulatory_databases', 'filing_systems', 'audit_systems']
      },
      status: 'active'
    },
    {
      name: 'Audit Trail Generation Processor',
      type: 'Documentation',
      layer: 'Process',
      config: {
        persona: 'rachel',
        specialization: 'Complete documentation and audit workflow',
        capabilities: ['activity_logging', 'document_generation', 'compliance_tracking'],
        integration: ['all_systems', 'document_management', 'audit_systems']
      },
      status: 'active'
    },
    {
      name: 'Risk Model Calibration Workflow',
      type: 'Model Management',
      layer: 'Process',
      config: {
        persona: 'rachel',
        specialization: 'Continuous risk model improvement and updates',
        capabilities: ['model_validation', 'calibration_analysis', 'performance_monitoring'],
        integration: ['actuarial_systems', 'statistical_tools', 'validation_frameworks']
      },
      status: 'active'
    },
    {
      name: 'Application Assistance Pipeline',
      type: 'Application Support',
      layer: 'Process',
      config: {
        persona: 'rachel',
        specialization: 'Guided application completion support',
        capabilities: ['form_assistance', 'data_validation', 'completion_guidance'],
        integration: ['application_systems', 'validation_rules', 'help_systems']
      },
      status: 'active'
    },
    {
      name: 'Broker Training Workflow',
      type: 'Education',
      layer: 'Process',
      config: {
        persona: 'rachel',
        specialization: 'Education and certification process management',
        capabilities: ['training_delivery', 'certification_tracking', 'performance_assessment'],
        integration: ['learning_systems', 'certification_databases', 'performance_systems']
      },
      status: 'active'
    },
    {
      name: 'Performance Monitoring Processor',
      type: 'Performance Management',
      layer: 'Process',
      config: {
        persona: 'rachel',
        specialization: 'Broker performance tracking and feedback',
        capabilities: ['performance_metrics', 'trend_analysis', 'feedback_generation'],
        integration: ['performance_databases', 'analytics_systems', 'reporting_tools']
      },
      status: 'active'
    },

    // SYSTEM LAYER - Unique Assistant Underwriter Agents (15 agents)
    {
      name: 'Risk Calculation Engine',
      type: 'Calculation Engine',
      layer: 'System',
      config: {
        persona: 'rachel',
        specialization: 'Advanced actuarial models and risk pricing algorithms',
        capabilities: ['risk_modeling', 'pricing_algorithms', 'statistical_analysis'],
        integration: ['actuarial_data', 'market_data', 'regulatory_requirements']
      },
      status: 'active'
    },
    {
      name: 'Policy Management System',
      type: 'Policy System',
      layer: 'System',
      config: {
        persona: 'rachel',
        specialization: 'Complete policy lifecycle data management',
        capabilities: ['policy_storage', 'lifecycle_tracking', 'version_control'],
        integration: ['underwriting_systems', 'claims_systems', 'billing_systems']
      },
      status: 'active'
    },
    {
      name: 'Underwriting Rules Engine',
      type: 'Rules Engine',
      layer: 'System',
      config: {
        persona: 'rachel',
        specialization: 'Business rules processing and decision automation',
        capabilities: ['rule_processing', 'decision_automation', 'exception_handling'],
        integration: ['underwriting_guidelines', 'regulatory_rules', 'company_policies']
      },
      status: 'active'
    },
    {
      name: 'Document Management System',
      type: 'Document System',
      layer: 'System',
      config: {
        persona: 'rachel',
        specialization: 'Underwriting document storage and retrieval',
        capabilities: ['document_storage', 'version_control', 'access_management'],
        integration: ['scanning_systems', 'workflow_systems', 'archive_systems']
      },
      status: 'active'
    },
    {
      name: 'Claims Database Coordinator',
      type: 'Database System',
      layer: 'System',
      config: {
        persona: 'rachel',
        specialization: 'Claims data integration, storage, and retrieval',
        capabilities: ['data_integration', 'storage_management', 'query_optimization'],
        integration: ['claims_systems', 'policy_systems', 'payment_systems']
      },
      status: 'active'
    },
    {
      name: 'Claims Processing Engine',
      type: 'Processing Engine',
      layer: 'System',
      config: {
        persona: 'rachel',
        specialization: 'Core claims workflow and decision processing',
        capabilities: ['workflow_processing', 'decision_logic', 'automation_rules'],
        integration: ['claims_data', 'policy_data', 'regulatory_requirements']
      },
      status: 'active'
    },
    {
      name: 'Payment Processing System',
      type: 'Payment System',
      layer: 'System',
      config: {
        persona: 'rachel',
        specialization: 'Claims settlement and payment coordination',
        capabilities: ['payment_processing', 'settlement_calculation', 'disbursement_tracking'],
        integration: ['banking_systems', 'accounting_systems', 'regulatory_reporting']
      },
      status: 'active'
    },
    {
      name: 'Investigation Management System',
      type: 'Investigation System',
      layer: 'System',
      config: {
        persona: 'rachel',
        specialization: 'Claims investigation resource coordination',
        capabilities: ['resource_allocation', 'investigation_tracking', 'vendor_management'],
        integration: ['vendor_systems', 'scheduling_systems', 'communication_systems']
      },
      status: 'active'
    },
    {
      name: 'Fraud Detection System',
      type: 'Fraud System',
      layer: 'System',
      config: {
        persona: 'rachel',
        specialization: 'Pattern recognition and suspicious activity identification',
        capabilities: ['pattern_analysis', 'anomaly_detection', 'scoring_algorithms'],
        integration: ['claims_data', 'external_databases', 'investigation_systems']
      },
      status: 'active'
    },
    {
      name: 'Actuarial Data Engine',
      type: 'Actuarial System',
      layer: 'System',
      config: {
        persona: 'rachel',
        specialization: 'Historical loss data and predictive modeling',
        capabilities: ['data_modeling', 'statistical_analysis', 'predictive_algorithms'],
        integration: ['loss_databases', 'market_data', 'regulatory_data']
      },
      status: 'active'
    },
    {
      name: 'Catastrophic Risk Modeling System',
      type: 'CAT System',
      layer: 'System',
      config: {
        persona: 'rachel',
        specialization: 'CAT exposure and scenario modeling',
        capabilities: ['exposure_modeling', 'scenario_simulation', 'risk_aggregation'],
        integration: ['cat_vendors', 'geographic_data', 'weather_systems']
      },
      status: 'active'
    },
    {
      name: 'Portfolio Analytics Engine',
      type: 'Analytics Engine',
      layer: 'System',
      config: {
        persona: 'rachel',
        specialization: 'Risk concentration and performance analysis',
        capabilities: ['portfolio_analysis', 'concentration_metrics', 'performance_tracking'],
        integration: ['policy_data', 'claims_data', 'market_data']
      },
      status: 'active'
    },
    {
      name: 'Predictive Analytics System',
      type: 'Predictive System',
      layer: 'System',
      config: {
        persona: 'rachel',
        specialization: 'Trend forecasting and risk prediction',
        capabilities: ['trend_analysis', 'forecasting_models', 'risk_prediction'],
        integration: ['historical_data', 'market_trends', 'economic_indicators']
      },
      status: 'active'
    },
    {
      name: 'Regulatory Reporting System',
      type: 'Reporting System',
      layer: 'System',
      config: {
        persona: 'rachel',
        specialization: 'Automated compliance reporting and filing',
        capabilities: ['report_generation', 'regulatory_filing', 'compliance_tracking'],
        integration: ['regulatory_systems', 'data_sources', 'filing_platforms']
      },
      status: 'active'
    },
    {
      name: 'Third-party Data Integration Hub',
      type: 'Integration Hub',
      layer: 'System',
      config: {
        persona: 'rachel',
        specialization: 'External data sources integration (credit, MVR, property)',
        capabilities: ['data_integration', 'api_management', 'data_enrichment'],
        integration: ['credit_bureaus', 'mvr_providers', 'property_databases']
      },
      status: 'active'
    },

    // INTERFACE LAYER - Unique Assistant Underwriter Agents (13 agents)
    // Risk Assessment Dashboard Interface removed - agents purged from database
    {
      name: 'Policy Management Interface',
      type: 'Management Interface',
      layer: 'Interface',
      config: {
        persona: 'rachel',
        specialization: 'Policy creation, modification, and tracking',
        capabilities: ['policy_forms', 'modification_tools', 'tracking_dashboards'],
        integration: ['policy_systems', 'workflow_engines', 'document_systems']
      },
      status: 'active'
    },
    {
      name: 'Underwriting Queue Interface',
      type: 'Queue Interface',
      layer: 'Interface',
      config: {
        persona: 'rachel',
        specialization: 'Work prioritization and task management',
        capabilities: ['queue_management', 'priority_sorting', 'task_assignment'],
        integration: ['workflow_systems', 'workload_management', 'priority_engines']
      },
      status: 'active'
    },
    {
      name: 'Decision Support Interface',
      type: 'Decision Interface',
      layer: 'Interface',
      config: {
        persona: 'rachel',
        specialization: 'AI-powered underwriting recommendations',
        capabilities: ['decision_support', 'recommendation_engine', 'explanation_tools'],
        integration: ['ai_systems', 'decision_engines', 'knowledge_bases']
      },
      status: 'active'
    },
    {
      name: 'Claims Processing Interface',
      type: 'Claims Interface',
      layer: 'Interface',
      config: {
        persona: 'rachel',
        specialization: 'Claims management dashboard and workflow',
        capabilities: ['claims_dashboards', 'workflow_management', 'status_tracking'],
        integration: ['claims_systems', 'workflow_engines', 'communication_systems']
      },
      status: 'active'
    },
    {
      name: 'Claims Investigation Interface',
      type: 'Investigation Interface',
      layer: 'Interface',
      config: {
        persona: 'rachel',
        specialization: 'Investigation coordination and tracking',
        capabilities: ['investigation_tracking', 'resource_coordination', 'progress_monitoring'],
        integration: ['investigation_systems', 'vendor_systems', 'communication_tools']
      },
      status: 'active'
    },
    {
      name: 'Settlement Authorization Interface',
      type: 'Authorization Interface',
      layer: 'Interface',
      config: {
        persona: 'rachel',
        specialization: 'Payment approval and processing interface',
        capabilities: ['authorization_tools', 'approval_workflows', 'payment_tracking'],
        integration: ['payment_systems', 'authorization_systems', 'audit_systems']
      },
      status: 'active'
    },
    {
      name: 'Fraud Investigation Interface',
      type: 'Fraud Interface',
      layer: 'Interface',
      config: {
        persona: 'rachel',
        specialization: 'Suspicious activity review and investigation',
        capabilities: ['fraud_dashboards', 'investigation_tools', 'evidence_management'],
        integration: ['fraud_systems', 'investigation_systems', 'legal_systems']
      },
      status: 'active'
    },
    {
      name: 'Claims Analytics Interface',
      type: 'Analytics Interface',
      layer: 'Interface',
      config: {
        persona: 'rachel',
        specialization: 'Claims performance and trend analysis',
        capabilities: ['analytics_dashboards', 'trend_visualization', 'performance_metrics'],
        integration: ['analytics_systems', 'reporting_tools', 'data_visualization']
      },
      status: 'active'
    },
    {
      name: 'Broker Portal Interface',
      type: 'Portal Interface',
      layer: 'Interface',
      config: {
        persona: 'rachel',
        specialization: 'Self-service broker tools and communication',
        capabilities: ['self_service_tools', 'communication_portal', 'resource_access'],
        integration: ['broker_systems', 'communication_tools', 'document_systems']
      },
      status: 'active'
    },
    {
      name: 'Quote Delivery Interface',
      type: 'Delivery Interface',
      layer: 'Interface',
      config: {
        persona: 'rachel',
        specialization: 'Automated quote generation and transmission',
        capabilities: ['quote_generation', 'delivery_automation', 'status_tracking'],
        integration: ['quoting_systems', 'delivery_systems', 'communication_tools']
      },
      status: 'active'
    },
    {
      name: 'Application Status Interface',
      type: 'Status Interface',
      layer: 'Interface',
      config: {
        persona: 'rachel',
        specialization: 'Real-time application tracking for brokers',
        capabilities: ['status_tracking', 'progress_visualization', 'notification_management'],
        integration: ['application_systems', 'workflow_systems', 'notification_services']
      },
      status: 'active'
    },
    {
      name: 'Training Portal Interface',
      type: 'Training Interface',
      layer: 'Interface',
      config: {
        persona: 'rachel',
        specialization: 'Broker education and certification platform',
        capabilities: ['training_delivery', 'certification_tracking', 'resource_management'],
        integration: ['learning_systems', 'certification_systems', 'content_management']
      },
      status: 'active'
    }
  ];

  // Insert the unique AUW agents
  await db.insert(agents).values(rachelAUWAgents);
  
  console.log(`✅ Successfully seeded ${rachelAUWAgents.length} unique Rachel AUW agents`);
}
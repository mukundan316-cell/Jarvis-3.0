import { db } from './db';
import { ConfigService } from './configService';

export async function seedDemoConfiguration(userId: string) {
  console.log('Seeding demo configuration using ConfigService...');
  
  try {
    // 1. Demo Email Templates - following NO HARD-CODING principle
    const emailTemplates = {
      'willis_apex_manufacturing': {
        templateKey: 'email.broker.willis-apex',
        templateCategory: 'broker_submission',
        subject: 'URGENT: Commercial Property Submission - Apex Manufacturing Complex',
        fromEmail: 'sarah.wilson@willistowerswatson.com',
        brokerName: 'Willis Towers Watson',
        brokerContact: 'sarah.wilson@willistowerswatson.com',
        bodyTemplate: `Dear Rachel,

Please find attached our urgent commercial property submission for {{insured_name}}.

SUBMISSION DETAILS:
• Insured: {{insured_name}}
• Property Address: {{property_address}}
• Building Type: {{property_type}}
• Total Insured Value: ${{tiv}}
• Line of Business: Commercial Property
• Effective Date: 01/01/2025
• Policy Term: 12 months

ATTACHMENTS:
{{#each attachments}}
• {{filename}} ({{type}})
{{/each}}

Key Features:
- {{building_size}} sq ft manufacturing facility built in {{year_built}}
- Full sprinkler system with central monitoring
- 24/7 security with cameras and access control
- Clean loss history - no claims in 5 years
- ISO Class 3 fire protection
- Seeking $2M property limit + $1.5M business income

This is a high-priority renewal for one of our key manufacturing clients. They have expressed interest in expanding coverage and are evaluating multiple carriers.

Please prioritize this submission for immediate review. The client is expecting a quote by end of week.

Best regards,
Sarah Wilson
Senior Commercial Lines Broker
Willis Towers Watson
Direct: (555) 987-6543
sarah.wilson@willistowerswatson.com`,
        variables: ['insured_name', 'property_address', 'property_type', 'tiv', 'attachments', 'building_size', 'year_built']
      },
      'marsh_retail_complex': {
        templateKey: 'email.broker.marsh-retail',
        templateCategory: 'broker_submission',
        subject: 'Commercial Property Renewal - Downtown Plaza Retail Complex',
        fromEmail: 'james.parker@marsh.com',
        brokerName: 'Marsh & McLennan',
        brokerContact: 'james.parker@marsh.com',
        bodyTemplate: `Dear Rachel,

I hope this email finds you well. Please find attached our renewal submission for {{insured_name}}.

SUBMISSION DETAILS:
• Insured: {{insured_name}}
• Property Address: {{property_address}}
• Building Type: {{property_type}}
• Total Insured Value: ${{tiv}}
• Line of Business: Commercial Property
• Current Expiration: 03/15/2025
• Renewal Term: 12 months

ATTACHMENTS:
{{#each attachments}}
• {{filename}} ({{type}})
{{/each}}

Key Features:
- {{building_size}} sq ft retail complex built in {{year_built}}
- {{occupancy_rate}}% occupancy rate with stable tenants
- Recent roof replacement (2023)
- Updated HVAC systems
- Adequate parking facilities
- Seeking competitive renewal terms

The property has performed well with no significant losses. We're looking for a smooth renewal process with our current carrier.

Please let me know if you need any additional information.

Best regards,
James Parker
Account Executive
Marsh & McLennan
Direct: (555) 456-7890
james.parker@marsh.com`,
        variables: ['insured_name', 'property_address', 'property_type', 'tiv', 'attachments', 'building_size', 'year_built', 'occupancy_rate']
      }
    };

    // Store email templates in ConfigService
    for (const [scenarioKey, template] of Object.entries(emailTemplates)) {
      await ConfigService.setSetting(
        `demo.email-templates.${scenarioKey}`,
        template,
        { persona: 'rachel' },
        new Date(),
        undefined,
        userId
      );
    }

    // 2. Demo Scenario Configurations
    const demoScenarios = {
      'willis_apex_manufacturing': {
        scenario_name: 'Willis Apex Manufacturing',
        broker_name: 'Willis Towers Watson',
        broker_contact: 'sarah.wilson@willistowerswatson.com',
        insured_name: 'Apex Manufacturing Ltd',
        submission_type: 'commercial_property',
        priority: 'urgent',
        tiv: 15000000,
        property_type: 'Manufacturing Facility',
        building_size: 200000,
        year_built: 2018,
        property_address: '2847 Industrial Park Blvd, Riverside, CA 92503',
        attachments: [
          { filename: 'ACORD_125_Apex_Manufacturing.pdf', size: '2.8 MB', type: 'ACORD 125' },
          { filename: 'SOV_Apex_Manufacturing_2025.xlsx', size: '1.2 MB', type: 'Statement of Values' },
          { filename: 'Loss_Runs_Apex_2019_2024.pdf', size: '890 KB', type: 'Loss History' },
          { filename: 'Property_Photos_Apex.zip', size: '18.7 MB', type: 'Property Images' },
          { filename: 'Financial_Statements_Apex_2024.pdf', size: '3.8 MB', type: 'Financial' },
          { filename: 'Environmental_Assessment_Apex.pdf', size: '2.1 MB', type: 'Environmental' }
        ],
        processing_delay: 2000,
        expected_outcome: 'refer_to_senior',
        workflow_complexity: 'high',
        email_template_key: 'demo.email-templates.willis_apex_manufacturing'
      },
      'marsh_retail_complex': {
        scenario_name: 'Marsh Retail Complex',
        broker_name: 'Marsh & McLennan',
        broker_contact: 'james.parker@marsh.com',
        insured_name: 'Downtown Plaza Retail Complex',
        submission_type: 'commercial_property',
        priority: 'high',
        tiv: 8500000,
        property_type: 'Retail Complex',
        building_size: 95000,
        year_built: 2010,
        occupancy_rate: 85,
        property_address: '456 Main Street, Downtown Metro, TX 75201',
        attachments: [
          { filename: 'ACORD_140_Downtown_Plaza.pdf', size: '1.8 MB', type: 'ACORD 140' },
          { filename: 'Tenant_Schedule_2025.xlsx', size: '450 KB', type: 'Tenant Information' },
          { filename: 'Property_Management_Report_Q4.pdf', size: '1.1 MB', type: 'Management Report' },
          { filename: 'Current_Photos_Downtown_Plaza.zip', size: '12.3 MB', type: 'Property Images' }
        ],
        processing_delay: 1500,
        expected_outcome: 'auto_quote',
        workflow_complexity: 'standard',
        email_template_key: 'demo.email-templates.marsh_retail_complex'
      }
    };

    // Store demo scenarios in ConfigService
    for (const [scenarioKey, scenario] of Object.entries(demoScenarios)) {
      await ConfigService.setSetting(
        `demo.scenarios.${scenarioKey}`,
        scenario,
        { persona: 'rachel' },
        new Date(),
        undefined,
        userId
      );
    }

    // 3. 8-Step Underwriting Workflow Configuration
    const workflowSteps = {
      'step_1_email_intake': {
        stepName: 'Email Intake',
        stepOrder: 1,
        agentType: 'Email Processing Agent',
        layer: 'Interface',
        description: 'Receive and categorize incoming broker emails with attachments',
        inputs: ['email_content', 'attachments', 'broker_info'],
        outputs: ['categorized_email', 'extracted_metadata', 'attachment_inventory'],
        processingTime: 30,
        successCriteria: ['email_categorized', 'attachments_indexed', 'metadata_extracted'],
        nextAction: 'step_2_document_processing'
      },
      'step_2_document_processing': {
        stepName: 'Document Processing',
        stepOrder: 2,
        agentType: 'Document Intelligence Agent',
        layer: 'System',
        description: 'Extract and validate submission data from ACORD forms and attachments',
        inputs: ['categorized_email', 'attachment_inventory', 'document_types'],
        outputs: ['extracted_data', 'validation_results', 'missing_documents'],
        processingTime: 120,
        successCriteria: ['data_extracted', 'format_validated', 'completeness_checked'],
        nextAction: 'step_3_data_enrichment'
      },
      'step_3_data_enrichment': {
        stepName: 'Data Enrichment',
        stepOrder: 3,
        agentType: 'Data Enhancement Agent',
        layer: 'System',
        description: 'Enrich submission data with external sources and historical information',
        inputs: ['extracted_data', 'property_address', 'insured_name'],
        outputs: ['enriched_data', 'risk_indicators', 'market_context'],
        processingTime: 90,
        successCriteria: ['data_enriched', 'risk_flags_identified', 'market_data_added'],
        nextAction: 'step_4_comparative_analytics'
      },
      'step_4_comparative_analytics': {
        stepName: 'Comparative Analytics',
        stepOrder: 4,
        agentType: 'Risk Analytics Agent',
        layer: 'Process',
        description: 'Compare submission against portfolio and market benchmarks',
        inputs: ['enriched_data', 'portfolio_data', 'market_benchmarks'],
        outputs: ['risk_score', 'comparative_analysis', 'outlier_flags'],
        processingTime: 60,
        successCriteria: ['risk_calculated', 'benchmarks_compared', 'outliers_identified'],
        nextAction: 'step_5_appetite_triage'
      },
      'step_5_appetite_triage': {
        stepName: 'Appetite Triage',
        stepOrder: 5,
        agentType: 'Appetite Assessment Agent',
        layer: 'Process',
        description: 'Assess submission against underwriting appetite and guidelines',
        inputs: ['risk_score', 'comparative_analysis', 'appetite_rules'],
        outputs: ['appetite_match', 'guideline_compliance', 'referral_triggers'],
        processingTime: 45,
        successCriteria: ['appetite_assessed', 'guidelines_checked', 'routing_determined'],
        nextAction: 'step_6_propensity_scoring'
      },
      'step_6_propensity_scoring': {
        stepName: 'Propensity Scoring',
        stepOrder: 6,
        agentType: 'Predictive Analytics Agent',
        layer: 'Process',
        description: 'Generate propensity scores for pricing and risk assessment',
        inputs: ['appetite_match', 'risk_indicators', 'historical_patterns'],
        outputs: ['propensity_scores', 'pricing_guidance', 'risk_predictions'],
        processingTime: 75,
        successCriteria: ['scores_generated', 'pricing_calculated', 'predictions_made'],
        nextAction: 'step_7_underwriting_copilot'
      },
      'step_7_underwriting_copilot': {
        stepName: 'Underwriting Copilot',
        stepOrder: 7,
        agentType: 'Decision Support Agent',
        layer: 'Role',
        description: 'Provide intelligent underwriting recommendations and decision support',
        inputs: ['propensity_scores', 'pricing_guidance', 'referral_triggers'],
        outputs: ['underwriting_recommendation', 'terms_conditions', 'decision_rationale'],
        processingTime: 120,
        successCriteria: ['recommendation_generated', 'terms_defined', 'rationale_documented'],
        nextAction: 'step_8_core_integration'
      },
      'step_8_core_integration': {
        stepName: 'Core Integration',
        stepOrder: 8,
        agentType: 'System Integration Agent',
        layer: 'Interface',
        description: 'Integrate decision into core systems and trigger next actions',
        inputs: ['underwriting_recommendation', 'terms_conditions', 'submission_data'],
        outputs: ['system_updates', 'workflow_triggers', 'notification_events'],
        processingTime: 60,
        successCriteria: ['systems_updated', 'workflows_triggered', 'notifications_sent'],
        nextAction: 'workflow_complete'
      }
    };

    // Store workflow steps in ConfigService
    for (const [stepKey, step] of Object.entries(workflowSteps)) {
      await ConfigService.setSetting(
        `demo.workflow.steps.${stepKey}`,
        step,
        { persona: 'rachel' },
        new Date(),
        undefined,
        userId
      );
    }

    // 4. Demo Trigger Mappings
    const demoTriggers = {
      'ctrl_shift_1': 'willis_apex_manufacturing',
      'ctrl_shift_2': 'marsh_retail_complex',
      'voice_demo_apex': 'willis_apex_manufacturing',
      'voice_demo_retail': 'marsh_retail_complex'
    };

    await ConfigService.setSetting(
      'demo.triggers.mappings',
      demoTriggers,
      { persona: 'rachel' },
      new Date(),
      undefined,
      userId
    );

    // 5. Demo Configuration Flags
    await ConfigService.setSetting(
      'demo.mode.enabled',
      true,
      { persona: 'rachel' },
      new Date(),
      undefined,
      userId
    );

    await ConfigService.setSetting(
      'demo.workflow.name',
      '8-step-agentic-underwriting',
      { persona: 'rachel' },
      new Date(),
      undefined,
      userId
    );

    // 6. Business Rules for 8-Step Workflow Execution
    const workflowBusinessRules = {
      'email_processing_rules': {
        ruleKey: 'demo.workflow.email-processing',
        ruleCategory: 'workflow_execution',
        conditions: {
          trigger: 'demo_email_received',
          hasAttachments: true,
          isFromBroker: true
        },
        actions: ['start_workflow', 'log_activity', 'notify_agents'],
        nextStep: 'step_2_document_processing',
        priority: 'high'
      },
      'document_extraction_rules': {
        ruleKey: 'demo.workflow.document-extraction',
        ruleCategory: 'workflow_execution',
        conditions: {
          trigger: 'email_categorized',
          hasACORDForms: true,
          documentTypes: ['ACORD_125', 'ACORD_140', 'SOV', 'Loss_Runs']
        },
        actions: ['extract_data', 'validate_forms', 'check_completeness'],
        nextStep: 'step_3_data_enrichment',
        priority: 'high'
      },
      'workflow_completion_rules': {
        ruleKey: 'demo.workflow.completion',
        ruleCategory: 'workflow_execution',
        conditions: {
          trigger: 'all_steps_completed',
          hasRecommendation: true,
          decisionMade: true
        },
        actions: ['update_systems', 'send_notifications', 'complete_workflow'],
        nextStep: 'workflow_complete',
        priority: 'high'
      }
    };

    // Store business rules in ConfigService
    for (const [ruleKey, rule] of Object.entries(workflowBusinessRules)) {
      await ConfigService.setSetting(
        `demo.workflow.rules.${ruleKey}`,
        rule,
        { persona: 'rachel' },
        new Date(),
        undefined,
        userId
      );
    }

    return {
      success: true,
      templatesSeeded: Object.keys(emailTemplates).length,
      scenariosSeeded: Object.keys(demoScenarios).length,
      workflowStepsSeeded: Object.keys(workflowSteps).length,
      businessRulesSeeded: Object.keys(workflowBusinessRules).length,
      triggersSeeded: Object.keys(demoTriggers).length,
      message: 'Demo configuration successfully seeded into ConfigService with 8-step workflow support'
    };

  } catch (error) {
    console.error('Demo seeding error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: 'Failed to seed demo configuration'
    };
  }
}

export async function getDemoScenario(scenarioKey: string) {
  try {
    const scenario = await ConfigService.getSetting(
      `demo.scenarios.${scenarioKey}`,
      { persona: 'rachel' }
    );
    
    if (!scenario) {
      return null;
    }

    // Get email template
    const template = await ConfigService.getSetting(
      scenario.email_template_key,
      { persona: 'rachel' }
    );

    return {
      scenario,
      template
    };
  } catch (error) {
    console.error('Error fetching demo scenario:', error);
    return null;
  }
}

export async function getAvailableDemoScenarios() {
  try {
    // Get all scenarios by trying known keys - could be made more dynamic with ConfigService key enumeration
    const knownScenarioKeys = ['willis_apex_manufacturing', 'marsh_retail_complex'];
    const availableScenarios = [];
    
    for (const key of knownScenarioKeys) {
      const scenario = await ConfigService.getSetting(`demo.scenarios.${key}`, { persona: 'rachel' });
      if (scenario) {
        availableScenarios.push(key);
      }
    }
    
    return availableScenarios;
  } catch (error) {
    console.error('Error fetching available demo scenarios:', error);
    return [];
  }
}

export async function getWorkflowSteps() {
  try {
    const stepKeys = [
      'step_1_email_intake',
      'step_2_document_processing', 
      'step_3_data_enrichment',
      'step_4_comparative_analytics',
      'step_5_appetite_triage',
      'step_6_propensity_scoring',
      'step_7_underwriting_copilot',
      'step_8_core_integration'
    ];

    const steps = [];
    for (const stepKey of stepKeys) {
      const step = await ConfigService.getSetting(
        `demo.workflow.steps.${stepKey}`,
        { persona: 'rachel' }
      );
      if (step) {
        steps.push({ key: stepKey, ...step });
      }
    }

    return steps.sort((a, b) => a.stepOrder - b.stepOrder);
  } catch (error) {
    console.error('Error fetching workflow steps:', error);
    return [];
  }
}
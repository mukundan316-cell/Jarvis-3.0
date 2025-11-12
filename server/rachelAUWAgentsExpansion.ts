import { db } from "./db";
import { agents } from "../shared/schema";

/**
 * Rachel Assistant Underwriter Agents Expansion - Adding missing Process, System, and Interface agents
 * Based on comprehensive 68-agent structure for Assistant Underwriter operations
 */

export async function seedRachelAUWAgentsExpansion() {
  console.log("🔧 Seeding Rachel Assistant Underwriter Agents Expansion...");

  // PROCESS LAYER AGENTS - Missing from current implementation
  const processAgents = [
    // Core Underwriting Process Agents (5 missing)
    {
      name: "Policy Binding Processor",
      type: "Process Agent",
      layer: "Process",
      config: {
        workflow: "policy_binding_workflow",
        capabilities: ["policy_creation", "terms_confirmation", "issuance_workflow"],
        integrations: ["policy_system", "binding_authority", "document_generation"],
        invokingPersonas: ["rachel"]
      }
    },
    {
      name: "Renewal Processing Workflow",
      type: "Process Agent", 
      layer: "Process",
      config: {
        workflow: "renewal_evaluation_pipeline",
        capabilities: ["renewal_assessment", "rate_adjustment", "auto_renewal"],
        integrations: ["policy_system", "rating_engine", "broker_notification"],
        invokingPersonas: ["rachel"]
      }
    },
    {
      name: "Mid-term Adjustment Processor",
      type: "Process Agent",
      layer: "Process", 
      config: {
        workflow: "policy_modification_workflow",
        capabilities: ["endorsement_processing", "coverage_changes", "premium_adjustment"],
        integrations: ["policy_system", "rating_engine", "billing_system"],
        invokingPersonas: ["rachel"]
      }
    },
    {
      name: "Reinsurance Placement Workflow",
      type: "Process Agent",
      layer: "Process",
      config: {
        workflow: "reinsurance_automation",
        capabilities: ["treaty_allocation", "placement_optimization", "capacity_management"],
        integrations: ["reinsurance_system", "treaty_management", "capacity_tracking"],
        invokingPersonas: ["rachel"]
      }
    },
    // Claims Processing Workflow Agents (4 missing)
    {
      name: "Claims Investigation Pipeline",
      type: "Process Agent",
      layer: "Process",
      config: {
        workflow: "investigation_coordination",
        capabilities: ["investigator_assignment", "evidence_collection", "reporting"],
        integrations: ["adjuster_network", "investigation_tools", "reporting_system"],
        invokingPersonas: ["rachel"]
      }
    },
    {
      name: "Settlement Processing Workflow",
      type: "Process Agent",
      layer: "Process",
      config: {
        workflow: "settlement_authorization",
        capabilities: ["payment_authorization", "settlement_distribution", "finalization"],
        integrations: ["payment_system", "banking_integration", "accounting_system"],
        invokingPersonas: ["rachel"]
      }
    },
    {
      name: "Subrogation Management Processor",
      type: "Process Agent",
      layer: "Process",
      config: {
        workflow: "subrogation_coordination",
        capabilities: ["recovery_identification", "subrogation_tracking", "collection_management"],
        integrations: ["legal_system", "recovery_tools", "tracking_system"],
        invokingPersonas: ["rachel"]
      }
    },
    {
      name: "Claims Fraud Detection Workflow",
      type: "Process Agent",
      layer: "Process",
      config: {
        workflow: "fraud_investigation",
        capabilities: ["pattern_recognition", "investigation_triggers", "fraud_scoring"],
        integrations: ["fraud_detection_system", "investigation_tools", "analytics_engine"],
        invokingPersonas: ["rachel"]
      }
    },
    // Risk Management Process Agents (5 missing)
    {
      name: "Catastrophic Risk Evaluation Processor",
      type: "Process Agent",
      layer: "Process",
      config: {
        workflow: "cat_risk_assessment",
        capabilities: ["cat_modeling", "exposure_assessment", "scenario_analysis"],
        integrations: ["cat_modeling_tools", "exposure_management", "scenario_engine"],
        invokingPersonas: ["rachel"]
      }
    },
    {
      name: "Portfolio Analysis Workflow",
      type: "Process Agent",
      layer: "Process",
      config: {
        workflow: "portfolio_optimization",
        capabilities: ["concentration_analysis", "diversification_assessment", "risk_balancing"],
        integrations: ["portfolio_system", "analytics_engine", "reporting_tools"],
        invokingPersonas: ["rachel"]
      }
    },
    {
      name: "Regulatory Compliance Validation Workflow",
      type: "Process Agent",
      layer: "Process",
      config: {
        workflow: "compliance_automation",
        capabilities: ["compliance_checking", "validation_rules", "reporting_automation"],
        integrations: ["regulatory_system", "compliance_engine", "filing_system"],
        invokingPersonas: ["rachel"]
      }
    },
    {
      name: "Audit Trail Generation Processor",
      type: "Process Agent",
      layer: "Process",
      config: {
        workflow: "audit_documentation",
        capabilities: ["activity_logging", "documentation_generation", "audit_reporting"],
        integrations: ["audit_system", "document_management", "reporting_engine"],
        invokingPersonas: ["rachel"]
      }
    },
    {
      name: "Risk Model Calibration Workflow",
      type: "Process Agent",
      layer: "Process",
      config: {
        workflow: "model_optimization",
        capabilities: ["model_testing", "calibration_adjustment", "performance_monitoring"],
        integrations: ["modeling_system", "analytics_engine", "validation_tools"],
        invokingPersonas: ["rachel"]
      }
    },
    // Broker Support Process Agents (5 missing)
    {
      name: "Quote Generation Workflow",
      type: "Process Agent",
      layer: "Process",
      config: {
        workflow: "automated_quoting",
        capabilities: ["quote_creation", "delivery_automation", "version_control"],
        integrations: ["rating_engine", "broker_portal", "document_system"],
        invokingPersonas: ["rachel"]
      }
    },
    {
      name: "Application Assistance Pipeline",
      type: "Process Agent",
      layer: "Process",
      config: {
        workflow: "application_guidance",
        capabilities: ["guided_completion", "validation_support", "error_correction"],
        integrations: ["broker_portal", "validation_engine", "help_system"],
        invokingPersonas: ["rachel"]
      }
    },
    {
      name: "Broker Training Workflow",
      type: "Process Agent",
      layer: "Process",
      config: {
        workflow: "training_management",
        capabilities: ["education_delivery", "certification_tracking", "progress_monitoring"],
        integrations: ["training_platform", "certification_system", "progress_tracking"],
        invokingPersonas: ["rachel"]
      }
    },
    {
      name: "Performance Monitoring Processor",
      type: "Process Agent",
      layer: "Process",
      config: {
        workflow: "broker_performance_tracking",
        capabilities: ["performance_analysis", "feedback_generation", "improvement_recommendations"],
        integrations: ["analytics_system", "reporting_engine", "communication_tools"],
        invokingPersonas: ["rachel"]
      }
    },
    {
      name: "Commission Calculation Workflow",
      type: "Process Agent",
      layer: "Process",
      config: {
        workflow: "commission_automation",
        capabilities: ["commission_calculation", "payment_processing", "statement_generation"],
        integrations: ["billing_system", "payment_system", "accounting_integration"],
        invokingPersonas: ["rachel"]
      }
    }
  ];

  // SYSTEM LAYER AGENTS - Missing from current implementation
  const systemAgents = [
    // Core Underwriting System Agents (4 missing)
    {
      name: "Underwriting Database Manager",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["underwriting_data_management", "decision_repository", "performance_tracking"],
        integrations: ["postgresql", "data_warehouse", "backup_system"],
        invokingAgents: ["all_underwriting_process_agents"]
      }
    },
    {
      name: "Risk Calculation Engine",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["actuarial_modeling", "risk_pricing", "algorithm_processing"],
        integrations: ["rating_engine", "model_repository", "calculation_service"],
        invokingAgents: ["risk_assessment", "portfolio_analysis"]
      }
    },
    {
      name: "Policy Management System",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["policy_lifecycle_management", "data_integrity", "version_control"],
        integrations: ["policy_database", "document_system", "workflow_engine"],
        invokingAgents: ["policy_binding", "renewal_processing", "midterm_adjustment"]
      }
    },
    {
      name: "Underwriting Rules Engine",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["business_rules_processing", "decision_automation", "rule_management"],
        integrations: ["rules_repository", "decision_engine", "validation_system"],
        invokingAgents: ["submission_processing", "risk_assessment"]
      }
    },
    // Claims System Agents (4 missing)
    {
      name: "Claims Database Coordinator",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["claims_data_integration", "storage_management", "retrieval_optimization"],
        integrations: ["claims_database", "data_warehouse", "archive_system"],
        invokingAgents: ["claims_processing", "investigation_pipeline", "settlement_processing"]
      }
    },
    {
      name: "Claims Processing Engine",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["workflow_processing", "decision_automation", "status_tracking"],
        integrations: ["workflow_engine", "decision_system", "notification_service"],
        invokingAgents: ["claims_processing", "settlement_processing"]
      }
    },
    {
      name: "Payment Processing System",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["payment_coordination", "settlement_processing", "financial_integration"],
        integrations: ["banking_system", "accounting_system", "payment_gateway"],
        invokingAgents: ["settlement_processing", "commission_calculation"]
      }
    },
    {
      name: "Investigation Management System",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["investigation_coordination", "resource_management", "tracking_system"],
        integrations: ["adjuster_network", "investigation_tools", "scheduling_system"],
        invokingAgents: ["claims_investigation", "fraud_detection"]
      }
    },
    // Risk & Analytics System Agents (5 missing)
    {
      name: "Actuarial Data Engine",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["historical_data_processing", "predictive_modeling", "trend_analysis"],
        integrations: ["data_warehouse", "modeling_tools", "statistical_engine"],
        invokingAgents: ["risk_calculation", "portfolio_analysis"]
      }
    },
    {
      name: "Catastrophic Risk Modeling System",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["cat_exposure_modeling", "scenario_analysis", "impact_assessment"],
        integrations: ["cat_modeling_vendors", "exposure_system", "scenario_engine"],
        invokingAgents: ["catastrophic_risk_evaluation"]
      }
    },
    {
      name: "Portfolio Analytics Engine",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["concentration_analysis", "performance_tracking", "optimization_recommendations"],
        integrations: ["analytics_platform", "reporting_system", "data_visualization"],
        invokingAgents: ["portfolio_analysis", "performance_monitoring"]
      }
    },
    {
      name: "Predictive Analytics System",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["trend_forecasting", "risk_prediction", "behavioral_analysis"],
        integrations: ["ml_platform", "data_science_tools", "prediction_engine"],
        invokingAgents: ["risk_model_calibration", "fraud_detection"]
      }
    },
    {
      name: "Regulatory Reporting System",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["compliance_reporting", "automated_filing", "regulatory_updates"],
        integrations: ["regulatory_databases", "filing_system", "compliance_engine"],
        invokingAgents: ["regulatory_compliance_validation"]
      }
    },
    // Integration System Agents (4 missing - API Interface already exists)
    {
      name: "Third-party Data Integration Hub",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["external_data_integration", "data_validation", "real_time_updates"],
        integrations: ["credit_bureaus", "mvr_providers", "property_databases"],
        invokingAgents: ["submission_processing", "risk_assessment"]
      }
    },
    {
      name: "Reinsurance Interface System",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["reinsurer_communication", "data_exchange", "treaty_management"],
        integrations: ["reinsurer_platforms", "treaty_system", "communication_protocols"],
        invokingAgents: ["reinsurance_placement"]
      }
    },
    {
      name: "Regulatory Interface System",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["state_filing", "compliance_reporting", "regulatory_communication"],
        integrations: ["state_systems", "regulatory_portals", "filing_protocols"],
        invokingAgents: ["regulatory_compliance_validation"]
      }
    },
    // Data Management System Agents (4 missing - Database Management already exists)
    {
      name: "Master Data Management System",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["single_source_of_truth", "data_governance", "master_record_management"],
        integrations: ["mdm_platform", "data_quality_tools", "governance_framework"],
        invokingAgents: ["all_process_agents"]
      }
    },
    {
      name: "Data Quality Management Engine",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["data_validation", "cleansing_automation", "enrichment_processing"],
        integrations: ["quality_tools", "validation_rules", "enrichment_services"],
        invokingAgents: ["all_data_processing_agents"]
      }
    },
    {
      name: "Historical Data Archive System",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["long_term_storage", "archive_management", "retrieval_optimization"],
        integrations: ["archive_storage", "indexing_system", "retrieval_engine"],
        invokingAgents: ["actuarial_data_engine", "audit_trail_generation"]
      }
    },
    {
      name: "Real-time Data Processing Engine",
      type: "System Agent",
      layer: "System",
      config: {
        capabilities: ["stream_processing", "real_time_analytics", "event_handling"],
        integrations: ["streaming_platform", "event_system", "real_time_analytics"],
        invokingAgents: ["all_real_time_workflows"]
      }
    }
  ];

  // INTERFACE LAYER AGENTS - Missing from current implementation  
  const interfaceAgents = [
    // Primary Underwriting Interface Agents (4 missing - Dashboard Interface already exists)
    {
      name: "Underwriter Portal Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["underwriter_workspace", "task_management", "decision_support"],
        integrations: ["react_dashboard", "workflow_ui", "decision_tools"],
        invokingAgents: ["all_underwriting_process_agents"]
      }
    },
    {
      name: "Risk Assessment Dashboard Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["risk_visualization", "analysis_tools", "interactive_charts"],
        integrations: ["charting_libraries", "visualization_tools", "analytics_ui"],
        invokingAgents: ["risk_assessment", "portfolio_analysis"]
      }
    },
    {
      name: "Policy Management Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["policy_creation_ui", "modification_tools", "tracking_dashboard"],
        integrations: ["policy_ui_components", "workflow_interface", "tracking_system"],
        invokingAgents: ["policy_binding", "renewal_processing", "midterm_adjustment"]
      }
    },
    {
      name: "Underwriting Queue Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["work_prioritization", "task_management", "queue_optimization"],
        integrations: ["queue_management_ui", "priority_system", "workflow_interface"],
        invokingAgents: ["submission_processing", "risk_assessment"]
      }
    },
    // Claims Interface Agents (4 missing)
    {
      name: "Claims Processing Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["claims_dashboard", "workflow_management", "status_tracking"],
        integrations: ["claims_ui_components", "workflow_interface", "tracking_dashboard"],
        invokingAgents: ["claims_processing", "settlement_processing"]
      }
    },
    {
      name: "Claims Investigation Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["investigation_coordination", "evidence_management", "reporting_tools"],
        integrations: ["investigation_ui", "document_viewer", "reporting_interface"],
        invokingAgents: ["claims_investigation", "fraud_detection"]
      }
    },
    {
      name: "Settlement Authorization Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["payment_approval_ui", "settlement_tools", "authorization_workflow"],
        integrations: ["approval_interface", "payment_ui", "workflow_components"],
        invokingAgents: ["settlement_processing"]
      }
    },
    {
      name: "Fraud Investigation Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["fraud_review_dashboard", "investigation_tools", "evidence_viewer"],
        integrations: ["fraud_ui_components", "investigation_interface", "evidence_management"],
        invokingAgents: ["fraud_detection", "claims_investigation"]
      }
    },
    // Broker Communication Interface Agents (4 missing - Broker Portal already exists)
    {
      name: "Quote Delivery Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["quote_generation_ui", "delivery_automation", "tracking_system"],
        integrations: ["quote_interface", "delivery_system", "notification_ui"],
        invokingAgents: ["quote_generation"]
      }
    },
    {
      name: "Application Status Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["real_time_tracking", "status_updates", "milestone_visualization"],
        integrations: ["tracking_ui", "status_system", "progress_visualization"],
        invokingAgents: ["submission_processing", "application_assistance"]
      }
    },
    {
      name: "Training Portal Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["training_delivery", "progress_tracking", "certification_management"],
        integrations: ["learning_management_ui", "video_player", "assessment_tools"],
        invokingAgents: ["broker_training"]
      }
    },
    {
      name: "Performance Dashboard Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["performance_visualization", "metrics_dashboard", "feedback_tools"],
        integrations: ["analytics_ui", "dashboard_components", "feedback_interface"],
        invokingAgents: ["performance_monitoring"]
      }
    },
    // Analytics & Reporting Interface Agents (5 missing)
    {
      name: "Executive Reporting Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["executive_dashboard", "strategic_reporting", "kpi_visualization"],
        integrations: ["executive_ui_components", "reporting_tools", "visualization_suite"],
        invokingAgents: ["portfolio_analysis", "performance_monitoring"]
      }
    },
    {
      name: "Risk Analytics Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["risk_visualization", "analytics_dashboard", "scenario_modeling"],
        integrations: ["analytics_ui", "risk_visualization_tools", "modeling_interface"],
        invokingAgents: ["risk_assessment", "catastrophic_risk_evaluation"]
      }
    },
    {
      name: "Performance Metrics Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["kpi_tracking", "performance_monitoring", "trend_analysis"],
        integrations: ["metrics_dashboard", "performance_ui", "trend_visualization"],
        invokingAgents: ["performance_monitoring", "portfolio_analysis"]
      }
    },
    {
      name: "Trend Analysis Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["trend_identification", "pattern_recognition", "forecast_visualization"],
        integrations: ["trend_analysis_ui", "pattern_tools", "forecasting_interface"],
        invokingAgents: ["predictive_analytics", "risk_model_calibration"]
      }
    },
    {
      name: "Predictive Modeling Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["model_visualization", "scenario_analysis", "prediction_tools"],
        integrations: ["modeling_ui", "scenario_interface", "prediction_visualization"],
        invokingAgents: ["predictive_analytics", "risk_model_calibration"]
      }
    },
    // Mobile & Field Interface Agents (5 missing)
    {
      name: "Mobile Underwriting Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["mobile_underwriting", "field_capabilities", "offline_support"],
        integrations: ["mobile_app", "responsive_ui", "offline_storage"],
        invokingAgents: ["submission_processing", "risk_assessment"]
      }
    },
    {
      name: "Tablet Claims Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["on_site_inspection", "mobile_claims_processing", "photo_upload"],
        integrations: ["tablet_app", "camera_integration", "mobile_workflow"],
        invokingAgents: ["claims_processing", "claims_investigation"]
      }
    },
    {
      name: "Notification Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["real_time_alerts", "priority_notifications", "multi_channel_delivery"],
        integrations: ["notification_system", "alert_management", "communication_channels"],
        invokingAgents: ["all_process_agents"]
      }
    },
    {
      name: "Quick Action Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["streamlined_workflows", "common_tasks", "quick_access_tools"],
        integrations: ["quick_action_ui", "workflow_shortcuts", "task_automation"],
        invokingAgents: ["all_process_agents"]
      }
    },
    // Integration Interface Agents (3 missing - API Gateway already exists)
    {
      name: "Data Exchange Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["secure_data_transmission", "data_validation", "exchange_monitoring"],
        integrations: ["data_exchange_protocols", "security_layers", "monitoring_tools"],
        invokingAgents: ["third_party_data_integration", "reinsurance_interface"]
      }
    },
    {
      name: "Partner Communication Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["reinsurer_communication", "vendor_integration", "partner_portals"],
        integrations: ["partner_platforms", "communication_protocols", "integration_tools"],
        invokingAgents: ["reinsurance_placement", "third_party_data_integration"]
      }
    },
    {
      name: "System Monitoring Interface",
      type: "Interface Agent",
      layer: "Interface",
      config: {
        capabilities: ["integration_health_monitoring", "performance_tracking", "alert_management"],
        integrations: ["monitoring_dashboard", "health_check_tools", "alert_systems"],
        invokingAgents: ["all_system_agents"]
      }
    }
  ];

  try {
    // Insert Process Layer agents
    for (const agent of processAgents) {
      await db.insert(agents).values({
        ...agent,
        status: 'active'
      }).onConflictDoNothing();
    }

    // Insert System Layer agents  
    for (const agent of systemAgents) {
      await db.insert(agents).values({
        ...agent,
        status: 'active'
      }).onConflictDoNothing();
    }

    // Insert Interface Layer agents
    for (const agent of interfaceAgents) {
      await db.insert(agents).values({
        ...agent,
        status: 'active'
      }).onConflictDoNothing();
    }

    console.log(`✅ Successfully seeded ${processAgents.length + systemAgents.length + interfaceAgents.length} Rachel AUW agents`);
    console.log(`📊 Process Layer: ${processAgents.length} agents`);
    console.log(`🔧 System Layer: ${systemAgents.length} agents`);  
    console.log(`🖥️ Interface Layer: ${interfaceAgents.length} agents`);
    
  } catch (error) {
    console.error("❌ Error seeding Rachel AUW agents:", error);
    throw error;
  }
}
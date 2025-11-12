/**
 * Business Function Mappings Configuration Seeding
 * 
 * Seeds clean, user-friendly business function labels for dropdown display
 * Fixes messy text issue in Agent Directory business function dropdown
 */

import { ConfigService } from './configService';

/**
 * Comprehensive business function mappings with clean, readable labels
 */
const businessFunctionMappings = {
  // Core Business Functions
  "sales": {
    "label": "Sales & Revenue"
  },
  "marketing": {
    "label": "Marketing & Growth"
  },
  "customer-service": {
    "label": "Customer Service"
  },
  "support": {
    "label": "Technical Support"
  },
  "hr": {
    "label": "Human Resources"
  },
  "finance": {
    "label": "Finance & Accounting"
  },
  "operations": {
    "label": "Operations Management"
  },
  "it": {
    "label": "Information Technology"
  },
  
  // Insurance-Specific Functions  
  "underwriting": {
    "label": "Underwriting & Risk Assessment"
  },
  "claims": {
    "label": "Claims Processing"
  },
  "policy-management": {
    "label": "Policy Management"
  },
  "actuarial": {
    "label": "Actuarial Analysis"
  },
  "risk-management": {
    "label": "Risk Management"
  },
  "compliance": {
    "label": "Regulatory Compliance"
  },
  "fraud-detection": {
    "label": "Fraud Detection & Prevention"
  },
  "reinsurance": {
    "label": "Reinsurance Management"
  },
  
  // Advanced Functions
  "data-analytics": {
    "label": "Data Analytics & Insights"
  },
  "ai-governance": {
    "label": "AI Governance & Ethics"
  },
  "security": {
    "label": "Security & Monitoring"
  },
  "integration": {
    "label": "System Integration"
  },
  "workflow-automation": {
    "label": "Workflow Automation"
  },
  "document-processing": {
    "label": "Document Processing"
  },
  "audit": {
    "label": "Audit & Quality Assurance"
  },
  "training": {
    "label": "Training & Development"
  },
  
  // Cross-Functional
  "collaboration": {
    "label": "Cross-Team Collaboration"
  },
  "reporting": {
    "label": "Business Intelligence & Reporting"
  },
  "communication": {
    "label": "Internal Communication"
  },
  "project-management": {
    "label": "Project Management"
  }
};

/**
 * Seeds business function mappings into ConfigService
 * Ensures clean, readable labels appear in dropdowns
 */
export async function seedBusinessFunctionMappings(): Promise<void> {
  try {
    console.log('🏢 Seeding business function mappings...');
    
    // Set the business function mappings configuration
    await ConfigService.setSetting(
      'business-functions.mappings',
      businessFunctionMappings,
      {}, // Global scope
      new Date(),
      undefined,
      'system'
    );
    
    console.log('✅ Business function mappings seeded successfully');
    console.log(`📊 Configured ${Object.keys(businessFunctionMappings).length} business function labels`);
    
  } catch (error) {
    console.error('❌ Failed to seed business function mappings:', error);
    throw error;
  }
}

export default seedBusinessFunctionMappings;
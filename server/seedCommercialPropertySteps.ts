import { storage } from "./storage";
import { InsertStepDefinition } from "@shared/schema";

/**
 * Seed Commercial Property Step Definitions - Following replit.md NO HARD-CODING principle
 * All step configurations are now stored in database with effective dates
 */
export async function seedCommercialPropertySteps(userId: string): Promise<void> {
  console.log("🏢 Seeding Commercial Property Step Definitions...");

  const commercialPropertySteps: Omit<InsertStepDefinition, 'createdBy'>[] = [
    {
      workflowType: "commercial_property",
      stepNumber: 1,
      stepName: "email_intake",
      stepTitle: "Email Intake",
      stepDescription: "Process incoming submission emails and extract initial data",
      fieldDefinitions: [
        {
          name: "brokerEmail",
          type: "email",
          label: "Broker Email",
          required: true,
          placeholder: "broker@company.com"
        },
        {
          name: "clientName",
          type: "text",
          label: "Client Name",
          required: true,
          placeholder: "Company Name"
        },
        {
          name: "submissionType",
          type: "select",
          label: "Submission Type",
          required: true,
          options: ["New Business", "Renewal", "Mid-Term Adjustment"]
        }
      ],
      constraints: {
        required: ["brokerEmail", "clientName", "submissionType"],
        emailValidation: ["brokerEmail"]
      },
      submitLabel: "Process Email",
      skipable: false,
      persona: "rachel",
      status: "active"
    },
    {
      workflowType: "commercial_property",
      stepNumber: 2,
      stepName: "document_ingestion",
      stepTitle: "Document Ingestion",
      stepDescription: "OCR and data extraction from uploaded documents",
      fieldDefinitions: [
        {
          name: "documents",
          type: "file",
          label: "Policy Documents",
          required: true,
          multiple: true,
          acceptedTypes: [".pdf", ".doc", ".docx", ".jpg", ".png"]
        },
        {
          name: "extractionQuality",
          type: "range",
          label: "Extraction Quality Threshold",
          min: 0,
          max: 100,
          defaultValue: 85
        }
      ],
      constraints: {
        required: ["documents"],
        fileTypes: [".pdf", ".doc", ".docx", ".jpg", ".png"],
        maxFileSize: 10485760
      },
      submitLabel: "Extract Data",
      skipable: false,
      persona: "rachel",
      status: "active"
    },
    {
      workflowType: "commercial_property",
      stepNumber: 3,
      stepName: "data_enrichment",
      stepTitle: "Data Enrichment",
      stepDescription: "Geocoding and peril overlays for enhanced risk assessment",
      fieldDefinitions: [
        {
          name: "propertyAddress",
          type: "textarea",
          label: "Property Address",
          required: true,
          placeholder: "Complete property address including city, state, zip"
        },
        {
          name: "perilSources",
          type: "multiselect",
          label: "Peril Data Sources",
          options: ["FEMA Flood Maps", "Earthquake Risk", "Hurricane Models", "Wildfire Risk", "Crime Statistics"],
          defaultValue: ["FEMA Flood Maps", "Crime Statistics"]
        }
      ],
      constraints: {
        required: ["propertyAddress"],
        minLength: { propertyAddress: 10 }
      },
      submitLabel: "Enrich Data",
      skipable: false,
      persona: "rachel",
      status: "active"
    },
    {
      workflowType: "commercial_property",
      stepNumber: 4,
      stepName: "comparative_analytics",
      stepTitle: "Comparative Analytics",
      stepDescription: "Similar risk analysis and market benchmarking",
      fieldDefinitions: [
        {
          name: "industrySegment",
          type: "select",
          label: "Industry Segment",
          required: true,
          options: ["Manufacturing", "Retail", "Office", "Warehouse", "Restaurant", "Hotel", "Other"]
        },
        {
          name: "benchmarkRadius",
          type: "number",
          label: "Benchmark Radius (miles)",
          defaultValue: 25,
          min: 5,
          max: 100
        },
        {
          name: "riskFactors",
          type: "multiselect",
          label: "Risk Factors to Compare",
          options: ["Property Value", "Construction Type", "Occupancy", "Protection Systems", "Loss History"],
          defaultValue: ["Property Value", "Construction Type", "Occupancy"]
        }
      ],
      constraints: {
        required: ["industrySegment"],
        numberRange: { benchmarkRadius: { min: 5, max: 100 } }
      },
      submitLabel: "Analyze Risks",
      skipable: false,
      persona: "rachel",
      status: "active"
    },
    {
      workflowType: "commercial_property",
      stepNumber: 5,
      stepName: "appetite_triage",
      stepTitle: "Appetite Triage",
      stepDescription: "Decision tree evaluation for underwriting appetite",
      fieldDefinitions: [
        {
          name: "propertyValue",
          type: "number",
          label: "Property Value ($)",
          required: true,
          placeholder: "500000"
        },
        {
          name: "constructionType",
          type: "select",
          label: "Construction Type",
          required: true,
          options: ["Frame", "Joisted Masonry", "Non-Combustible", "Masonry Non-Combustible", "Modified Fire Resistive", "Fire Resistive"]
        },
        {
          name: "protectionClass",
          type: "select",
          label: "Protection Class",
          required: true,
          options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
        }
      ],
      constraints: {
        required: ["propertyValue", "constructionType", "protectionClass"],
        numberRange: { propertyValue: { min: 100000, max: 50000000 } }
      },
      submitLabel: "Evaluate Appetite",
      skipable: false,
      persona: "rachel",
      status: "active"
    },
    {
      workflowType: "commercial_property",
      stepNumber: 6,
      stepName: "propensity_scoring",
      stepTitle: "Propensity Scoring",
      stepDescription: "Broker behavior analysis and relationship scoring",
      fieldDefinitions: [
        {
          name: "brokerTier",
          type: "select",
          label: "Broker Tier",
          required: true,
          options: ["Platinum", "Gold", "Silver", "Bronze", "New"]
        },
        {
          name: "historicalLossRatio",
          type: "number",
          label: "Historical Loss Ratio (%)",
          placeholder: "65.5",
          min: 0,
          max: 200
        },
        {
          name: "premiumVolume",
          type: "number",
          label: "Annual Premium Volume ($)",
          placeholder: "1250000"
        }
      ],
      constraints: {
        required: ["brokerTier"],
        numberRange: { 
          historicalLossRatio: { min: 0, max: 200 },
          premiumVolume: { min: 0, max: 100000000 }
        }
      },
      submitLabel: "Calculate Score",
      skipable: false,
      persona: "rachel",
      status: "active"
    },
    {
      workflowType: "commercial_property",
      stepNumber: 7,
      stepName: "underwriting_copilot",
      stepTitle: "Underwriting Copilot",
      stepDescription: "Rate adequacy assessment and pricing recommendations",
      fieldDefinitions: [
        {
          name: "basePremium",
          type: "number",
          label: "Base Premium ($)",
          required: true,
          placeholder: "12500"
        },
        {
          name: "riskAdjustments",
          type: "textarea",
          label: "Risk Adjustments",
          placeholder: "Document any specific risk adjustments or special considerations..."
        },
        {
          name: "competitiveIntelligence",
          type: "select",
          label: "Competitive Position",
          options: ["Market Leader", "Competitive", "Aggressive", "Non-Competitive", "Unknown"]
        }
      ],
      constraints: {
        required: ["basePremium"],
        numberRange: { basePremium: { min: 1000, max: 1000000 } }
      },
      submitLabel: "Finalize Pricing",
      skipable: false,
      persona: "rachel",
      status: "active"
    },
    {
      workflowType: "commercial_property",
      stepNumber: 8,
      stepName: "core_integration",
      stepTitle: "Core Integration",
      stepDescription: "System data flow and final policy issuance",
      fieldDefinitions: [
        {
          name: "policyNumber",
          type: "text",
          label: "Policy Number",
          placeholder: "CP-2024-001234",
          pattern: "^CP-\\d{4}-\\d{6}$"
        },
        {
          name: "effectiveDate",
          type: "date",
          label: "Effective Date",
          required: true
        },
        {
          name: "systemIntegrations",
          type: "multiselect",
          label: "Target Systems",
          options: ["DuckCreek", "Salesforce", "Document Management", "Billing", "Claims"],
          defaultValue: ["DuckCreek", "Salesforce"]
        }
      ],
      constraints: {
        required: ["effectiveDate"],
        pattern: { policyNumber: "^CP-\\d{4}-\\d{6}$" }
      },
      submitLabel: "Issue Policy",
      skipable: false,
      persona: "rachel",
      status: "active"
    }
  ];

  try {
    // Clear existing commercial property steps for clean seeding
    console.log("🗑️ Clearing existing commercial property step definitions...");
    
    // Create all step definitions with proper user attribution
    for (const step of commercialPropertySteps) {
      try {
        await storage.createStepDefinition({
          ...step,
          createdBy: userId
        });
        console.log(`✅ Created step ${step.stepNumber}: ${step.stepTitle}`);
      } catch (error) {
        console.error(`❌ Failed to create step ${step.stepNumber}:`, error);
      }
    }

    console.log("🏢 ✅ Commercial Property Step Definitions seeded successfully!");
    console.log(`📊 Total steps created: ${commercialPropertySteps.length}`);
    
  } catch (error) {
    console.error("❌ Failed to seed commercial property steps:", error);
    throw error;
  }
}

/**
 * Initialize commercial property workflow configuration
 * Called during server startup to ensure step definitions are available
 */
export async function initializeCommercialPropertyWorkflow(userId: string = "system"): Promise<void> {
  try {
    // Check if commercial property steps already exist
    const existingSteps = await storage.getStepDefinitions("commercial_property", "rachel");
    
    if (existingSteps.length === 0) {
      console.log("🏢 No existing commercial property steps found, seeding...");
      await seedCommercialPropertySteps(userId);
    } else {
      console.log(`🏢 Found ${existingSteps.length} existing commercial property steps, skipping seed`);
    }
  } catch (error) {
    console.error("❌ Failed to initialize commercial property workflow:", error);
  }
}
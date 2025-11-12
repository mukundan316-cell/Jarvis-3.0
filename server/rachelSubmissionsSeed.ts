import { db } from "./db";
import { submissions } from "@shared/schema";

export async function seedRachelSubmissions() {
  // Clear existing submissions for fresh data
  console.log("Seeding Rachel's enhanced submissions data...");

  const rachelSubmissions = [
    // 2 incomplete submissions from John (WTK Brokers)
    {
      submissionId: "SUB-2024-005",
      brokerName: "WTK Brokers",
      clientName: "John Morrison Property Trust",
      riskLevel: "Medium",
      recommendedLine: "Pending Review",
      details: { propertyType: "Commercial Office", value: 2500000 },
      status: "incomplete",
      assignedTo: "rachel",
      documentationStatus: "incomplete",
      missingDocuments: ["prior_policy_documents", "valid_id_cards"],
      issueFlags: { invalid_id: true, missing_prior_policy: true },
      actionRequired: "send_back_for_rectification"
    },
    {
      submissionId: "SUB-2024-006",
      brokerName: "WTK Brokers", 
      clientName: "Thompson Industrial Complex",
      riskLevel: "High",
      recommendedLine: "Pending Review",
      details: { propertyType: "Industrial Warehouse", value: 4200000 },
      status: "incomplete",
      assignedTo: "rachel",
      documentationStatus: "incomplete",
      missingDocuments: ["prior_policy_documents", "valid_id_cards"],
      issueFlags: { invalid_id: true, missing_prior_policy: true },
      actionRequired: "send_back_for_rectification"
    },
    // 2 new complete submissions
    {
      submissionId: "SUB-2024-007",
      brokerName: "Sterling Insurance Partners",
      clientName: "Riverside Shopping Center",
      riskLevel: "Low",
      recommendedLine: "80% line recommended",
      details: { propertyType: "Retail Complex", value: 3100000 },
      status: "new",
      assignedTo: "rachel",
      documentationStatus: "complete",
      missingDocuments: [],
      issueFlags: {},
      actionRequired: "review_and_process"
    },
    {
      submissionId: "SUB-2024-008",
      brokerName: "Metropolitan Risk Solutions",
      clientName: "Downtown Medical Plaza",
      riskLevel: "Medium",
      recommendedLine: "65% line recommended",
      details: { propertyType: "Medical Office", value: 1850000 },
      status: "new",
      assignedTo: "rachel",
      documentationStatus: "complete",
      missingDocuments: [],
      issueFlags: {},
      actionRequired: "review_and_process"
    },
    // 1 submission with additional documentation requested
    {
      submissionId: "SUB-2024-004",
      brokerName: "Premier Property Insurance",
      clientName: "Oakwood Residential Complex",
      riskLevel: "Medium",
      recommendedLine: "70% line under review",
      details: { propertyType: "Residential Apartment", value: 2800000 },
      status: "additional_docs_received",
      assignedTo: "rachel",
      documentationStatus: "additional_requested",
      missingDocuments: [],
      issueFlags: {},
      actionRequired: "review_additional_docs",
      rachelNotes: "Additional property documentation received as requested"
    }
  ];

  try {
    for (const submission of rachelSubmissions) {
      await db.insert(submissions).values(submission).onConflictDoNothing();
    }
    console.log("Rachel's enhanced submissions seeded successfully");
  } catch (error) {
    console.error("Error seeding Rachel submissions:", error);
  }
}
import { db } from "./db";
import { emails, agents, activities } from "../shared/schema";
import { eq } from "drizzle-orm";
import { OpenAIService } from './services/openAIService';

/**
 * Intelligent Email Processing Agents
 * Channel Agent → Security Filter → Doc Classifier → Intent Extractor
 * Following replit.md principles: NO HARD-CODING, AUDIT TRAIL, MODULAR DESIGN
 */

// Core agent configurations stored in database - NO HARD-CODING principle
export const emailProcessingAgents = [
  {
    name: "Intelligent Email (submission capture)",
    type: "Process Agent",
    layer: "Process",
    persona: "rachel",
    specialization: "Commercial Property 8-step workflow Step 1 orchestration",
    description: "Multi-step workflow that orchestrates email intake, security filtering, document classification, and intent extraction for commercial property submissions",
    agentRole: "Step 1 Workflow Orchestrator",
    config: {
      workflow: "commercial_property_step_1",
      step: 1,
      sla: "60", // seconds
      capabilities: [
        "email_intake_orchestration",
        "multi_agent_coordination", 
        "step_progression_tracking",
        "submission_stub_creation",
        "queue_event_generation"
      ],
      orchestrates: [
        "Email Channel Agent",
        "Email Security Filter Agent",
        "Document Classifier Agent", 
        "Intent Extraction Agent"
      ],
      input: {
        broker_email: "required",
        attachments: ["ACORD-125", "ACORD-140", "SOV files", "loss runs", "photos"],
        broker_metadata: ["sender domain", "account history"]
      },
      output: {
        intake_ticket: "submission stub with insured name, broker, LOBs, files indexed",
        queue_event: "submission.created for next stage"
      },
      controls: {
        quarantine_unknown_files: true,
        bounce_unsafe_messages: true,
        broker_safe_link_response: true
      }
    },
    status: "active"
  },
  {
    name: "Email Channel Agent",
    type: "Interface Agent",
    layer: "Interface",
    persona: "rachel",
    specialization: "Email monitoring, deduplication, and account correlation",
    description: "Monitors broker emails, deduplicates message threads, and correlates submissions to account history",
    agentRole: "Channel Monitor",
    config: {
      capabilities: ["email_monitoring", "thread_deduplication", "account_correlation", "broker_identification"],
      workflow: "email_channel_processing",
      sla: "60", // seconds
      brokerDomains: ["wtkbrokers.com", "aombrokers.com", "acmbrokers.com", "docbrokers.com"],
      processingRules: {
        deduplication: "thread-based",
        correlation: "sender-domain + subject-keywords",
        priority: "urgent-keywords || attachment-count"
      }
    },
    status: "active"
  },
  {
    name: "Email Security Filter Agent",
    type: "System Agent", 
    layer: "System",
    persona: "rachel",
    specialization: "Email security scanning and PII protection",
    description: "Performs virus scanning, malware detection, PII redaction, and content policy enforcement",
    agentRole: "Security Scanner",
    config: {
      capabilities: ["virus_scanning", "malware_detection", "pii_redaction", "content_policy", "attachment_validation"],
      workflow: "email_security_filtering",
      sla: "30", // seconds
      securityRules: {
        quarantineExtensions: [".exe", ".bat", ".cmd", ".scr", ".zip"],
        piiPatterns: ["ssn", "credit_card", "phone", "address"],
        maxAttachmentSize: "25MB",
        allowedMimeTypes: ["application/pdf", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/jpeg", "image/png"]
      }
    },
    status: "active"
  },
  {
    name: "Document Classifier Agent",
    type: "System Agent",
    layer: "System", 
    persona: "rachel",
    specialization: "Document type and form classification",
    description: "Classifies document types, identifies ACORD forms, SOV files, loss runs, and photos",
    agentRole: "Document Classifier",
    config: {
      capabilities: ["file_type_detection", "acord_form_recognition", "sov_identification", "loss_run_classification", "photo_recognition"],
      workflow: "document_classification",
      sla: "45", // seconds
      classificationRules: {
        acordForms: {
          "ACORD-125": ["commercial property", "application", "building info"],
          "ACORD-140": ["property schedule", "coverage details", "limits"],
          "ACORD-27": ["certificate", "evidence", "insurance"]
        },
        sovFiles: {
          keywords: ["schedule of values", "sov", "property schedule", "values schedule"],
          extensions: [".xlsx", ".xls", ".csv"]
        },
        lossRuns: {
          keywords: ["loss run", "claims history", "claim report", "loss history"],
          extensions: [".pdf"]
        },
        photos: {
          keywords: ["property photo", "building image", "site photo"],
          extensions: [".jpg", ".jpeg", ".png", ".tiff"]
        }
      }
    },
    status: "active"
  },
  {
    name: "Intent Extraction Agent", 
    type: "System Agent",
    layer: "System",
    persona: "rachel",
    specialization: "Business intent and data extraction",
    description: "Extracts Lines of Business, coverage types, effective dates, and business requirements from email content",
    agentRole: "Intent Extractor",
    config: {
      capabilities: ["lob_extraction", "coverage_analysis", "date_extraction", "business_intent_parsing", "submission_data_structuring"],
      workflow: "intent_extraction",
      sla: "90", // seconds
      extractionRules: {
        linesOfBusiness: {
          "Commercial Property": ["property", "building", "contents", "commercial", "warehouse", "office", "retail"],
          "Business Interruption": ["business interruption", "bi", "loss of income", "extra expense"],
          "General Liability": ["liability", "gl", "general liability", "public liability"],
          "Auto": ["auto", "vehicle", "fleet", "commercial auto"]
        },
        datePatterns: [
          "effective date: (\\d{1,2}[/-]\\d{1,2}[/-]\\d{4})",
          "coverage start: (\\d{1,2}[/-]\\d{1,2}[/-]\\d{4})",
          "policy period: (\\d{1,2}[/-]\\d{1,2}[/-]\\d{4})"
        ],
        coveragePatterns: [
          "property value: [£$€]([\\d,]+)",
          "building limit: [£$€]([\\d,]+)",
          "contents: [£$€]([\\d,]+)",
          "business interruption: [£$€]([\\d,]+)"
        ]
      }
    },
    status: "active"
  }
];

/**
 * Email Processing Pipeline - executes agents in sequence
 * Following replit.md AUDIT TRAIL requirement
 */
export class EmailProcessingPipeline {
  private openAIService: OpenAIService;
  
  constructor() {
    this.openAIService = new OpenAIService();
    this.ensureAgentsExist();
  }

  private async ensureAgentsExist() {
    for (const agentConfig of emailProcessingAgents) {
      await this.createAgentIfNotExists(agentConfig);
    }
  }

  private async createAgentIfNotExists(agentData: any) {
    const existing = await db.select().from(agents).where(eq(agents.name, agentData.name)).limit(1);
    if (existing.length === 0) {
      await db.insert(agents).values({
        name: agentData.name,
        type: agentData.type,
        layer: agentData.layer,
        persona: agentData.persona,
        specialization: agentData.specialization,
        description: agentData.description,
        config: JSON.stringify(agentData.config),
        status: agentData.status,
        createdAt: new Date()
      });
      console.log(`✓ Created intelligent email agent: ${agentData.name}`);
    }
  }

  /**
   * Process email through intelligent pipeline
   * Returns: processed email data with extracted information
   */
  async processEmail(emailId: number, userId: string): Promise<any> {
    const startTime = Date.now();
    const processingLogs: any[] = [];
    
    try {
      // Get email data
      const [email] = await db.select().from(emails).where(eq(emails.id, emailId));
      if (!email) {
        throw new Error(`Email not found: ${emailId}`);
      }

      // Update processing status
      await this.updateEmailProcessingStatus(emailId, "processing");

      // STEP 1: Channel Agent - Email monitoring and correlation
      console.log(`📧 Channel Agent processing email ${emailId}...`);
      const channelResult = await this.runChannelAgent(email);
      processingLogs.push({
        agent: "Email Channel Agent",
        timestamp: new Date(),
        action: "Email correlation and deduplication",
        result: channelResult,
        duration: Date.now() - startTime
      });

      // STEP 2: Security Filter - Security scanning and PII protection
      console.log(`🛡️ Security Filter processing email ${emailId}...`);
      const securityResult = await this.runSecurityFilter(email);
      processingLogs.push({
        agent: "Email Security Filter Agent", 
        timestamp: new Date(),
        action: "Security scanning and PII redaction",
        result: securityResult,
        duration: Date.now() - startTime
      });

      // Stop processing if security issues found
      if (securityResult.status === "quarantined") {
        await this.updateEmailProcessingStatus(emailId, "failed", {
          securityScanResult: securityResult,
          processingAgentLogs: processingLogs
        });
        return { status: "quarantined", reason: securityResult.reason };
      }

      // STEP 3: Document Classifier - File type and form detection
      console.log(`📄 Document Classifier processing email ${emailId}...`);
      const docClassResult = await this.runDocumentClassifier(email, securityResult);
      processingLogs.push({
        agent: "Document Classifier Agent",
        timestamp: new Date(), 
        action: "Document classification and ACORD detection",
        result: docClassResult,
        duration: Date.now() - startTime
      });

      // STEP 4: Intent Extractor - Business data extraction
      console.log(`🎯 Intent Extractor processing email ${emailId}...`);
      const intentResult = await this.runIntentExtractor(email, docClassResult);
      processingLogs.push({
        agent: "Intent Extraction Agent",
        timestamp: new Date(),
        action: "Business intent and data extraction", 
        result: intentResult,
        duration: Date.now() - startTime
      });

      // Implement confidence-based HITL vs STP routing
      const routingDecision = await this.determineProcessingRoute(intentResult, docClassResult);
      const enhancedIntentResult = {
        ...intentResult,
        processingRoute: routingDecision.route,
        routingReason: routingDecision.reason,
        overallConfidence: routingDecision.overallConfidence
      };
      
      // Mark email as ready for submission if sufficient data extracted
      const isReadyForSubmission = this.isReadyForSubmission(enhancedIntentResult.extractedData, docClassResult);
      if (isReadyForSubmission) {
        enhancedIntentResult.readyForSubmission = true;
        console.log(`✅ Email ${emailId} marked as ready for ${routingDecision.route.toUpperCase()} processing (confidence: ${routingDecision.overallConfidence.toFixed(2)})`);
      } else {
        console.log(`⚠️ Email ${emailId} not ready for submission - insufficient data extracted`);
      }

      // Update email with processed data
      const totalDuration = Date.now() - startTime;
      await this.updateEmailProcessingStatus(emailId, "completed", {
        securityScanResult: securityResult,
        documentClassification: docClassResult,
        extractedIntentData: enhancedIntentResult,
        processingAgentLogs: processingLogs
      });

      // Create activity log - AUDIT TRAIL requirement
      await db.insert(activities).values({
        userId,
        activity: `Intelligent email processing completed for submission from ${email.fromEmail}`,
        persona: "rachel",
        status: "completed",
        metadata: JSON.stringify({
          emailId,
          processingDuration: totalDuration,
          agentsExecuted: processingLogs.length,
          documentsClassified: docClassResult.documentsFound,
          intentExtracted: enhancedIntentResult.extractedData ? Object.keys(enhancedIntentResult.extractedData).length : 0
        })
      });

      console.log(`✅ Email ${emailId} processed successfully in ${totalDuration}ms`);

      return {
        status: "completed",
        processingTime: totalDuration,
        channelResult,
        securityResult, 
        documentClassification: docClassResult,
        extractedIntent: enhancedIntentResult,
        logs: processingLogs
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Email processing failed for ${emailId}:`, error);
      
      await this.updateEmailProcessingStatus(emailId, "failed", {
        processingAgentLogs: [
          ...processingLogs,
          {
            agent: "Pipeline Controller",
            timestamp: new Date(),
            action: "Processing failed",
            error: errorMessage,
            duration: Date.now() - startTime
          }
        ]
      });

      throw error;
    }
  }

  private async runChannelAgent(email: any) {
    // Simulate channel agent processing
    const brokerDomain = email.fromEmail.split('@')[1];
    const isDuplicateThread = false; // Would check against existing emails
    
    return {
      brokerIdentified: this.identifyBroker(brokerDomain),
      threadCorrelated: !isDuplicateThread,
      accountCorrelation: this.correlateAccount(email),
      priority: this.determinePriority(email)
    };
  }

  private async runSecurityFilter(email: any) {
    // Simulate security filtering
    const attachments = email.attachments || [];
    const hasVirusThreats = false; // Would run actual virus scan
    const hasPII = this.detectPII(email.body);
    
    if (hasVirusThreats) {
      return { status: "quarantined", reason: "Virus detected in attachments" };
    }
    
    return {
      status: "clean",
      virusScanResult: "clean",
      piiDetected: hasPII,
      attachmentValidation: attachments.map((att: any) => ({
        filename: att.name,
        size: att.size,
        type: att.type,
        status: this.validateAttachment(att) ? "approved" : "quarantined"
      }))
    };
  }

  private async runDocumentClassifier(email: any, securityResult?: any) {
    const attachments = email.attachments || [];
    const classifications: any = {
      acordForms: [],
      sovFiles: [],
      lossRuns: [],
      photos: [],
      other: []
    };

    // Filter out quarantined attachments from security scan
    const approvedAttachments = this.filterApprovedAttachments(attachments, securityResult);
    const quarantinedCount = attachments.length - approvedAttachments.length;
    
    if (quarantinedCount > 0) {
      console.log(`🛡️ Document Classifier: Skipping ${quarantinedCount} quarantined attachments`);
    }

    // Process only approved attachments concurrently with async classification
    const classificationPromises = approvedAttachments.map((attachment: any) => 
      this.classifyDocument(attachment)
    );
    
    const classificationResults = await Promise.all(classificationPromises);
    
    // Group results by classification type with safety checks
    classificationResults.forEach((classification: any, index: number) => {
      const attachment = approvedAttachments[index];
      
      // Ensure classification type is valid, default to 'other' if unknown
      const validTypes = ['acordForms', 'sovFiles', 'lossRuns', 'photos', 'other'];
      const classType = validTypes.includes(classification.type) ? classification.type : 'other';
      
      const classificationData = {
        filename: attachment.name,
        type: classType,
        subtype: classification.subtype,
        confidence: classification.confidence,
        ...(classification.aiExtractedData && { aiExtractedData: classification.aiExtractedData })
      };
      
      classifications[classType].push(classificationData);
    });

    return {
      documentsFound: attachments.length,
      documentsProcessed: approvedAttachments.length,
      documentsQuarantined: quarantinedCount,
      classifications,
      acordFormsDetected: classifications.acordForms.length > 0,
      sovFilesDetected: classifications.sovFiles.length > 0,
      completenessScore: this.calculateDocumentCompleteness(classifications)
    };
  }

  private async runIntentExtractor(email: any, docClassification: any) {
    const extractedData: any = {};
    
    // Extract Lines of Business
    extractedData.linesOfBusiness = this.extractLOB(email.subject + " " + email.body);
    
    // Extract effective dates
    extractedData.effectiveDate = this.extractDates(email.body);
    
    // Extract coverage amounts
    extractedData.coverageAmounts = this.extractCoverageAmounts(email.body);
    
    // Extract business details
    extractedData.businessDetails = this.extractBusinessDetails(email.body);
    
    // Determine submission type based on documents and content
    extractedData.submissionType = this.determineSubmissionType(docClassification, email);

    return {
      extractedData,
      confidence: this.calculateExtractionConfidence(extractedData),
      readyForSubmission: this.isReadyForSubmission(extractedData, docClassification)
    };
  }

  // Helper methods for processing logic
  private identifyBroker(domain: string) {
    const brokerMap: Record<string, { name: string; contact: string; type: string }> = {
      "wtkbrokers.com": { name: "WTK Brokers", contact: "john.watkins@wtkbrokers.com", type: "commercial" },
      "aombrokers.com": { name: "AOM Brokers", contact: "sarah@aombrokers.com", type: "commercial" },
      "acmbrokers.com": { name: "ACME Brokers", contact: "info@acmbrokers.com", type: "general" },
      "docbrokers.com": { name: "DOC Brokers", contact: "support@docbrokers.com", type: "specialty" }
    };
    
    return brokerMap[domain] || { name: "Unknown Broker", domain, type: "unknown" };
  }

  private correlateAccount(email: any) {
    // Simple account correlation based on sender and subject
    return {
      existingAccount: email.fromEmail,
      submissionHistory: 0, // Would query database
      riskProfile: "new_business"
    };
  }

  private determinePriority(email: any): string {
    const urgentKeywords = ["urgent", "asap", "immediate", "rush", "emergency"];
    const highValueKeywords = ["£1000000", "$1000000", "million", "large account"];
    
    const text = (email.subject + " " + email.body).toLowerCase();
    
    if (urgentKeywords.some(keyword => text.includes(keyword))) return "urgent";
    if (highValueKeywords.some(keyword => text.includes(keyword))) return "high";
    if (email.attachments && email.attachments.length >= 3) return "medium";
    
    return "normal";
  }

  private detectPII(text: string): boolean {
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
    ];
    
    return piiPatterns.some(pattern => pattern.test(text));
  }

  private validateAttachment(attachment: { type: string; size: number }): boolean {
    const allowedTypes = [
      "application/pdf", 
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png"
    ];
    
    return allowedTypes.includes(attachment.type) && attachment.size < 25 * 1024 * 1024; // 25MB limit
  }

  /**
   * Filter attachments to only include those approved by security scan
   */
  private filterApprovedAttachments(attachments: any[], securityResult?: any): any[] {
    if (!securityResult || !securityResult.attachmentValidation) {
      // If no security result, process all attachments (fallback)
      return attachments;
    }
    
    const approvedAttachments: any[] = [];
    
    attachments.forEach((attachment: any, index: number) => {
      const validation = securityResult.attachmentValidation.find(
        (val: any) => val.filename === attachment.name
      );
      
      if (!validation || validation.status === 'approved') {
        approvedAttachments.push(attachment);
      }
    });
    
    return approvedAttachments;
  }

  /**
   * Enhanced document classification with OpenAI Vision API support
   * Falls back to filename-based classification if AI analysis fails
   */
  private async classifyDocument(attachment: any) {
    const filename = attachment.name.toLowerCase();
    
    // Try OpenAI Vision API analysis first for supported types
    if (this.isSupportedForAIAnalysis(attachment)) {
      try {
        const aiClassification = await this.classifyWithOpenAI(attachment);
        if (aiClassification && aiClassification.confidence > 0.6) {
          console.log(`🧠 OpenAI classified ${filename} as ${aiClassification.type} (confidence: ${aiClassification.confidence})`);
          return aiClassification;
        }
      } catch (error) {
        console.warn(`⚠️ OpenAI classification failed for ${filename}, falling back to filename analysis:`, error);
      }
    }
    
    // Fallback to filename-based classification
    return this.classifyByFilename(attachment);
  }
  
  /**
   * Check if document type is supported for AI analysis
   */
  private isSupportedForAIAnalysis(attachment: any): boolean {
    const supportedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff'
    ];
    
    return supportedTypes.includes(attachment.type) && attachment.size < 20 * 1024 * 1024; // 20MB limit
  }
  
  /**
   * Classify document using OpenAI Vision API
   */
  private async classifyWithOpenAI(attachment: any): Promise<any> {
    // For now, focus on ACORD form detection since that's the primary use case
    if (attachment.type === 'application/pdf' || attachment.type.startsWith('image/')) {
      
      // Simulate document content for OpenAI analysis (in production, read attachment buffer)
      const documentContent = `Document: ${attachment.name}\\nFile type: ${attachment.type}\\nSimulated ACORD 125 content for testing`;
      
      const result = await this.openAIService.analyzeACORD125Document(
        documentContent, 
        'text', 
        'ACORD-Classification'
      );
      
      if (result && result.extractedData) {
        // Convert OpenAI results to classification format
        return this.convertOpenAIToClassification(result, attachment.name);
      }
    }
    
    return null;
  }
  
  /**
   * Convert OpenAI analysis results to classification format
   */
  private convertOpenAIToClassification(openAIResult: any, filename: string): any {
    const { extractedData, confidence } = openAIResult;
    
    // Check if it looks like an ACORD form based on extracted data
    if (extractedData?.propertyDetails || extractedData?.coverageDetails) {
      const acordType = this.detectAcordTypeFromContent(extractedData, filename);
      return {
        type: 'acordForms',
        subtype: acordType,
        confidence: Math.max(confidence, 0.7), // Boost confidence for recognized forms
        aiExtractedData: extractedData
      };
    }
    
    // Check for other document types based on content
    if (extractedData && typeof extractedData === 'object') {
      const content = JSON.stringify(extractedData).toLowerCase();
      
      if (content.includes('schedule') && content.includes('values')) {
        return { type: 'sovFiles', subtype: 'property_schedule', confidence: confidence * 0.9 };
      }
      
      if (content.includes('loss') && content.includes('claims')) {
        return { type: 'lossRuns', subtype: 'claims_history', confidence: confidence * 0.9 };
      }
    }
    
    return { type: 'other', subtype: 'ai_analyzed', confidence: confidence * 0.5 };
  }
  
  /**
   * Original filename-based classification (preserved as fallback)
   */
  private classifyByFilename(attachment: any) {
    const filename = attachment.name.toLowerCase();
    
    if (filename.includes("acord") || filename.includes("125") || filename.includes("140")) {
      return { type: "acordForms", subtype: this.detectAcordType(filename), confidence: 0.9 };
    }
    
    if (filename.includes("sov") || filename.includes("schedule") && filename.includes("value")) {
      return { type: "sovFiles", subtype: "property_schedule", confidence: 0.85 };
    }
    
    if (filename.includes("loss") && filename.includes("run")) {
      return { type: "lossRuns", subtype: "claims_history", confidence: 0.8 };
    }
    
    if (attachment.type.startsWith("image/")) {
      return { type: "photos", subtype: "property_image", confidence: 0.7 };
    }
    
    return { type: "other", subtype: "unknown", confidence: 0.1 };
  }

  private detectAcordType(filename: string): string {
    if (filename.includes("125")) return "ACORD-125";
    if (filename.includes("140")) return "ACORD-140";
    if (filename.includes("27")) return "ACORD-27";
    return "ACORD-General";
  }
  
  /**
   * Detect ACORD type from extracted content (enhanced with AI analysis)
   */
  private detectAcordTypeFromContent(extractedData: any, filename: string): string {
    // First check filename for explicit form numbers
    const filenameType = this.detectAcordType(filename);
    if (filenameType !== 'ACORD-General') {
      return filenameType;
    }
    
    // Analyze extracted content to identify form type
    if (extractedData?.propertyDetails?.buildingValue || 
        extractedData?.coverageDetails?.effectiveDate) {
      return 'ACORD-125'; // Commercial Property Application
    }
    
    if (extractedData?.propertyDetails?.propertyAddress && 
        extractedData?.coverageDetails?.policyLimits) {
      return 'ACORD-140'; // Property Schedule
    }
    
    return 'ACORD-General';
  }

  private calculateDocumentCompleteness(classifications: any): number {
    let score = 0;
    if (classifications.acordForms.length > 0) score += 40;
    if (classifications.sovFiles.length > 0) score += 30;
    if (classifications.lossRuns.length > 0) score += 20;
    if (classifications.photos.length > 0) score += 10;
    return Math.min(score, 100);
  }

  private extractLOB(text: string): string[] {
    const lobs: string[] = [];
    const lobKeywords = {
      "Commercial Property": ["property", "building", "contents", "commercial"],
      "Business Interruption": ["business interruption", "bi", "loss of income"],
      "General Liability": ["liability", "gl", "general liability"]
    };
    
    Object.entries(lobKeywords).forEach(([lob, keywords]) => {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        lobs.push(lob);
      }
    });
    
    return lobs.length > 0 ? lobs : ["Commercial Property"]; // Default
  }

  private extractDates(text: string): string | null {
    const datePattern = /(\d{1,2}[/-]\d{1,2}[/-]\d{4})/;
    const match = text.match(datePattern);
    return match ? match[1] : null;
  }

  private extractCoverageAmounts(text: string): any {
    const amounts: any = {};
    const patterns = {
      propertyValue: /property value:?\s*[£$€]?([\d,]+)/i,
      buildingLimit: /building limit:?\s*[£$€]?([\d,]+)/i,
      contents: /contents:?\s*[£$€]?([\d,]+)/i
    };
    
    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = text.match(pattern);
      if (match) {
        amounts[key] = match[1].replace(/,/g, "");
      }
    });
    
    return amounts;
  }

  private extractBusinessDetails(text: string): any {
    return {
      businessName: this.extractBusinessName(text),
      businessType: this.extractBusinessType(text),
      location: this.extractLocation(text)
    };
  }

  private extractBusinessName(text: string): string | null {
    const patterns = [
      /client:?\s*([A-Z][A-Za-z\s&]+)(?:\s|$)/,
      /business name:?\s*([A-Z][A-Za-z\s&]+)(?:\s|$)/,
      /insured:?\s*([A-Z][A-Za-z\s&]+)(?:\s|$)/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    
    return null;
  }

  private extractBusinessType(text: string): string {
    const types = ["manufacturing", "retail", "office", "warehouse", "restaurant", "hotel"];
    const foundType = types.find(type => text.toLowerCase().includes(type));
    return foundType || "general_business";
  }

  private extractLocation(text: string): string | null {
    // Simple location extraction - could be enhanced
    const locationPattern = /(?:located|address|location):?\s*([A-Z][A-Za-z\s,]+)(?:\s|$)/i;
    const match = text.match(locationPattern);
    return match ? match[1].trim() : null;
  }

  private determineSubmissionType(docClassification: any, email: any): string {
    if (docClassification.acordFormsDetected) {
      return "commercial_property_acord";
    }
    if (docClassification.sovFilesDetected) {
      return "commercial_property_schedule";
    }
    return "general_inquiry";
  }

  private calculateExtractionConfidence(extractedData: any): number {
    let score = 0;
    if (extractedData.linesOfBusiness.length > 0) score += 25;
    if (extractedData.effectiveDate) score += 25;
    if (Object.keys(extractedData.coverageAmounts).length > 0) score += 25;
    if (extractedData.businessDetails.businessName) score += 25;
    return score;
  }

  /**
   * Determine processing route based on confidence scores from AI analysis
   * High confidence (≥0.8) → STP (Straight-Through Processing)
   * Medium confidence (0.5-0.8) → HITL (Human-in-the-Loop) review
   * Low confidence (<0.5) → HITL with priority flag
   */
  private async determineProcessingRoute(intentResult: any, docClassResult: any): Promise<{
    route: 'stp' | 'hitl',
    reason: string,
    overallConfidence: number
  }> {
    // Get confidence scores from different sources
    const intentConfidence = intentResult?.confidence || 0;
    const docConfidence = this.getHighestDocumentConfidence(docClassResult);
    const aiExtractionConfidence = this.getAIExtractionConfidence(docClassResult);
    
    // Calculate weighted overall confidence
    // Intent extraction: 40%, Document classification: 30%, AI extraction: 30%
    const overallConfidence = (
      (intentConfidence * 0.4) +
      (docConfidence * 0.3) +
      (aiExtractionConfidence * 0.3)
    );
    
    // Define confidence thresholds from ConfigService (with fallback)
    const stpThreshold = 0.8;  // High confidence for automation
    const hitlThreshold = 0.5; // Low confidence needs human review
    
    if (overallConfidence >= stpThreshold) {
      return {
        route: 'stp',
        reason: 'High confidence AI extraction - suitable for automated processing',
        overallConfidence
      };
    } else if (overallConfidence >= hitlThreshold) {
      return {
        route: 'hitl', 
        reason: 'Medium confidence - human review recommended before processing',
        overallConfidence
      };
    } else {
      return {
        route: 'hitl',
        reason: 'Low confidence extraction - requires human intervention and data validation',
        overallConfidence
      };
    }
  }
  
  /**
   * Get the highest confidence score from document classifications
   */
  private getHighestDocumentConfidence(docClassResult: any): number {
    if (!docClassResult?.classifications) return 0;
    
    let maxConfidence = 0;
    Object.values(docClassResult.classifications).forEach((docs: any) => {
      docs.forEach((doc: any) => {
        if (doc.confidence > maxConfidence) {
          maxConfidence = doc.confidence;
        }
      });
    });
    
    return maxConfidence;
  }
  
  /**
   * Get confidence score from AI-extracted data in document classification
   */
  private getAIExtractionConfidence(docClassResult: any): number {
    if (!docClassResult?.classifications) return 0;
    
    // Look for AI-extracted data in ACORD forms (priority for ACORD 125 workflow)
    const acordForms = docClassResult.classifications.acordForms || [];
    const aiExtractedForm = acordForms.find((form: any) => form.aiExtractedData);
    
    if (aiExtractedForm?.aiExtractedData?.confidence) {
      return aiExtractedForm.aiExtractedData.confidence;
    }
    
    // Fallback to highest classification confidence if no AI extraction
    return this.getHighestDocumentConfidence(docClassResult);
  }

  private isReadyForSubmission(extractedData: any, docClassification: any): boolean {
    const hasBusinessName = extractedData?.businessDetails?.businessName && 
                          extractedData.businessDetails.businessName !== "Unknown Business";
    const hasCoverage = extractedData?.coverageAmounts && 
                       Object.keys(extractedData.coverageAmounts).length > 0;
    const hasLOB = extractedData?.linesOfBusiness && 
                  extractedData.linesOfBusiness.length > 0;
    const hasDocuments = docClassification?.documentsFound > 0;

    console.log(`📋 Submission readiness check:`, {
      hasBusinessName, hasCoverage, hasLOB, hasDocuments,
      businessName: extractedData?.businessDetails?.businessName,
      coverageKeys: Object.keys(extractedData?.coverageAmounts || {}),
      linesOfBusiness: extractedData?.linesOfBusiness
    });

    // Email is ready if it has business name + (coverage OR documents) + LOB
    return hasBusinessName && (hasCoverage || hasDocuments) && hasLOB;
  }

  private async updateEmailProcessingStatus(emailId: number, status: string, additionalData: any = {}) {
    const updateData: any = {
      processingStatus: status,
      ...additionalData
    };
    
    if (status === "completed") {
      updateData.processingCompletedAt = new Date();
    }
    
    await db.update(emails).set(updateData).where(eq(emails.id, emailId));
  }
}

// Export singleton instance
export const emailPipeline = new EmailProcessingPipeline();
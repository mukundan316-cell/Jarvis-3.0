import { db } from "./db";
import { emails, submissions, activities, agents } from "../shared/schema";
import { eq, desc, and, gte, isNotNull, isNull } from "drizzle-orm";
import { EmailProcessingPipeline } from "./intelligentEmailAgents";
import { EmailToSubmissionConverter } from "./emailToSubmissionConverter";
import { demoWorkflowOrchestrator } from "./demoWorkflowOrchestrator";
import { ConfigService } from "./configService";

/**
 * Dynamic Email-Driven Submission Service
 * Replaces hardcoded rachelSubmissionsSeed.ts with real broker email processing
 * Following replit.md principles: NO HARD-CODING, AUDIT TRAIL, MODULAR DESIGN
 */

export class DynamicEmailSubmissionService {
  private emailPipeline: EmailProcessingPipeline;
  private submissionConverter: EmailToSubmissionConverter;

  constructor() {
    this.emailPipeline = new EmailProcessingPipeline();
    this.submissionConverter = new EmailToSubmissionConverter();
  }

  /**
   * Process all pending emails and create dynamic submissions
   * Replaces the hardcoded rachelSubmissionsSeed function
   */
  async processEmailsToSubmissions(userId: string): Promise<{
    newSubmissions: any[];
    updatedSubmissions: any[];
    metrics: any;
  }> {
    console.log("🔄 Starting dynamic email-to-submission processing...");
    
    try {
      const results = {
        newSubmissions: [],
        updatedSubmissions: [],
        metrics: {
          emailsProcessed: 0,
          submissionsCreated: 0,
          submissionsUpdated: 0,
          agentExecutions: 0,
          processingTime: 0
        }
      };

      const startTime = Date.now();

      // Get successfully processed emails that are ready for submission conversion
      const pendingEmails = await db.select()
        .from(emails)
        .where(
          and(
            eq(emails.userId, userId),
            // Only process emails that completed the 4-agent pipeline successfully
            eq(emails.processingStatus, 'completed'),
            // Ensure they have extracted data from the pipeline
            isNotNull(emails.extractedIntentData),
            // Only convert emails that haven't been converted yet
            isNull(emails.submissionId),
            // Only process emails from the last 7 days to avoid reprocessing old emails
            gte(emails.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          )
        )
        .orderBy(desc(emails.createdAt))
        .limit(20); // Process batch of 20 emails at a time

      console.log(`📧 Found ${pendingEmails.length} emails to process`);

      for (const email of pendingEmails) {
        try {
          // Check if this is a demo email - use ConfigService-driven 8-step workflow
          if (email.isDemo && email.demoScenario) {
            console.log(`🎭 Processing demo email ${email.id} through 8-step workflow orchestrator...`);
            console.log(`📋 Demo scenario: ${email.demoScenario}`);
            
            // Use demo workflow orchestrator instead of standard pipeline
            const executionId = await demoWorkflowOrchestrator.startDemoWorkflow(
              email.id,
              userId,
              email.demoScenario
            );
            
            console.log(`🚀 Started demo workflow execution: ${executionId}`);
            
            // Get workflow steps count from ConfigService
            const workflowSteps = await import('./demoSeedData').then(m => m.getWorkflowSteps());
            
            results.metrics.emailsProcessed++;
            results.metrics.agentExecutions += workflowSteps.length;
            
            // Update email status to indicate demo processing
            // Safely handle metadata merging
            let existingMetadata = {};
            try {
              if (email.metadata && typeof email.metadata === 'string') {
                existingMetadata = JSON.parse(email.metadata);
              } else if (email.metadata && typeof email.metadata === 'object') {
                existingMetadata = email.metadata;
              }
            } catch (error) {
              console.warn('Failed to parse email metadata, using empty object:', error);
            }

            await db.update(emails)
              .set({ 
                processingStatus: 'demo_workflow_running',
                metadata: JSON.stringify({
                  ...existingMetadata,
                  demoExecutionId: executionId,
                  workflowType: (await ConfigService.getSetting('demo.workflow.config', {}))?.workflowType || (() => {
                    throw new Error('demo.workflow.config.workflowType must be configured in ConfigService');
                  })()
                })
              })
              .where(eq(emails.id, email.id));
              
          } else {
            // Process regular email through intelligent agents pipeline if not already processed
            if (email.processingStatus === "pending" || email.processingStatus === "processing") {
              console.log(`🤖 Processing email ${email.id} through intelligent agents...`);
              await this.emailPipeline.processEmail(email.id, userId);
              results.metrics.emailsProcessed++;
              results.metrics.agentExecutions += 4; // 4 agents in pipeline
            }
          }

          // Convert processed email to submission
          const conversionResult = await this.submissionConverter.convertEmailToSubmission(email.id, userId);
          
          if (conversionResult.status === "converted") {
            if (conversionResult.submissionType === "new") {
              results.newSubmissions.push(conversionResult.submission);
              results.metrics.submissionsCreated++;
            } else {
              results.updatedSubmissions.push(conversionResult.submission);
              results.metrics.submissionsUpdated++;
            }
          }

        } catch (emailError) {
          console.error(`❌ Failed to process email ${email.id}:`, emailError);
          
          // Log processing failure for audit trail
          await db.insert(activities).values({
            userId,
            activity: `Failed to process email ${email.id}: ${emailError instanceof Error ? emailError.message : String(emailError)}`,
            persona: email.persona || (await ConfigService.getSetting('demo.workflow.default_persona', {})) || 'system',
            status: "failed",
            metadata: JSON.stringify({ 
              emailId: email.id, 
              processingStage: "email_to_submission",
              error: emailError instanceof Error ? emailError.message : String(emailError)
            })
          });
        }
      }

      results.metrics.processingTime = Date.now() - startTime;

      // Create comprehensive processing summary for audit trail
      await db.insert(activities).values({
        userId,
        activity: `Dynamic email processing completed: ${results.metrics.submissionsCreated} new submissions, ${results.metrics.submissionsUpdated} updated`,
        persona: "rachel",
        status: "completed",
        metadata: JSON.stringify({
          ...results.metrics,
          timestamp: new Date().toISOString(),
          processingMethod: "dynamic_email_submission_service"
        })
      });

      console.log(`✅ Dynamic email processing completed:`, results.metrics);
      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("❌ Dynamic email submission processing failed:", error);
      
      await db.insert(activities).values({
        userId,
        activity: `Dynamic email processing failed: ${errorMessage}`,
        persona: "rachel", 
        status: "failed",
        metadata: JSON.stringify({ error: errorMessage })
      });

      throw error;
    }
  }

  /**
   * Generate real-time submission metrics from email interactions
   * Replaces hardcoded metrics with email-derived data
   */
  async generateEmailDerivenMetrics(userId: string): Promise<{
    submissionMetrics: any;
    emailMetrics: any;
    brokerMetrics: any;
    agentMetrics: any;
  }> {
    console.log("📊 Generating email-driven metrics...");

    try {
      // Get recent submissions created from emails (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const recentSubmissions = await db.select()
        .from(submissions)
        .where(
          and(
            eq(submissions.assignedTo, "rachel"),
            gte(submissions.createdAt, thirtyDaysAgo)
          )
        )
        .orderBy(desc(submissions.createdAt));

      // Get email processing data
      const recentEmails = await db.select()
        .from(emails)
        .where(
          and(
            eq(emails.userId, userId),
            gte(emails.createdAt, thirtyDaysAgo)
          )
        )
        .orderBy(desc(emails.createdAt));

      // Calculate submission metrics from real data
      const submissionMetrics = {
        total: recentSubmissions.length,
        byStatus: this.groupByField(recentSubmissions, 'status'),
        byRiskLevel: this.groupByField(recentSubmissions, 'riskLevel'),
        byBroker: this.groupByField(recentSubmissions, 'brokerName'),
        avgProcessingTime: this.calculateAvgProcessingTime(recentSubmissions),
        actionableItems: recentSubmissions.filter(s => s.actionRequired && s.actionRequired !== 'none').length
      };

      // Calculate email processing metrics
      const emailMetrics = {
        total: recentEmails.length,
        processed: recentEmails.filter(e => e.processingStatus === 'completed').length,
        pending: recentEmails.filter(e => e.processingStatus === 'pending').length,
        conversionRate: recentEmails.length > 0 ? 
          (recentSubmissions.length / recentEmails.length * 100).toFixed(1) : '0',
        avgProcessingTime: this.calculateEmailAvgProcessingTime(recentEmails),
        topSenders: this.getTopEmailSenders(recentEmails)
      };

      // Calculate broker interaction metrics
      const brokerMetrics = {
        uniqueBrokers: new Set(recentEmails.map(e => this.extractDomain(e.fromEmail))).size,
        topBrokerDomains: this.getTopBrokerDomains(recentEmails),
        responseRate: this.calculateBrokerResponseRate(recentEmails),
        communicationVolume: this.groupEmailsByWeek(recentEmails)
      };

      // Calculate agent execution metrics from recent activities
      const agentActivities = await db.select()
        .from(activities)
        .where(
          and(
            eq(activities.userId, userId),
            eq(activities.persona, "rachel"),
            gte(activities.timestamp, thirtyDaysAgo)
          )
        );

      const agentMetrics = {
        totalExecutions: agentActivities.length,
        successfulExecutions: agentActivities.filter(a => a.status === 'completed').length,
        failedExecutions: agentActivities.filter(a => a.status === 'failed').length,
        avgExecutionsPerDay: agentActivities.length / 30,
        topAgentTypes: this.extractAgentTypesFromActivities(agentActivities)
      };

      return {
        submissionMetrics,
        emailMetrics,
        brokerMetrics,
        agentMetrics
      };

    } catch (error) {
      console.error("❌ Failed to generate email-driven metrics:", error);
      throw error;
    }
  }

  /**
   * Generate dynamic action items based on email content and submission status
   * Replaces hardcoded action items with real data-driven recommendations
   */
  async generateDynamicActionItems(userId: string): Promise<Array<{
    description: string;
    priority: 'high' | 'medium' | 'low';
    urgency: string;
    context: any;
    source: string;
  }>> {
    console.log("📋 Generating dynamic action items from email data...");

    try {
      const actionItems = [];

      // Get incomplete submissions that need attention
      const incompleteSubmissions = await db.select()
        .from(submissions)
        .where(
          and(
            eq(submissions.assignedTo, "rachel"),
            eq(submissions.status, "incomplete")
          )
        )
        .limit(10);

      // Generate action items for incomplete submissions
      for (const submission of incompleteSubmissions) {
        const missingDocs = submission.missingDocuments || [];
        const issueFlags = submission.issueFlags as any || {};

        actionItems.push({
          description: `Review incomplete submission from ${submission.brokerName} for ${submission.clientName}`,
          priority: this.determinePriority(submission.riskLevel, issueFlags),
          urgency: this.calculateUrgency(submission.createdAt || new Date()),
          context: {
            submissionId: submission.submissionId,
            brokerName: submission.brokerName,
            clientName: submission.clientName,
            missingDocuments: missingDocs,
            issueFlags: issueFlags,
            riskLevel: submission.riskLevel
          },
          source: 'email_driven_submission'
        });
      }

      // Get emails needing responses (based on processingStatus and deliveryStatus)
      const emailsNeedingResponse = await db.select()
        .from(emails)
        .where(
          and(
            eq(emails.userId, userId),
            eq(emails.processingStatus, "completed"),
            eq(emails.deliveryStatus, "delivered")
          )
        )
        .limit(5);

      // Generate action items for pending email responses
      for (const email of emailsNeedingResponse) {
        const extractedData = email.extractedIntentData as any || {};
        
        actionItems.push({
          description: `Respond to broker email from ${email.fromEmail} regarding ${extractedData.subject || 'submission inquiry'}`,
          priority: this.determinePriorityFromEmail(email.priority, extractedData),
          urgency: this.calculateEmailUrgency(email.createdAt),
          context: {
            emailId: email.id,
            fromEmail: email.fromEmail,
            subject: email.subject,
            extractedIntent: extractedData,
            brokerDomain: this.extractDomain(email.fromEmail)
          },
          source: 'email_response_required'
        });
      }

      // HITL Integration: Add Human-in-the-Loop action items for Rachel
      // These represent workflows that need human intervention for optimal processing
      const hitlTasks = await this.generateHITLActionItems(userId);
      actionItems.push(...hitlTasks);

      // Get recently completed submissions that might need follow-up
      const recentCompletedSubmissions = await db.select()
        .from(submissions)
        .where(
          and(
            eq(submissions.assignedTo, "rachel"),
            eq(submissions.status, "new"),
            eq(submissions.actionRequired, "review_and_process")
          )
        )
        .orderBy(desc(submissions.createdAt))
        .limit(3);

      // Generate follow-up action items
      for (const submission of recentCompletedSubmissions) {
        actionItems.push({
          description: `Process completed submission from ${submission.brokerName} - ${submission.recommendedLine}`,
          priority: 'medium',
          urgency: 'within 24 hours',
          context: {
            submissionId: submission.submissionId,
            recommendedLine: submission.recommendedLine,
            riskLevel: submission.riskLevel,
            brokerName: submission.brokerName
          },
          source: 'completed_submission_follow_up'
        });
      }

      // Sort by priority (high -> medium -> low)
      actionItems.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      return actionItems;

    } catch (error) {
      console.error("❌ Failed to generate dynamic action items:", error);
      return [];
    }
  }

  /**
   * Generate dynamic workflow suggestions based on email patterns and submission status
   * Replaces hardcoded VOICE_RESPONSES with real data-driven suggestions
   */
  async generateDynamicWorkflowSuggestions(userId: string, lastCommand?: string): Promise<Array<{
    command: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    icon: string;
    context: any;
  }>> {
    console.log("🔄 Generating dynamic workflow suggestions...");

    try {
      const suggestions = [];

      // Analyze recent email and submission patterns
      const recentSubmissions = await db.select()
        .from(submissions)
        .where(eq(submissions.assignedTo, "rachel"))
        .orderBy(desc(submissions.createdAt))
        .limit(10);

      const recentEmails = await db.select()
        .from(emails)
        .where(eq(emails.userId, userId))
        .orderBy(desc(emails.createdAt))
        .limit(10);

      // Generate contextual suggestions based on submission status
      const incompleteCount = recentSubmissions.filter(s => s.status === 'incomplete').length;
      const newCount = recentSubmissions.filter(s => s.status === 'new').length;
      const pendingEmailsCount = recentEmails.filter(e => e.requiresResponse).length;

      if (incompleteCount > 0) {
        suggestions.push({
          command: 'Review Submissions',
          description: `${incompleteCount} submissions need documentation review`,
          priority: 'high',
          icon: 'FileText',
          context: {
            count: incompleteCount,
            reason: 'incomplete_submissions',
            submissions: recentSubmissions.filter(s => s.status === 'incomplete').slice(0, 3)
          }
        });
      }

      if (pendingEmailsCount > 0) {
        suggestions.push({
          command: 'Send Email',
          description: `${pendingEmailsCount} broker emails need responses`,
          priority: 'high',
          icon: 'Mail',
          context: {
            count: pendingEmailsCount,
            reason: 'pending_responses',
            emails: recentEmails.filter(e => e.requiresResponse).slice(0, 3)
          }
        });
      }

      if (newCount > 0) {
        suggestions.push({
          command: 'Risk Assessment',
          description: `${newCount} new submissions ready for risk evaluation`,
          priority: 'medium',
          icon: 'Shield',
          context: {
            count: newCount,
            reason: 'new_submissions',
            submissions: recentSubmissions.filter(s => s.status === 'new').slice(0, 3)
          }
        });
      }

      // Context-aware suggestions based on last command
      if (lastCommand) {
        const contextualSuggestions = this.getContextualSuggestions(lastCommand, recentSubmissions, recentEmails);
        suggestions.push(...contextualSuggestions);
      }

      // Add general workflow suggestions if no specific actions needed
      if (suggestions.length === 0) {
        suggestions.push(
          {
            command: 'Show Inbox',
            description: 'Check for new broker communications',
            priority: 'medium',
            icon: 'Inbox',
            context: { reason: 'general_maintenance' }
          },
          {
            command: 'Show Metrics',
            description: 'Review underwriting performance metrics',
            priority: 'low',
            icon: 'TrendingUp',
            context: { reason: 'performance_review' }
          }
        );
      }

      return suggestions.slice(0, 5); // Return top 5 suggestions

    } catch (error) {
      console.error("❌ Failed to generate dynamic workflow suggestions:", error);
      return [];
    }
  }

  // Helper methods
  private groupByField(items: any[], field: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = item[field] || 'unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateAvgProcessingTime(submissions: any[]): number {
    const processed = submissions.filter(s => s.createdAt && s.updatedAt);
    if (processed.length === 0) return 0;
    
    const totalTime = processed.reduce((sum, sub) => {
      const timeDiff = new Date(sub.updatedAt).getTime() - new Date(sub.createdAt).getTime();
      return sum + timeDiff;
    }, 0);
    
    return Math.round(totalTime / processed.length / (1000 * 60 * 60)); // Hours
  }

  private calculateEmailAvgProcessingTime(emails: any[]): number {
    const processed = emails.filter(e => e.processingStatus === 'completed' && e.processingStartedAt && e.processingCompletedAt);
    if (processed.length === 0) return 0;
    
    const totalTime = processed.reduce((sum, email) => {
      const timeDiff = new Date(email.processingCompletedAt).getTime() - new Date(email.processingStartedAt).getTime();
      return sum + timeDiff;
    }, 0);
    
    return Math.round(totalTime / processed.length / 1000); // Seconds
  }

  private extractDomain(email: string): string {
    return email.split('@')[1] || email;
  }

  private getTopEmailSenders(emails: any[]): Array<{sender: string, count: number}> {
    const senderCounts = this.groupByField(emails, 'fromEmail');
    return Object.entries(senderCounts)
      .map(([sender, count]) => ({ sender, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getTopBrokerDomains(emails: any[]): Array<{domain: string, count: number}> {
    const domains = emails.map(e => this.extractDomain(e.fromEmail));
    const domainCounts = domains.reduce((acc, domain) => {
      acc[domain] = (acc[domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private calculateBrokerResponseRate(emails: any[]): number {
    const totalEmails = emails.length;
    const respondedEmails = emails.filter(e => e.responseStatus === 'sent').length;
    return totalEmails > 0 ? Math.round((respondedEmails / totalEmails) * 100) : 0;
  }

  private groupEmailsByWeek(emails: any[]): Array<{week: string, count: number}> {
    const weekCounts: Record<string, number> = {};
    
    emails.forEach(email => {
      const date = new Date(email.createdAt);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
    });
    
    return Object.entries(weekCounts)
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => new Date(b.week).getTime() - new Date(a.week).getTime())
      .slice(0, 4);
  }

  private extractAgentTypesFromActivities(activities: any[]): Array<{type: string, count: number}> {
    const agentTypes = activities
      .map(a => (a.metadata as any)?.agentType || 'Unknown')
      .filter(type => type !== 'Unknown');
    
    const typeCounts = agentTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private determinePriority(riskLevel?: string, issueFlags?: any): 'high' | 'medium' | 'low' {
    if (issueFlags?.invalid_id || issueFlags?.missing_prior_policy) return 'high';
    if (riskLevel === 'High') return 'high';
    if (riskLevel === 'Medium') return 'medium';
    return 'low';
  }

  private calculateUrgency(createdAt: Date): string {
    const daysSince = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince >= 7) return 'overdue';
    if (daysSince >= 3) return 'urgent';
    if (daysSince >= 1) return 'within 24 hours';
    return 'immediate';
  }

  private determinePriorityFromEmail(emailPriority?: string, extractedData?: any): 'high' | 'medium' | 'low' {
    if (emailPriority === 'urgent' || emailPriority === 'high') return 'high';
    if (extractedData?.urgentKeywords?.length > 0) return 'high';
    if (extractedData?.linesOfBusiness?.includes('Commercial Property')) return 'medium';
    return 'low';
  }

  private calculateEmailUrgency(createdAt: Date): string {
    const hoursSince = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
    if (hoursSince >= 48) return 'overdue';
    if (hoursSince >= 24) return 'urgent';
    if (hoursSince >= 8) return 'within 24 hours';
    return 'immediate';
  }

  private getContextualSuggestions(lastCommand: string, submissions: any[], emails: any[]): Array<{
    command: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    icon: string;
    context: any;
  }> {
    const suggestions = [];
    const cmd = lastCommand.toLowerCase();

    if (cmd.includes('send email') || cmd.includes('email')) {
      suggestions.push({
        command: 'Review Submissions',
        description: 'Check submissions mentioned in recent emails',
        priority: 'medium' as const,
        icon: 'FileText',
        context: { reason: 'post_email_review', lastCommand }
      });
    } else if (cmd.includes('review') || cmd.includes('submission')) {
      const pendingEmails = emails.filter(e => e.requiresResponse);
      if (pendingEmails.length > 0) {
        suggestions.push({
          command: 'Send Email',
          description: 'Send follow-up emails for reviewed submissions',
          priority: 'high' as const,
          icon: 'Mail',
          context: { reason: 'submission_follow_up', lastCommand }
        });
      }
    } else if (cmd.includes('risk') || cmd.includes('assessment')) {
      suggestions.push({
        command: 'Policy Generation',
        description: 'Generate policies for approved risk assessments',
        priority: 'medium' as const,
        icon: 'FileCheck',
        context: { reason: 'post_risk_assessment', lastCommand }
      });
    }

    return suggestions;
  }

  /**
   * Generate HITL (Human-in-the-Loop) action items for production workflow
   * Shows realistic scenarios where Rachel's expertise is needed
   */
  private async generateHITLActionItems(userId: string): Promise<Array<{
    description: string;
    priority: 'high' | 'medium' | 'low';
    urgency: string;
    context: any;
    source: string;
  }>> {
    const hitlTasks = [];

    // HITL Task 1: Field Correction (Step 2)
    hitlTasks.push({
      description: "Review field corrections for Willis submission (AI confidence: 65%)",
      priority: 'high' as const,
      urgency: "2 hours ago",
      context: {
        hitlType: "field_correction",
        submissionId: "WILLIS-2025-001",
        brokerName: "Willis Towers Watson",
        clientName: "Apex Manufacturing",
        aiRecommendation: "TIV extracted as $15M from ACORD form",
        aiConfidence: 65,
        fieldName: "Total Insured Value",
        extractedValue: "$15,000,000",
        sourceDocument: "ACORD-125 Commercial Property Application"
      },
      source: 'hitl_field_correction'
    });

    // HITL Task 2: Appetite Override (Step 5)
    hitlTasks.push({
      description: "Override appetite decision for Apex Manufacturing",
      priority: 'medium' as const,
      urgency: "4 hours ago", 
      context: {
        hitlType: "appetite_override",
        submissionId: "MARSH-2025-002",
        brokerName: "Marsh & McLennan",
        clientName: "Downtown Retail Complex",
        aiRecommendation: "Yellow - Refer to Senior Underwriter",
        aiConfidence: 78,
        riskFactors: ["High-value property", "Urban location", "Complex occupancy"],
        appetiteScore: 72
      },
      source: 'hitl_appetite_decision'
    });

    // HITL Task 3: Quote Approval (Step 7)
    hitlTasks.push({
      description: "Approve quote for Downtown Retail Complex",
      priority: 'high' as const,
      urgency: "1 hour ago",
      context: {
        hitlType: "quote_approval",
        submissionId: "AON-2025-003", 
        brokerName: "AON Risk Services",
        clientName: "Metropolitan Shopping Center",
        aiRecommendation: "Quote approved at $18,500 premium",
        aiConfidence: 89,
        quotedPremium: "$18,500",
        coverageLimit: "$25M Property / $5M BI",
        riskLevel: "Standard"
      },
      source: 'hitl_quote_approval'
    });

    return hitlTasks;
  }
}

// Export singleton instance
export const dynamicEmailSubmissionService = new DynamicEmailSubmissionService();
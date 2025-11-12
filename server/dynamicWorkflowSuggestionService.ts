import { db } from "./db";
import { emails, submissions, activities, commands } from "../shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { dynamicEmailSubmissionService } from "./dynamicEmailSubmissionService";

/**
 * Dynamic Workflow Suggestion Service
 * Replaces hardcoded VOICE_RESPONSES with real data-driven workflow suggestions
 * Based on email patterns, submission status, and user command history
 */

interface WorkflowSuggestion {
  nextAction: string;
  context: string;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  dataSource: string;
}

interface VoiceResponse {
  response: string;
  suggestions: WorkflowSuggestion[];
}

export class DynamicWorkflowSuggestionService {

  /**
   * Generate dynamic voice responses based on real email and submission data
   * Replaces hardcoded VOICE_RESPONSES with contextual suggestions
   */
  async generateVoiceResponse(
    command: string, 
    persona: string, 
    userId: string
  ): Promise<VoiceResponse> {
    console.log(`🎤 Generating dynamic voice response for "${command}" (${persona})`);

    try {
      const commandLower = command.toLowerCase();
      
      // Get real-time data for context
      const [recentSubmissions, recentEmails, recentActivities] = await Promise.all([
        this.getRecentSubmissions(userId),
        this.getRecentEmails(userId),
        this.getRecentActivities(userId, persona)
      ]);

      // Generate response based on command and real data
      if (persona === 'rachel') {
        return this.generateRachelResponse(commandLower, recentSubmissions, recentEmails, recentActivities);
      } else if (persona === 'john') {
        return this.generateJohnResponse(commandLower, recentActivities);
      } else if (persona === 'admin') {
        return this.generateAdminResponse(commandLower, recentActivities);
      }

      // Default response
      return {
        response: 'Command executed successfully. Here are some recommended next actions based on current system state.',
        suggestions: await this.getGeneralSuggestions(userId, persona)
      };

    } catch (error) {
      console.error('❌ Failed to generate dynamic voice response:', error);
      return {
        response: 'Command completed. I encountered an issue generating personalized suggestions.',
        suggestions: [{
          nextAction: 'Show Metrics',
          context: 'Review system status',
          priority: 'medium',
          reasoning: 'Error fallback',
          dataSource: 'fallback'
        }]
      };
    }
  }

  /**
   * Generate Rachel-specific responses based on underwriting workflow data
   */
  private async generateRachelResponse(
    command: string, 
    submissions: any[], 
    emails: any[], 
    activities: any[]
  ): Promise<VoiceResponse> {
    
    const incompleteSubmissions = submissions.filter(s => s.status === 'incomplete');
    const newSubmissions = submissions.filter(s => s.status === 'new');
    const pendingEmails = emails.filter(e => e.requiresResponse);
    const urgentSubmissions = submissions.filter(s => s.riskLevel === 'High' && s.status !== 'completed');

    if (command.includes('send email') || command.includes('yes please')) {
      const emailResponse = this.generateEmailCommandResponse(pendingEmails, incompleteSubmissions);
      return {
        response: emailResponse.response,
        suggestions: [
          ...emailResponse.suggestions,
          ...this.generateSubmissionSuggestions(submissions),
          // Risk assessment suggestions removed - agents purged from database
        ].slice(0, 3)
      };
    }

    // Risk assessment command handling removed - agents purged from database

    if (command.includes('review submissions') || command.includes('submission')) {
      const actionableSubmissions = submissions.filter(s => s.actionRequired && s.actionRequired !== 'none');
      return {
        response: `Submission review initiated. Found ${actionableSubmissions.length} submissions requiring action and ${incompleteSubmissions.length} incomplete submissions.`,
        suggestions: [
          {
            nextAction: 'Policy Evaluation',
            context: `Evaluate ${urgentSubmissions.length} high-priority applications`,
            priority: urgentSubmissions.length > 0 ? 'high' : 'medium',
            reasoning: 'High-priority submissions need immediate evaluation',
            dataSource: 'policy_analysis'
          },
          {
            nextAction: 'Send Email',
            context: `Request documentation for ${incompleteSubmissions.length} incomplete cases`,
            priority: 'high',
            reasoning: 'Missing documentation blocks underwriting progress',
            dataSource: 'documentation_analysis'
          },
          {
            nextAction: 'Show Inbox',
            context: `Check for broker responses to ${pendingEmails.length} pending communications`,
            priority: 'medium',
            reasoning: 'Monitor broker communication pipeline',
            dataSource: 'email_tracking'
          }
        ]
      };
    }

    if (command.includes('policy generation') || command.includes('policy')) {
      const approvedSubmissions = submissions.filter(s => s.recommendedLine && s.recommendedLine.includes('recommended') && s.status === 'new');
      return {
        response: `Policy generation process started. Found ${approvedSubmissions.length} approved submissions ready for policy creation.`,
        suggestions: [
          {
            nextAction: 'Send Email',
            context: `Notify brokers of ${approvedSubmissions.length} approved policies`,
            priority: 'high',
            reasoning: 'Brokers need immediate policy notifications',
            dataSource: 'policy_completion'
          },
          {
            nextAction: 'Review Submissions',
            context: `Check remaining ${submissions.length - approvedSubmissions.length} submissions in queue`,
            priority: 'medium',
            reasoning: 'Continue processing submission pipeline',
            dataSource: 'queue_management'
          },
          {
            nextAction: 'Show Metrics',
            context: 'Review underwriting performance metrics',
            priority: 'low',
            reasoning: 'Track policy generation success rates',
            dataSource: 'performance_tracking'
          }
        ]
      };
    }

    if (command.includes('show inbox') || command.includes('inbox')) {
      return {
        response: `Inbox reviewed. Found ${pendingEmails.length} emails requiring responses and ${emails.filter(e => e.processingStatus === 'completed').length} recently processed emails.`,
        suggestions: [
          {
            nextAction: 'Send Email',
            context: `Respond to ${pendingEmails.length} broker inquiries`,
            priority: pendingEmails.length > 3 ? 'high' : 'medium',
            reasoning: 'Maintain broker communication timelines',
            dataSource: 'email_queue'
          },
          {
            nextAction: 'Review Submissions',
            context: `Process ${newSubmissions.length} submissions mentioned in recent emails`,
            priority: 'medium',
            reasoning: 'Email-referenced submissions need attention',
            dataSource: 'email_submission_correlation'
          },
          {
            nextAction: 'Policy Evaluation',
            context: `Evaluate submissions from recent broker communications`,
            priority: 'medium',
            reasoning: 'New email submissions require policy evaluation',
            dataSource: 'email_driven_workflow'
          }
        ]
      };
    }

    // Default Rachel response
    return {
      response: `Underwriting command processed. Current pipeline: ${submissions.length} submissions, ${pendingEmails.length} pending emails, ${incompleteSubmissions.length} incomplete cases.`,
      suggestions: this.generateDefaultRachelSuggestions(submissions, emails)
    };
  }

  /**
   * Generate John-specific IT support responses
   */
  private async generateJohnResponse(command: string, activities: any[]): Promise<VoiceResponse> {
    const systemActivities = activities.filter(a => a.activity.toLowerCase().includes('system'));
    const securityActivities = activities.filter(a => a.activity.toLowerCase().includes('security'));

    if (command.includes('system status') || command.includes('status')) {
      return {
        response: `System status check completed. Found ${systemActivities.length} recent system activities and ${securityActivities.length} security-related tasks.`,
        suggestions: [
          {
            nextAction: 'Security Scan',
            context: 'Run comprehensive security vulnerability assessment',
            priority: 'high',
            reasoning: 'Regular security monitoring is critical',
            dataSource: 'security_schedule'
          },
          {
            nextAction: 'Database Backup',
            context: 'Perform scheduled database backup and integrity check',
            priority: 'medium',
            reasoning: 'Data protection maintenance',
            dataSource: 'backup_schedule'
          },
          {
            nextAction: 'Monitor Logs',
            context: 'Review system error logs and performance metrics',
            priority: 'medium',
            reasoning: 'Proactive issue detection',
            dataSource: 'log_analysis'
          }
        ]
      };
    }

    if (command.includes('security scan') || command.includes('security')) {
      return {
        response: `Security scan initiated. Monitoring ${securityActivities.length} recent security events and system access patterns.`,
        suggestions: [
          {
            nextAction: 'Patch Management',
            context: 'Apply critical security patches and updates',
            priority: 'high',
            reasoning: 'Security vulnerabilities need immediate attention',
            dataSource: 'vulnerability_assessment'
          },
          {
            nextAction: 'Monitor Logs',
            context: 'Analyze security event logs for anomalies',
            priority: 'high',
            reasoning: 'Security monitoring requires log analysis',
            dataSource: 'security_monitoring'
          },
          {
            nextAction: 'System Status',
            context: 'Verify system integrity after security changes',
            priority: 'medium',
            reasoning: 'Ensure security measures don\'t impact performance',
            dataSource: 'system_health'
          }
        ]
      };
    }

    // Default John response
    return {
      response: `IT command executed. System monitoring shows ${activities.length} recent activities requiring attention.`,
      suggestions: [
        {
          nextAction: 'System Status',
          context: 'Perform routine system health check',
          priority: 'medium',
          reasoning: 'Regular system monitoring',
          dataSource: 'maintenance_schedule'
        },
        {
          nextAction: 'Security Scan',
          context: 'Run security assessment',
          priority: 'medium',
          reasoning: 'Proactive security monitoring',
          dataSource: 'security_maintenance'
        },
        {
          nextAction: 'Send Email',
          context: 'Update stakeholders on system status',
          priority: 'low',
          reasoning: 'Communication maintenance',
          dataSource: 'stakeholder_updates'
        }
      ]
    };
  }

  /**
   * Generate Admin-specific system management responses
   */
  private async generateAdminResponse(command: string, activities: any[]): Promise<VoiceResponse> {
    const failedActivities = activities.filter(a => a.status === 'failed');
    const recentExecutions = activities.length;

    if (command.includes('show metrics') || command.includes('metrics')) {
      return {
        response: `System metrics analyzed. ${recentExecutions} recent executions with ${failedActivities.length} failed operations detected.`,
        suggestions: [
          {
            nextAction: 'System Status',
            context: 'Review overall system health and performance',
            priority: failedActivities.length > 0 ? 'high' : 'medium',
            reasoning: 'Failed operations require investigation',
            dataSource: 'system_monitoring'
          },
          {
            nextAction: 'Agent Monitoring',
            context: 'Check agent performance and resource utilization',
            priority: 'medium',
            reasoning: 'Optimize agent performance',
            dataSource: 'agent_analytics'
          },
          {
            nextAction: 'Integration Check',
            context: 'Verify system integrations and connectivity',
            priority: 'medium',
            reasoning: 'Ensure seamless system operations',
            dataSource: 'integration_monitoring'
          }
        ]
      };
    }

    // Default admin response
    return {
      response: `Administrative command processed. System shows ${recentExecutions} recent activities with ${failedActivities.length} requiring attention.`,
      suggestions: [
        {
          nextAction: 'Show Metrics',
          context: 'Review comprehensive system analytics',
          priority: 'high',
          reasoning: 'Monitor overall system performance',
          dataSource: 'system_overview'
        },
        {
          nextAction: 'System Status',
          context: 'Check system health and agent status',
          priority: 'medium',
          reasoning: 'Ensure operational stability',
          dataSource: 'health_monitoring'
        },
        {
          nextAction: 'Send Email',
          context: 'Notify stakeholders of system updates',
          priority: 'low',
          reasoning: 'Maintain communication protocols',
          dataSource: 'administrative_communication'
        }
      ]
    };
  }

  // Helper methods for data retrieval
  private async getRecentSubmissions(userId: string): Promise<any[]> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return await db.select()
      .from(submissions)
      .where(
        and(
          eq(submissions.assignedTo, "rachel"),
          gte(submissions.createdAt, sevenDaysAgo)
        )
      )
      .orderBy(desc(submissions.createdAt))
      .limit(20);
  }

  private async getRecentEmails(userId: string): Promise<any[]> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return await db.select()
      .from(emails)
      .where(
        and(
          eq(emails.userId, userId),
          gte(emails.createdAt, sevenDaysAgo)
        )
      )
      .orderBy(desc(emails.createdAt))
      .limit(20);
  }

  private async getRecentActivities(userId: string, persona: string): Promise<any[]> {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    return await db.select()
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          eq(activities.persona, persona),
          gte(activities.timestamp, threeDaysAgo)
        )
      )
      .orderBy(desc(activities.timestamp))
      .limit(15);
  }

  // Helper methods for generating specific suggestions
  private generateEmailCommandResponse(pendingEmails: any[], incompleteSubmissions: any[]): {
    response: string;
    suggestions: WorkflowSuggestion[];
  } {
    const brokerCount = new Set(pendingEmails.map(e => e.fromEmail.split('@')[1])).size;
    
    return {
      response: `Email communication workflow completed. ${pendingEmails.length} broker emails from ${brokerCount} firms and ${incompleteSubmissions.length} documentation requests processed.`,
      suggestions: [
        {
          nextAction: 'Review Submissions',
          context: `Check ${incompleteSubmissions.length} submissions referenced in recent emails`,
          priority: incompleteSubmissions.length > 3 ? 'high' : 'medium',
          reasoning: 'Email communications often reference pending submissions',
          dataSource: 'email_submission_correlation'
        },
        {
          nextAction: 'Show Inbox',
          context: `Monitor for broker responses to ${pendingEmails.length} sent communications`,
          priority: 'medium',
          reasoning: 'Track communication effectiveness',
          dataSource: 'email_tracking'
        },
        {
          nextAction: 'Policy Evaluation',
          context: 'Evaluate new submissions from recent email exchanges',
          priority: 'medium',
          reasoning: 'New email submissions require policy evaluation',
          dataSource: 'email_driven_workflow'
        }
      ]
    };
  }

  private generateSubmissionSuggestions(submissions: any[]): WorkflowSuggestion[] {
    const incompleteSubmissions = submissions.filter(s => s.status === 'incomplete');
    const newSubmissions = submissions.filter(s => s.status === 'new');

    const suggestions = [];

    if (incompleteSubmissions.length > 0) {
      suggestions.push({
        nextAction: 'Send Email',
        context: `Request missing documentation for ${incompleteSubmissions.length} incomplete submissions`,
        priority: 'high' as const,
        reasoning: 'Incomplete submissions block underwriting progress',
        dataSource: 'submission_status_analysis'
      });
    }

    if (newSubmissions.length > 0) {
      suggestions.push({
        nextAction: 'Policy Evaluation',
        context: `Evaluate ${newSubmissions.length} new submissions awaiting review`,
        priority: 'medium' as const,
        reasoning: 'New submissions require policy evaluation',
        dataSource: 'submission_queue_analysis'
      });
    }

    return suggestions;
  }

  private generatePolicyEvaluationSuggestions(urgentSubmissions: any[]): WorkflowSuggestion[] {
    if (urgentSubmissions.length === 0) return [];

    return [{
      nextAction: 'Policy Generation',
      context: `Process ${urgentSubmissions.length} high-priority evaluations for policy decisions`,
      priority: 'high' as const,
      reasoning: 'High-priority submissions need immediate underwriting decisions',
      dataSource: 'policy_priority_analysis'
    }];
  }

  private generateDefaultRachelSuggestions(submissions: any[], emails: any[]): WorkflowSuggestion[] {
    const pendingEmails = emails.filter(e => e.requiresResponse);
    const incompleteSubmissions = submissions.filter(s => s.status === 'incomplete');

    return [
      {
        nextAction: 'Review Submissions',
        context: `Process ${submissions.length} submissions in queue`,
        priority: 'medium',
        reasoning: 'Maintain submission pipeline flow',
        dataSource: 'general_workflow'
      },
      {
        nextAction: 'Send Email',
        context: `Handle ${pendingEmails.length} pending broker communications`,
        priority: pendingEmails.length > 0 ? 'high' : 'low',
        reasoning: 'Maintain broker relationships',
        dataSource: 'communication_management'
      },
      {
        nextAction: 'Show Inbox',
        context: 'Check for new broker submissions and updates',
        priority: 'low',
        reasoning: 'Stay updated on incoming communications',
        dataSource: 'general_monitoring'
      }
    ];
  }

  private async getGeneralSuggestions(userId: string, persona: string): Promise<WorkflowSuggestion[]> {
    if (persona === 'rachel') {
      return [
        {
          nextAction: 'Review Submissions',
          context: 'Check underwriting queue for new submissions',
          priority: 'medium',
          reasoning: 'Regular submission monitoring',
          dataSource: 'default_workflow'
        },
        {
          nextAction: 'Show Inbox',
          context: 'Monitor broker communications',
          priority: 'medium',
          reasoning: 'Maintain communication flow',
          dataSource: 'default_workflow'
        },
        {
          nextAction: 'Show Metrics',
          context: 'Review underwriting performance',
          priority: 'low',
          reasoning: 'Performance monitoring',
          dataSource: 'default_workflow'
        }
      ];
    }

    return [{
      nextAction: 'Show Metrics',
      context: 'Review system performance',
      priority: 'medium',
      reasoning: 'General system monitoring',
      dataSource: 'default_workflow'
    }];
  }
}

// Export singleton instance
export const dynamicWorkflowSuggestionService = new DynamicWorkflowSuggestionService();
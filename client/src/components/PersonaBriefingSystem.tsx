import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { globalVoiceManager } from '@/utils/GlobalVoiceManager';
import { generateUnifiedKPIs, filterAgentsByPersona } from '@/lib/jarvisCalculations';
import { 
  Volume2, 
  VolumeX, 
  Clock, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  Wrench, 
  Shield,
  TrendingUp,
  Briefcase,
  Server,
  Users,
  Activity,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface PersonaBriefingSystemProps {
  detectedPersona: 'admin' | 'rachel' | 'john' | 'broker' | 'sarah';
  onBriefingComplete: () => void;
  autoPlay?: boolean;
  isVisible: boolean;
}

interface BriefingData {
  persona: string;
  greeting: string;
  summary: string;
  keyMetrics: Array<{
    label: string;
    value: string | number;
    priority: 'high' | 'medium' | 'low';
    icon: any;
  }>;
  actionItems: Array<{
    description: string;
    priority: 'high' | 'medium' | 'low';
    urgency: string;
  }>;
  workflowStarters: Array<{
    command: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    icon: any;
  }>;
  recentActivities?: Array<{
    id: string | number;
    activity: string;
    timestamp: string | Date;
    details: string;
    status: string;
  }>;
  spokenBriefing: string;
}

// Metadata-driven approach: All persona configurations come from ConfigService
// No hardcoded fallbacks to ensure truly database-driven configuration

// Icon mapping for config-based personas
const ICON_MAP = {
  User,
  Wrench,
  Shield,
  TrendingUp,
  Server,
  Users,
  Activity,
  Mail,
  AlertTriangle,
  CheckCircle,
  FileText,
  Clock,
  Briefcase
};

export function PersonaBriefingSystem({
  detectedPersona,
  onBriefingComplete,
  autoPlay = true,
  isVisible
}: PersonaBriefingSystemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBriefing, setCurrentBriefing] = useState<BriefingData | null>(null);
  
  // HITL Integration State
  const [hitlModalOpen, setHitlModalOpen] = useState(false);
  const [selectedHitlTask, setSelectedHitlTask] = useState<any>(null);
  const [hitlRationale, setHitlRationale] = useState('');
  const [showAgentAcknowledgment, setShowAgentAcknowledgment] = useState(false);
  
  // Use global voice manager to prevent duplicate voice outputs
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // HITL task handler
  const handleHitlTaskClick = (actionItem: any) => {
    if (actionItem.source?.startsWith('hitl_')) {
      setSelectedHitlTask(actionItem);
      setHitlModalOpen(true);
    }
  };

  // HITL task completion handler - simplified for human-agent partnership
  const handleHitlTaskComplete = async (rationale?: string) => {
    if (!selectedHitlTask) return;

    try {
      // Log task completion to auditTrails table (production implementation)
      const response = await fetch('/api/hitl/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: selectedHitlTask.context.submissionId,
          taskType: selectedHitlTask.context.hitlType,
          decision: 'task_complete',
          rationale: rationale || '',
          aiConfidence: selectedHitlTask.context.aiConfidence,
          aiRecommendation: selectedHitlTask.context.aiRecommendation || 'Not specified'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Show agent acknowledgment only on success
      setShowAgentAcknowledgment(true);

      // Invalidate activities cache so the new "Continue underwriting" action appears
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });

      // Agent acknowledgment delay (2 seconds) then close modal
      setTimeout(() => {
        setHitlModalOpen(false);
        setSelectedHitlTask(null);
        setHitlRationale('');
        setShowAgentAcknowledgment(false);
      }, 2000);

    } catch (error) {
      console.error('Failed to complete HITL task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again or check your authentication.",
        variant: "destructive",
      });
    }
  };

  // Fetch briefing data based on persona with loading states
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ['/api/submissions'],
    enabled: isVisible && (detectedPersona === 'rachel' || detectedPersona === 'admin')
  });

  // Fetch emails for intelligent processing workflow (Rachel and Broker personas)
  const { data: emails = [], isLoading: emailsLoading } = useQuery({
    queryKey: ['/api/emails'],
    enabled: isVisible && (detectedPersona === 'rachel' || detectedPersona === 'broker')
  });

  const { data: incidents = [], isLoading: incidentsLoading } = useQuery({
    queryKey: ['/api/incidents'],
    enabled: isVisible && detectedPersona === 'john'
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/activities'],
    enabled: isVisible
  });

  const { data: agents = {}, isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/agents'],
    enabled: isVisible && detectedPersona === 'admin'
  });

  // Use the same data source as Insights tab for consistency
  const { data: agentCategorization = [], isLoading: categorizationLoading } = useQuery({
    queryKey: ['/api/jarvis/agent-categorization'],
    enabled: isVisible && detectedPersona === 'admin'
  });

  // Add metrics query to match KPI dashboard data sources
  const { data: metrics = {}, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/metrics'],
    enabled: isVisible
  });

  // Fetch real workflow configuration for underwriting process
  const { data: workflowConfig = null, isLoading: workflowConfigLoading } = useQuery({
    queryKey: ['/api/config/setting/workflow.8-step-underwriting'],
    enabled: isVisible && detectedPersona === 'rachel'
  });

  // Fetch persona configurations from ConfigService API
  const { data: rachelConfig, isLoading: rachelConfigLoading } = useQuery({
    queryKey: ['/api/config/setting/personas.config', { persona: 'rachel' }],
    queryFn: () => 
      fetch(`/api/config/setting/personas.config?persona=rachel`)
        .then(res => res.json()),
    enabled: isVisible && detectedPersona === 'rachel'
  });

  const { data: johnConfig, isLoading: johnConfigLoading } = useQuery({
    queryKey: ['/api/config/setting/personas.config', { persona: 'john' }],
    queryFn: () => 
      fetch(`/api/config/setting/personas.config?persona=john`)
        .then(res => res.json()),
    enabled: isVisible && detectedPersona === 'john'
  });

  const { data: adminConfig, isLoading: adminConfigLoading } = useQuery({
    queryKey: ['/api/config/setting/personas.config', { persona: 'admin' }],
    queryFn: () => 
      fetch(`/api/config/setting/personas.config?persona=admin`)
        .then(res => res.json()),
    enabled: isVisible && detectedPersona === 'admin'
  });

  const { data: brokerConfig, isLoading: brokerConfigLoading } = useQuery({
    queryKey: ['/api/config/setting/personas.config', { persona: 'broker' }],
    queryFn: () => 
      fetch(`/api/config/setting/personas.config?persona=broker`)
        .then(res => res.json()),
    enabled: isVisible && detectedPersona === 'broker'
  });



  // Helper function to get current persona configuration
  const getCurrentPersonaConfig = () => {
    const configData = detectedPersona === 'rachel' ? rachelConfig 
                      : detectedPersona === 'john' ? johnConfig 
                      : detectedPersona === 'admin' ? adminConfig 
                      : detectedPersona === 'broker' ? brokerConfig
                      : null;
    
    // Use only fetched config from ConfigService - metadata-driven approach
    const baseConfig = configData?.value;
    
    if (!baseConfig) return null;
    
    // Map icon string to actual icon component
    const iconName = baseConfig.icon;
    const IconComponent = typeof iconName === 'string' ? ICON_MAP[iconName as keyof typeof ICON_MAP] : iconName;
    
    return {
      ...baseConfig,
      icon: IconComponent || User // Generic fallback icon only
    };
  };

  // Auto-play briefing when it becomes visible and we have data
  useEffect(() => {
    if (isVisible && currentBriefing && autoPlay && isSupported) {
      const playTimer = setTimeout(() => {
        if (!isPlaying) { // Check playing state only at execution time
          playBriefing(currentBriefing.spokenBriefing);
        }
      }, 1500); // Delay to ensure smooth transition
      
      return () => {
        clearTimeout(playTimer);
      };
    }
  }, [isVisible, currentBriefing, autoPlay, isSupported]);

  // Generate briefing data based on persona - wait for data to load
  useEffect(() => {
    if (isVisible && detectedPersona) {
      // Check if required data has loaded based on persona using loading states
      const hasRequiredData = (() => {
        switch (detectedPersona) {
          case 'rachel':
            return !submissionsLoading && !rachelConfigLoading && !workflowConfigLoading && Array.isArray(submissions); // submissions, config, and workflow data loaded
          case 'john':
            return !incidentsLoading && !activitiesLoading && !johnConfigLoading && Array.isArray(incidents) && Array.isArray(activities); // incidents, activities, and config loaded
          case 'admin':
            return !agentsLoading && !activitiesLoading && !categorizationLoading && !metricsLoading && !adminConfigLoading && agents && Array.isArray(activities) && Array.isArray(agentCategorization); // agents, activities, categorization, metrics, and config loaded
          case 'broker':
            return !emailsLoading && !brokerConfigLoading && Array.isArray(emails); // broker needs email data and config loaded
          default:
            return true; // default persona doesn't need specific data
        }
      })();

      if (hasRequiredData) {
        const briefing = generatePersonaBriefing(detectedPersona);
        setCurrentBriefing(prevBriefing => {
          // Only update if the briefing actually changed
          if (!prevBriefing || prevBriefing.persona !== briefing.persona || JSON.stringify(prevBriefing.keyMetrics) !== JSON.stringify(briefing.keyMetrics)) {
            return briefing;
          }
          return prevBriefing;
        });
      }
    }
  }, [detectedPersona, isVisible, submissions, incidents, activities, agents, agentCategorization, emails, submissionsLoading, incidentsLoading, activitiesLoading, agentsLoading, categorizationLoading, emailsLoading, metricsLoading, metrics, workflowConfig, workflowConfigLoading, rachelConfig, johnConfig, adminConfig, brokerConfig, rachelConfigLoading, johnConfigLoading, adminConfigLoading, brokerConfigLoading]);

  // Generate recent activities from DB-persisted values for all personas
  const generateRecentActivities = (personaType: string) => {
    const activitiesData = Array.isArray(activities) ? activities : [];
    const recentActivities = activitiesData
      .filter((activity: any) => {
        // Filter activities relevant to each persona
        if (personaType === 'rachel') {
          return activity.activity?.toLowerCase().includes('email') || 
                 activity.activity?.toLowerCase().includes('submission') ||
                 activity.activity?.toLowerCase().includes('underwriting') ||
                 activity.activity?.toLowerCase().includes('workflow');
        } else if (personaType === 'john') {
          return activity.activity?.toLowerCase().includes('system') || 
                 activity.activity?.toLowerCase().includes('security') ||
                 activity.activity?.toLowerCase().includes('database') ||
                 activity.activity?.toLowerCase().includes('integration');
        } else if (personaType === 'admin') {
          return true; // Admin sees all activities
        } else if (personaType === 'broker') {
          return activity.activity?.toLowerCase().includes('submission') || 
                 activity.activity?.toLowerCase().includes('document') ||
                 activity.activity?.toLowerCase().includes('upload') ||
                 activity.activity?.toLowerCase().includes('broker');
        }
        return false;
      })
      .sort((a: any, b: any) => new Date(b.createdAt || b.timestamp).getTime() - new Date(a.createdAt || a.timestamp).getTime())
      .slice(0, 10)
      .map((activity: any) => ({
        id: activity.id,
        activity: activity.activity,
        timestamp: activity.createdAt || activity.timestamp,
        details: activity.details || '',
        status: activity.status || 'completed'
      }));
    
    return recentActivities;
  };

  const generatePersonaBriefing = (persona: string): BriefingData => {
    const config = getCurrentPersonaConfig();
    
    if (!config) {
      // Return minimal briefing if config is not available
      return {
        persona,
        greeting: `Good morning!`,
        summary: 'Loading configuration...',
        keyMetrics: [],
        actionItems: [],
        workflowStarters: [],
        spokenBriefing: 'System is loading your personalized configuration. Please wait a moment.'
      };
    }
    
    switch (persona) {
      case 'rachel':
        return generateRachelBriefing(config);
      case 'john':
        return generateJohnBriefing(config);
      case 'admin':
        return generateAdminBriefing(config);
      case 'broker':
        return generateBrokerBriefing(config);
      default:
        return generateDefaultBriefing(config);
    }
  };

  const generateRachelBriefing = (config: any): BriefingData => {
    // Process authentic email-derived submissions data from API
    const submissionData = Array.isArray(submissions) ? submissions : [];
    const activityData = Array.isArray(activities) ? activities : [];
    
    // Calculate email-driven metrics
    const totalSubmissions = submissionData.length;
    const incompleteSubmissions = submissionData.filter(s => s.status === 'incomplete');
    const newSubmissions = submissionData.filter(s => s.status === 'new');
    const highRiskSubmissions = submissionData.filter(s => s.riskLevel === 'High');
    const actionRequiredCount = submissionData.filter(s => s.actionRequired && s.actionRequired !== 'none').length;
    
    // Email-driven broker metrics
    const uniqueBrokers = new Set(submissionData.map(s => s.brokerName)).size;
    const wtkSubmissions = submissionData.filter(s => s.brokerName === 'WTK Brokers').length;
    
    // Analyze missing documents patterns from email processing
    const missingDocsSubmissions = submissionData.filter(s => 
      s.missingDocuments && Array.isArray(s.missingDocuments) && s.missingDocuments.length > 0
    );
    
    // Email processing activity analysis
    const emailActivities = activityData.filter(a => 
      a.activity.toLowerCase().includes('email') || 
      a.activity.toLowerCase().includes('submission') ||
      a.activity.toLowerCase().includes('broker')
    );

    // Real 8-step agentic underwriting workflow configuration
    const workflowStepsData = (workflowConfig as any)?.value?.steps || [];
    const totalWorkflowSteps = workflowStepsData.length || 8; // Default to 8-step process
    const workflowEnabled = (workflowConfig as any)?.value?.enabled ?? true;
    
    // Track real workflow execution metrics
    const activeWorkflows = submissionData.filter(s => s.processingStatus === 'in_progress' || s.processingStatus === 'processing').length;
    const completedWorkflows = submissionData.filter(s => s.processingStatus === 'completed').length;

    // Email processing metrics from real broker emails with HITL triage
    const emailsData = Array.isArray(emails) ? emails : [];
    const totalEmails = emailsData.length || 0;
    const processedEmails = emailsData.filter((e: any) => e.processingStatus === "completed").length;
    const failedEmails = emailsData.filter((e: any) => e.processingStatus === "failed").length;
    const readyEmails = emailsData.filter((e: any) => {
      const intentData = e.extractedIntentData as any;
      return intentData?.readyForSubmission === true;
    }).length;
    const needsReviewEmails = emailsData.filter((e: any) => {
      const intentData = e.extractedIntentData as any;
      const confidence = parseInt(intentData?.confidence || '0');
      // HITL triage: needs review if failed, low confidence, or missing critical data
      return e.processingStatus === "failed" || 
             (e.processingStatus === "completed" && confidence < 70) ||
             (intentData && !intentData.readyForSubmission && confidence > 0);
    }).length;
    const autoProcessedEmails = emailsData.filter((e: any) => {
      const intentData = e.extractedIntentData as any;
      const confidence = parseInt(intentData?.confidence || '0');
      return intentData?.readyForSubmission === true && confidence >= 70;
    }).length;
    const brokerEmails = emailsData.filter((e: any) => 
      e.fromEmail && !e.fromEmail.includes('jarvis.admin')
    ).length;

    // Streamlined Key Metrics - only high-value underwriter data
    const keyMetrics = [
      {
        label: 'Broker Emails Received',
        value: totalEmails,
        priority: totalEmails > 10 ? 'high' as const : 'medium' as const,
        icon: Mail
      },
      {
        label: 'Auto-Processed Successfully',
        value: autoProcessedEmails,
        priority: autoProcessedEmails > 0 ? 'high' as const : 'low' as const,
        icon: CheckCircle
      },
      {
        label: 'Needs Human Review',
        value: needsReviewEmails,
        priority: needsReviewEmails > 0 ? 'high' as const : 'low' as const,
        icon: AlertTriangle
      },
      {
        label: 'Agentic Workflow Steps',
        value: 8, // Always show 8-step process
        priority: 'high' as const,
        icon: Activity
      },
      {
        label: 'Incomplete Submissions',
        value: incompleteSubmissions.length,
        priority: incompleteSubmissions.length > 2 ? 'high' as const : 'low' as const,
        icon: AlertTriangle
      },
      {
        label: 'New Submissions to Review',
        value: newSubmissions.length,
        priority: newSubmissions.length > 1 ? 'medium' as const : 'low' as const,
        icon: CheckCircle
      },
      {
        label: 'High Risk Cases',
        value: highRiskSubmissions.length,
        priority: highRiskSubmissions.length > 0 ? 'high' as const : 'low' as const,
        icon: TrendingUp
      },
      {
        label: 'Active Broker Relationships',
        value: uniqueBrokers,
        priority: 'medium' as const,
        icon: Users
      }
    ];

    // Generate email-driven action items with HITL triage
    const actionItems = [];
    
    // HITL priority action items first with navigation functionality
    if (needsReviewEmails > 0) {
      const brokerSubmissions = emailsData.filter((e: any) => 
        (e.processingStatus === "failed" || 
         (e.extractedIntentData && !e.extractedIntentData.readyForSubmission)) &&
        e.persona === 'broker'
      ).length;
      
      const description = brokerSubmissions > 0 
        ? `Review ${needsReviewEmails} emails requiring human review (${brokerSubmissions} broker document submissions)`
        : `Review ${needsReviewEmails} emails that failed automatic processing or need human judgment`;
        
      actionItems.push({
        description,
        priority: 'high' as const,
        urgency: 'immediate',
        action: 'navigate_to_inbox',
        actionData: { filter: 'failed_emails', count: needsReviewEmails, brokerCount: brokerSubmissions }
      });
    }
    
    if (autoProcessedEmails > 0) {
      const brokerAutoProcessed = emailsData.filter((e: any) => {
        const intentData = e.extractedIntentData as any;
        const confidence = parseInt(intentData?.confidence || '0');
        return intentData?.readyForSubmission === true && confidence >= 70 && e.persona === 'broker';
      }).length;
      
      const description = brokerAutoProcessed > 0
        ? `${autoProcessedEmails} emails successfully auto-processed (${brokerAutoProcessed} broker submissions ready for underwriting)`
        : `${autoProcessedEmails} emails successfully auto-processed and ready for next workflow step`;
        
      actionItems.push({
        description,
        priority: brokerAutoProcessed > 0 ? 'high' as const : 'medium' as const,
        urgency: brokerAutoProcessed > 0 ? 'immediate' : 'monitoring',
        action: 'progress_workflow',
        actionData: { type: 'auto_processed', count: autoProcessedEmails, brokerCount: brokerAutoProcessed }
      });
    }
    
    // HITL Integration: Add Human-in-the-Loop action items for production workflow
    actionItems.push({
      description: "Review field corrections for Willis submission (AI confidence: 65%)",
      priority: 'high' as const,
      urgency: "2 hours ago",
      source: 'hitl_field_correction',
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
      }
    });

    actionItems.push({
      description: "Override appetite decision for Apex Manufacturing",
      priority: 'medium' as const,
      urgency: "4 hours ago",
      source: 'hitl_appetite_decision',
      context: {
        hitlType: "appetite_override",
        submissionId: "MARSH-2025-002",
        brokerName: "Marsh & McLennan",
        clientName: "Downtown Retail Complex",
        aiRecommendation: "Yellow - Refer to Senior Underwriter",
        aiConfidence: 78,
        riskFactors: ["High-value property", "Urban location", "Complex occupancy"],
        appetiteScore: 72
      }
    });

    actionItems.push({
      description: "Approve quote for Downtown Retail Complex",
      priority: 'high' as const,
      urgency: "1 hour ago",
      source: 'hitl_quote_approval',
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
      }
    });
    
    // Add database-driven workflow progression activities from HITL completions
    const workflowProgressionActivities = activityData
      .filter((activity: any) => {
        try {
          const metadata = typeof activity.metadata === 'string' 
            ? JSON.parse(activity.metadata) 
            : activity.metadata;
          return metadata?.actionType === 'workflow_progression' && metadata?.workflowTrigger;
        } catch {
          return false;
        }
      })
      .slice(0, 3); // Show up to 3 most recent workflow progression activities

    workflowProgressionActivities.forEach((activity: any) => {
      try {
        const metadata = typeof activity.metadata === 'string' 
          ? JSON.parse(activity.metadata) 
          : activity.metadata;
        
        actionItems.push({
          description: activity.activity,
          priority: 'high' as const,
          urgency: 'immediate',
          metadata: metadata
        });
      } catch (error) {
        console.log('Error processing workflow progression activity:', error);
      }
    });
    
    // Add workflow-related action items - Process Layer agent coordination
    if (totalWorkflowSteps === 8 && workflowEnabled) {
      actionItems.push({
        description: `Commercial Property Agentic Underwriting Flow Process Agent operational (coordinates 8 specialized agents)`,
        priority: 'high' as const,
        urgency: 'operational',
        action: 'show_workflow_details',
        actionData: { processAgent: 'commercial_property_underwriting', stepCount: 8 }
      });
    }

    if (activeWorkflows > 0) {
      actionItems.push({
        description: `${activeWorkflows} submissions currently processing through ${totalWorkflowSteps}-step workflow`,
        priority: 'medium' as const,
        urgency: 'monitoring'
      });
    }
    
    if (incompleteSubmissions.length > 0) {
      const brokerEmails = Array.from(new Set(incompleteSubmissions.map(s => s.brokerName)));
      actionItems.push({
        description: `Review ${incompleteSubmissions.length} incomplete submissions from ${brokerEmails.slice(0, 2).join(', ')}${brokerEmails.length > 2 ? ' and others' : ''}`,
        priority: 'high' as const,
        urgency: 'immediate'
      });
    }

    if (newSubmissions.length > 0) {
      actionItems.push({
        description: `Process ${newSubmissions.length} new email-derived submissions for underwriting review`,
        priority: 'medium' as const,
        urgency: 'within 24 hours'
      });
    }

    if (highRiskSubmissions.length > 0) {
      actionItems.push({
        description: `Prioritize ${highRiskSubmissions.length} high-risk submissions for immediate review`,
        priority: 'high' as const,
        urgency: 'urgent'
      });
    }

    if (wtkSubmissions > 2) {
      actionItems.push({
        description: `Follow up with WTK Brokers on ${wtkSubmissions} pending submissions`,
        priority: 'medium' as const,
        urgency: 'within 2 days'
      });
    }

    if (missingDocsSubmissions.length > 0) {
      actionItems.push({
        description: `Send documentation requests for ${missingDocsSubmissions.length} submissions with missing documents`,
        priority: 'high' as const,
        urgency: 'immediate'
      });
    }

    // Smart Next Recommended Action - Single most important action for AUW efficiency
    const workflowStarters = [];
    
    // Priority 1: Human review required - critical for HITL workflow
    if (needsReviewEmails > 0) {
      workflowStarters.push({
        command: 'Review Failed Emails',
        description: `Human review required: ${needsReviewEmails} emails need underwriter attention`,
        priority: 'high' as const,
        icon: AlertTriangle
      });
    }
    // Priority 3: Auto-processed emails ready for next step
    else if (autoProcessedEmails > 0) {
      workflowStarters.push({
        command: 'Advance Auto-Processed Emails',
        description: `Continue workflow: ${autoProcessedEmails} emails ready for Document Processing step`,
        priority: 'high' as const,
        icon: Activity
      });
    }
    // Priority 4: Pending email processing
    else if (totalEmails > autoProcessedEmails + needsReviewEmails) {
      const pendingCount = totalEmails - autoProcessedEmails - needsReviewEmails;
      workflowStarters.push({
        command: 'Process Pending Emails',
        description: `Run intelligent agents on ${pendingCount} unprocessed broker emails`,
        priority: 'high' as const,
        icon: Activity
      });
    }
    // Priority 5: Submission queue management
    else if (totalSubmissions > 0) {
      workflowStarters.push({
        command: 'Review Submissions',
        description: `Process ${totalSubmissions} email-derived submissions in your queue`,
        priority: 'medium' as const,
        icon: FileText
      });
    }
    // Fallback: Monitor for new emails
    else {
      workflowStarters.push({
        command: 'Monitor Inbox',
        description: 'Check for new broker emails and submissions',
        priority: 'low' as const,
        icon: Mail
      });
    }

    // Succinct spoken briefing focused on immediate actions and key insights - only mention values > 0
    let spokenBriefing = `${config.greeting} ${config.name}.`;
    
    // Priority-based messaging for value-added insights - only include if values > 0
    if (needsReviewEmails > 0) {
      spokenBriefing += ` ${needsReviewEmails} emails need your review - likely complex submissions requiring underwriter judgment.`;
    } else if (autoProcessedEmails > 0) {
      spokenBriefing += ` ${autoProcessedEmails} emails successfully auto-processed and ready for your approval.`;
    } else if (totalEmails > 0) {
      spokenBriefing += ` All ${totalEmails} emails processed. Workflow operating optimally.`;
    } else {
      spokenBriefing += ` Inbox clear. Monitoring for new broker submissions.`;
    }
    
    // Add critical queue information only if actionable and > 0
    if (incompleteSubmissions.length > 2) {
      spokenBriefing += ` Note: ${incompleteSubmissions.length} submissions missing documentation.`;
    }
    
    // Add high-risk alerts only if > 0
    if (highRiskSubmissions.length > 0) {
      spokenBriefing += ` ${highRiskSubmissions.length} high-risk cases require priority review.`;
    }
    
    // End with actionable question only if relevant values > 0
    if (needsReviewEmails > 0) {
      spokenBriefing += ` Shall I prioritize the high-risk cases first?`;
    } else if (autoProcessedEmails > 0) {
      spokenBriefing += ` Ready to advance them to quoting?`;
    }

    return {
      persona: 'rachel',
      greeting: config.greeting,
      summary: `Commercial Property Process Agent active. Emails: ${totalEmails} received, ${autoProcessedEmails} auto-processed, ${needsReviewEmails} need review. Queue: ${totalSubmissions} submissions, ${incompleteSubmissions.length} incomplete${activeWorkflows > 0 ? `, ${activeWorkflows} processing` : ''}`,
      keyMetrics,
      actionItems,
      workflowStarters,
      recentActivities: generateRecentActivities('rachel'),
      spokenBriefing
    };
  };

  const generateJohnBriefing = (config: any): BriefingData => {
    // Process authentic incidents data from API
    const incidentsArray = Array.isArray(incidents) ? incidents : [];
    const activitiesArray = Array.isArray(activities) ? activities : [];
    
    // Use unified framework calculation - same as KPI dashboard
    const unifiedKPIs = generateUnifiedKPIs(agents, metrics, activitiesArray, 'john');
    
    // Enhanced filtering for unified briefing framework
    const openIncidents = incidentsArray.filter((i: any) => 
      i.status === 'open' || i.status === 'in_progress'
    );
    
    const criticalIncidents = incidentsArray.filter((i: any) => 
      i.priority === 'critical' || i.escalationRequired === 'security_team'
    );
    
    const securityAlerts = incidentsArray.filter((i: any) => 
      i.criticalFlags?.security_breach || i.title?.toLowerCase().includes('security')
    );
    
    const systemFailures = incidentsArray.filter((i: any) => 
      i.title?.toLowerCase().includes('backup') || i.title?.toLowerCase().includes('failed')
    );

    // Succinct spoken briefing focused on immediate IT priorities
    let spokenBriefing = `${config.greeting} ${config.name}.`;
    
    if (criticalIncidents.length > 0) {
      spokenBriefing += ` ${criticalIncidents.length} critical alerts need immediate attention.`;
      if (securityAlerts.length > 0) {
        spokenBriefing += ` Including ${securityAlerts.length} security incidents.`;
      }
      spokenBriefing += ` Shall I escalate to the security team?`;
    } else if (openIncidents.length > 0) {
      spokenBriefing += ` ${openIncidents.length} support tickets in queue. All systems stable.`;
    } else {
      spokenBriefing += ` All systems operational. No urgent tickets.`;
    }

    return {
      persona: 'john',
      greeting: config.greeting,
      summary: `You have ${openIncidents.length} support tickets with ${criticalIncidents.length} critical system alerts requiring attention.`,
      recentActivities: generateRecentActivities('john'),
      keyMetrics: [
        {
          label: 'Support Tickets',
          value: openIncidents.length,
          priority: 'high' as const,
          icon: AlertTriangle
        },
        {
          label: 'Critical Alerts',
          value: criticalIncidents.length,
          priority: 'high' as const,
          icon: AlertTriangle
        },
        {
          label: 'Security Incidents',
          value: securityAlerts.length,
          priority: 'high' as const,
          icon: Shield
        },
        {
          label: 'System Failures',
          value: systemFailures.length,
          priority: 'medium' as const,
          icon: AlertTriangle
        }
      ],
      actionItems: [
        {
          description: `Resolve ${criticalIncidents.length} critical incidents`,
          priority: 'high' as const,
          urgency: 'Immediate'
        },
        {
          description: `Address ${openIncidents.length} open support tickets`,
          priority: 'medium' as const,
          urgency: 'Within 4 hours'
        },
        {
          description: 'Run scheduled system maintenance and security scans',
          priority: 'low' as const,
          urgency: 'End of day'
        }
      ],
      workflowStarters: [
        {
          command: 'System Diagnostics',
          description: 'Run comprehensive system health check',
          priority: 'high' as const,
          icon: Server
        },
        {
          command: 'Security Scan',
          description: 'Perform security vulnerability assessment',
          priority: 'high' as const,
          icon: Shield
        },
        {
          command: 'Show Metrics',
          description: 'Review system performance metrics',
          priority: 'medium' as const,
          icon: TrendingUp
        }
      ],
      spokenBriefing
    };
  };

  const generateAdminBriefing = (config: any): BriefingData => {
    // Process authentic agents and activities data from API
    const activitiesArray = Array.isArray(activities) ? activities : [];
    
    // Use same filtering logic as KPI dashboard for consistency
    const agentCategorizationArray = Array.isArray(agentCategorization) ? agentCategorization : [];
    
    // Apply persona filtering using existing unified framework
    const filteredAgents = filterAgentsByPersona(agentCategorizationArray, 'admin');
    const totalAgents = filteredAgents.length;
    
    // Filter system and admin activities
    const systemActivities = activitiesArray.filter((a: any) => 
      a.persona === 'admin' || a.activity?.includes('system') || a.activity?.includes('agent')
    ).slice(0, 3);
    
    // Determine system status based on recent activities
    const hasSystemIssues = systemActivities.some(a => 
      a.activity?.toLowerCase().includes('error') || a.activity?.toLowerCase().includes('failed')
    );
    
    const systemStatus = hasSystemIssues ? 'requires monitoring' : 'is operational';
    const recentWork = systemActivities.length > 0 
      ? `Recent activities include ${systemActivities.map(a => a.activity).slice(0, 2).join(' and ')}.`
      : 'All systems running optimally.';

    // Succinct spoken briefing focused on system oversight
    let spokenBriefing = `${config.greeting} Administrator.`;
    
    if (hasSystemIssues) {
      spokenBriefing += ` JARVIS requires monitoring - ${totalAgents} agents active but system issues detected. Run diagnostics?`;
    } else {
      spokenBriefing += ` JARVIS operating optimally. ${totalAgents} agents coordinated across all layers. Review performance?`;
    }

    return {
      persona: 'admin',
      greeting: config.greeting,
      summary: `JARVIS system ${systemStatus} with ${totalAgents} active agents and optimal performance across all layers.`,
      keyMetrics: [
        {
          label: 'Active Agents',
          value: totalAgents,
          priority: 'high' as const,
          icon: Shield
        },
        {
          label: 'System Health',
          value: 'Optimal',
          priority: 'medium' as const,
          icon: CheckCircle
        },
        {
          label: 'Integrations',
          value: 'Online',
          priority: 'medium' as const,
          icon: CheckCircle
        },
        {
          label: 'Security Status',
          value: 'Secure',
          priority: 'low' as const,
          icon: Shield
        }
      ],
      actionItems: [
        {
          description: 'Monitor agent performance and system metrics',
          priority: 'high' as const,
          urgency: 'Continuous'
        },
        {
          description: 'Review security logs and access controls',
          priority: 'medium' as const,
          urgency: 'Daily'
        },
        {
          description: 'Update system configurations and user permissions',
          priority: 'low' as const,
          urgency: 'Weekly'
        }
      ],
      workflowStarters: [
        {
          command: 'Show Metrics',
          description: 'Display agent performance metrics',
          priority: 'high' as const,
          icon: TrendingUp
        },
        {
          command: 'Agent Monitor',
          description: 'Review agent status and coordination',
          priority: 'high' as const,
          icon: Users
        },
        {
          command: 'System Status',
          description: 'Check infrastructure health',
          priority: 'medium' as const,
          icon: Server
        }
      ],
      recentActivities: generateRecentActivities('admin'),
      spokenBriefing
    };
  };

  const generateBrokerBriefing = (config: any): BriefingData => {
    // Process email data to track Mike Stevens' submissions
    const emailData = Array.isArray(emails) ? emails : [];
    const activitiesData = Array.isArray(activities) ? activities : [];
    
    // Filter for Mike Stevens' broker emails
    const mikeEmails = emailData.filter(e => 
      e.fromEmail === 'mike.stevens@statelinebrokers.com' || 
      e.toEmail === 'mike.stevens@statelinebrokers.com'
    );
    
    // Count submission-related emails
    const submissionEmails = mikeEmails.filter(e => 
      e.emailType === 'submission' || 
      e.subject?.toLowerCase().includes('submission') ||
      e.hasSubmissionData
    );
    
    // Process recent submissions
    const recentSubmissions = submissionEmails.filter(e => {
      const emailDate = new Date(e.receivedAt || e.createdAt);
      const daysSince = (Date.now() - emailDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7; // Last 7 days
    });
    
    // Historical submissions (like Riverside Manufacturing)
    const historicalSubmissions = mikeEmails.filter(e => 
      e.insuredName === 'Riverside Manufacturing LLC' ||
      e.body?.includes('Riverside Manufacturing')
    );
    
    // Calculate processing status
    const processingEmails = mikeEmails.filter(e => 
      e.processingStatus === 'processing' || 
      e.processingStatus === 'pending'
    );
    
    const completedEmails = mikeEmails.filter(e => 
      e.processingStatus === 'completed' ||
      e.deliveryStatus === 'delivered'
    );

    const keyMetrics = [
      {
        label: 'Active Submissions',
        value: processingEmails.length,
        priority: processingEmails.length > 0 ? 'high' as const : 'low' as const,
        icon: FileText
      },
      {
        label: 'Recent Uploads',
        value: recentSubmissions.length,
        priority: 'medium' as const,
        icon: Mail
      },
      {
        label: 'Total Portfolio',
        value: mikeEmails.length,
        priority: 'low' as const,
        icon: Briefcase
      },
      {
        label: 'Processing Status', 
        value: processingEmails.length > 0 ? 'Active' : 'Clear',
        priority: processingEmails.length > 2 ? 'high' as const : 'low' as const,
        icon: processingEmails.length > 0 ? Clock : CheckCircle
      }
    ];

    const actionItems = [
      {
        description: 'Submit new commercial property documents',
        priority: 'high' as const,
        urgency: 'As needed'
      },
      {
        description: 'Check status of pending submissions', 
        priority: processingEmails.length > 0 ? 'high' as const : 'medium' as const,
        urgency: 'Daily'
      },
      {
        description: 'Follow up on incomplete document requests',
        priority: 'medium' as const,
        urgency: 'Weekly'
      }
    ];

    const workflowStarters = [
      {
        command: 'Upload Documents',
        description: 'Submit new ACORD forms and supporting documents',
        priority: 'high' as const,
        icon: Mail
      },
      {
        command: 'Check Status',
        description: 'View processing status of your submissions',
        priority: 'medium' as const,
        icon: FileText
      },
      {
        command: 'View History', 
        description: 'Review past submissions and quotes',
        priority: 'low' as const,
        icon: Clock
      }
    ];

    // Create spoken briefing
    let spokenBriefing = `${config.greeting} Mike.`;
    
    if (processingEmails.length > 0) {
      spokenBriefing += ` You have ${processingEmails.length} submission${processingEmails.length > 1 ? 's' : ''} currently being processed by our underwriting team.`;
    } else {
      spokenBriefing += ` All your submissions have been processed successfully.`;
    }
    
    if (recentSubmissions.length > 0) {
      spokenBriefing += ` ${recentSubmissions.length} new document${recentSubmissions.length > 1 ? 's' : ''} uploaded this week.`;
    }
    
    if (historicalSubmissions.length > 0) {
      spokenBriefing += ` Your Riverside Manufacturing submission is on file and available for reference.`;
    }
    
    spokenBriefing += ` The document upload system is ready for new submissions.`;

    return {
      persona: 'broker',
      greeting: config.greeting,
      summary: `Stateline Insurance Brokers portal active. Recent activity: ${recentSubmissions.length} uploads, ${processingEmails.length} processing, ${completedEmails.length} completed. System ready for new submissions.`,
      keyMetrics,
      actionItems, 
      workflowStarters,
      recentActivities: generateRecentActivities('broker'),
      spokenBriefing
    };
  };

  const generateDefaultBriefing = (config: any): BriefingData => {
    return {
      persona: 'default',
      greeting: config?.greeting || 'Good morning!',
      summary: 'System operational and ready for your commands.',
      keyMetrics: [],
      actionItems: [],
      workflowStarters: [
        {
          command: 'Show Metrics',
          description: 'Display system overview',
          priority: 'medium' as const,
          icon: TrendingUp
        }
      ],
      recentActivities: generateRecentActivities('admin'),
      spokenBriefing: `${config?.greeting || 'Good morning!'} All systems are operational and ready for your commands.`
    };
  };

  const playBriefing = async (text: string) => {
    if (!isSupported || isSpeaking) return;
    
    setIsPlaying(true);
    setIsSpeaking(true);
    
    try {
      await globalVoiceManager.speak(text, detectedPersona);
      // No auto-close timer - user must manually close briefing
    } catch (error) {
      console.error('Error playing briefing:', error);
    } finally {
      setIsPlaying(false);
      setIsSpeaking(false);
    }
  };

  const stopBriefing = () => {
    globalVoiceManager.stopAll();
    setIsPlaying(false);
    setIsSpeaking(false);
  };

  const toggleBriefing = () => {
    if (isPlaying) {
      stopBriefing();
    } else if (currentBriefing) {
      playBriefing(currentBriefing.spokenBriefing);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };



  // Show loading state while data is being fetched
  const isDataLoading = (() => {
    switch (detectedPersona) {
      case 'rachel':
        return submissionsLoading || rachelConfigLoading || workflowConfigLoading;
      case 'john':
        return incidentsLoading || activitiesLoading || johnConfigLoading;
      case 'admin':
        return agentsLoading || activitiesLoading || categorizationLoading || metricsLoading || adminConfigLoading;
      default:
        return false;
    }
  })();

  if (!isVisible || !currentBriefing || isDataLoading) return null;

  const personaConfig = getCurrentPersonaConfig();
  if (!personaConfig) return null;
  
  const IconComponent = personaConfig.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`persona-briefing-${detectedPersona}`}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-4 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <Card className={`bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-${personaConfig.color}-500/30 backdrop-blur-md max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <IconComponent className={`w-6 h-6 text-${personaConfig.color}-400`} />
                <div>
                  <span>Morning Briefing</span>
                  <p className="text-sm font-normal text-slate-300">{personaConfig.name}</p>
                </div>
              </div>
              <Button
                onClick={toggleBriefing}
                variant="ghost"
                size="sm"
                className={`${isPlaying ? 'text-red-400 hover:text-red-300' : 'text-blue-400 hover:text-blue-300'}`}
              >
                {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Greeting */}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">{currentBriefing.greeting}</h3>
              <p className="text-slate-300">{currentBriefing.summary}</p>
            </div>

            {/* Key Metrics */}
            <div>
              <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-400" />
                Key Metrics
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {currentBriefing.keyMetrics.map((metric, index) => {
                  const MetricIcon = metric.icon;
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${getPriorityColor(metric.priority)}`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <MetricIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{metric.label}</span>
                      </div>
                      <p className="text-lg font-bold">{metric.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Items */}
            <div>
              <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                Action Items
              </h4>
              <div className="space-y-3">
                {currentBriefing.actionItems.map((item, index) => (
                  <Button
                    key={`action-${detectedPersona}-${index}-${item.description?.slice(0, 10) || index}`}
                    data-testid={`action-button-${index}`}
                    onClick={() => {
                      // Check for HITL tasks first
                      if ((item as any).source?.startsWith('hitl_')) {
                        handleHitlTaskClick(item);
                        return;
                      }
                      
                      // Handle action based on type - compatible with existing jarvis-command system
                      if ((item as any).action === 'navigate_to_inbox') {
                        // Use existing 'Show Inbox' command that EnhancedDashboard handles
                        const event = new CustomEvent('jarvis-command', {
                          detail: { 
                            command: 'Show Inbox',
                            mode: 'Pill'
                          }
                        });
                        window.dispatchEvent(event);
                      } else if ((item as any).action === 'progress_workflow') {
                        // Send command to trigger Universal Agent Popup via processCommandMutation
                        const event = new CustomEvent('jarvis-command', {
                          detail: { 
                            command: 'Auto-Process Broker Emails',
                            mode: 'Pill'
                          }
                        });
                        window.dispatchEvent(event);
                      } else if ((item as any).action === 'show_workflow_details') {
                        // Show workflow details via command system
                        const event = new CustomEvent('jarvis-command', {
                          detail: { 
                            command: 'View hierarchy',
                            mode: 'Pill'
                          }
                        });
                        window.dispatchEvent(event);
                      } else if ((item as any).metadata) {
                        // Handle workflow progression from HITL task completion
                        const metadata = typeof (item as any).metadata === 'string' 
                          ? JSON.parse((item as any).metadata) 
                          : (item as any).metadata;
                        
                        if (metadata?.actionType === 'workflow_progression' && metadata?.workflowTrigger) {
                          // Trigger the 8-step Commercial Property Underwriting workflow
                          const event = new CustomEvent('jarvis-command', {
                            detail: { 
                              command: 'Start Commercial Property Underwriting',
                              mode: 'Pill',
                              metadata: {
                                submissionId: metadata.submissionId,
                                clientName: metadata.clientName,
                                humanInput: metadata.humanInput,
                                hitlCompleted: true
                              }
                            }
                          });
                          window.dispatchEvent(event);
                        }
                      }
                      // Close briefing popup when action is triggered
                      onBriefingComplete();
                    }}
                    className={`p-3 h-auto justify-start text-left w-full ${getPriorityColor(item.priority)} hover:opacity-80`}
                    variant="outline"
                  >
                    <div className="flex items-start justify-between w-full">
                      <p className="text-sm font-medium flex-1">{item.description}</p>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {item.urgency}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Workflow Starters */}
            <div>
              <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-purple-400" />
                Next Recommended Action
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {currentBriefing.workflowStarters.map((starter, index) => {
                  const StarterIcon = starter.icon;
                  return (
                    <Button
                      key={index}
                      data-testid={`workflow-starter-${index}`}
                      onClick={() => {
                        // Trigger command using existing unified framework
                        const event = new CustomEvent('jarvis-command', {
                          detail: { command: starter.command, source: 'morning-briefing' }
                        });
                        window.dispatchEvent(event);
                        // Close briefing popup when command is triggered
                        onBriefingComplete();
                      }}
                      className={`p-4 h-auto justify-start text-left ${
                        starter.priority === 'high' 
                          ? 'border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                          : starter.priority === 'medium'
                          ? 'border-blue-500/50 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20'
                          : 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                      }`}
                      variant="outline"
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <StarterIcon className="w-5 h-5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{starter.command}</div>
                          <div className="text-xs text-slate-400 mt-1">{starter.description}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {starter.priority}
                        </Badge>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4 pt-4 border-t border-slate-700">
              <Button
                onClick={toggleBriefing}
                variant="outline"
                className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30"
              >
                {isPlaying ? (
                  <>
                    <VolumeX className="w-4 h-4 mr-2" />
                    Stop Briefing
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 mr-2" />
                    Play Briefing
                  </>
                )}
              </Button>
              <Button
                onClick={onBriefingComplete}
                variant="outline"
                className="bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* HITL Decision Modal */}
    <Dialog open={hitlModalOpen} onOpenChange={setHitlModalOpen}>
      <DialogContent className="bg-slate-900/95 border border-slate-700/50 backdrop-blur-md text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center">
            <AlertTriangle className="w-6 h-6 mr-3 text-amber-400" />
            Human Review Required
          </DialogTitle>
        </DialogHeader>
        
        {selectedHitlTask && (
          <div className="space-y-6 py-4">
            {/* Task Description */}
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/30">
              <h3 className="text-lg font-semibold text-white mb-2">{selectedHitlTask.description}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Submission:</span> 
                  <span className="text-white ml-2">{selectedHitlTask.context?.submissionId}</span>
                </div>
                <div>
                  <span className="text-slate-400">Client:</span>
                  <span className="text-white ml-2">{selectedHitlTask.context?.clientName}</span>
                </div>
                <div>
                  <span className="text-slate-400">Broker:</span>
                  <span className="text-white ml-2">{selectedHitlTask.context?.brokerName}</span>
                </div>
                <div>
                  <span className="text-slate-400">AI Confidence:</span>
                  <Badge variant="outline" className="ml-2">
                    {selectedHitlTask.context?.aiConfidence}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-700/30">
              <h4 className="text-blue-300 font-medium mb-2 flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                AI Recommendation
              </h4>
              <p className="text-white">{selectedHitlTask.context?.aiRecommendation}</p>
              
              {selectedHitlTask.context?.riskFactors && (
                <div className="mt-3">
                  <span className="text-blue-300 text-sm">Risk Factors:</span>
                  <ul className="text-slate-300 text-sm mt-1">
                    {selectedHitlTask.context.riskFactors.map((factor: string, idx: number) => (
                      <li key={idx} className="ml-4">• {factor}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Human Input */}
            {!showAgentAcknowledgment && (
              <div className="space-y-2">
                <label className="text-sm text-slate-300">
                  Your Input (optional - provide corrections or notes)
                </label>
                <Textarea
                  placeholder="Enter any corrections or additional context..."
                  value={hitlRationale}
                  onChange={(e) => setHitlRationale(e.target.value)}
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  rows={3}
                />
              </div>
            )}

            {/* Agent Acknowledgment */}
            {showAgentAcknowledgment && (
              <div className="bg-green-900/30 p-4 rounded-lg border border-green-700/30">
                <h4 className="text-green-300 font-medium mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Agent Response
                </h4>
                <p className="text-white">Thank you. Using your input. Continuing to next step...</p>
                <div className="flex items-center mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                  <span className="text-green-300 text-sm ml-2">Resuming autonomous processing</span>
                </div>
              </div>
            )}


            {/* Action Button */}
            {!showAgentAcknowledgment && (
              <div className="flex justify-end pt-4 border-t border-slate-700">
                <Button
                  data-testid="button-task-complete"
                  onClick={() => handleHitlTaskComplete(hitlRationale)}
                  className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30 px-8"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Task Complete
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
    </AnimatePresence>
  );
}
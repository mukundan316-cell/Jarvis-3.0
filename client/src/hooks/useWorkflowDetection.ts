import { useQuery } from '@tanstack/react-query';
import { filterAgentsByPersona } from '@/lib/jarvisCalculations';

// Types for workflow detection
export interface WorkflowDetectionResult {
  isCommercialProperty: boolean;
  workflowType: string | null;
  matchingAgents: any[];
  confidence: number;
}

// Agent interface matching existing AgentData structure
interface Agent {
  id: number;
  name: string;
  type: string;
  layer: string;
  persona: string;
  status: string;
  config?: any;
  // Extended fields that may not be in all agent objects
  agentRole?: string;
  personaName?: string;
  specialization?: string;
  description?: string;
  successRate?: number;
  avgResponseTime?: number;
  executionCount?: number;
}

/**
 * Dynamic workflow detection hook that queries actual agent data
 * Replaces hardcoded keyword matching with intelligent agent-driven detection
 */
export function useWorkflowDetection() {
  // Query agents from the database
  const { data: agentsData, isLoading } = useQuery({
    queryKey: ['/api/agents'],
  });

  /**
   * Determine if a workflow is commercial property-related based on agent data
   * Uses agent specializations, types, and capabilities instead of hardcoded keywords
   */
  const detectWorkflowType = (
    agentName?: string,
    action?: string,
    submissionDetails?: any,
    currentPersona: string = 'admin'
  ): WorkflowDetectionResult => {
    if (!agentsData || isLoading) {
      return {
        isCommercialProperty: false,
        workflowType: null,
        matchingAgents: [],
        confidence: 0
      };
    }

    // Get all agents from the hierarchy structure
    const allAgents: Agent[] = [];
    Object.values(agentsData).forEach((layerAgents: any) => {
      if (Array.isArray(layerAgents)) {
        allAgents.push(...layerAgents);
      }
    });

    // Filter agents by current persona using existing logic
    const filteredAgents = filterAgentsByPersona(allAgents, currentPersona);

    // Build search context from input parameters
    const searchContext = [
      agentName?.toLowerCase() || '',
      action?.toLowerCase() || '',
      submissionDetails?.workflowType?.toLowerCase() || '',
      submissionDetails?.command?.toLowerCase() || '',
      submissionDetails?.description?.toLowerCase() || ''
    ].filter(Boolean).join(' ');

    // Find matching agents based on specialization and capabilities
    const matchingAgents = filteredAgents.filter(agent => {
      if (!agent || agent.status !== 'active') return false;

      // Check both top-level fields AND config fields for comprehensive detection
      const agentText = [
        agent.name.toLowerCase(),
        (agent as any).agentRole?.toLowerCase() || '',
        // Top-level fields
        (agent as any).specialization?.toLowerCase() || '',
        (agent as any).description?.toLowerCase() || '',
        (agent as any).persona?.toLowerCase() || '',
        (agent as any).type?.toLowerCase() || '',
        // Config fields (for backward compatibility)
        (agent as any).config?.specialization?.toLowerCase() || '',
        (agent as any).config?.persona?.toLowerCase() || '',
        // Join config capabilities for enhanced detection
        Array.isArray((agent as any).config?.capabilities) 
          ? (agent as any).config.capabilities.join(' ').toLowerCase() 
          : '',
        // Join config handles for workflow step detection
        Array.isArray((agent as any).config?.handles) 
          ? (agent as any).config.handles.join(' ').toLowerCase() 
          : ''
      ].join(' ');

      // Enhanced commercial property specialization indicators (fallback for config service)
      const fallbackCpSpecializations = [
        'commercial property',
        'property underwriting',
        'commercial lines',
        'cope analysis',
        // 'property risk', // Risk assessment references removed
        'commercial underwriting',
        'property assessment',
        'commercial evaluation',
        'building evaluation',
        'occupancy analysis',
        'protection evaluation',
        'exposure analysis',
        // New CP agent specific patterns
        'cp intake',
        'cp submission',
        // 'cp risk assessment', // Risk assessment references removed
        'cp underwriting decision',
        'cp document processor',
        'cp data enrichment',
        'acord form parsing',
        'peril evaluation',
        'appetite triage',
        'propensity scoring',
        'workflow coordination',
        'step progression',
        'document processing',
        'data aggregation',
        'external data',
        'geocoding services',
        'property valuation',
        'market data enrichment',
        'decision support',
        'email processing broker communication'
      ];
      
      // TODO: Replace with ConfigService query when available on client
      const cpSpecializations = fallbackCpSpecializations;

      // Check if agent specializes in commercial property workflows
      const hasCommercialPropertySpecialization = cpSpecializations.some(spec =>
        agentText.includes(spec) || searchContext.includes(spec)
      );

      return hasCommercialPropertySpecialization;
    });

    // Determine workflow type based on matching agents
    let workflowType: string | null = null;
    if (matchingAgents.length > 0) {
      // Analyze agent specializations to determine specific workflow type
      const specializations = matchingAgents
        .map(agent => (agent as any).specialization?.toLowerCase() || '')
        .join(' ');

      if (specializations.includes('commercial property') || specializations.includes('property underwriting')) {
        workflowType = 'Commercial Property Underwriting';
      } else if (specializations.includes('risk assessment') && specializations.includes('commercial')) {
        workflowType = 'Commercial Risk Assessment';
      } else if (specializations.includes('policy evaluation') && specializations.includes('commercial')) {
        workflowType = 'Commercial Policy Evaluation';
      } else {
        workflowType = 'General Commercial Workflow';
      }
    }

    // Calculate confidence based on number and relevance of matching agents
    const confidence = Math.min(matchingAgents.length * 0.2, 1.0);

    return {
      isCommercialProperty: matchingAgents.length > 0,
      workflowType,
      matchingAgents,
      confidence
    };
  };

  /**
   * Get workflow-specific agent recommendations based on detected workflow type
   */
  const getWorkflowAgentRecommendations = (workflowType: string, persona: string = 'admin') => {
    if (!agentsData || isLoading) return [];

    const allAgents: Agent[] = [];
    Object.values(agentsData).forEach((layerAgents: any) => {
      if (Array.isArray(layerAgents)) {
        allAgents.push(...layerAgents);
      }
    });

    const filteredAgents = filterAgentsByPersona(allAgents, persona);

    // Return agents that match the detected workflow type
    return filteredAgents.filter(agent => {
      if (!agent || agent.status !== 'active') return false;

      const agentText = [
        (agent as any).specialization?.toLowerCase() || '',
        (agent as any).description?.toLowerCase() || ''
      ].join(' ');

      switch (workflowType) {
        case 'Commercial Property Underwriting':
          return agentText.includes('commercial') && (
            agentText.includes('property') ||
            agentText.includes('underwriting') ||
            agentText.includes('risk')
          );
        case 'Commercial Risk Assessment':
          return agentText.includes('risk') && agentText.includes('commercial');
        case 'Commercial Policy Evaluation':
          return agentText.includes('policy') && agentText.includes('commercial');
        default:
          return agentText.includes('commercial') || agentText.includes('property');
      }
    });
  };

  return {
    detectWorkflowType,
    getWorkflowAgentRecommendations,
    isLoading
  };
}
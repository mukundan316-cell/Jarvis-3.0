import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CheckCircle, Clock, AlertCircle, Brain, Users, Cog, Database, Cloud, Layers, Mail, Shield, FileText, ArrowRight, DollarSign, XCircle, Building2, BarChart3, Zap, Play, Pause, RotateCcw, Palette, Workflow, MonitorSpeaker, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePersonaColors } from '@/hooks/usePersonaColors';
import type { PersonaType } from '@/lib/personaColors';
import { globalVoiceManager } from '@/utils/GlobalVoiceManager';
import { apiRequest } from '@/lib/queryClient';
import { useWorkflowDetection } from '@/hooks/useWorkflowDetection';
import { StepBasedForm } from '@/components/StepBasedForm';
import type { StepDefinition as StepDefinitionDB } from '@shared/schema';
import { CPEmailIntake } from '@/components/commercial-property/CPEmailIntake';
import { usePersona } from '@/hooks/usePersona';

// Real agent execution interfaces from backend
interface AgentExecutionStep {
  id: number;
  stepOrder: number;
  layer: string;
  agentId?: number;
  agentName: string;
  agentType: string;
  specialization?: string;
  description?: string;
  capabilities?: string[] | any;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  inputData?: any;
  outputData?: any;
  errorDetails?: string;
  // Parallel group information (optional)
  groupId?: string;
  isParallel?: boolean;
  totalInGroup?: number;
  indexInGroup?: number;
  // Additional properties for UI display
  result?: string;
  agent?: string;
  agents?: any[];
}

interface AgentExecution {
  id: number;
  executionId: string;
  persona: string;
  command: string;
  status: 'initializing' | 'running' | 'completed' | 'error' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  totalDuration?: number;
  result?: any;
  errorDetails?: any;
  agentCount: number;
}

interface ExecutionUpdate {
  type: 'connected' | 'execution_started' | 'step_started' | 'step_completed' | 'execution_completed' | 'execution_error' | 'heartbeat';
  executionId: string;
  stepId?: number;
  stepOrder?: number;
  layer?: string;
  agentName?: string;
  action?: string;
  status?: string;
  duration?: number;
  outputData?: any;
  message?: string;
  totalDuration?: number;
  layersExecuted?: number;
  timestamp?: string;
}

// Icon mapping for unified hierarchy config - shared with AgentHierarchy
const ICON_MAP = {
  Palette,
  Brain,
  Users,
  Workflow,
  Cog,
  MonitorSpeaker,
  Globe: Palette, // Fallback for Globe icons
  Bot: Brain,     // Fallback for Bot icons  
  Cpu: Cog,       // Fallback for Cpu icons
  Database: Cog   // Fallback for Database icons
};

// Get layer colors from unified hierarchy config - Phase 5: Universal Hierarchy Display
function getLayerColors(layer: string, hierarchyConfig?: any) {
  // Try to get colors from unified hierarchy config first
  if (hierarchyConfig?.layers) {
    const layerData = hierarchyConfig.layers.find((l: any) => l.layer === layer);
    if (layerData?.colors) {
      return {
        color: layerData.colors.border || 'border-gray-500 text-gray-300',
        badgeColor: layerData.colors.badge || 'text-gray-400 bg-gray-500/20'
      };
    }
  }
  
  // Special handling for Experience and Meta Brain layers
  if (layer === 'Experience' && hierarchyConfig?.experienceLayer?.colors) {
    return {
      color: hierarchyConfig.experienceLayer.colors.border || 'border-purple-500 text-purple-300',
      badgeColor: hierarchyConfig.experienceLayer.colors.badge || 'text-purple-400 bg-purple-500/20'
    };
  }
  
  if (layer === 'Meta Brain' && hierarchyConfig?.metaBrainLayer?.colors) {
    return {
      color: hierarchyConfig.metaBrainLayer.colors.border || 'border-blue-500 text-blue-300',
      badgeColor: hierarchyConfig.metaBrainLayer.colors.badge || 'text-blue-400 bg-blue-500/20'
    };
  }
  
  // Fallback color mapping for graceful degradation
  const fallbackColors: Record<string, any> = {
    'Experience': {
      color: 'border-purple-500 text-purple-300',
      badgeColor: 'text-purple-400 bg-purple-500/20'
    },
    'Meta Brain': {
      color: 'border-blue-500 text-blue-300',
      badgeColor: 'text-blue-400 bg-blue-500/20'
    },
    'Role': {
      color: 'border-cyan-500 text-cyan-300',
      badgeColor: 'text-cyan-400 bg-cyan-500/20'
    },
    'Process': {
      color: 'border-green-500 text-green-300',
      badgeColor: 'text-green-400 bg-green-500/20'
    },
    'System': {
      color: 'border-yellow-500 text-yellow-300',
      badgeColor: 'text-yellow-400 bg-yellow-500/20'
    },
    'Interface': {
      color: 'border-red-500 text-red-300',
      badgeColor: 'text-red-400 bg-red-500/20'
    }
  };
  
  return fallbackColors[layer] || {
    color: 'border-gray-500 text-gray-300',
    badgeColor: 'text-gray-400 bg-gray-500/20'
  };
}

// Unified hierarchy config hook - Phase 5: Universal Hierarchy Display
function useUnifiedHierarchyConfig(persona?: string) {
  const { data: hierarchyConfig, isLoading, error } = useQuery({
    queryKey: ['/api/hierarchy/config', { persona }],
    queryFn: () => {
      const url = new URL('/api/hierarchy/config', window.location.origin);
      if (persona) {
        url.searchParams.set('persona', persona);
      }
      return fetch(url.toString(), { credentials: 'include' }).then(res => res.json());
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - align with HierarchyConfigResolver cache TTL
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    retry: 1, // Retry once on failure, then fallback
    retryDelay: 1000,
    enabled: true
  });

  return {
    hierarchyConfig,
    isLoading,
    error
  };
}

// Transform unified hierarchy config to legacy agents format for backward compatibility
function transformHierarchyToAgentsFormat(hierarchyConfig: any) {
  if (!hierarchyConfig || !hierarchyConfig.layers) {
    return null;
  }

  const agentsData: any = {
    experience: [],
    metaBrain: [],
    cognitive: [], // Role layer agents (API uses 'cognitive' key for role agents) 
    process: [],
    system: [],
    interface: []
  };

  // Add Experience Layer
  if (hierarchyConfig.experienceLayer) {
    agentsData.experience = [{
      id: hierarchyConfig.experienceLayer.id,
      name: hierarchyConfig.experienceLayer.companyName,
      type: 'Insurance Company',
      layer: 'Experience',
      config: hierarchyConfig.experienceLayer,
      status: 'active'
    }];
  }

  // Add Meta Brain Layer
  if (hierarchyConfig.metaBrainLayer) {
    agentsData.metaBrain = [{
      id: hierarchyConfig.metaBrainLayer.id,
      name: hierarchyConfig.metaBrainLayer.orchestratorName,
      type: 'Central Orchestrator', 
      layer: 'Meta Brain',
      config: hierarchyConfig.metaBrainLayer,
      status: 'active'
    }];
  }

  // Map layer agents from unified config
  hierarchyConfig.layers.forEach((layerData: any) => {
    const { layer, agents } = layerData;
    
    switch (layer) {
      case 'Role':
        agentsData.cognitive = agents; // API uses 'cognitive' key for role agents
        break;
      case 'Process':
        agentsData.process = agents;
        break;
      case 'System':
        agentsData.system = agents;
        break;
      case 'Interface':
        agentsData.interface = agents;
        break;
    }
  });

  return agentsData;
}

// Real-time execution hook using WebSocket with exponential backoff
const useAgentExecution = (executionId: string | null, userId: string = 'anonymous') => {
  const [execution, setExecution] = useState<AgentExecution | null>(null);
  const [stepsMap, setStepsMap] = useState<Map<string, AgentExecutionStep>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedExecutions, setProcessedExecutions] = useState<Set<string>>(new Set());
  const [retryCount, setRetryCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convert Map to array for backward compatibility
  const steps = Array.from(stepsMap.values()).sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0));

  // Calculate exponential backoff delay (max 30 seconds)
  const getBackoffDelay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 30000);

  useEffect(() => {
    if (!executionId) return;

    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Establish WebSocket connection to specific path
    // Use same-origin without hardcoded port for Replit environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/agent-executions/ws?userId=${userId}&executionId=${executionId}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      setRetryCount(0); // Reset retry count on successful connection
      
      // Subscribe to execution updates
      ws.send(JSON.stringify({
        type: 'subscribe-execution',
        executionId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connection-established') {
          console.log('WebSocket connection established:', data.clientId);
          return;
        }

        if (data.type === 'agent-event' && data.executionId === executionId) {
          const update = data.eventData || data; // Handle both nested and flat structures
          const eventType = data.eventType || data.type;
          
          switch (eventType) {
            case 'execution_started':
              // Gate duplicate execution_started payloads by checking executionId
              if (!processedExecutions.has(executionId)) {
                setProcessedExecutions(prev => new Set(prev).add(executionId));
                setExecution(prev => prev || {
                  id: -1,
                  executionId: executionId,
                  persona: 'admin',
                  command: '',
                  status: 'running',
                  startedAt: new Date().toISOString(),
                  agentCount: 0
                });
              }
              break;
              
            case 'step_started':
              if (update.stepId && update.stepOrder !== undefined) {
                setStepsMap(prev => {
                  const stepKey = `${update.stepId}_${update.layer || 'unknown'}`;
                  const newMap = new Map(prev);
                  
                  const existing = newMap.get(stepKey);
                  if (existing) {
                    // Update existing step
                    newMap.set(stepKey, {
                      ...existing,
                      status: 'running' as const,
                      startedAt: new Date().toISOString(),
                      agentType: update.agentType || existing.agentType,
                      specialization: update.specialization || existing.specialization,
                      description: update.description || existing.description,
                      capabilities: update.capabilities || existing.capabilities
                    });
                  } else {
                    // Add new step
                    newMap.set(stepKey, {
                      id: update.stepId || Math.floor(Math.random() * 1000000),
                      stepOrder: update.stepOrder || newMap.size + 1,
                      layer: update.layer || '',
                      agentName: update.agentName || '',
                      agentType: update.agentType || '',
                      specialization: update.specialization || '',
                      description: update.description || '',
                      capabilities: update.capabilities || [],
                      action: update.action || '',
                      status: 'running' as const,
                      startedAt: new Date().toISOString(),
                      // Optional parallel group information
                      groupId: update.groupId,
                      isParallel: update.isParallel || false,
                      totalInGroup: update.totalInGroup,
                      indexInGroup: update.indexInGroup
                    });
                  }
                  
                  return newMap;
                });
              }
              break;
              
            case 'step_completed':
              if (update.stepId) {
                setStepsMap(prev => {
                  const newMap = new Map(prev);
                  const stepKey = `${update.stepId}_${update.stepOrder || 0}`;
                  const existing = newMap.get(stepKey);
                  
                  if (existing) {
                    newMap.set(stepKey, {
                      ...existing,
                      status: 'completed' as const,
                      completedAt: new Date().toISOString(),
                      agentType: update.agentType || existing.agentType,
                      specialization: update.specialization || existing.specialization,
                      description: update.description || existing.description,
                      capabilities: update.capabilities || existing.capabilities,
                      duration: update.duration,
                      outputData: update.outputData,
                      // Update parallel group information if available
                      groupId: update.groupId || existing.groupId,
                      isParallel: update.isParallel !== undefined ? update.isParallel : existing.isParallel,
                      totalInGroup: update.totalInGroup || existing.totalInGroup,
                      indexInGroup: update.indexInGroup !== undefined ? update.indexInGroup : existing.indexInGroup
                    });
                  }
                  
                  return newMap;
                });
              }
              break;
              
            case 'execution_completed':
              setExecution(prev => ({
                id: prev?.id || -1,
                executionId: executionId,
                persona: prev?.persona || 'admin',
                command: prev?.command || '',
                status: 'completed',
                startedAt: prev?.startedAt || new Date().toISOString(),
                completedAt: new Date().toISOString(),
                totalDuration: update.totalDuration,
                result: { message: update.message, layersExecuted: update.layersExecuted },
                agentCount: prev?.agentCount || 0
              }));
              break;
              
            case 'execution_error':
              setExecution(prev => ({
                id: prev?.id || -1,
                executionId: executionId,
                persona: prev?.persona || 'admin',
                command: prev?.command || '',
                status: 'error',
                startedAt: prev?.startedAt || new Date().toISOString(),
                agentCount: prev?.agentCount || 0,
                errorDetails: { message: update.message }
              }));
              setError(update.message || 'Execution failed');
              break;
          }
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      setError('WebSocket connection error');
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      
      // Only attempt reconnection if not a clean close and we still have an executionId
      if (executionId && !event.wasClean && retryCount < 5) {
        const delay = getBackoffDelay(retryCount);
        setError(`Connection lost, retrying in ${Math.round(delay / 1000)}s...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          // Trigger re-effect by clearing executionId briefly then restoring it
          // This creates a fresh WebSocket connection with exponential backoff
        }, delay);
      } else {
        setError('WebSocket connection closed');
      }
    };

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [executionId, userId]);

  return { execution, steps, isConnected, error };
};

// Start agent execution mutation
const useStartAgentExecution = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { persona: string; command: string; orchestrationStrategy?: string }) => {
      const response = await apiRequest('/api/agent-executions', 'POST', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    }
  });
};

// DEPRECATED: Replaced with unified hierarchy config
// Use useUnifiedHierarchyConfig instead for consistent data

// Explicit color class mappings to prevent Tailwind purge issues
const colorClassMappings = {
  purple: {
    bg: 'bg-purple-500/10',
    bgHover: 'hover:bg-purple-500/20', 
    border: 'border-purple-500/30',
    text: 'text-purple-400'
  },
  blue: {
    bg: 'bg-blue-500/10',
    bgHover: 'hover:bg-blue-500/20',
    border: 'border-blue-500/30', 
    text: 'text-blue-400'
  },
  green: {
    bg: 'bg-green-500/10',
    bgHover: 'hover:bg-green-500/20',
    border: 'border-green-500/30',
    text: 'text-green-400'
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    bgHover: 'hover:bg-yellow-500/20',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400'
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    bgHover: 'hover:bg-cyan-500/20',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400'
  },
  amber: {
    bg: 'bg-amber-500/10',
    bgHover: 'hover:bg-amber-500/20',
    border: 'border-amber-500/30',
    text: 'text-amber-400'
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    bgHover: 'hover:bg-emerald-500/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400'
  }
} as const;

// Fallback workflow mappings when ConfigService is unavailable
const FALLBACK_WORKFLOW_MAPPINGS: Record<string, {
  next: string;
  description: string;
  color: 'purple' | 'blue' | 'green' | 'yellow' | 'cyan' | 'emerald' | 'amber';
  icon: any;
}> = {
  // Core commercial property workflow - Risk Assessment removed, agents purged
  'Review Submissions': {
    next: 'Document Processing',
    description: 'Process submission documents and forms',
    color: 'cyan',
    icon: FileText
  },
  'Send Email': {
    next: 'Document Processing',
    description: 'Process submission documents received via email',
    color: 'cyan',
    icon: FileText
  },
  'Document Processing': {
    next: 'Policy Evaluation',
    description: 'Evaluate policy terms and commercial property coverage',
    color: 'blue',
    icon: FileText
  },
  'Policy Evaluation': {
    next: 'Generate Quote',
    description: 'Generate final quote with commercial property pricing',
    color: 'cyan',
    icon: FileText
  },
  'Price Quote': {
    next: 'Apply Discount',
    description: 'Apply JARVIS recommended commercial property discount',
    color: 'yellow',
    icon: FileText
  },
  'Apply Discount': {
    next: 'Generate Quote',
    description: 'Generate final commercial property quote document',
    color: 'cyan',
    icon: FileText
  },
  'Show Inbox': {
    next: 'Send Email',
    description: 'Respond to broker communications',
    color: 'blue',
    icon: Mail
  }
};

// Fallback actions when ConfigService is unavailable
const FALLBACK_ACTIONS = {
  rachel: [
    { command: 'Review Submissions', label: 'Review Submissions', description: 'Check for new submission items', icon: FileText, color: 'blue' },
    { command: 'Send Email', label: 'Send Email', description: 'Communicate with brokers', icon: Mail, color: 'cyan' }
  ],
  john: [
    { command: 'System Diagnostics', label: 'System Diagnostics', description: 'Check system health', icon: Cog, color: 'green' },
    { command: 'Security Scan', label: 'Security Scan', description: 'Run security assessment', icon: Shield, color: 'yellow' }
  ],
  admin: [
    { command: 'Show Metrics', label: 'Show Metrics', description: 'Review system performance', icon: Database, color: 'blue' },
    { command: 'Agent Monitor', label: 'Agent Monitor', description: 'Check agent status', icon: Users, color: 'purple' }
  ]
};

// Icon mapping for ConfigService data
const getIconByName = (iconName: string) => {
  const iconMap: Record<string, any> = {
    FileText, Mail, Brain, Users, Cog, Database, Cloud, Layers, Shield, DollarSign, XCircle, Building2, BarChart3, Zap
  };
  return iconMap[iconName] || FileText;
};

// ConfigService-based workflow command resolution with fallback
const getNextRecommendedCommand = (currentCommand: string, persona: string, workflowMappings: any) => {
  const configData = workflowMappings?.value;
  let workflows = FALLBACK_WORKFLOW_MAPPINGS;
  
  if (configData && typeof configData === 'object') {
    // Convert ConfigService data to internal format
    workflows = Object.fromEntries(
      Object.entries(configData).map(([key, value]: [string, any]) => [
        key,
        {
          ...value,
          icon: getIconByName(value.iconName || 'FileText')
        }
      ])
    );
  }
  
  return workflows[currentCommand] || null;
};

// Dynamic Commercial Property workflow detection using agent data
// Replaces hardcoded keyword matching with intelligent agent-driven detection

// Simple persona-to-role-agent mapping for reliable synchronization
const PERSONA_TO_ROLE_AGENT = {
  admin: "JARVIS Admin",
  rachel: "Rachel Thompson (AUW)", 
  john: "John Stevens (IT Support)"
};

// Function to build workflow from real database agents
const buildPersonaWorkflowFromAgents = (
  agentsData: any[] | any, 
  persona: string, 
  companyName: string, 
  command?: string,
  hierarchyConfigData?: any
) => {
  if (!agentsData) {
    return {
      title: `${companyName} ${persona} Workflow`,
      steps: []
    };
  }

  // Handle both array format (legacy) and object format (new API structure)
  let agentsByLayer: Record<string, any[]> = {};
  
  if (Array.isArray(agentsData)) {
    // Legacy array format - group by layer
    const allAgents = agentsData.filter(agent => 
      agent?.persona?.toLowerCase() === persona.toLowerCase() || 
      agent?.config?.persona?.toLowerCase() === persona.toLowerCase() ||
      agent?.name?.toLowerCase().includes(persona.toLowerCase())
    );
    
    agentsByLayer = {
      experience: allAgents.filter(agent => agent.layer === 'Experience'),
      metaBrain: allAgents.filter(agent => agent.layer === 'Meta Brain'), 
      role: allAgents.filter(agent => agent.layer === 'Role'),
      process: allAgents.filter(agent => agent.layer === 'Process'),
      system: allAgents.filter(agent => agent.layer === 'System'),
      interface: allAgents.filter(agent => agent.layer === 'Interface')
    };
  } else if (typeof agentsData === 'object') {
    // New object format from /api/agents endpoint
    agentsByLayer = {
      experience: agentsData.experience || [],
      metaBrain: agentsData.metaBrain || [], 
      cognitive: agentsData.cognitive || [],  // API uses 'cognitive' key for role agents
      process: agentsData.process || [],
      system: agentsData.system || [],
      interface: agentsData.interface || []
    };
  } else {
    return {
      title: `${companyName} ${persona} Workflow`,
      steps: []
    };
  }

  // Define the 6-layer JARVIS architecture mapping (using actual API keys)
  const layerMapping = [
    { key: 'experience', name: 'Experience', displayName: 'Experience Layer' },
    { key: 'metaBrain', name: 'Meta Brain', displayName: 'Meta Brain Layer' },
    { key: 'cognitive', name: 'Role', displayName: 'Role Layer' },  // API uses 'cognitive' key for role agents
    { key: 'process', name: 'Process', displayName: 'Process Layer' },
    { key: 'system', name: 'System', displayName: 'System Layer' },
    { key: 'interface', name: 'Interface', displayName: 'Interface Layer' }
  ];
  
  // Build steps - always maintain 6-layer hierarchy with dynamic parallel support
  const steps = layerMapping.map((layer, index) => {
    // Get agents for this layer
    const layerAgents = agentsByLayer[layer.key] || [];
    
    // Filter agents by persona using exact mapping + fallback strategies  
    const expectedRoleAgentName = PERSONA_TO_ROLE_AGENT[persona as keyof typeof PERSONA_TO_ROLE_AGENT];
    
    // Metadata-driven agent filtering - ConfigService controlled by admin
    const getCommandRelevantAgents = (agents: any[], command?: string, layerName?: string, configData?: any) => {
      if (!command || !layerName) return agents;
      
      // Use unified hierarchy config for agent visibility rules
      const visibilityRules = configData?.agentVisibilityRules || {};
      const commandKey = command.toLowerCase().replace(/\s+/g, '_');
      const layerKey = layerName.toLowerCase().replace(/\s+/g, '_');
      
      
      // Check if there are specific visibility rules for this command + layer
      const commandRules = visibilityRules[commandKey] || visibilityRules['default'];
      const layerRules = commandRules?.[layerKey];
      
      
      if (layerRules) {
        // Apply admin-configured visibility rules
        const { maxAgents = 3, includeAgents = [], excludeAgents = [], filterByKeywords = [] } = layerRules;
        
        let filteredAgents = agents;
        
        // 1. Include specific agents by name/id
        if (includeAgents.length > 0) {
          const included = agents.filter(agent => 
            includeAgents.includes(agent?.id) || 
            includeAgents.includes(agent?.name)
          );
          if (included.length > 0) {
            filteredAgents = included;
          }
        }
        
        // 2. Exclude specific agents
        if (excludeAgents.length > 0) {
          filteredAgents = filteredAgents.filter(agent => 
            !excludeAgents.includes(agent?.id) && 
            !excludeAgents.includes(agent?.name)
          );
        }
        
        // 3. Filter by keywords in agent properties
        if (filterByKeywords.length > 0) {
          const keywordFiltered = filteredAgents.filter(agent => {
            const searchText = [
              agent?.name || '',
              agent?.description || '',
              agent?.specialization || '',
              agent?.action || ''
            ].join(' ').toLowerCase();
            
            return filterByKeywords.some((keyword: string) => 
              searchText.includes(keyword.toLowerCase())
            );
          });
          
          if (keywordFiltered.length > 0) {
            filteredAgents = keywordFiltered;
          }
        }
        
        // 4. Apply max agents limit
        return filteredAgents.slice(0, maxAgents);
      }
      
      // Default fallback: limit to 3 agents if no specific rules
      return agents.slice(0, Math.min(3, agents.length));
    };
    
    const baseFilteredAgents = Array.isArray(agentsData) 
      ? layerAgents.filter(agent => 
          // Primary: Exact name match using mapping for Role layer
          (layer.name === 'Role' && expectedRoleAgentName && agent?.name === expectedRoleAgentName) ||
          // Fallback: Existing logic for non-role layers and edge cases
          agent?.persona?.toLowerCase() === persona.toLowerCase() || 
          agent?.config?.persona?.toLowerCase() === persona.toLowerCase() ||
          agent?.name?.toLowerCase().includes(persona.toLowerCase()) ||
          persona === 'admin' // Admin can see all agents
        )
      : layer.name === 'Role' && expectedRoleAgentName 
        ? layerAgents.filter(agent => agent?.name === expectedRoleAgentName)
        : layerAgents; // Object format: apply mapping for Role layer
    
    // Apply command-specific filtering for contextual agent display  
    const filteredAgents = getCommandRelevantAgents(baseFilteredAgents, command, layer.name, hierarchyConfigData);

    // Always show all 6 layers - Universal Hierarchy Display (Phase 5)
    if (filteredAgents.length === 0) {
      // Create placeholder entry for layers with no agents to maintain 6-layer structure
      return {
        layer: layer.displayName,
        agent: `${layer.name} Layer`,
        action: `Initialize ${layer.name.toLowerCase()} processing`,
        status: index === 0 ? 'running' : 'pending',
        isParallel: false,
        agents: [], // Empty agents array for placeholder
        timeout: 5000 + (index * 2000)
      };
    }

    // Support both single and multiple agents per layer
    if (filteredAgents.length === 1) {
      // Single agent - traditional card
      const agent = filteredAgents[0];
      const action = agent.specialization || 
                     agent.config?.specialization || 
                     agent.description ||
                     agent.config?.description ||
                     agent.action ||
                     agent.config?.action ||
                     `Execute ${agent.name}`;

      return {
        layer: layer.displayName,
        agent: agent.name,
        action: action,
        status: index === 0 ? 'running' : 'pending',
        isParallel: false,
        agents: [agent], // Always provide agents array for consistency
        timeout: 5000 + (index * 2000)
      };
    } else {
      // Multiple agents - parallel execution within this layer
      return {
        layer: layer.displayName,
        agent: `${filteredAgents.length} Agents Running Parallel`,
        action: `Parallel processing: ${filteredAgents.map(a => a.name).join(', ')}`,
        status: index === 0 ? 'running' : 'pending',
        isParallel: true,
        agents: filteredAgents, // All agents for parallel rendering
        timeout: 5000 + (index * 2000)
      };
    }
  }); // Keep all 6 layers - Universal Hierarchy Display ensures complete architecture visibility

  // Generate workflow title based on command and persona
  let title = '';
  if (command) {
    title = `${companyName} ${command} Execution`;
  } else {
    title = `${companyName} ${persona.charAt(0).toUpperCase() + persona.slice(1)} Workflow`;
  }

  return {
    title,
    steps
  };
};

// Universal workflow continuation component with ConfigService integration
const WorkflowContinuationButton = ({ currentCommand, persona, onClose }: { 
  currentCommand: string; 
  persona: string; 
  onClose?: () => void; 
}) => {
  // Fetch workflow mappings from ConfigService
  const { data: workflowMappingsConfig } = useQuery({
    queryKey: ['/api/config/setting/workflows.config', { persona }],
    queryFn: () => 
      fetch(`/api/config/setting/workflows.config?persona=${persona}`)
        .then(res => res.json()),
    enabled: !!persona
  });

  const nextWorkflow = getNextRecommendedCommand(currentCommand, persona, workflowMappingsConfig);
  
  if (!nextWorkflow || !onClose) return null;
  
  const IconComponent = nextWorkflow.icon;
  const colorClasses = {
    purple: 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/50 text-purple-400 hover:text-purple-300',
    blue: 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/50 text-blue-400 hover:text-blue-300',
    green: 'bg-green-500/20 hover:bg-green-500/30 border-green-500/50 text-green-400 hover:text-green-300',
    yellow: 'bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/50 text-yellow-400 hover:text-yellow-300',
    cyan: 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/50 text-cyan-400 hover:text-cyan-300'
  };
  
  return (
    <div className="mt-4 pt-4 border-t border-slate-600">
      <button
        onClick={() => {
          onClose();
          setTimeout(() => {
            const event = new CustomEvent('jarvis-command', {
              detail: { command: nextWorkflow.next, mode: 'Pill' }
            });
            window.dispatchEvent(event);
          }, 100);
        }}
        className={`flex items-center gap-2 ${colorClasses[nextWorkflow.color as keyof typeof colorClasses]} transition-colors text-sm px-3 py-2 rounded-lg w-full`}
      >
        <IconComponent className="w-4 h-4" />
        <div className="flex flex-col items-start">
          <span className="font-medium">Continue to {nextWorkflow.next}</span>
          <span className="text-xs opacity-75">{nextWorkflow.description}</span>
        </div>
        <ArrowRight className="w-4 h-4 ml-auto" />
      </button>
    </div>
  );
};

// NextRecommendedActions component for universal workflow guidance
interface NextRecommendedActionsProps {
  currentCommand: string;
  persona: string;
  onClose?: () => void;
  agentExecutionData?: any; // Pass agentExecutionData as prop to fix undefined reference
  pricingData?: any; // Pass pricingData as prop to fix React Hooks violation
}

const NextRecommendedActions: React.FC<NextRecommendedActionsProps> = ({ 
  currentCommand, 
  persona, 
  onClose,
  agentExecutionData,
  pricingData
}) => {
  // Fetch workflow mappings from ConfigService
  const { data: workflowMappingsConfig, isLoading: workflowMappingsLoading } = useQuery({
    queryKey: ['/api/config/setting/workflows.config', { persona }],
    queryFn: () => 
      fetch(`/api/config/setting/workflows.config?persona=${persona}`)
        .then(res => res.json()),
    enabled: !!persona,
    staleTime: 300000 // 5 minutes - workflow mappings change infrequently
  });

  // Fetch fallback actions from ConfigService
  const { data: fallbackActionsConfig, isLoading: fallbackActionsLoading } = useQuery({
    queryKey: ['/api/config/setting/fallback-actions.config', { persona }],
    queryFn: () => 
      fetch(`/api/config/setting/fallback-actions.config?persona=${persona}`)
        .then(res => res.json()),
    enabled: !!persona,
    staleTime: 300000 // 5 minutes - fallback actions change infrequently
  });

  // Fetch pricing defaults from ConfigService
  const { data: pricingDefaultsConfig, isLoading: pricingDefaultsLoading } = useQuery({
    queryKey: ['/api/config/setting/pricing-defaults.config', { persona }],
    queryFn: () => 
      fetch(`/api/config/setting/pricing-defaults.config?persona=${persona}`)
        .then(res => res.json()),
    enabled: !!persona && currentCommand === 'Policy Evaluation',
    staleTime: 300000 // 5 minutes - pricing defaults change infrequently
  });

  // Fetch discount rules from ConfigService
  const { data: discountRulesConfig, isLoading: discountRulesLoading } = useQuery({
    queryKey: ['/api/config/setting/discount-rules.config', { persona }],
    queryFn: () => 
      fetch(`/api/config/setting/discount-rules.config?persona=${persona}`)
        .then(res => res.json()),
    enabled: !!persona && currentCommand === 'Policy Evaluation',
    staleTime: 300000 // 5 minutes - discount rules change infrequently
  });

  // Helper function to get fallback actions with ConfigService fallback
  const getFallbackActions = (persona: string) => {
    const configData = fallbackActionsConfig?.value;
    if (configData && Array.isArray(configData)) {
      // Convert ConfigService data to internal format
      return configData.map((action: any) => ({
        ...action,
        icon: getIconByName(action.iconName || 'FileText')
      }));
    }
    
    // Use hardcoded fallback
    const actions = FALLBACK_ACTIONS[persona as keyof typeof FALLBACK_ACTIONS] || FALLBACK_ACTIONS.admin;
    return actions;
  };

  const triggerCommand = (command: string) => {
    onClose && onClose();
    setTimeout(() => {
      const event = new CustomEvent('jarvis-command', {
        detail: { command, mode: 'Pill' }
      });
      window.dispatchEvent(event);
    }, 100);
  };

  // Helper function to compute pricing from discount rules
  const computePricingFromRules = () => {
    const discountRules = discountRulesConfig?.value;
    const basePricing = pricingDefaultsConfig?.value;
    
    if (!discountRules || !basePricing) {
      return null;
    }
    
    // Apply discount rules logic
    const basePrice = parseFloat(basePricing.basePrice?.replace(/[$,]/g, '') || '0');
    const discountPercent = parseFloat(discountRules.recommendedDiscountPercent || '0');
    
    if (basePrice === 0) return null;
    
    const discountAmount = basePrice * (discountPercent / 100);
    const finalPrice = basePrice - discountAmount;
    
    return {
      recommendedDiscount: `${discountPercent}%`,
      finalPriceWithDiscount: `$${finalPrice.toLocaleString()}`,
      originalPrice: `$${basePrice.toLocaleString()}`,
      discountAmount: `$${discountAmount.toLocaleString()}`
    };
  };
  
  // Special handling for Policy Evaluation - show both discount options with ConfigService-driven pricing data
  if (currentCommand === 'Policy Evaluation') {
    // Show loading state while fetching pricing configuration
    if (pricingDefaultsLoading || discountRulesLoading) {
      return (
        <div className="space-y-2">
          <div className="w-full flex items-center justify-between p-3 bg-slate-500/10 border border-slate-500/30 rounded-lg animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-slate-400 rounded"></div>
              <div className="space-y-1">
                <div className="w-32 h-3 bg-slate-400 rounded"></div>
                <div className="w-40 h-2 bg-slate-500 rounded"></div>
              </div>
            </div>
          </div>
          <div className="w-full flex items-center justify-between p-3 bg-slate-500/10 border border-slate-500/30 rounded-lg animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-slate-400 rounded"></div>
              <div className="space-y-1">
                <div className="w-32 h-3 bg-slate-400 rounded"></div>
                <div className="w-40 h-2 bg-slate-500 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Compute pricing from ConfigService data
    const computedPricing = computePricingFromRules();
    const finalPricing = pricingData || computedPricing;
    
    // If no pricing configuration is available, show configuration unavailable state
    if (!finalPricing) {
      return (
        <div className="space-y-2">
          <div className="w-full p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="text-amber-400 font-medium text-sm">Configuration Unavailable</div>
                <div className="text-slate-400 text-xs">Pricing rules not configured. Contact administrator.</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => triggerCommand('Generate Quote (Manual)')}
            data-testid="button-generate-quote-manual"
            className="w-full flex items-center justify-between p-3 bg-slate-600/10 hover:bg-slate-600/20 border border-slate-600/30 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-slate-400" />
              <div className="text-left">
                <div className="text-slate-300 font-medium text-sm">Generate Quote (Manual Review)</div>
                <div className="text-slate-500 text-xs">Manual pricing required due to missing configuration</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        <button
          onClick={() => triggerCommand('Generate Quote')}
          data-testid="button-generate-quote-with-discount"
          className="w-full flex items-center justify-between p-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-3">
            <DollarSign className="w-4 h-4 text-green-400" />
            <div className="text-left">
              <div className="text-green-400 font-medium text-sm">Generate Quote (With Discount)</div>
              <div className="text-slate-400 text-xs">Accept JARVIS {finalPricing.recommendedDiscount} discount - Final: {finalPricing.finalPriceWithDiscount}</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        
        <button
          onClick={() => triggerCommand('Generate Quote (No Discount)')}
          data-testid="button-generate-quote-no-discount"
          className="w-full flex items-center justify-between p-3 bg-slate-600/10 hover:bg-slate-600/20 border border-slate-600/30 rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-3">
            <XCircle className="w-4 h-4 text-slate-400" />
            <div className="text-left">
              <div className="text-slate-300 font-medium text-sm">Generate Quote (No Discount)</div>
              <div className="text-slate-500 text-xs">Decline JARVIS recommendation - Final: {finalPricing.originalPrice}</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    );
  }

  // Get next recommended action for other commands using ConfigService
  const nextAction = getNextRecommendedCommand(currentCommand, persona, workflowMappingsConfig);
  if (!nextAction) {
    // Show loading state while fetching fallback actions
    if (fallbackActionsLoading) {
      return (
        <div className="grid grid-cols-2 gap-2">
          {[1, 2].map((index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-slate-500/10 border border-slate-500/30 rounded-lg animate-pulse"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-400 rounded"></div>
                <div className="space-y-1">
                  <div className="w-16 h-3 bg-slate-400 rounded"></div>
                  <div className="w-20 h-2 bg-slate-500 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    const actions = getFallbackActions(persona);
    
    return (
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <button
              key={index}
              onClick={() => triggerCommand(action.command)}
              data-testid={`button-${action.command.toLowerCase().replace(/\s+/g, '-')}`}
              className={`flex items-center justify-between p-2 ${colorClassMappings[action.color as keyof typeof colorClassMappings]?.bg || 'bg-slate-500/10'} ${colorClassMappings[action.color as keyof typeof colorClassMappings]?.bgHover || 'hover:bg-slate-500/20'} border ${colorClassMappings[action.color as keyof typeof colorClassMappings]?.border || 'border-slate-500/30'} rounded-lg transition-colors group`}
            >
              <div className="flex items-center gap-2">
                <IconComponent className={`w-3 h-3 ${colorClassMappings[action.color as keyof typeof colorClassMappings]?.text || 'text-slate-400'}`} />
                <div className="text-left">
                  <div className={`${colorClassMappings[action.color as keyof typeof colorClassMappings]?.text || 'text-slate-400'} font-medium text-xs`}>{action.label}</div>
                  <div className="text-slate-500 text-xs">{action.description}</div>
                </div>
              </div>
              <ArrowRight className={`w-3 h-3 ${colorClassMappings[action.color as keyof typeof colorClassMappings]?.text || 'text-slate-400'} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </button>
          );
        })}
      </div>
    );
  }

  // Single next action for workflow progression
  const IconComponent = nextAction.icon;
  return (
    <button
      onClick={() => triggerCommand(nextAction.next)}
      data-testid={`button-${nextAction.next.toLowerCase().replace(/\s+/g, '-')}`}
      className={`w-full flex items-center justify-between p-3 ${colorClassMappings[nextAction.color as keyof typeof colorClassMappings]?.bg || 'bg-slate-500/10'} ${colorClassMappings[nextAction.color as keyof typeof colorClassMappings]?.bgHover || 'hover:bg-slate-500/20'} border ${colorClassMappings[nextAction.color as keyof typeof colorClassMappings]?.border || 'border-slate-500/30'} rounded-lg transition-colors group`}
    >
      <div className="flex items-center gap-3">
        <IconComponent className={`w-4 h-4 ${colorClassMappings[nextAction.color as keyof typeof colorClassMappings]?.text || 'text-slate-400'}`} />
        <div className="text-left">
          <div className={`${colorClassMappings[nextAction.color as keyof typeof colorClassMappings]?.text || 'text-slate-400'} font-medium text-sm`}>{nextAction.next}</div>
          <div className="text-slate-400 text-xs">{nextAction.description}</div>
        </div>
      </div>
      <ArrowRight className={`w-4 h-4 ${colorClassMappings[nextAction.color as keyof typeof colorClassMappings]?.text || 'text-slate-400'} opacity-0 group-hover:opacity-100 transition-opacity`} />
    </button>
  );
};

// Helper functions for command-specific execution data
const getLayerIcon = (layerName: string) => {
  switch (layerName.toLowerCase()) {
    case 'experience': case 'experience layer': return Users;
    case 'meta brain': case 'meta brain layer': return Brain;
    case 'role': case 'role layer': return Users;
    case 'process': case 'process layer': return Database;
    case 'system': case 'system layer': return Cloud;
    case 'interface': case 'interface layer': return Layers;
    default: return Cog;
  }
};

const getLayerResult = (layer: any, submissionDetails: any) => {
  if (layer.layer === 'Role Layer' && submissionDetails.emailType) {
    return `${submissionDetails.emailType} generated successfully`;
  }
  if (layer.layer === 'Process Layer' && submissionDetails.riskFactors) {
    return `Policy evaluation completed - ${Object.keys(submissionDetails.riskFactors).length} factors analyzed`;
  }
  return layer.action;
};

// Rich content display components for different workflow types
const renderEmailContent = (details: any) => (
  <div className="hexaware-glass rounded-lg p-4 mt-4 border border-slate-600">
    <div className="flex items-center gap-2 mb-3">
      <Mail className="w-5 h-5 text-blue-400" />
      <span className="font-semibold text-white">Email Details</span>
    </div>
    <div className="space-y-3">
      {details.emailDetails && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">To:</span>
            <span className="text-white">{details.emailDetails.to}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">From:</span>
            <span className="text-white">{details.emailDetails.from}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Subject:</span>
            <span className="text-white text-sm">{details.emailDetails.subject}</span>
          </div>
        </div>
      )}
      {details.emailContent && (
        <div className="border-t border-slate-600 pt-3">
          <div className="text-slate-400 text-sm mb-2">Email Content:</div>
          <div className="glass-card p-3 rounded text-sm text-white whitespace-pre-wrap max-h-40 overflow-y-auto">
            {details.emailContent}
          </div>
        </div>
      )}
      {details.documentationRequests && (
        <div className="border-t border-slate-600 pt-3">
          <div className="text-slate-400 text-sm mb-2">Documentation Requested:</div>
          <div className="space-y-1">
            {details.documentationRequests.map((doc: string, index: number) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-white">{doc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="border-t border-slate-600 pt-3 flex gap-2">
        <button
          onClick={() => {
            setTimeout(() => {
              const event = new CustomEvent('jarvis-command', {
                detail: {
                  command: 'Show Inbox',
                  mode: 'Pill'
                }
              });
              window.dispatchEvent(event);
            }, 100);
          }}
          className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
        >
          View Inbox
        </button>
        <button
          onClick={() => {
            setTimeout(() => {
              const event = new CustomEvent('jarvis-command', {
                detail: {
                  command: 'Send Email',
                  mode: 'Pill'
                }
              });
              window.dispatchEvent(event);
            }, 100);
          }}
          className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
        >
          Send Another Email
        </button>
      </div>
    </div>
  </div>
);

// Risk Assessment functionality has been removed - agents purged from database

// Commercial Property Email Intake using unified CP design system
const renderEmailIntakeContent = (details: any, onClose?: () => void) => {
  const handleSubmit = (data: any) => {
    console.log('CP Email Intake submitted:', data);
    // Trigger next step in workflow
    onClose?.();
    setTimeout(() => {
      const event = new CustomEvent('jarvis-command', {
        detail: { command: 'Document Processing', mode: 'Pill' }
      });
      window.dispatchEvent(event);
    }, 100);
  };

  return (
    <CPEmailIntake 
      onSubmit={handleSubmit}
      onCancel={onClose}
      initialData={details.initialData}
    />
  );
};

const renderSystemDiagnosticsContent = (details: any) => (
  <div className="hexaware-glass rounded-lg p-4 mt-4 border border-slate-600">
    <div className="flex items-center gap-2 mb-3">
      <Cog className="w-5 h-5 text-green-400" />
      <span className="font-semibold text-white">Infrastructure Health Check</span>
    </div>
    <div className="space-y-3 text-sm">
      <div className="text-slate-400 mb-2">Scope: {details.scope}</div>
      {details.findings && (
        <div className="space-y-2">
          {Object.entries(details.findings).map(([system, status]: [string, any]) => (
            <div key={system} className="flex justify-between items-center glass-card p-2 rounded">
              <span className="text-white capitalize">{system}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={
                  status.status === 'Healthy' || status.status === 'Optimal' || status.status === 'Secure' ? 
                  'bg-green-500/20 text-green-400' : 
                  status.status === 'Warning' ? 'bg-yellow-500/20 text-yellow-400' : 
                  'bg-red-500/20 text-red-400'
                }>
                  {status.status}
                </Badge>
                {status.responseTime && (
                  <span className="text-slate-400 text-xs">{status.responseTime}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// Commercial Property agents are now integrated into the main 6-layer hierarchy
// Using unified CP design system for consistent user experience across all CP workflows

const renderMetricsContent = (details: any, submissionDetails: any) => (
  <div className="hexaware-glass rounded-lg p-4 mt-4 border border-slate-600">
    <div className="flex items-center gap-2 mb-3">
      <Database className="w-5 h-5 text-blue-400" />
      <span className="font-semibold text-white">{details.metricsType}</span>
    </div>
    <div className="grid grid-cols-2 gap-3 text-sm">
      {submissionDetails.activeAgents && (
        <div className="glass-card p-2 rounded">
          <div className="text-slate-400 text-xs">Active Agents</div>
          <div className="text-white font-semibold">{submissionDetails.activeAgents}/{submissionDetails.totalAgents}</div>
        </div>
      )}
      {submissionDetails.successRate && (
        <div className="glass-card p-2 rounded">
          <div className="text-slate-400 text-xs">Success Rate</div>
          <div className="text-green-400 font-semibold">{submissionDetails.successRate}%</div>
        </div>
      )}
      {submissionDetails.cpuUtilization && (
        <div className="glass-card p-2 rounded">
          <div className="text-slate-400 text-xs">CPU Usage</div>
          <div className="text-white font-semibold">{submissionDetails.cpuUtilization}%</div>
        </div>
      )}
      {submissionDetails.avgResponseTime && (
        <div className="glass-card p-2 rounded">
          <div className="text-slate-400 text-xs">Response Time</div>
          <div className="text-white font-semibold">{submissionDetails.avgResponseTime}ms</div>
        </div>
      )}
    </div>
  </div>
);

const renderPolicyEvaluationContent = (details: any, onClose?: () => void) => (
  <div className="hexaware-glass rounded-lg p-4 mt-4 border border-slate-600">
    <div className="flex items-center gap-2 mb-3">
      <FileText className="w-5 h-5 text-purple-400" />
      <span className="font-semibold text-white">Policy Evaluation with Integrated Pricing</span>
    </div>
    <div className="space-y-4 text-sm">
      {/* Coverage Analysis */}
      {details.policyEvaluation?.coverageAnalysis && (
        <div className="glass-card p-3 rounded">
          <div className="text-slate-400 text-xs mb-2">Coverage Analysis</div>
          <div className="space-y-1 text-xs">
            <div className="text-white">• Coverage: {details.policyEvaluation.coverageAnalysis.recommendedCoverage}</div>
            <div className="text-white">• Line Participation: {details.policyEvaluation.coverageAnalysis.lineParticipation}</div>
            <div className="text-green-400">• Adequacy: {details.policyEvaluation.coverageAnalysis.adequacyRating}</div>
          </div>
        </div>
      )}

      {/* Integrated Pricing */}
      {details.integratedPricing && (
        <div className="glass-card p-3 rounded">
          <div className="text-slate-400 text-xs mb-2">Premium Calculation</div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-300">Base Premium:</span>
              <span className="text-white font-semibold">{details.integratedPricing.basePremium}</span>
            </div>
            {details.integratedPricing.riskAdjustments && Object.entries(details.integratedPricing.riskAdjustments).map(([key, value]: [string, any]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <span className={value.includes('-') ? 'text-green-400' : 'text-yellow-400'}>{value}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-slate-600 pt-2">
              <span className="text-slate-300">Gross Premium:</span>
              <span className="text-white font-semibold">{details.integratedPricing.grossPremium}</span>
            </div>
          </div>
        </div>
      )}

      {/* Discount Application */}
      {details.discountApplication && (
        <div className="bg-green-500/10 border border-green-500/30 p-3 rounded">
          <div className="flex items-center justify-between mb-2">
            <div className="text-green-400 text-xs">JARVIS Discount Applied</div>
            <button
              onClick={() => {
                // Close the popup and trigger Generate Quote without discount
                onClose && onClose();
                setTimeout(() => {
                  const event = new CustomEvent('jarvis-command', {
                    detail: { 
                      command: 'Generate Quote (No Discount)', 
                      mode: 'Pill',
                      skipDiscount: true 
                    }
                  });
                  window.dispatchEvent(event);
                }, 100);
              }}
              className="text-xs px-2 py-1 bg-slate-600 hover:bg-slate-500 text-slate-300 hover:text-white rounded transition-colors"
              title="Reject discount and proceed to quote generation"
            >
              Reject Discount
            </button>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-300">Discount Type:</span>
              <span className="text-green-400">{details.discountApplication.discountType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Discount Amount:</span>
              <span className="text-green-400 font-semibold">{details.discountApplication.discountAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Percentage:</span>
              <span className="text-green-400">{details.discountApplication.discountPercentage}</span>
            </div>
            <div className="text-slate-400 text-xs mt-2">{details.discountApplication.justification}</div>
          </div>
        </div>
      )}

      {/* Final Quote */}
      {details.finalQuote && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 p-3 rounded">
          <div className="text-cyan-400 text-xs mb-2">Final Quote Summary</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-300">Quote Reference:</span>
              <span className="text-cyan-400 font-mono">{details.finalQuote.quoteReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Final Premium:</span>
              <span className="text-cyan-400 font-semibold text-lg">{details.finalQuote.finalPremium}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Broker Commission:</span>
              <span className="text-slate-400">{details.finalQuote.brokerCommission}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Valid Until:</span>
              <span className="text-slate-400">{details.finalQuote.validUntil}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

const renderPricingContent = (details: any, onClose?: () => void) => (
  <div className="hexaware-glass rounded-lg p-4 mt-4 border border-slate-600">
    <div className="flex items-center gap-2 mb-3">
      <FileText className="w-5 h-5 text-green-400" />
      <span className="font-semibold text-white">Premium Calculation</span>
    </div>
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-slate-400">Quote Reference:</span>
        <span className="text-white font-mono">{details.quoteReference}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-400">Base Premium:</span>
        <span className="text-white">{details.basePremium}</span>
      </div>
      {details.riskAdjustments && (
        <div className="space-y-2">
          <span className="text-slate-400">Risk Adjustments:</span>
          {Object.entries(details.riskAdjustments).map(([key, adjustment]: [string, any]) => (
            <div key={key} className="flex justify-between items-center glass-card p-2 rounded text-xs">
              <span className="text-white capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className={adjustment.toString().startsWith('+') ? 'text-red-400' : 'text-green-400'}>
                {adjustment}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="border-t border-slate-600 pt-3 space-y-2">
        <div className="flex justify-between">
          <span className="text-slate-400">Subtotal:</span>
          <span className="text-white">{details.subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Admin Fees:</span>
          <span className="text-white">{details.adminFees}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span className="text-slate-400">Gross Premium:</span>
          <span className="text-green-400">{details.grossPremium}</span>
        </div>
      </div>
      <div className="glass-card p-2 rounded">
        <span className="text-xs text-slate-400">{details.status}</span>
      </div>

    </div>
  </div>
);



const getSuccessMessage = (submissionDetails: any, agentName: string) => {
  if (agentName.includes('Email Generator')) {
    return `Email composition completed: ${submissionDetails.emailType || 'Communication'} sent to ${submissionDetails.recipient || 'recipient'} at ${submissionDetails.status || 'timestamp'}`;
  }
  if (agentName.includes('Risk Analysis')) {
    return `Risk analysis completed: Final premium £${submissionDetails.pricing?.finalPremium || '0'} calculated for ${submissionDetails.propertyType || 'property'}`;
  }
  return `Agent execution completed successfully`;
};

interface AgentLayer {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  agent: string;
  action: string;
  duration?: number;
  result?: string;
  icon: typeof Brain;
}

interface PersonaExecutionConfig {
  title: string;
  subtitle: string;
  primaryColor: string;
  accentColor: string;
  layers: AgentLayer[];
  successMessage: string;
  errorMessage?: string;
}

interface UniversalAgentExecutionPopupProps {
  isVisible: boolean;
  onClose: () => void;
  persona: PersonaType;
  agentName?: string;
  agentType?: string;
  action?: string;
  config?: PersonaExecutionConfig;
  submissionDetails?: any; // Command-specific execution data
  originalCommand?: string; // Original command for voice responses
}

// Dynamic voice response function using real agent execution data
const getDynamicVoiceResponse = (command: string, persona: string, submissionDetails?: any): string => {
  // Use real submission data when available, no hardcoded fallbacks
  if (persona === 'rachel') {
    if (command === 'Send Email' && submissionDetails) {
      const clientName = submissionDetails.client || submissionDetails.clientName || 'the client';
      const brokerName = submissionDetails.broker || submissionDetails.brokerName || 'the broker';
      const riskLevel = submissionDetails.riskLevel || 'pending review';
      const recommendedLine = submissionDetails.recommendedLine || 'TBD';
      
      return `You should now review the submission by ${clientName} (${brokerName}) as the initial risk analysis is ${riskLevel} and we can provide a ${recommendedLine} Line.`;
    }
    
    if (command === 'Policy Evaluation' && submissionDetails) {
      const clientName = submissionDetails.client || submissionDetails.clientName || 'the client';
      const propertyType = submissionDetails.propertyType || 'property';
      return `Policy evaluation shows ${clientName}'s ${propertyType} evaluation is complete. Ready for next workflow step.`;
    }
    
    // Fallback responses when no real data is available  
    return {
      'Review Submissions': 'Submission review complete. Consider running policy evaluation for priority cases.',
      'Show submissions': 'Ready to review new submissions. I recommend starting with the most recent broker communications.',
      'Policy Evaluation': 'Policy evaluation workflow completed. Ready for pricing calculation.',
      'Price Quote': 'Premium calculation completed. Ready for discount evaluation.',
      'Apply Discount': 'Discount evaluation completed. Ready for quote generation.',
      'Generate Quote': 'Quote generation workflow completed successfully.'
    }[command] || 'Assistant Underwriter workflow completed. What would you like to process next?';
  }

  // Default responses for other personas
  const defaultResponses: Record<string, Record<string, string>> = {
    john: {
      'System Status': 'System status checked. All infrastructure components are operating within normal parameters.',
      'Security Scan': 'Security scan completed. No critical vulnerabilities detected in current infrastructure.',
      'Send Email': 'IT notification sent to team. System maintenance window scheduled for tonight.'
    },
    admin: {
      'Show Metrics': 'System metrics reviewed. All agents operating at optimal performance levels.',
      'System Status': 'System status analyzed. Meta Brain coordination functioning at 94% efficiency.',
      'Send Email': 'Administrative notification sent. System operations continue normally.'
    }
  };

  const personaResponses = defaultResponses[persona.toLowerCase()];
  return personaResponses?.[command] || 'Command completed successfully.';
};

// Dynamic persona configs based on company information
const getPersonaConfigs = (companyName: string = 'ABC Insurance Ltd'): Record<string, PersonaExecutionConfig> => ({
  admin: {
    title: `${companyName} System Analysis`,
    subtitle: `Comprehensive system performance and agent coordination analysis for ${companyName}`,
    primaryColor: "blue",
    accentColor: "cyan",
    layers: [
      {
        id: "experience",
        name: "Experience Layer",
        status: "completed",
        agent: companyName,
        action: "Insurance company configuration activated",
        duration: 582,
        result: "Admin Persona activated successfully",
        icon: Users
      },
      {
        id: "metabrain",
        name: "Meta Brain Layer", 
        status: "completed",
        agent: `${companyName} Meta Brain`,
        action: "Route to Admin Functions",
        duration: 495,
        result: "Admin Functions routed successfully",
        icon: Brain
      },
      {
        id: "role",
        name: "Role Layer",
        status: "completed",
        agent: `${companyName} Admin`,
        action: "System Performance Analysis",
        duration: 1243,
        result: "System metrics analyzed and optimized",
        icon: Users
      },
      {
        id: "process",
        name: "Process Layer",
        status: "completed",
        agent: `${companyName} System Monitoring Agent`,
        action: "Agent Status Verification",
        duration: 867,
        result: "All agents operational and responding",
        icon: CheckCircle
      },
      {
        id: "system",
        name: "System Layer",
        status: "completed",
        agent: `${companyName} Data Analysis Agent`,
        action: "System Analytics",
        duration: 723,
        result: "Comprehensive system performance metrics retrieved",
        icon: Database
      },
      {
        id: "interface",
        name: "Interface Layer",
        status: "completed",
        agent: `${companyName} Response Integration Agent`,
        action: "UI Response Formatting",
        duration: 185,
        result: "System metrics formatted for display",
        icon: Layers
      }
    ],
    successMessage: "System Metrics Overview: • Active Agents: 12/15 (80% operational) • Success Rate: 94% • Error Rate: 6% • CPU Utilization: 48% • Memory Usage: 67% • Throughput: 145 requests/hour • Avg Response Time: 185ms • Meta Brain Status: Optimal"
  },
  rachel: {
    title: `${companyName} Assistant Underwriter Analysis`,
    subtitle: `Policy evaluation and submission processing workflow for ${companyName}`,
    primaryColor: "purple",
    accentColor: "pink",
    layers: [
      {
        id: "experience",
        name: "Experience Layer",
        status: "completed",
        agent: companyName,
        action: "Insurance company configuration activated",
        duration: 445,
        result: "Rachel Thompson persona activated",
        icon: Users
      },
      {
        id: "metabrain",
        name: "Meta Brain Layer",
        status: "completed", 
        agent: `${companyName} Meta Brain`,
        action: "Route to AUW Functions",
        duration: 523,
        result: "Assistant Underwriter functions enabled",
        icon: Brain
      },
      {
        id: "role",
        name: "Role Layer",
        status: "completed",
        agent: `Rachel Thompson ${companyName} Assistant Underwriter`,
        action: "Policy Evaluation Analysis",
        duration: 1567,
        result: "Risk factors analyzed for active submissions",
        icon: Users
      },
      {
        id: "process",
        name: "Process Layer",
        status: "completed",
        agent: `${companyName} Workflow Automation Agent`,
        action: "Submission Queue Processing",
        duration: 934,
        result: "17 submissions processed, 3 flagged for review",
        icon: CheckCircle
      },
      {
        id: "system",
        name: "System Layer",
        status: "completed",
        agent: `${companyName} Data Retrieval Agent`,
        action: "Underwriting Data Analysis",
        duration: 789,
        result: "Comprehensive underwriting metrics compiled",
        icon: Database
      },
      {
        id: "interface",
        name: "Interface Layer",
        status: "completed",
        agent: `${companyName} Assistant Underwriter Response Agent`,
        action: "Metrics Formatting",
        duration: 203,
        result: "Assistant Underwriter dashboard metrics prepared",
        icon: Layers
      }
    ],
    successMessage: "Assistant Underwriter Metrics Overview: • Active Submissions: 17 • Priority Reviews: 3 • Risk Score Average: 72% • Processing Rate: 94% • Queue Status: Current • Flagged Cases: 2 High Risk, 1 Documentation • Success Rate: 96% • Avg Processing Time: 8.5 minutes"
  },
  john: {
    title: `${companyName} IT Support System Analysis`, 
    subtitle: `Infrastructure monitoring and incident management workflow for ${companyName}`,
    primaryColor: "green",
    accentColor: "emerald",
    layers: [
      {
        id: "experience",
        name: "Experience Layer",
        status: "completed",
        agent: companyName, 
        action: "Insurance company configuration activated",
        duration: 398,
        result: "John Stevens persona activated",
        icon: Users
      },
      {
        id: "metabrain",
        name: "Meta Brain Layer",
        status: "completed",
        agent: `${companyName} Meta Brain`,
        action: "Route to IT Functions", 
        duration: 467,
        result: "IT Support functions enabled",
        icon: Brain
      },
      {
        id: "role",
        name: "Role Layer",
        status: "completed",
        agent: `John Stevens ${companyName} IT Support`,
        action: "Infrastructure Health Check",
        duration: 1345,
        result: "System infrastructure analyzed and verified",
        icon: Users
      },
      {
        id: "process",
        name: "Process Layer", 
        status: "completed",
        agent: `${companyName} Incident Management Agent`,
        action: "Ticket Queue Processing",
        duration: 823,
        result: "12 incidents resolved, 4 escalated to priority",
        icon: CheckCircle
      },
      {
        id: "system",
        name: "System Layer",
        status: "completed",
        agent: `${companyName} System Health Agent`,
        action: "Performance Monitoring",
        duration: 654,
        result: "Infrastructure metrics collected and analyzed",
        icon: Database
      },
      {
        id: "interface",
        name: "Interface Layer",
        status: "completed",
        agent: `${companyName} IT Response Agent`, 
        action: "Status Report Generation",
        duration: 176,
        result: "IT dashboard metrics formatted",
        icon: Layers
      }
    ],
    successMessage: "IT Metrics Overview: • System Uptime: 99.7% • Active Incidents: 4 • Resolved Today: 12 • Server Health: Optimal • Network Status: Stable • Security Score: 98% • Backup Status: Current • Critical Alerts: 0 • Response Time: 2.3 minutes"
  }
});

// Updated component interface combining both Universal and Unified patterns
interface UniversalAgentExecutionPopupProps {
  isVisible: boolean;
  onClose: () => void;
  persona: PersonaType;
  executionId?: string; // Connect to real orchestration execution
  agentName?: string;
  agentType?: string;
  action?: string;
  submissionDetails?: any;
  originalCommand?: string;
}


export function UniversalAgentExecutionPopup({
  isVisible,
  onClose,
  persona,
  executionId,
  agentName,
  agentType,
  action,
  submissionDetails,
  originalCommand
}: UniversalAgentExecutionPopupProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentExecutionId, setExecutionId] = useState<string | null>(executionId || null);
  const queryClient = useQueryClient();


  // Real agent execution hooks - use the executionId from props
  const startExecution = useStartAgentExecution();
  const userId = '42981218'; // Get from auth context in real implementation
  const { execution, steps: realSteps, isConnected, error: wsError } = useAgentExecution(currentExecutionId || null, userId);
  
  // Only log when connection status changes to avoid spam
  useEffect(() => {
    console.log('🔌 UniversalAgentExecutionPopup WebSocket status:', { executionId, isConnected, error: wsError });
  }, [isConnected, wsError]);

  // Update isComplete state when execution completes
  useEffect(() => {
    if (execution?.status === 'completed') {
      setIsComplete(true);
      setIsPlaying(false);
    } else if (execution?.status === 'running') {
      setIsPlaying(true);
      setIsComplete(false);
    } else if (execution?.status === 'error' || execution?.status === 'cancelled') {
      setIsPlaying(false);
      setIsComplete(false);
    }
  }, [execution?.status]);

  // Use unified hierarchy config - Phase 5: Universal Hierarchy Display
  const { currentPersona } = usePersona();
  const { hierarchyConfig, isLoading: hierarchyLoading, error: hierarchyError } = useUnifiedHierarchyConfig(currentPersona);

  // Extract company name and agents data from unified config - Phase 5: Universal Hierarchy Display  
  const companyName = hierarchyConfig?.experienceLayer?.companyName || 
                     hierarchyConfig?.experienceConfig?.companyName || 
                     'Markel Insurance'; // Use Markel as authoritative fallback
  const agentsData = hierarchyConfig ? transformHierarchyToAgentsFormat(hierarchyConfig) : null;
  
  // Unified hierarchy config successfully integrated - Phase 5: Universal Hierarchy Display
  
  // Build dynamic workflow from real database agents (fallback only)
  const workflow = agentsData ? 
    buildPersonaWorkflowFromAgents(agentsData, persona, companyName, originalCommand || action, hierarchyConfig) :
    { title: `${companyName} ${persona} Workflow`, steps: [] };
    
  const staticSteps = workflow.steps.map((step, index) => ({
    id: index + 1,
    ...step,
    result: step.status === 'completed' ? `${step.action} completed successfully` : undefined,
    duration: step.status === 'completed' ? Math.floor(Math.random() * 500) + 100 : undefined
  }));

  // PRIORITIZE static 6-layer structure with filtered agents - no duplicates
  // Always use the filtered static structure (max 6 steps), only update status from WebSocket 
  const executionSteps = staticSteps.map((staticStep, index) => {
    // Find matching real step by layer name or step order
    const matchingRealStep = realSteps.find(realStep => 
      realStep.layer === staticStep.layer || 
      realStep.stepOrder === index + 1
    );
    
    if (matchingRealStep) {
      // Update static step with real execution data while preserving structure
      return {
        ...staticStep,
        status: matchingRealStep.status,
        agentName: matchingRealStep.agentName || staticStep.agent,
        duration: matchingRealStep.duration,
        startedAt: matchingRealStep.startedAt,
        completedAt: matchingRealStep.completedAt,
        result: matchingRealStep.status === 'completed' ? 
          `${matchingRealStep.agentName || staticStep.agent} completed successfully` : 
          staticStep.result
      };
    }
    
    return staticStep; // Keep original static step if no matching real data
  });

  // Get dynamic persona configs based on company name
  const personaConfigs = getPersonaConfigs(companyName);
  const config = personaConfigs[persona];

  // Start real agent execution when popup opens
  useEffect(() => {
    if (!isVisible || !agentsData || currentExecutionId) return;

    const startRealExecution = async () => {
      try {
        setIsPlaying(true);
        const command = originalCommand || action || 'Execute workflow';
        const result = await startExecution.mutateAsync({
          persona,
          command,
          orchestrationStrategy: 'sequential'
        });
        setExecutionId(result.executionId);
      } catch (error) {
        console.error('Failed to start agent execution:', error);
        setIsPlaying(false);
      }
    };

    startRealExecution();
  }, [isVisible, agentsData, persona, originalCommand, action, executionId]);

  // Update progress based on real execution steps
  useEffect(() => {
    if (!realSteps.length) return;

    const completedSteps = realSteps.filter(step => step.status === 'completed').length;
    const totalSteps = realSteps.length;
    const newProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
    
    setProgress(newProgress);
    setCurrentStep(completedSteps);
    
    if (execution?.status === 'completed') {
      setIsComplete(true);
      setIsPlaying(false);
    } else if (execution?.status === 'error') {
      setIsPlaying(false);
    }
  }, [realSteps, execution]);

  // Helper functions for status management
  const getStepStatus = (stepIndex: number) => {
    // Check if there's real step data from WebSocket
    const realStep = realSteps.find(s => s.stepOrder === stepIndex + 1);
    if (realStep && realStep.status) {
      return realStep.status;
    }
    
    // Fallback to simulated status
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'running';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'running': return 'text-blue-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'running': return Zap;
      case 'error': return AlertCircle;
      default: return Brain;
    }
  };

  // Retry failed execution
  const handleRetry = async () => {
    try {
      setRetryCount(prev => prev + 1);
      setExecutionId(null);
      setIsPlaying(false);
      setIsComplete(false);
      setProgress(0);
      setCurrentStep(0);
      
      // Wait a moment then start new execution
      setTimeout(async () => {
        try {
          setIsPlaying(true);
          const command = originalCommand || action || 'Execute workflow';
          const result = await startExecution.mutateAsync({
            persona,
            command,
            orchestrationStrategy: 'sequential'
          });
          setExecutionId(result.executionId);
        } catch (error) {
          console.error('Retry failed:', error);
          setIsPlaying(false);
        }
      }, 500);
    } catch (error) {
      console.error('Error during retry:', error);
    }
  };

  // Voice response integration
  useEffect(() => {
    if (isComplete && originalCommand) {
      const responseText = `${workflow.title} completed successfully`;
      globalVoiceManager.speak(responseText, persona);
    }
  }, [isComplete, originalCommand, workflow.title]);

  // Show loading state while fetching data
  if (!isVisible) return null;
  
  if (hierarchyLoading) {
    return (
      <Dialog open={isVisible} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl hexaware-glass text-white">
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6 text-blue-400 animate-pulse" />
              <span className="text-lg">Loading agent execution framework...</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isVisible} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] hexaware-glass text-white flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6 text-blue-400" />
              <div>
                <h2 className="text-lg font-bold">{workflow.title}</h2>
                <p className="text-sm text-gray-400">
                  {agentName && agentType && action ? 
                    `${agentName} • ${agentType} • ${action}` : 
                    `${companyName} Real Agent Coordination • 6-Layer Architecture`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-blue-400 hover:text-blue-300"
                data-testid="button-play-pause"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentStep(2);
                  setProgress(35);
                  setIsPlaying(true);
                  setIsComplete(false);
                }}
                className="text-gray-400 hover:text-gray-300"
                data-testid="button-restart"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-300"
                data-testid="button-close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          {/* Progress Overview */}
          <div className="hexaware-glass rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Execution Progress</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
                {wsError && !isConnected && (
                  <Badge variant="destructive" className="text-xs">
                    Connection Lost
                  </Badge>
                )}
                {execution?.status === 'error' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRetry}
                    className="h-6 px-2 text-xs text-red-400 border-red-500/50 hover:bg-red-500/10"
                    data-testid="button-retry-execution"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Retry ({retryCount})
                  </Button>
                )}
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>Started {execution?.startedAt ? new Date(execution.startedAt).toLocaleTimeString() : ''}</span>
              <span>
                {isComplete ? 'Completed' : 
                 execution?.status === 'error' ? 'Failed' :
                 isPlaying ? 'Processing...' : 'Paused'}
              </span>
            </div>
            {execution?.totalDuration && (
              <div className="text-xs text-gray-500 mt-1">
                Total execution time: {execution.totalDuration}ms
              </div>
            )}
          </div>

          {/* Execution Steps - Always maintain 6-layer hierarchy with hybrid parallel support */}
          <div className="space-y-1">
            {executionSteps.map((step, index) => {
              const status = getStepStatus(index);
              const StatusIcon = getStatusIcon(status);
              const LayerIcon = ICON_MAP[step.layer.replace(' Layer', '') as keyof typeof ICON_MAP] || Brain;
              const layerColors = getLayerColors(step.layer.replace(' Layer', ''), hierarchyConfig);
              const layerColor = layerColors.badgeColor;

              return (
                <div key={`layer-${index}`} className="relative">
                  {/* Data Flow Arrow */}
                  {index > 0 && (
                    <div className="flex justify-center mb-2">
                      <div className="flex flex-col items-center">
                        <ArrowRight className={`w-4 h-4 ${
                          status === 'completed' || getStepStatus(index - 1) === 'completed' 
                            ? 'text-green-400' 
                            : status === 'running' 
                            ? 'text-blue-400 animate-pulse' 
                            : 'text-gray-600'
                        }`} />
                        <div className="text-xs text-gray-500 mt-1">
                          Data Flow
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    className={`rounded-lg border transition-all ${
                      status === 'running' 
                        ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/20' 
                        : status === 'completed'
                        ? 'bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/10'
                        : status === 'error'
                        ? 'bg-red-500/10 border-red-500/50 shadow-lg shadow-red-500/20'
                        : 'hexaware-glass border-slate-700/50'
                    }`}
                    data-testid={`execution-step-${index}`}
                  >
                    {step.isParallel && step.agents && step.agents.length > 1 ? (
                    <>
                    {/* PARALLEL AGENTS WITHIN LAYER */}
                    <div className="p-4">
                      {/* Layer Header with Parallel Indicator */}
                      <div className="flex items-start space-x-4 mb-3">
                        <div className="flex-shrink-0 flex items-center space-x-2">
                          <div className={`p-2 rounded-lg ${layerColor.badgeColor}`}>
                            <LayerIcon className={`w-4 h-4`} />
                          </div>
                          <StatusIcon className={`w-5 h-5 ${getStatusColor(status)} ${status === 'running' ? 'animate-pulse' : ''}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-white">{('agentName' in step && step.agentName) || step.layer}</h4>
                            <Badge variant="outline" className={`text-xs ${getStatusColor(status)}`}>
                              {status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                            {(() => {
                              const layerColors = {
                                'Experience': 'bg-purple-500/20 text-purple-300 border-purple-500/50',
                                'Meta Brain': 'bg-blue-500/20 text-blue-300 border-blue-500/50',
                                'Role': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
                                'Process': 'bg-green-500/20 text-green-300 border-green-500/50',
                                'System': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
                                'Interface': 'bg-red-500/20 text-red-300 border-red-500/50'
                              };
                              const layerName = step.layer || 'Unknown Layer';
                              const colorClass = layerColors[layerName as keyof typeof layerColors] || 'bg-gray-500/20 text-gray-300 border-gray-500/50';
                              return (
                                <span className={`text-xs px-2 py-1 rounded-full border font-medium ${colorClass}`}>
                                  {layerName} Layer
                                </span>
                              );
                            })()} 
                          </div>
                          
                          {/* Parallel Processing Indicator */}
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center space-x-1">
                              <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                              <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                            <span className="text-xs text-slate-400">{step.agents.length} Agents Running Parallel</span>
                          </div>
                        </div>
                      </div>

                      {/* Parallel Agents Sub-Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {step.agents.map((agent: any, agentIndex: number) => {
                          const agentAction = agent.specialization || agent.description || agent.action || `Execute ${agent.name}`;
                          return (
                            <div
                              key={`agent-${agentIndex}`}
                              className="flex flex-col p-2 rounded border hexaware-glass border-slate-600/50"
                              data-testid={`parallel-agent-${agentIndex}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <StatusIcon className={`w-3 h-3 ${getStatusColor(status)} ${status === 'running' ? 'animate-pulse' : ''}`} />
                                <Badge variant="outline" className={`text-xs ${getStatusColor(status)}`}>
                                  {status}
                                </Badge>
                              </div>
                              
                              <div className="space-y-1">
                                <h5 className="text-xs font-medium text-white">{agent.name}</h5>
                                <p className="text-xs text-gray-400 leading-tight">{agentAction}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    </>
                  ) : (
                    <>
                    {/* SINGLE AGENT WITHIN LAYER */}
                    <div className="flex items-start space-x-4 p-4">
                      <div className="flex-shrink-0 flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${layerColor.badgeColor}`}>
                          <LayerIcon className={`w-4 h-4`} />
                        </div>
                        <StatusIcon className={`w-5 h-5 ${getStatusColor(status)} ${status === 'running' ? 'animate-pulse' : ''}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-white">{('agentName' in step && step.agentName) || step.layer}</h4>
                          <Badge variant="outline" className={`text-xs ${getStatusColor(status)}`}>
                            {status}
                          </Badge>
                        </div>
                        
                        {/* Agent Type & Layer */}
                        <div className="flex items-center space-x-2 mb-2">
                          {(() => {
                            const layerColors = {
                              'Experience': 'bg-purple-500/20 text-purple-300 border-purple-500/50',
                              'Meta Brain': 'bg-blue-500/20 text-blue-300 border-blue-500/50',
                              'Role': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
                              'Process': 'bg-green-500/20 text-green-300 border-green-500/50',
                              'System': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
                              'Interface': 'bg-red-500/20 text-red-300 border-red-500/50'
                            };
                            const layerName = step.layer || 'Unknown Layer';
                            const colorClass = layerColors[layerName as keyof typeof layerColors] || 'bg-gray-500/20 text-gray-300 border-gray-500/50';
                            return (
                              <span className={`text-xs px-2 py-1 rounded-full border font-medium ${colorClass}`}>
                                {layerName} Layer
                              </span>
                            );
                          })()}
                          {('agentType' in step && step.agentType) ? (
                            <span className="text-xs glass-card text-gray-300 px-2 py-1 rounded">
                              {String((step as any).agentType || '')}
                            </span>
                          ) : null}
                        </div>
                        
                        {/* Agent Specialization */}
                        {('specialization' in step && (step as any).specialization) && (
                          <p className="text-sm text-blue-400 mb-1">🎯 {(step as any).specialization}</p>
                        )}
                        
                        <p className="text-sm text-gray-400 mb-2">{step.action}</p>
                        
                        {/* Agent Description */}
                        {('description' in step && (step as any).description) && (
                          <div className="text-xs text-gray-500 mb-2 p-2 glass-card rounded border-l-2 border-blue-500">
                            📋 {(step as any).description}
                          </div>
                        )}
                        
                        {/* Agent Capabilities */}
                        {('capabilities' in step && (step as any).capabilities && Array.isArray((step as any).capabilities) && (step as any).capabilities.length > 0) && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 mb-1">🔧 Capabilities:</p>
                            <div className="flex flex-wrap gap-1">
                              {(Array.isArray(step.capabilities) ? step.capabilities : []).slice(0, 3).map((capability: string, idx: number) => (
                                <span key={idx} className="text-xs glass-morph text-gray-400 px-2 py-1 rounded">
                                  {capability}
                                </span>
                              ))}
                              {(Array.isArray(step.capabilities) ? step.capabilities : []).length > 3 && (
                                <span className="text-xs text-gray-500">+{(Array.isArray(step.capabilities) ? step.capabilities : []).length - 3} more</span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Results and Output Data */}
                        {step.result && (
                          <div className="mt-2 p-2 glass-card rounded text-xs text-green-400">
                            ✓ {step.result}
                            {step.duration && ` (${step.duration}ms)`}
                          </div>
                        )}
                        
                        {/* Rich Output Data Display */}
                        {'outputData' in step && step.outputData && step.status === 'completed' && (
                          <div className="mt-2 p-2 glass-card rounded text-xs">
                            <div className="text-gray-400 mb-1">📊 Execution Results:</div>
                            <div className="text-gray-300 space-y-1">
                              {(step.outputData as any)?.results && (
                                <div>✓ {(step.outputData as any).results}</div>
                              )}
                              {(step.outputData as any)?.metadata && (
                                <div className="text-gray-500">
                                  ⏱️ Processing: {(step.outputData as any).metadata.processingTime}ms
                                </div>
                              )}
                              {(step.outputData as any)?.status && (
                                <div className={(step.outputData as any).status === 'success' ? 'text-green-400' : 'text-red-400'}>
                                  🔄 Status: {(step.outputData as any).status}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    </>
                  )}
                  </div>
                </div>
              );
            })}
          </div>

          {isComplete && (
            <div className="pt-4 border-t border-slate-700">
              <div className="text-slate-400 text-sm mb-3 font-medium">Next Recommended Action</div>
              <NextRecommendedActions 
                currentCommand={originalCommand || action || ''} 
                persona={persona} 
                onClose={onClose}
                agentExecutionData={submissionDetails}
                pricingData={null}
              />
            </div>
          )}

          {/* Enhanced Results Section for Completed Executions */}
          {isComplete && execution?.result && (
            <div className="pt-4 border-t border-slate-700">
              <div className="text-slate-400 text-sm mb-3 font-medium">Execution Results</div>
              <div className="hexaware-glass rounded-lg p-4 border border-slate-600">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="font-semibold text-white">Execution Completed Successfully</span>
                  </div>
                  {execution.totalDuration && (
                    <span className="text-xs text-slate-400">{execution.totalDuration}ms</span>
                  )}
                </div>
                
                {execution.result.message && (
                  <div className="mb-3">
                    <div className="text-slate-400 text-xs mb-1">Summary</div>
                    <div className="text-white text-sm">{execution.result.message}</div>
                  </div>
                )}
                
                {realSteps.length > 0 && (
                  <div className="mb-3">
                    <div className="text-slate-400 text-xs mb-2">Layers Processed</div>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set(realSteps.filter(step => step.status === 'completed').map(step => step.layer).filter(Boolean))).map((layer, index) => {
                        const layerColors = {
                          'Experience': 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
                          'Meta Brain': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
                          'Role': 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
                          'Process': 'bg-green-500/20 text-green-300 border border-green-500/30',
                          'System': 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
                          'Interface': 'bg-red-500/20 text-red-300 border border-red-500/30'
                        };
                        return (
                          <span 
                            key={index}
                            className={`${layerColors[layer as keyof typeof layerColors] || 'bg-gray-500/20 text-gray-300 border border-gray-500/30'} text-xs px-3 py-1 rounded-full font-medium`}
                          >
                            {layer} Layer
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {realSteps.length > 0 && (
                  <div>
                    <div className="text-slate-400 text-xs mb-2">Agents Executed</div>
                    <div className="space-y-1">
                      {realSteps.filter(step => step.status === 'completed').map((step, index) => (
                        <div key={step.id || index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-white">{step.agentName || 'Unknown Agent'}</span>
                            <span className="text-slate-400">({step.layer || 'Unknown Layer'})</span>
                          </div>
                          {step.duration && (
                            <span className="text-slate-500 text-xs">{step.duration}ms</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fixed footer with action buttons */}
        <div className="flex-shrink-0 pt-4 border-t border-slate-700">
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              data-testid="button-close-dialog"
            >
              Close
            </Button>
            {isComplete ? (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const resultData = {
                        executionId,
                        command: originalCommand || action,
                        persona,
                        completedAt: execution?.completedAt,
                        totalDuration: execution?.totalDuration,
                        result: execution?.result,
                        stepsExecuted: realSteps.filter(s => s.status === 'completed').length,
                        totalSteps: realSteps.length,
                        steps: realSteps.filter(s => s.status === 'completed')
                      };
                      await navigator.clipboard.writeText(JSON.stringify(resultData, null, 2));
                      globalVoiceManager.speak("Execution results copied to clipboard", persona);
                    } catch (error) {
                      console.error('Failed to copy results:', error);
                      globalVoiceManager.speak("Failed to copy results to clipboard", persona);
                    }
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  data-testid="button-copy-results"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Results
                </Button>
                <Button
                  onClick={() => {
                    globalVoiceManager.speak("Execution completed successfully. Results available in your dashboard.", persona);
                    onClose();
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-view-results"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Done
                </Button>
              </div>
            ) : (
              <Button
                disabled={true}
                className="bg-slate-600 text-slate-400 cursor-not-allowed"
                data-testid="button-processing"
              >
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
                  Processing...
                </div>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


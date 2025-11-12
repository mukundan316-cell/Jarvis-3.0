import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Bot, 
  Cpu, 
  Database, 
  Globe, 
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Power,
  Users,
  MoreHorizontal,
  Settings,
  Shield,
  TrendingUp,
  AlertTriangle,
  Award,
  Eye,
  Calendar,
  Building,
  DollarSign,
  Target,
  GitBranch,
  History,
  Save,
  AlertOctagon,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { usePersona } from '@/hooks/usePersona';
import { useAgentVersionBadge, useAgentUnsavedChanges } from '@/hooks/useAgentVersions';
import { useAgentMetadata } from '@/hooks/useAgentMetadata';
import { UniversalAgentModal } from './UniversalAgentModal';
import { UniversalEnhancedTooltip, SimpleTooltip, DatabaseSimpleTooltip } from './UniversalEnhancedTooltip';
import { 
  UniversalStatusBadge, 
  UniversalLayerBadge, 
  UniversalGovernanceBadge, 
  UniversalRiskBadge,
  UniversalBusinessFunctionBadge 
} from './UniversalBadgeComponents';
import { 
  caseInsensitiveEquals, 
  caseInsensitiveFind, 
  normalizeForComparison 
} from '@/utils/stringUtils';

// Deterministic seeded random function for stable showcase data
function seededRandom(seed: number, min: number = 0, max: number = 1): number {
  const x = Math.sin(seed) * 10000;
  const random = x - Math.floor(x);
  return min + random * (max - min);
}

// Showcase enhancement functions (deterministic client-side implementations)
// Preserves data integrity by augmenting real metrics, not overwriting them
function applyShowcaseEnhancements(agents: AgentInfo[], showcaseMode: boolean, selectedScenario?: string): AgentInfo[] {
  if (!showcaseMode || !agents) {
    return agents;
  }

  // Scenario-based enhancement multipliers (would come from ConfigService in production)
  const scenarioMultipliers = {
    'Peak Performance Mode': {
      cpuReduction: 0.6,      // 40% better CPU usage
      memoryReduction: 0.7,   // 30% better memory usage
      successBoost: 1.05,     // 5% better success rate
      responseImprovement: 0.6, // 40% faster response
      uptimeBoost: 1.02,      // 2% better uptime
      costEfficiencyBoost: 1.15 // 15% better cost efficiency
    },
    'High-Volume Processing': {
      cpuIncrease: 1.2,       // Higher CPU for throughput
      memoryIncrease: 1.1,    // More memory usage
      successBoost: 1.02,     // 2% better success
      throughputBoost: 1.5,   // 50% more throughput
      responseIncrease: 1.2,  // Slower response for volume
      costEfficiencyBoost: 1.08
    },
    'Cost Optimization Focus': {
      cpuReduction: 0.8,      // 20% better CPU efficiency
      memoryReduction: 0.75,  // 25% better memory efficiency
      successBoost: 1.03,     // 3% better success
      costEfficiencyBoost: 1.25 // 25% better cost efficiency
    },
    'Zero-Downtime Deployment': {
      uptime: 100.0,          // Perfect uptime
      successBoost: 1.06,     // 6% better success
      responseImprovement: 0.7, // 30% faster response
      costEfficiencyBoost: 1.12
    }
  };

  const multipliers = scenarioMultipliers[selectedScenario as keyof typeof scenarioMultipliers];
  if (!multipliers) return agents;

  return agents.map(agent => {
    // Use agent ID as seed for deterministic "random" values that stay stable
    const seed = agent.id;
    
    // Generate consistent base values using seeded randomization
    const baseCpuUsage = seededRandom(seed + 1, 20, 80);
    const baseMemoryUsage = seededRandom(seed + 2, 25, 75);
    const baseSuccessRate = seededRandom(seed + 3, 85, 99);
    const baseResponseTime = seededRandom(seed + 4, 100, 500);
    const baseThroughput = seededRandom(seed + 5, 100, 400);
    const baseUptime = seededRandom(seed + 6, 95, 99.9);
    const baseCostEfficiency = seededRandom(seed + 7, 70, 95);
    
    return {
      ...agent,
      // Apply showcase enhancements (display only - preserves actual data integrity)
      showcaseEnhanced: true,
      enhancedMetrics: {
        // Apply multipliers to base values, not overwriting actual agent data
        cpuUsage: Math.min(95, baseCpuUsage * ((multipliers as any).cpuReduction || (multipliers as any).cpuIncrease || 1)),
        memoryUsage: Math.min(90, baseMemoryUsage * ((multipliers as any).memoryReduction || (multipliers as any).memoryIncrease || 1)),
        successRate: Math.min(99.9, baseSuccessRate * ((multipliers as any).successBoost || 1)),
        responseTime: Math.max(50, baseResponseTime * ((multipliers as any).responseImprovement || (multipliers as any).responseIncrease || 1)),
        throughput: baseThroughput * ((multipliers as any).throughputBoost || 1),
        uptime: (multipliers as any).uptime || Math.min(100, baseUptime * ((multipliers as any).uptimeBoost || 1)),
        costEfficiency: Math.min(100, baseCostEfficiency * ((multipliers as any).costEfficiencyBoost || 1))
      },
      // Enhanced version control data - preserve actual version if it exists, augment display
      versionMetrics: {
        currentVersion: agent.config_version || `2.${Math.floor(seededRandom(seed + 8, 0, 5))}.${Math.floor(seededRandom(seed + 9, 0, 10))}`,
        versionCount: Math.floor(seededRandom(seed + 10, 8, 25)),
        deploymentFrequency: seededRandom(seed + 11, 1.5, 4),
        rollbackRate: seededRandom(seed + 12, 1, 5),
        configStability: seededRandom(seed + 13, 85, 98)
      }
    };
  });
}

interface AgentInfo {
  id: number;
  name: string;
  memoryContextProfile: string;
  layer: string;
  status: 'active' | 'inactive' | 'maintenance';
  specialization?: string;
  description?: string;
  persona?: string;
  config?: {
    capabilities?: string[];
    integration?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
  isCustom?: boolean;
  // MDP Governance fields
  maturityLevel?: number; // 0-4 scale
  governanceStatus?: 'compliant' | 'pending' | 'risk';
  riskLevel?: 'low' | 'medium' | 'high';
  lastAuditDate?: string;
  // Command Center Enhancement fields
  businessFunction?: string;
  slaPerformance?: number;
  slaStatus?: 'on-target' | 'at-risk' | 'breach';
  collaborationStatus?: 'solo' | 'paired' | 'team';
  costBenefitRatio?: number;
  // Phase 1 Lifecycle fields
  lifecycle_stage?: string;
  config_version?: string;
  has_unsaved_changes?: boolean;
  last_config_update?: string;
  // Showcase enhancement fields (display only)
  showcaseEnhanced?: boolean;
  enhancedMetrics?: {
    cpuUsage?: number;
    memoryUsage?: number;
    successRate?: number;
    responseTime?: number;
    throughput?: number;
    uptime?: number;
    costEfficiency?: number;
  };
  versionMetrics?: {
    currentVersion?: string;
    versionCount?: number;
    deploymentFrequency?: number;
    rollbackRate?: number;
    configStability?: number;
  };
}

interface UniversalAgentDirectoryProps {
  title?: string;
  subtitle?: string;
  showCreateButton?: boolean;
  onAgentEdit?: (agent: AgentInfo) => void;
  onAgentCreate?: () => void;
}

// Fallback configurations for graceful degradation
const FALLBACK_LAYER_ICONS = {
  'Experience': Globe,
  'Meta Brain': Bot,
  'Role': Users, 
  'Process': Cpu,
  'System': Database,
  'Interface': Globe
};

const FALLBACK_STATUS_COLORS = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  inactive: 'bg-red-500/20 text-red-400 border-red-500/30',
  maintenance: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
};

const FALLBACK_LAYER_COLORS = {
  'Experience': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Meta Brain': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Role': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Process': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'System': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Interface': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
};

// MDP Governance color schemes
const GOVERNANCE_STATUS_COLORS = {
  compliant: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  risk: 'bg-red-500/20 text-red-400 border-red-500/30'
};

const RISK_LEVEL_COLORS = {
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30'
};

const MATURITY_LEVELS = {
  0: { label: 'Initial', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  1: { label: 'Managed', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  2: { label: 'Defined', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  3: { label: 'Measured', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  4: { label: 'Optimized', color: 'bg-green-500/20 text-green-400 border-green-500/30' }
};

// Version Indicators Component
function VersionIndicators({ agentId, currentConfig, hasUnsavedChanges: agentHasUnsavedChanges, configVersion }: { 
  agentId: number; 
  currentConfig?: any; 
  hasUnsavedChanges?: boolean;
  configVersion?: string;
}) {
  const { 
    currentVersion, 
    versionCount, 
    lastUpdated, 
    hasVersionHistory, 
    isLoading: versionLoading 
  } = useAgentVersionBadge(agentId);
  
  const { 
    hasUnsavedChanges: calculatedUnsavedChanges, 
    isLoading: changesLoading 
  } = useAgentUnsavedChanges(agentId, currentConfig);
  
  // Use backend flag first, fall back to calculated comparison
  const finalHasUnsavedChanges = agentHasUnsavedChanges ?? calculatedUnsavedChanges;

  if (versionLoading || changesLoading) {
    return (
      <div className="flex items-center space-x-1">
        <div className="w-4 h-4 animate-pulse bg-gray-500/20 rounded" />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1" data-testid={`version-indicators-${agentId}`}>
      {/* Version Badge - Always show, fallback to default version */}
      <DatabaseSimpleTooltip
        tooltipKey="agent.version.badge"
        fallbackContent={hasVersionHistory ? `Version ${currentVersion} (${versionCount} total versions)` : `Version ${currentVersion} (current)`}
        testId={`tooltip-version-${agentId}`}
        scope={{ agentId }}
      >
        <Badge 
          className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30 px-1.5 py-0.5" 
          data-testid={`badge-version-${agentId}`}
        >
          <GitBranch className="w-2.5 h-2.5 mr-1" />
          v{currentVersion}
        </Badge>
      </DatabaseSimpleTooltip>
      
      {/* Unsaved Changes Indicator */}
      {finalHasUnsavedChanges && (
        <DatabaseSimpleTooltip
          tooltipKey="agent.unsaved.changes"
          fallbackContent="Configuration has unsaved changes"
          testId={`tooltip-unsaved-${agentId}`}
          scope={{ agentId }}
        >
          <Badge 
            className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30 px-1.5 py-0.5" 
            data-testid={`badge-unsaved-${agentId}`}
          >
            <AlertOctagon className="w-2.5 h-2.5 mr-1" />
            Unsaved
          </Badge>
        </DatabaseSimpleTooltip>
      )}
      
      {/* Version History Button */}
      {hasVersionHistory && (
        <DatabaseSimpleTooltip
          tooltipKey="agent.version.history"
          fallbackContent="View version history"
          testId={`tooltip-version-history-${agentId}`}
          scope={{ agentId }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white h-6 w-6 p-0"
            data-testid={`button-version-history-${agentId}`}
          >
            <History className="w-3 h-3" />
          </Button>
        </DatabaseSimpleTooltip>
      )}
    </div>
  );
}

export function UniversalAgentDirectory({
  title = "Agent Directory",
  subtitle = "Manage and monitor all system agents",
  showCreateButton = true,
  onAgentEdit,
  onAgentCreate
}: UniversalAgentDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLayer, setFilterLayer] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterGovernance, setFilterGovernance] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');
  const [filterBusinessFunction, setFilterBusinessFunction] = useState('All');
  const [showGovernanceView, setShowGovernanceView] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [showcaseMode, setShowcaseMode] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('Peak Performance Mode');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { currentPersona } = usePersona();
  const { toast } = useToast();

  // Fetch agents with governance data using unified hierarchy endpoint
  const { data: agentHierarchy, isLoading, error } = useQuery({
    queryKey: showGovernanceView ? ['/api/governance/agents-with-risk'] : ['/api/hierarchy/config', { persona: currentPersona }],
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Fetch business function mappings from ConfigService
  const { data: businessFunctionMappings } = useQuery({
    queryKey: ['/api/config/setting/business-functions.mappings'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
  });

  // Flatten hierarchical agent data into a single array for directory view with showcase enhancements
  const agents = React.useMemo(() => {
    if (!agentHierarchy) {
      return [];
    }
    
    let flatAgents: AgentInfo[] = [];
    
    // Handle both flat array (governance endpoint) and hierarchy config (unified endpoint)
    if (Array.isArray(agentHierarchy)) {
      flatAgents = agentHierarchy as AgentInfo[];
    } else if (agentHierarchy && typeof agentHierarchy === 'object' && 'layers' in agentHierarchy) {
      // Handle hierarchy config format with layers array
      const hierarchyConfig = agentHierarchy as any;
      if (hierarchyConfig.layers && Array.isArray(hierarchyConfig.layers)) {
        hierarchyConfig.layers.forEach((layer: any) => {
          if (layer.agents && Array.isArray(layer.agents)) {
            flatAgents.push(...layer.agents);
          }
        });
      }
    } else if (typeof agentHierarchy === 'object') {
      // Fallback: Flatten all agent arrays from object properties (legacy format)
      Object.values(agentHierarchy).forEach((layerAgents) => {
        if (Array.isArray(layerAgents)) {
          flatAgents.push(...layerAgents);
        }
      });
    } else {
      return [];
    }
    
    // Apply showcase enhancements only to display layer - preserves actual data integrity
    return applyShowcaseEnhancements(flatAgents, showcaseMode, selectedScenario);
  }, [agentHierarchy, showcaseMode, selectedScenario]);

  // Delete agent mutation
  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: number) => {
      return apiRequest(`/api/agents/${agentId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Agent deleted successfully"
      });
      // Invalidate all agent-related endpoints including hierarchy
      queryClient.invalidateQueries({ queryKey: ['/api/hierarchy/config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/governance/agents-with-risk'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hierarchy/config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to delete agent",
        variant: "destructive"
      });
    }
  });

  // Filter agents based on search, layer, status, governance, risk, and business function
  const filteredAgents = (agents as AgentInfo[]).filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLayer = filterLayer === 'All' || caseInsensitiveEquals(agent.layer, filterLayer);
    
    // Handle both status and functionalStatus for compatibility with database-driven normalization
    let agentStatus = agent.status;
    if (!agentStatus && (agent as any).functionalStatus) {
      // Map functionalStatus to standard status values
      const funcStatus = (agent as any).functionalStatus;
      if (funcStatus === 'active' || funcStatus === 'functional') {
        agentStatus = 'active';
      } else if (funcStatus === 'configured') {
        agentStatus = 'active'; // configured agents are active
      } else if (funcStatus === 'planned') {
        agentStatus = 'inactive'; // planned agents are not yet active
      } else {
        agentStatus = 'active'; // default to active if unknown
      }
    }
    
    // Use case-insensitive comparison for robust filtering with database metadata
    const matchesStatus = filterStatus === 'All' || caseInsensitiveEquals(agentStatus, filterStatus);
    
    const matchesGovernance = filterGovernance === 'All' || caseInsensitiveEquals(agent.governanceStatus, filterGovernance);
    const matchesRisk = filterRisk === 'All' || caseInsensitiveEquals(agent.riskLevel, filterRisk);
    const matchesBusinessFunction = filterBusinessFunction === 'All' || caseInsensitiveEquals(agent.businessFunction, filterBusinessFunction);
    
    return matchesSearch && matchesLayer && matchesStatus && matchesGovernance && matchesRisk && matchesBusinessFunction;
  });

  const handleDeleteAgent = async (agent: AgentInfo) => {
    if (agent.isCustom === false) {
      toast({
        title: "Cannot Delete",
        description: "System agents cannot be deleted",
        variant: "destructive"
      });
      return;
    }

    if (confirm(`Are you sure you want to delete "${agent.name}"? This action cannot be undone.`)) {
      deleteAgentMutation.mutate(agent.id);
    }
  };

  const handleEditAgent = (agent: AgentInfo) => {
    if (onAgentEdit) {
      onAgentEdit(agent);
    } else {
      setSelectedAgent(agent);
      setShowEditDialog(true);
    }
  };

  const handleEditClose = () => {
    setShowEditDialog(false);
    setSelectedAgent(null);
  };

  const getLayerIcon = (layer: string) => {
    const layerData = metadataLayers?.find(l => l.key === layer);
    if (layerData?.icon) {
      const iconName = getIconForKey(layerData.icon);
      const IconComponent = FALLBACK_LAYER_ICONS[iconName as keyof typeof FALLBACK_LAYER_ICONS] || Bot;
      return IconComponent;
    }
    // Fallback to hardcoded icons for graceful degradation
    const IconComponent = FALLBACK_LAYER_ICONS[layer as keyof typeof FALLBACK_LAYER_ICONS] || Bot;
    return IconComponent;
  };

  const getStatusIcon = (status: string) => {
    const statusData = metadataStatuses?.find(s => s.key === status);
    if (statusData?.icon) {
      const iconName = getIconForKey(statusData.icon);
      // Map metadata icon names to actual components
      switch (iconName) {
        case 'CheckCircle': return CheckCircle;
        case 'AlertCircle': return AlertCircle;
        case 'Clock': return Clock;
        case 'Power': return Power;
        case 'Settings': return Settings;
        default: return CheckCircle;
      }
    }
    // Fallback for graceful degradation
    switch (status) {
      case 'active': return CheckCircle;
      case 'inactive': return AlertCircle;
      case 'maintenance': return Clock;
      default: return Power;
    }
  };

  // ========================================
  // UNIFIED METADATA - Cross-Platform Persona Support
  // ========================================
  
  // Replace ALL hardcoded arrays with database-driven metadata
  const {
    layers: metadataLayers,
    statuses: metadataStatuses,
    governanceStatuses: metadataGovernanceStatuses,
    riskLevels: metadataRiskLevels,
    businessFunctions: metadataBusinessFunctions,
    maturityLevels: metadataMaturityLevels,
    getColorForKey,
    getIconForKey,
    normalizeStatus,
    isLoading: metadataLoading,
    error: metadataError
  } = useAgentMetadata();

  // Convert metadata to filter options with 'All' prefix for cross-platform consistency
  const layers = React.useMemo(() => {
    return ['All', ...(metadataLayers?.map(l => l.key) || [])];
  }, [metadataLayers]);

  const statuses = React.useMemo(() => {
    return ['All', ...(metadataStatuses?.map(s => s.key) || [])];
  }, [metadataStatuses]);

  const governanceStatuses = React.useMemo(() => {
    return ['All', ...(metadataGovernanceStatuses?.map(g => g.key) || [])];
  }, [metadataGovernanceStatuses]);

  const riskLevels = React.useMemo(() => {
    return ['All', ...(metadataRiskLevels?.map(r => r.key) || [])];
  }, [metadataRiskLevels]);
  
  // Generate business function options from unified metadata
  const businessFunctions = React.useMemo(() => {
    return ['All', ...(metadataBusinessFunctions?.map(bf => bf.key) || [])];
  }, [metadataBusinessFunctions]);
  
  const getGovernanceIcon = (status?: string) => {
    switch (status) {
      case 'compliant': return Shield;
      case 'pending': return Clock;
      case 'risk': return AlertTriangle;
      default: return Shield;
    }
  };
  
  const getRiskIcon = (risk?: string) => {
    switch (risk) {
      case 'low': return CheckCircle;
      case 'medium': return AlertCircle;
      case 'high': return AlertTriangle;
      default: return CheckCircle;
    }
  };
  
  const getMaturityInfo = (level?: number) => {
    if (level === undefined) return { label: 'Unknown', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    return MATURITY_LEVELS[level as keyof typeof MATURITY_LEVELS] || MATURITY_LEVELS[0];
  };

  // Command Center Performance Helper Functions
  const getSLAStatusColor = (status?: string) => {
    switch (status) {
      case 'on-target': return 'border-green-500/30 bg-green-500/10 text-green-400';
      case 'at-risk': return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400';
      case 'breach': return 'border-red-500/30 bg-red-500/10 text-red-400';
      default: return 'border-gray-500/30 bg-gray-500/10 text-gray-400';
    }
  };

  const getSLAStatusIcon = (status?: string) => {
    switch (status) {
      case 'on-target': return '🟢 ';
      case 'at-risk': return '🟡 ';
      case 'breach': return '🔴 ';
      default: return '';
    }
  };

  const getCollaborationStatusColor = (status?: string) => {
    switch (status) {
      case 'solo': return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
      case 'paired': return 'border-purple-500/30 bg-purple-500/10 text-purple-400';
      case 'team': return 'border-green-500/30 bg-green-500/10 text-green-400';
      default: return 'border-gray-500/30 bg-gray-500/10 text-gray-400';
    }
  };

  const getCollaborationStatusIcon = (status?: string) => {
    switch (status) {
      case 'solo': return '👤 ';
      case 'paired': return '👥 ';
      case 'team': return '👨‍👩‍👧‍👦 ';
      default: return '';
    }
  };

  const getCostBenefitColor = (ratio?: number) => {
    if (!ratio) return 'border-gray-500/30 bg-gray-500/10 text-gray-400';
    if (ratio >= 2) return 'border-green-500/30 bg-green-500/10 text-green-400';
    if (ratio >= 1.5) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
    if (ratio >= 1) return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400';
    return 'border-red-500/30 bg-red-500/10 text-red-400';
  };

  if (isLoading) {
    return (
      <div className="hexaware-glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-[#9CA3AF] text-sm">{subtitle}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="hexaware-glass rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-slate-700 rounded mb-2"></div>
              <div className="h-3 bg-slate-700 rounded mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="hexaware-glass rounded-xl p-6" data-testid="agent-directory">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-[#9CA3AF] text-sm">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Showcase Mode Toggle */}
          <div className="flex items-center gap-2" data-testid="showcase-mode-controls">
            <span className="text-sm text-gray-400">Showcase Mode</span>
            <DatabaseSimpleTooltip
              tooltipKey="showcase.mode.toggle"
              fallbackContent={showcaseMode ? 'Switch to realistic data' : 'Switch to enhanced demo data'}
              testId="tooltip-showcase-toggle"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowcaseMode(!showcaseMode)}
                className={`flex items-center gap-1 ${
                  showcaseMode 
                    ? 'text-purple-400 bg-purple-500/20 border border-purple-500/30' 
                    : 'text-gray-400 hover:text-white'
                }`}
                data-testid="button-toggle-showcase"
              >
                {showcaseMode ? (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span className="text-xs">Enhanced</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    <span className="text-xs">Realistic</span>
                  </>
                )}
              </Button>
            </DatabaseSimpleTooltip>
            
            {/* Scenario Selector (only visible in showcase mode) */}
            {showcaseMode && (
              <div className="flex items-center space-x-2">
                <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                  <SelectTrigger className="w-48 h-8 text-xs bg-purple-900/20 border-purple-500/30 text-purple-300">
                    <SelectValue placeholder="Select scenario" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <DatabaseSimpleTooltip
                      tooltipKey="scenario.peak.performance"
                      fallbackContent="Optimized for maximum efficiency with 40% better CPU/Memory usage, 5% higher success rates, and faster response times"
                      testId="tooltip-scenario-peak"
                    >
                      <SelectItem value="Peak Performance Mode" className="text-white hover:bg-slate-700">
                        Peak Performance Mode
                      </SelectItem>
                    </DatabaseSimpleTooltip>
                    <DatabaseSimpleTooltip
                      tooltipKey="scenario.high.volume"
                      fallbackContent="High throughput configuration with 50% more throughput, optimized for bulk operations"
                      testId="tooltip-scenario-volume"
                    >
                      <SelectItem value="High-Volume Processing" className="text-white hover:bg-slate-700">
                        High-Volume Processing
                      </SelectItem>
                    </DatabaseSimpleTooltip>
                    <DatabaseSimpleTooltip
                      tooltipKey="scenario.cost.optimization"
                      fallbackContent="Efficiency-focused with 25% better resource efficiency and improved cost effectiveness"
                      testId="tooltip-scenario-cost"
                    >
                      <SelectItem value="Cost Optimization Focus" className="text-white hover:bg-slate-700">
                        Cost Optimization Focus
                      </SelectItem>
                    </DatabaseSimpleTooltip>
                    <DatabaseSimpleTooltip
                      tooltipKey="scenario.zero.downtime"
                      fallbackContent="Maximum reliability with 100% uptime and optimized for continuous operations"
                      testId="tooltip-scenario-downtime"
                    >
                      <SelectItem value="Zero-Downtime Deployment" className="text-white hover:bg-slate-700">
                        Zero-Downtime Deployment
                      </SelectItem>
                    </DatabaseSimpleTooltip>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {showCreateButton && (
            <Button 
              onClick={() => onAgentCreate ? onAgentCreate() : setIsCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              data-testid="button-create-agent"
            >
              <Plus className="w-4 h-4" />
              Create Agent
            </Button>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-4 mb-4">
        <Button
          onClick={() => setShowGovernanceView(!showGovernanceView)}
          variant={showGovernanceView ? "default" : "outline"}
          className="flex items-center gap-2"
          data-testid="button-toggle-governance-view"
        >
          <Eye className="w-4 h-4" />
          {showGovernanceView ? 'Governance View' : 'Standard View'}
        </Button>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search agents by name, specialization, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder-gray-400"
            data-testid="input-search-agents"
          />
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <Select value={filterLayer} onValueChange={setFilterLayer}>
            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white" data-testid="select-filter-layer">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Layer" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {layers.map((layer) => (
                <SelectItem key={layer} value={layer} className="text-white hover:bg-slate-700">
                  {layer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white" data-testid="select-filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {statuses.map((status) => (
                <SelectItem key={status} value={status} className="text-white hover:bg-slate-700">
                  {status === 'All' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterBusinessFunction} onValueChange={setFilterBusinessFunction}>
            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white" data-testid="select-filter-business-function">
              <Building className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Function" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {businessFunctions.map((func) => {
                const mapping = (businessFunctionMappings as any)?.value ?? businessFunctionMappings;
                return (
                  <SelectItem key={func} value={func} className="text-white hover:bg-slate-700">
                    {func === 'All' ? 'All' : (mapping?.[func]?.label || func.charAt(0).toUpperCase() + func.slice(1))}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          {showGovernanceView && (
            <>
              <Select value={filterGovernance} onValueChange={setFilterGovernance}>
                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white" data-testid="select-filter-governance">
                  <Shield className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Governance" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {governanceStatuses.map((status) => (
                    <SelectItem key={status} value={status} className="text-white hover:bg-slate-700">
                      {status === 'All' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white" data-testid="select-filter-risk">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Risk" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {riskLevels.map((risk) => (
                    <SelectItem key={risk} value={risk} className="text-white hover:bg-slate-700">
                      {risk === 'All' ? 'All' : risk.charAt(0).toUpperCase() + risk.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[#9CA3AF] text-sm">
          Showing {filteredAgents.length} of {Array.isArray(agents) ? agents.length : 0} agents
        </p>
        {error && (
          <Badge variant="destructive" className="text-xs">
            Error loading agents
          </Badge>
        )}
      </div>

      {/* Agents Grid */}
      {error && !isLoading && (
        <div className="text-center py-12" data-testid="error-message">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-2">Error loading agents</p>
          <p className="text-gray-500 text-sm">Please try refreshing the page</p>
        </div>
      )}
      
      {!error && filteredAgents.length === 0 && !isLoading && (
        <div className="text-center py-12" data-testid="no-agents-message">
          <Bot className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No agents found</p>
          <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
        </div>
      )}
      
      {!error && filteredAgents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => {
            const LayerIcon = getLayerIcon(agent.layer);
            const StatusIcon = getStatusIcon(agent.status);
            const statusColorClass = FALLBACK_STATUS_COLORS[agent.status] || FALLBACK_STATUS_COLORS.active;
            const layerColorClass = FALLBACK_LAYER_COLORS[agent.layer as keyof typeof FALLBACK_LAYER_COLORS] || FALLBACK_LAYER_COLORS['Role'];

            return (
              <Card key={agent.id} className="bg-slate-800/30 border-slate-600/50 hover:bg-slate-800/50 transition-all duration-200" data-testid={`card-agent-${agent.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <LayerIcon className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-white text-sm font-semibold truncate" data-testid={`text-agent-name-${agent.id}`}>
                          {agent.name}
                        </CardTitle>
                        <p className="text-[#9CA3AF] text-xs">{agent.layer}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <VersionIndicators 
                        agentId={agent.id} 
                        currentConfig={agent.config}
                        hasUnsavedChanges={agent.has_unsaved_changes}
                        configVersion={agent.config_version}
                      />
                      <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" data-testid={`button-menu-${agent.id}`}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-600">
                        <DropdownMenuItem 
                          onClick={() => handleEditAgent(agent)}
                          className="text-white hover:bg-slate-700"
                          data-testid={`button-edit-${agent.id}`}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {agent.isCustom !== false && (
                          <DropdownMenuItem 
                            onClick={() => handleDeleteAgent(agent)}
                            className="text-red-400 hover:bg-red-900/20"
                            data-testid={`button-delete-${agent.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-white hover:bg-slate-700" data-testid={`button-configure-${agent.id}`}>
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </DropdownMenuItem>
                        {showGovernanceView && (
                          <DropdownMenuItem className="text-blue-400 hover:bg-blue-900/20" data-testid={`button-audit-${agent.id}`}>
                            <Shield className="w-4 h-4 mr-2" />
                            Run Audit
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Status and Layer Badges - Universal Components */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <UniversalStatusBadge 
                        value={agent.status} 
                        size="sm" 
                        showIcon={true} 
                        data-testid={`badge-status-${agent.id}`} 
                      />
                      <UniversalLayerBadge 
                        value={agent.layer} 
                        size="sm" 
                        showIcon={false} 
                        data-testid={`badge-layer-${agent.id}`} 
                      />
                    </div>
                    
                    {/* Performance Indicators - Enhanced with Showcase Mode */}
                    {(agent.showcaseEnhanced || agent.slaStatus || agent.collaborationStatus || agent.costBenefitRatio) && (
                      <div className={`space-y-2 p-3 rounded-lg border ${
                        agent.showcaseEnhanced 
                          ? 'bg-purple-900/20 border-purple-500/40' 
                          : 'bg-emerald-900/10 border-emerald-700/30'
                      }`}>
                        <div className="flex items-center gap-2 text-xs font-medium" data-testid={`header-performance-metrics-${agent.id}`}>
                          <TrendingUp className="w-3 h-3" />
                          <span className={agent.showcaseEnhanced ? 'text-purple-400' : 'text-emerald-400'}>
                            Performance Metrics
                          </span>
                          {agent.showcaseEnhanced && (
                            <Badge className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                              <Sparkles className="w-2 h-2 mr-1" />
                              Enhanced
                            </Badge>
                          )}
                        </div>
                        
                        {/* Showcase Enhanced Metrics */}
                        {agent.showcaseEnhanced && agent.enhancedMetrics && (
                          <div className="grid grid-cols-2 gap-2">
                            {/* CPU Usage */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Cpu className="w-3 h-3 text-blue-400" />
                                <span className="text-xs text-gray-400">CPU</span>
                              </div>
                              <Badge className="text-xs border bg-blue-500/20 text-blue-400 border-blue-500/30" data-testid={`badge-cpu-${agent.id}`}>
                                {agent.enhancedMetrics.cpuUsage?.toFixed(1)}%
                              </Badge>
                            </div>
                            
                            {/* Memory Usage */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Database className="w-3 h-3 text-green-400" />
                                <span className="text-xs text-gray-400">Memory</span>
                              </div>
                              <Badge className="text-xs border bg-green-500/20 text-green-400 border-green-500/30" data-testid={`badge-memory-${agent.id}`}>
                                {agent.enhancedMetrics.memoryUsage?.toFixed(1)}%
                              </Badge>
                            </div>
                            
                            {/* Success Rate */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-400" />
                                <span className="text-xs text-gray-400">Success</span>
                              </div>
                              <Badge className="text-xs border bg-emerald-500/20 text-emerald-400 border-emerald-500/30" data-testid={`badge-success-${agent.id}`}>
                                {agent.enhancedMetrics.successRate?.toFixed(1)}%
                              </Badge>
                            </div>
                            
                            {/* Uptime */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Activity className="w-3 h-3 text-cyan-400" />
                                <span className="text-xs text-gray-400">Uptime</span>
                              </div>
                              <Badge className="text-xs border bg-cyan-500/20 text-cyan-400 border-cyan-500/30" data-testid={`badge-uptime-${agent.id}`}>
                                {agent.enhancedMetrics.uptime?.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        )}
                        
                        {/* Standard Performance Metrics (when not in showcase mode) */}
                        {!agent.showcaseEnhanced && (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              {/* SLA Status */}
                              {agent.slaStatus && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-emerald-400" />
                                    <span className="text-xs text-gray-400">SLA</span>
                                  </div>
                                  <Badge className={`text-xs border ${getSLAStatusColor(agent.slaStatus)}`} data-testid={`badge-sla-${agent.id}`}>
                                    {getSLAStatusIcon(agent.slaStatus)}
                                    {agent.slaStatus.replace('-', ' ').toUpperCase()}
                                  </Badge>
                                </div>
                              )}
                              
                              {/* Collaboration Status */}
                              {agent.collaborationStatus && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3 text-blue-400" />
                                    <span className="text-xs text-gray-400">Collab</span>
                                  </div>
                                  <Badge className={`text-xs border ${getCollaborationStatusColor(agent.collaborationStatus)}`} data-testid={`badge-collaboration-${agent.id}`}>
                                    {getCollaborationStatusIcon(agent.collaborationStatus)}
                                    {agent.collaborationStatus.charAt(0).toUpperCase() + agent.collaborationStatus.slice(1)}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            
                            {/* Cost/Benefit Ratio */}
                            {(() => {
                              const ratio = agent.costBenefitRatio != null ? Number(agent.costBenefitRatio) : null;
                              const isValidRatio = ratio != null && Number.isFinite(ratio);
                              
                              return (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3 text-yellow-400" />
                                    <span className="text-xs text-gray-400">Cost/Benefit Ratio</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={`text-xs border ${getCostBenefitColor(isValidRatio ? ratio : undefined)}`} data-testid={`badge-cost-benefit-${agent.id}`}>
                                      {isValidRatio ? ratio.toFixed(2) : '0.00'}x
                                    </Badge>
                                    <span className="text-xs text-gray-400" data-testid={`text-cost-benefit-rating-${agent.id}`}>
                                      {!isValidRatio ? 'No Data' : ratio >= 2 ? 'Excellent' : ratio >= 1.5 ? 'Good' : ratio >= 1 ? 'Fair' : 'Poor'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                            
                            {/* SLA Performance Percentage */}
                            {(() => {
                              const performance = agent.slaPerformance != null ? Number(agent.slaPerformance) : null;
                              const isValidPerformance = performance != null && Number.isFinite(performance);
                              
                              return isValidPerformance ? (
                                <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-emerald-700/30" data-testid={`text-sla-performance-${agent.id}`}>
                                  <Target className="w-3 h-3" />
                                  <span>SLA Performance: {performance.toFixed(1)}%</span>
                                  <div className={`w-2 h-2 rounded-full ${performance >= 95 ? 'bg-green-400' : performance >= 85 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                                </div>
                              ) : null;
                            })()}
                          </>
                        )}
                        
                        {/* Enhanced Cost Efficiency (Showcase Mode) */}
                        {agent.showcaseEnhanced && agent.enhancedMetrics?.costEfficiency && (
                          <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-purple-700/30" data-testid={`text-cost-efficiency-${agent.id}`}>
                            <DollarSign className="w-3 h-3" />
                            <span>Cost Efficiency: {agent.enhancedMetrics.costEfficiency.toFixed(1)}%</span>
                            <div className={`w-2 h-2 rounded-full ${
                              agent.enhancedMetrics.costEfficiency >= 90 ? 'bg-green-400' : 
                              agent.enhancedMetrics.costEfficiency >= 75 ? 'bg-yellow-400' : 'bg-red-400'
                            }`}></div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* MDP Governance Indicators */}
                    {showGovernanceView && (agent.maturityLevel !== undefined || agent.governanceStatus || agent.riskLevel) && (
                      <div className="space-y-2 p-3 bg-slate-800/20 rounded-lg border border-slate-700/50">
                        <div className="flex items-center gap-2 text-xs font-medium text-blue-400">
                          <Shield className="w-3 h-3" />
                          MDP Governance Profile
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {/* Maturity Level */}
                          {agent.maturityLevel !== undefined && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Award className="w-3 h-3 text-blue-400" />
                                <span className="text-xs text-gray-400">Maturity</span>
                              </div>
                              <Badge className={`text-xs border ${getMaturityInfo(agent.maturityLevel).color}`} data-testid={`badge-maturity-${agent.id}`}>
                                L{agent.maturityLevel} - {getMaturityInfo(agent.maturityLevel).label}
                              </Badge>
                            </div>
                          )}
                          
                          {/* Risk Level */}
                          {agent.riskLevel && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-orange-400" />
                                <span className="text-xs text-gray-400">Risk</span>
                              </div>
                              <UniversalRiskBadge 
                                value={agent.riskLevel} 
                                size="sm" 
                                showIcon={true} 
                                data-testid={`badge-risk-${agent.id}`} 
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Governance Status */}
                        {agent.governanceStatus && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-green-400" />
                              <span className="text-xs text-gray-400">Status</span>
                            </div>
                            <UniversalGovernanceBadge 
                              value={agent.governanceStatus} 
                              size="sm" 
                              showIcon={true} 
                              data-testid={`badge-governance-${agent.id}`} 
                            />
                          </div>
                        )}
                        
                        {/* Phase 2.5: Governance Quick Actions */}
                        <div className="mt-3 pt-2 border-t border-slate-700/50">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs h-7 bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                            onClick={() => {
                              // Navigate to governance dashboard with agent filter
                              const event = new CustomEvent('openGovernanceDashboard', { 
                                detail: { agentId: agent.id, agentName: agent.name } 
                              });
                              window.dispatchEvent(event);
                            }}
                            data-testid={`button-governance-details-${agent.id}`}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Governance Details
                          </Button>
                        </div>
                        
                        {/* Last Audit Date */}
                        {agent.lastAuditDate && (
                          <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-slate-700">
                            <Calendar className="w-3 h-3" />
                            <span>Last Audit: {formatDistanceToNow(new Date(agent.lastAuditDate), { addSuffix: true })}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Specialization */}
                    {agent.specialization && (
                      <p className="text-[#9CA3AF] text-xs" data-testid={`text-specialization-${agent.id}`}>
                        <span className="text-blue-400 font-medium">Specialization:</span> {agent.specialization}
                      </p>
                    )}

                    {/* Description */}
                    {agent.description && (
                      <p className="text-[#9CA3AF] text-xs line-clamp-2" data-testid={`text-description-${agent.id}`}>
                        {agent.description}
                      </p>
                    )}

                    {/* Capabilities */}
                    {agent.config?.capabilities && agent.config.capabilities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {agent.config.capabilities.slice(0, 3).map((capability, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="text-xs text-[#9CA3AF] border-slate-600"
                            data-testid={`badge-capability-${agent.id}-${index}`}
                          >
                            {capability}
                          </Badge>
                        ))}
                        {agent.config.capabilities.length > 3 && (
                          <Badge variant="outline" className="text-xs text-[#9CA3AF] border-slate-600">
                            +{agent.config.capabilities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Timestamps */}
                    {(agent.createdAt || agent.updatedAt) && (
                      <div className="text-xs text-[#9CA3AF] pt-2 border-t border-slate-700">
                        {agent.updatedAt && (
                          <p data-testid={`text-updated-${agent.id}`}>
                            Updated {formatDistanceToNow(new Date(agent.updatedAt), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Universal Agent Modal - handles both create and edit */}
      <UniversalAgentModal
        isOpen={showEditDialog || isCreateDialogOpen}
        onClose={() => {
          if (showEditDialog) handleEditClose();
          if (isCreateDialogOpen) setIsCreateDialogOpen(false);
        }}
        mode={showEditDialog ? 'edit' : 'create'}
        agent={selectedAgent}
      />
    </div>
  );
}
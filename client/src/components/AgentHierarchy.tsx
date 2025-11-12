import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Palette, Brain, Users, Workflow, Cog, MonitorSpeaker, RefreshCw } from 'lucide-react';
import { usePersona } from '@/hooks/usePersona';

// Icon mapping for unified hierarchy config
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

// Color mapping for layer types from unified config
const LAYER_COLORS = {
  'Experience': {
    color: 'border-purple-500 text-purple-300',
    badgeColor: 'bg-purple-500/20 text-purple-300'
  },
  'Meta Brain': {
    color: 'border-blue-500 text-blue-300',
    badgeColor: 'bg-blue-500/20 text-blue-300'
  },
  'Role': {
    color: 'border-cyan-500 text-cyan-300',
    badgeColor: 'bg-cyan-500/20 text-cyan-300'
  },
  'Process': {
    color: 'border-green-500 text-green-300',
    badgeColor: 'bg-green-500/20 text-green-300'
  },
  'System': {
    color: 'border-yellow-500 text-yellow-300',
    badgeColor: 'bg-yellow-500/20 text-yellow-300'
  },
  'Interface': {
    color: 'border-red-500 text-red-300',
    badgeColor: 'bg-red-500/20 text-red-300'
  }
};

// Unified hierarchy config hook - Phase 5: Universal Hierarchy Display
function useUnifiedHierarchyConfig(persona?: string) {
  const { data: hierarchyConfig, isLoading, error, refetch, isFetching } = useQuery({
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
    error,
    refetch,
    isFetching
  };
}

export function AgentHierarchy() {
  // Get current persona for configuration-based filtering
  const { currentPersona } = usePersona();
  const queryClient = useQueryClient();

  // Use unified hierarchy config - Phase 5: Universal Hierarchy Display
  const { hierarchyConfig, isLoading, error, refetch, isFetching } = useUnifiedHierarchyConfig(currentPersona);

  // Manual refresh function with comprehensive cache invalidation
  const handleRefresh = async () => {
    // Invalidate persona-scoped and base hierarchy keys
    await queryClient.invalidateQueries({ queryKey: ['/api/hierarchy/config'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/hierarchy/config', { persona: currentPersona }] });
    // Trigger refetch for immediate update
    refetch();
  };

  // Debug logging
  console.log('AgentHierarchy Debug:', {
    currentPersona,
    isLoading,
    error,
    hierarchyConfig,
    hasLayers: hierarchyConfig?.layers?.length,
    layerTypes: hierarchyConfig?.layers?.map((l: any) => l.layer)
  });

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center text-white">
          Loading agent hierarchy...
        </h3>
      </div>
    );
  }

  if (error || !hierarchyConfig) {
    console.error('AgentHierarchy Error:', error);
    return (
      <div className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center text-white">
          <Workflow className="w-5 h-5 mr-2" />
          Agent Hierarchy
        </h3>
        <div className="text-red-400 text-sm">
          Unable to load hierarchy configuration. Please try again.
          {error && <div className="mt-2 text-xs">{error.toString()}</div>}
        </div>
      </div>
    );
  }

  const renderLayer = (layerData: any) => {
    const { layer, definition, agents, metadata } = layerData;
    const layerColors = LAYER_COLORS[layer as keyof typeof LAYER_COLORS];
    
    if (!definition || !layerColors) return null;

    // Map icon name to component from unified config
    const Icon = ICON_MAP[definition.icon as keyof typeof ICON_MAP] || Workflow;
    
    // Count agents by functional status using metadata from unified config
    const functionalAgents = agents.filter((agent: any) => agent.functionalStatus === 'active');
    const configuredAgents = agents.filter((agent: any) => agent.functionalStatus === 'configured');
    const plannedAgents = agents.filter((agent: any) => agent.functionalStatus === 'planned');
    
    const totalAgents = metadata.totalAgents;
    const functionalCount = metadata.activeAgents;

    return (
      <div key={layer} className={`bg-slate-800/50 backdrop-blur-md rounded-lg p-4 border-l-4 ${layerColors.color}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className="w-5 h-5" />
            <div>
              <h4 className={`font-medium ${layerColors.color}`}>{definition.label}</h4>
              <p className="text-xs text-gray-400">{definition.description}</p>
            </div>
          </div>
          
          {/* Enhanced status showing functional vs total agents from unified config */}
          <div className="flex items-center gap-2">
            {metadata.activeAgents > 0 && (
              <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full flex items-center gap-1">
                🟢 {metadata.activeAgents} Functional
              </span>
            )}
            {metadata.configuredAgents > 0 && (
              <span className="text-xs text-slate-400 bg-slate-600/20 px-2 py-1 rounded-full">
                {metadata.configuredAgents} Configured
              </span>
            )}
            {metadata.plannedAgents > 0 && (
              <span className="text-xs text-blue-400 bg-blue-600/20 px-2 py-1 rounded-full">
                {metadata.plannedAgents} Planned
              </span>
            )}
          </div>
        </div>
        
        {/* Functional Agents - Prominently Displayed */}
        {functionalAgents.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-green-400 font-medium mb-2 flex items-center gap-1">
              🟢 FUNCTIONAL AGENTS ({functionalAgents.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {functionalAgents.map((agent: any) => (
                <span
                  key={agent.id}
                  className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 font-medium"
                >
                  ⚡ {agent.name}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Configured Agents - Secondary Display */}
        {configuredAgents.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-yellow-400 font-medium mb-2 flex items-center gap-1">
              🟡 CONFIGURED AGENTS ({configuredAgents.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {configuredAgents.map((agent: any) => (
                <span
                  key={agent.id}
                  className={`text-xs px-2 py-1 rounded-full ${layerColors.badgeColor} opacity-70`}
                >
                  {agent.name}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Planned Agents - Future Display */}
        {plannedAgents.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-blue-400 font-medium mb-2 flex items-center gap-1">
              🔵 PLANNED AGENTS ({plannedAgents.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {plannedAgents.map((agent: any) => (
                <span
                  key={agent.id}
                  className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 opacity-60"
                >
                  {agent.name}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* No agents message */}
        {totalAgents === 0 && (
          <div className="mt-3 text-xs text-slate-500 italic">
            No agents configured for this layer
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center text-white">
        <Workflow className="w-5 h-5 mr-2" />
        Agent Hierarchy
        {/* Manual refresh button */}
        <button
          onClick={handleRefresh}
          disabled={isFetching || isLoading}
          data-testid="button-refresh-hierarchy"
          className="ml-auto mr-2 p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-slate-600/50 hover:border-slate-500"
          title="Refresh agent hierarchy data"
        >
          <RefreshCw 
            className={`w-4 h-4 text-slate-300 ${(isFetching || isLoading) ? 'animate-spin' : ''}`} 
          />
        </button>
        {/* Show Experience Layer personalization indicator */}
        {hierarchyConfig.experienceLayer?.companyName && (
          <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full">
            {hierarchyConfig.experienceLayer.companyName}
          </span>
        )}
      </h3>
      
      <div className="space-y-4">
        {/* Render layers from unified hierarchy config */}
        {hierarchyConfig.layers.map((layerData: any) => renderLayer(layerData))}
      </div>
      
      {/* Summary statistics from unified config */}
      {hierarchyConfig.summary && (
        <div className="mt-4 pt-4 border-t border-slate-600">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total: {hierarchyConfig.summary.totalAgents} agents across {hierarchyConfig.summary.totalLayers} layers</span>
            <span className="text-green-400">{hierarchyConfig.summary.activeAgents} active</span>
          </div>
        </div>
      )}
    </div>
  );
}
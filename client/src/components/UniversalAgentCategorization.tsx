import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Bot, 
  Cpu, 
  Database, 
  Globe, 
  Plus,
  CheckCircle,
  AlertCircle,
  Power,
  Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { UniversalAgentModal } from './UniversalAgentModal';

interface AgentInfo {
  id: number;
  name: string;
  type: string;
  layer: string;
  persona: string;
  status: 'active' | 'inactive' | 'maintenance';
  cpuUsage: number;
  memoryUsage: number;
  activeUsers: number;
  successRate: number;
  avgResponseTime: number;
  lastActivity: Date;
  specialization: string;
  description: string;
}

interface UniversalAgentCategorizationProps {
  title: string;
  subtitle: string;
  currentPersona: string;
  showCreateButton?: boolean;
}

const layerIcons: Record<string, React.ComponentType<any>> = {
  'Role': Bot,
  'Process': Cpu,
  'System': Database,
  'Interface': Globe
};

export function UniversalAgentCategorization({ 
  title, 
  subtitle, 
  currentPersona, 
  showCreateButton = false 
}: UniversalAgentCategorizationProps) {
  const [selectedLayer, setSelectedLayer] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Use authentic database agents with persona filtering - NO AUTOMATIC POLLING
  const { data: agents, isLoading } = useQuery({
    queryKey: ['/api/jarvis/agent-categorization'],
    // Completely disable all automatic refetching
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Use authentic database agents (already filtered by persona in the API)
  const agentData: AgentInfo[] = Array.isArray(agents) ? agents : [];

  const layers = ['All', 'Role', 'Process', 'System', 'Interface'];
  
  // Calculate layer statistics from actual database data
  const layerStats = layers.slice(1).map(layer => {
    const layerAgents = agentData.filter(agent => agent.layer === layer);
    const activeCount = layerAgents.filter(agent => agent.status === 'active').length;
    const totalCount = layerAgents.length;
    const avgCpu = layerAgents.length > 0 
      ? Math.round(layerAgents.reduce((sum, agent) => sum + (agent.cpuUsage || 0), 0) / layerAgents.length)
      : 0;
    
    return {
      layer,
      active: activeCount,
      total: totalCount,
      cpu: avgCpu
    };
  });

  const filteredAgents = selectedLayer === 'All' 
    ? agentData 
    : agentData.filter(agent => agent.layer === selectedLayer);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-500 text-white text-xs px-2 py-1 rounded">active</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">maintenance</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500 text-white text-xs px-2 py-1 rounded">inactive</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white text-xs px-2 py-1 rounded">unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-slate-900/95 text-white p-3 rounded-xl border border-slate-700/30 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Bot className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
            <p className="text-slate-400 text-xs font-medium">{subtitle}</p>
          </div>
        </div>
        {showCreateButton && (
          <Button 
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-lg text-sm font-semibold transition-all duration-200"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Agent</span>
          </Button>
        )}
      </div>

      {/* Layer Tabs - Compact Pills */}
      <div className="flex space-x-1 bg-slate-800/40 p-1 rounded-full border border-slate-600/30 backdrop-blur-sm">
        {layers.map(layer => (
          <button
            key={layer}
            onClick={() => setSelectedLayer(layer)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
              selectedLayer === layer
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            {layer}
          </button>
        ))}
      </div>

      {/* Layer Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {layerStats.map(({ layer, active, total, cpu }) => {
          const LayerIcon = layerIcons[layer] || Bot;
          return (
            <div key={layer} className="bg-gradient-to-br from-slate-800/60 to-slate-800/80 border border-slate-600/40 rounded-lg p-2.5 hover:from-slate-800/80 hover:to-slate-800/100 transition-all duration-300 backdrop-blur-sm">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                    <LayerIcon className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
                <h3 className="text-white font-semibold text-xs mb-1 leading-tight">{layer}</h3>
                <div className="text-xs text-slate-300 mb-0.5">
                  <span className="text-blue-400 font-semibold">{active}/{total}</span>
                </div>
                <div className="text-xs text-slate-300">
                  <span className="text-slate-200 font-semibold">{cpu}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Cards - Compact Design */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        {filteredAgents.map((agent) => {
          const LayerIcon = layerIcons[agent.layer] || Bot;
          return (
            <div key={agent.id} className="bg-gradient-to-br from-slate-800/50 to-slate-800/70 border border-slate-600/40 rounded-xl p-3 hover:from-slate-800/70 hover:to-slate-800/90 hover:border-slate-500/60 transition-all duration-300 backdrop-blur-sm shadow-lg">
              {/* Header with Icon, Name and Status */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <LayerIcon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{agent.name}</h3>
                    <p className="text-xs text-slate-400 font-medium">{agent.layer}</p>
                  </div>
                </div>
                <div className="px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-full shadow-lg">
                  {agent.status}
                </div>
              </div>
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 mb-2">
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-0.5 font-medium">CPU</div>
                  <div className="text-xs font-bold text-blue-400">{agent.cpuUsage}%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-0.5 font-medium">Memory</div>
                  <div className="text-xs font-bold text-emerald-400">{agent.memoryUsage}%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-0.5 font-medium">Users</div>
                  <div className="text-xs font-bold text-cyan-400">{agent.activeUsers}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-0.5 font-medium">Success</div>
                  <div className="text-xs font-bold text-green-400">{agent.successRate}%</div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-600/30">
                <div className="font-medium">{currentPersona} • {agent.layer}</div>
                <div className="font-medium">{formatDistanceToNow(new Date(agent.lastActivity), { addSuffix: true })}</div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <Bot className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">No agents found</h3>
          <p className="text-slate-400">
            {selectedLayer === 'All' 
              ? 'No agents are currently available for this persona.'
              : `No agents found in the ${selectedLayer} layer.`
            }
          </p>
        </div>
      )}

      {/* Create New Agent Modal */}
      <UniversalAgentModal 
        mode="create"
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
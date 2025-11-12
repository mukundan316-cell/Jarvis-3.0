import { useQuery } from '@tanstack/react-query';
import { Cloud, Database, Wifi, WifiOff, Clock, TrendingUp, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { usePersona } from '@/hooks/usePersona';

// Fallback configurations for when ConfigService is unavailable
const FALLBACK_SYSTEM_TYPE_ICONS = {
  salesforce: Cloud,
  duckcreek: Database,
  custom: Settings,
  api: Wifi,
  warehouse: Database
};

const FALLBACK_CONNECTION_STATUS_COLORS = {
  connected: 'text-green-400 bg-green-500/20',
  disconnected: 'text-red-400 bg-red-500/20',
  connecting: 'text-yellow-400 bg-yellow-500/20',
  error: 'text-red-400 bg-red-500/20'
};

const FALLBACK_CONNECTION_STATUS_ICONS = {
  connected: CheckCircle,
  disconnected: WifiOff,
  connecting: Clock,
  error: AlertTriangle
};

// Custom hook for integration mappings configuration via ConfigService
function useIntegrationMappingsConfig(persona?: string) {
  const { data: mappingsConfig, isLoading, error } = useQuery({
    queryKey: ['/api/config/setting/integration-mappings.config', { persona }],
    queryFn: () => {
      const url = new URL('/api/config/setting/integration-mappings.config', window.location.origin);
      if (persona) {
        url.searchParams.set('persona', persona);
      }
      return fetch(url.toString()).then(res => res.json());
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - align with ConfigService cache TTL
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    retry: 1, // Retry once on failure, then fallback
    retryDelay: 1000,
    enabled: true
  });

  // Extract mappings from ConfigService response or use fallbacks
  const systemTypeIcons = mappingsConfig?.value?.systemTypeIcons || FALLBACK_SYSTEM_TYPE_ICONS;
  const connectionStatusColors = mappingsConfig?.value?.connectionStatusColors || FALLBACK_CONNECTION_STATUS_COLORS;
  const connectionStatusIcons = mappingsConfig?.value?.connectionStatusIcons || FALLBACK_CONNECTION_STATUS_ICONS;
  
  return {
    systemTypeIcons,
    connectionStatusColors,
    connectionStatusIcons,
    isLoading,
    error
  };
}

interface IntegrationCardProps {
  integration: any;
  systemTypeIcons: any;
  connectionStatusColors: any;
  connectionStatusIcons: any;
}

function IntegrationCard({ integration, systemTypeIcons, connectionStatusColors, connectionStatusIcons }: IntegrationCardProps) {
  const SystemIcon = systemTypeIcons[integration.systemType as keyof typeof systemTypeIcons] || Database;
  const StatusIcon = connectionStatusIcons[integration.connectionStatus as keyof typeof connectionStatusIcons] || AlertTriangle;
  const statusColor = connectionStatusColors[integration.connectionStatus as keyof typeof connectionStatusColors] || 'text-gray-400 bg-gray-500/20';

  const getHealthScoreColor = (score: string) => {
    const numScore = parseFloat(score);
    if (numScore >= 95) return 'text-green-400';
    if (numScore >= 85) return 'text-yellow-400';
    if (numScore >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatSyncFrequency = (frequency: string) => {
    const freqMap: { [key: string]: string } = {
      realtime: 'Real-time',
      hourly: 'Every Hour',
      daily: 'Daily',
      weekly: 'Weekly'
    };
    return freqMap[frequency] || frequency;
  };

  return (
    <div className="hexaware-glass rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-[#3B82F6]/20 rounded-lg">
            <SystemIcon className="w-6 h-6 text-[#60A5FA]" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{integration.systemName}</h3>
            <p className="text-sm text-[#9CA3AF] capitalize">{integration.systemType} Integration</p>
          </div>
        </div>
        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          <StatusIcon className="w-3 h-3" />
          <span className="capitalize">{integration.connectionStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-black/20 rounded-lg p-3">
          <div className="text-xs text-[#9CA3AF] mb-1">Health Score</div>
          <div className={`text-lg font-bold ${getHealthScoreColor(integration.healthScore || '100')}`}>
            {integration.healthScore || '100'}%
          </div>
        </div>
        
        <div className="bg-black/20 rounded-lg p-3">
          <div className="text-xs text-[#9CA3AF] mb-1">Records Synced</div>
          <div className="text-lg font-bold text-white">
            {formatNumber(integration.recordsSynced || 0)}
          </div>
        </div>
        
        <div className="bg-black/20 rounded-lg p-3">
          <div className="text-xs text-[#9CA3AF] mb-1">Sync Frequency</div>
          <div className="text-lg font-bold text-[#60A5FA]">
            {formatSyncFrequency(integration.syncFrequency || 'N/A')}
          </div>
        </div>
        
        <div className="bg-black/20 rounded-lg p-3">
          <div className="text-xs text-[#9CA3AF] mb-1">Errors</div>
          <div className="text-lg font-bold text-red-400">
            {integration.errorCount || 0}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {integration.apiEndpoint && (
          <div className="bg-black/20 rounded-lg p-3">
            <div className="text-xs text-[#9CA3AF] mb-1">API Endpoint</div>
            <div className="text-sm text-white font-mono break-all">
              {integration.apiEndpoint}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
          <div className="flex items-center space-x-4">
            {integration.authType && (
              <div className="flex items-center space-x-1">
                <Settings className="w-3 h-3" />
                <span>Auth: {integration.authType}</span>
              </div>
            )}
            {integration.lastSync && (
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Last sync: {new Date(integration.lastSync).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          {integration.config && (
            <div className="text-[#60A5FA]">
              Configured
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SystemIntegrations() {
  const { currentPersona } = usePersona();
  const { systemTypeIcons, connectionStatusColors, connectionStatusIcons, isLoading: mappingsLoading } = useIntegrationMappingsConfig(currentPersona);
  const { data: integrations, isLoading: integrationsLoading } = useQuery({
    queryKey: ['/api/integrations'],
    refetchInterval: 30000,
  });

  const isLoading = integrationsLoading || mappingsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">System Integrations</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="hexaware-glass rounded-xl p-6 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-[#3B82F6]/20 rounded w-32"></div>
                    <div className="h-3 bg-[#3B82F6]/20 rounded w-24"></div>
                  </div>
                </div>
                <div className="h-6 bg-[#3B82F6]/20 rounded w-20"></div>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="bg-black/20 rounded-lg p-3">
                    <div className="h-3 bg-[#3B82F6]/20 rounded mb-2"></div>
                    <div className="h-6 bg-[#3B82F6]/20 rounded"></div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="h-12 bg-black/20 rounded-lg"></div>
                <div className="h-3 bg-[#3B82F6]/20 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const connectedSystems = (integrations as any[])?.filter(int => int.connectionStatus === 'connected') || [];
  const totalRecordsSynced = (integrations as any[])?.reduce((sum, int) => sum + (int.recordsSynced || 0), 0) || 0;
  const avgHealthScore = (integrations as any[])?.length > 0 
    ? ((integrations as any[]).reduce((sum, int) => sum + parseFloat(int.healthScore || '100'), 0) / (integrations as any[]).length).toFixed(1)
    : '100';
  const totalErrors = (integrations as any[])?.reduce((sum, int) => sum + (int.errorCount || 0), 0) || 0;

  // Group integrations by type
  const groupedIntegrations = (integrations as any[])?.reduce((acc, int) => {
    if (!acc[int.systemType]) acc[int.systemType] = [];
    acc[int.systemType].push(int);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-[#3B82F6]/20 rounded-lg">
            <Cloud className="w-6 h-6 text-[#60A5FA]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">System Integrations</h2>
            <p className="text-sm text-[#9CA3AF]">External system connections and data synchronization</p>
          </div>
        </div>
        <div className="flex items-center space-x-6 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">{connectedSystems.length}</div>
            <div className="text-[#9CA3AF]">Connected</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[#60A5FA]">{avgHealthScore}%</div>
            <div className="text-[#9CA3AF]">Avg Health</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              {totalRecordsSynced >= 1000000 ? `${(totalRecordsSynced / 1000000).toFixed(1)}M` : 
               totalRecordsSynced >= 1000 ? `${(totalRecordsSynced / 1000).toFixed(1)}K` : 
               totalRecordsSynced}
            </div>
            <div className="text-[#9CA3AF]">Records Synced</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-400">{totalErrors}</div>
            <div className="text-[#9CA3AF]">Total Errors</div>
          </div>
        </div>
      </div>

      {!integrations || (integrations as any[]).length === 0 ? (
        <div className="text-center py-12">
          <Cloud className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Integrations Available</h3>
          <p className="text-[#9CA3AF]">System integrations will appear here once configured</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedIntegrations).map(([type, typeIntegrations]) => {
            const TypeIcon = systemTypeIcons[type as keyof typeof systemTypeIcons] || Database;
            
            return (
              <div key={type}>
                <div className="flex items-center space-x-2 mb-4">
                  <TypeIcon className="w-5 h-5 text-[#60A5FA]" />
                  <h3 className="text-lg font-bold text-[#60A5FA] capitalize">{type} Systems</h3>
                  <div className="flex-1 h-px bg-[#3B82F6]/30"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {(typeIntegrations as any[]).map((integration) => (
                    <IntegrationCard 
                      key={integration.id} 
                      integration={integration}
                      systemTypeIcons={systemTypeIcons}
                      connectionStatusColors={connectionStatusColors}
                      connectionStatusIcons={connectionStatusIcons}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
import { useQuery } from '@tanstack/react-query';
import { Cpu, Zap, CheckCircle, Users } from 'lucide-react';
import { usePersona } from '@/hooks/usePersona';

// Fallback configurations for when ConfigService is unavailable
const FALLBACK_METRIC_ICONS = {
  metaBrain: Cpu,
  responseTime: Zap,
  taskCompletion: CheckCircle,
  activeAgents: Users
};

const FALLBACK_METRIC_COLORS = {
  metaBrain: 'bg-blue-500/20 text-blue-400',
  responseTime: 'bg-cyan-500/20 text-cyan-400',
  taskCompletion: 'bg-green-500/20 text-green-400',
  activeAgents: 'bg-purple-500/20 text-purple-400'
};

// Custom hook for metric mappings configuration via ConfigService
function useMetricMappingsConfig(persona?: string) {
  const { data: mappingsConfig, isLoading, error } = useQuery({
    queryKey: ['/api/config/setting/metric-mappings.config', { persona }],
    queryFn: () => {
      const url = new URL('/api/config/setting/metric-mappings.config', window.location.origin);
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
  const metricIcons = mappingsConfig?.value?.metricIcons || FALLBACK_METRIC_ICONS;
  const metricColors = mappingsConfig?.value?.metricColors || FALLBACK_METRIC_COLORS;
  
  return {
    metricIcons,
    metricColors,
    isLoading,
    error
  };
}

export function SystemMetrics() {
  const { currentPersona } = usePersona();
  const { metricIcons, metricColors, isLoading: mappingsLoading } = useMetricMappingsConfig(currentPersona);
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/metrics'],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const isLoading = metricsLoading || mappingsLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="hexaware-glass rounded-xl p-6 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gray-600 rounded-lg w-9 h-9"></div>
              <div className="w-16 h-5 bg-gray-600 rounded-full"></div>
            </div>
            <div className="w-20 h-4 bg-gray-600 rounded mb-1"></div>
            <div className="w-12 h-8 bg-gray-600 rounded mb-1"></div>
            <div className="w-16 h-3 bg-gray-600 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      key: 'metaBrain',
      title: 'Meta Brain',
      value: `${(metrics as any)?.metaBrain?.cpu || 45}%`,
      subtitle: 'CPU Usage',
      status: 'Online'
    },
    {
      key: 'responseTime',
      title: 'Response Time',
      value: `${(metrics as any)?.metaBrain?.responseTime || 200}ms`,
      subtitle: 'Average Response',
      status: 'Active'
    },
    {
      key: 'taskCompletion',
      title: 'Task Completion',
      value: `${(metrics as any)?.taskCompletion || 98}%`,
      subtitle: 'Success Rate',
      status: `${(metrics as any)?.taskCompletion || 98}%`
    },
    {
      key: 'activeAgents',
      title: 'Active Agents',
      value: `${(metrics as any)?.activeAgents || 12}`,
      subtitle: 'Total Running',
      status: `${(metrics as any)?.activeAgents || 12}`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map((metric) => {
        const Icon = metricIcons[metric.key as keyof typeof metricIcons];
        const colorClass = metricColors[metric.key as keyof typeof metricColors];
        
        return (
          <div key={metric.key} className="hexaware-glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
                {metric.status}
              </span>
            </div>
            <h4 className="font-bold text-[#9CA3AF] mb-1">{metric.title}</h4>
            <p className="text-2xl font-bold text-white">{metric.value}</p>
            <p className="text-xs text-[#9CA3AF] mt-1">{metric.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}

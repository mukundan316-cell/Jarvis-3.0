import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, Target, Zap, Brain, Shield, Users } from 'lucide-react';
import { usePersona } from '@/hooks/usePersona';

// Fallback configurations for when ConfigService is unavailable
const FALLBACK_KPI_ICONS = {
  performance: Zap,
  security: Shield,
  agents: Users,
  intelligence: Brain,
  operations: Target
};

const FALLBACK_TREND_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus
};

const FALLBACK_TREND_COLORS = {
  up: 'text-green-400',
  down: 'text-red-400',
  stable: 'text-[#9CA3AF]'
};

// Custom hook for KPI mappings configuration via ConfigService
function useKpiMappingsConfig(persona?: string) {
  const { data: mappingsConfig, isLoading, error } = useQuery({
    queryKey: ['/api/config/setting/kpi-mappings.config', { persona }],
    queryFn: () => {
      const url = new URL('/api/config/setting/kpi-mappings.config', window.location.origin);
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
  const kpiIcons = mappingsConfig?.value?.kpiIcons || FALLBACK_KPI_ICONS;
  const trendIcons = mappingsConfig?.value?.trendIcons || FALLBACK_TREND_ICONS;
  const trendColors = mappingsConfig?.value?.trendColors || FALLBACK_TREND_COLORS;
  
  return {
    kpiIcons,
    trendIcons,
    trendColors,
    isLoading,
    error
  };
}

interface KpiCardProps {
  kpiName: string;
  currentValue: string;
  previousValue?: string;
  target?: string;
  unit?: string;
  category: string;
  trend: 'up' | 'down' | 'stable';
  kpiIcons: any;
  trendIcons: any;
  trendColors: any;
}

function KpiCard({ kpiName, currentValue, previousValue, target, unit, category, trend, kpiIcons, trendIcons, trendColors }: KpiCardProps) {
  const IconComponent = kpiIcons[category as keyof typeof kpiIcons] || Target;
  const TrendIcon = trendIcons[trend];
  const trendColor = trendColors[trend];

  const calculateChange = () => {
    if (!previousValue) return null;
    const current = parseFloat(currentValue);
    const previous = parseFloat(previousValue);
    if (isNaN(current) || isNaN(previous)) return null;
    
    const change = ((current - previous) / previous * 100).toFixed(1);
    const numChange = parseFloat(change);
    return `${numChange > 0 ? '+' : ''}${change}%`;
  };

  const change = calculateChange();

  return (
    <div className="hexaware-glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#3B82F6]/20 rounded-lg">
            <IconComponent className="w-5 h-5 text-[#60A5FA]" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{kpiName}</h3>
            <p className="text-xs text-[#9CA3AF] capitalize">{category}</p>
          </div>
        </div>
        <div className={`flex items-center space-x-1 ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          {change && <span className="text-xs font-medium">{change}</span>}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-white">{currentValue}</span>
          {unit && <span className="text-sm text-[#9CA3AF]">{unit}</span>}
        </div>

        {target && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9CA3AF]">Target: {target}{unit}</span>
            {previousValue && (
              <span className="text-[#9CA3AF]">Prev: {previousValue}{unit}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardKpis() {
  const { currentPersona } = usePersona();
  const { kpiIcons, trendIcons, trendColors, isLoading: mappingsLoading } = useKpiMappingsConfig(currentPersona);
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['/api/dashboard/kpis'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const isLoading = kpisLoading || mappingsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white mb-4">Dashboard KPIs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="hexaware-glass rounded-xl p-6 animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-9 h-9 bg-[#3B82F6]/20 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-[#3B82F6]/20 rounded"></div>
                  <div className="w-16 h-3 bg-[#3B82F6]/20 rounded"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-20 h-8 bg-[#3B82F6]/20 rounded"></div>
                <div className="w-32 h-3 bg-[#3B82F6]/20 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Group KPIs by category
  const groupedKpis = (kpis as any[])?.reduce((acc, kpi) => {
    if (!acc[kpi.category]) acc[kpi.category] = [];
    acc[kpi.category].push(kpi);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Dashboard KPIs</h2>
        <div className="flex items-center space-x-2 text-sm text-[#9CA3AF]">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Live Data</span>
        </div>
      </div>

      {Object.keys(groupedKpis).length === 0 ? (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No KPIs Available</h3>
          <p className="text-[#9CA3AF]">Dashboard KPIs will appear here once data is initialized</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedKpis).map(([category, categoryKpis]) => (
            <div key={category}>
              <h3 className="text-lg font-bold text-[#60A5FA] mb-4 capitalize">
                {category} Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(categoryKpis as any[]).map((kpi) => (
                  <KpiCard
                    key={kpi.id}
                    kpiName={kpi.kpiName}
                    currentValue={kpi.currentValue}
                    previousValue={kpi.previousValue}
                    target={kpi.target}
                    unit={kpi.unit}
                    category={kpi.category}
                    trend={kpi.trend as 'up' | 'down' | 'stable'}
                    kpiIcons={kpiIcons}
                    trendIcons={trendIcons}
                    trendColors={trendColors}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
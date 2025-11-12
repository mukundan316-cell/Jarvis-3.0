import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, Target, Zap, Brain, Shield, Users, LucideIcon } from 'lucide-react';

// Safe icon mapping for string-to-component resolution
const ICON_MAP: Record<string, LucideIcon> = {
  Zap, Brain, Shield, Users, Target, TrendingUp, TrendingDown, Minus
};

// Safe function to resolve icon strings to components
function resolveIconComponent(iconIdentifier: string | LucideIcon | React.ComponentType<{ className?: string }> | undefined): LucideIcon {
  if (typeof iconIdentifier === 'function') return iconIdentifier as LucideIcon;
  if (typeof iconIdentifier === 'string') return ICON_MAP[iconIdentifier] || Target;
  return Target;
}

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

// Type for KPI mappings configuration response
interface KpiMappingsConfig {
  value?: {
    kpiIcons?: Record<string, React.ComponentType<{ className?: string }>>;
    trendIcons?: Record<string, React.ComponentType<{ className?: string }>>;
    trendColors?: Record<string, string>;
  };
}

// Custom hook for KPI mappings configuration via ConfigService
function useKpiMappingsConfig(persona?: string) {
  const kpiMappingsUrl = `/api/config/setting/kpi-mappings.config?persona=${encodeURIComponent(persona || '')}`;
  const { data: mappingsConfig, isLoading, error } = useQuery<KpiMappingsConfig>({
    queryKey: [kpiMappingsUrl],
    // Use default fetcher with credentials: 'include' for authenticated requests
    staleTime: 5 * 60 * 1000, // 5 minutes - align with ConfigService cache TTL
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    retry: 1, // Retry once on failure, then fallback
    retryDelay: 1000,
    enabled: !!persona // Only fetch when persona is available
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
  kpiIcons: Record<string, React.ComponentType<{ className?: string }>>;
  trendIcons: Record<string, React.ComponentType<{ className?: string }>>;
  trendColors: Record<string, string>;
}

function KpiCard({ kpiName, currentValue, previousValue, target, unit, category, trend, kpiIcons, trendIcons, trendColors }: KpiCardProps) {
  const IconComponent = resolveIconComponent(kpiIcons[category as keyof typeof kpiIcons] as any);
  const TrendIcon = resolveIconComponent(trendIcons[trend] as any);
  const trendColor = trendColors[trend] || 'text-[#9CA3AF]';

  const calculateChange = () => {
    if (!previousValue) return null;
    const current = parseFloat(currentValue);
    const previous = parseFloat(previousValue);
    
    // Handle invalid numeric values
    if (isNaN(current) || isNaN(previous)) return null;
    
    // Handle division by zero
    if (previous === 0) {
      // If previous is 0 but current has value, show as 100% increase
      if (current > 0) return '+100%';
      // If both are 0, no change
      if (current === 0) return '0%';
      // If current is negative and previous was 0, show as decrease
      return '-100%';
    }
    
    // Calculate percentage change safely
    const changeDecimal = (current - previous) / previous;
    
    // Check for invalid calculation result
    if (!isFinite(changeDecimal)) return null;
    
    const changePercentage = (changeDecimal * 100).toFixed(1);
    const numChange = parseFloat(changePercentage);
    
    // Handle very small changes that round to 0
    if (numChange === 0 && current !== previous) {
      return current > previous ? '+0.1%' : '-0.1%';
    }
    
    return `${numChange > 0 ? '+' : ''}${changePercentage}%`;
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
            <span className="text-[#9CA3AF]">Target: {target}{unit ? ` ${unit}` : ''}</span>
            {previousValue && (
              <span className="text-[#9CA3AF]">Prev: {previousValue}{unit ? ` ${unit}` : ''}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface KPI {
  id: string;
  name?: string;
  kpiName?: string; // Support both naming conventions
  currentValue: string;
  previousValue?: string;
  target?: string;
  unit?: string;
  category: string;
  trend: 'up' | 'down' | 'stable';
  context?: string;
  priority?: number;
  viewCategory?: string;
  personaRelevance?: string[];
}

export function UniversalDashboardMetrics({ persona }: { persona?: string }) {
  // Aligned endpoint with other components for consistent cache management
  const { data: allKpis = [], isLoading } = useQuery<KPI[]>({
    queryKey: ['/api/dashboard/kpis', persona], // Aligned with UniversalBusinessKPISection and cache invalidation
    // Use default fetcher instead of custom queryFn
    refetchInterval: 60000, // Refresh every minute
  });

  // Filter and sort KPIs for technical view: main_dashboard context, priority 1-4, persona relevance, exclude business category
  const technicalKpis = Array.isArray(allKpis) ? allKpis.filter((kpi: KPI) => {
    // Context filtering: main_dashboard only
    const contextMatch = !kpi.context || kpi.context === 'main_dashboard';
    
    // Priority filtering: 1-4 for dashboard display
    const priorityMatch = !kpi.priority || (kpi.priority >= 1 && kpi.priority <= 4);
    
    // Persona relevance filtering
    const personaMatch = !persona || !kpi.personaRelevance || 
      kpi.personaRelevance.some(p => p === persona || p === `{${persona}}`);
    
    // Exclude business category KPIs (handled by UniversalBusinessKPISection)
    const categoryMatch = kpi.category !== 'business';
    
    return contextMatch && priorityMatch && personaMatch && categoryMatch;
  })
  .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999)) // Sort by priority ascending for correct order
  .slice(0, 4) : []; // Limit to top 4 for dashboard

  const { kpiIcons, trendIcons, trendColors, isLoading: configLoading } = useKpiMappingsConfig(persona);

  if (isLoading || configLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="hexaware-glass rounded-xl p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gray-600 rounded-lg"></div>
                <div className="space-y-1">
                  <div className="h-4 bg-gray-600 rounded w-16"></div>
                  <div className="h-3 bg-gray-700 rounded w-12"></div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-gray-600 rounded"></div>
                <div className="w-8 h-3 bg-gray-600 rounded"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-600 rounded w-20"></div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-700 rounded w-16"></div>
                <div className="h-3 bg-gray-700 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!technicalKpis.length) {
    return (
      <div className="hexaware-glass rounded-xl p-8 text-center" data-testid="technical-kpi-empty">
        <Target className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Technical KPIs Available</h3>
        <p className="text-[#9CA3AF]">Technical KPI metrics are currently being processed for {persona || 'this persona'}.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full max-w-full overflow-hidden px-4 md:px-0" data-testid="technical-kpi-section">
      {technicalKpis.map((kpi: KPI) => (
        <KpiCard
          key={kpi.id}
          kpiName={kpi.kpiName || kpi.name || 'Unknown KPI'}
          currentValue={kpi.currentValue}
          previousValue={kpi.previousValue}
          target={kpi.target}
          unit={kpi.unit}
          category={kpi.category}
          trend={kpi.trend}
          kpiIcons={kpiIcons}
          trendIcons={trendIcons}
          trendColors={trendColors}
        />
      ))}
    </div>
  );
}
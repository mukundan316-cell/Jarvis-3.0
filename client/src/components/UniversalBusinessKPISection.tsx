import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, DollarSign, Clock, Target, Users, FileCheck, Award, Zap, Activity, BarChart3, Shield, CheckCircle, PieChart, TrendingUpIcon, LucideIcon } from 'lucide-react';
import type { UserPreferences } from '@shared/schema';

// Create comprehensive icon mapping from strings to React components
// This prevents runtime crashes when ConfigService returns string names
const ICON_MAP: Record<string, LucideIcon> = {
  Clock,
  DollarSign,
  Target,
  Award,
  Users,
  Zap,
  FileCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  BarChart3,
  Shield,
  CheckCircle,
  PieChart,
  TrendingUpIcon
};

// Safe function to resolve icon strings to components
function resolveIconComponent(iconIdentifier: string | LucideIcon | undefined): LucideIcon {
  // If already a component, return as-is
  if (typeof iconIdentifier === 'function') {
    return iconIdentifier as LucideIcon;
  }
  
  // If string, resolve from ICON_MAP with fallback to Target
  if (typeof iconIdentifier === 'string') {
    return ICON_MAP[iconIdentifier] || Target;
  }
  
  // Default fallback
  return Target;
}

// Fallback configurations for when ConfigService is unavailable
const FALLBACK_BUSINESS_KPI_ICONS = {
  'Claims Efficiency': 'Clock',
  'Revenue Impact': 'DollarSign',
  'Cost Savings': 'Target',
  'Agent ROI': 'Award',
  'Customer Satisfaction': 'Users',
  'Processing Speed': 'Zap',
  'Underwriting Accuracy': 'FileCheck',
  'Policy Renewals': 'TrendingUp'
};

const FALLBACK_TREND_ICONS = {
  improving: 'TrendingUp',
  declining: 'TrendingDown',
  stable: 'Minus',
  up: 'TrendingUp',
  down: 'TrendingDown'
};

const FALLBACK_TREND_COLORS = {
  improving: 'text-green-400',
  declining: 'text-red-400',
  stable: 'text-[#9CA3AF]',
  up: 'text-green-400',
  down: 'text-red-400'
};

// Types for configuration responses
interface BusinessTerminologyConfig {
  value: {
    businessKpiIcons?: Record<string, string>;
    trendIcons?: Record<string, string>;
    trendColors?: Record<string, string>;
    businessLabels?: Record<string, string>;
  };
}

interface BusinessKPI {
  id?: string;
  kpiName?: string;
  name?: string;
  currentValue: string;
  previousValue?: string;
  target?: string;
  unit?: string;
  trend: string;
  category: string;
  context?: string;
  priority?: number;
  viewCategory?: string;
  personaRelevance?: string[];
}

// Custom hook for business terminology configuration via ConfigService
export function useBusinessTerminologyConfig(persona?: string) {
  const terminologyUrl = `/api/config/setting/business-terminology.config?persona=${encodeURIComponent(persona || '')}`;
  const { data: terminologyConfig, isLoading, error } = useQuery<BusinessTerminologyConfig>({
    queryKey: [terminologyUrl],
    // Use default fetcher with credentials: 'include' for authenticated requests
    staleTime: 5 * 60 * 1000, // 5 minutes - align with ConfigService cache TTL
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    retry: 1, // Retry once on failure, then fallback
    retryDelay: 1000,
    enabled: !!persona // Only fetch when persona is available
  });

  // Extract mappings from ConfigService response or use fallbacks
  const businessKpiIcons = terminologyConfig?.value?.businessKpiIcons || FALLBACK_BUSINESS_KPI_ICONS;
  const trendIcons = terminologyConfig?.value?.trendIcons || FALLBACK_TREND_ICONS;
  const trendColors = terminologyConfig?.value?.trendColors || FALLBACK_TREND_COLORS;
  const businessLabels = terminologyConfig?.value?.businessLabels || {};
  
  return {
    businessKpiIcons,
    trendIcons,
    trendColors,
    businessLabels,
    isLoading,
    error
  };
}

interface BusinessKpiCardProps {
  kpiName: string;
  currentValue: string;
  previousValue?: string;
  target?: string;
  unit?: string;
  trend: string;
  businessKpiIcons: Record<string, string>;
  trendIcons: Record<string, string>;
  trendColors: Record<string, string>;
  businessLabels: Record<string, string>;
}

function BusinessKpiCard({ 
  kpiName, 
  currentValue, 
  previousValue, 
  target, 
  unit, 
  trend, 
  businessKpiIcons, 
  trendIcons, 
  trendColors,
  businessLabels 
}: BusinessKpiCardProps) {
  // Safely resolve icon components from string identifiers
  const IconComponent = resolveIconComponent(businessKpiIcons[kpiName]);
  const TrendIcon = resolveIconComponent(trendIcons[trend]);
  const trendColor = trendColors[trend] || 'text-[#9CA3AF]';
  
  // Use business-friendly label or fallback to original name
  const displayName = businessLabels[kpiName] || kpiName;

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
    <div 
      className="hexaware-glass rounded-xl p-6"
      data-testid={`business-kpi-card-${kpiName.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#3B82F6]/20 rounded-lg" data-testid={`business-kpi-icon-${kpiName.toLowerCase().replace(/\s+/g, '-')}`}>
            <IconComponent className="w-5 h-5 text-[#60A5FA]" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm" data-testid={`business-kpi-name-${kpiName.toLowerCase().replace(/\s+/g, '-')}`}>
              {displayName}
            </h3>
            <p className="text-xs text-[#9CA3AF]" data-testid={`business-kpi-category-${kpiName.toLowerCase().replace(/\s+/g, '-')}`}>
              Business
            </p>
          </div>
        </div>
        <div className={`flex items-center space-x-1 ${trendColor}`} data-testid={`business-kpi-trend-${kpiName.toLowerCase().replace(/\s+/g, '-')}`}>
          <TrendIcon className="w-4 h-4" />
          {change && <span className="text-xs font-medium">{change}</span>}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline space-x-2">
          <span 
            className="text-2xl font-bold text-white" 
            data-testid={`business-kpi-value-${kpiName.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {currentValue}
          </span>
          {unit && (
            <span 
              className="text-sm text-[#9CA3AF]" 
              data-testid={`business-kpi-unit-${kpiName.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {unit}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          {target && (
            <span 
              className="text-[#9CA3AF]" 
              data-testid={`business-kpi-target-${kpiName.toLowerCase().replace(/\s+/g, '-')}`}
            >
              Target: {target}{unit ? ` ${unit}` : ''}
            </span>
          )}
          {previousValue && (
            <span 
              className="text-[#9CA3AF]" 
              data-testid={`business-kpi-previous-${kpiName.toLowerCase().replace(/\s+/g, '-')}`}
            >
              Prev: {previousValue}{unit ? ` ${unit}` : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function UniversalBusinessKPISection({ persona }: { persona?: string }) {
  // Fetch business KPIs from aligned endpoint to match cache invalidation in EnhancedDashboard
  const { data: allKpis = [], isLoading: kpisLoading } = useQuery<BusinessKPI[]>({
    queryKey: ['/api/dashboard/kpis', persona], // Aligned with EnhancedDashboard cache invalidation
    // Use default fetcher instead of custom queryFn
    refetchInterval: 60000, // Refresh every minute
  });

  // Filter and sort business KPIs with persona-specific filtering: business category, main_dashboard context, priority 1-4, persona relevance
  const businessKpis = Array.isArray(allKpis) ? allKpis.filter((kpi: BusinessKPI) => {
    // Category filtering: business category only
    const categoryMatch = kpi.category === 'business';
    
    // ViewCategory filtering: business or both
    const viewCategoryMatch = !kpi.viewCategory || kpi.viewCategory === 'business' || kpi.viewCategory === 'both';
    
    // Context filtering: main_dashboard only
    const contextMatch = !kpi.context || kpi.context === 'main_dashboard';
    
    // Priority filtering: 1-4 for dashboard display
    const priorityMatch = !kpi.priority || (kpi.priority >= 1 && kpi.priority <= 4);
    
    // Persona relevance filtering
    const personaMatch = !persona || !kpi.personaRelevance || 
      kpi.personaRelevance.some(p => p === persona || p === `{${persona}}`);
    
    return categoryMatch && viewCategoryMatch && contextMatch && priorityMatch && personaMatch;
  })
  .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999)) // Sort by priority ascending for correct order
  .slice(0, 4) : []; // Limit to top 4 for dashboard

  const { businessKpiIcons, trendIcons, trendColors, businessLabels, isLoading: configLoading } = useBusinessTerminologyConfig(persona);

  if (kpisLoading || configLoading) {
    return (
      <div data-testid="business-kpi-loading">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="hexaware-glass rounded-xl p-6 animate-pulse" data-testid={`business-kpi-skeleton-${i}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-gray-600 rounded-lg"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-600 rounded w-20"></div>
                    <div className="h-3 bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-gray-600 rounded"></div>
                  <div className="w-8 h-3 bg-gray-600 rounded"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-8 bg-gray-600 rounded w-24"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-700 rounded w-20"></div>
                  <div className="h-3 bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!businessKpis.length) {
    return (
      <div className="hexaware-glass rounded-xl p-8 text-center" data-testid="business-kpi-empty">
        <Target className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Business KPIs Available</h3>
        <p className="text-[#9CA3AF]">Business KPI metrics are currently being processed for {persona || 'this persona'}.</p>
      </div>
    );
  }

  return (
    <div className="w-full" data-testid="business-kpi-section">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full max-w-full overflow-hidden px-4 md:px-0">
        {businessKpis.map((kpi: BusinessKPI) => (
          <BusinessKpiCard
            key={kpi.id || kpi.kpiName || 'unknown'}
            kpiName={kpi.kpiName || kpi.name || 'Unknown KPI'}
            currentValue={kpi.currentValue}
            previousValue={kpi.previousValue}
            target={kpi.target}
            unit={kpi.unit}
            trend={kpi.trend}
            businessKpiIcons={businessKpiIcons}
            trendIcons={trendIcons}
            trendColors={trendColors}
            businessLabels={businessLabels}
          />
        ))}
      </div>
    </div>
  );
}
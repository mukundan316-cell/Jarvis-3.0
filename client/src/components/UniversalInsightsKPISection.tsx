import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, DollarSign, Clock, Target, Users, FileCheck, Award, Zap, Activity, BarChart3, Shield, CheckCircle, PieChart, LucideIcon, Brain, AlertTriangle, Gauge, Layers, Network, Eye, Cpu, Database, Lock, LineChart } from 'lucide-react';
import type { UserPreferences } from '@shared/schema';
import { useBusinessTerminologyConfig } from '@/components/UniversalBusinessKPISection';

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
  Brain,
  AlertTriangle,
  Gauge,
  Layers,
  Network,
  Eye,
  Cpu,
  Database,
  Lock,
  LineChart
};

// Safe function to resolve icon strings to components
function resolveIconComponent(iconIdentifier: string | LucideIcon | undefined): LucideIcon {
  // If already a component, return as-is
  if (typeof iconIdentifier === 'function') {
    return iconIdentifier as LucideIcon;
  }
  
  // If string, resolve from ICON_MAP with fallback to BarChart3
  if (typeof iconIdentifier === 'string') {
    return ICON_MAP[iconIdentifier] || BarChart3;
  }
  
  // Default fallback
  return BarChart3;
}

// Fallback configurations for when ConfigService is unavailable
const FALLBACK_BUSINESS_KPI_ICONS = {
  'Agent Performance Matrix': 'Brain',
  'Resource Utilization': 'Gauge',
  'Workflow Efficiency': 'Activity',
  'Data Processing Rate': 'Database',
  'Security Score': 'Shield',
  'System Performance': 'Cpu',
  'User Engagement': 'Users',
  'Platform Analytics': 'LineChart',
  'Risk Assessment': 'AlertTriangle',
  'Compliance Score': 'CheckCircle',
  'Operational Metrics': 'BarChart3',
  'Quality Index': 'Award',
  'Processing Speed': 'Zap',
  'Revenue Impact': 'DollarSign',
  'Cost Efficiency': 'Target',
  'Claims Processing': 'FileCheck',
  'Network Health': 'Network',
  'Data Integrity': 'Lock',
  'Monitoring Score': 'Eye',
  'Architecture Score': 'Layers'
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

interface InsightsKPI {
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
  description?: string;
}

interface InsightsKpiCardProps {
  kpiName: string;
  currentValue: string;
  previousValue?: string;
  target?: string;
  unit?: string;
  trend: string;
  category: string;
  description?: string;
  businessKpiIcons: Record<string, string>;
  trendIcons: Record<string, string>;
  trendColors: Record<string, string>;
  businessLabels: Record<string, string>;
  viewMode: 'technical' | 'business';
}

function InsightsKpiCard({ 
  kpiName, 
  currentValue, 
  previousValue, 
  target, 
  unit, 
  trend, 
  category,
  description,
  businessKpiIcons, 
  trendIcons, 
  trendColors,
  businessLabels,
  viewMode
}: InsightsKpiCardProps) {
  // Safely resolve icon components from string identifiers
  const IconComponent = resolveIconComponent(businessKpiIcons[kpiName]);
  const TrendIcon = resolveIconComponent(trendIcons[trend]);
  const trendColor = trendColors[trend] || 'text-[#9CA3AF]';
  
  // Use business-friendly label or fallback to original name
  const displayName = viewMode === 'business' && businessLabels[kpiName] 
    ? businessLabels[kpiName] 
    : kpiName;

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
      className="hexaware-glass rounded-xl p-6 hover:bg-white/[0.08] transition-all duration-200"
      data-testid={`insights-kpi-card-${kpiName.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#3B82F6]/20 rounded-lg" data-testid={`insights-kpi-icon-${kpiName.toLowerCase().replace(/\s+/g, '-')}`}>
            <IconComponent className="w-5 h-5 text-[#60A5FA]" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm" data-testid={`insights-kpi-name-${kpiName.toLowerCase().replace(/\s+/g, '-')}`}>
              {displayName}
            </h3>
            <p className="text-xs text-[#9CA3AF] capitalize" data-testid={`insights-kpi-category-${kpiName.toLowerCase().replace(/\s+/g, '-')}`}>
              {viewMode === 'business' ? 'Insights' : category.replace('_', ' ')}
            </p>
          </div>
        </div>
        <div className={`flex items-center space-x-1 ${trendColor}`} data-testid={`insights-kpi-trend-${kpiName.toLowerCase().replace(/\s+/g, '-')}`}>
          <TrendIcon className="w-4 h-4" />
          {change && <span className="text-xs font-medium">{change}</span>}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline space-x-2">
          <span 
            className="text-2xl font-bold text-white" 
            data-testid={`insights-kpi-value-${kpiName.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {currentValue}
          </span>
          {unit && (
            <span 
              className="text-sm text-[#9CA3AF]" 
              data-testid={`insights-kpi-unit-${kpiName.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {unit}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs space-y-1">
          {target && (
            <div className="w-full">
              <span 
                className="text-[#9CA3AF] block" 
                data-testid={`insights-kpi-target-${kpiName.toLowerCase().replace(/\s+/g, '-')}`}
              >
                Target: {target}{unit ? ` ${unit}` : ''}
              </span>
            </div>
          )}
          {previousValue && (
            <div className="w-full text-right">
              <span 
                className="text-[#9CA3AF] block" 
                data-testid={`insights-kpi-previous-${kpiName.toLowerCase().replace(/\s+/g, '-')}`}
              >
                Previous: {previousValue}{unit ? ` ${unit}` : ''}
              </span>
            </div>
          )}
        </div>

        {description && (
          <div className="pt-2 border-t border-white/10">
            <p 
              className="text-xs text-[#9CA3AF] leading-relaxed" 
              data-testid={`insights-kpi-description-${kpiName.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface UniversalInsightsKPISectionProps {
  persona?: string;
  viewMode?: 'technical' | 'business';
}

export function UniversalInsightsKPISection({ persona, viewMode = 'technical' }: UniversalInsightsKPISectionProps) {
  // Fetch insights KPIs from aligned endpoint to match cache invalidation
  const { data: allKpis = [], isLoading: kpisLoading } = useQuery<InsightsKPI[]>({
    queryKey: ['/api/dashboard/kpis', persona], // Aligned with other KPI components for cache management
    // Use default fetcher instead of custom queryFn
    refetchInterval: 60000, // Refresh every minute
  });

  // Filter and sort insights KPIs with enhanced filtering: insights_tab context, priority >= 5, persona relevance, viewCategory
  const insightsKpis = Array.isArray(allKpis) ? allKpis.filter((kpi: InsightsKPI) => {
    // Context filtering: insights_tab only
    const contextMatch = kpi.context === 'insights_tab';
    
    // Priority filtering: 5+ for insights display (16-20+ KPIs)
    const priorityMatch = kpi.priority && kpi.priority >= 5;
    
    // Persona relevance filtering
    const personaMatch = !persona || !kpi.personaRelevance || 
      kpi.personaRelevance.some(p => p === persona || p === `{${persona}}`);
    
    // ViewCategory filtering: show relevant KPIs based on current view mode
    const viewCategoryMatch = !kpi.viewCategory || 
      kpi.viewCategory === viewMode || 
      kpi.viewCategory === 'both';
    
    return contextMatch && priorityMatch && personaMatch && viewCategoryMatch;
  })
  .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999)) // Sort by priority ascending for correct order
  .slice(0, 24) : []; // Support up to 24 KPIs for comprehensive insights

  const { businessKpiIcons, trendIcons, trendColors, businessLabels, isLoading: configLoading } = useBusinessTerminologyConfig(persona);

  if (kpisLoading || configLoading) {
    return (
      <div data-testid="insights-kpi-loading">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="hexaware-glass rounded-xl p-6 animate-pulse" data-testid={`insights-kpi-skeleton-${i}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-gray-600 rounded-lg"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-600 rounded w-24"></div>
                    <div className="h-3 bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-gray-600 rounded"></div>
                  <div className="w-8 h-3 bg-gray-600 rounded"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-8 bg-gray-600 rounded w-24"></div>
                <div className="space-y-1">
                  <div className="h-3 bg-gray-700 rounded w-28"></div>
                  <div className="h-3 bg-gray-700 rounded w-20"></div>
                </div>
                <div className="h-8 bg-gray-700 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!insightsKpis.length) {
    return (
      <div className="hexaware-glass rounded-xl p-8 text-center" data-testid="insights-kpi-empty">
        <BarChart3 className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Insights Available</h3>
        <p className="text-[#9CA3AF]">
          Insights data is currently being processed for {persona || 'this persona'} in {viewMode} view.
        </p>
        <p className="text-xs text-[#9CA3AF] mt-2">
          Switch to {viewMode === 'technical' ? 'business' : 'technical'} view to see alternative metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full" data-testid="insights-kpi-section">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6 w-full max-w-full overflow-hidden">
        {insightsKpis.map((kpi: InsightsKPI) => (
          <InsightsKpiCard
            key={kpi.id || kpi.kpiName || 'unknown'}
            kpiName={kpi.kpiName || kpi.name || 'Unknown KPI'}
            currentValue={kpi.currentValue}
            previousValue={kpi.previousValue}
            target={kpi.target}
            unit={kpi.unit}
            trend={kpi.trend}
            category={kpi.category}
            description={kpi.description}
            businessKpiIcons={businessKpiIcons}
            trendIcons={trendIcons}
            trendColors={trendColors}
            businessLabels={businessLabels}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );
}
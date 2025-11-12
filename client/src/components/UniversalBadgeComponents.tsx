import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useAgentMetadata } from '@/hooks/useAgentMetadata';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Power, 
  Settings,
  Shield,
  AlertTriangle,
  AlertOctagon,
  Globe,
  Bot,
  Users,
  Cpu,
  Database,
  Eye,
  Brain,
  Palette,
  Workflow,
  Cog,
  MonitorSpeaker
} from 'lucide-react';

// ========================================
// UNIVERSAL BADGE COMPONENTS - Cross-Platform Persona Support
// ========================================

interface UniversalBadgeProps {
  value: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  'data-testid'?: string;
}

// Icon mapping from metadata to actual components
const ICON_COMPONENT_MAP = {
  'CheckCircle': CheckCircle,
  'AlertCircle': AlertCircle,
  'Clock': Clock,
  'Power': Power,
  'Settings': Settings,
  'Shield': Shield,
  'AlertTriangle': AlertTriangle,
  'AlertOctagon': AlertOctagon,
  'Globe': Globe,
  'Bot': Bot,
  'Users': Users,
  'Cpu': Cpu,
  'Database': Database,
  'Eye': Eye,
  'Brain': Brain,
  'Palette': Palette,
  'Workflow': Workflow,
  'Cog': Cog,
  'MonitorSpeaker': MonitorSpeaker
} as const;

// Universal Status Badge - replaces all hardcoded status badges
export function UniversalStatusBadge({ 
  value, 
  size = 'md', 
  showIcon = true, 
  className = '',
  'data-testid': testId 
}: UniversalBadgeProps) {
  const { 
    statuses,
    getColorForKey,
    getIconForKey,
    getColorForKeyCaseInsensitive,
    getIconForKeyCaseInsensitive,
    findMetadataOption,
    normalizeStatus,
    isLoading,
    error
  } = useAgentMetadata();

  // Handle loading and error states
  if (isLoading) {
    return (
      <Badge 
        className={`${getSizeClasses(size)} bg-gray-500/20 text-gray-400 border-gray-500/30 animate-pulse ${className}`}
        data-testid={testId}
      >
        Loading...
      </Badge>
    );
  }

  // Normalize status value and find metadata using case-insensitive lookup
  const normalizedStatus = normalizeStatus(value);
  const statusMetadata = findMetadataOption('statuses', normalizedStatus);
  
  // Get styling from metadata or fallback using case-insensitive lookup
  const colorKey = statusMetadata?.color || getColorForKeyCaseInsensitive(normalizedStatus);
  const iconKey = statusMetadata?.icon || getIconForKeyCaseInsensitive(normalizedStatus);
  const label = statusMetadata?.label || value;
  
  // Generate color classes
  const colorClasses = getColorClasses(colorKey);
  const IconComponent = showIcon && iconKey ? ICON_COMPONENT_MAP[iconKey as keyof typeof ICON_COMPONENT_MAP] : null;

  return (
    <Badge 
      className={`${getSizeClasses(size)} ${colorClasses} font-medium border flex items-center gap-1 ${className}`}
      data-testid={testId}
    >
      {IconComponent && <IconComponent className="w-3 h-3" />}
      {label}
    </Badge>
  );
}

// Universal Layer Badge - for agent layers
export function UniversalLayerBadge({ 
  value, 
  size = 'md', 
  showIcon = true, 
  className = '',
  'data-testid': testId 
}: UniversalBadgeProps) {
  const { 
    layers,
    getColorForKey,
    getIconForKey,
    getColorForKeyCaseInsensitive,
    getIconForKeyCaseInsensitive,
    findMetadataOption,
    isLoading 
  } = useAgentMetadata();

  if (isLoading) {
    return (
      <Badge 
        className={`${getSizeClasses(size)} bg-gray-500/20 text-gray-400 border-gray-500/30 animate-pulse ${className}`}
        data-testid={testId}
      >
        Loading...
      </Badge>
    );
  }

  const layerMetadata = findMetadataOption('layers', value);
  const colorKey = layerMetadata?.color || getColorForKeyCaseInsensitive(value);
  const iconKey = layerMetadata?.icon || getIconForKeyCaseInsensitive(value);
  const label = layerMetadata?.label || value;
  
  const colorClasses = getColorClasses(colorKey);
  const IconComponent = showIcon && iconKey ? ICON_COMPONENT_MAP[iconKey as keyof typeof ICON_COMPONENT_MAP] : null;

  return (
    <Badge 
      className={`${getSizeClasses(size)} ${colorClasses} font-medium border flex items-center gap-1 ${className}`}
      data-testid={testId}
    >
      {IconComponent && <IconComponent className="w-3 h-3" />}
      {label}
    </Badge>
  );
}

// Universal Governance Badge - for governance states
export function UniversalGovernanceBadge({ 
  value, 
  size = 'md', 
  showIcon = true, 
  className = '',
  'data-testid': testId 
}: UniversalBadgeProps) {
  const { 
    governanceStatuses,
    getColorForKey,
    getIconForKey,
    getColorForKeyCaseInsensitive,
    getIconForKeyCaseInsensitive,
    findMetadataOption,
    isLoading 
  } = useAgentMetadata();

  if (isLoading) {
    return (
      <Badge 
        className={`${getSizeClasses(size)} bg-gray-500/20 text-gray-400 border-gray-500/30 animate-pulse ${className}`}
        data-testid={testId}
      >
        Loading...
      </Badge>
    );
  }

  const governanceMetadata = findMetadataOption('governanceStatuses', value);
  const colorKey = governanceMetadata?.color || getColorForKeyCaseInsensitive(value);
  const iconKey = governanceMetadata?.icon || getIconForKeyCaseInsensitive(value);
  const label = governanceMetadata?.label || value;
  
  const colorClasses = getColorClasses(colorKey);
  const IconComponent = showIcon && iconKey ? ICON_COMPONENT_MAP[iconKey as keyof typeof ICON_COMPONENT_MAP] : null;

  return (
    <Badge 
      className={`${getSizeClasses(size)} ${colorClasses} font-medium border flex items-center gap-1 ${className}`}
      data-testid={testId}
    >
      {IconComponent && <IconComponent className="w-3 h-3" />}
      {label}
    </Badge>
  );
}

// Universal Risk Badge - for risk levels
export function UniversalRiskBadge({ 
  value, 
  size = 'md', 
  showIcon = true, 
  className = '',
  'data-testid': testId 
}: UniversalBadgeProps) {
  const { 
    riskLevels,
    getColorForKey,
    getIconForKey,
    getColorForKeyCaseInsensitive,
    getIconForKeyCaseInsensitive,
    findMetadataOption,
    isLoading 
  } = useAgentMetadata();

  if (isLoading) {
    return (
      <Badge 
        className={`${getSizeClasses(size)} bg-gray-500/20 text-gray-400 border-gray-500/30 animate-pulse ${className}`}
        data-testid={testId}
      >
        Loading...
      </Badge>
    );
  }

  const riskMetadata = findMetadataOption('riskLevels', value);
  const colorKey = riskMetadata?.color || getColorForKeyCaseInsensitive(value);
  const iconKey = riskMetadata?.icon || getIconForKeyCaseInsensitive(value);
  const label = riskMetadata?.label || value;
  
  const colorClasses = getColorClasses(colorKey);
  const IconComponent = showIcon && iconKey ? ICON_COMPONENT_MAP[iconKey as keyof typeof ICON_COMPONENT_MAP] : null;

  return (
    <Badge 
      className={`${getSizeClasses(size)} ${colorClasses} font-medium border flex items-center gap-1 ${className}`}
      data-testid={testId}
    >
      {IconComponent && <IconComponent className="w-3 h-3" />}
      {label}
    </Badge>
  );
}

// Universal Business Function Badge - for business functions
export function UniversalBusinessFunctionBadge({ 
  value, 
  size = 'md', 
  showIcon = false, 
  className = '',
  'data-testid': testId 
}: UniversalBadgeProps) {
  const { 
    businessFunctions,
    getColorForKey,
    getIconForKey,
    getColorForKeyCaseInsensitive,
    getIconForKeyCaseInsensitive,
    findMetadataOption,
    isLoading 
  } = useAgentMetadata();

  if (isLoading) {
    return (
      <Badge 
        className={`${getSizeClasses(size)} bg-gray-500/20 text-gray-400 border-gray-500/30 animate-pulse ${className}`}
        data-testid={testId}
      >
        Loading...
      </Badge>
    );
  }

  const functionMetadata = findMetadataOption('businessFunctions', value);
  const colorKey = functionMetadata?.color || 'blue'; // Default to blue for business functions
  const iconKey = functionMetadata?.icon || getIconForKeyCaseInsensitive(value);
  const label = functionMetadata?.label || value;
  
  const colorClasses = getColorClasses(colorKey);
  const IconComponent = showIcon && iconKey ? ICON_COMPONENT_MAP[iconKey as keyof typeof ICON_COMPONENT_MAP] : null;

  return (
    <Badge 
      className={`${getSizeClasses(size)} ${colorClasses} font-medium border flex items-center gap-1 ${className}`}
      data-testid={testId}
    >
      {IconComponent && <IconComponent className="w-3 h-3" />}
      {label}
    </Badge>
  );
}

// Helper function for size classes
function getSizeClasses(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'px-2 py-1 text-xs';
    case 'lg':
      return 'px-4 py-2 text-sm';
    default:
      return 'px-3 py-1.5 text-sm';
  }
}

// Helper function for color classes - database-driven with fallbacks
function getColorClasses(colorKey: string): string {
  switch (colorKey) {
    case 'green':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'blue':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'purple':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'cyan':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'yellow':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'orange':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'red':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'gray':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

// Composite Badge Component - handles multiple badge types automatically
interface UniversalSmartBadgeProps extends UniversalBadgeProps {
  type: 'status' | 'layer' | 'governance' | 'risk' | 'businessFunction';
}

export function UniversalSmartBadge({ type, ...props }: UniversalSmartBadgeProps) {
  switch (type) {
    case 'status':
      return <UniversalStatusBadge {...props} />;
    case 'layer':
      return <UniversalLayerBadge {...props} />;
    case 'governance':
      return <UniversalGovernanceBadge {...props} />;
    case 'risk':
      return <UniversalRiskBadge {...props} />;
    case 'businessFunction':
      return <UniversalBusinessFunctionBadge {...props} />;
    default:
      return <UniversalStatusBadge {...props} />;
  }
}

// Export all components for universal use across personas
export {
  UniversalStatusBadge as StatusBadge,
  UniversalLayerBadge as LayerBadge,
  UniversalGovernanceBadge as GovernanceBadge,
  UniversalRiskBadge as RiskBadge,
  UniversalBusinessFunctionBadge as BusinessFunctionBadge,
  UniversalSmartBadge as SmartBadge
};
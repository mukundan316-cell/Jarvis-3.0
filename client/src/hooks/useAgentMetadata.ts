import { useQuery } from '@tanstack/react-query';
import { usePersona } from './usePersona';
import { 
  caseInsensitiveFind, 
  caseInsensitiveEquals, 
  normalizeForComparison 
} from '@/utils/stringUtils';

// Types for the unified metadata structure
interface MetadataOption {
  key: string;
  label: string;
  color?: string;
  icon?: string;
  category?: string;
}

interface ColorMapping {
  border: string;
  text: string;
  bg: string;
}

interface UnifiedAgentMetadata {
  layers: MetadataOption[];
  statuses: MetadataOption[];
  governanceStatuses: MetadataOption[];
  riskLevels: MetadataOption[];
  businessFunctions: MetadataOption[];
  maturityLevels: MetadataOption[];
  agentTypes: MetadataOption[];
  statusFieldMapping: Record<string, string>;
  iconMappings: Record<string, string>;
  colorMappings: Record<string, ColorMapping>;
  personaConfig: {
    currentPersona: string;
    personaSpecificFilters?: any;
  };
  validationRules: Record<string, any>;
  cacheInfo: {
    lastUpdated: string;
    persona: string;
    scope: string;
  };
}

/**
 * Universal Agent Metadata Hook - Cross-Platform Persona Support
 * 
 * Replaces ALL hardcoded arrays across JARVIS admin interface with 
 * database-driven metadata that works consistently across all personas:
 * - admin, Rachel Thompson AUW, John Stevens IT Support, broker, etc.
 * 
 * Features:
 * ✅ Single source of truth for all filter options
 * ✅ Persona-aware configuration  
 * ✅ Universal status field mapping
 * ✅ Icon and color consistency
 * ✅ Validation rules alignment
 * ✅ Cross-platform compatibility
 */
export function useAgentMetadata(options?: { enabled?: boolean }) {
  const { currentPersona } = usePersona();
  
  const {
    data: metadata,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['/api/agents/metadata', { persona: currentPersona }],
    queryFn: async () => {
      const response = await fetch(`/api/agents/metadata?persona=${currentPersona}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }
      return response.json() as Promise<UnifiedAgentMetadata>;
    },
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: 2,
    retryDelay: 1000
  });

  // Helper functions for easy access to specific metadata
  const getFilterOptions = (type: keyof Pick<UnifiedAgentMetadata, 'layers' | 'statuses' | 'governanceStatuses' | 'riskLevels' | 'businessFunctions' | 'maturityLevels' | 'agentTypes'>) => {
    return metadata?.[type] || [];
  };

  const getColorForKey = (key: string, type: 'border' | 'text' | 'bg' = 'bg') => {
    const colorKey = metadata?.layers.find(l => l.key === key)?.color || 
                     metadata?.statuses.find(s => s.key === key)?.color ||
                     'gray';
    return metadata?.colorMappings?.[colorKey]?.[type] || `${type}-gray-500`;
  };

  const getIconForKey = (iconName: string) => {
    return metadata?.iconMappings?.[iconName] || iconName;
  };

  // Case-insensitive lookup functions
  const getColorForKeyCaseInsensitive = (key: string, type: 'border' | 'text' | 'bg' = 'bg') => {
    const layerMatch = caseInsensitiveFind(metadata?.layers, 'key', key);
    const statusMatch = caseInsensitiveFind(metadata?.statuses, 'key', key);
    const colorKey = layerMatch?.color || statusMatch?.color || 'gray';
    return metadata?.colorMappings?.[colorKey]?.[type] || `${type}-gray-500`;
  };

  const getIconForKeyCaseInsensitive = (iconName: string) => {
    if (!metadata?.iconMappings) return iconName;
    
    // Try exact match first
    if (metadata.iconMappings[iconName]) {
      return metadata.iconMappings[iconName];
    }
    
    // Try case-insensitive match
    const normalizedKey = normalizeForComparison(iconName);
    for (const [key, value] of Object.entries(metadata.iconMappings)) {
      if (normalizeForComparison(key) === normalizedKey) {
        return value;
      }
    }
    
    return iconName;
  };

  const findMetadataOption = (type: keyof Pick<UnifiedAgentMetadata, 'layers' | 'statuses' | 'governanceStatuses' | 'riskLevels' | 'businessFunctions' | 'maturityLevels' | 'agentTypes'>, key: string) => {
    const options = getFilterOptions(type);
    return caseInsensitiveFind(options, 'key', key);
  };

  // Status field normalization (handles both status and functionalStatus)
  const normalizeStatus = (agent: any) => {
    const mapping = metadata?.statusFieldMapping;
    if (!mapping) return agent.status || agent.functionalStatus;
    
    // Use primary status field mapping
    return agent.status || agent.functionalStatus || 'inactive';
  };

  // Validation helpers for forms
  const validateField = (fieldName: string, value: any) => {
    const rules = metadata?.validationRules?.[fieldName];
    if (!rules) return { isValid: true };

    const errors: string[] = [];

    if (rules.required && (!value || value === '')) {
      errors.push(`${fieldName} is required`);
    }

    if (rules.minLength && value && value.length < rules.minLength) {
      errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
    }

    if (rules.maxLength && value && value.length > rules.maxLength) {
      errors.push(`${fieldName} must be no more than ${rules.maxLength} characters`);
    }

    if (rules.allowedValues && value && !rules.allowedValues.includes(value)) {
      errors.push(`${fieldName} must be one of: ${rules.allowedValues.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Check if a filter option exists (prevents UI errors)
  const hasFilterOption = (type: string, key: string) => {
    const options = getFilterOptions(type as any);
    return options.some((option: MetadataOption) => option.key === key);
  };

  // Case-insensitive filter option checking
  const hasFilterOptionCaseInsensitive = (type: string, key: string) => {
    const options = getFilterOptions(type as any);
    return options.some((option: MetadataOption) => caseInsensitiveEquals(option.key, key));
  };

  return {
    // Core metadata
    metadata,
    isLoading,
    error,
    refetch,
    isFetching,

    // Filter options (replaces hardcoded arrays)
    layers: getFilterOptions('layers'),
    statuses: getFilterOptions('statuses'),
    governanceStatuses: getFilterOptions('governanceStatuses'),
    riskLevels: getFilterOptions('riskLevels'),
    businessFunctions: getFilterOptions('businessFunctions'),
    maturityLevels: getFilterOptions('maturityLevels'),
    agentTypes: getFilterOptions('agentTypes'),

    // Helper functions
    getColorForKey,
    getIconForKey,
    normalizeStatus,
    validateField,
    hasFilterOption,

    // Case-insensitive helper functions
    getColorForKeyCaseInsensitive,
    getIconForKeyCaseInsensitive,
    findMetadataOption,
    hasFilterOptionCaseInsensitive,

    // Persona info
    currentPersona,
    personaConfig: metadata?.personaConfig,

    // Cache status
    isStale: metadata ? (new Date().getTime() - new Date(metadata.cacheInfo.lastUpdated).getTime()) > 300000 : false
  };
}

// Type exports for use in components
export type { UnifiedAgentMetadata, MetadataOption, ColorMapping };
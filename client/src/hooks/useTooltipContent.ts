import { useQuery } from '@tanstack/react-query';
import { usePersona } from './usePersona';

// TypeScript interfaces for tooltip content management following replit.md standards
export interface TooltipContentConfig {
  content: string;
  variant?: 'default' | 'enhanced' | 'compact' | 'rich';
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  maxWidth?: number;
  richContent?: {
    title?: string;
    description?: string;
    icon?: string;
    badge?: string;
    shortcut?: string;
    details?: Array<{ label: string; value: string }>;
  };
}

export interface TooltipScope {
  persona?: string;
  agentId?: number;
  workflowId?: number;
}

/**
 * Custom hook for fetching tooltip content from ConfigService
 * Follows replit.md NO HARD-CODING principle by using database-driven configuration
 */
export function useTooltipContent(
  tooltipKey: string,
  scope?: TooltipScope,
  fallbackContent?: string
): {
  content: TooltipContentConfig | null;
  isLoading: boolean;
  error: any;
} {
  const { currentPersona } = usePersona();
  
  // Build scope with current persona if not provided
  const effectiveScope = {
    persona: currentPersona || 'admin',
    ...scope
  };

  // Create query URL with scope parameters
  const buildTooltipUrl = () => {
    const url = new URL(`/api/config/setting/tooltip.${tooltipKey}`, window.location.origin);
    
    if (effectiveScope.persona) {
      url.searchParams.set('persona', effectiveScope.persona);
    }
    if (effectiveScope.agentId) {
      url.searchParams.set('agentId', effectiveScope.agentId.toString());
    }
    if (effectiveScope.workflowId) {
      url.searchParams.set('workflowId', effectiveScope.workflowId.toString());
    }
    
    return url.toString();
  };

  const { data: tooltipConfig, isLoading, error } = useQuery({
    queryKey: [`/api/config/setting/tooltip.${tooltipKey}`, effectiveScope],
    queryFn: () => fetch(buildTooltipUrl()).then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes cache - align with ConfigService cache TTL
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    retry: 1, // Retry once on failure, then use fallback
    retryDelay: 1000,
    enabled: !!tooltipKey // Only fetch when tooltipKey is provided
  });

  // Extract tooltip content from ConfigService response or use fallback
  const content = tooltipConfig?.value || (fallbackContent ? { content: fallbackContent } : null);

  return {
    content,
    isLoading,
    error
  };
}

/**
 * Hook for simple text tooltips with fallback
 */
export function useSimpleTooltip(
  tooltipKey: string,
  fallbackContent: string,
  scope?: TooltipScope
): {
  content: string;
  isLoading: boolean;
  error: any;
} {
  const { content, isLoading, error } = useTooltipContent(tooltipKey, scope, fallbackContent);
  
  return {
    content: content?.content || fallbackContent,
    isLoading,
    error
  };
}

/**
 * Hook for rich tooltips with structured content
 */
export function useRichTooltip(
  tooltipKey: string,
  fallbackConfig: TooltipContentConfig,
  scope?: TooltipScope
): {
  config: TooltipContentConfig;
  isLoading: boolean;
  error: any;
} {
  const { content, isLoading, error } = useTooltipContent(tooltipKey, scope);
  
  return {
    config: content || fallbackConfig,
    isLoading,
    error
  };
}

// Utility function for batch loading multiple tooltips (useful for forms or complex UIs)
export function useBatchTooltips(
  tooltipKeys: string[],
  scope?: TooltipScope
): {
  tooltips: Record<string, TooltipContentConfig | null>;
  isLoading: boolean;
  errors: Record<string, any>;
} {
  const results = tooltipKeys.map(key => 
    useTooltipContent(key, scope)
  );

  const tooltips = tooltipKeys.reduce((acc, key, index) => {
    acc[key] = results[index].content;
    return acc;
  }, {} as Record<string, TooltipContentConfig | null>);

  const errors = tooltipKeys.reduce((acc, key, index) => {
    if (results[index].error) {
      acc[key] = results[index].error;
    }
    return acc;
  }, {} as Record<string, any>);

  const isLoading = results.some(result => result.isLoading);

  return {
    tooltips,
    isLoading,
    errors
  };
}
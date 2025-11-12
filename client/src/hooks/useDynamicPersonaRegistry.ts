/**
 * Dynamic Persona Registry Hook
 * Provides unified interface for discovering, registering, and managing dynamically generated personas
 * Integrates with ConfigService to maintain the single source of truth for persona configurations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { usePersonaManagement } from './usePersonaManagement';
import type { PersonaType } from '@/lib/personaColors';

export interface PersonaRegistryEntry {
  personaKey: string;
  displayName: string;
  isStatic: boolean;
  isActive: boolean;
  sourceType: 'static' | 'agent-generated' | 'user-created';
  sourceAgentId?: number;
  registeredAt: string;
  lastUsed?: string;
  usageCount: number;
  capabilityManifest: Record<string, any>;
  accessLevel: 'admin' | 'advanced' | 'standard';
}

export interface PersonaDiscoveryResult {
  availableAgents: Array<{
    id: number;
    name: string;
    canGeneratePersona: boolean;
    hasGeneratedPersona: boolean;
    estimatedCapabilities: string[];
  }>;
  suggestedPersonas: Array<{
    agentId: number;
    suggestedKey: string;
    suggestedDisplayName: string;
    rationale: string;
    confidence: number;
  }>;
  configurationHealth: {
    totalPersonas: number;
    activePersonas: number;
    staticPersonas: number;
    dynamicPersonas: number;
    inconsistencies: string[];
  };
}

/**
 * Hook for discovering and managing the dynamic persona registry
 */
export function useDynamicPersonaRegistry() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { allPersonas, dynamicPersonas } = usePersonaManagement();

  // Discover available persona generation opportunities
  const { data: discoveryResult, isLoading: isDiscovering } = useQuery<PersonaDiscoveryResult>({
    queryKey: ['/api/personas/discover'],
    queryFn: async () => {
      const response = await fetch('/api/personas/discover');
      if (!response.ok) throw new Error('Failed to discover personas');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get persona registry status
  const { data: registryStatus } = useQuery<PersonaRegistryEntry[]>({
    queryKey: ['/api/personas/registry'],
    queryFn: async () => {
      const response = await fetch('/api/personas/registry');
      if (!response.ok) throw new Error('Failed to fetch registry');
      return response.json();
    },
  });

  // Sync persona configurations with ConfigService
  const syncConfigMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/personas/sync-config', 'POST');
    },
    onSuccess: () => {
      // Invalidate exact query keys used by the hooks
      queryClient.invalidateQueries({ queryKey: ['/api/personas/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/static'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/dynamic'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/registry'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/discover'] });
      queryClient.invalidateQueries({ queryKey: ['/api/config/setting/persona.directory'] });
      
      toast({
        title: 'Configuration Synced',
        description: 'Persona configurations have been synchronized with ConfigService',
      });
    },
  });

  // Auto-register suggested personas
  const autoRegisterMutation = useMutation({
    mutationFn: async (suggestions: string[]) => {
      return apiRequest('/api/personas/auto-register', 'POST', { suggestions });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/personas/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/dynamic'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/registry'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/discover'] });
      toast({
        title: 'Auto-Registration Complete',
        description: `${result.registeredCount} personas have been automatically registered`,
      });
    },
  });

  // Cleanup inactive personas
  const cleanupMutation = useMutation({
    mutationFn: async (olderThanDays: number = 30) => {
      return apiRequest('/api/personas/cleanup', 'POST', { olderThanDays });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/personas/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/dynamic'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/registry'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/discover'] });
      toast({
        title: 'Cleanup Complete',
        description: `${result.removedCount} inactive personas have been removed`,
      });
    },
  });

  // Update persona usage statistics
  const updateUsageMutation = useMutation({
    mutationFn: async (personaKey: string) => {
      return apiRequest(`/api/personas/${personaKey}/usage`, 'POST');
    },
  });

  return {
    // Discovery data
    discoveryResult,
    isDiscovering,
    registryStatus: registryStatus || [],
    
    // Sync operations
    syncConfiguration: syncConfigMutation.mutate,
    isSyncing: syncConfigMutation.isPending,
    
    autoRegisterSuggested: autoRegisterMutation.mutate,
    isAutoRegistering: autoRegisterMutation.isPending,
    
    cleanupInactive: cleanupMutation.mutate,
    isCleaning: cleanupMutation.isPending,
    
    updateUsage: updateUsageMutation.mutate,
    
    // Analytics and insights
    getRegistryHealth: () => discoveryResult?.configurationHealth,
    getSuggestedPersonas: () => discoveryResult?.suggestedPersonas || [],
    getAvailableAgents: () => discoveryResult?.availableAgents || [],
    
    // Utility functions
    getPersonaUsage: (personaKey: string) => {
      const entry = registryStatus?.find(p => p.personaKey === personaKey);
      return {
        usageCount: entry?.usageCount || 0,
        lastUsed: entry?.lastUsed,
        registeredAt: entry?.registeredAt,
      };
    },
    
    getPersonasBySource: (sourceType: 'static' | 'agent-generated' | 'user-created') => {
      return registryStatus?.filter(p => p.sourceType === sourceType) || [];
    },
    
    getActivePersonas: () => registryStatus?.filter(p => p.isActive) || [],
    
    getInactivePersonas: () => registryStatus?.filter(p => !p.isActive) || [],
    
    // Configuration validation
    validateConfiguration: () => {
      const health = discoveryResult?.configurationHealth;
      if (!health) return { isValid: false, issues: ['Configuration health data unavailable'] };
      
      const issues: string[] = [];
      
      if (health.inconsistencies.length > 0) {
        issues.push(...health.inconsistencies);
      }
      
      if (health.activePersonas === 0) {
        issues.push('No active personas found');
      }
      
      return {
        isValid: issues.length === 0,
        issues,
        health,
      };
    },
    
    // Persona recommendations
    getRecommendations: () => {
      const suggestions = discoveryResult?.suggestedPersonas || [];
      return suggestions
        .filter(s => s.confidence > 0.7) // Only high-confidence suggestions
        .sort((a, b) => b.confidence - a.confidence);
    },
    
    // Statistics
    getStatistics: () => {
      const health = discoveryResult?.configurationHealth;
      const registry = registryStatus || [];
      
      return {
        total: health?.totalPersonas || 0,
        active: health?.activePersonas || 0,
        static: health?.staticPersonas || 0,
        dynamic: health?.dynamicPersonas || 0,
        avgUsage: registry.reduce((sum, p) => sum + p.usageCount, 0) / registry.length || 0,
        lastSync: syncConfigMutation.data?.lastSync,
      };
    },
  };
}
/**
 * Agent to Persona Conversion Hook
 * Handles the conversion of role agents into full personas with dashboard framework
 * Supports dynamic persona generation while maintaining ConfigService integration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { InsertAgent } from '@shared/schema';

export interface ConvertibleAgent {
  id: number;
  name: string;
  agentRole?: string;
  personaName?: string;
  type: string;
  layer: string;
  persona: string;
  specialization?: string;
  description?: string;
  canGeneratePersona: boolean;
  personaCapabilities?: Record<string, any>;
  dashboardTemplate?: Record<string, any>;
  personaGenerationConfig?: Record<string, any>;
}

export interface PersonaConversionRequest {
  agentId: number;
  personaKey: string;
  displayName: string;
  department?: string;
  avatarUrl?: string;
  accessLevel?: 'admin' | 'advanced' | 'standard';
  customDashboardConfig?: Record<string, any>;
  customCapabilities?: Record<string, any>;
}

export interface PersonaConversionResult {
  success: boolean;
  personaId: number;
  personaKey: string;
  dashboardUrl?: string;
  availableFeatures: string[];
  message: string;
}

/**
 * Hook for managing role agent → persona conversion
 */
export function useAgentToPersonaConversion() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all convertible role agents
  const { data: convertibleAgents, isLoading: agentsLoading } = useQuery<ConvertibleAgent[]>({
    queryKey: ['/api/agents/convertible'],
    queryFn: async () => {
      const response = await fetch('/api/agents/convertible');
      if (!response.ok) throw new Error('Failed to fetch convertible agents');
      return response.json();
    },
  });

  // Enable persona generation for an agent
  const enablePersonaGenerationMutation = useMutation({
    mutationFn: async ({ agentId, config }: { agentId: number; config?: Record<string, any> }) => {
      return apiRequest(`/api/agents/${agentId}/enable-persona`, 'PATCH', {
        canGeneratePersona: true,
        personaGenerationConfig: config || {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/convertible'] });
      toast({
        title: 'Persona Generation Enabled',
        description: 'Agent can now be converted to a persona',
      });
    },
  });

  // Convert role agent to persona
  const convertToPersonaMutation = useMutation({
    mutationFn: async (request: PersonaConversionRequest): Promise<PersonaConversionResult> => {
      return apiRequest('/api/agents/convert-to-persona', 'POST', request);
    },
    onSuccess: (result) => {
      // Invalidate exact query keys used by the hooks
      queryClient.invalidateQueries({ queryKey: ['/api/personas/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/static'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/dynamic'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/registry'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/convertible'] });
      queryClient.invalidateQueries({ queryKey: ['/api/config/setting/persona.directory'] });
      
      toast({
        title: 'Conversion Successful',
        description: `${result.message}. New persona "${result.personaKey}" is now available.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Conversion Failed',
        description: error.message || 'Failed to convert agent to persona',
        variant: 'destructive',
      });
    },
  });

  // Validate conversion requirements
  const validateConversionMutation = useMutation({
    mutationFn: async (agentId: number) => {
      return apiRequest(`/api/agents/${agentId}/validate-conversion`, 'POST');
    },
  });

  // Generate persona configuration preview
  const generatePreviewMutation = useMutation({
    mutationFn: async (agentId: number) => {
      return apiRequest(`/api/agents/${agentId}/persona-preview`, 'POST');
    },
  });

  return {
    // Data
    convertibleAgents: convertibleAgents || [],
    isLoadingAgents: agentsLoading,
    
    // Conversion mutations
    convertToPersona: convertToPersonaMutation.mutate,
    isConverting: convertToPersonaMutation.isPending,
    conversionResult: convertToPersonaMutation.data,
    
    // Enable persona generation
    enablePersonaGeneration: enablePersonaGenerationMutation.mutate,
    isEnabling: enablePersonaGenerationMutation.isPending,
    
    // Validation and preview
    validateConversion: validateConversionMutation.mutate,
    isValidating: validateConversionMutation.isPending,
    validationResult: validateConversionMutation.data,
    
    generatePreview: generatePreviewMutation.mutate,
    isGeneratingPreview: generatePreviewMutation.isPending,
    previewResult: generatePreviewMutation.data,
    
    // Utility functions
    getAgentById: (id: number) => convertibleAgents?.find(a => a.id === id),
    getAgentsByPersona: (persona: string) => 
      convertibleAgents?.filter(a => a.persona === persona) || [],
    getEnabledAgents: () => 
      convertibleAgents?.filter(a => a.canGeneratePersona) || [],
    getDisabledAgents: () => 
      convertibleAgents?.filter(a => !a.canGeneratePersona) || [],
    
    // Validation helpers
    canConvertAgent: (agentId: number) => {
      const agent = convertibleAgents?.find(a => a.id === agentId);
      return agent?.canGeneratePersona && agent?.type === 'Role Agent';
    },
    
    isPersonaKeyValid: (key: string) => {
      // Basic validation - should be expanded based on requirements
      return key.length >= 3 && key.length <= 50 && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(key);
    },
    
    getRequiredCapabilities: (agentId: number) => {
      const agent = convertibleAgents?.find(a => a.id === agentId);
      return agent?.personaCapabilities || {};
    },
    
    getDashboardTemplate: (agentId: number) => {
      const agent = convertibleAgents?.find(a => a.id === agentId);
      return agent?.dashboardTemplate || {};
    },
    
    // Error handling
    getLastError: () => convertToPersonaMutation.error?.message,
    clearError: () => convertToPersonaMutation.reset(),
  };
}
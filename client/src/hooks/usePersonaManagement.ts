/**
 * Unified Persona Management Hook
 * Provides consolidated interface for all persona operations including dynamic agent-generated personas
 * Supports the NO HARD-CODING principle by integrating with ConfigService
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { PersonaType } from '@/lib/personaColors';
import type { RolePersona, InsertRolePersona } from '@shared/schema';

export interface DynamicPersona extends RolePersona {
  isGenerated?: boolean;
  sourceAgent?: {
    id: number;
    name: string;
    agentRole: string;
  };
}

export interface PersonaRegistrationData {
  sourceAgentId: number;
  personaKey: string;
  displayName: string;
  agentRole?: string;
  department?: string;
  avatarUrl?: string;
  capabilityManifest?: Record<string, any>;
  dashboardConfig?: Record<string, any>;
  accessLevel?: 'admin' | 'advanced' | 'standard';
}

/**
 * Unified hook for all persona management operations
 */
export function usePersonaManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all personas (static + dynamic)
  const { data: allPersonas, isLoading, error } = useQuery<DynamicPersona[]>({
    queryKey: ['/api/personas/all'],
    queryFn: async () => {
      const response = await fetch('/api/personas/all');
      if (!response.ok) throw new Error('Failed to fetch personas');
      return response.json();
    },
  });

  // Fetch only static personas (original predefined ones)
  const { data: staticPersonas } = useQuery<RolePersona[]>({
    queryKey: ['/api/personas/static'],
    queryFn: async () => {
      const response = await fetch('/api/personas/static');
      if (!response.ok) throw new Error('Failed to fetch static personas');
      return response.json();
    },
  });

  // Fetch only dynamic personas (agent-generated)
  const { data: dynamicPersonas } = useQuery<DynamicPersona[]>({
    queryKey: ['/api/personas/dynamic'],
    queryFn: async () => {
      const response = await fetch('/api/personas/dynamic');
      if (!response.ok) throw new Error('Failed to fetch dynamic personas');
      return response.json();
    },
  });

  // Register a new dynamic persona from role agent
  const registerPersonaMutation = useMutation({
    mutationFn: async (data: PersonaRegistrationData) => {
      return apiRequest('/api/personas/register', 'POST', data);
    },
    onSuccess: (data) => {
      // Invalidate exact query keys used by the hooks
      queryClient.invalidateQueries({ queryKey: ['/api/personas/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/static'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/dynamic'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/registry'] });
      queryClient.invalidateQueries({ queryKey: ['/api/config/setting/persona.directory'] });
      
      toast({
        title: 'Persona Registered',
        description: `${data.displayName} is now available as a persona`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to register persona',
        variant: 'destructive',
      });
    },
  });

  // Activate/deactivate a persona
  const togglePersonaStatusMutation = useMutation({
    mutationFn: async ({ personaId, isActive }: { personaId: number; isActive: boolean }) => {
      return apiRequest(`/api/personas/${personaId}/status`, 'PATCH', { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/personas/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/static'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/dynamic'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/registry'] });
      toast({
        title: 'Persona Status Updated',
        description: 'Persona availability has been updated',
      });
    },
  });

  // Delete a dynamic persona
  const deletePersonaMutation = useMutation({
    mutationFn: async (personaId: number) => {
      return apiRequest(`/api/personas/${personaId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/personas/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/static'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/dynamic'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/registry'] });
      toast({
        title: 'Persona Removed',
        description: 'Persona has been successfully removed',
      });
    },
  });

  // Update persona configuration
  const updatePersonaMutation = useMutation({
    mutationFn: async ({ personaId, updates }: { personaId: number; updates: Partial<InsertRolePersona> }) => {
      return apiRequest(`/api/personas/${personaId}`, 'PATCH', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/personas/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/static'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/dynamic'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/registry'] });
      toast({
        title: 'Persona Updated',
        description: 'Persona configuration has been updated',
      });
    },
  });

  return {
    // Data
    allPersonas: allPersonas || [],
    staticPersonas: staticPersonas || [],
    dynamicPersonas: dynamicPersonas || [],
    
    // Loading states
    isLoading,
    error,
    
    // Mutations
    registerPersona: registerPersonaMutation.mutate,
    isRegistering: registerPersonaMutation.isPending,
    
    togglePersonaStatus: togglePersonaStatusMutation.mutate,
    isUpdatingStatus: togglePersonaStatusMutation.isPending,
    
    deletePersona: deletePersonaMutation.mutate,
    isDeleting: deletePersonaMutation.isPending,
    
    updatePersona: updatePersonaMutation.mutate,
    isUpdating: updatePersonaMutation.isPending,
    
    // Utility functions
    getPersonaById: (id: number) => allPersonas?.find(p => p.id === id),
    getPersonaByKey: (key: string) => allPersonas?.find(p => p.personaKey === key),
    getActivePersonas: () => allPersonas?.filter(p => p.isActive) || [],
    getDynamicPersonasByAgent: (agentId: number) => 
      dynamicPersonas?.filter(p => p.sourceAgentId === agentId) || [],
    
    // Validation
    isPersonaKeyAvailable: (key: string) => !allPersonas?.some(p => p.personaKey === key),
    canRegisterPersona: (agentId: number) => {
      // Check if agent already has a generated persona
      return !dynamicPersonas?.some(p => p.sourceAgentId === agentId);
    },
  };
}
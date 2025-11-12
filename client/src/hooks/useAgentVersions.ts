import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

/**
 * Custom hooks for agent version management
 * Interfaces with the version control API endpoints
 * Provides version history, rollback capabilities, and unsaved changes tracking
 */

interface AgentVersion {
  id: number;
  agentId: number;
  version: string;
  configSnapshot: any;
  performanceSnapshot?: any;
  resourceUsage?: any;
  rollbackData?: any;
  changeDescription?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateVersionRequest {
  version?: string;
  changeDescription?: string;
  configSnapshot?: any;
  performanceSnapshot?: any;
  resourceUsage?: any;
}

interface RollbackRequest {
  reason?: string;
}

/**
 * Hook for fetching agent version history
 * @param agentId The agent ID to fetch versions for
 */
export function useAgentVersions(agentId: number | null) {
  return useQuery<AgentVersion[]>({
    queryKey: ['/api/agents', agentId, 'versions'],
    enabled: !!agentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    retry: 1,
    retryDelay: 1000
  });
}

/**
 * Hook for creating a new agent version snapshot
 * @param agentId The agent ID to create version for
 */
export function useCreateAgentVersion(agentId: number) {
  return useMutation<AgentVersion, Error, CreateVersionRequest>({
    mutationFn: (versionData) =>
      apiRequest(`/api/agents/${agentId}/versions`, 'POST', versionData),
    onSuccess: () => {
      // Invalidate and refetch version history
      queryClient.invalidateQueries({ 
        queryKey: ['/api/agents', agentId, 'versions'] 
      });
      // Also invalidate the agent data to reflect new version
      queryClient.invalidateQueries({ 
        queryKey: ['/api/agents', agentId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/agents'] 
      });
    },
    retry: 1,
    retryDelay: 1000
  });
}

/**
 * Hook for rolling back agent to a specific version
 * @param agentId The agent ID to rollback
 */
export function useRollbackAgentVersion(agentId: number) {
  return useMutation<any, Error, { version: string; reason?: string }>({
    mutationFn: ({ version, reason }) =>
      apiRequest(`/api/agents/${agentId}/rollback/${version}`, 'POST', { reason }),
    onSuccess: () => {
      // Invalidate relevant caches after rollback
      queryClient.invalidateQueries({ 
        queryKey: ['/api/agents', agentId, 'versions'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/agents', agentId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/agents'] 
      });
    },
    retry: 1,
    retryDelay: 2000 // Longer delay for rollback operations
  });
}

/**
 * Hook for checking if an agent has unsaved changes
 * Compares current config with the latest version snapshot
 * @param agentId The agent ID to check
 * @param currentConfig The current agent configuration
 */
export function useAgentUnsavedChanges(agentId: number | null, currentConfig?: any) {
  const { data: versions, isLoading } = useAgentVersions(agentId);
  
  // Get the latest version to compare against
  const latestVersion = versions?.[0];
  
  // Compare current config with latest snapshot (simplified comparison)
  const hasUnsavedChanges = latestVersion && currentConfig ? 
    JSON.stringify(latestVersion.configSnapshot) !== JSON.stringify(currentConfig) : 
    false;
  
  return {
    hasUnsavedChanges,
    latestVersion,
    isLoading
  };
}

/**
 * Utility hook to get version badge info for display
 * @param agentId The agent ID
 */
export function useAgentVersionBadge(agentId: number | null) {
  const { data: versions, isLoading, error } = useAgentVersions(agentId);
  
  const currentVersion = versions?.[0]?.version || '1.0.0';
  const versionCount = versions?.length || 0;
  const lastUpdated = versions?.[0]?.createdAt;
  
  return {
    currentVersion,
    versionCount,
    lastUpdated,
    isLoading,
    error,
    hasVersionHistory: versionCount > 0
  };
}

/**
 * Hook for getting agent lifecycle stage with version context
 * @param agentId The agent ID
 */
export function useAgentLifecycleInfo(agentId: number | null) {
  return useQuery<any>({
    queryKey: ['/api/agents', agentId, 'lifecycle'],
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    retry: 1
  });
}
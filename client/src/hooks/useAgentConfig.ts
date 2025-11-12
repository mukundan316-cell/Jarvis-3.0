import { useQuery } from '@tanstack/react-query';
import { usePersona } from './usePersona';

/**
 * Custom hooks for agent configuration data from ConfigService
 * Replaces hardcoded arrays with database-driven configurations
 * Following replit.md NO HARD-CODING principle
 */

interface AgentLayerDefinition {
  value: string;
  label: string;
  description: string;
  icon: string;
  order: number;
}

interface AgentTypeDefinition {
  value: string;
  label: string;
  description: string;
  layer: string;
}

interface AgentCapability {
  name: string;
  category: string;
  riskLevel: string;
}

interface PersonaDefinition {
  value: string;
  label: string;
  description: string;
}

interface AgentStatusOption {
  value: string;
  label: string;
  color: string;
  description: string;
}

// ConfigService response structure
interface ConfigServiceResponse<T> {
  value: T;
}

// Generic hook for fetching ConfigService settings
function useConfigSetting<T>(key: string, scope?: any) {
  const { currentPersona } = usePersona();
  
  return useQuery<ConfigServiceResponse<T>, Error, T | null>({
    queryKey: [`/api/config/setting/${key}`, { ...scope, persona: currentPersona }],
    queryFn: () => {
      const url = new URL(`/api/config/setting/${key}`, window.location.origin);
      if (scope?.persona || currentPersona) {
        url.searchParams.set('persona', scope?.persona || currentPersona);
      }
      if (scope?.agentId) {
        url.searchParams.set('agentId', scope.agentId.toString());
      }
      if (scope?.workflowId) {
        url.searchParams.set('workflowId', scope.workflowId.toString());
      }
      return fetch(url.toString(), {
        credentials: 'include'
      }).then(res => res.json());
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - align with ConfigService cache TTL
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    retry: 1,
    retryDelay: 1000,
    select: (data) => data?.value || null
  });
}

/**
 * Hook for fetching agent layer definitions - Phase 5: Universal Hierarchy Display
 * Uses unified hierarchy config as single source of truth
 */
export function useAgentLayerDefinitions() {
  const { currentPersona } = usePersona();
  
  // Primary: Get layer definitions from unified hierarchy config
  const { data: hierarchyConfig, isLoading: hierarchyLoading, error: hierarchyError } = useQuery({
    queryKey: ['/api/hierarchy/config', { persona: currentPersona }],
    queryFn: () =>
      fetch(`/api/hierarchy/config?persona=${currentPersona}`, {
        credentials: 'include'
      }).then(res => res.json()),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fallback: ConfigService setting for layer definitions
  const { data: configLayerDefinitions, isLoading: configLoading, error: configError } = useConfigSetting<AgentLayerDefinition[]>('agent.layer.definitions');
  
  // Transform unified hierarchy config to layer definitions
  const layerDefinitionsFromHierarchy = hierarchyConfig?.layers?.map((layer: any, index: number) => ({
    value: layer.layer,
    label: layer.displayName || `${layer.layer} Layer`,
    description: layer.description || `${layer.layer} layer agents`,
    icon: layer.icon || 'Cog',
    order: layer.order || index + 3, // Start from 3 after Experience(1) and Meta Brain(2)
    agentCount: layer.agents?.length || 0
  })) || [];

  // Add Experience and Meta Brain layers
  const experienceLayer = hierarchyConfig?.experienceLayer ? {
    value: 'Experience',
    label: 'Experience Layer',
    description: 'User interaction and personalization',
    icon: 'Globe',
    order: 1,
    agentCount: 1
  } : null;

  const metaBrainLayer = hierarchyConfig?.metaBrainLayer ? {
    value: 'Meta Brain',
    label: 'Meta Brain',
    description: 'Central intelligence coordination',
    icon: 'Bot',
    order: 2,
    agentCount: 1
  } : null;

  // Combine all layers and deduplicate by value
  const allLayersWithDuplicates = [
    ...(experienceLayer ? [experienceLayer] : []),
    ...(metaBrainLayer ? [metaBrainLayer] : []),
    ...layerDefinitionsFromHierarchy
  ];
  
  // Deduplicate by layer value to prevent duplicates
  const seenValues = new Set();
  const allLayers = allLayersWithDuplicates
    .filter(layer => {
      if (seenValues.has(layer.value)) {
        return false;
      }
      seenValues.add(layer.value);
      return true;
    })
    .sort((a, b) => a.order - b.order);

  // Return only metadata-driven layers - no hardcoded fallbacks
  return {
    layerDefinitions: allLayers.length > 0 ? allLayers : (configLayerDefinitions || []),
    isLoading: hierarchyLoading || configLoading,
    error: hierarchyError || configError
  };
}

/**
 * Hook for fetching agent type definitions
 * Replaces hardcoded AGENT_TYPE_OPTIONS
 */
export function useAgentTypeDefinitions() {
  const { data: typeDefinitions, isLoading, error } = useConfigSetting<AgentTypeDefinition[]>('agent.type.definitions');
  
  // Return only ConfigService data - no hardcoded fallbacks
  return {
    typeDefinitions: typeDefinitions || [],
    isLoading,
    error
  };
}

/**
 * Hook for fetching agent types by layer mapping
 * Replaces hardcoded typesByLayer
 */
export function useAgentTypesByLayer() {
  const { data: typesByLayer, isLoading, error } = useConfigSetting<Record<string, string[]>>('agent.types.by-layer');
  
  // Return only ConfigService data - no hardcoded fallbacks
  return {
    typesByLayer: typesByLayer || {},
    isLoading,
    error
  };
}

/**
 * Hook for fetching available agent capabilities
 * Replaces hardcoded CAPABILITY_OPTIONS
 */
export function useAgentCapabilities() {
  const { data: capabilities, isLoading, error } = useConfigSetting<AgentCapability[]>('agent.capabilities.available');
  
  // Return only ConfigService data - no hardcoded fallbacks
  return {
    capabilities: capabilities || [],
    isLoading,
    error
  };
}

/**
 * Hook for fetching available personas
 * Replaces hardcoded personaOptions
 */
export function useAgentPersonas() {
  const { data: personas, isLoading, error } = useConfigSetting<PersonaDefinition[]>('agent.personas.available');
  
  // Fallback personas when ConfigService data is unavailable
  const fallbackPersonas = [
    { value: 'admin', label: 'Admin', description: 'System Administrator' },
    { value: 'rachel', label: 'Rachel Thompson', description: 'Assistant Underwriter' },
    { value: 'john', label: 'John Stevens', description: 'IT Support Specialist' },
    { value: 'sarah', label: 'Sarah Wilson', description: 'Broker Agent' },
    { value: 'universal', label: 'Universal', description: 'Cross-persona agent' }
  ];
  
  return {
    personas: personas || fallbackPersonas,
    isLoading,
    error
  };
}

/**
 * Hook for fetching agent status options
 * Provides status colors and descriptions
 */
export function useAgentStatusOptions() {
  const { data: statusOptions, isLoading, error } = useConfigSetting<AgentStatusOption[]>('agent.status.options');
  
  // Return only ConfigService data - no hardcoded fallbacks
  return {
    statusOptions: statusOptions || [],
    isLoading,
    error
  };
}

/**
 * Hook for fetching agent validation rules
 * Enables dynamic form validation based on agent type
 */
export function useAgentValidationRules(agentType?: string) {
  const { data: validationRules, isLoading, error } = useConfigSetting<Record<string, any>>('agent.validation.rules');
  
  return {
    validationRules: agentType ? validationRules?.[agentType] || {} : validationRules || {},
    isLoading,
    error
  };
}

/**
 * Utility hook to seed agent CRUD configurations
 * Used for initial setup or testing
 */
export function useSeedAgentCRUDConfig() {
  return useQuery({
    queryKey: ['/api/seed-agent-crud-config'],
    queryFn: () => 
      fetch('/api/seed-agent-crud-config', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => res.json()),
    enabled: false, // Only run when manually triggered
    staleTime: Infinity,
    gcTime: Infinity
  });
}

// === ENTERPRISE TAXONOMY & GOVERNANCE HOOKS ===

/**
 * Hook for fetching maturity level definitions (L0-L4)
 * Provides agent capability taxonomy for enterprise progression
 */
export function useMaturityLevelDefinitions() {
  const { data: maturityLevels, isLoading, error } = useConfigSetting<Record<string, any>>('agent.maturity.definitions');
  
  return {
    maturityLevels: maturityLevels || {},
    maturityOptions: maturityLevels ? Object.entries(maturityLevels).map(([key, value]: [string, any]) => ({
      value: key,
      label: value.label,
      description: value.description,
      capabilities: value.capabilities || [],
      requirements: value.requirements || [],
      costMultiplier: value.costMultiplier || 1.0,
      complexityScore: value.complexityScore || 1
    })) : [],
    isLoading,
    error
  };
}

/**
 * Hook for fetching agent category options (Reactive, Deliberative, etc.)
 * Provides structured agent behavioral classifications
 */
export function useAgentCategoryOptions() {
  const { data: categories, isLoading, error } = useConfigSetting<Record<string, any>>('agent.category.definitions');
  
  return {
    categories: categories || {},
    categoryOptions: categories ? Object.entries(categories).map(([key, value]: [string, any]) => ({
      value: key,
      label: value.label,
      description: value.description,
      characteristics: value.characteristics || [],
      suitableFor: value.suitableFor || [],
      maturityRange: value.maturityRange || []
    })) : [],
    isLoading,
    error
  };
}

/**
 * Hook for fetching compliance framework options
 * Provides governance and regulatory compliance requirements
 */
export function useComplianceFrameworks() {
  const { data: frameworks, isLoading, error } = useConfigSetting<Record<string, any>>('governance.compliance.frameworks');
  
  return {
    frameworks: frameworks || {},
    frameworkOptions: frameworks ? Object.entries(frameworks).map(([key, value]: [string, any]) => ({
      value: key,
      label: value.label,
      description: value.description,
      requirements: value.requirements || [],
      costImpact: value.costImpact || 1.0,
      auditFrequency: value.auditFrequency || 'annually'
    })) : [],
    isLoading,
    error
  };
}

/**
 * Hook for fetching performance template options
 * Provides SLA requirement templates for different service levels
 */
export function usePerformanceTemplates() {
  const { data: templates, isLoading, error } = useConfigSetting<Record<string, any>>('agent.performance.templates');
  
  return {
    templates: templates || {},
    templateOptions: templates ? Object.entries(templates).map(([key, value]: [string, any]) => ({
      value: key,
      label: value.label,
      responseTime: value.responseTime || { target: 5000, threshold: 10000 },
      availability: value.availability || { target: 99.0, threshold: 95.0 },
      accuracy: value.accuracy || { target: 90.0, threshold: 80.0 },
      throughput: value.throughput || { target: 100, threshold: 50 }
    })) : [],
    isLoading,
    error
  };
}

/**
 * Hook for fetching deployment target options
 * Provides cloud deployment configurations and resource requirements
 */
export function useDeploymentTargets() {
  const { data: targets, isLoading, error } = useConfigSetting<Record<string, any>>('agent.deployment.targets');
  
  return {
    targets: targets || {},
    targetOptions: targets ? Object.entries(targets).map(([key, value]: [string, any]) => ({
      value: key,
      label: value.label,
      environment: value.environment || 'dev',
      scalingPolicy: value.scalingPolicy || 'manual',
      resources: value.resources || { cpu: '0.5', memory: '512Mi', storage: '1Gi' },
      costTier: value.costTier || 'minimal'
    })) : [],
    isLoading,
    error
  };
}

/**
 * Hook for fetching category-specific integration recommendations
 * Provides context-aware integration suggestions based on agent type and maturity
 */
export function useCategoryIntegrationRecommendations(category?: string, maturityLevel?: string) {
  const scope = category && maturityLevel ? { category, maturityLevel } : {};
  const { data: recommendations, isLoading, error } = useQuery({
    queryKey: ['/api/config/category-integrations', { category, maturityLevel }],
    queryFn: () => {
      const url = new URL('/api/config/category-integrations', window.location.origin);
      if (category) url.searchParams.set('category', category);
      if (maturityLevel) url.searchParams.set('maturityLevel', maturityLevel);
      return fetch(url.toString(), {
        credentials: 'include'
      }).then(res => res.json());
    },
    enabled: !!(category && maturityLevel),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  
  return {
    recommendations: recommendations || [],
    isLoading,
    error
  };
}

/**
 * Hook for conditional enterprise feature activation
 * Determines which features are available based on maturity level and category
 */
export function useEnterpriseFeatureGating(maturityLevel?: string, category?: string) {
  const { maturityLevels } = useMaturityLevelDefinitions();
  const { categories } = useAgentCategoryOptions();
  
  const currentMaturity = maturityLevels[maturityLevel || 'L1'];
  const currentCategory = categories[category || 'Reactive'];
  
  const features = {
    // Basic features available to all
    basicConfiguration: true,
    basicMonitoring: true,
    
    // Maturity-level gated features
    advancedWorkflows: currentMaturity?.complexityScore >= 4, // L2+
    multiAgentCoordination: currentMaturity?.complexityScore >= 7, // L3+
    autonomousOperation: currentMaturity?.complexityScore >= 10, // L4
    
    // Category-specific features
    realTimeProcessing: category === 'Reactive',
    strategicPlanning: ['Deliberative', 'Hybrid'].includes(category || ''),
    adaptiveLearning: ['Learning', 'Hybrid', 'Autonomous'].includes(category || ''),
    teamCoordination: ['Collaborative', 'Autonomous'].includes(category || ''),
    
    // Combined feature gates
    enterpriseGovernance: currentMaturity?.complexityScore >= 4 && currentCategory?.maturityRange?.includes('L3'),
    complianceFrameworks: currentMaturity?.complexityScore >= 2, // L1+
    performanceMonitoring: currentMaturity?.complexityScore >= 2, // L1+
    memoryManagement: currentMaturity?.complexityScore >= 4, // L2+
    deploymentOrchestration: currentMaturity?.complexityScore >= 7 // L3+
  };
  
  return {
    features,
    maturityLevel: currentMaturity,
    category: currentCategory,
    isEnterpriseReady: currentMaturity?.complexityScore >= 4
  };
}
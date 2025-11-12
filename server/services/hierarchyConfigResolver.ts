import { db } from '../db';
import { experienceLayer, metaBrainLayer, agents } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { ConfigService } from '../configService';
import { LRUCache } from 'lru-cache';

interface ScopeIdentifiers {
  persona?: string;
  agentId?: number;
  workflowId?: number;
}

interface LayerDefinition {
  value: string;
  label: string;
  description: string;
  icon: string;
  order: number;
}

interface HierarchyLayerData {
  layer: string;
  definition: LayerDefinition;
  agents: any[];
  metadata: {
    totalAgents: number;
    activeAgents: number;
    configuredAgents: number;
    plannedAgents: number;
  };
}

interface AgentVisibilityRule {
  maxAgents?: number;
  includeAgents?: string[];
  excludeAgents?: string[];
  filterByKeywords?: string[];
}

interface UnifiedHierarchyConfig {
  timestamp: Date;
  scope: ScopeIdentifiers;
  layers: HierarchyLayerData[];
  experienceLayer: any;
  metaBrainLayer: any;
  agentVisibilityRules: Record<string, Record<string, AgentVisibilityRule>>;
  summary: {
    totalLayers: number;
    totalAgents: number;
    activeAgents: number;
    lastUpdated: Date;
  };
}

// Cache for hierarchy configurations
const hierarchyCache = new LRUCache<string, UnifiedHierarchyConfig>({
  max: 100,
  ttl: 5 * 60 * 1000, // 5 minutes TTL aligned with ConfigService
});

export class HierarchyConfigResolver {
  /**
   * Get unified hierarchy configuration for all 6 layers
   * Implements scope precedence: global → company → persona → agent
   */
  static async getUnifiedHierarchyConfig(
    scope: ScopeIdentifiers = {},
    asOf: Date = new Date()
  ): Promise<UnifiedHierarchyConfig> {
    // Create cache key
    const cacheKey = `hierarchy:${JSON.stringify(scope)}:${asOf.getTime()}`;
    
    const cached = hierarchyCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // 1. Get layer definitions from ConfigService with scope precedence
      const layerDefinitions = await ConfigService.getSetting<LayerDefinition[]>(
        'agent.layer.definitions',
        scope,
        asOf
      ) || this.getFallbackLayerDefinitions();

      // 2. Get Experience Layer data
      const experienceLayerData = await this.getExperienceLayerData();

      // 3. Get Meta Brain Layer data
      const metaBrainLayerData = await this.getMetaBrainLayerData();

      // 4. Get agents data by layer with persona filtering
      const agentsData = await this.getAgentsByLayers(scope.persona);

      // 5. Compose hierarchy layers
      const hierarchyLayers = await this.composeHierarchyLayers(
        layerDefinitions,
        agentsData,
        experienceLayerData,
        metaBrainLayerData,
        scope
      );

      // 6. Calculate summary statistics
      const summary = this.calculateSummary(hierarchyLayers);

      // 7. Get agent visibility rules from ConfigService (admin-configurable)
      const agentVisibilityRules = await ConfigService.getSetting<Record<string, Record<string, AgentVisibilityRule>>>(
        'agent.visibility.rules',
        scope,
        asOf
      ) || this.getDefaultAgentVisibilityRules();

      const config: UnifiedHierarchyConfig = {
        timestamp: new Date(),
        scope,
        layers: hierarchyLayers,
        experienceLayer: experienceLayerData,
        metaBrainLayer: metaBrainLayerData,
        agentVisibilityRules,
        summary
      };

      // Cache the result
      hierarchyCache.set(cacheKey, config);
      
      return config;
    } catch (error) {
      console.error('HierarchyConfigResolver.getUnifiedHierarchyConfig error:', error);
      throw error;
    }
  }

  /**
   * Get Experience Layer configuration data
   * Prioritizes company name from company_config JSON over column value
   */
  private static async getExperienceLayerData() {
    try {
      const result = await db
        .select()
        .from(experienceLayer)
        .limit(1);

      const experienceData = result[0];
      if (!experienceData) return null;

      // Parse company_config JSON to get the authoritative company name
      let companyName = experienceData.companyName; // fallback to column value
      
      if (experienceData.companyConfig) {
        try {
          const companyConfig = typeof experienceData.companyConfig === 'string' 
            ? JSON.parse(experienceData.companyConfig)
            : experienceData.companyConfig;
          
          // Use the company name from the Experience Layer Configuration
          if (companyConfig?.companyConfig?.name) {
            companyName = companyConfig.companyConfig.name;
          }
        } catch (parseError) {
          console.warn('Failed to parse company_config JSON, using fallback company name:', parseError);
        }
      }

      // Return experience data with corrected company name
      return {
        ...experienceData,
        companyName // Use the name from Experience Layer Configuration
      };
    } catch (error) {
      console.error('Error fetching experience layer data:', error);
      return null;
    }
  }

  /**
   * Get Meta Brain Layer configuration data
   */
  private static async getMetaBrainLayerData() {
    try {
      const result = await db
        .select()
        .from(metaBrainLayer)
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error fetching meta brain layer data:', error);
      return null;
    }
  }

  /**
   * Get agents organized by layer with persona filtering
   */
  private static async getAgentsByLayers(persona?: string) {
    try {
      const result = await db
        .select()
        .from(agents)
        .where(eq(agents.status, 'active'));

      // Filter agents based on persona access if provided
      const filteredAgents = persona && persona !== 'admin' 
        ? result.filter(agent => {
            // Admin can access all agents
            if (persona === 'admin') return true;
            
            // Check if agent has invokingPersonas configuration
            const agentConfig = agent.config as any;
            if (agentConfig?.invokingPersonas) {
              return agentConfig.invokingPersonas.includes(persona);
            }
            
            // Fallback: persona-based filtering
            return agent.persona === persona || 
                   agent.layer === 'Experience' || 
                   agent.layer === 'Meta Brain';
          })
        : result;

      // Group by layer
      const agentsByLayer = {
        Role: filteredAgents.filter(a => a.layer === 'Role'),
        Process: filteredAgents.filter(a => a.layer === 'Process'),
        System: filteredAgents.filter(a => a.layer === 'System'),
        Interface: filteredAgents.filter(a => a.layer === 'Interface')
      };

      return agentsByLayer;
    } catch (error) {
      console.error('Error fetching agents by layers:', error);
      return {
        Role: [],
        Process: [],
        System: [],
        Interface: []
      };
    }
  }

  /**
   * Compose hierarchy layers with all data sources
   */
  private static async composeHierarchyLayers(
    layerDefinitions: LayerDefinition[],
    agentsData: any,
    experienceLayerData: any,
    metaBrainLayerData: any,
    scope: ScopeIdentifiers
  ): Promise<HierarchyLayerData[]> {
    const layers: HierarchyLayerData[] = [];

    // Sort layer definitions by order
    const sortedDefinitions = layerDefinitions.sort((a, b) => a.order - b.order);

    for (const definition of sortedDefinitions) {
      let layerAgents: any[] = [];
      
      // Get agents for this layer
      if (definition.value === 'Experience') {
        layerAgents = experienceLayerData ? [{
          id: experienceLayerData.id,
          name: experienceLayerData.companyName,
          type: 'Insurance Company',
          layer: 'Experience',
          config: experienceLayerData,
          status: 'active',
          functionalStatus: 'active'
        }] : [];
      } else if (definition.value === 'Meta Brain') {
        layerAgents = metaBrainLayerData ? [{
          id: metaBrainLayerData.id,
          name: metaBrainLayerData.orchestratorName,
          type: 'Central Orchestrator',
          layer: 'Meta Brain',
          config: metaBrainLayerData,
          status: metaBrainLayerData.status || 'active',
          functionalStatus: 'active'
        }] : [];
      } else {
        layerAgents = agentsData[definition.value] || [];
      }

      // Calculate layer metadata
      const metadata = {
        totalAgents: layerAgents.length,
        activeAgents: layerAgents.filter(a => a.functionalStatus === 'active').length,
        configuredAgents: layerAgents.filter(a => a.functionalStatus === 'configured').length,
        plannedAgents: layerAgents.filter(a => a.functionalStatus === 'planned').length
      };

      layers.push({
        layer: definition.value,
        definition,
        agents: layerAgents,
        metadata
      });
    }

    return layers;
  }

  /**
   * Calculate summary statistics across all layers
   */
  private static calculateSummary(layers: HierarchyLayerData[]) {
    const totalAgents = layers.reduce((sum, layer) => sum + layer.metadata.totalAgents, 0);
    const activeAgents = layers.reduce((sum, layer) => sum + layer.metadata.activeAgents, 0);
    
    return {
      totalLayers: layers.length,
      totalAgents,
      activeAgents,
      lastUpdated: new Date()
    };
  }

  /**
   * Default agent visibility rules - admin can override via ConfigService
   */
  private static getDefaultAgentVisibilityRules(): Record<string, Record<string, AgentVisibilityRule>> {
    return {
      // Review Submissions command
      'review_submissions': {
        'process': { maxAgents: 2, filterByKeywords: ['submission', 'email', 'process', 'capture'] },
        'system': { maxAgents: 2, filterByKeywords: ['workflow', 'validation', 'enrichment'] },
        'interface': { maxAgents: 1, filterByKeywords: ['api', 'interface'] }
      },
      
      // Generate Quote command  
      'generate_quote': {
        'process': { maxAgents: 2, filterByKeywords: ['pricing', 'quote', 'commercial', 'underwriting'] },
        'system': { maxAgents: 2, filterByKeywords: ['tiv', 'calculation', 'pricing'] },
        'interface': { maxAgents: 1, filterByKeywords: ['pricing', 'quote'] }
      },
      
      // Claims commands
      'process_claims': {
        'process': { maxAgents: 2, filterByKeywords: ['claims', 'process', 'adjustment'] },
        'system': { maxAgents: 2, filterByKeywords: ['investigation', 'validation'] },
        'interface': { maxAgents: 1, filterByKeywords: ['claims', 'external'] }
      },
      
      // Default for any command not specifically configured
      'default': {
        'process': { maxAgents: 3 },
        'system': { maxAgents: 3 },
        'interface': { maxAgents: 2 }
      }
    };
  }

  /**
   * Fallback layer definitions if ConfigService doesn't have them
   */
  private static getFallbackLayerDefinitions(): LayerDefinition[] {
    return [
      {
        value: 'Experience',
        label: 'Experience Layer',
        description: 'User interaction and personalization layer',
        icon: 'Globe',
        order: 1
      },
      {
        value: 'Meta Brain',
        label: 'Meta Brain',
        description: 'Central intelligence coordination',
        icon: 'Bot',
        order: 2
      },
      {
        value: 'Role',
        label: 'Role (Cognitive Layer)',
        description: 'Persona-specific agents',
        icon: 'Bot',
        order: 3
      },
      {
        value: 'Process',
        label: 'Process Layer',
        description: 'Business process automation',
        icon: 'Cpu',
        order: 4
      },
      {
        value: 'System',
        label: 'System Layer',
        description: 'Core system capabilities',
        icon: 'Database',
        order: 5
      },
      {
        value: 'Interface',
        label: 'Interface Layer',
        description: 'External system interfaces',
        icon: 'Globe',
        order: 6
      }
    ];
  }

  /**
   * Invalidate hierarchy cache for specific scope
   */
  static invalidateCache(scope?: ScopeIdentifiers) {
    if (scope) {
      // Clear specific scope entries
      const scopeString = JSON.stringify(scope);
      hierarchyCache.forEach((value: UnifiedHierarchyConfig, key: string) => {
        if (key.includes(scopeString)) {
          hierarchyCache.delete(key);
        }
      });
    } else {
      // Clear all cache
      hierarchyCache.clear();
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  static getCacheStats() {
    return {
      size: hierarchyCache.size,
      maxSize: hierarchyCache.max,
      calculatedSize: hierarchyCache.calculatedSize
    };
  }

  /**
   * Cache invalidation hooks for automatic cache management
   */
  
  /**
   * Invalidate cache when agent data changes
   */
  static invalidateCacheOnAgentChange(agentData?: { persona?: string; layer?: string }) {
    if (agentData) {
      // Invalidate specific persona caches
      if (agentData.persona) {
        this.invalidateCache({ persona: agentData.persona });
      }
      
      // If layer-specific invalidation is needed in the future
      if (agentData.layer) {
        // For now, invalidate all since layers affect the entire hierarchy
        this.invalidateCache();
      }
    } else {
      // Clear all cache when agent data changes without specific scope
      this.invalidateCache();
    }
    
    console.log(`🔄 HierarchyConfigResolver cache invalidated due to agent change: ${JSON.stringify(agentData || 'all')}`);
  }

  /**
   * Invalidate cache when ConfigService data changes  
   */
  static invalidateCacheOnConfigChange(configKey?: string, scope?: ScopeIdentifiers) {
    if (configKey?.includes('agent.layer.definitions') || 
        configKey?.includes('hierarchy') ||
        configKey?.includes('agent-visibility')) {
      // Config changes that affect hierarchy should invalidate all or scope-specific cache
      if (scope) {
        this.invalidateCache(scope);
      } else {
        this.invalidateCache();
      }
      
      console.log(`🔄 HierarchyConfigResolver cache invalidated due to config change: ${configKey}, scope: ${JSON.stringify(scope || 'all')}`);
    }
  }

  /**
   * Invalidate cache when experience layer or meta brain data changes
   */
  static invalidateCacheOnCoreLayerChange(layerType: 'experience' | 'metaBrain' | 'all' = 'all') {
    // Core layer changes affect all hierarchy configurations
    this.invalidateCache();
    
    console.log(`🔄 HierarchyConfigResolver cache invalidated due to ${layerType} layer change`);
  }

  /**
   * Batch invalidation for multiple changes (more efficient)
   */
  static batchInvalidateCache(changes: Array<{
    type: 'agent' | 'config' | 'coreLayer';
    scope?: ScopeIdentifiers;
    metadata?: any;
  }>) {
    // For batch operations, just clear all cache once to be safe and efficient
    this.invalidateCache();
    
    console.log(`🔄 HierarchyConfigResolver cache batch invalidated for ${changes.length} changes: ${changes.map(c => c.type).join(', ')}`);
  }

  /**
   * Smart cache warming - pre-populate cache for common queries
   */
  static async warmCache(commonPersonas: string[] = ['admin', 'rachel', 'john']) {
    console.log('🔥 Warming HierarchyConfigResolver cache for common personas...');
    
    try {
      const warmingPromises = commonPersonas.map(async (persona) => {
        try {
          await this.getUnifiedHierarchyConfig({ persona });
          console.log(`✅ Cache warmed for persona: ${persona}`);
        } catch (error) {
          console.warn(`⚠️ Failed to warm cache for persona ${persona}:`, error);
        }
      });
      
      await Promise.allSettled(warmingPromises);
      console.log('🔥 Cache warming completed');
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
    }
  }
}
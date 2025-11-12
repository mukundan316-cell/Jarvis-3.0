import { ConfigService } from './configService';

/**
 * Seed Agent CRUD Configuration Values
 * Converts hardcoded agent elements to ConfigService-driven configurations
 * Following replit.md NO HARD-CODING principle
 */

export async function seedAgentCRUDConfigurations(userId: string) {
  console.log('🤖 Seeding Agent CRUD configurations using ConfigService...');
  
  try {
    // 1. Agent Layer Definitions - replaces hardcoded LAYER_OPTIONS
    const agentLayerDefinitions = [
      { 
        value: 'Experience', 
        label: 'Experience Layer', 
        description: 'User interaction and personalization',
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
        description: 'System integration and data access',
        icon: 'Database',
        order: 5
      },
      { 
        value: 'Interface', 
        label: 'Interface Layer', 
        description: 'External system communication',
        icon: 'Globe',
        order: 6
      }
    ];

    await ConfigService.setSetting(
      'agent.layer.definitions',
      agentLayerDefinitions,
      {}, // Global scope
      new Date(),
      undefined,
      userId
    );

    // 2. Agent Type Definitions - replaces hardcoded AGENT_TYPE_OPTIONS
    const agentTypeDefinitions = [
      { 
        value: 'Role Agent', 
        label: 'Role Agent', 
        description: 'Persona-based processing agent',
        layer: 'Role'
      },
      { 
        value: 'Process Agent', 
        label: 'Process Agent', 
        description: 'Workflow automation agent',
        layer: 'Process'
      },
      { 
        value: 'System Agent', 
        label: 'System Agent', 
        description: 'System integration agent',
        layer: 'System'
      },
      { 
        value: 'Interface Agent', 
        label: 'Interface Agent', 
        description: 'External communication agent',
        layer: 'Interface'
      }
    ];

    await ConfigService.setSetting(
      'agent.type.definitions',
      agentTypeDefinitions,
      {}, // Global scope
      new Date(),
      undefined,
      userId
    );

    // 3. Agent Types by Layer Mapping - replaces hardcoded typesByLayer
    const typesByLayerMapping = {
      Role: ['Assistant Underwriter', 'IT Support Specialist', 'Sales Agent', 'Claims Adjuster', 'Risk Analyst'],
      Process: ['Risk Assessment', 'Claims Processing', 'Policy Management', 'Document Processing', 'Workflow Automation'],
      System: ['Data Analysis', 'Integration Engine', 'Security Monitor', 'Database Manager', 'Analytics Engine'],
      Interface: ['Voice Interface', 'Email Interface', 'Dashboard Interface', 'API Interface', 'Mobile Interface']
    };

    await ConfigService.setSetting(
      'agent.types.by-layer',
      typesByLayerMapping,
      {}, // Global scope
      new Date(),
      undefined,
      userId
    );

    // 4. Available Agent Capabilities - replaces hardcoded CAPABILITY_OPTIONS
    const agentCapabilities = [
      { name: 'Claims Processing', category: 'business', riskLevel: 'medium' },
      { name: 'Risk Assessment', category: 'analysis', riskLevel: 'high' },
      { name: 'Policy Management', category: 'business', riskLevel: 'medium' },
      { name: 'Customer Service', category: 'interface', riskLevel: 'low' },
      { name: 'Data Analysis', category: 'analysis', riskLevel: 'medium' },
      { name: 'Document Processing', category: 'processing', riskLevel: 'medium' },
      { name: 'Workflow Orchestration', category: 'orchestration', riskLevel: 'high' },
      { name: 'System Integration', category: 'integration', riskLevel: 'high' },
      { name: 'Security Monitoring', category: 'security', riskLevel: 'high' },
      { name: 'Performance Optimization', category: 'system', riskLevel: 'medium' },
      { name: 'Error Handling', category: 'system', riskLevel: 'medium' },
      { name: 'Notification Management', category: 'interface', riskLevel: 'low' }
    ];

    await ConfigService.setSetting(
      'agent.capabilities.available',
      agentCapabilities,
      {}, // Global scope
      new Date(),
      undefined,
      userId
    );

    // 5. Persona Options - replaces hardcoded personaOptions
    const personaDefinitions = [
      { value: 'admin', label: 'Admin', description: 'System Administrator' },
      { value: 'rachel', label: 'Rachel Thompson', description: 'Assistant Underwriter' },
      { value: 'john', label: 'John Stevens', description: 'IT Support Specialist' },
      { value: 'sarah', label: 'Sarah Wilson', description: 'Broker Agent' },
      { value: 'universal', label: 'Universal', description: 'Cross-persona agent' }
    ];

    await ConfigService.setSetting(
      'agent.personas.available',
      personaDefinitions,
      {}, // Global scope
      new Date(),
      undefined,
      userId
    );

    // 6. Agent Status Options
    const agentStatusOptions = [
      { value: 'active', label: 'Active', color: 'green', description: 'Agent is operational' },
      { value: 'inactive', label: 'Inactive', color: 'red', description: 'Agent is disabled' },
      { value: 'maintenance', label: 'Maintenance', color: 'yellow', description: 'Agent under maintenance' }
    ];

    await ConfigService.setSetting(
      'agent.status.options',
      agentStatusOptions,
      {}, // Global scope
      new Date(),
      undefined,
      userId
    );

    // 7. Agent Validation Rules by Type
    const agentValidationRules = {
      'Role Agent': {
        required: ['name', 'persona', 'specialization'],
        capabilities: { min: 1, max: 5 },
        description: { minLength: 20, maxLength: 500 }
      },
      'Process Agent': {
        required: ['name', 'layer', 'description'],
        capabilities: { min: 2, max: 8 },
        description: { minLength: 30, maxLength: 1000 }
      },
      'System Agent': {
        required: ['name', 'layer', 'specialization'],
        capabilities: { min: 1, max: 6 },
        integrations: { min: 1 }
      },
      'Interface Agent': {
        required: ['name', 'layer', 'description'],
        capabilities: { min: 1, max: 4 },
        description: { minLength: 20, maxLength: 300 }
      }
    };

    await ConfigService.setSetting(
      'agent.validation.rules',
      agentValidationRules,
      {}, // Global scope
      new Date(),
      undefined,
      userId
    );

    console.log('✅ Agent CRUD configurations seeded successfully');

    return {
      success: true,
      configurations: [
        'agent.layer.definitions',
        'agent.type.definitions', 
        'agent.types.by-layer',
        'agent.capabilities.available',
        'agent.personas.available',
        'agent.status.options',
        'agent.validation.rules'
      ],
      message: 'All agent CRUD configurations loaded into ConfigService'
    };

  } catch (error) {
    console.error('❌ Error seeding agent CRUD configurations:', error);
    throw error;
  }
}

/**
 * Get available agent types for a specific layer
 * Replaces hardcoded typesByLayer logic
 */
export async function getAgentTypesForLayer(layer: string): Promise<string[]> {
  try {
    const typesByLayer = await ConfigService.getSetting('agent.types.by-layer');
    return typesByLayer?.[layer] || [];
  } catch (error) {
    console.error(`Error fetching agent types for layer ${layer}:`, error);
    return [];
  }
}

/**
 * Get validation rules for a specific agent type
 * Enables dynamic form validation
 */
export async function getAgentValidationRules(agentType: string): Promise<any> {
  try {
    const validationRules = await ConfigService.getSetting('agent.validation.rules');
    return validationRules?.[agentType] || {};
  } catch (error) {
    console.error(`Error fetching validation rules for agent type ${agentType}:`, error);
    return {};
  }
}
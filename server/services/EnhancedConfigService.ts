import { ConfigService } from '../configService';
import { db } from '../db';
import { 
  formFieldDefinitions, 
  formTemplates,
  uiComponentRegistry,
  type FormFieldDefinition,
  type FormTemplate,
  type UiComponentRegistry,
  type InsertFormFieldDefinition,
  type InsertFormTemplate,
  type InsertUiComponentRegistry
} from '@shared/schema';
import { eq, and, isNull, desc, or } from 'drizzle-orm';
import { LRUCache } from 'lru-cache';

/**
 * Enhanced ConfigService extending existing ConfigService
 * Adds metadata-driven UI support while maintaining backward compatibility
 * Following replit.md NO HARD-CODING principle
 */

interface ScopeIdentifiers {
  persona?: string;
  agentId?: number;
  workflowId?: number;
}

interface FormScope extends ScopeIdentifiers {
  formType?: string;
  maturityLevel?: string;
}

interface LegoBlockDefinition {
  componentName: string;
  componentType: 'atomic' | 'molecular' | 'organism';
  props: Record<string, any>;
  dependencies?: string[];
}

// Enhanced cache for form definitions
const formCache = new LRUCache<string, any>({
  max: 500,
  ttl: 5 * 60 * 1000, // 5 minutes TTL - align with ConfigService cache
});

export class EnhancedConfigService extends ConfigService {
  
  /**
   * Get form field definitions for metadata-driven UI
   * @param formType Type of form (agent_create, agent_edit, governance, etc.)
   * @param scope Scope identifiers including persona and maturity level
   * @returns Array of form field definitions
   */
  static async getFormFieldDefinitions(
    formType: string,
    scope: FormScope = {}
  ): Promise<FormFieldDefinition[]> {
    const cacheKey = `form_fields:${formType}:${JSON.stringify(scope)}`;
    
    const cached = formCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      // Build conditions for query
      const conditions = [
        eq(formFieldDefinitions.formType, formType),
        eq(formFieldDefinitions.isActive, true)
      ];

      // Add persona filter if specified
      if (scope.persona) {
        conditions.push(
          or(
            eq(formFieldDefinitions.persona, scope.persona),
            isNull(formFieldDefinitions.persona)
          )!
        );
      }

      // Add maturity level filter if specified
      if (scope.maturityLevel) {
        conditions.push(
          or(
            eq(formFieldDefinitions.maturityLevel, scope.maturityLevel),
            isNull(formFieldDefinitions.maturityLevel)
          )!
        );
      }

      const fields = await db
        .select()
        .from(formFieldDefinitions)
        .where(and(...conditions))
        .orderBy(formFieldDefinitions.order, formFieldDefinitions.id);

      formCache.set(cacheKey, fields);
      return fields;
    } catch (error) {
      console.error('Error fetching form field definitions:', error);
      // Return fallback hardcoded values for graceful degradation
      return this.getHardcodedFormFields(formType, scope);
    }
  }

  /**
   * Get form template configuration
   * @param templateName Name of the template
   * @param scope Scope identifiers
   * @returns Form template configuration or null
   */
  static async getFormTemplate(
    templateName: string,
    scope: FormScope = {}
  ): Promise<FormTemplate | null> {
    const cacheKey = `form_template:${templateName}:${JSON.stringify(scope)}`;
    
    const cached = formCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const conditions = [
        eq(formTemplates.templateName, templateName),
        eq(formTemplates.isActive, true)
      ];

      // Add persona filter if specified
      if (scope.persona) {
        conditions.push(
          or(
            eq(formTemplates.persona, scope.persona),
            isNull(formTemplates.persona)
          )!
        );
      }

      const template = await db
        .select()
        .from(formTemplates)
        .where(and(...conditions))
        .orderBy(desc(formTemplates.isDefault))
        .limit(1);

      const result = template[0] || null;
      formCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching form template:', error);
      return null;
    }
  }

  /**
   * Get UI component registry for lego blocks
   * @param componentType Type of component (atomic, molecular, organism)
   * @param category Component category (form, display, navigation, governance)
   * @param scope Scope identifiers
   * @returns Array of UI component definitions
   */
  static async getUIComponents(
    componentType?: string,
    category?: string,
    scope: FormScope = {}
  ): Promise<UiComponentRegistry[]> {
    const cacheKey = `ui_components:${componentType}:${category}:${JSON.stringify(scope)}`;
    
    const cached = formCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const conditions = [eq(uiComponentRegistry.isActive, true)];

      if (componentType) {
        conditions.push(eq(uiComponentRegistry.componentType, componentType as 'atomic' | 'molecular' | 'organism'));
      }

      if (category) {
        conditions.push(eq(uiComponentRegistry.category, category));
      }

      const components = await db
        .select()
        .from(uiComponentRegistry)
        .where(and(...conditions))
        .orderBy(uiComponentRegistry.componentName);

      formCache.set(cacheKey, components);
      return components;
    } catch (error) {
      console.error('Error fetching UI components:', error);
      return [];
    }
  }

  /**
   * Enhanced getSetting method with fallback to hardcoded values during migration
   * Maintains backward compatibility while enabling gradual migration
   */
  static async getSetting<T = any>(
    key: string, 
    scope: ScopeIdentifiers = {}, 
    asOf: Date = new Date()
  ): Promise<T | null> {
    try {
      // First, try to get from database (existing ConfigService flow)
      const result = await super.getSetting<T>(key, scope, asOf);
      
      if (result !== null) {
        return result;
      }

      // Fallback: return hardcoded values for graceful degradation during migration
      return this.getHardcodedFallback<T>(key, scope);
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      
      // Backward compatibility: return hardcoded if database fails
      return this.getHardcodedFallback<T>(key, scope);
    }
  }

  /**
   * Hardcoded fallback values for graceful degradation during migration
   * This method will shrink over time as we migrate values to the database
   */
  private static getHardcodedFallback<T>(key: string, scope: ScopeIdentifiers = {}): T | null {
    const hardcodedMappings = new Map<string, () => any>([
      ['agent.layer.definitions', () => this.getHardcodedLayers()],
      ['agent.type.definitions', () => this.getHardcodedAgentTypes()],
      ['agent.capabilities.available', () => this.getHardcodedCapabilities()],
      ['personas.definitions', () => this.getHardcodedPersonas()],
      ['agent.status.options', () => this.getHardcodedStatusOptions()],
      ['form.agent_create.config', () => this.getHardcodedAgentCreateConfig()],
    ]);

    const getter = hardcodedMappings.get(key);
    return getter ? getter() as T : null;
  }

  /**
   * Hardcoded form field definitions for agent creation (temporary fallback)
   */
  private static getHardcodedFormFields(formType: string, scope: FormScope): FormFieldDefinition[] {
    if (formType === 'agent_create') {
      return [
        {
          id: 1,
          formType: 'agent_create',
          fieldKey: 'name',
          fieldType: 'text',
          label: 'Agent Name',
          description: 'Enter a descriptive name for your agent',
          placeholder: 'Enter agent name',
          validationRules: { required: true, minLength: 1, maxLength: 100 },
          options: null,
          dependencies: null,
          uiProps: { className: 'w-full' },
          order: 1,
          isRequired: true,
          isActive: true,
          persona: null,
          maturityLevel: null,
          scope: 'global',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          formType: 'agent_create',
          fieldKey: 'layer',
          fieldType: 'select',
          label: 'Agent Layer',
          description: 'Select the appropriate layer for this agent',
          placeholder: 'Select layer',
          validationRules: { required: true },
          options: [
            { value: 'Experience', label: 'Experience Layer', description: 'User interaction and branding' },
            { value: 'Meta Brain', label: 'Meta Brain', description: 'Central orchestration' },
            { value: 'Role', label: 'Role Layer', description: 'Persona-specific agents' },
            { value: 'Process', label: 'Process Layer', description: 'Multi-step workflows' },
            { value: 'System', label: 'System Layer', description: 'Core processing' },
            { value: 'Interface', label: 'Interface Layer', description: 'External handlers' }
          ],
          dependencies: null,
          uiProps: { className: 'w-full' },
          order: 2,
          isRequired: true,
          isActive: true,
          persona: null,
          maturityLevel: null,
          scope: 'global',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ] as FormFieldDefinition[];
    }

    return [];
  }

  // Hardcoded values that match current implementation (temporary during migration)
  private static getHardcodedLayers() {
    return [
      { value: 'Experience', label: 'Experience Layer', description: 'User interaction and branding', icon: 'Palette', order: 1 },
      { value: 'Meta Brain', label: 'Meta Brain', description: 'Central orchestration', icon: 'Brain', order: 2 },
      { value: 'Role', label: 'Role Layer', description: 'Persona-specific agents', icon: 'Users', order: 3 },
      { value: 'Process', label: 'Process Layer', description: 'Multi-step workflows', icon: 'Workflow', order: 4 },
      { value: 'System', label: 'System Layer', description: 'Core processing', icon: 'Cog', order: 5 },
      { value: 'Interface', label: 'Interface Layer', description: 'External handlers', icon: 'Layers', order: 6 }
    ];
  }

  private static getHardcodedAgentTypes() {
    return {
      'Role': ['Assistant Underwriter', 'IT Support Specialist', 'Claims Adjuster', 'System Administrator'],
      'Process': ['Risk Assessment', 'Claims Processing', 'Policy Generation', 'Commercial Property Analysis'],
      'System': ['Document Processor', 'Security Monitor', 'Data Validator', 'Email Parser'],
      'Interface': ['Email Handler', 'Voice Assistant', 'API Gateway', 'Dashboard Interface']
    };
  }

  private static getHardcodedCapabilities() {
    return [
      'Claims Processing',
      'Risk Assessment', 
      'Policy Management',
      'Customer Service',
      'Document Analysis',
      'Fraud Detection',
      'Compliance Checking',
      'Data Entry',
      'Report Generation',
      'Email Management',
      'Voice Interaction',
      'System Monitoring',
      'Commercial Property',
      'Underwriting',
      'IT Support'
    ];
  }

  private static getHardcodedPersonas() {
    return {
      admin: { name: 'Jarvis Admin', role: 'admin', capabilities: ['system_management', 'agent_creation', 'config_management'] },
      rachel: { name: 'Rachel Thompson', title: 'AUW', role: 'underwriter', capabilities: ['commercial_property', 'risk_assessment', 'submission_management'] },
      john: { name: 'John Stevens', title: 'IT Support', role: 'it_support', capabilities: ['system_monitoring', 'incident_management', 'technical_operations'] },
      broker: { name: 'Broker', role: 'broker', capabilities: ['client_management', 'policy_quotes', 'submission_creation'] }
    };
  }

  private static getHardcodedStatusOptions() {
    return [
      { value: 'active', label: 'Active', color: 'green', description: 'Agent is running and available' },
      { value: 'inactive', label: 'Inactive', color: 'gray', description: 'Agent is stopped' },
      { value: 'configured', label: 'Configured', color: 'blue', description: 'Agent is configured but not running' },
      { value: 'error', label: 'Error', color: 'red', description: 'Agent has encountered an error' }
    ];
  }

  private static getHardcodedAgentCreateConfig() {
    return {
      layout: 'modal',
      showProgress: false,
      enableTabs: true,
      theme: 'dark',
      submitText: 'Create Agent',
      cancelText: 'Cancel'
    };
  }

  /**
   * Seed form field definitions (for initial setup)
   */
  static async seedFormFieldDefinitions(fields: InsertFormFieldDefinition[]): Promise<void> {
    try {
      await db.insert(formFieldDefinitions).values(fields);
      formCache.clear(); // Clear cache after seeding
    } catch (error) {
      console.error('Error seeding form field definitions:', error);
      throw error;
    }
  }

  /**
   * Seed form templates (for initial setup)
   */
  static async seedFormTemplates(templates: InsertFormTemplate[]): Promise<void> {
    try {
      await db.insert(formTemplates).values(templates);
      formCache.clear(); // Clear cache after seeding
    } catch (error) {
      console.error('Error seeding form templates:', error);
      throw error;
    }
  }

  /**
   * Clear form-related caches
   */
  static clearFormCache(): void {
    formCache.clear();
  }
}

// Export the enhanced service as the default ConfigService for gradual migration
export { EnhancedConfigService as ConfigService } from './EnhancedConfigService';
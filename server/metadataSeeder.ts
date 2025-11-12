import { db } from './db';
import { 
  formFieldDefinitions,
  formTemplates,
  uiComponentRegistry,
  type InsertFormFieldDefinition,
  type InsertFormTemplate,
  type InsertUiComponentRegistry
} from '@shared/schema';

/**
 * Metadata seeding service for zero-risk migration from hardcoded values
 * Seeds the new metadata-driven tables with existing JARVIS 3.0 configurations
 * Ensures backward compatibility and smooth migration path
 */

export class MetadataSeeder {
  
  /**
   * Seed form field definitions for agent creation (existing CreateNewAgentModal logic)
   */
  static async seedAgentCreateFormFields(): Promise<void> {
    const agentCreateFields: InsertFormFieldDefinition[] = [
      {
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
        persona: undefined,
        maturityLevel: undefined,
        scope: 'global',
      },
      {
        formType: 'agent_create',
        fieldKey: 'layer',
        fieldType: 'select',
        label: 'Agent Layer',
        description: 'Select the appropriate layer for this agent in the 6-layer JARVIS architecture',
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
        persona: undefined,
        maturityLevel: undefined,
        scope: 'global',
      },
      {
        formType: 'agent_create',
        fieldKey: 'type',
        fieldType: 'select',
        label: 'Agent Type',
        description: 'Choose the specific type of agent based on the selected layer',
        placeholder: 'Select agent type',
        validationRules: { required: true },
        options: [], // Dynamic based on layer selection
        dependencies: { dependsOn: 'layer', mapping: {
          'Role': ['Assistant Underwriter', 'IT Support Specialist', 'Claims Adjuster', 'System Administrator'],
          'Process': ['Risk Assessment', 'Claims Processing', 'Policy Generation', 'Commercial Property Analysis'],
          'System': ['Document Processor', 'Security Monitor', 'Data Validator', 'Email Parser'],
          'Interface': ['Email Handler', 'Voice Assistant', 'API Gateway', 'Dashboard Interface']
        }},
        uiProps: { className: 'w-full' },
        order: 3,
        isRequired: true,
        isActive: true,
        persona: undefined,
        maturityLevel: undefined,
        scope: 'global',
      },
      {
        formType: 'agent_create',
        fieldKey: 'status',
        fieldType: 'select',
        label: 'Initial Status',
        description: 'Set the initial operational status for this agent',
        placeholder: 'Select status',
        validationRules: { required: true },
        options: [
          { value: 'active', label: 'Active', description: 'Agent is running and available' },
          { value: 'inactive', label: 'Inactive', description: 'Agent is stopped' },
          { value: 'configured', label: 'Configured', description: 'Agent is configured but not running' }
        ],
        dependencies: null,
        uiProps: { className: 'w-full', defaultValue: 'active' },
        order: 4,
        isRequired: true,
        isActive: true,
        persona: undefined,
        maturityLevel: undefined,
        scope: 'global',
      },
      {
        formType: 'agent_create',
        fieldKey: 'description',
        fieldType: 'textarea',
        label: 'Description',
        description: 'Provide a detailed description of what this agent does',
        placeholder: 'Describe the agent\'s purpose and capabilities',
        validationRules: { required: false, maxLength: 1000 },
        options: null,
        dependencies: null,
        uiProps: { className: 'w-full', rows: 3 },
        order: 5,
        isRequired: false,
        isActive: true,
        persona: undefined,
        maturityLevel: undefined,
        scope: 'global',
      },
      {
        formType: 'agent_create',
        fieldKey: 'specialization',
        fieldType: 'text',
        label: 'Specialization',
        description: 'Specific area of expertise or focus for this agent',
        placeholder: 'e.g., Commercial Property, Claims Processing',
        validationRules: { required: false, maxLength: 200 },
        options: null,
        dependencies: null,
        uiProps: { className: 'w-full' },
        order: 6,
        isRequired: false,
        isActive: true,
        persona: undefined,
        maturityLevel: undefined,
        scope: 'global',
      },
      {
        formType: 'agent_create',
        fieldKey: 'persona',
        fieldType: 'select',
        label: 'Target Persona',
        description: 'Which persona this agent is primarily designed for',
        placeholder: 'Select persona',
        validationRules: { required: false },
        options: [
          { value: 'universal', label: 'Universal', description: 'Available to all personas' },
          { value: 'admin', label: 'Admin', description: 'System administration' },
          { value: 'rachel', label: 'Rachel (AUW)', description: 'Assistant Underwriter workflows' },
          { value: 'john', label: 'John (IT)', description: 'IT Support workflows' },
          { value: 'broker', label: 'Broker', description: 'Insurance broker workflows' }
        ],
        dependencies: null,
        uiProps: { className: 'w-full', defaultValue: 'universal' },
        order: 7,
        isRequired: false,
        isActive: true,
        persona: undefined,
        maturityLevel: undefined,
        scope: 'global',
      },
      {
        formType: 'agent_create',
        fieldKey: 'capabilities',
        fieldType: 'multiselect',
        label: 'Capabilities',
        description: 'Select the capabilities this agent should have',
        placeholder: 'Add capability',
        validationRules: { required: false },
        options: [
          { value: 'Claims Processing', label: 'Claims Processing' },
          { value: 'Risk Assessment', label: 'Risk Assessment' },
          { value: 'Policy Management', label: 'Policy Management' },
          { value: 'Customer Service', label: 'Customer Service' },
          { value: 'Document Analysis', label: 'Document Analysis' },
          { value: 'Fraud Detection', label: 'Fraud Detection' },
          { value: 'Compliance Checking', label: 'Compliance Checking' },
          { value: 'Data Entry', label: 'Data Entry' },
          { value: 'Report Generation', label: 'Report Generation' },
          { value: 'Email Management', label: 'Email Management' },
          { value: 'Voice Interaction', label: 'Voice Interaction' },
          { value: 'System Monitoring', label: 'System Monitoring' },
          { value: 'Commercial Property', label: 'Commercial Property' },
          { value: 'Underwriting', label: 'Underwriting' },
          { value: 'IT Support', label: 'IT Support' }
        ],
        dependencies: null,
        uiProps: { className: 'w-full' },
        order: 8,
        isRequired: false,
        isActive: true,
        persona: undefined,
        maturityLevel: undefined,
        scope: 'global',
      },
      {
        formType: 'agent_create',
        fieldKey: 'integrations',
        fieldType: 'multiselect',
        label: 'Integrations',
        description: 'External systems or services this agent will integrate with',
        placeholder: 'Add integration',
        validationRules: { required: false },
        options: [
          { value: 'email', label: 'Email System' },
          { value: 'voice', label: 'Voice Assistant' },
          { value: 'database', label: 'Database' },
          { value: 'api', label: 'External APIs' },
          { value: 'webhook', label: 'Webhooks' },
          { value: 'file-system', label: 'File System' },
          { value: 'notification', label: 'Notification Service' }
        ],
        dependencies: null,
        uiProps: { className: 'w-full' },
        order: 9,
        isRequired: false,
        isActive: true,
        persona: undefined,
        maturityLevel: undefined,
        scope: 'global',
      }
    ];

    await db.insert(formFieldDefinitions).values(agentCreateFields);
    console.log(`✅ Seeded ${agentCreateFields.length} agent creation form fields`);
  }

  /**
   * Seed form field definitions for agent editing (EditAgentModal logic)
   */
  static async seedAgentEditFormFields(): Promise<void> {
    // Agent edit form has similar fields to create but with different validation
    const agentEditFields: InsertFormFieldDefinition[] = [
      {
        formType: 'agent_edit',
        fieldKey: 'name',
        fieldType: 'text',
        label: 'Agent Name',
        description: 'Update the agent name',
        placeholder: 'Enter agent name',
        validationRules: { required: true, minLength: 1, maxLength: 100 },
        options: null,
        dependencies: null,
        uiProps: { className: 'w-full' },
        order: 1,
        isRequired: true,
        isActive: true,
        persona: undefined,
        maturityLevel: undefined,
        scope: 'global',
      },
      {
        formType: 'agent_edit',
        fieldKey: 'status',
        fieldType: 'select',
        label: 'Status',
        description: 'Update the agent operational status',
        placeholder: 'Select status',
        validationRules: { required: true },
        options: [
          { value: 'active', label: 'Active', description: 'Agent is running and available' },
          { value: 'inactive', label: 'Inactive', description: 'Agent is stopped' },
          { value: 'configured', label: 'Configured', description: 'Agent is configured but not running' },
          { value: 'error', label: 'Error', description: 'Agent has encountered an error' }
        ],
        dependencies: null,
        uiProps: { className: 'w-full' },
        order: 2,
        isRequired: true,
        isActive: true,
        persona: undefined,
        maturityLevel: undefined,
        scope: 'global',
      },
      {
        formType: 'agent_edit',
        fieldKey: 'description',
        fieldType: 'textarea',
        label: 'Description',
        description: 'Update the agent description',
        placeholder: 'Describe the agent\'s purpose and capabilities',
        validationRules: { required: false, maxLength: 1000 },
        options: null,
        dependencies: null,
        uiProps: { className: 'w-full', rows: 3 },
        order: 3,
        isRequired: false,
        isActive: true,
        persona: undefined,
        maturityLevel: undefined,
        scope: 'global',
      }
    ];

    await db.insert(formFieldDefinitions).values(agentEditFields);
    console.log(`✅ Seeded ${agentEditFields.length} agent editing form fields`);
  }

  /**
   * Seed form templates for common use cases
   */
  static async seedFormTemplates(): Promise<void> {
    const templates: InsertFormTemplate[] = [
      {
        templateName: 'agent-creation-default',
        formType: 'agent_create',
        description: 'Default template for creating new agents in JARVIS 3.0',
        configuration: {
          layout: 'modal',
          showProgress: false,
          enableTabs: false,
          theme: 'dark',
          submitText: 'Create Agent',
          cancelText: 'Cancel',
          glassmorphism: true,
          validation: 'realtime'
        },
        persona: undefined,
        maturityLevel: undefined,
        isDefault: true,
        isActive: true,
      },
      {
        templateName: 'agent-editing-default',
        formType: 'agent_edit',
        description: 'Default template for editing existing agents',
        configuration: {
          layout: 'modal',
          showProgress: false,
          enableTabs: false,
          theme: 'dark',
          submitText: 'Update Agent',
          cancelText: 'Cancel',
          glassmorphism: true,
          validation: 'realtime'
        },
        persona: undefined,
        maturityLevel: undefined,
        isDefault: true,
        isActive: true,
      },
      {
        templateName: 'rachel-agent-creation',
        formType: 'agent_create',
        description: 'Optimized agent creation template for Rachel (AUW)',
        configuration: {
          layout: 'modal',
          showProgress: true,
          enableTabs: true,
          theme: 'dark',
          submitText: 'Create Agent',
          cancelText: 'Cancel',
          glassmorphism: true,
          validation: 'realtime',
          prefilters: {
            layer: ['Role', 'Process'],
            capabilities: ['Risk Assessment', 'Underwriting', 'Commercial Property']
          }
        },
        persona: 'rachel',
        maturityLevel: undefined,
        isDefault: false,
        isActive: true,
      },
      {
        templateName: 'john-agent-creation',
        formType: 'agent_create',
        description: 'Optimized agent creation template for John (IT Support)',
        configuration: {
          layout: 'modal',
          showProgress: true,
          enableTabs: true,
          theme: 'dark',
          submitText: 'Create Agent',
          cancelText: 'Cancel',
          glassmorphism: true,
          validation: 'realtime',
          prefilters: {
            layer: ['System', 'Interface'],
            capabilities: ['System Monitoring', 'IT Support', 'Security']
          }
        },
        persona: 'john',
        maturityLevel: undefined,
        isDefault: false,
        isActive: true,
      }
    ];

    await db.insert(formTemplates).values(templates);
    console.log(`✅ Seeded ${templates.length} form templates`);
  }

  /**
   * Seed UI component registry for reusable lego blocks
   */
  static async seedUIComponentRegistry(): Promise<void> {
    const components: InsertUiComponentRegistry[] = [
      {
        componentName: 'UniversalMetadataForm',
        componentType: 'organism',
        category: 'form',
        description: 'Core metadata-driven form component for JARVIS 3.0',
        props: {
          formType: 'string',
          persona: 'string?',
          maturityLevel: 'string?',
          onSubmit: 'function',
          defaultValues: 'object?'
        },
        defaultProps: {
          layout: 'vertical',
          submitText: 'Submit',
          cancelText: 'Cancel'
        },
        configuration: {
          enableCaching: true,
          fallbackStrategy: 'hybrid',
          glassmorphism: true
        },
        dependencies: [],
        personaCompatibility: ['admin', 'rachel', 'john', 'broker'],
        maturityLevelSupport: ['L0', 'L1', 'L2', 'L3', 'L4'],
        version: '1.0.0',
        isActive: true,
      },
      {
        componentName: 'UniversalFormField',
        componentType: 'atomic',
        category: 'form',
        description: 'Atomic form field component with dynamic type support',
        props: {
          field: 'FormFieldDefinition',
          form: 'UseFormReturn',
          disabled: 'boolean?'
        },
        defaultProps: {
          disabled: false
        },
        configuration: {
          supportedFieldTypes: [
            'text', 'textarea', 'select', 'multiselect', 
            'toggle', 'checkbox', 'number', 'email', 'url'
          ]
        },
        dependencies: ['UniversalMetadataForm'],
        personaCompatibility: ['admin', 'rachel', 'john', 'broker'],
        maturityLevelSupport: ['L0', 'L1', 'L2', 'L3', 'L4'],
        version: '1.0.0',
        isActive: true,
      },
      {
        componentName: 'withMetadataConfig',
        componentType: 'molecular',
        category: 'wrapper',
        description: 'HOC for wrapping existing components with metadata capabilities',
        props: {
          WrappedComponent: 'ComponentType',
          metadataConfig: 'MetadataConfigOptions?'
        },
        defaultProps: {
          fallbackMode: 'hybrid',
          enableMetadata: true
        },
        configuration: {
          migrationStrategy: 'gradual',
          backwardCompatibility: true
        },
        dependencies: [],
        personaCompatibility: ['admin', 'rachel', 'john', 'broker'],
        maturityLevelSupport: ['L0', 'L1', 'L2', 'L3', 'L4'],
        version: '1.0.0',
        isActive: true,
      }
    ];

    await db.insert(uiComponentRegistry).values(components);
    console.log(`✅ Seeded ${components.length} UI component registry entries`);
  }

  /**
   * Run complete metadata seeding for zero-risk migration
   */
  static async seedAll(): Promise<void> {
    try {
      console.log('🌱 Starting metadata seeding for zero-risk migration...');
      
      // Clear existing data to avoid conflicts
      console.log('🧹 Clearing existing metadata tables...');
      await db.delete(formFieldDefinitions);
      await db.delete(formTemplates);
      await db.delete(uiComponentRegistry);
      
      // Seed all metadata tables
      await this.seedAgentCreateFormFields();
      await this.seedAgentEditFormFields();
      await this.seedFormTemplates();
      await this.seedUIComponentRegistry();
      
      console.log('🎉 Metadata seeding completed successfully!');
      console.log('✨ JARVIS 3.0 metadata-driven UI system is now ready for gradual migration');
    } catch (error) {
      console.error('❌ Error during metadata seeding:', error);
      throw error;
    }
  }
}

export default MetadataSeeder;
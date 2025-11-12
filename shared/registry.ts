/**
 * Universal CRUD Registry Foundation
 * Following replit.md principles: database-driven, Universal components, NO HARD-CODING
 */

import { z } from 'zod';
import { 
  rolePersonas, insertRolePersonaSchema, type RolePersona,
  orchestrationWorkflows, insertOrchestrationWorkflowSchema,
  commercialPropertyWorkflows, insertCommercialPropertyWorkflowSchema,
  stepFormSubmissions, insertStepFormSubmissionSchema,
  configValues, insertConfigValueSchema
} from './schema';

// Basic registry entry interface
export interface CrudEntityConfig {
  key: string;
  displayName: string;
  tableName: string;
  
  // Schema references (to be added)
  insertSchema?: z.ZodSchema;
  selectSchema?: z.ZodSchema;
  
  // RBAC and permissions
  rbacScope: 'admin' | 'user' | 'public';
  
  // Relationships (for future phases)
  relations?: string[];
  
  // Soft delete support
  softDelete?: boolean;
  
  // Unique constraints
  uniqueFields?: string[];
}

// Registry storage - Universal Workflow Engine (reusing existing schema)
export const UNIVERSAL_REGISTRY: Record<string, CrudEntityConfig> = {
  // === PERSONA MANAGEMENT (existing) ===
  role_personas: {
    key: 'role_personas',
    displayName: 'Role Personas',
    tableName: 'role_personas',
    insertSchema: insertRolePersonaSchema,
    rbacScope: 'admin',
    uniqueFields: ['personaKey'],
    softDelete: false,
    relations: ['user_profiles', 'user_preferences', 'config_values']
  },

  // === UNIVERSAL WORKFLOW ENGINE (reusing existing tables) ===
  
  // Workflow definitions (reuse existing orchestrationWorkflows)
  orchestration_workflows: {
    key: 'orchestration_workflows',
    displayName: 'Workflow Templates & Definitions',
    tableName: 'orchestration_workflows',
    insertSchema: insertOrchestrationWorkflowSchema,
    rbacScope: 'admin',
    uniqueFields: ['workflowName'],
    softDelete: false,
    relations: ['commercial_property_workflows', 'config_values'],
    // Universal workflow library for all personas
  },
  
  // Workflow instances (reuse existing commercialPropertyWorkflows)
  commercial_property_workflows: {
    key: 'commercial_property_workflows', 
    displayName: 'Active Workflow Instances',
    tableName: 'commercial_property_workflows',
    insertSchema: insertCommercialPropertyWorkflowSchema,
    rbacScope: 'user',
    softDelete: false,
    relations: ['orchestration_workflows', 'step_form_submissions', 'agents']
  },

  // HITL forms (reuse existing stepFormSubmissions)
  step_form_submissions: {
    key: 'step_form_submissions', 
    displayName: 'Human-in-the-Loop Form Responses',
    tableName: 'step_form_submissions',
    insertSchema: insertStepFormSubmissionSchema,
    rbacScope: 'user',
    softDelete: false,
    relations: ['commercial_property_workflows', 'users']
  },

  // Persona-workflow assignments (reuse existing configValues with workflow scope)
  config_values: {
    key: 'config_values',
    displayName: 'Configuration & Workflow Assignments',
    tableName: 'config_values', 
    insertSchema: insertConfigValueSchema,
    rbacScope: 'admin',
    uniqueFields: ['configKey', 'persona', 'workflowId'],
    softDelete: false,
    relations: ['role_personas', 'commercial_property_workflows']
    // Handles persona-workflow access control via scope
  }
};

// Helper functions for registry access
export function getEntityConfig(entityKey: string): CrudEntityConfig | undefined {
  return UNIVERSAL_REGISTRY[entityKey];
}

export function getAllEntityKeys(): string[] {
  return Object.keys(UNIVERSAL_REGISTRY);
}

export function getEntitiesByRbacScope(scope: string): CrudEntityConfig[] {
  return Object.values(UNIVERSAL_REGISTRY).filter(config => config.rbacScope === scope);
}

// === UNIVERSAL WORKFLOW ENGINE HELPERS ===

export function getWorkflowEntities(): CrudEntityConfig[] {
  return Object.values(UNIVERSAL_REGISTRY).filter(config => 
    config.key.startsWith('workflow_') || config.key.startsWith('step_form_')
  );
}

export function getPersonaEntities(): CrudEntityConfig[] {
  return Object.values(UNIVERSAL_REGISTRY).filter(config => 
    config.key.includes('persona') || config.key.includes('user_')
  );
}

// Universal workflow examples (using existing orchestrationWorkflows structure):
export const UNIVERSAL_WORKFLOW_EXAMPLES = {
  // Rachel Thompson (AUW) - already exists in commercialPropertyWorkflows
  commercial_underwriting: {
    workflowName: 'Commercial Property Underwriting',
    description: '8-step underwriting process with COPE analysis',
    assignablePersonas: ['rachel', 'admin'],
    workflowType: 'commercial_property',
    status: 'active'
  },
  
  // John Stevens (IT Support) - using existing incidents workflow
  it_incident_mgmt: {
    workflowName: 'IT Incident Management',
    description: 'Incident triage, assignment, and resolution tracking',
    assignablePersonas: ['john', 'admin'], 
    workflowType: 'incident_management',
    status: 'active'
  },
  
  // Mike Stevens (Broker) - new broker workflow
  broker_client_onboarding: {
    workflowName: 'Broker Client Onboarding',
    description: 'New client setup and risk assessment',
    assignablePersonas: ['broker', 'admin'],
    workflowType: 'client_onboarding', 
    status: 'active'
  },

  // JARVIS Admin - governance workflow
  ai_governance_audit: {
    workflowName: 'AI Governance Audit',
    description: 'Model risk assessment and compliance review',
    assignablePersonas: ['admin'],
    workflowType: 'governance_audit',
    status: 'active'
  }
} as const;

// Helper to get workflows by persona
export function getWorkflowsByPersona(personaKey: string): string[] {
  return Object.values(UNIVERSAL_WORKFLOW_EXAMPLES)
    .filter(workflow => workflow.assignablePersonas.includes(personaKey))
    .map(workflow => workflow.workflowName);
}
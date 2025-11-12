# JARVIS IntelliAgent 3.0 - Complete Database Schema Reference

**Complete reference for all 50+ tables in the JARVIS database**

## Table of Contents
- [Core User Tables](#core-user-tables)
- [Agent System Tables](#agent-system-tables)
- [Configuration System Tables](#configuration-system-tables)
- [Insurance Workflow Tables](#insurance-workflow-tables)
- [AI Governance Tables](#ai-governance-tables)
- [Metadata-Driven UI Tables](#metadata-driven-ui-tables)
- [User Journey & Analytics Tables](#user-journey--analytics-tables)
- [Communication Tables](#communication-tables)

---

## Core User Tables

### users
**Primary table for user accounts**
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR NOT NULL UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Purpose**: Store user authentication and profile data
- **Relationships**: Referenced by all user-owned entities
- **Indexes**: `email` (unique)

### user_profiles
**Extended user profile information**
```sql
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  phone VARCHAR,
  timezone VARCHAR,
  language VARCHAR DEFAULT 'en',
  avatar_url VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Foreign Keys**: user_id → users.id
- **Indexes**: user_id

### user_preferences
**User UI and feature preferences**
```sql
CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT true,
  default_persona VARCHAR DEFAULT 'admin',
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Foreign Keys**: user_id → users.id
- **Indexes**: user_id

### user_sessions (managed by connect-pg-simple)
**Express session storage**
```sql
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
CREATE INDEX idx_sessions_expire ON sessions(expire);
```
- **Purpose**: Store user sessions (30-day expiry)
- **Managed by**: connect-pg-simple middleware

---

## Agent System Tables

### agents
**Core agent definitions**
```sql
CREATE TABLE agents (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  agent_role VARCHAR,
  persona_name VARCHAR,
  memory_context_profile VARCHAR(30) DEFAULT 'session-only',
  layer VARCHAR NOT NULL,  -- Experience|Meta Brain|Role|Process|System|Interface
  persona VARCHAR NOT NULL DEFAULT 'admin',
  specialization VARCHAR,
  description TEXT,
  config JSONB,
  status VARCHAR DEFAULT 'active',
  functional_status VARCHAR DEFAULT 'configured',
  is_custom BOOLEAN DEFAULT false,
  user_id VARCHAR REFERENCES users(id),
  
  -- Performance metrics
  cpu_usage INTEGER DEFAULT 0,
  memory_usage INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  success_rate DECIMAL DEFAULT 0,
  avg_response_time INTEGER DEFAULT 0,
  last_activity TIMESTAMP DEFAULT NOW(),
  
  -- Governance
  maturity_level INTEGER DEFAULT 1,
  maturity_stage VARCHAR(20) DEFAULT 'L1',
  agent_category VARCHAR(20) DEFAULT 'Reactive',
  governance_status VARCHAR(20) DEFAULT 'pending',
  risk_level VARCHAR(10) DEFAULT 'medium',
  compliance_frameworks TEXT[],
  last_audit_date TIMESTAMP,
  compliance_notes TEXT,
  
  -- Business context
  business_function VARCHAR(50),
  sla_performance DECIMAL(5,2),
  sla_status VARCHAR(10) DEFAULT 'green',
  version_number INTEGER DEFAULT 1,
  
  -- Persona generation
  can_generate_persona BOOLEAN DEFAULT false,
  persona_generation_config JSONB,
  persona_capabilities JSONB,
  dashboard_template JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: 
  - layer, persona, business_function, functional_status
  - status, governance_status, maturity_level
- **Key JSONB fields**:
  - `config`: Agent configuration
  - `persona_generation_config`: Persona conversion settings
  - `dashboard_template`: Dashboard layout when acting as persona

### agent_versions
**Agent version history and snapshots**
```sql
CREATE TABLE agent_versions (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  changes TEXT,
  snapshot_data JSONB,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```
- **Foreign Keys**: agent_id → agents.id
- **Indexes**: agent_id, created_at DESC

### agent_executions
**Real-time agent execution tracking**
```sql
CREATE TABLE agent_executions (
  id SERIAL PRIMARY KEY,
  execution_id VARCHAR NOT NULL UNIQUE,
  user_id VARCHAR REFERENCES users(id),
  persona VARCHAR NOT NULL,
  command VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'initializing',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  total_duration INTEGER,
  result JSONB,
  error_details JSONB,
  agent_count INTEGER DEFAULT 0
);
```
- **Indexes**: execution_id, user_id, persona, status
- **Status values**: initializing, running, completed, error, cancelled

### agent_execution_steps
**Detailed step-by-step execution tracking**
```sql
CREATE TABLE agent_execution_steps (
  id SERIAL PRIMARY KEY,
  execution_id VARCHAR NOT NULL REFERENCES agent_executions(execution_id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  layer VARCHAR NOT NULL,
  agent_id INTEGER REFERENCES agents(id),
  agent_name VARCHAR NOT NULL,
  agent_type VARCHAR NOT NULL,
  specialization VARCHAR,
  description TEXT,
  capabilities JSONB,
  action VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration INTEGER,
  input_data JSONB,
  output_data JSONB,
  error_details TEXT,
  
  -- Parallel execution support
  group_id VARCHAR,
  is_parallel BOOLEAN DEFAULT false,
  total_in_group INTEGER,
  index_in_group INTEGER,
  
  -- Parent step for hierarchical execution
  parent_step_id INTEGER REFERENCES agent_execution_steps(id)
);
```
- **Indexes**: execution_id, step_order, agent_id, status

### agent_resource_usage
**Detailed resource consumption tracking**
```sql
CREATE TABLE agent_resource_usage (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  timestamp TIMESTAMP DEFAULT NOW(),
  cpu_percent DECIMAL(5,2),
  memory_mb INTEGER,
  active_connections INTEGER,
  requests_per_second DECIMAL(8,2),
  error_rate DECIMAL(5,2)
);
```
- **Indexes**: agent_id, timestamp DESC

---

## Configuration System Tables

### config_registry
**Catalog of all configurable settings**
```sql
CREATE TABLE config_registry (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,  -- string|number|boolean|json|array
  default_value_jsonb JSONB,
  scope VARCHAR(50) DEFAULT 'global',  -- global|persona|agent|workflow
  category VARCHAR(100) NOT NULL,  -- ui|business|security|voice
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: scope, category, type, key (unique)
- **Examples**: 
  - `agent.layer.definitions` (array)
  - `persona-color-schemes.config` (json)
  - `quickcommands.config` (json)

### config_values
**Effective-dated configuration values with scope precedence**
```sql
CREATE TABLE config_values (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(255) NOT NULL REFERENCES config_registry(key),
  scope_identifiers JSONB,  -- {persona, agentId, workflowId}
  -- Extracted for efficient queries
  persona VARCHAR,
  agent_id INTEGER,
  workflow_id INTEGER,
  value JSONB NOT NULL,
  effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMP,  -- null = active indefinitely
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Unique Constraint**: (config_key, version, persona, agent_id, workflow_id)
- **Indexes**:
  - Composite: (config_key, persona, agent_id, workflow_id, is_active)
  - Temporal: (config_key, effective_from, effective_to)
  - Precedence queries optimized

### config_snapshots
**Point-in-time configuration backups**
```sql
CREATE TABLE config_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_name VARCHAR(200) NOT NULL,
  description TEXT,
  snapshot_data JSONB NOT NULL,  -- Complete config state
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: created_at DESC, created_by

### config_change_logs
**Complete audit trail of configuration changes**
```sql
CREATE TABLE config_change_logs (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(255) NOT NULL,
  operation VARCHAR(50) NOT NULL,  -- set|delete|rollback|snapshot_restore|bulk_update
  old_value JSONB,
  new_value JSONB,
  scope_identifiers JSONB,
  performed_by VARCHAR NOT NULL REFERENCES users(id),
  reason TEXT,
  impact_assessment TEXT,
  snapshot_id INTEGER REFERENCES config_snapshots(id),
  performed_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: config_key, performed_by, performed_at DESC

### business_rules
**Effective-dated business logic rules**
```sql
CREATE TABLE business_rules (
  id SERIAL PRIMARY KEY,
  rule_name VARCHAR(200) NOT NULL,
  rule_engine VARCHAR(50) NOT NULL,  -- jsonlogic|cel|simple
  rule_definition JSONB NOT NULL,
  scope VARCHAR(50) DEFAULT 'global',
  scope_identifiers JSONB,
  persona VARCHAR,
  agent_id INTEGER,
  workflow_id INTEGER,
  effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMP,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: rule_name, scope, is_active, effective dates

### templates
**Effective-dated content templates**
```sql
CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(200) NOT NULL,
  template_type VARCHAR(50) NOT NULL,  -- email|voice|ui|sms
  content TEXT NOT NULL,
  variables TEXT[],  -- Substitution variables
  scope VARCHAR(50) DEFAULT 'global',
  scope_identifiers JSONB,
  persona VARCHAR,
  agent_id INTEGER,
  effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMP,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  category VARCHAR(100),
  tags TEXT[],
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: template_name, template_type, category, is_active

---

## Insurance Workflow Tables

### submissions
**General insurance submissions**
```sql
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  submission_id VARCHAR NOT NULL UNIQUE,
  broker_name VARCHAR NOT NULL,
  client_name VARCHAR NOT NULL,
  risk_level VARCHAR NOT NULL,  -- low|medium|high|critical
  recommended_line VARCHAR,
  details JSONB,
  status VARCHAR DEFAULT 'pending',  -- pending|approved|declined
  assigned_to VARCHAR,
  documentation_status VARCHAR DEFAULT 'complete',
  missing_documents TEXT[],
  issue_flags JSONB,
  action_required VARCHAR,
  last_interaction_date TIMESTAMP,
  rachel_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: submission_id, assigned_to, status, risk_level

### incidents
**IT support and claims incidents**
```sql
CREATE TABLE incidents (
  id SERIAL PRIMARY KEY,
  incident_id VARCHAR NOT NULL UNIQUE,
  title VARCHAR NOT NULL,
  description TEXT,
  priority VARCHAR DEFAULT 'medium',  -- low|medium|high|critical
  status VARCHAR DEFAULT 'open',  -- open|in_progress|resolved|closed
  assigned_to VARCHAR,
  reported_by VARCHAR,
  resolution TEXT,
  escalation_required VARCHAR,
  critical_flags JSONB,
  action_required VARCHAR,
  last_interaction_date TIMESTAMP,
  john_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: incident_id, assigned_to, status, priority

### commercial_property_workflows
**Commercial property underwriting state**
```sql
CREATE TABLE commercial_property_workflows (
  id SERIAL PRIMARY KEY,
  submission_id VARCHAR NOT NULL UNIQUE,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  current_step INTEGER DEFAULT 1,
  completed_steps INTEGER[],
  status VARCHAR DEFAULT 'in_progress',  -- in_progress|completed|cancelled
  step_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: submission_id, user_id, status

### commercial_property_cope_data
**COPE (Construction, Occupancy, Protection, Exposure) analysis**
```sql
CREATE TABLE commercial_property_cope_data (
  id SERIAL PRIMARY KEY,
  submission_id VARCHAR NOT NULL UNIQUE REFERENCES commercial_property_workflows(submission_id) ON DELETE CASCADE,
  -- Construction
  construction_type VARCHAR,
  year_built INTEGER,
  total_floors INTEGER,
  basement_levels INTEGER,
  -- Occupancy
  primary_occupancy VARCHAR,
  occupancy_classification VARCHAR,
  business_description TEXT,
  -- Protection
  sprinkler_system BOOLEAN DEFAULT false,
  sprinkler_type VARCHAR,
  fire_alarm_system BOOLEAN DEFAULT false,
  central_station BOOLEAN DEFAULT false,
  security_system BOOLEAN DEFAULT false,
  -- Exposure
  exposure_north VARCHAR,
  exposure_south VARCHAR,
  exposure_east VARCHAR,
  exposure_west VARCHAR,
  hydrant_distance INTEGER,  -- feet
  fire_station_distance INTEGER,  -- miles
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Foreign Keys**: submission_id → commercial_property_workflows.submission_id

### commercial_property_submissions
**Detailed commercial property submission data**
```sql
CREATE TABLE commercial_property_submissions (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER NOT NULL REFERENCES commercial_property_workflows(id) ON DELETE CASCADE,
  submission_id VARCHAR NOT NULL UNIQUE,
  -- Property details
  property_address VARCHAR,
  property_city VARCHAR,
  property_state VARCHAR,
  property_zip VARCHAR,
  building_value DECIMAL(12,2),
  contents_value DECIMAL(12,2),
  business_income_value DECIMAL(12,2),
  -- Additional details
  attachments JSONB,
  additional_info JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: workflow_id, submission_id

---

## AI Governance Tables

### ai_models
**AI model registry**
```sql
CREATE TABLE ai_models (
  id SERIAL PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,
  model_version VARCHAR(50),
  provider VARCHAR(50) NOT NULL,  -- openai|anthropic|custom
  model_type VARCHAR(50),  -- chat|completion|embedding
  performance_metrics JSONB,
  risk_level VARCHAR(10) DEFAULT 'medium',
  compliance_status VARCHAR(20) DEFAULT 'pending',
  last_evaluated TIMESTAMP,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: model_name, provider, compliance_status

### risk_assessments
**Comprehensive risk assessments for agents/models/workflows**
```sql
CREATE TABLE risk_assessments (
  id SERIAL PRIMARY KEY,
  target_type VARCHAR(20) NOT NULL,  -- agent|model|workflow
  target_id VARCHAR(50) NOT NULL,
  target_name VARCHAR(100) NOT NULL,
  overall_risk VARCHAR(10) DEFAULT 'medium',
  bias_risk VARCHAR(10) DEFAULT 'low',
  privacy_risk VARCHAR(10) DEFAULT 'low',
  robustness_risk VARCHAR(10) DEFAULT 'low',
  assessed_date TIMESTAMP DEFAULT NOW(),
  assessor_id VARCHAR NOT NULL REFERENCES users(id),
  assessor_notes TEXT,
  mitigation_actions TEXT[],
  next_review_date TIMESTAMP,
  
  -- EU AI Act compliance
  eu_ai_act_compliance VARCHAR(20) DEFAULT 'pending',
  eu_ai_act_risk_category VARCHAR(30) DEFAULT 'limited',
  eu_ai_act_requirements TEXT[],
  
  -- Explainability
  decision_reasoning TEXT,
  explainability_score DECIMAL(5,2),
  decision_factors JSONB,
  
  -- Bias detection
  bias_test_results JSONB,
  fairness_metrics JSONB,
  bias_categories TEXT[],
  bias_detection_method VARCHAR(50)
);
```
- **Indexes**: target_type+target_id, overall_risk, eu_ai_act_compliance

### audit_trails
**Governance audit history**
```sql
CREATE TABLE audit_trails (
  id SERIAL PRIMARY KEY,
  audit_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(20) NOT NULL,
  target_id VARCHAR(50) NOT NULL,
  target_name VARCHAR(100),
  auditor_id VARCHAR NOT NULL REFERENCES users(id),
  findings TEXT,
  recommendations TEXT,
  compliance_status VARCHAR(20),
  audit_date TIMESTAMP DEFAULT NOW(),
  
  -- EU AI Act specific
  eu_ai_act_articles TEXT[],
  eu_ai_act_compliance_status VARCHAR(20),
  
  -- Decision reasoning
  decision_reasoning_quality VARCHAR(20),
  explanation_gaps JSONB,
  
  -- Bias remediation
  bias_remediation_plan TEXT,
  bias_impact_assessment JSONB
);
```
- **Indexes**: audit_type, target_type+target_id, audit_date

### governance_metrics
**Governance KPIs and metrics**
```sql
CREATE TABLE governance_metrics (
  id SERIAL PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  target DECIMAL(10,2),
  unit VARCHAR(20),
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  recorded_by VARCHAR REFERENCES users(id),
  recorded_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);
```
- **Indexes**: metric_type, metric_name, recorded_at

---

## Metadata-Driven UI Tables

### form_field_definitions
**Reusable form field catalog**
```sql
CREATE TABLE form_field_definitions (
  id SERIAL PRIMARY KEY,
  form_type VARCHAR(50) NOT NULL,
  field_key VARCHAR(100) NOT NULL,
  field_type VARCHAR(50) NOT NULL,
  label VARCHAR(200) NOT NULL,
  description TEXT,
  placeholder VARCHAR(200),
  validation_rules JSONB,
  options JSONB,
  ui_props JSONB,
  persona VARCHAR(50),
  maturity_level VARCHAR(10),
  scope VARCHAR(50) DEFAULT 'global',
  order_index INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: form_type, field_key, persona, is_active

### form_templates
**Predefined form configurations**
```sql
CREATE TABLE form_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(100) NOT NULL UNIQUE,
  form_type VARCHAR(50) NOT NULL,
  description TEXT,
  configuration JSONB NOT NULL,
  persona VARCHAR(50),
  maturity_level VARCHAR(10),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: form_type, persona, is_default

### ui_component_registry
**Reusable UI component catalog**
```sql
CREATE TABLE ui_component_registry (
  id SERIAL PRIMARY KEY,
  component_name VARCHAR(100) NOT NULL UNIQUE,
  component_type VARCHAR(50) NOT NULL,  -- atomic|molecular|organism
  category VARCHAR(50) NOT NULL,
  description TEXT,
  props JSONB,
  default_props JSONB,
  configuration JSONB,
  dependencies TEXT[],
  persona_compatibility TEXT[],
  maturity_level_support TEXT[],
  version VARCHAR(20) DEFAULT '1.0.0',
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: component_type, category, is_active

### tab_configurations
**Dashboard tab metadata**
```sql
CREATE TABLE tab_configurations (
  id SERIAL PRIMARY KEY,
  tab_key VARCHAR(100) NOT NULL UNIQUE,
  tab_name VARCHAR(100) NOT NULL,
  tab_type VARCHAR(50) NOT NULL,
  icon VARCHAR(100),
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  persona_access TEXT[] DEFAULT ARRAY['admin', 'rachel', 'john', 'broker'],
  required_permissions TEXT[],
  configuration_keys TEXT[],
  content_config JSONB,
  layout_config JSONB,
  conditional_display JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: tab_type, is_active, is_visible, order_index

### hierarchy_layer_configurations
**6-layer architecture configurations**
```sql
CREATE TABLE hierarchy_layer_configurations (
  id SERIAL PRIMARY KEY,
  layer_key VARCHAR(50) NOT NULL,
  layer_name VARCHAR(100) NOT NULL,
  layer_level INTEGER NOT NULL,  -- 1-6
  description TEXT,
  data_source VARCHAR(100) NOT NULL,
  data_source_query JSONB,
  display_config JSONB,
  branding JSONB,
  scope_identifiers JSONB,
  persona VARCHAR,
  agent_id INTEGER,
  workflow_id INTEGER,
  effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMP,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: layer_key, layer_level, persona+agent_id+workflow_id

### component_feature_configurations
**Granular feature toggles**
```sql
CREATE TABLE component_feature_configurations (
  id SERIAL PRIMARY KEY,
  feature_key VARCHAR(100) NOT NULL,
  feature_name VARCHAR(200) NOT NULL,
  parent_tab_id INTEGER REFERENCES tab_configurations(id),
  parent_layer_id INTEGER REFERENCES hierarchy_layer_configurations(id),
  is_visible BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  display_rules JSONB,
  data_binding JSONB,
  interaction_logic JSONB,
  access_control JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: feature_key, parent_tab_id, parent_layer_id, is_active

---

## User Journey & Analytics Tables

### user_journey_interactions
**Individual user interactions**
```sql
CREATE TABLE user_journey_interactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  session_id VARCHAR NOT NULL,
  persona VARCHAR NOT NULL,
  interaction_type VARCHAR NOT NULL,  -- command|navigation|voice|click
  target_element VARCHAR,
  command_input TEXT,
  workflow_step VARCHAR,
  duration INTEGER,  -- milliseconds
  coordinates JSONB,  -- {x, y}
  viewport JSONB,  -- {width, height}
  device_info JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);
```
- **Indexes**: user_id, session_id, persona, timestamp

### user_journey_sessions
**Complete user sessions**
```sql
CREATE TABLE user_journey_sessions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  session_id VARCHAR NOT NULL UNIQUE,
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  total_duration INTEGER,  -- seconds
  persona_switches INTEGER DEFAULT 0,
  commands_executed INTEGER DEFAULT 0,
  workflows_completed INTEGER DEFAULT 0,
  primary_persona VARCHAR,
  session_goals JSONB,
  completion_rate DECIMAL(5,2),
  metadata JSONB
);
```
- **Indexes**: user_id, session_id, start_time DESC

### user_journey_heatmaps
**Aggregated interaction heatmaps**
```sql
CREATE TABLE user_journey_heatmaps (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  persona VARCHAR NOT NULL,
  page_route VARCHAR NOT NULL,
  component_id VARCHAR NOT NULL,
  interaction_count INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  avg_duration DECIMAL(10,2),
  click_coordinates JSONB,  -- [{x, y, count}]
  heatmap_data JSONB,
  last_updated TIMESTAMP DEFAULT NOW(),
  date_range VARCHAR DEFAULT '7d'  -- 1d|7d|30d
);
```
- **Indexes**: user_id, persona, page_route, component_id

---

## Communication Tables

### emails
**Email processing and tracking**
```sql
CREATE TABLE emails (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  from_email VARCHAR NOT NULL,
  to_email VARCHAR,
  subject VARCHAR,
  body TEXT,
  attachments JSONB,
  processing_status VARCHAR DEFAULT 'pending',
  delivery_status VARCHAR,
  extracted_intent_data JSONB,
  submission_id VARCHAR,
  priority VARCHAR DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);
```
- **Indexes**: user_id, processing_status, created_at DESC

### commands
**Command history**
```sql
CREATE TABLE commands (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  persona VARCHAR NOT NULL,
  command VARCHAR NOT NULL,
  execution_id VARCHAR,
  status VARCHAR DEFAULT 'pending',
  result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  executed_at TIMESTAMP
);
```
- **Indexes**: user_id, persona, created_at DESC

### activities
**General activity log**
```sql
CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  persona VARCHAR,
  activity_type VARCHAR NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: user_id, activity_type, created_at DESC

### voice_transcripts
**Voice command transcriptions**
```sql
CREATE TABLE voice_transcripts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  persona VARCHAR NOT NULL,
  transcript TEXT NOT NULL,
  confidence DECIMAL(5,2),
  command_executed VARCHAR,
  success BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: user_id, persona, created_at DESC

---

## Additional Tables

### role_personas
**Persona definitions and configuration**
```sql
CREATE TABLE role_personas (
  id SERIAL PRIMARY KEY,
  persona_key VARCHAR NOT NULL UNIQUE,
  display_name VARCHAR NOT NULL,
  agent_role VARCHAR,
  department VARCHAR,
  avatar_url VARCHAR,
  baseline_user_profile JSONB,
  baseline_user_preferences JSONB,
  
  -- Dynamic persona generation
  source_agent_id INTEGER REFERENCES agents(id),
  persona_type VARCHAR DEFAULT 'static',  -- static|dynamic
  is_active BOOLEAN DEFAULT true,
  generation_metadata JSONB,
  dashboard_config JSONB,
  capability_manifest JSONB,
  access_level VARCHAR DEFAULT 'standard',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: persona_key, persona_type, is_active

### experience_layer
**Company branding configuration**
```sql
CREATE TABLE experience_layer (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR NOT NULL,
  metadata JSONB,
  effective_from TIMESTAMP DEFAULT NOW(),
  effective_to TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### step_definitions
**Workflow step definitions**
```sql
CREATE TABLE step_definitions (
  id SERIAL PRIMARY KEY,
  workflow_type VARCHAR NOT NULL,
  step_number INTEGER NOT NULL,
  step_name VARCHAR NOT NULL,
  description TEXT,
  form_schema JSONB,
  validation_rules JSONB,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### step_form_submissions
**Workflow step form data**
```sql
CREATE TABLE step_form_submissions (
  id SERIAL PRIMARY KEY,
  step_id INTEGER NOT NULL REFERENCES step_definitions(id),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  submission_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### errors
**Application error logging**
```sql
CREATE TABLE errors (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  error_type VARCHAR NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```
- **Indexes**: user_id, error_type, created_at DESC

---

## Schema Statistics

**Total Tables**: 53
**Total Indexes**: 150+
**Total Foreign Keys**: 80+
**Total Unique Constraints**: 25+

## Common Query Patterns

### Get active configuration with scope precedence
```sql
SELECT value FROM config_values
WHERE config_key = 'agent.capabilities'
  AND is_active = true
  AND effective_from <= NOW()
  AND (effective_to IS NULL OR effective_to > NOW())
  AND (
    (workflow_id = ? AND agent_id = ? AND persona = ?) OR
    (workflow_id IS NULL AND agent_id = ? AND persona = ?) OR
    (workflow_id IS NULL AND agent_id IS NULL AND persona = ?) OR
    (workflow_id IS NULL AND agent_id IS NULL AND persona IS NULL)
  )
ORDER BY 
  CASE 
    WHEN workflow_id IS NOT NULL THEN 1
    WHEN agent_id IS NOT NULL THEN 2
    WHEN persona IS NOT NULL THEN 3
    ELSE 4
  END,
  version DESC
LIMIT 1;
```

### Get agents by layer and persona
```sql
SELECT * FROM agents
WHERE layer = 'System'
  AND persona = 'admin'
  AND status = 'active'
ORDER BY name;
```

### Get user journey for session
```sql
SELECT * FROM user_journey_interactions
WHERE session_id = ?
ORDER BY timestamp ASC;
```

---

**Last Updated**: 2025-11-12  
**Schema Version**: 3.0  
**Source**: shared/schema.ts

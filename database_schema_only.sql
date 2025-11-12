--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (165f042)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    activity text NOT NULL,
    persona character varying,
    status character varying NOT NULL,
    metadata jsonb,
    "timestamp" timestamp without time zone DEFAULT now()
);


--
-- Name: activities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.activities_id_seq OWNED BY public.activities.id;


--
-- Name: agent_dependencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_dependencies (
    id integer NOT NULL,
    agent_id integer NOT NULL,
    depends_on_agent_id integer NOT NULL,
    dependency_type text NOT NULL,
    is_critical boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: agent_dependencies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_dependencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_dependencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_dependencies_id_seq OWNED BY public.agent_dependencies.id;


--
-- Name: agent_execution_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_execution_logs (
    id integer NOT NULL,
    execution_id character varying NOT NULL,
    step_id integer,
    log_level character varying DEFAULT 'info'::character varying NOT NULL,
    source character varying NOT NULL,
    message text NOT NULL,
    details jsonb,
    logged_at timestamp without time zone DEFAULT now(),
    "timestamp" timestamp without time zone DEFAULT now()
);


--
-- Name: agent_execution_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_execution_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_execution_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_execution_logs_id_seq OWNED BY public.agent_execution_logs.id;


--
-- Name: agent_execution_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_execution_steps (
    id integer NOT NULL,
    execution_id character varying NOT NULL,
    step_order integer NOT NULL,
    layer character varying NOT NULL,
    agent_id integer,
    agent_name character varying NOT NULL,
    agent_type character varying NOT NULL,
    action text NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    duration integer,
    input_data jsonb,
    output_data jsonb,
    metadata jsonb,
    error_details jsonb,
    created_at timestamp without time zone DEFAULT now(),
    parent_step_id integer
);


--
-- Name: agent_execution_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_execution_steps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_execution_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_execution_steps_id_seq OWNED BY public.agent_execution_steps.id;


--
-- Name: agent_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_executions (
    id integer NOT NULL,
    execution_id character varying NOT NULL,
    user_id character varying NOT NULL,
    persona character varying NOT NULL,
    command text NOT NULL,
    company_context jsonb,
    orchestration_strategy character varying DEFAULT 'sequential'::character varying,
    status character varying DEFAULT 'initializing'::character varying NOT NULL,
    started_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    total_duration integer,
    result jsonb,
    error_details jsonb,
    agent_count integer DEFAULT 0,
    layers_involved jsonb,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: agent_executions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_executions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_executions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_executions_id_seq OWNED BY public.agent_executions.id;


--
-- Name: agent_resource_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_resource_usage (
    id integer NOT NULL,
    agent_id integer NOT NULL,
    recorded_at timestamp without time zone DEFAULT now(),
    cpu_usage numeric,
    memory_usage numeric,
    disk_usage numeric,
    network_usage numeric,
    active_sessions integer,
    queue_depth integer
);


--
-- Name: agent_resource_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_resource_usage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_resource_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_resource_usage_id_seq OWNED BY public.agent_resource_usage.id;


--
-- Name: agent_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_templates (
    id integer NOT NULL,
    template_name character varying(255) NOT NULL,
    agent_type character varying(100) NOT NULL,
    layer character varying(100) NOT NULL,
    description text,
    capabilities jsonb NOT NULL,
    configuration jsonb NOT NULL,
    dependencies jsonb,
    is_active boolean DEFAULT true,
    usage_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: agent_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_templates_id_seq OWNED BY public.agent_templates.id;


--
-- Name: agent_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_versions (
    id integer NOT NULL,
    agent_id integer NOT NULL,
    version integer NOT NULL,
    config_snapshot jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    created_by text,
    change_description text
);


--
-- Name: agent_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_versions_id_seq OWNED BY public.agent_versions.id;


--
-- Name: agents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agents (
    id integer NOT NULL,
    name character varying NOT NULL,
    agent_role character varying,
    persona_name character varying,
    layer character varying NOT NULL,
    persona character varying DEFAULT 'admin'::character varying NOT NULL,
    specialization character varying,
    description text,
    config jsonb,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    is_custom boolean DEFAULT false,
    user_id character varying,
    cpu_usage integer DEFAULT 0,
    memory_usage integer DEFAULT 0,
    active_users integer DEFAULT 0,
    success_rate numeric DEFAULT '0'::numeric,
    avg_response_time integer DEFAULT 0,
    last_activity timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    functional_status character varying DEFAULT 'configured'::character varying NOT NULL,
    maturity_level integer DEFAULT 1,
    governance_status character varying(20) DEFAULT 'pending'::character varying,
    risk_level character varying(10) DEFAULT 'medium'::character varying,
    last_audit_date timestamp without time zone,
    compliance_notes text,
    business_function character varying(50),
    sla_performance numeric(5,2),
    sla_status character varying(10) DEFAULT 'green'::character varying,
    collaboration_status character varying(20) DEFAULT 'solo'::character varying,
    cost_benefit_ratio numeric(10,2),
    business_impact_score numeric(8,2),
    lifecycle_stage text DEFAULT 'active'::text,
    config_version integer DEFAULT 1,
    retirement_date timestamp without time zone,
    depends_on_agents text[] DEFAULT '{}'::text[],
    resource_requirements jsonb DEFAULT '{}'::jsonb,
    performance_metrics jsonb DEFAULT '{}'::jsonb,
    last_config_update timestamp without time zone DEFAULT now(),
    has_unsaved_changes boolean DEFAULT false,
    monthly_cost numeric(10,2) DEFAULT 0,
    cost_efficiency character varying(20),
    cost_trend character varying(20),
    cost_change numeric(10,2),
    can_generate_persona boolean DEFAULT false,
    persona_generation_config jsonb,
    persona_capabilities jsonb,
    dashboard_template jsonb,
    maturity_stage character varying(20) DEFAULT 'L1'::character varying,
    agent_category character varying(20) DEFAULT 'Reactive'::character varying,
    compliance_frameworks text[] DEFAULT '{}'::text[],
    sla_requirements jsonb,
    memory_config jsonb,
    deployment_config jsonb,
    integration_config jsonb,
    memory_context_profile character varying(30) DEFAULT 'session-only'::character varying NOT NULL
);


--
-- Name: agents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agents_id_seq OWNED BY public.agents.id;


--
-- Name: ai_commands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_commands (
    id integer NOT NULL,
    command_name character varying(255) NOT NULL,
    command_type character varying(100) NOT NULL,
    description text,
    target_agents jsonb,
    parameters jsonb,
    execution_count integer DEFAULT 0,
    avg_response_time integer,
    success_rate character varying(10) DEFAULT '0'::character varying,
    last_executed timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: ai_commands_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_commands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_commands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_commands_id_seq OWNED BY public.ai_commands.id;


--
-- Name: ai_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_models (
    id integer NOT NULL,
    model_name character varying(100) NOT NULL,
    model_version character varying(50) NOT NULL,
    model_type character varying(50) NOT NULL,
    deployment_status character varying(20) DEFAULT 'development'::character varying,
    risk_level character varying(10) DEFAULT 'medium'::character varying,
    last_tested timestamp without time zone,
    performance_score numeric(5,2),
    notes text,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: ai_models_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_models_id_seq OWNED BY public.ai_models.id;


--
-- Name: audit_trails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_trails (
    id integer NOT NULL,
    audit_type character varying(50) NOT NULL,
    target_type character varying(20) NOT NULL,
    target_id character varying(50) NOT NULL,
    target_name character varying(100) NOT NULL,
    audit_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    auditor_id character varying NOT NULL,
    findings text[],
    recommendations text[],
    compliance_score numeric(5,2),
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    audit_details text,
    follow_up_required boolean DEFAULT false,
    follow_up_date timestamp without time zone,
    eu_ai_act_audit_type character varying(30),
    eu_ai_act_articles text[],
    eu_ai_act_compliance_status character varying(20),
    decision_reasoning_audit jsonb,
    explainability_gaps text[],
    decision_traceability jsonb,
    bias_detection_results jsonb,
    fairness_audit_metrics jsonb,
    bias_remediation_plan text,
    bias_impact_assessment jsonb
);


--
-- Name: audit_trails_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_trails_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_trails_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_trails_id_seq OWNED BY public.audit_trails.id;


--
-- Name: business_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_rules (
    id integer NOT NULL,
    rule_key character varying(255) NOT NULL,
    rule_engine character varying(50) DEFAULT 'jsonlogic'::character varying NOT NULL,
    expression jsonb NOT NULL,
    params jsonb,
    scope_identifiers jsonb,
    persona character varying,
    agent_id integer,
    workflow_id integer,
    effective_from timestamp without time zone DEFAULT now() NOT NULL,
    effective_to timestamp without time zone,
    version integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by character varying,
    description text NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: business_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.business_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: business_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.business_rules_id_seq OWNED BY public.business_rules.id;


--
-- Name: commands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commands (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    input text NOT NULL,
    response text,
    mode character varying NOT NULL,
    persona character varying NOT NULL,
    agent_name character varying,
    agent_type character varying,
    submission_id character varying,
    submission_details jsonb,
    status character varying DEFAULT 'completed'::character varying,
    executed_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: commands_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.commands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: commands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.commands_id_seq OWNED BY public.commands.id;


--
-- Name: commercial_property_cope_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commercial_property_cope_data (
    id integer NOT NULL,
    submission_id character varying NOT NULL,
    construction_type character varying,
    year_built integer,
    total_floors integer,
    basement_levels integer,
    primary_occupancy character varying,
    occupancy_classification character varying,
    business_description text,
    sprinkler_system boolean DEFAULT false,
    sprinkler_type character varying,
    fire_alarm_system boolean DEFAULT false,
    central_station boolean DEFAULT false,
    security_system boolean DEFAULT false,
    exposure_north character varying,
    exposure_south character varying,
    exposure_east character varying,
    exposure_west character varying,
    hydrant_distance integer,
    fire_station_distance integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: commercial_property_cope_data_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.commercial_property_cope_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: commercial_property_cope_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.commercial_property_cope_data_id_seq OWNED BY public.commercial_property_cope_data.id;


--
-- Name: commercial_property_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commercial_property_submissions (
    id integer NOT NULL,
    workflow_id integer NOT NULL,
    submission_id character varying NOT NULL,
    email_source character varying,
    sender_email character varying,
    subject character varying,
    attachment_count integer DEFAULT 0,
    documents_extracted jsonb,
    document_validation_status character varying DEFAULT 'pending'::character varying,
    external_data_sources jsonb,
    enrichment_score numeric(5,2),
    market_benchmarks jsonb,
    competitor_analysis jsonb,
    appetite_score numeric(5,2),
    appetite_alignment character varying,
    risk_propensity_score numeric(5,2),
    profitability_score numeric(5,2),
    underwriting_recommendations jsonb,
    risk_factors jsonb,
    core_system_status character varying DEFAULT 'pending'::character varying,
    integration_errors jsonb,
    final_premium numeric(12,2),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: commercial_property_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.commercial_property_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: commercial_property_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.commercial_property_submissions_id_seq OWNED BY public.commercial_property_submissions.id;


--
-- Name: commercial_property_workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commercial_property_workflows (
    id integer NOT NULL,
    submission_id character varying NOT NULL,
    user_id character varying NOT NULL,
    current_step integer DEFAULT 1 NOT NULL,
    completed_steps integer[] DEFAULT '{}'::integer[],
    status character varying DEFAULT 'in_progress'::character varying NOT NULL,
    step_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: commercial_property_workflows_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.commercial_property_workflows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: commercial_property_workflows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.commercial_property_workflows_id_seq OWNED BY public.commercial_property_workflows.id;


--
-- Name: component_feature_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.component_feature_configurations (
    id integer NOT NULL,
    feature_key character varying(100) NOT NULL,
    feature_name character varying(100) NOT NULL,
    component_type character varying(50) NOT NULL,
    parent_tab_key character varying(100),
    parent_layer_key character varying(50),
    description text,
    "order" integer DEFAULT 0,
    is_visible boolean DEFAULT true,
    is_active boolean DEFAULT true NOT NULL,
    feature_config jsonb NOT NULL,
    data_binding jsonb,
    interaction_config jsonb,
    persona_access text[] DEFAULT '{admin,rachel,john,broker}'::text[],
    required_permissions text[],
    conditional_display jsonb,
    effective_from timestamp without time zone DEFAULT now() NOT NULL,
    effective_to timestamp without time zone,
    version integer DEFAULT 1 NOT NULL,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: component_feature_configurations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.component_feature_configurations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: component_feature_configurations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.component_feature_configurations_id_seq OWNED BY public.component_feature_configurations.id;


--
-- Name: config_change_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_change_logs (
    id integer NOT NULL,
    operation_type character varying(50) NOT NULL,
    config_key character varying(255) NOT NULL,
    config_type character varying(50) NOT NULL,
    scope_identifiers jsonb,
    previous_state jsonb,
    new_state jsonb,
    performed_by character varying NOT NULL,
    reason text,
    rollback_target_version integer,
    rollback_target_date timestamp without time zone,
    snapshot_id integer,
    affected_count integer DEFAULT 1,
    impact_scope jsonb,
    success boolean DEFAULT true NOT NULL,
    error_details jsonb,
    execution_time_ms integer,
    "timestamp" timestamp without time zone DEFAULT now()
);


--
-- Name: config_change_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.config_change_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: config_change_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.config_change_logs_id_seq OWNED BY public.config_change_logs.id;


--
-- Name: config_registry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_registry (
    id integer NOT NULL,
    key character varying(255) NOT NULL,
    description text NOT NULL,
    type character varying(50) NOT NULL,
    default_value_jsonb jsonb,
    scope character varying(50) DEFAULT 'global'::character varying NOT NULL,
    category character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: config_registry_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.config_registry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: config_registry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.config_registry_id_seq OWNED BY public.config_registry.id;


--
-- Name: config_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_snapshots (
    id integer NOT NULL,
    snapshot_name character varying(255) NOT NULL,
    description text,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    scope_filter jsonb,
    snapshot_data jsonb NOT NULL,
    metrics_summary jsonb
);


--
-- Name: config_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.config_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: config_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.config_snapshots_id_seq OWNED BY public.config_snapshots.id;


--
-- Name: config_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_values (
    id integer NOT NULL,
    config_key character varying(255) NOT NULL,
    scope_identifiers jsonb,
    persona character varying,
    agent_id integer,
    workflow_id integer,
    value jsonb NOT NULL,
    effective_from timestamp without time zone DEFAULT now() NOT NULL,
    effective_to timestamp without time zone,
    version integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by character varying,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: config_values_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.config_values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: config_values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.config_values_id_seq OWNED BY public.config_values.id;


--
-- Name: dashboard_kpis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dashboard_kpis (
    id integer NOT NULL,
    kpi_name character varying(100) NOT NULL,
    current_value character varying(100) NOT NULL,
    previous_value character varying(100),
    target character varying(100),
    unit character varying(50),
    category character varying(100) NOT NULL,
    trend character varying(20) DEFAULT 'stable'::character varying,
    updated_at timestamp without time zone DEFAULT now(),
    context character varying(20) DEFAULT 'main_dashboard'::character varying,
    display_context character varying(20) DEFAULT 'main'::character varying,
    priority integer DEFAULT 1,
    view_category character varying(20) DEFAULT 'both'::character varying,
    persona_relevance text[] DEFAULT '{admin,rachel,john,broker}'::text[]
);


--
-- Name: dashboard_kpis_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dashboard_kpis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dashboard_kpis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dashboard_kpis_id_seq OWNED BY public.dashboard_kpis.id;


--
-- Name: data_prep_layers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_prep_layers (
    id integer NOT NULL,
    layer_name character varying(100) NOT NULL,
    source_system character varying(100) NOT NULL,
    data_type character varying(100) NOT NULL,
    processing_status character varying(50) DEFAULT 'ready'::character varying,
    records_processed integer DEFAULT 0,
    records_total integer DEFAULT 0,
    last_processed timestamp without time zone,
    quality_score character varying(10) DEFAULT '0'::character varying,
    error_count integer DEFAULT 0,
    config jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: data_prep_layers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.data_prep_layers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: data_prep_layers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.data_prep_layers_id_seq OWNED BY public.data_prep_layers.id;


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_templates (
    id integer NOT NULL,
    template_id character varying NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    subject text NOT NULL,
    content text NOT NULL,
    required_fields text[],
    attachment_templates text[],
    broker_types text[],
    personas text[],
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: email_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_templates_id_seq OWNED BY public.email_templates.id;


--
-- Name: emails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emails (
    id integer NOT NULL,
    message_id character varying NOT NULL,
    user_id character varying NOT NULL,
    persona character varying NOT NULL,
    to_email character varying NOT NULL,
    from_email character varying NOT NULL,
    cc_emails text[],
    bcc_emails text[],
    subject text NOT NULL,
    body text NOT NULL,
    email_type character varying NOT NULL,
    priority character varying DEFAULT 'normal'::character varying NOT NULL,
    delivery_status character varying DEFAULT 'sent'::character varying NOT NULL,
    submission_id character varying,
    incident_id character varying,
    workflow_context text,
    broker_info jsonb,
    sent_at timestamp without time zone DEFAULT now(),
    delivered_at timestamp without time zone,
    opened_at timestamp without time zone,
    replied_at timestamp without time zone,
    bounced_at timestamp without time zone,
    click_tracking jsonb,
    generated_by jsonb,
    attachments jsonb,
    processing_status character varying DEFAULT 'pending'::character varying,
    security_scan_result jsonb,
    document_classification jsonb,
    extracted_intent_data jsonb,
    processing_agent_logs jsonb,
    processing_completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: emails_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.emails_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: emails_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.emails_id_seq OWNED BY public.emails.id;


--
-- Name: errors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.errors (
    id integer NOT NULL,
    user_id character varying,
    error_type character varying NOT NULL,
    error_message text NOT NULL,
    context jsonb,
    persona character varying,
    submission_id character varying,
    "timestamp" timestamp without time zone DEFAULT now()
);


--
-- Name: errors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.errors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: errors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.errors_id_seq OWNED BY public.errors.id;


--
-- Name: experience_layer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.experience_layer (
    id integer NOT NULL,
    company_name character varying DEFAULT 'ABC Insurance Ltd'::character varying NOT NULL,
    company_config jsonb,
    branding_config jsonb,
    personalization_settings jsonb,
    jarvis_customizations jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: experience_layer_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.experience_layer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: experience_layer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.experience_layer_id_seq OWNED BY public.experience_layer.id;


--
-- Name: governance_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.governance_metrics (
    id integer NOT NULL,
    metric_type character varying(50) NOT NULL,
    metric_value numeric(10,2) NOT NULL,
    metric_unit character varying(20),
    target_type character varying(20),
    target_id character varying(50),
    recorded_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    recorded_by character varying,
    metadata jsonb
);


--
-- Name: governance_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.governance_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: governance_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.governance_metrics_id_seq OWNED BY public.governance_metrics.id;


--
-- Name: hierarchy_layer_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hierarchy_layer_configurations (
    id integer NOT NULL,
    layer_key character varying(50) NOT NULL,
    layer_name character varying(100) NOT NULL,
    layer_level integer NOT NULL,
    description text,
    data_source character varying(100) NOT NULL,
    data_source_query jsonb,
    display_config jsonb,
    branding jsonb,
    scope_identifiers jsonb,
    persona character varying,
    agent_id integer,
    workflow_id integer,
    effective_from timestamp without time zone DEFAULT now() NOT NULL,
    effective_to timestamp without time zone,
    version integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by character varying,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: hierarchy_layer_configurations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hierarchy_layer_configurations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hierarchy_layer_configurations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hierarchy_layer_configurations_id_seq OWNED BY public.hierarchy_layer_configurations.id;


--
-- Name: incidents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incidents (
    id integer NOT NULL,
    incident_id character varying NOT NULL,
    title character varying NOT NULL,
    description text,
    priority character varying DEFAULT 'medium'::character varying NOT NULL,
    status character varying DEFAULT 'open'::character varying NOT NULL,
    assigned_to character varying,
    reported_by character varying,
    resolution text,
    escalation_required character varying,
    critical_flags jsonb,
    action_required character varying,
    last_interaction_date timestamp without time zone,
    john_notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: incidents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.incidents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: incidents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.incidents_id_seq OWNED BY public.incidents.id;


--
-- Name: meta_brain_layer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meta_brain_layer (
    id integer NOT NULL,
    orchestrator_name character varying DEFAULT 'JARVIS Meta Brain'::character varying NOT NULL,
    orchestration_config jsonb,
    agent_coordination jsonb,
    workflow_management jsonb,
    decision_engine jsonb,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: meta_brain_layer_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.meta_brain_layer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: meta_brain_layer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.meta_brain_layer_id_seq OWNED BY public.meta_brain_layer.id;


--
-- Name: meta_brain_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meta_brain_settings (
    id integer NOT NULL,
    setting_name character varying(100) NOT NULL,
    setting_value text NOT NULL,
    setting_type character varying(50) DEFAULT 'string'::character varying,
    category character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: meta_brain_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.meta_brain_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: meta_brain_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.meta_brain_settings_id_seq OWNED BY public.meta_brain_settings.id;


--
-- Name: orchestration_workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orchestration_workflows (
    id integer NOT NULL,
    workflow_name character varying(255) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'active'::character varying,
    trigger_type character varying(100) NOT NULL,
    trigger_config jsonb,
    steps jsonb NOT NULL,
    execution_count integer DEFAULT 0,
    last_executed timestamp without time zone,
    avg_execution_time integer,
    success_rate character varying(10) DEFAULT '0'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: orchestration_workflows_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orchestration_workflows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orchestration_workflows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orchestration_workflows_id_seq OWNED BY public.orchestration_workflows.id;


--
-- Name: persona_briefings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.persona_briefings (
    id integer NOT NULL,
    persona character varying(50) NOT NULL,
    briefing_text text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: persona_briefings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.persona_briefings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: persona_briefings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.persona_briefings_id_seq OWNED BY public.persona_briefings.id;


--
-- Name: personalization_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personalization_configs (
    id integer NOT NULL,
    insurer_id integer NOT NULL,
    role_config jsonb,
    workflow_config jsonb,
    system_config jsonb,
    interface_config jsonb,
    branding jsonb,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: personalization_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personalization_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personalization_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personalization_configs_id_seq OWNED BY public.personalization_configs.id;


--
-- Name: risk_assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.risk_assessments (
    id integer NOT NULL,
    target_type character varying(20) NOT NULL,
    target_id character varying(50) NOT NULL,
    target_name character varying(100) NOT NULL,
    overall_risk character varying(10) DEFAULT 'medium'::character varying,
    bias_risk character varying(10) DEFAULT 'low'::character varying,
    privacy_risk character varying(10) DEFAULT 'low'::character varying,
    robustness_risk character varying(10) DEFAULT 'low'::character varying,
    assessed_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    assessor_id character varying NOT NULL,
    details text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    assessor_notes text,
    mitigation_actions text,
    next_review_date timestamp without time zone,
    eu_ai_act_compliance character varying(20) DEFAULT 'pending'::character varying,
    eu_ai_act_risk_category character varying(30) DEFAULT 'limited'::character varying,
    eu_ai_act_requirements text[],
    decision_reasoning text,
    explainability_score numeric(5,2),
    decision_factors jsonb,
    bias_test_results jsonb,
    fairness_metrics jsonb,
    bias_categories text[],
    bias_detection_method character varying(50)
);


--
-- Name: risk_assessments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.risk_assessments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: risk_assessments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.risk_assessments_id_seq OWNED BY public.risk_assessments.id;


--
-- Name: role_personas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_personas (
    id integer NOT NULL,
    persona_key character varying(50) NOT NULL,
    display_name character varying(255) NOT NULL,
    agent_role character varying(100),
    department character varying(100),
    avatar_url text,
    baseline_user_profile jsonb,
    baseline_user_preferences jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    source_agent_id integer,
    persona_type character varying DEFAULT 'static'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    generation_metadata jsonb,
    dashboard_config jsonb,
    capability_manifest jsonb,
    access_level character varying DEFAULT 'standard'::character varying
);


--
-- Name: role_personas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.role_personas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: role_personas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.role_personas_id_seq OWNED BY public.role_personas.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


--
-- Name: step_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.step_definitions (
    id integer NOT NULL,
    workflow_type character varying NOT NULL,
    step_number integer NOT NULL,
    step_name character varying NOT NULL,
    step_title character varying NOT NULL,
    step_description text,
    field_definitions jsonb NOT NULL,
    constraints jsonb,
    submit_label character varying DEFAULT 'Next'::character varying,
    skipable boolean DEFAULT false,
    persona character varying DEFAULT 'admin'::character varying,
    effective_date timestamp without time zone DEFAULT now() NOT NULL,
    expiration_date timestamp without time zone,
    status character varying DEFAULT 'active'::character varying,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: step_definitions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.step_definitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: step_definitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.step_definitions_id_seq OWNED BY public.step_definitions.id;


--
-- Name: step_form_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.step_form_submissions (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    workflow_type character varying NOT NULL,
    step_id integer NOT NULL,
    submission_data jsonb NOT NULL,
    completed_at timestamp without time zone DEFAULT now(),
    persona character varying NOT NULL,
    session_id character varying,
    agent_execution jsonb
);


--
-- Name: step_form_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.step_form_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: step_form_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.step_form_submissions_id_seq OWNED BY public.step_form_submissions.id;


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.submissions (
    id integer NOT NULL,
    submission_id character varying NOT NULL,
    broker_name character varying NOT NULL,
    client_name character varying NOT NULL,
    risk_level character varying NOT NULL,
    recommended_line character varying,
    details jsonb,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    assigned_to character varying,
    documentation_status character varying DEFAULT 'complete'::character varying,
    missing_documents text[],
    issue_flags jsonb,
    action_required character varying,
    last_interaction_date timestamp without time zone,
    rachel_notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.submissions_id_seq OWNED BY public.submissions.id;


--
-- Name: system_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_integrations (
    id integer NOT NULL,
    system_name character varying(255) NOT NULL,
    system_type character varying(100) NOT NULL,
    connection_status character varying(50) DEFAULT 'connected'::character varying,
    api_endpoint character varying(500),
    auth_type character varying(100),
    last_sync timestamp without time zone,
    sync_frequency character varying(100),
    records_synced integer DEFAULT 0,
    error_count integer DEFAULT 0,
    health_score character varying(10) DEFAULT '100'::character varying,
    config jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: system_integrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_integrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_integrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_integrations_id_seq OWNED BY public.system_integrations.id;


--
-- Name: tab_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tab_configurations (
    id integer NOT NULL,
    tab_key character varying(100) NOT NULL,
    tab_name character varying(100) NOT NULL,
    tab_type character varying(50) NOT NULL,
    icon character varying(100),
    description text,
    "order" integer DEFAULT 0,
    is_visible boolean DEFAULT true,
    is_active boolean DEFAULT true,
    persona_access text[] DEFAULT '{admin,rachel,john,broker}'::text[],
    required_permissions text[],
    configuration_keys text[],
    content_config jsonb,
    layout_config jsonb,
    conditional_display jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: tab_configurations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tab_configurations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tab_configurations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tab_configurations_id_seq OWNED BY public.tab_configurations.id;


--
-- Name: templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.templates (
    id integer NOT NULL,
    template_key character varying(255) NOT NULL,
    channel character varying(50) NOT NULL,
    content jsonb NOT NULL,
    locale character varying(10) DEFAULT 'en-US'::character varying NOT NULL,
    scope_identifiers jsonb,
    persona character varying,
    agent_id integer,
    workflow_id integer,
    effective_from timestamp without time zone DEFAULT now() NOT NULL,
    effective_to timestamp without time zone,
    version integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by character varying,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.templates_id_seq OWNED BY public.templates.id;


--
-- Name: user_journey_heatmaps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_journey_heatmaps (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    persona character varying NOT NULL,
    page_route character varying NOT NULL,
    component_id character varying NOT NULL,
    interaction_count integer DEFAULT 0,
    total_duration integer DEFAULT 0,
    avg_duration numeric(10,2),
    click_coordinates jsonb,
    heatmap_data jsonb,
    last_updated timestamp without time zone DEFAULT now(),
    date_range character varying DEFAULT '7d'::character varying
);


--
-- Name: user_journey_heatmaps_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_journey_heatmaps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_journey_heatmaps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_journey_heatmaps_id_seq OWNED BY public.user_journey_heatmaps.id;


--
-- Name: user_journey_interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_journey_interactions (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    session_id character varying NOT NULL,
    persona character varying NOT NULL,
    interaction_type character varying NOT NULL,
    target_element character varying,
    command_input text,
    workflow_step character varying,
    duration integer,
    coordinates jsonb,
    viewport jsonb,
    device_info jsonb,
    "timestamp" timestamp without time zone DEFAULT now(),
    metadata jsonb
);


--
-- Name: user_journey_interactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_journey_interactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_journey_interactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_journey_interactions_id_seq OWNED BY public.user_journey_interactions.id;


--
-- Name: user_journey_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_journey_sessions (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    session_id character varying NOT NULL,
    start_time timestamp without time zone DEFAULT now(),
    end_time timestamp without time zone,
    total_duration integer,
    persona_switches integer DEFAULT 0,
    commands_executed integer DEFAULT 0,
    workflows_completed integer DEFAULT 0,
    primary_persona character varying,
    session_goals jsonb,
    completion_rate numeric(5,2),
    metadata jsonb
);


--
-- Name: user_journey_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_journey_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_journey_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_journey_sessions_id_seq OWNED BY public.user_journey_sessions.id;


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    communication_style character varying DEFAULT 'casual'::character varying,
    response_length character varying DEFAULT 'detailed'::character varying,
    explanation_level character varying DEFAULT 'intermediate'::character varying,
    preferred_input_method character varying DEFAULT 'both'::character varying,
    auto_suggestions boolean DEFAULT true,
    confirm_before_actions boolean DEFAULT true,
    notification_settings jsonb,
    custom_instructions text,
    workflow_instructions jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    view_mode character varying DEFAULT 'technical'::character varying,
    persona character varying(50) DEFAULT 'admin'::character varying
);


--
-- Name: user_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_preferences_id_seq OWNED BY public.user_preferences.id;


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    job_role character varying,
    department character varying,
    experience_level character varying,
    primary_workflows jsonb,
    access_level character varying DEFAULT 'standard'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    persona character varying(50) DEFAULT 'admin'::character varying
);


--
-- Name: user_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_profiles_id_seq OWNED BY public.user_profiles.id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    active_persona character varying DEFAULT 'admin'::character varying NOT NULL,
    session_data jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: voice_transcripts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voice_transcripts (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    persona character varying NOT NULL,
    transcript_text text NOT NULL,
    is_command boolean DEFAULT true,
    confidence numeric(3,2),
    processing_status character varying DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: voice_transcripts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.voice_transcripts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: voice_transcripts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.voice_transcripts_id_seq OWNED BY public.voice_transcripts.id;


--
-- Name: activities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities ALTER COLUMN id SET DEFAULT nextval('public.activities_id_seq'::regclass);


--
-- Name: agent_dependencies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_dependencies ALTER COLUMN id SET DEFAULT nextval('public.agent_dependencies_id_seq'::regclass);


--
-- Name: agent_execution_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_execution_logs ALTER COLUMN id SET DEFAULT nextval('public.agent_execution_logs_id_seq'::regclass);


--
-- Name: agent_execution_steps id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_execution_steps ALTER COLUMN id SET DEFAULT nextval('public.agent_execution_steps_id_seq'::regclass);


--
-- Name: agent_executions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_executions ALTER COLUMN id SET DEFAULT nextval('public.agent_executions_id_seq'::regclass);


--
-- Name: agent_resource_usage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_resource_usage ALTER COLUMN id SET DEFAULT nextval('public.agent_resource_usage_id_seq'::regclass);


--
-- Name: agent_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_templates ALTER COLUMN id SET DEFAULT nextval('public.agent_templates_id_seq'::regclass);


--
-- Name: agent_versions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_versions ALTER COLUMN id SET DEFAULT nextval('public.agent_versions_id_seq'::regclass);


--
-- Name: agents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agents ALTER COLUMN id SET DEFAULT nextval('public.agents_id_seq'::regclass);


--
-- Name: ai_commands id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_commands ALTER COLUMN id SET DEFAULT nextval('public.ai_commands_id_seq'::regclass);


--
-- Name: ai_models id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_models ALTER COLUMN id SET DEFAULT nextval('public.ai_models_id_seq'::regclass);


--
-- Name: audit_trails id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_trails ALTER COLUMN id SET DEFAULT nextval('public.audit_trails_id_seq'::regclass);


--
-- Name: business_rules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_rules ALTER COLUMN id SET DEFAULT nextval('public.business_rules_id_seq'::regclass);


--
-- Name: commands id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commands ALTER COLUMN id SET DEFAULT nextval('public.commands_id_seq'::regclass);


--
-- Name: commercial_property_cope_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commercial_property_cope_data ALTER COLUMN id SET DEFAULT nextval('public.commercial_property_cope_data_id_seq'::regclass);


--
-- Name: commercial_property_submissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commercial_property_submissions ALTER COLUMN id SET DEFAULT nextval('public.commercial_property_submissions_id_seq'::regclass);


--
-- Name: commercial_property_workflows id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commercial_property_workflows ALTER COLUMN id SET DEFAULT nextval('public.commercial_property_workflows_id_seq'::regclass);


--
-- Name: component_feature_configurations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.component_feature_configurations ALTER COLUMN id SET DEFAULT nextval('public.component_feature_configurations_id_seq'::regclass);


--
-- Name: config_change_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_change_logs ALTER COLUMN id SET DEFAULT nextval('public.config_change_logs_id_seq'::regclass);


--
-- Name: config_registry id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_registry ALTER COLUMN id SET DEFAULT nextval('public.config_registry_id_seq'::regclass);


--
-- Name: config_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_snapshots ALTER COLUMN id SET DEFAULT nextval('public.config_snapshots_id_seq'::regclass);


--
-- Name: config_values id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_values ALTER COLUMN id SET DEFAULT nextval('public.config_values_id_seq'::regclass);


--
-- Name: dashboard_kpis id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_kpis ALTER COLUMN id SET DEFAULT nextval('public.dashboard_kpis_id_seq'::regclass);


--
-- Name: data_prep_layers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_prep_layers ALTER COLUMN id SET DEFAULT nextval('public.data_prep_layers_id_seq'::regclass);


--
-- Name: email_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates ALTER COLUMN id SET DEFAULT nextval('public.email_templates_id_seq'::regclass);


--
-- Name: emails id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emails ALTER COLUMN id SET DEFAULT nextval('public.emails_id_seq'::regclass);


--
-- Name: errors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.errors ALTER COLUMN id SET DEFAULT nextval('public.errors_id_seq'::regclass);


--
-- Name: experience_layer id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experience_layer ALTER COLUMN id SET DEFAULT nextval('public.experience_layer_id_seq'::regclass);


--
-- Name: governance_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.governance_metrics ALTER COLUMN id SET DEFAULT nextval('public.governance_metrics_id_seq'::regclass);


--
-- Name: hierarchy_layer_configurations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hierarchy_layer_configurations ALTER COLUMN id SET DEFAULT nextval('public.hierarchy_layer_configurations_id_seq'::regclass);


--
-- Name: incidents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents ALTER COLUMN id SET DEFAULT nextval('public.incidents_id_seq'::regclass);


--
-- Name: meta_brain_layer id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meta_brain_layer ALTER COLUMN id SET DEFAULT nextval('public.meta_brain_layer_id_seq'::regclass);


--
-- Name: meta_brain_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meta_brain_settings ALTER COLUMN id SET DEFAULT nextval('public.meta_brain_settings_id_seq'::regclass);


--
-- Name: orchestration_workflows id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orchestration_workflows ALTER COLUMN id SET DEFAULT nextval('public.orchestration_workflows_id_seq'::regclass);


--
-- Name: persona_briefings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persona_briefings ALTER COLUMN id SET DEFAULT nextval('public.persona_briefings_id_seq'::regclass);


--
-- Name: personalization_configs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personalization_configs ALTER COLUMN id SET DEFAULT nextval('public.personalization_configs_id_seq'::regclass);


--
-- Name: risk_assessments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risk_assessments ALTER COLUMN id SET DEFAULT nextval('public.risk_assessments_id_seq'::regclass);


--
-- Name: role_personas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_personas ALTER COLUMN id SET DEFAULT nextval('public.role_personas_id_seq'::regclass);


--
-- Name: step_definitions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.step_definitions ALTER COLUMN id SET DEFAULT nextval('public.step_definitions_id_seq'::regclass);


--
-- Name: step_form_submissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.step_form_submissions ALTER COLUMN id SET DEFAULT nextval('public.step_form_submissions_id_seq'::regclass);


--
-- Name: submissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions ALTER COLUMN id SET DEFAULT nextval('public.submissions_id_seq'::regclass);


--
-- Name: system_integrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_integrations ALTER COLUMN id SET DEFAULT nextval('public.system_integrations_id_seq'::regclass);


--
-- Name: tab_configurations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tab_configurations ALTER COLUMN id SET DEFAULT nextval('public.tab_configurations_id_seq'::regclass);


--
-- Name: templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates ALTER COLUMN id SET DEFAULT nextval('public.templates_id_seq'::regclass);


--
-- Name: user_journey_heatmaps id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_journey_heatmaps ALTER COLUMN id SET DEFAULT nextval('public.user_journey_heatmaps_id_seq'::regclass);


--
-- Name: user_journey_interactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_journey_interactions ALTER COLUMN id SET DEFAULT nextval('public.user_journey_interactions_id_seq'::regclass);


--
-- Name: user_journey_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_journey_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_journey_sessions_id_seq'::regclass);


--
-- Name: user_preferences id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences ALTER COLUMN id SET DEFAULT nextval('public.user_preferences_id_seq'::regclass);


--
-- Name: user_profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles ALTER COLUMN id SET DEFAULT nextval('public.user_profiles_id_seq'::regclass);


--
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- Name: voice_transcripts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_transcripts ALTER COLUMN id SET DEFAULT nextval('public.voice_transcripts_id_seq'::regclass);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: agent_dependencies agent_dependencies_agent_id_depends_on_agent_id_dependency__key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_dependencies
    ADD CONSTRAINT agent_dependencies_agent_id_depends_on_agent_id_dependency__key UNIQUE (agent_id, depends_on_agent_id, dependency_type);


--
-- Name: agent_dependencies agent_dependencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_dependencies
    ADD CONSTRAINT agent_dependencies_pkey PRIMARY KEY (id);


--
-- Name: agent_execution_logs agent_execution_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_execution_logs
    ADD CONSTRAINT agent_execution_logs_pkey PRIMARY KEY (id);


--
-- Name: agent_execution_steps agent_execution_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_execution_steps
    ADD CONSTRAINT agent_execution_steps_pkey PRIMARY KEY (id);


--
-- Name: agent_executions agent_executions_execution_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_executions
    ADD CONSTRAINT agent_executions_execution_id_key UNIQUE (execution_id);


--
-- Name: agent_executions agent_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_executions
    ADD CONSTRAINT agent_executions_pkey PRIMARY KEY (id);


--
-- Name: agent_resource_usage agent_resource_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_resource_usage
    ADD CONSTRAINT agent_resource_usage_pkey PRIMARY KEY (id);


--
-- Name: agent_templates agent_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_templates
    ADD CONSTRAINT agent_templates_pkey PRIMARY KEY (id);


--
-- Name: agent_versions agent_versions_agent_id_version_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_versions
    ADD CONSTRAINT agent_versions_agent_id_version_number_key UNIQUE (agent_id, version);


--
-- Name: agent_versions agent_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_versions
    ADD CONSTRAINT agent_versions_pkey PRIMARY KEY (id);


--
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);


--
-- Name: ai_commands ai_commands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_commands
    ADD CONSTRAINT ai_commands_pkey PRIMARY KEY (id);


--
-- Name: ai_models ai_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_models
    ADD CONSTRAINT ai_models_pkey PRIMARY KEY (id);


--
-- Name: audit_trails audit_trails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_trails
    ADD CONSTRAINT audit_trails_pkey PRIMARY KEY (id);


--
-- Name: business_rules business_rules_key_version_scope_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_rules
    ADD CONSTRAINT business_rules_key_version_scope_unique UNIQUE (rule_key, version, persona, agent_id, workflow_id);


--
-- Name: business_rules business_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_rules
    ADD CONSTRAINT business_rules_pkey PRIMARY KEY (id);


--
-- Name: commands commands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commands
    ADD CONSTRAINT commands_pkey PRIMARY KEY (id);


--
-- Name: commercial_property_cope_data commercial_property_cope_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commercial_property_cope_data
    ADD CONSTRAINT commercial_property_cope_data_pkey PRIMARY KEY (id);


--
-- Name: commercial_property_cope_data commercial_property_cope_data_submission_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commercial_property_cope_data
    ADD CONSTRAINT commercial_property_cope_data_submission_id_unique UNIQUE (submission_id);


--
-- Name: commercial_property_submissions commercial_property_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commercial_property_submissions
    ADD CONSTRAINT commercial_property_submissions_pkey PRIMARY KEY (id);


--
-- Name: commercial_property_submissions commercial_property_submissions_submission_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commercial_property_submissions
    ADD CONSTRAINT commercial_property_submissions_submission_id_unique UNIQUE (submission_id);


--
-- Name: commercial_property_workflows commercial_property_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commercial_property_workflows
    ADD CONSTRAINT commercial_property_workflows_pkey PRIMARY KEY (id);


--
-- Name: commercial_property_workflows commercial_property_workflows_submission_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commercial_property_workflows
    ADD CONSTRAINT commercial_property_workflows_submission_id_unique UNIQUE (submission_id);


--
-- Name: component_feature_configurations component_feature_configurations_key_version_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.component_feature_configurations
    ADD CONSTRAINT component_feature_configurations_key_version_unique UNIQUE (feature_key, version);


--
-- Name: component_feature_configurations component_feature_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.component_feature_configurations
    ADD CONSTRAINT component_feature_configurations_pkey PRIMARY KEY (id);


--
-- Name: config_change_logs config_change_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_change_logs
    ADD CONSTRAINT config_change_logs_pkey PRIMARY KEY (id);


--
-- Name: config_registry config_registry_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_registry
    ADD CONSTRAINT config_registry_key_unique UNIQUE (key);


--
-- Name: config_registry config_registry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_registry
    ADD CONSTRAINT config_registry_pkey PRIMARY KEY (id);


--
-- Name: config_snapshots config_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_snapshots
    ADD CONSTRAINT config_snapshots_pkey PRIMARY KEY (id);


--
-- Name: config_values config_values_key_version_scope_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_values
    ADD CONSTRAINT config_values_key_version_scope_unique UNIQUE (config_key, version, persona, agent_id, workflow_id);


--
-- Name: config_values config_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_values
    ADD CONSTRAINT config_values_pkey PRIMARY KEY (id);


--
-- Name: dashboard_kpis dashboard_kpis_kpi_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_kpis
    ADD CONSTRAINT dashboard_kpis_kpi_name_unique UNIQUE (kpi_name);


--
-- Name: dashboard_kpis dashboard_kpis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_kpis
    ADD CONSTRAINT dashboard_kpis_pkey PRIMARY KEY (id);


--
-- Name: data_prep_layers data_prep_layers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_prep_layers
    ADD CONSTRAINT data_prep_layers_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_template_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_template_id_unique UNIQUE (template_id);


--
-- Name: emails emails_message_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emails
    ADD CONSTRAINT emails_message_id_unique UNIQUE (message_id);


--
-- Name: emails emails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emails
    ADD CONSTRAINT emails_pkey PRIMARY KEY (id);


--
-- Name: errors errors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.errors
    ADD CONSTRAINT errors_pkey PRIMARY KEY (id);


--
-- Name: experience_layer experience_layer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experience_layer
    ADD CONSTRAINT experience_layer_pkey PRIMARY KEY (id);


--
-- Name: governance_metrics governance_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.governance_metrics
    ADD CONSTRAINT governance_metrics_pkey PRIMARY KEY (id);


--
-- Name: hierarchy_layer_configurations hierarchy_layer_configurations_key_version_scope_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hierarchy_layer_configurations
    ADD CONSTRAINT hierarchy_layer_configurations_key_version_scope_unique UNIQUE (layer_key, version, persona, agent_id, workflow_id);


--
-- Name: hierarchy_layer_configurations hierarchy_layer_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hierarchy_layer_configurations
    ADD CONSTRAINT hierarchy_layer_configurations_pkey PRIMARY KEY (id);


--
-- Name: incidents incidents_incident_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_incident_id_unique UNIQUE (incident_id);


--
-- Name: incidents incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_pkey PRIMARY KEY (id);


--
-- Name: meta_brain_layer meta_brain_layer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meta_brain_layer
    ADD CONSTRAINT meta_brain_layer_pkey PRIMARY KEY (id);


--
-- Name: meta_brain_settings meta_brain_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meta_brain_settings
    ADD CONSTRAINT meta_brain_settings_pkey PRIMARY KEY (id);


--
-- Name: meta_brain_settings meta_brain_settings_setting_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meta_brain_settings
    ADD CONSTRAINT meta_brain_settings_setting_name_unique UNIQUE (setting_name);


--
-- Name: orchestration_workflows orchestration_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orchestration_workflows
    ADD CONSTRAINT orchestration_workflows_pkey PRIMARY KEY (id);


--
-- Name: persona_briefings persona_briefings_persona_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persona_briefings
    ADD CONSTRAINT persona_briefings_persona_unique UNIQUE (persona);


--
-- Name: persona_briefings persona_briefings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persona_briefings
    ADD CONSTRAINT persona_briefings_pkey PRIMARY KEY (id);


--
-- Name: personalization_configs personalization_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personalization_configs
    ADD CONSTRAINT personalization_configs_pkey PRIMARY KEY (id);


--
-- Name: risk_assessments risk_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risk_assessments
    ADD CONSTRAINT risk_assessments_pkey PRIMARY KEY (id);


--
-- Name: role_personas role_personas_persona_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_personas
    ADD CONSTRAINT role_personas_persona_key_key UNIQUE (persona_key);


--
-- Name: role_personas role_personas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_personas
    ADD CONSTRAINT role_personas_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: step_definitions step_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.step_definitions
    ADD CONSTRAINT step_definitions_pkey PRIMARY KEY (id);


--
-- Name: step_form_submissions step_form_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.step_form_submissions
    ADD CONSTRAINT step_form_submissions_pkey PRIMARY KEY (id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: submissions submissions_submission_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_submission_id_unique UNIQUE (submission_id);


--
-- Name: system_integrations system_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_integrations
    ADD CONSTRAINT system_integrations_pkey PRIMARY KEY (id);


--
-- Name: tab_configurations tab_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tab_configurations
    ADD CONSTRAINT tab_configurations_pkey PRIMARY KEY (id);


--
-- Name: tab_configurations tab_configurations_tab_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tab_configurations
    ADD CONSTRAINT tab_configurations_tab_key_unique UNIQUE (tab_key);


--
-- Name: templates templates_key_version_scope_channel_locale_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_key_version_scope_channel_locale_unique UNIQUE (template_key, version, persona, agent_id, workflow_id, channel, locale);


--
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);


--
-- Name: user_journey_heatmaps user_journey_heatmaps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_journey_heatmaps
    ADD CONSTRAINT user_journey_heatmaps_pkey PRIMARY KEY (id);


--
-- Name: user_journey_interactions user_journey_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_journey_interactions
    ADD CONSTRAINT user_journey_interactions_pkey PRIMARY KEY (id);


--
-- Name: user_journey_sessions user_journey_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_journey_sessions
    ADD CONSTRAINT user_journey_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_journey_sessions user_journey_sessions_session_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_journey_sessions
    ADD CONSTRAINT user_journey_sessions_session_id_unique UNIQUE (session_id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_user_id_persona_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_persona_unique UNIQUE (user_id, persona);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_user_id_persona_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_persona_unique UNIQUE (user_id, persona);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: voice_transcripts voice_transcripts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_transcripts
    ADD CONSTRAINT voice_transcripts_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: idx_ai_models_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_models_status ON public.ai_models USING btree (deployment_status);


--
-- Name: idx_ai_models_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_models_type ON public.ai_models USING btree (model_type);


--
-- Name: idx_audit_trails_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_trails_date ON public.audit_trails USING btree (audit_date);


--
-- Name: idx_audit_trails_eu_audit_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_trails_eu_audit_type ON public.audit_trails USING btree (eu_ai_act_audit_type);


--
-- Name: idx_audit_trails_eu_compliance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_trails_eu_compliance ON public.audit_trails USING btree (eu_ai_act_compliance_status);


--
-- Name: idx_audit_trails_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_trails_type ON public.audit_trails USING btree (audit_type);


--
-- Name: idx_business_rules_as_of_query; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_rules_as_of_query ON public.business_rules USING btree (rule_key, persona, agent_id, workflow_id, is_active, effective_from, rule_engine);


--
-- Name: idx_business_rules_current_scope; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_rules_current_scope ON public.business_rules USING btree (rule_key, persona, agent_id, workflow_id, is_active);


--
-- Name: idx_business_rules_effective_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_rules_effective_dates ON public.business_rules USING btree (effective_from, effective_to);


--
-- Name: idx_business_rules_engine; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_rules_engine ON public.business_rules USING btree (rule_engine);


--
-- Name: idx_business_rules_scope_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_rules_scope_active ON public.business_rules USING btree (persona, agent_id, workflow_id, is_active);


--
-- Name: idx_config_change_logs_config_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_change_logs_config_key ON public.config_change_logs USING btree (config_key);


--
-- Name: idx_config_change_logs_config_scope; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_change_logs_config_scope ON public.config_change_logs USING btree (config_key, config_type);


--
-- Name: idx_config_change_logs_operation_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_change_logs_operation_type ON public.config_change_logs USING btree (operation_type);


--
-- Name: idx_config_change_logs_performed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_change_logs_performed_by ON public.config_change_logs USING btree (performed_by);


--
-- Name: idx_config_change_logs_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_change_logs_timestamp ON public.config_change_logs USING btree ("timestamp");


--
-- Name: idx_config_registry_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_registry_category ON public.config_registry USING btree (category);


--
-- Name: idx_config_registry_scope_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_registry_scope_category ON public.config_registry USING btree (scope, category);


--
-- Name: idx_config_registry_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_registry_type ON public.config_registry USING btree (type);


--
-- Name: idx_config_snapshots_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_snapshots_created_at ON public.config_snapshots USING btree (created_at);


--
-- Name: idx_config_snapshots_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_snapshots_created_by ON public.config_snapshots USING btree (created_by);


--
-- Name: idx_config_values_as_of_query; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_values_as_of_query ON public.config_values USING btree (config_key, persona, agent_id, workflow_id, is_active, effective_from);


--
-- Name: idx_config_values_current_scope; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_values_current_scope ON public.config_values USING btree (config_key, persona, agent_id, workflow_id, is_active);


--
-- Name: idx_config_values_effective_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_values_effective_dates ON public.config_values USING btree (effective_from, effective_to);


--
-- Name: idx_config_values_scope_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_values_scope_active ON public.config_values USING btree (persona, agent_id, workflow_id, is_active);


--
-- Name: idx_governance_metrics_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_governance_metrics_date ON public.governance_metrics USING btree (recorded_date);


--
-- Name: idx_governance_metrics_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_governance_metrics_type ON public.governance_metrics USING btree (metric_type);


--
-- Name: idx_risk_assessments_eu_compliance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_risk_assessments_eu_compliance ON public.risk_assessments USING btree (eu_ai_act_compliance);


--
-- Name: idx_risk_assessments_eu_risk_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_risk_assessments_eu_risk_category ON public.risk_assessments USING btree (eu_ai_act_risk_category);


--
-- Name: idx_risk_assessments_overall_risk; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_risk_assessments_overall_risk ON public.risk_assessments USING btree (overall_risk);


--
-- Name: idx_risk_assessments_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_risk_assessments_target ON public.risk_assessments USING btree (target_type, target_id);


--
-- Name: idx_templates_as_of_query; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_as_of_query ON public.templates USING btree (template_key, channel, locale, persona, agent_id, workflow_id, is_active, effective_from);


--
-- Name: idx_templates_channel_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_channel_active ON public.templates USING btree (channel, is_active);


--
-- Name: idx_templates_current_scope; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_current_scope ON public.templates USING btree (template_key, channel, locale, persona, agent_id, workflow_id, is_active);


--
-- Name: idx_templates_effective_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_effective_dates ON public.templates USING btree (effective_from, effective_to);


--
-- Name: idx_templates_scope_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_scope_active ON public.templates USING btree (persona, agent_id, workflow_id, is_active);


--
-- Name: activities activities_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: agent_dependencies agent_dependencies_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_dependencies
    ADD CONSTRAINT agent_dependencies_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id);


--
-- Name: agent_dependencies agent_dependencies_depends_on_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_dependencies
    ADD CONSTRAINT agent_dependencies_depends_on_agent_id_fkey FOREIGN KEY (depends_on_agent_id) REFERENCES public.agents(id);


--
-- Name: agent_execution_logs agent_execution_logs_execution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_execution_logs
    ADD CONSTRAINT agent_execution_logs_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES public.agent_executions(execution_id);


--
-- Name: agent_execution_logs agent_execution_logs_step_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_execution_logs
    ADD CONSTRAINT agent_execution_logs_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.agent_execution_steps(id);


--
-- Name: agent_execution_steps agent_execution_steps_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_execution_steps
    ADD CONSTRAINT agent_execution_steps_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id);


--
-- Name: agent_execution_steps agent_execution_steps_execution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_execution_steps
    ADD CONSTRAINT agent_execution_steps_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES public.agent_executions(execution_id);


--
-- Name: agent_execution_steps agent_execution_steps_parent_step_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_execution_steps
    ADD CONSTRAINT agent_execution_steps_parent_step_id_fkey FOREIGN KEY (parent_step_id) REFERENCES public.agent_execution_steps(id);


--
-- Name: agent_executions agent_executions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_executions
    ADD CONSTRAINT agent_executions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: agent_resource_usage agent_resource_usage_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_resource_usage
    ADD CONSTRAINT agent_resource_usage_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id);


--
-- Name: agent_versions agent_versions_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_versions
    ADD CONSTRAINT agent_versions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id);


--
-- Name: ai_models ai_models_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_models
    ADD CONSTRAINT ai_models_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: audit_trails audit_trails_auditor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_trails
    ADD CONSTRAINT audit_trails_auditor_id_fkey FOREIGN KEY (auditor_id) REFERENCES public.users(id);


--
-- Name: business_rules business_rules_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_rules
    ADD CONSTRAINT business_rules_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: commands commands_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commands
    ADD CONSTRAINT commands_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: commercial_property_cope_data commercial_property_cope_data_submission_id_commercial_property; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commercial_property_cope_data
    ADD CONSTRAINT commercial_property_cope_data_submission_id_commercial_property FOREIGN KEY (submission_id) REFERENCES public.commercial_property_workflows(submission_id) ON DELETE CASCADE;


--
-- Name: commercial_property_submissions commercial_property_submissions_submission_id_commercial_proper; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commercial_property_submissions
    ADD CONSTRAINT commercial_property_submissions_submission_id_commercial_proper FOREIGN KEY (submission_id) REFERENCES public.commercial_property_workflows(submission_id) ON DELETE CASCADE;


--
-- Name: commercial_property_submissions commercial_property_submissions_workflow_id_commercial_property; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commercial_property_submissions
    ADD CONSTRAINT commercial_property_submissions_workflow_id_commercial_property FOREIGN KEY (workflow_id) REFERENCES public.commercial_property_workflows(id) ON DELETE CASCADE;


--
-- Name: commercial_property_workflows commercial_property_workflows_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commercial_property_workflows
    ADD CONSTRAINT commercial_property_workflows_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: config_change_logs config_change_logs_performed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_change_logs
    ADD CONSTRAINT config_change_logs_performed_by_users_id_fk FOREIGN KEY (performed_by) REFERENCES public.users(id);


--
-- Name: config_change_logs config_change_logs_snapshot_id_config_snapshots_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_change_logs
    ADD CONSTRAINT config_change_logs_snapshot_id_config_snapshots_id_fk FOREIGN KEY (snapshot_id) REFERENCES public.config_snapshots(id);


--
-- Name: config_snapshots config_snapshots_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_snapshots
    ADD CONSTRAINT config_snapshots_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: config_values config_values_config_key_config_registry_key_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_values
    ADD CONSTRAINT config_values_config_key_config_registry_key_fk FOREIGN KEY (config_key) REFERENCES public.config_registry(key);


--
-- Name: config_values config_values_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_values
    ADD CONSTRAINT config_values_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: errors errors_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.errors
    ADD CONSTRAINT errors_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: governance_metrics governance_metrics_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.governance_metrics
    ADD CONSTRAINT governance_metrics_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(id);


--
-- Name: risk_assessments risk_assessments_assessor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risk_assessments
    ADD CONSTRAINT risk_assessments_assessor_id_fkey FOREIGN KEY (assessor_id) REFERENCES public.users(id);


--
-- Name: role_personas role_personas_source_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_personas
    ADD CONSTRAINT role_personas_source_agent_id_fkey FOREIGN KEY (source_agent_id) REFERENCES public.agents(id);


--
-- Name: step_definitions step_definitions_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.step_definitions
    ADD CONSTRAINT step_definitions_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: step_form_submissions step_form_submissions_step_id_step_definitions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.step_form_submissions
    ADD CONSTRAINT step_form_submissions_step_id_step_definitions_id_fk FOREIGN KEY (step_id) REFERENCES public.step_definitions(id);


--
-- Name: step_form_submissions step_form_submissions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.step_form_submissions
    ADD CONSTRAINT step_form_submissions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: templates templates_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: user_journey_heatmaps user_journey_heatmaps_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_journey_heatmaps
    ADD CONSTRAINT user_journey_heatmaps_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_journey_interactions user_journey_interactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_journey_interactions
    ADD CONSTRAINT user_journey_interactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_journey_sessions user_journey_sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_journey_sessions
    ADD CONSTRAINT user_journey_sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_preferences user_preferences_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_profiles user_profiles_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_sessions user_sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: voice_transcripts voice_transcripts_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_transcripts
    ADD CONSTRAINT voice_transcripts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--


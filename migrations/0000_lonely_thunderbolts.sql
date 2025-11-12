CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"activity" text NOT NULL,
	"persona" varchar,
	"status" varchar NOT NULL,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_name" varchar(255) NOT NULL,
	"agent_type" varchar(100) NOT NULL,
	"layer" varchar(100) NOT NULL,
	"description" text,
	"capabilities" jsonb NOT NULL,
	"configuration" jsonb NOT NULL,
	"dependencies" jsonb,
	"is_active" boolean DEFAULT true,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"type" varchar NOT NULL,
	"layer" varchar NOT NULL,
	"config" jsonb,
	"status" varchar DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_commands" (
	"id" serial PRIMARY KEY NOT NULL,
	"command_name" varchar(255) NOT NULL,
	"command_type" varchar(100) NOT NULL,
	"description" text,
	"target_agents" jsonb,
	"parameters" jsonb,
	"execution_count" integer DEFAULT 0,
	"avg_response_time" integer,
	"success_rate" varchar(10) DEFAULT '0',
	"last_executed" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "commands" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"input" text NOT NULL,
	"response" text,
	"mode" varchar NOT NULL,
	"persona" varchar NOT NULL,
	"agent_name" varchar,
	"agent_type" varchar,
	"submission_id" varchar,
	"submission_details" jsonb,
	"executed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dashboard_kpis" (
	"id" serial PRIMARY KEY NOT NULL,
	"kpi_name" varchar(100) NOT NULL,
	"current_value" varchar(100) NOT NULL,
	"previous_value" varchar(100),
	"target" varchar(100),
	"unit" varchar(50),
	"category" varchar(100) NOT NULL,
	"trend" varchar(20) DEFAULT 'stable',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "data_prep_layers" (
	"id" serial PRIMARY KEY NOT NULL,
	"layer_name" varchar(100) NOT NULL,
	"source_system" varchar(100) NOT NULL,
	"data_type" varchar(100) NOT NULL,
	"processing_status" varchar(50) DEFAULT 'ready',
	"records_processed" integer DEFAULT 0,
	"records_total" integer DEFAULT 0,
	"last_processed" timestamp,
	"quality_score" varchar(10) DEFAULT '0',
	"error_count" integer DEFAULT 0,
	"config" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "errors" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"error_type" varchar NOT NULL,
	"error_message" text NOT NULL,
	"context" jsonb,
	"persona" varchar,
	"submission_id" varchar,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"incident_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"priority" varchar DEFAULT 'medium' NOT NULL,
	"status" varchar DEFAULT 'open' NOT NULL,
	"assigned_to" varchar,
	"reported_by" varchar,
	"resolution" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "incidents_incident_id_unique" UNIQUE("incident_id")
);
--> statement-breakpoint
CREATE TABLE "meta_brain_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_name" varchar(100) NOT NULL,
	"setting_value" text NOT NULL,
	"setting_type" varchar(50) DEFAULT 'string',
	"category" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "meta_brain_settings_setting_name_unique" UNIQUE("setting_name")
);
--> statement-breakpoint
CREATE TABLE "orchestration_workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_name" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'active',
	"trigger_type" varchar(100) NOT NULL,
	"trigger_config" jsonb,
	"steps" jsonb NOT NULL,
	"execution_count" integer DEFAULT 0,
	"last_executed" timestamp,
	"avg_execution_time" integer,
	"success_rate" varchar(10) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "personalization_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"insurer_id" integer NOT NULL,
	"role_config" jsonb,
	"workflow_config" jsonb,
	"system_config" jsonb,
	"interface_config" jsonb,
	"branding" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" varchar NOT NULL,
	"broker_name" varchar NOT NULL,
	"client_name" varchar NOT NULL,
	"risk_level" varchar NOT NULL,
	"recommended_line" varchar,
	"details" jsonb,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"assigned_to" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "submissions_submission_id_unique" UNIQUE("submission_id")
);
--> statement-breakpoint
CREATE TABLE "system_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"system_name" varchar(255) NOT NULL,
	"system_type" varchar(100) NOT NULL,
	"connection_status" varchar(50) DEFAULT 'connected',
	"api_endpoint" varchar(500),
	"auth_type" varchar(100),
	"last_sync" timestamp,
	"sync_frequency" varchar(100),
	"records_synced" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"health_score" varchar(10) DEFAULT '100',
	"config" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"active_persona" varchar DEFAULT 'admin' NOT NULL,
	"session_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commands" ADD CONSTRAINT "commands_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "errors" ADD CONSTRAINT "errors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");
-- Critical ConfigService Integrity Constraints Migration
-- Prevents overlapping effective date ranges and ensures production-safe configuration lookup
-- Architect Requirements: tstzrange/GiST exclusion, scope synchronization, deferrable validation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================================
-- 1. DATA INTEGRITY VALIDATION - Check for existing overlaps before constraints
-- ============================================================================

-- Function to detect overlaps in config_values
CREATE OR REPLACE FUNCTION validate_config_values_integrity() RETURNS BOOLEAN AS $$
DECLARE
    overlap_count INTEGER;
BEGIN
    -- Check for overlapping effective date ranges within same scope
    SELECT COUNT(*) INTO overlap_count
    FROM config_values cv1
    INNER JOIN config_values cv2 ON (
        cv1.id != cv2.id
        AND cv1.config_key = cv2.config_key
        AND COALESCE(cv1.persona, '') = COALESCE(cv2.persona, '')
        AND COALESCE(cv1.agent_id, 0) = COALESCE(cv2.agent_id, 0)
        AND COALESCE(cv1.workflow_id, 0) = COALESCE(cv2.workflow_id, 0)
        AND cv1.is_active = true
        AND cv2.is_active = true
        AND cv1.effective_from < COALESCE(cv2.effective_to, 'infinity'::timestamp)
        AND cv2.effective_from < COALESCE(cv1.effective_to, 'infinity'::timestamp)
    );
    
    IF overlap_count > 0 THEN
        RAISE EXCEPTION 'CONFIG_VALUES INTEGRITY VIOLATION: Found % overlapping effective date ranges. Data must be cleaned before applying constraints.', overlap_count;
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to detect overlaps in business_rules
CREATE OR REPLACE FUNCTION validate_business_rules_integrity() RETURNS BOOLEAN AS $$
DECLARE
    overlap_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO overlap_count
    FROM business_rules br1
    INNER JOIN business_rules br2 ON (
        br1.id != br2.id
        AND br1.rule_key = br2.rule_key
        AND COALESCE(br1.persona, '') = COALESCE(br2.persona, '')
        AND COALESCE(br1.agent_id, 0) = COALESCE(br2.agent_id, 0)
        AND COALESCE(br1.workflow_id, 0) = COALESCE(br2.workflow_id, 0)
        AND br1.is_active = true
        AND br2.is_active = true
        AND br1.effective_from < COALESCE(br2.effective_to, 'infinity'::timestamp)
        AND br2.effective_from < COALESCE(br1.effective_to, 'infinity'::timestamp)
    );
    
    IF overlap_count > 0 THEN
        RAISE EXCEPTION 'BUSINESS_RULES INTEGRITY VIOLATION: Found % overlapping effective date ranges. Data must be cleaned before applying constraints.', overlap_count;
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to detect overlaps in templates (including channel/locale dimensions)
CREATE OR REPLACE FUNCTION validate_templates_integrity() RETURNS BOOLEAN AS $$
DECLARE
    overlap_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO overlap_count
    FROM templates t1
    INNER JOIN templates t2 ON (
        t1.id != t2.id
        AND t1.template_key = t2.template_key
        AND t1.channel = t2.channel
        AND t1.locale = t2.locale
        AND COALESCE(t1.persona, '') = COALESCE(t2.persona, '')
        AND COALESCE(t1.agent_id, 0) = COALESCE(t2.agent_id, 0)
        AND COALESCE(t1.workflow_id, 0) = COALESCE(t2.workflow_id, 0)
        AND t1.is_active = true
        AND t2.is_active = true
        AND t1.effective_from < COALESCE(t2.effective_to, 'infinity'::timestamp)
        AND t2.effective_from < COALESCE(t1.effective_to, 'infinity'::timestamp)
    );
    
    IF overlap_count > 0 THEN
        RAISE EXCEPTION 'TEMPLATES INTEGRITY VIOLATION: Found % overlapping effective date ranges. Data must be cleaned before applying constraints.', overlap_count;
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Run integrity validation checks
SELECT validate_config_values_integrity();
SELECT validate_business_rules_integrity();
SELECT validate_templates_integrity();

-- ============================================================================
-- 2. SCOPE SYNCHRONIZATION TRIGGERS - (effective_to IS NULL) ⇔ (is_active = true)
-- ============================================================================

-- Generic scope synchronization trigger function
CREATE OR REPLACE FUNCTION sync_scope_state() RETURNS TRIGGER AS $$
BEGIN
    -- Enforce: (effective_to IS NULL) ⇔ (is_active = true)
    IF NEW.effective_to IS NULL AND NEW.is_active != true THEN
        NEW.is_active := true;
    ELSIF NEW.effective_to IS NOT NULL AND NEW.is_active != false THEN
        NEW.is_active := false;
    END IF;
    
    -- When activating a new record (is_active = true), deactivate overlapping ones
    IF NEW.is_active = true THEN
        IF TG_TABLE_NAME = 'config_values' THEN
            -- Deactivate overlapping config_values
            UPDATE config_values SET 
                is_active = false,
                effective_to = CASE 
                    WHEN effective_to IS NULL THEN NEW.effective_from 
                    ELSE effective_to 
                END
            WHERE id != COALESCE(NEW.id, 0)
              AND config_key = NEW.config_key
              AND COALESCE(persona, '') = COALESCE(NEW.persona, '')
              AND COALESCE(agent_id, 0) = COALESCE(NEW.agent_id, 0)
              AND COALESCE(workflow_id, 0) = COALESCE(NEW.workflow_id, 0)
              AND is_active = true
              AND effective_from < COALESCE(NEW.effective_to, 'infinity'::timestamp)
              AND NEW.effective_from < COALESCE(effective_to, 'infinity'::timestamp);
              
        ELSIF TG_TABLE_NAME = 'business_rules' THEN
            -- Deactivate overlapping business_rules
            UPDATE business_rules SET 
                is_active = false,
                effective_to = CASE 
                    WHEN effective_to IS NULL THEN NEW.effective_from 
                    ELSE effective_to 
                END
            WHERE id != COALESCE(NEW.id, 0)
              AND rule_key = NEW.rule_key
              AND COALESCE(persona, '') = COALESCE(NEW.persona, '')
              AND COALESCE(agent_id, 0) = COALESCE(NEW.agent_id, 0)
              AND COALESCE(workflow_id, 0) = COALESCE(NEW.workflow_id, 0)
              AND is_active = true
              AND effective_from < COALESCE(NEW.effective_to, 'infinity'::timestamp)
              AND NEW.effective_from < COALESCE(effective_to, 'infinity'::timestamp);
              
        ELSIF TG_TABLE_NAME = 'templates' THEN
            -- Deactivate overlapping templates (including channel/locale)
            UPDATE templates SET 
                is_active = false,
                effective_to = CASE 
                    WHEN effective_to IS NULL THEN NEW.effective_from 
                    ELSE effective_to 
                END
            WHERE id != COALESCE(NEW.id, 0)
              AND template_key = NEW.template_key
              AND channel = NEW.channel
              AND locale = NEW.locale
              AND COALESCE(persona, '') = COALESCE(NEW.persona, '')
              AND COALESCE(agent_id, 0) = COALESCE(NEW.agent_id, 0)
              AND COALESCE(workflow_id, 0) = COALESCE(NEW.workflow_id, 0)
              AND is_active = true
              AND effective_from < COALESCE(NEW.effective_to, 'infinity'::timestamp)
              AND NEW.effective_from < COALESCE(effective_to, 'infinity'::timestamp);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply scope synchronization triggers
DROP TRIGGER IF EXISTS config_values_sync_scope ON config_values;
CREATE TRIGGER config_values_sync_scope
    BEFORE INSERT OR UPDATE ON config_values
    FOR EACH ROW EXECUTE FUNCTION sync_scope_state();

DROP TRIGGER IF EXISTS business_rules_sync_scope ON business_rules;
CREATE TRIGGER business_rules_sync_scope
    BEFORE INSERT OR UPDATE ON business_rules
    FOR EACH ROW EXECUTE FUNCTION sync_scope_state();

DROP TRIGGER IF EXISTS templates_sync_scope ON templates;
CREATE TRIGGER templates_sync_scope
    BEFORE INSERT OR UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION sync_scope_state();

-- ============================================================================
-- 3. TSTZRANGE/GiST EXCLUSION CONSTRAINTS - Prevent overlapping date ranges
-- ============================================================================

-- Create exclusion constraints using tstzrange and GiST indexes

-- CONFIG_VALUES exclusion constraint
ALTER TABLE config_values ADD CONSTRAINT config_values_no_overlap_active
    EXCLUDE USING gist (
        config_key WITH =,
        COALESCE(persona, '') WITH =,
        COALESCE(agent_id, 0) WITH =,
        COALESCE(workflow_id, 0) WITH =,
        tstzrange(effective_from, COALESCE(effective_to, 'infinity'::timestamp), '[)') WITH &&
    ) WHERE (is_active = true)
    DEFERRABLE INITIALLY DEFERRED;

-- BUSINESS_RULES exclusion constraint
ALTER TABLE business_rules ADD CONSTRAINT business_rules_no_overlap_active
    EXCLUDE USING gist (
        rule_key WITH =,
        COALESCE(persona, '') WITH =,
        COALESCE(agent_id, 0) WITH =,
        COALESCE(workflow_id, 0) WITH =,
        tstzrange(effective_from, COALESCE(effective_to, 'infinity'::timestamp), '[)') WITH &&
    ) WHERE (is_active = true)
    DEFERRABLE INITIALLY DEFERRED;

-- TEMPLATES exclusion constraint (comprehensive scope including channel/locale)
ALTER TABLE templates ADD CONSTRAINT templates_no_overlap_active
    EXCLUDE USING gist (
        template_key WITH =,
        channel WITH =,
        locale WITH =,
        COALESCE(persona, '') WITH =,
        COALESCE(agent_id, 0) WITH =,
        COALESCE(workflow_id, 0) WITH =,
        tstzrange(effective_from, COALESCE(effective_to, 'infinity'::timestamp), '[)') WITH &&
    ) WHERE (is_active = true)
    DEFERRABLE INITIALLY DEFERRED;

-- ============================================================================
-- 4. DEFERRABLE CONSTRAINT VALIDATION TRIGGERS - Fallback if GiST unavailable
-- ============================================================================

-- Overlap validation trigger function (fallback for GiST constraints)
CREATE OR REPLACE FUNCTION validate_no_overlaps() RETURNS TRIGGER AS $$
DECLARE
    overlap_count INTEGER;
BEGIN
    -- Only validate if the record is active
    IF NEW.is_active != true THEN
        RETURN NEW;
    END IF;
    
    IF TG_TABLE_NAME = 'config_values' THEN
        SELECT COUNT(*) INTO overlap_count
        FROM config_values
        WHERE id != COALESCE(NEW.id, 0)
          AND config_key = NEW.config_key
          AND COALESCE(persona, '') = COALESCE(NEW.persona, '')
          AND COALESCE(agent_id, 0) = COALESCE(NEW.agent_id, 0)
          AND COALESCE(workflow_id, 0) = COALESCE(NEW.workflow_id, 0)
          AND is_active = true
          AND effective_from < COALESCE(NEW.effective_to, 'infinity'::timestamp)
          AND NEW.effective_from < COALESCE(effective_to, 'infinity'::timestamp);
          
    ELSIF TG_TABLE_NAME = 'business_rules' THEN
        SELECT COUNT(*) INTO overlap_count
        FROM business_rules
        WHERE id != COALESCE(NEW.id, 0)
          AND rule_key = NEW.rule_key
          AND COALESCE(persona, '') = COALESCE(NEW.persona, '')
          AND COALESCE(agent_id, 0) = COALESCE(NEW.agent_id, 0)
          AND COALESCE(workflow_id, 0) = COALESCE(NEW.workflow_id, 0)
          AND is_active = true
          AND effective_from < COALESCE(NEW.effective_to, 'infinity'::timestamp)
          AND NEW.effective_from < COALESCE(effective_to, 'infinity'::timestamp);
          
    ELSIF TG_TABLE_NAME = 'templates' THEN
        SELECT COUNT(*) INTO overlap_count
        FROM templates
        WHERE id != COALESCE(NEW.id, 0)
          AND template_key = NEW.template_key
          AND channel = NEW.channel
          AND locale = NEW.locale
          AND COALESCE(persona, '') = COALESCE(NEW.persona, '')
          AND COALESCE(agent_id, 0) = COALESCE(NEW.agent_id, 0)
          AND COALESCE(workflow_id, 0) = COALESCE(NEW.workflow_id, 0)
          AND is_active = true
          AND effective_from < COALESCE(NEW.effective_to, 'infinity'::timestamp)
          AND NEW.effective_from < COALESCE(effective_to, 'infinity'::timestamp);
    END IF;
    
    IF overlap_count > 0 THEN
        RAISE EXCEPTION 'OVERLAP_VALIDATION: Cannot insert/update % record - overlapping effective date range exists for same scope', TG_TABLE_NAME;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply overlap validation triggers (high priority to run after other triggers)
DROP TRIGGER IF EXISTS config_values_validate_overlaps ON config_values;
CREATE CONSTRAINT TRIGGER config_values_validate_overlaps
    AFTER INSERT OR UPDATE ON config_values
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION validate_no_overlaps();

DROP TRIGGER IF EXISTS business_rules_validate_overlaps ON business_rules;
CREATE CONSTRAINT TRIGGER business_rules_validate_overlaps
    AFTER INSERT OR UPDATE ON business_rules
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION validate_no_overlaps();

DROP TRIGGER IF EXISTS templates_validate_overlaps ON templates;
CREATE CONSTRAINT TRIGGER templates_validate_overlaps
    AFTER INSERT OR UPDATE ON templates
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION validate_no_overlaps();

-- ============================================================================
-- 5. ENHANCED INDEXES FOR PERFORMANCE WITH CONSTRAINTS
-- ============================================================================

-- Drop existing indexes that might conflict and recreate optimized ones
DROP INDEX IF EXISTS idx_config_values_as_of_query;
DROP INDEX IF EXISTS idx_business_rules_as_of_query;
DROP INDEX IF EXISTS idx_templates_as_of_query;

-- Enhanced covering indexes for as-of queries with constraint support
CREATE INDEX CONCURRENTLY idx_config_values_as_of_constraint ON config_values 
    USING btree (config_key, COALESCE(persona, ''), COALESCE(agent_id, 0), COALESCE(workflow_id, 0), is_active, effective_from DESC, effective_to)
    WHERE is_active = true;

CREATE INDEX CONCURRENTLY idx_business_rules_as_of_constraint ON business_rules 
    USING btree (rule_key, COALESCE(persona, ''), COALESCE(agent_id, 0), COALESCE(workflow_id, 0), is_active, effective_from DESC, effective_to)
    WHERE is_active = true;

CREATE INDEX CONCURRENTLY idx_templates_as_of_constraint ON templates 
    USING btree (template_key, channel, locale, COALESCE(persona, ''), COALESCE(agent_id, 0), COALESCE(workflow_id, 0), is_active, effective_from DESC, effective_to)
    WHERE is_active = true;

-- ============================================================================
-- 6. INTEGRITY VERIFICATION - Final validation after constraint application
-- ============================================================================

-- Function to verify constraint effectiveness
CREATE OR REPLACE FUNCTION verify_constraints_active() RETURNS BOOLEAN AS $$
DECLARE
    constraint_count INTEGER;
BEGIN
    -- Check that exclusion constraints exist
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints
    WHERE constraint_name IN ('config_values_no_overlap_active', 'business_rules_no_overlap_active', 'templates_no_overlap_active')
      AND constraint_type = 'EXCLUDE';
    
    IF constraint_count != 3 THEN
        RAISE WARNING 'Expected 3 exclusion constraints, found %', constraint_count;
        RETURN FALSE;
    END IF;
    
    -- Check that triggers exist
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.triggers
    WHERE trigger_name IN ('config_values_sync_scope', 'business_rules_sync_scope', 'templates_sync_scope');
    
    IF constraint_count != 3 THEN
        RAISE WARNING 'Expected 3 sync triggers, found %', constraint_count;
        RETURN FALSE;
    END IF;
    
    RAISE NOTICE 'ConfigService integrity constraints successfully applied and verified';
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Verify constraints are active
SELECT verify_constraints_active();

-- ============================================================================
-- 7. CLEANUP - Remove temporary validation functions
-- ============================================================================

DROP FUNCTION IF EXISTS validate_config_values_integrity();
DROP FUNCTION IF EXISTS validate_business_rules_integrity(); 
DROP FUNCTION IF EXISTS validate_templates_integrity();
DROP FUNCTION IF EXISTS verify_constraints_active();

-- Final commit message
DO $$
BEGIN
    RAISE NOTICE '========================================================================================================';
    RAISE NOTICE 'ConfigService Integrity Constraints Migration Complete';
    RAISE NOTICE '- tstzrange/GiST exclusion constraints: ACTIVE (prevents overlapping effective date ranges)';
    RAISE NOTICE '- Scope synchronization triggers: ACTIVE (enforces (effective_to IS NULL) ⇔ (is_active = true))';
    RAISE NOTICE '- Deferrable constraint validation triggers: ACTIVE (fallback overlap detection)';
    RAISE NOTICE '- Comprehensive scope coverage: ACTIVE (includes channel/locale for templates)';
    RAISE NOTICE '- Data integrity validated: PASSED (existing data checked for overlaps)';
    RAISE NOTICE 'ConfigService is now production-safe with unambiguous as-of configuration resolution';
    RAISE NOTICE '========================================================================================================';
END $$;
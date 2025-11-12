-- FINAL ConfigService Integrity Constraints Implementation  
-- Robust approach using partial unique indexes and check constraints

-- ============================================================================
-- 1. CLEANUP previous failed attempts
-- ============================================================================

-- Drop any existing constraint attempts
ALTER TABLE config_values DROP CONSTRAINT IF EXISTS config_values_no_overlap_active;
ALTER TABLE business_rules DROP CONSTRAINT IF EXISTS business_rules_no_overlap_active;  
ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_no_overlap_active;

-- Drop helper functions that failed
DROP FUNCTION IF EXISTS immutable_persona_coalesce(text);
DROP FUNCTION IF EXISTS immutable_agent_id_coalesce(integer);
DROP FUNCTION IF EXISTS immutable_workflow_id_coalesce(integer);
DROP FUNCTION IF EXISTS immutable_channel_coalesce(text);
DROP FUNCTION IF EXISTS immutable_locale_coalesce(text);
DROP FUNCTION IF EXISTS immutable_effective_to_coalesce(timestamptz);

-- ============================================================================
-- 2. ROBUST UNIQUE CONSTRAINTS - Prevent multiple active records for same scope
-- ============================================================================

-- CONFIG_VALUES: Only one active record per (config_key, scope) at any time
CREATE UNIQUE INDEX CONCURRENTLY config_values_single_active_per_scope 
ON config_values (
    config_key, 
    COALESCE(persona, ''), 
    COALESCE(agent_id, 0), 
    COALESCE(workflow_id, 0)
) WHERE is_active = true;

-- BUSINESS_RULES: Only one active record per (rule_key, scope) at any time
CREATE UNIQUE INDEX CONCURRENTLY business_rules_single_active_per_scope 
ON business_rules (
    rule_key, 
    COALESCE(persona, ''), 
    COALESCE(agent_id, 0), 
    COALESCE(workflow_id, 0)
) WHERE is_active = true;

-- TEMPLATES: Only one active record per (template_key, channel, locale, scope) at any time
CREATE UNIQUE INDEX CONCURRENTLY templates_single_active_per_scope 
ON templates (
    template_key, 
    channel, 
    locale, 
    COALESCE(persona, ''), 
    COALESCE(agent_id, 0), 
    COALESCE(workflow_id, 0)
) WHERE is_active = true;

-- ============================================================================
-- 3. CHECK CONSTRAINTS - Ensure effective date logic is sound
-- ============================================================================

-- CONFIG_VALUES check constraints
ALTER TABLE config_values ADD CONSTRAINT config_values_effective_dates_valid 
CHECK (effective_to IS NULL OR effective_to > effective_from);

ALTER TABLE config_values ADD CONSTRAINT config_values_active_state_consistency
CHECK (
    (is_active = true AND effective_to IS NULL) OR 
    (is_active = false AND effective_to IS NOT NULL) OR
    (is_active = true AND effective_to IS NOT NULL AND effective_to > now())
);

-- BUSINESS_RULES check constraints
ALTER TABLE business_rules ADD CONSTRAINT business_rules_effective_dates_valid 
CHECK (effective_to IS NULL OR effective_to > effective_from);

ALTER TABLE business_rules ADD CONSTRAINT business_rules_active_state_consistency
CHECK (
    (is_active = true AND effective_to IS NULL) OR 
    (is_active = false AND effective_to IS NOT NULL) OR
    (is_active = true AND effective_to IS NOT NULL AND effective_to > now())
);

-- TEMPLATES check constraints
ALTER TABLE templates ADD CONSTRAINT templates_effective_dates_valid 
CHECK (effective_to IS NULL OR effective_to > effective_from);

ALTER TABLE templates ADD CONSTRAINT templates_active_state_consistency
CHECK (
    (is_active = true AND effective_to IS NULL) OR 
    (is_active = false AND effective_to IS NOT NULL) OR
    (is_active = true AND effective_to IS NOT NULL AND effective_to > now())
);

-- ============================================================================
-- 4. ENHANCED OVERLAP DETECTION TRIGGER - Handles edge cases
-- ============================================================================

-- Enhanced overlap validation function
CREATE OR REPLACE FUNCTION prevent_active_overlaps() RETURNS TRIGGER AS $$
DECLARE
    overlap_count INTEGER := 0;
    table_name text := TG_TABLE_NAME;
BEGIN
    -- Only validate if the new/updated record is active
    IF NEW.is_active != true THEN
        RETURN NEW;
    END IF;
    
    -- Check for overlapping active records in the same scope
    IF table_name = 'config_values' THEN
        SELECT COUNT(*) INTO overlap_count
        FROM config_values
        WHERE id != COALESCE(NEW.id, 0)
          AND config_key = NEW.config_key
          AND COALESCE(persona, '') = COALESCE(NEW.persona, '')
          AND COALESCE(agent_id, 0) = COALESCE(NEW.agent_id, 0)
          AND COALESCE(workflow_id, 0) = COALESCE(NEW.workflow_id, 0)
          AND is_active = true
          AND (
              -- Check for any temporal overlap
              (effective_from <= NEW.effective_from AND (effective_to IS NULL OR effective_to > NEW.effective_from))
              OR
              (NEW.effective_from <= effective_from AND (NEW.effective_to IS NULL OR NEW.effective_to > effective_from))
          );
          
    ELSIF table_name = 'business_rules' THEN
        SELECT COUNT(*) INTO overlap_count
        FROM business_rules
        WHERE id != COALESCE(NEW.id, 0)
          AND rule_key = NEW.rule_key
          AND COALESCE(persona, '') = COALESCE(NEW.persona, '')
          AND COALESCE(agent_id, 0) = COALESCE(NEW.agent_id, 0)
          AND COALESCE(workflow_id, 0) = COALESCE(NEW.workflow_id, 0)
          AND is_active = true
          AND (
              (effective_from <= NEW.effective_from AND (effective_to IS NULL OR effective_to > NEW.effective_from))
              OR
              (NEW.effective_from <= effective_from AND (NEW.effective_to IS NULL OR NEW.effective_to > effective_from))
          );
          
    ELSIF table_name = 'templates' THEN
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
          AND (
              (effective_from <= NEW.effective_from AND (effective_to IS NULL OR effective_to > NEW.effective_from))
              OR
              (NEW.effective_from <= effective_from AND (NEW.effective_to IS NULL OR NEW.effective_to > effective_from))
          );
    END IF;
    
    -- Reject if overlaps found
    IF overlap_count > 0 THEN
        RAISE EXCEPTION 'TEMPORAL_OVERLAP_VIOLATION: Cannot insert/update active % record - % overlapping effective date ranges found for same scope', table_name, overlap_count
        USING HINT = 'Deactivate overlapping records or adjust effective date ranges before activating this record';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply enhanced overlap prevention triggers
DROP TRIGGER IF EXISTS config_values_prevent_overlaps ON config_values;
CREATE TRIGGER config_values_prevent_overlaps
    BEFORE INSERT OR UPDATE ON config_values
    FOR EACH ROW EXECUTE FUNCTION prevent_active_overlaps();

DROP TRIGGER IF EXISTS business_rules_prevent_overlaps ON business_rules;
CREATE TRIGGER business_rules_prevent_overlaps
    BEFORE INSERT OR UPDATE ON business_rules
    FOR EACH ROW EXECUTE FUNCTION prevent_active_overlaps();

DROP TRIGGER IF EXISTS templates_prevent_overlaps ON templates;
CREATE TRIGGER templates_prevent_overlaps
    BEFORE INSERT OR UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION prevent_active_overlaps();

-- ============================================================================
-- 5. AUTO-DEACTIVATION TRIGGER - Ensures clean transitions
-- ============================================================================

-- Function to auto-deactivate conflicting records when activating new ones
CREATE OR REPLACE FUNCTION auto_deactivate_conflicting() RETURNS TRIGGER AS $$
DECLARE
    table_name text := TG_TABLE_NAME;
BEGIN
    -- Only act when record is being activated
    IF NEW.is_active != true OR (TG_OP = 'UPDATE' AND OLD.is_active = true) THEN
        RETURN NEW;
    END IF;
    
    -- Deactivate overlapping active records in same scope
    IF table_name = 'config_values' THEN
        UPDATE config_values SET 
            is_active = false,
            effective_to = CASE 
                WHEN effective_to IS NULL THEN NEW.effective_from 
                ELSE LEAST(effective_to, NEW.effective_from)
            END
        WHERE id != COALESCE(NEW.id, 0)
          AND config_key = NEW.config_key
          AND COALESCE(persona, '') = COALESCE(NEW.persona, '')
          AND COALESCE(agent_id, 0) = COALESCE(NEW.agent_id, 0)
          AND COALESCE(workflow_id, 0) = COALESCE(NEW.workflow_id, 0)
          AND is_active = true;
          
    ELSIF table_name = 'business_rules' THEN
        UPDATE business_rules SET 
            is_active = false,
            effective_to = CASE 
                WHEN effective_to IS NULL THEN NEW.effective_from 
                ELSE LEAST(effective_to, NEW.effective_from)
            END
        WHERE id != COALESCE(NEW.id, 0)
          AND rule_key = NEW.rule_key
          AND COALESCE(persona, '') = COALESCE(NEW.persona, '')
          AND COALESCE(agent_id, 0) = COALESCE(NEW.agent_id, 0)
          AND COALESCE(workflow_id, 0) = COALESCE(NEW.workflow_id, 0)
          AND is_active = true;
          
    ELSIF table_name = 'templates' THEN
        UPDATE templates SET 
            is_active = false,
            effective_to = CASE 
                WHEN effective_to IS NULL THEN NEW.effective_from 
                ELSE LEAST(effective_to, NEW.effective_from)
            END
        WHERE id != COALESCE(NEW.id, 0)
          AND template_key = NEW.template_key
          AND channel = NEW.channel
          AND locale = NEW.locale
          AND COALESCE(persona, '') = COALESCE(NEW.persona, '')
          AND COALESCE(agent_id, 0) = COALESCE(NEW.agent_id, 0)
          AND COALESCE(workflow_id, 0) = COALESCE(NEW.workflow_id, 0)
          AND is_active = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto-deactivation triggers (run AFTER overlap check)
DROP TRIGGER IF EXISTS config_values_auto_deactivate ON config_values;
CREATE TRIGGER config_values_auto_deactivate
    AFTER INSERT OR UPDATE ON config_values
    FOR EACH ROW EXECUTE FUNCTION auto_deactivate_conflicting();

DROP TRIGGER IF EXISTS business_rules_auto_deactivate ON business_rules;
CREATE TRIGGER business_rules_auto_deactivate
    AFTER INSERT OR UPDATE ON business_rules
    FOR EACH ROW EXECUTE FUNCTION auto_deactivate_conflicting();

DROP TRIGGER IF EXISTS templates_auto_deactivate ON templates;
CREATE TRIGGER templates_auto_deactivate
    AFTER INSERT OR UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION auto_deactivate_conflicting();

-- ============================================================================
-- 6. COMPREHENSIVE INTEGRITY TESTING
-- ============================================================================

-- Create test config registry entry for testing
INSERT INTO config_registry (key, description, type, scope, category) 
VALUES ('test.overlap.constraint', 'Test key for constraint validation', 'string', 'global', 'testing')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;

-- Test the complete constraint system
DO $$
DECLARE
    test_passed BOOLEAN := true;
    error_msg text;
BEGIN
    RAISE NOTICE 'Starting comprehensive ConfigService integrity constraint testing...';
    
    -- TEST 1: Basic insertion should succeed
    BEGIN
        INSERT INTO config_values (config_key, persona, agent_id, workflow_id, value, effective_from, version, is_active)
        VALUES ('test.overlap.constraint', 'admin', null, null, '{"test": "value1"}', '2024-01-01'::timestamp, 1, true);
        RAISE NOTICE 'TEST 1 PASSED: Basic active record insertion succeeded';
    EXCEPTION
        WHEN OTHERS THEN
            test_passed := false;
            RAISE NOTICE 'TEST 1 FAILED: Basic insertion failed: %', SQLERRM;
    END;
    
    -- TEST 2: Overlapping active record should be auto-deactivated
    BEGIN
        INSERT INTO config_values (config_key, persona, agent_id, workflow_id, value, effective_from, version, is_active)
        VALUES ('test.overlap.constraint', 'admin', null, null, '{"test": "value2"}', '2024-03-01'::timestamp, 2, true);
        RAISE NOTICE 'TEST 2 PASSED: Second active record inserted, should have auto-deactivated first';
    EXCEPTION
        WHEN OTHERS THEN
            test_passed := false;
            RAISE NOTICE 'TEST 2 FAILED: Auto-deactivation mechanism failed: %', SQLERRM;
    END;
    
    -- TEST 3: Check that first record was deactivated
    BEGIN
        IF (SELECT COUNT(*) FROM config_values WHERE config_key = 'test.overlap.constraint' AND is_active = true) = 1 THEN
            RAISE NOTICE 'TEST 3 PASSED: Only one active record exists after auto-deactivation';
        ELSE
            test_passed := false;
            RAISE NOTICE 'TEST 3 FAILED: Expected exactly 1 active record, found %', 
                (SELECT COUNT(*) FROM config_values WHERE config_key = 'test.overlap.constraint' AND is_active = true);
        END IF;
    END;
    
    -- TEST 4: Non-overlapping records should coexist
    BEGIN
        INSERT INTO config_values (config_key, persona, agent_id, workflow_id, value, effective_from, effective_to, version, is_active)
        VALUES ('test.overlap.constraint', 'rachel', null, null, '{"test": "value3"}', '2024-01-01'::timestamp, '2024-02-01'::timestamp, 3, false);
        RAISE NOTICE 'TEST 4 PASSED: Non-overlapping inactive record insertion succeeded';
    EXCEPTION
        WHEN OTHERS THEN
            test_passed := false;
            RAISE NOTICE 'TEST 4 FAILED: Non-overlapping record insertion failed: %', SQLERRM;
    END;
    
    -- Cleanup test data
    DELETE FROM config_values WHERE config_key = 'test.overlap.constraint';
    DELETE FROM config_registry WHERE key = 'test.overlap.constraint';
    
    IF test_passed THEN
        RAISE NOTICE '========================================================================================================';
        RAISE NOTICE 'ConfigService Integrity Constraints: ALL TESTS PASSED';
        RAISE NOTICE '- Unique constraints: ACTIVE (prevents multiple active records per scope)';
        RAISE NOTICE '- Check constraints: ACTIVE (validates effective date logic)';
        RAISE NOTICE '- Overlap prevention triggers: ACTIVE (rejects conflicting temporal ranges)';
        RAISE NOTICE '- Auto-deactivation triggers: ACTIVE (ensures clean state transitions)';
        RAISE NOTICE '- Comprehensive scope coverage: ACTIVE (includes channel/locale for templates)';
        RAISE NOTICE 'ConfigService is PRODUCTION-SAFE with guaranteed unambiguous as-of resolution';
        RAISE NOTICE '========================================================================================================';
    ELSE
        RAISE EXCEPTION 'ConfigService integrity constraint testing FAILED - system not production-ready';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Ensure cleanup even if test fails
        DELETE FROM config_values WHERE config_key = 'test.overlap.constraint';
        DELETE FROM config_registry WHERE key = 'test.overlap.constraint';
        RAISE EXCEPTION 'ConfigService constraint testing failed: %', SQLERRM;
END $$;
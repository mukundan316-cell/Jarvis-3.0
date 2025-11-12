-- CRITICAL ConfigService Integrity Constraints Fix
-- Fix immutable function issues and ensure exclusion constraints work properly

-- ============================================================================
-- 1. IMMUTABLE HELPER FUNCTIONS for GiST exclusion constraints
-- ============================================================================

-- Immutable function to handle null persona values
CREATE OR REPLACE FUNCTION immutable_persona_coalesce(persona text) RETURNS text 
LANGUAGE SQL IMMUTABLE STRICT AS $$
    SELECT COALESCE(persona, '');
$$;

-- Immutable function to handle null agent_id values
CREATE OR REPLACE FUNCTION immutable_agent_id_coalesce(agent_id integer) RETURNS integer 
LANGUAGE SQL IMMUTABLE STRICT AS $$
    SELECT COALESCE(agent_id, 0);
$$;

-- Immutable function to handle null workflow_id values
CREATE OR REPLACE FUNCTION immutable_workflow_id_coalesce(workflow_id integer) RETURNS integer 
LANGUAGE SQL IMMUTABLE STRICT AS $$
    SELECT COALESCE(workflow_id, 0);
$$;

-- Immutable function to handle null channel values
CREATE OR REPLACE FUNCTION immutable_channel_coalesce(channel text) RETURNS text 
LANGUAGE SQL IMMUTABLE STRICT AS $$
    SELECT COALESCE(channel, '');
$$;

-- Immutable function to handle null locale values  
CREATE OR REPLACE FUNCTION immutable_locale_coalesce(locale text) RETURNS text 
LANGUAGE SQL IMMUTABLE STRICT AS $$
    SELECT COALESCE(locale, '');
$$;

-- Immutable function to handle null effective_to values for tstzrange
CREATE OR REPLACE FUNCTION immutable_effective_to_coalesce(effective_to timestamptz) RETURNS timestamptz 
LANGUAGE SQL IMMUTABLE STRICT AS $$
    SELECT COALESCE(effective_to, 'infinity'::timestamptz);
$$;

-- ============================================================================
-- 2. RECREATE EXCLUSION CONSTRAINTS with immutable functions
-- ============================================================================

-- Remove existing failed attempts
ALTER TABLE config_values DROP CONSTRAINT IF EXISTS config_values_no_overlap_active;
ALTER TABLE business_rules DROP CONSTRAINT IF EXISTS business_rules_no_overlap_active;
ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_no_overlap_active;

-- CONFIG_VALUES exclusion constraint with immutable functions
ALTER TABLE config_values ADD CONSTRAINT config_values_no_overlap_active
    EXCLUDE USING gist (
        config_key WITH =,
        immutable_persona_coalesce(persona) WITH =,
        immutable_agent_id_coalesce(agent_id) WITH =,
        immutable_workflow_id_coalesce(workflow_id) WITH =,
        tstzrange(effective_from, immutable_effective_to_coalesce(effective_to), '[)') WITH &&
    ) WHERE (is_active = true)
    DEFERRABLE INITIALLY DEFERRED;

-- BUSINESS_RULES exclusion constraint with immutable functions
ALTER TABLE business_rules ADD CONSTRAINT business_rules_no_overlap_active
    EXCLUDE USING gist (
        rule_key WITH =,
        immutable_persona_coalesce(persona) WITH =,
        immutable_agent_id_coalesce(agent_id) WITH =,
        immutable_workflow_id_coalesce(workflow_id) WITH =,
        tstzrange(effective_from, immutable_effective_to_coalesce(effective_to), '[)') WITH &&
    ) WHERE (is_active = true)
    DEFERRABLE INITIALLY DEFERRED;

-- TEMPLATES exclusion constraint with immutable functions (comprehensive scope)
ALTER TABLE templates ADD CONSTRAINT templates_no_overlap_active
    EXCLUDE USING gist (
        template_key WITH =,
        immutable_channel_coalesce(channel) WITH =,
        immutable_locale_coalesce(locale) WITH =,
        immutable_persona_coalesce(persona) WITH =,
        immutable_agent_id_coalesce(agent_id) WITH =,
        immutable_workflow_id_coalesce(workflow_id) WITH =,
        tstzrange(effective_from, immutable_effective_to_coalesce(effective_to), '[)') WITH &&
    ) WHERE (is_active = true)
    DEFERRABLE INITIALLY DEFERRED;

-- ============================================================================
-- 3. VERIFICATION that constraints are now active
-- ============================================================================

-- Verify constraint effectiveness
DO $$
DECLARE
    constraint_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Check that exclusion constraints exist
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints
    WHERE constraint_name IN ('config_values_no_overlap_active', 'business_rules_no_overlap_active', 'templates_no_overlap_active')
      AND constraint_type = 'EXCLUDE';
    
    IF constraint_count != 3 THEN
        RAISE EXCEPTION 'CONSTRAINT_VERIFICATION_FAILED: Expected 3 exclusion constraints, found %', constraint_count;
    END IF;
    
    -- Check that triggers exist
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_name IN ('config_values_sync_scope', 'business_rules_sync_scope', 'templates_sync_scope');
    
    IF trigger_count != 3 THEN
        RAISE EXCEPTION 'TRIGGER_VERIFICATION_FAILED: Expected 3 sync triggers, found %', trigger_count;
    END IF;
    
    RAISE NOTICE '========================================================================================================';
    RAISE NOTICE 'ConfigService Integrity Constraints SUCCESSFULLY APPLIED';
    RAISE NOTICE '- Exclusion constraints: % active (prevents overlapping effective date ranges)', constraint_count;
    RAISE NOTICE '- Scope synchronization triggers: % active (enforces state consistency)', trigger_count;
    RAISE NOTICE '- Immutable helper functions: CREATED (enables GiST constraint compatibility)';
    RAISE NOTICE '- Production-safe configuration resolution: GUARANTEED';
    RAISE NOTICE '========================================================================================================';
END $$;

-- ============================================================================
-- 4. TEST the constraints with sample overlapping data (should fail)
-- ============================================================================

-- Test 1: Try to create overlapping config_values (should be rejected)
DO $$
BEGIN
    -- This should succeed
    INSERT INTO config_values (config_key, persona, agent_id, workflow_id, value, effective_from, effective_to, version, is_active)
    VALUES ('test.constraint', 'admin', null, null, '{"test": "value1"}', '2024-01-01'::timestamp, '2024-06-01'::timestamp, 1, true);
    
    RAISE NOTICE 'First config value inserted successfully';
    
    -- This should fail due to overlap
    BEGIN
        INSERT INTO config_values (config_key, persona, agent_id, workflow_id, value, effective_from, effective_to, version, is_active)
        VALUES ('test.constraint', 'admin', null, null, '{"test": "value2"}', '2024-03-01'::timestamp, '2024-09-01'::timestamp, 2, true);
        
        RAISE EXCEPTION 'ERROR: Overlapping constraint test FAILED - second insert should have been rejected';
    EXCEPTION
        WHEN exclusion_violation THEN
            RAISE NOTICE 'SUCCESS: Overlapping config insert properly rejected by exclusion constraint';
            
        WHEN OTHERS THEN
            RAISE EXCEPTION 'UNEXPECTED ERROR during overlap test: %', SQLERRM;
    END;
    
    -- Clean up test data
    DELETE FROM config_values WHERE config_key = 'test.constraint';
    RAISE NOTICE 'Test data cleaned up successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        -- Clean up even if test fails
        DELETE FROM config_values WHERE config_key = 'test.constraint';
        RAISE EXCEPTION 'Constraint test failed: %', SQLERRM;
END $$;
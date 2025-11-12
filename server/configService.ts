import { db } from './db';
import { 
  configRegistry, 
  configValues, 
  businessRules, 
  templates,
  configSnapshots,
  configChangeLogs,
  type ConfigRegistry,
  type ConfigValue,
  type BusinessRule,
  type Template,
  type ConfigSnapshot,
  type ConfigChangeLog,
  type InsertConfigSnapshot,
  type InsertConfigChangeLog
} from '@shared/schema';
import { eq, and, isNull, lte, or, gt, desc, inArray, between, count } from 'drizzle-orm';
import { LRUCache } from 'lru-cache';

// Configuration service for eliminating hardcoded values per replit.md "NO HARD-CODING" principle

interface ScopeIdentifiers {
  persona?: string;
  agentId?: number;
  workflowId?: number;
}

interface RollbackResult {
  success: boolean;
  affectedCount: number;
  changeLogId: number;
  rollbackVersion?: number;
  rollbackDate?: Date;
  errorDetails?: any;
  executionTimeMs: number;
}

interface VersionHistoryEntry {
  version: number;
  value: any;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  createdBy?: string;
  updatedAt: Date;
}

interface ChangeHistoryEntry {
  changeLogId: number;
  operationType: string;
  previousState: any;
  newState: any;
  performedBy: string;
  reason?: string;
  timestamp: Date;
  success: boolean;
}

interface SnapshotMetrics {
  configValues: number;
  businessRules: number;
  templates: number;
  totalSize: number;
}

interface RollbackValidation {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  affectedConfigs: string[];
  impactAssessment: {
    scope: ScopeIdentifiers;
    configCount: number;
    ruleCount: number;
    templateCount: number;
  };
}

// LRU cache for configuration values
const configCache = new LRUCache<string, any>({
  max: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes TTL
});

export class ConfigService {
  /**
   * Generate all possible scope combinations in order of precedence
   * Most specific combinations first, global last
   */
  private static generateScopeCombinations(scope: ScopeIdentifiers): ScopeIdentifiers[] {
    const { workflowId, agentId, persona } = scope;
    const combinations: ScopeIdentifiers[] = [];
    
    // Generate all 2^3 = 8 combinations in order of precedence
    const workflowValues = workflowId ? [workflowId, undefined] : [undefined];
    const agentValues = agentId ? [agentId, undefined] : [undefined];
    const personaValues = persona ? [persona, undefined] : [undefined];
    
    // Create combinations prioritizing the presence of values
    for (const w of workflowValues) {
      for (const a of agentValues) {
        for (const p of personaValues) {
          combinations.push({
            workflowId: w,
            agentId: a,
            persona: p
          });
        }
      }
    }
    
    // Sort by precedence: count non-null values (higher count = higher precedence)
    return combinations.sort((a, b) => {
      const scoreA = (a.workflowId ? 1 : 0) + (a.agentId ? 1 : 0) + (a.persona ? 1 : 0);
      const scoreB = (b.workflowId ? 1 : 0) + (b.agentId ? 1 : 0) + (b.persona ? 1 : 0);
      return scoreB - scoreA; // Higher score first
    });
  }

  /**
   * Get configuration setting with scope precedence (workflow > agent > persona > global)
   * @param key Configuration key 
   * @param scope Scope identifiers for precedence resolution
   * @param asOf Effective date (defaults to now)
   * @returns Configuration value with proper type casting
   */
  static async getSetting<T = any>(
    key: string, 
    scope: ScopeIdentifiers = {}, 
    asOf: Date = new Date()
  ): Promise<T | null> {
    // Improve cache effectiveness by not including exact timestamps for current lookups
    const isCurrentLookup = Math.abs(asOf.getTime() - Date.now()) < 1000; // Within 1 second
    const cacheKey = isCurrentLookup 
      ? `config:${key}:${JSON.stringify(scope)}:current`
      : `config:${key}:${JSON.stringify(scope)}:${asOf.getTime()}`;
    
    const cached = configCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      // Generate all scope combinations in precedence order
      const scopeCombinations = this.generateScopeCombinations(scope);

      // Try each scope combination in order
      for (const scopeQuery of scopeCombinations) {
        const result = await db
          .select()
          .from(configValues)
          .where(
            and(
              eq(configValues.configKey, key),
              scopeQuery.persona 
                ? eq(configValues.persona, scopeQuery.persona) 
                : isNull(configValues.persona),
              scopeQuery.agentId 
                ? eq(configValues.agentId, scopeQuery.agentId) 
                : isNull(configValues.agentId),
              scopeQuery.workflowId 
                ? eq(configValues.workflowId, scopeQuery.workflowId) 
                : isNull(configValues.workflowId),
              eq(configValues.isActive, true),
              lte(configValues.effectiveFrom, asOf),
              or(
                isNull(configValues.effectiveTo),
                gt(configValues.effectiveTo, asOf)
              )
            )
          )
          .orderBy(desc(configValues.version))
          .limit(1);

        if (result.length > 0) {
          const value = result[0].value as T;
          configCache.set(cacheKey, value);
          return value;
        }
      }

      // Fallback to registry default
      const registryResult = await db
        .select()
        .from(configRegistry)
        .where(eq(configRegistry.key, key))
        .limit(1);

      if (registryResult.length > 0) {
        const defaultValue = registryResult[0].defaultValue as T;
        configCache.set(cacheKey, defaultValue);
        return defaultValue;
      }

      configCache.set(cacheKey, null);
      return null;
    } catch (error) {
      console.error(`ConfigService.getSetting error for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Get business rule with scope precedence
   * @param ruleKey Rule identifier
   * @param scope Scope identifiers  
   * @param asOf Effective date
   * @returns Business rule or null
   */
  static async getRule(
    ruleKey: string,
    scope: ScopeIdentifiers = {},
    asOf: Date = new Date()
  ): Promise<BusinessRule | null> {
    // Improve cache effectiveness for current lookups
    const isCurrentLookup = Math.abs(asOf.getTime() - Date.now()) < 1000;
    const cacheKey = isCurrentLookup 
      ? `rule:${ruleKey}:${JSON.stringify(scope)}:current`
      : `rule:${ruleKey}:${JSON.stringify(scope)}:${asOf.getTime()}`;
    
    const cached = configCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      // Use same precedence logic as getSetting
      const scopeCombinations = this.generateScopeCombinations(scope);

      for (const scopeQuery of scopeCombinations) {
        const result = await db
          .select()
          .from(businessRules)
          .where(
            and(
              eq(businessRules.ruleKey, ruleKey),
              scopeQuery.persona 
                ? eq(businessRules.persona, scopeQuery.persona) 
                : isNull(businessRules.persona),
              scopeQuery.agentId 
                ? eq(businessRules.agentId, scopeQuery.agentId) 
                : isNull(businessRules.agentId),
              scopeQuery.workflowId 
                ? eq(businessRules.workflowId, scopeQuery.workflowId) 
                : isNull(businessRules.workflowId),
              eq(businessRules.isActive, true),
              lte(businessRules.effectiveFrom, asOf),
              or(
                isNull(businessRules.effectiveTo),
                gt(businessRules.effectiveTo, asOf)
              )
            )
          )
          .orderBy(desc(businessRules.version))
          .limit(1);

        if (result.length > 0) {
          configCache.set(cacheKey, result[0]);
          return result[0];
        }
      }

      configCache.set(cacheKey, null);
      return null;
    } catch (error) {
      console.error(`ConfigService.getRule error for key "${ruleKey}":`, error);
      return null;
    }
  }

  /**
   * Get security allowlist with scope precedence and critical fallbacks
   * CRITICAL: Always returns a value, never null for security lists
   * @param allowlistKey Allowlist identifier (admin-emails, broker-domains, etc.)
   * @param scope Scope identifiers
   * @param fallbackValues Critical fallback values for security (required)
   * @param asOf Effective date
   * @returns Security allowlist array (never null)
   */
  static async getSecurityAllowlist(
    allowlistKey: string,
    scope: ScopeIdentifiers = {},
    fallbackValues: string[] = [],
    asOf: Date = new Date()
  ): Promise<string[]> {
    const cacheKey = `security:${allowlistKey}:${JSON.stringify(scope)}:current`;
    const cached = configCache.get(cacheKey);
    if (cached !== undefined) {
      return Array.isArray(cached) ? cached : fallbackValues;
    }

    try {
      const configValue = await this.getSetting<string[]>(`security-allowlists.${allowlistKey}`, scope, asOf);
      if (Array.isArray(configValue) && configValue.length > 0) {
        configCache.set(cacheKey, configValue);
        return configValue;
      }

      // CRITICAL: For security allowlists, always return fallback values
      console.warn(`ConfigService.getSecurityAllowlist: No config found for "${allowlistKey}", using fallback values`);
      configCache.set(cacheKey, fallbackValues);
      return fallbackValues;
    } catch (error) {
      console.error(`ConfigService.getSecurityAllowlist error for "${allowlistKey}": ${error}`);
      // CRITICAL: Never return empty array for security - use fallbacks
      return fallbackValues;
    }
  }

  /**
   * Get workflow detection patterns with persona scoping and fallbacks
   * @param patternKey Pattern identifier (cp-specializations, rachel-indicators, etc.)
   * @param persona Active persona for scoping
   * @param fallbackValues Default patterns if config unavailable
   * @param asOf Effective date
   * @returns Pattern array
   */
  static async getWorkflowPatterns(
    patternKey: string,
    persona: string = 'admin',
    fallbackValues: string[] = [],
    asOf: Date = new Date()
  ): Promise<string[]> {
    const scope = { persona };
    const cacheKey = `workflow:${patternKey}:${persona}:current`;
    const cached = configCache.get(cacheKey);
    if (cached !== undefined) {
      return Array.isArray(cached) ? cached : fallbackValues;
    }

    try {
      const configValue = await this.getSetting<string[]>(`workflow-patterns.${patternKey}`, scope, asOf);
      if (Array.isArray(configValue) && configValue.length > 0) {
        configCache.set(cacheKey, configValue);
        return configValue;
      }

      // Fallback to global patterns if persona-specific not found
      const globalValue = await this.getSetting<string[]>(`workflow-patterns.${patternKey}`, {}, asOf);
      if (Array.isArray(globalValue) && globalValue.length > 0) {
        configCache.set(cacheKey, globalValue);
        return globalValue;
      }

      console.warn(`ConfigService.getWorkflowPatterns: No config found for "${patternKey}" (persona: ${persona}), using fallback`);
      configCache.set(cacheKey, fallbackValues);
      return fallbackValues;
    } catch (error) {
      console.error(`ConfigService.getWorkflowPatterns error for "${patternKey}" (persona: ${persona}): ${error}`);
      return fallbackValues;
    }
  }

  /**
   * Validate if email is in security allowlist (admin check)
   * CRITICAL: Includes comprehensive fallbacks for admin authorization
   * @param email Email to validate
   * @param allowlistKey Allowlist identifier
   * @param scope Scope identifiers
   * @param fallbackValues Critical fallback emails
   * @returns True if email is authorized
   */
  static async isEmailAuthorized(
    email: string,
    allowlistKey: string = 'admin-emails',
    scope: ScopeIdentifiers = {},
    fallbackValues: string[] = []
  ): Promise<boolean> {
    if (!email) return false;
    
    const normalizedEmail = email.toLowerCase().trim();
    const allowedEmails = await this.getSecurityAllowlist(allowlistKey, scope, fallbackValues);
    
    return allowedEmails.some(allowedEmail => 
      allowedEmail.toLowerCase().trim() === normalizedEmail
    );
  }

  /**
   * Validate if domain is in security allowlist
   * @param domain Domain to validate
   * @param allowlistKey Allowlist identifier
   * @param scope Scope identifiers
   * @param fallbackValues Fallback domains
   * @returns True if domain is allowed
   */
  static async isDomainAllowed(
    domain: string,
    allowlistKey: string = 'broker-domains',
    scope: ScopeIdentifiers = {},
    fallbackValues: string[] = []
  ): Promise<boolean> {
    if (!domain) return false;
    
    const normalizedDomain = domain.toLowerCase().trim();
    const allowedDomains = await this.getSecurityAllowlist(allowlistKey, scope, fallbackValues);
    
    return allowedDomains.some(allowedDomain => 
      allowedDomain.toLowerCase().trim() === normalizedDomain
    );
  }

  /**
   * Get template with scope precedence
   * @param templateKey Template identifier
   * @param channel Template channel (email, voice, ui, sms)
   * @param scope Scope identifiers
   * @param locale Locale (defaults to en-US)
   * @param asOf Effective date
   * @returns Template or null
   */
  static async getTemplate(
    templateKey: string,
    channel: string,
    scope: ScopeIdentifiers = {},
    locale: string = 'en-US',
    asOf: Date = new Date()
  ): Promise<Template | null> {
    // Improve cache effectiveness for current lookups
    const isCurrentLookup = Math.abs(asOf.getTime() - Date.now()) < 1000;
    const cacheKey = isCurrentLookup 
      ? `template:${templateKey}:${channel}:${locale}:${JSON.stringify(scope)}:current`
      : `template:${templateKey}:${channel}:${locale}:${JSON.stringify(scope)}:${asOf.getTime()}`;
    
    const cached = configCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      // Use same precedence logic as getSetting
      const scopeCombinations = this.generateScopeCombinations(scope);

      for (const scopeQuery of scopeCombinations) {
        const result = await db
          .select()
          .from(templates)
          .where(
            and(
              eq(templates.templateKey, templateKey),
              eq(templates.channel, channel),
              eq(templates.locale, locale),
              scopeQuery.persona 
                ? eq(templates.persona, scopeQuery.persona) 
                : isNull(templates.persona),
              scopeQuery.agentId 
                ? eq(templates.agentId, scopeQuery.agentId) 
                : isNull(templates.agentId),
              scopeQuery.workflowId 
                ? eq(templates.workflowId, scopeQuery.workflowId) 
                : isNull(templates.workflowId),
              eq(templates.isActive, true),
              lte(templates.effectiveFrom, asOf),
              or(
                isNull(templates.effectiveTo),
                gt(templates.effectiveTo, asOf)
              )
            )
          )
          .orderBy(desc(templates.version))
          .limit(1);

        if (result.length > 0) {
          configCache.set(cacheKey, result[0]);
          return result[0];
        }
      }

      configCache.set(cacheKey, null);
      return null;
    } catch (error) {
      console.error(`ConfigService.getTemplate error for key "${templateKey}":`, error);
      return null;
    }
  }

  /**
   * Set configuration value (creates new version)
   * @param key Configuration key
   * @param value Configuration value
   * @param scope Scope identifiers
   * @param effectiveFrom When configuration becomes active
   * @param effectiveTo When configuration expires (optional)
   * @param createdBy User who created this configuration
   * @returns Created configuration value
   */
  static async setSetting(
    key: string,
    value: any,
    scope: ScopeIdentifiers = {},
    effectiveFrom: Date = new Date(),
    effectiveTo?: Date,
    createdBy?: string
  ): Promise<ConfigValue> {
    // Clear cache for this key pattern
    const keysToDelete = Array.from(configCache.keys()).filter(cacheKey => 
      cacheKey.startsWith(`config:${key}:`)
    );
    keysToDelete.forEach(cacheKey => configCache.delete(cacheKey));

    // Get current max version for this key+scope combination
    const currentVersions = await db
      .select()
      .from(configValues)
      .where(
        and(
          eq(configValues.configKey, key),
          scope.persona ? eq(configValues.persona, scope.persona) : isNull(configValues.persona),
          scope.agentId ? eq(configValues.agentId, scope.agentId) : isNull(configValues.agentId),
          scope.workflowId ? eq(configValues.workflowId, scope.workflowId) : isNull(configValues.workflowId)
        )
      )
      .orderBy(desc(configValues.version))
      .limit(1);

    const nextVersion = currentVersions.length > 0 ? currentVersions[0].version + 1 : 1;

    const result = await db
      .insert(configValues)
      .values({
        configKey: key,
        scopeIdentifiers: scope as any,
        persona: scope.persona || null,
        agentId: scope.agentId || null,
        workflowId: scope.workflowId || null,
        value: value as any,
        effectiveFrom,
        effectiveTo,
        version: nextVersion,
        isActive: true,
        createdBy
      })
      .returning();

    return result[0];
  }

  /**
   * Rollback a specific configuration to a target version
   * @param key Configuration key
   * @param scope Scope identifiers
   * @param targetVersion Target version to rollback to
   * @param performedBy User performing the rollback
   * @param reason Reason for rollback
   * @returns Rollback operation result
   */
  static async rollbackSetting(
    key: string,
    scope: ScopeIdentifiers = {},
    targetVersion: number,
    performedBy: string,
    reason?: string
  ): Promise<RollbackResult> {
    const startTime = Date.now();
    
    try {
      // Validate rollback operation
      const validation = await this.validateRollback(key, scope, { targetVersion });
      if (!validation.isValid) {
        throw new Error(`Rollback validation failed: ${validation.errors.join(', ')}`);
      }

      // Get target version configuration
      const targetConfig = await db
        .select()
        .from(configValues)
        .where(
          and(
            eq(configValues.configKey, key),
            eq(configValues.version, targetVersion),
            scope.persona ? eq(configValues.persona, scope.persona) : isNull(configValues.persona),
            scope.agentId ? eq(configValues.agentId, scope.agentId) : isNull(configValues.agentId),
            scope.workflowId ? eq(configValues.workflowId, scope.workflowId) : isNull(configValues.workflowId)
          )
        )
        .limit(1);

      if (targetConfig.length === 0) {
        throw new Error(`Target version ${targetVersion} not found for key "${key}"`);
      }

      // Get current active configuration for audit log
      const currentConfig = await this.getSetting(key, scope);
      
      // Create new configuration with incremented version
      const currentVersions = await db
        .select()
        .from(configValues)
        .where(
          and(
            eq(configValues.configKey, key),
            scope.persona ? eq(configValues.persona, scope.persona) : isNull(configValues.persona),
            scope.agentId ? eq(configValues.agentId, scope.agentId) : isNull(configValues.agentId),
            scope.workflowId ? eq(configValues.workflowId, scope.workflowId) : isNull(configValues.workflowId)
          )
        )
        .orderBy(desc(configValues.version))
        .limit(1);

      const nextVersion = currentVersions.length > 0 ? currentVersions[0].version + 1 : 1;
      const target = targetConfig[0];

      // Insert rolled-back configuration as new version
      const rollbackConfig = await db
        .insert(configValues)
        .values({
          configKey: key,
          scopeIdentifiers: scope as any,
          persona: scope.persona || null,
          agentId: scope.agentId || null,
          workflowId: scope.workflowId || null,
          value: target.value,
          effectiveFrom: new Date(),
          effectiveTo: null,
          version: nextVersion,
          isActive: true,
          createdBy: performedBy
        })
        .returning();

      // Clear relevant cache entries
      const keysToDelete = Array.from(configCache.keys()).filter(cacheKey => 
        cacheKey.startsWith(`config:${key}:`)
      );
      keysToDelete.forEach(cacheKey => configCache.delete(cacheKey));

      // Log the rollback operation
      const changeLog = await db
        .insert(configChangeLogs)
        .values({
          operationType: 'rollback',
          configKey: key,
          configType: 'config_value',
          scopeIdentifiers: scope as any,
          previousState: { value: currentConfig, version: currentVersions[0]?.version },
          newState: { value: target.value, version: nextVersion },
          performedBy,
          reason,
          rollbackTargetVersion: targetVersion,
          affectedCount: 1,
          impactScope: { scope, configKey: key },
          success: true,
          executionTimeMs: Date.now() - startTime
        })
        .returning();

      return {
        success: true,
        affectedCount: 1,
        changeLogId: changeLog[0].id,
        rollbackVersion: nextVersion,
        executionTimeMs: Date.now() - startTime
      };
    } catch (error) {
      // Log failed rollback
      const changeLog = await db
        .insert(configChangeLogs)
        .values({
          operationType: 'rollback',
          configKey: key,
          configType: 'config_value',
          scopeIdentifiers: scope as any,
          previousState: null,
          newState: null,
          performedBy,
          reason,
          rollbackTargetVersion: targetVersion,
          affectedCount: 0,
          success: false,
          errorDetails: { message: error instanceof Error ? error.message : String(error) },
          executionTimeMs: Date.now() - startTime
        })
        .returning();

      return {
        success: false,
        affectedCount: 0,
        changeLogId: changeLog[0].id,
        errorDetails: error,
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Rollback configurations to a specific date
   * @param key Configuration key (optional, if not provided rolls back all configs in scope)
   * @param scope Scope identifiers
   * @param targetDate Date to rollback to
   * @param performedBy User performing the rollback
   * @param reason Reason for rollback
   * @returns Rollback operation result
   */
  static async rollbackToDate(
    key: string | null,
    scope: ScopeIdentifiers = {},
    targetDate: Date,
    performedBy: string,
    reason?: string
  ): Promise<RollbackResult> {
    const startTime = Date.now();
    
    try {
      // Validate rollback operation
      const validation = await this.validateRollback(key, scope, { targetDate });
      if (!validation.isValid) {
        throw new Error(`Rollback validation failed: ${validation.errors.join(', ')}`);
      }

      let affectedCount = 0;
      const configsToRollback: string[] = key ? [key] : validation.affectedConfigs;

      // Process each configuration
      for (const configKey of configsToRollback) {
        // Find the configuration state at target date
        const targetConfigs = await db
          .select()
          .from(configValues)
          .where(
            and(
              eq(configValues.configKey, configKey),
              scope.persona ? eq(configValues.persona, scope.persona) : isNull(configValues.persona),
              scope.agentId ? eq(configValues.agentId, scope.agentId) : isNull(configValues.agentId),
              scope.workflowId ? eq(configValues.workflowId, scope.workflowId) : isNull(configValues.workflowId),
              eq(configValues.isActive, true),
              lte(configValues.effectiveFrom, targetDate),
              or(
                isNull(configValues.effectiveTo),
                gt(configValues.effectiveTo, targetDate)
              )
            )
          )
          .orderBy(desc(configValues.version))
          .limit(1);

        if (targetConfigs.length > 0) {
          const currentConfig = await this.getSetting(configKey, scope);
          const targetConfig = targetConfigs[0];
          
          // Only rollback if values are different
          if (JSON.stringify(currentConfig) !== JSON.stringify(targetConfig.value)) {
            await this.rollbackSetting(configKey, scope, targetConfig.version, performedBy, reason);
            affectedCount++;
          }
        }
      }

      // Log the bulk rollback operation
      const changeLog = await db
        .insert(configChangeLogs)
        .values({
          operationType: 'rollback',
          configKey: key || '*',
          configType: 'config_value',
          scopeIdentifiers: scope as any,
          previousState: null,
          newState: null,
          performedBy,
          reason,
          rollbackTargetDate: targetDate,
          affectedCount,
          impactScope: { scope, configKeys: configsToRollback },
          success: true,
          executionTimeMs: Date.now() - startTime
        })
        .returning();

      return {
        success: true,
        affectedCount,
        changeLogId: changeLog[0].id,
        rollbackDate: targetDate,
        executionTimeMs: Date.now() - startTime
      };
    } catch (error) {
      // Log failed rollback
      const changeLog = await db
        .insert(configChangeLogs)
        .values({
          operationType: 'rollback',
          configKey: key || '*',
          configType: 'config_value',
          scopeIdentifiers: scope as any,
          previousState: null,
          newState: null,
          performedBy,
          reason,
          rollbackTargetDate: targetDate,
          affectedCount: 0,
          success: false,
          errorDetails: { message: error instanceof Error ? error.message : String(error) },
          executionTimeMs: Date.now() - startTime
        })
        .returning();

      return {
        success: false,
        affectedCount: 0,
        changeLogId: changeLog[0].id,
        errorDetails: error,
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Create a configuration snapshot for point-in-time restoration
   * @param snapshotName Name for the snapshot
   * @param description Optional description
   * @param scope Optional scope filter for partial snapshots
   * @param createdBy User creating the snapshot
   * @returns Created snapshot
   */
  static async createSnapshot(
    snapshotName: string,
    description: string | undefined,
    scope: ScopeIdentifiers | undefined,
    createdBy: string
  ): Promise<ConfigSnapshot> {
    try {
      // Build scope filter for queries
      const scopeConditions = [];
      if (scope?.persona) scopeConditions.push(eq(configValues.persona, scope.persona));
      if (scope?.agentId) scopeConditions.push(eq(configValues.agentId, scope.agentId));
      if (scope?.workflowId) scopeConditions.push(eq(configValues.workflowId, scope.workflowId));
      
      // Capture current configuration state
      const [configs, rules, templatesResult] = await Promise.all([
        // Configuration values
        db
          .select()
          .from(configValues)
          .where(
            and(
              eq(configValues.isActive, true),
              ...scopeConditions
            )
          )
          .orderBy(configValues.configKey, desc(configValues.version)),
        
        // Business rules
        db
          .select()
          .from(businessRules)
          .where(
            and(
              eq(businessRules.isActive, true),
              // Apply scope conditions for business rules
              ...(scope?.persona ? [eq(businessRules.persona, scope.persona)] : []),
              ...(scope?.agentId ? [eq(businessRules.agentId, scope.agentId)] : []),
              ...(scope?.workflowId ? [eq(businessRules.workflowId, scope.workflowId)] : [])
            )
          )
          .orderBy(businessRules.ruleKey, desc(businessRules.version)),
        
        // Templates
        db
          .select()
          .from(templates)
          .where(
            and(
              eq(templates.isActive, true),
              // Apply scope conditions for templates
              ...(scope?.persona ? [eq(templates.persona, scope.persona)] : []),
              ...(scope?.agentId ? [eq(templates.agentId, scope.agentId)] : []),
              ...(scope?.workflowId ? [eq(templates.workflowId, scope.workflowId)] : [])
            )
          )
          .orderBy(templates.templateKey, desc(templates.version))
      ]);

      // Prepare snapshot data
      const snapshotData = {
        capturedAt: new Date().toISOString(),
        scope,
        configValues: configs,
        businessRules: rules,
        templates: templatesResult
      };

      const metricsSummary: SnapshotMetrics = {
        configValues: configs.length,
        businessRules: rules.length,
        templates: templatesResult.length,
        totalSize: JSON.stringify(snapshotData).length
      };

      // Create snapshot record
      const snapshot = await db
        .insert(configSnapshots)
        .values({
          snapshotName,
          description,
          createdBy,
          scopeFilter: scope as any,
          snapshotData: snapshotData as any,
          metricsSummary: metricsSummary as any
        })
        .returning();

      return snapshot[0];
    } catch (error) {
      console.error(`ConfigService.createSnapshot error:`, error);
      throw error;
    }
  }

  /**
   * Restore configuration from a snapshot
   * @param snapshotId Snapshot ID to restore from
   * @param scope Optional scope filter for partial restoration
   * @param performedBy User performing the restore
   * @param reason Reason for restore
   * @returns Rollback operation result
   */
  static async restoreFromSnapshot(
    snapshotId: number,
    scope: ScopeIdentifiers | undefined,
    performedBy: string,
    reason?: string
  ): Promise<RollbackResult> {
    const startTime = Date.now();
    
    try {
      // Get snapshot data
      const snapshots = await db
        .select()
        .from(configSnapshots)
        .where(eq(configSnapshots.id, snapshotId))
        .limit(1);

      if (snapshots.length === 0) {
        throw new Error(`Snapshot ${snapshotId} not found`);
      }

      const snapshot = snapshots[0];
      const snapshotData = snapshot.snapshotData as any;
      let affectedCount = 0;

      // Restore configuration values
      if (snapshotData.configValues) {
        for (const config of snapshotData.configValues) {
          // Apply scope filter if provided
          if (scope && !this.matchesScope(config, scope)) continue;
          
          const currentValue = await this.getSetting(config.configKey, {
            persona: config.persona,
            agentId: config.agentId,
            workflowId: config.workflowId
          });

          // Only restore if values are different
          if (JSON.stringify(currentValue) !== JSON.stringify(config.value)) {
            await this.setSetting(
              config.configKey,
              config.value,
              {
                persona: config.persona,
                agentId: config.agentId,
                workflowId: config.workflowId
              },
              new Date(),
              undefined,
              performedBy
            );
            affectedCount++;
          }
        }
      }

      // Log the restore operation
      const changeLog = await db
        .insert(configChangeLogs)
        .values({
          operationType: 'snapshot_restore',
          configKey: '*',
          configType: 'config_value',
          scopeIdentifiers: scope as any,
          previousState: null,
          newState: { snapshotId, snapshotName: snapshot.snapshotName },
          performedBy,
          reason,
          snapshotId,
          affectedCount,
          impactScope: { scope, snapshotId, snapshotName: snapshot.snapshotName },
          success: true,
          executionTimeMs: Date.now() - startTime
        })
        .returning();

      return {
        success: true,
        affectedCount,
        changeLogId: changeLog[0].id,
        executionTimeMs: Date.now() - startTime
      };
    } catch (error) {
      // Log failed restore
      const changeLog = await db
        .insert(configChangeLogs)
        .values({
          operationType: 'snapshot_restore',
          configKey: '*',
          configType: 'config_value',
          scopeIdentifiers: scope as any,
          previousState: null,
          newState: null,
          performedBy,
          reason,
          snapshotId,
          affectedCount: 0,
          success: false,
          errorDetails: { message: error instanceof Error ? error.message : String(error) },
          executionTimeMs: Date.now() - startTime
        })
        .returning();

      return {
        success: false,
        affectedCount: 0,
        changeLogId: changeLog[0].id,
        errorDetails: error,
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Get version history for a configuration key
   * @param key Configuration key
   * @param scope Scope identifiers
   * @param limit Maximum number of versions to return
   * @returns Array of version history entries
   */
  static async getVersionHistory(
    key: string,
    scope: ScopeIdentifiers = {},
    limit: number = 50
  ): Promise<VersionHistoryEntry[]> {
    try {
      const results = await db
        .select()
        .from(configValues)
        .where(
          and(
            eq(configValues.configKey, key),
            scope.persona ? eq(configValues.persona, scope.persona) : isNull(configValues.persona),
            scope.agentId ? eq(configValues.agentId, scope.agentId) : isNull(configValues.agentId),
            scope.workflowId ? eq(configValues.workflowId, scope.workflowId) : isNull(configValues.workflowId)
          )
        )
        .orderBy(desc(configValues.version))
        .limit(limit);

      return results.map(config => ({
        version: config.version,
        value: config.value,
        effectiveFrom: config.effectiveFrom,
        effectiveTo: config.effectiveTo || undefined,
        isActive: config.isActive,
        createdBy: config.createdBy || undefined,
        updatedAt: config.updatedAt || new Date()
      }));
    } catch (error) {
      console.error(`ConfigService.getVersionHistory error for key "${key}":`, error);
      return [];
    }
  }

  /**
   * Get change history for a configuration key within date range
   * @param key Configuration key
   * @param scope Scope identifiers
   * @param fromDate Start date for history
   * @param toDate End date for history
   * @param limit Maximum number of changes to return
   * @returns Array of change history entries
   */
  static async getChangeHistory(
    key: string,
    scope: ScopeIdentifiers = {},
    fromDate: Date,
    toDate: Date,
    limit: number = 100
  ): Promise<ChangeHistoryEntry[]> {
    try {
      const results = await db
        .select()
        .from(configChangeLogs)
        .where(
          and(
            eq(configChangeLogs.configKey, key),
            between(configChangeLogs.timestamp, fromDate, toDate)
          )
        )
        .orderBy(desc(configChangeLogs.timestamp))
        .limit(limit);

      return results.map(log => ({
        changeLogId: log.id,
        operationType: log.operationType,
        previousState: log.previousState,
        newState: log.newState,
        performedBy: log.performedBy,
        reason: log.reason || undefined,
        timestamp: log.timestamp || new Date(),
        success: log.success
      }));
    } catch (error) {
      console.error(`ConfigService.getChangeHistory error for key "${key}":`, error);
      return [];
    }
  }

  /**
   * Validate rollback operation before execution
   * @param key Configuration key
   * @param scope Scope identifiers
   * @param target Target version or date
   * @returns Validation result with warnings and errors
   */
  static async validateRollback(
    key: string | null,
    scope: ScopeIdentifiers = {},
    target: { targetVersion?: number; targetDate?: Date }
  ): Promise<RollbackValidation> {
    const warnings: string[] = [];
    const errors: string[] = [];
    const affectedConfigs: string[] = [];

    try {
      // Basic validation
      if (!target.targetVersion && !target.targetDate) {
        errors.push('Either targetVersion or targetDate must be specified');
      }

      if (target.targetDate && target.targetDate > new Date()) {
        errors.push('Target date cannot be in the future');
      }

      if (target.targetVersion && target.targetVersion < 1) {
        errors.push('Target version must be positive');
      }

      // Get affected configurations
      if (key) {
        affectedConfigs.push(key);
        
        // Check if target version exists
        if (target.targetVersion) {
          const targetExists = await db
            .select({ id: configValues.id })
            .from(configValues)
            .where(
              and(
                eq(configValues.configKey, key),
                eq(configValues.version, target.targetVersion),
                scope.persona ? eq(configValues.persona, scope.persona) : isNull(configValues.persona),
                scope.agentId ? eq(configValues.agentId, scope.agentId) : isNull(configValues.agentId),
                scope.workflowId ? eq(configValues.workflowId, scope.workflowId) : isNull(configValues.workflowId)
              )
            )
            .limit(1);

          if (targetExists.length === 0) {
            errors.push(`Target version ${target.targetVersion} does not exist for key "${key}"`);
          }
        }
      } else {
        // Get all configurations in scope
        const scopeConditions = [];
        if (scope.persona) scopeConditions.push(eq(configValues.persona, scope.persona));
        if (scope.agentId) scopeConditions.push(eq(configValues.agentId, scope.agentId));
        if (scope.workflowId) scopeConditions.push(eq(configValues.workflowId, scope.workflowId));

        const configs = await db
          .select({ configKey: configValues.configKey })
          .from(configValues)
          .where(
            and(
              eq(configValues.isActive, true),
              ...scopeConditions
            )
          )
          .groupBy(configValues.configKey);

        affectedConfigs.push(...configs.map(c => c.configKey));
      }

      // Impact assessment
      const [configCount, ruleCount, templateCount] = await Promise.all([
        db.select({ count: count() }).from(configValues).where(
          and(
            eq(configValues.isActive, true),
            key ? eq(configValues.configKey, key) : undefined,
            scope.persona ? eq(configValues.persona, scope.persona) : isNull(configValues.persona),
            scope.agentId ? eq(configValues.agentId, scope.agentId) : isNull(configValues.agentId),
            scope.workflowId ? eq(configValues.workflowId, scope.workflowId) : isNull(configValues.workflowId)
          )
        ),
        db.select({ count: count() }).from(businessRules).where(
          and(
            eq(businessRules.isActive, true),
            scope.persona ? eq(businessRules.persona, scope.persona) : isNull(businessRules.persona),
            scope.agentId ? eq(businessRules.agentId, scope.agentId) : isNull(businessRules.agentId),
            scope.workflowId ? eq(businessRules.workflowId, scope.workflowId) : isNull(businessRules.workflowId)
          )
        ),
        db.select({ count: count() }).from(templates).where(
          and(
            eq(templates.isActive, true),
            scope.persona ? eq(templates.persona, scope.persona) : isNull(templates.persona),
            scope.agentId ? eq(templates.agentId, scope.agentId) : isNull(templates.agentId),
            scope.workflowId ? eq(templates.workflowId, scope.workflowId) : isNull(templates.workflowId)
          )
        )
      ]);

      // Add warnings for large operations
      if (affectedConfigs.length > 10) {
        warnings.push(`Large rollback operation affecting ${affectedConfigs.length} configurations`);
      }

      if (target.targetDate && target.targetDate < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        warnings.push('Rolling back to a date older than 30 days');
      }

      return {
        isValid: errors.length === 0,
        warnings,
        errors,
        affectedConfigs,
        impactAssessment: {
          scope,
          configCount: configCount[0]?.count || 0,
          ruleCount: ruleCount[0]?.count || 0,
          templateCount: templateCount[0]?.count || 0
        }
      };
    } catch (error) {
      console.error('ConfigService.validateRollback error:', error);
      return {
        isValid: false,
        warnings,
        errors: [...errors, `Validation error: ${error instanceof Error ? error.message : String(error)}`],
        affectedConfigs,
        impactAssessment: {
          scope,
          configCount: 0,
          ruleCount: 0,
          templateCount: 0
        }
      };
    }
  }

  /**
   * Get configurations affected by rollback operation
   * @param scope Scope identifiers
   * @param targetDate Optional target date filter
   * @returns Array of affected configuration keys
   */
  static async getAffectedConfigs(
    scope: ScopeIdentifiers = {},
    targetDate?: Date
  ): Promise<string[]> {
    try {
      const scopeConditions = [];
      if (scope.persona) scopeConditions.push(eq(configValues.persona, scope.persona));
      if (scope.agentId) scopeConditions.push(eq(configValues.agentId, scope.agentId));
      if (scope.workflowId) scopeConditions.push(eq(configValues.workflowId, scope.workflowId));

      const dateConditions = targetDate ? [
        lte(configValues.effectiveFrom, targetDate),
        or(
          isNull(configValues.effectiveTo),
          gt(configValues.effectiveTo, targetDate)
        )
      ] : [];

      const configs = await db
        .select({ configKey: configValues.configKey })
        .from(configValues)
        .where(
          and(
            eq(configValues.isActive, true),
            ...scopeConditions,
            ...dateConditions
          )
        )
        .groupBy(configValues.configKey);

      return configs.map(c => c.configKey);
    } catch (error) {
      console.error('ConfigService.getAffectedConfigs error:', error);
      return [];
    }
  }

  /**
   * Preview changes that would be made by rollback operation
   * @param key Configuration key
   * @param scope Scope identifiers
   * @param target Target version or date
   * @returns Preview of changes
   */
  static async previewRollbackChanges(
    key: string,
    scope: ScopeIdentifiers = {},
    target: { targetVersion?: number; targetDate?: Date }
  ): Promise<{ current: any; target: any; willChange: boolean }> {
    try {
      // Get current value
      const currentValue = await this.getSetting(key, scope);
      
      let targetValue = null;
      if (target.targetVersion) {
        // Get specific version
        const targetConfigs = await db
          .select()
          .from(configValues)
          .where(
            and(
              eq(configValues.configKey, key),
              eq(configValues.version, target.targetVersion),
              scope.persona ? eq(configValues.persona, scope.persona) : isNull(configValues.persona),
              scope.agentId ? eq(configValues.agentId, scope.agentId) : isNull(configValues.agentId),
              scope.workflowId ? eq(configValues.workflowId, scope.workflowId) : isNull(configValues.workflowId)
            )
          )
          .limit(1);
        
        targetValue = targetConfigs.length > 0 ? targetConfigs[0].value : null;
      } else if (target.targetDate) {
        // Get value at target date
        targetValue = await this.getSetting(key, scope, target.targetDate);
      }

      return {
        current: currentValue,
        target: targetValue,
        willChange: JSON.stringify(currentValue) !== JSON.stringify(targetValue)
      };
    } catch (error) {
      console.error('ConfigService.previewRollbackChanges error:', error);
      return {
        current: null,
        target: null,
        willChange: false
      };
    }
  }

  /**
   * Helper method to check if configuration matches scope filter
   * @param config Configuration object
   * @param scope Scope filter
   * @returns True if matches scope
   */
  private static matchesScope(config: any, scope: ScopeIdentifiers): boolean {
    if (scope.persona && config.persona !== scope.persona) return false;
    if (scope.agentId && config.agentId !== scope.agentId) return false;
    if (scope.workflowId && config.workflowId !== scope.workflowId) return false;
    return true;
  }

  /**
   * Clear cache for configuration changes
   */
  static clearCache(): void {
    configCache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return {
      size: configCache.size,
      max: configCache.max,
      calculatedSize: configCache.calculatedSize,
      hits: configCache.calculatedSize // Approximate hits
    };
  }

  // Agent Lifecycle Management Methods

  /**
   * Get agent lifecycle maturity definitions
   * @param scope Scope identifiers
   * @returns Maturity level definitions
   */
  static async getLifecycleMaturityDefinitions(scope: ScopeIdentifiers = {}): Promise<any> {
    return this.getSetting('lifecycle.maturity.definitions', scope);
  }

  /**
   * Set agent lifecycle maturity definitions
   * @param definitions Maturity level definitions
   * @param scope Scope identifiers
   * @param createdBy User making the change
   * @returns Created configuration
   */
  static async setLifecycleMaturityDefinitions(
    definitions: any,
    scope: ScopeIdentifiers = {},
    createdBy?: string
  ): Promise<any> {
    return this.setSetting('lifecycle.maturity.definitions', definitions, scope, new Date(), undefined, createdBy);
  }

  /**
   * Get lifecycle test templates
   * @param scope Scope identifiers
   * @returns Test templates configuration
   */
  static async getLifecycleTestTemplates(scope: ScopeIdentifiers = {}): Promise<any> {
    return this.getSetting('lifecycle.test.templates', scope);
  }

  /**
   * Set lifecycle test templates
   * @param templates Test templates configuration
   * @param scope Scope identifiers
   * @param createdBy User making the change
   * @returns Created configuration
   */
  static async setLifecycleTestTemplates(
    templates: any,
    scope: ScopeIdentifiers = {},
    createdBy?: string
  ): Promise<any> {
    return this.setSetting('lifecycle.test.templates', templates, scope, new Date(), undefined, createdBy);
  }

  /**
   * Get lifecycle cost thresholds
   * @param scope Scope identifiers
   * @returns Cost threshold configuration
   */
  static async getLifecycleCostThresholds(scope: ScopeIdentifiers = {}): Promise<any> {
    return this.getSetting('lifecycle.cost.thresholds', scope);
  }

  /**
   * Set lifecycle cost thresholds
   * @param thresholds Cost threshold configuration
   * @param scope Scope identifiers
   * @param createdBy User making the change
   * @returns Created configuration
   */
  static async setLifecycleCostThresholds(
    thresholds: any,
    scope: ScopeIdentifiers = {},
    createdBy?: string
  ): Promise<any> {
    return this.setSetting('lifecycle.cost.thresholds', thresholds, scope, new Date(), undefined, createdBy);
  }

  /**
   * Get agent-specific lifecycle configuration
   * @param agentId Agent ID
   * @param scope Additional scope identifiers
   * @returns Agent lifecycle configuration
   */
  static async getAgentLifecycleConfig(agentId: number, scope: ScopeIdentifiers = {}): Promise<any> {
    const agentScope = { ...scope, agentId };
    return this.getSetting(`agent.${agentId}.lifecycle`, agentScope);
  }

  /**
   * Set agent-specific lifecycle configuration
   * @param agentId Agent ID
   * @param config Lifecycle configuration
   * @param scope Additional scope identifiers
   * @param createdBy User making the change
   * @returns Created configuration
   */
  static async setAgentLifecycleConfig(
    agentId: number,
    config: any,
    scope: ScopeIdentifiers = {},
    createdBy?: string
  ): Promise<any> {
    const agentScope = { ...scope, agentId };
    return this.setSetting(`agent.${agentId}.lifecycle`, config, agentScope, new Date(), undefined, createdBy);
  }

  /**
   * Get agent version configuration
   * @param agentId Agent ID
   * @param scope Additional scope identifiers
   * @returns Agent version configuration
   */
  static async getAgentVersionConfig(agentId: number, scope: ScopeIdentifiers = {}): Promise<any> {
    const agentScope = { ...scope, agentId };
    return this.getSetting(`agent.${agentId}.versions`, agentScope);
  }

  /**
   * Set agent version configuration
   * @param agentId Agent ID
   * @param versionConfig Version configuration
   * @param scope Additional scope identifiers
   * @param createdBy User making the change
   * @returns Created configuration
   */
  static async setAgentVersionConfig(
    agentId: number,
    versionConfig: any,
    scope: ScopeIdentifiers = {},
    createdBy?: string
  ): Promise<any> {
    const agentScope = { ...scope, agentId };
    return this.setSetting(`agent.${agentId}.versions`, versionConfig, agentScope, new Date(), undefined, createdBy);
  }

  /**
   * Get showcase mode settings
   * @param scope Scope identifiers
   * @returns Showcase mode configuration
   */
  static async getShowcaseSettings(scope: ScopeIdentifiers = {}): Promise<any> {
    return this.getSetting('platform.showcase.enabled', scope);
  }

  /**
   * Set showcase mode settings
   * @param enabled Whether showcase mode is enabled
   * @param scope Scope identifiers
   * @param createdBy User making the change
   * @returns Created configuration
   */
  static async setShowcaseSettings(
    enabled: boolean,
    scope: ScopeIdentifiers = {},
    createdBy?: string
  ): Promise<any> {
    return this.setSetting('platform.showcase.enabled', enabled, scope, new Date(), undefined, createdBy);
  }

  /**
   * Get showcase enhancement multipliers
   * @param scope Scope identifiers
   * @returns Enhancement multiplier configuration
   */
  static async getShowcaseEnhancementMultipliers(scope: ScopeIdentifiers = {}): Promise<any> {
    return this.getSetting('platform.showcase.enhancement_multipliers', scope);
  }

  /**
   * Set showcase enhancement multipliers
   * @param multipliers Enhancement multiplier configuration
   * @param scope Scope identifiers
   * @param createdBy User making the change
   * @returns Created configuration
   */
  static async setShowcaseEnhancementMultipliers(
    multipliers: any,
    scope: ScopeIdentifiers = {},
    createdBy?: string
  ): Promise<any> {
    return this.setSetting('platform.showcase.enhancement_multipliers', multipliers, scope, new Date(), undefined, createdBy);
  }

  // === ENTERPRISE TAXONOMY & GOVERNANCE METHODS ===

  /**
   * Get maturity level definitions (L0-L4)
   * @param scope Scope identifiers
   * @returns Maturity level definitions with capabilities and requirements
   */
  static async getMaturityLevelDefinitions(scope: ScopeIdentifiers = {}): Promise<any> {
    const defaultMaturityLevels = {
      L0: {
        label: "Tool Caller",
        description: "Direct API calls and simple automations",
        capabilities: ["API Integration", "Basic Automation", "Simple Workflows"],
        requirements: ["Basic Configuration", "API Keys"],
        costMultiplier: 1.0,
        complexityScore: 1
      },
      L1: {
        label: "ReAct Loop",
        description: "Single-step reasoning with action feedback",
        capabilities: ["Reasoning", "Action Planning", "Feedback Processing", "Error Handling"],
        requirements: ["LLM Integration", "Action Framework", "Monitoring"],
        costMultiplier: 1.5,
        complexityScore: 2
      },
      L2: {
        label: "Planner + Executor",
        description: "Multi-step workflows with planning capabilities",
        capabilities: ["Strategic Planning", "Workflow Orchestration", "Resource Management", "Goal Decomposition"],
        requirements: ["Planning Engine", "Execution Framework", "State Management"],
        costMultiplier: 2.5,
        complexityScore: 4
      },
      L3: {
        label: "Multi-Agent Crew",
        description: "Collaborative agents with specialized roles",
        capabilities: ["Agent Coordination", "Role Specialization", "Collaborative Planning", "Delegation"],
        requirements: ["Multi-Agent Framework", "Communication Protocols", "Coordination Logic"],
        costMultiplier: 4.0,
        complexityScore: 7
      },
      L4: {
        label: "Autonomous System",
        description: "Self-healing agents with full autonomy",
        capabilities: ["Self-Healing", "Autonomous Learning", "System Optimization", "Proactive Management"],
        requirements: ["ML Pipeline", "Auto-Recovery", "Advanced Monitoring", "Autonomous Decision Making"],
        costMultiplier: 6.0,
        complexityScore: 10
      }
    };
    
    const stored = await this.getSetting('agent.maturity.definitions', scope);
    return stored || defaultMaturityLevels;
  }

  /**
   * Get agent category options (Reactive, Deliberative, etc.)
   * @param scope Scope identifiers
   * @returns Agent category definitions with characteristics
   */
  static async getAgentCategoryOptions(scope: ScopeIdentifiers = {}): Promise<any> {
    const defaultCategories = {
      Reactive: {
        label: "Reactive",
        description: "Event-driven agents that respond to triggers",
        characteristics: ["Fast Response", "Rule-Based", "Event Processing"],
        suitableFor: ["Monitoring", "Alerts", "Real-time Processing"],
        maturityRange: ["L0", "L1", "L2"]
      },
      Deliberative: {
        label: "Deliberative",
        description: "Goal-oriented agents with planning capabilities",
        characteristics: ["Goal-Oriented", "Strategic Planning", "Reasoning"],
        suitableFor: ["Complex Workflows", "Decision Making", "Analysis"],
        maturityRange: ["L1", "L2", "L3"]
      },
      Hybrid: {
        label: "Hybrid",
        description: "Combined reactive and deliberative capabilities",
        characteristics: ["Flexible Response", "Adaptive Behavior", "Balanced Approach"],
        suitableFor: ["Dynamic Environments", "Variable Workloads", "Mixed Requirements"],
        maturityRange: ["L2", "L3", "L4"]
      },
      Learning: {
        label: "Learning",
        description: "Adaptive agents that improve over time",
        characteristics: ["Continuous Learning", "Performance Optimization", "Pattern Recognition"],
        suitableFor: ["Optimization", "Personalization", "Predictive Tasks"],
        maturityRange: ["L2", "L3", "L4"]
      },
      Collaborative: {
        label: "Collaborative",
        description: "Multi-agent coordination and teamwork",
        characteristics: ["Team Coordination", "Communication", "Shared Goals"],
        suitableFor: ["Complex Projects", "Multi-domain Tasks", "Distributed Work"],
        maturityRange: ["L3", "L4"]
      },
      Autonomous: {
        label: "Autonomous",
        description: "Self-managing agents with minimal oversight",
        characteristics: ["Self-Management", "Independent Operation", "Proactive Behavior"],
        suitableFor: ["Mission-Critical Systems", "Unsupervised Operations", "24/7 Services"],
        maturityRange: ["L4"]
      }
    };
    
    const stored = await this.getSetting('agent.category.definitions', scope);
    return stored || defaultCategories;
  }

  /**
   * Get compliance framework options
   * @param scope Scope identifiers
   * @returns Available compliance frameworks with requirements
   */
  static async getComplianceFrameworks(scope: ScopeIdentifiers = {}): Promise<any> {
    const defaultFrameworks = {
      GDPR: {
        label: "GDPR",
        description: "General Data Protection Regulation",
        requirements: ["Data Privacy", "Consent Management", "Right to Deletion", "Data Portability"],
        costImpact: 1.3,
        auditFrequency: "quarterly"
      },
      HIPAA: {
        label: "HIPAA",
        description: "Health Insurance Portability and Accountability Act",
        requirements: ["PHI Protection", "Encryption", "Access Controls", "Audit Trails"],
        costImpact: 1.5,
        auditFrequency: "monthly"
      },
      SOX: {
        label: "SOX",
        description: "Sarbanes-Oxley Act",
        requirements: ["Financial Controls", "Change Management", "Segregation of Duties"],
        costImpact: 1.4,
        auditFrequency: "quarterly"
      },
      PCI_DSS: {
        label: "PCI DSS",
        description: "Payment Card Industry Data Security Standard",
        requirements: ["Secure Networks", "Cardholder Data Protection", "Vulnerability Management"],
        costImpact: 1.6,
        auditFrequency: "monthly"
      },
      ISO27001: {
        label: "ISO 27001",
        description: "Information Security Management",
        requirements: ["Security Management", "Risk Assessment", "Security Controls"],
        costImpact: 1.2,
        auditFrequency: "annually"
      }
    };
    
    const stored = await this.getSetting('governance.compliance.frameworks', scope);
    return stored || defaultFrameworks;
  }

  /**
   * Get performance template options for SLA requirements
   * @param scope Scope identifiers
   * @returns Performance template definitions
   */
  static async getPerformanceTemplates(scope: ScopeIdentifiers = {}): Promise<any> {
    const defaultTemplates = {
      basic: {
        label: "Basic",
        responseTime: { target: 5000, threshold: 10000 }, // ms
        availability: { target: 99.0, threshold: 95.0 }, // percentage
        accuracy: { target: 90.0, threshold: 80.0 }, // percentage
        throughput: { target: 100, threshold: 50 } // requests/hour
      },
      standard: {
        label: "Standard",
        responseTime: { target: 2000, threshold: 5000 },
        availability: { target: 99.5, threshold: 99.0 },
        accuracy: { target: 95.0, threshold: 90.0 },
        throughput: { target: 500, threshold: 200 }
      },
      premium: {
        label: "Premium",
        responseTime: { target: 1000, threshold: 2000 },
        availability: { target: 99.9, threshold: 99.5 },
        accuracy: { target: 98.0, threshold: 95.0 },
        throughput: { target: 1000, threshold: 500 }
      },
      enterprise: {
        label: "Enterprise",
        responseTime: { target: 500, threshold: 1000 },
        availability: { target: 99.99, threshold: 99.9 },
        accuracy: { target: 99.5, threshold: 98.0 },
        throughput: { target: 5000, threshold: 1000 }
      }
    };
    
    const stored = await this.getSetting('agent.performance.templates', scope);
    return stored || defaultTemplates;
  }

  /**
   * Get deployment target options
   * @param scope Scope identifiers
   * @returns Deployment target configurations
   */
  static async getDeploymentTargets(scope: ScopeIdentifiers = {}): Promise<any> {
    const defaultTargets = {
      development: {
        label: "Development",
        environment: "dev",
        scalingPolicy: "manual",
        resources: { cpu: "0.5", memory: "512Mi", storage: "1Gi" },
        costTier: "minimal"
      },
      staging: {
        label: "Staging",
        environment: "staging",
        scalingPolicy: "basic",
        resources: { cpu: "1", memory: "1Gi", storage: "5Gi" },
        costTier: "low"
      },
      production: {
        label: "Production",
        environment: "prod",
        scalingPolicy: "auto",
        resources: { cpu: "2", memory: "4Gi", storage: "20Gi" },
        costTier: "standard"
      },
      enterprise: {
        label: "Enterprise",
        environment: "prod",
        scalingPolicy: "advanced",
        resources: { cpu: "4", memory: "8Gi", storage: "100Gi" },
        costTier: "premium"
      }
    };
    
    const stored = await this.getSetting('agent.deployment.targets', scope);
    return stored || defaultTargets;
  }

  /**
   * Get Memory & Context Profile options for agent configuration
   * @param scope Scope identifiers
   * @returns Memory context profile definitions with capabilities
   */
  static async getMemoryContextProfileOptions(scope: ScopeIdentifiers = {}): Promise<any> {
    const defaultProfiles = {
      "session-only": {
        key: "session-only",
        label: "Session-Only",
        description: "Memory only persists during active conversation session",
        characteristics: ["Real-time Processing", "No Persistence", "Low Resource Usage"],
        suitableFor: ["Simple Tasks", "One-off Queries", "Stateless Operations"],
        retentionPeriod: "Session Duration",
        storageType: "In-Memory",
        costMultiplier: 1.0
      },
      "short-term": {
        key: "short-term",
        label: "Short-Term Memory",
        description: "Retains context for hours to days with automatic cleanup",
        characteristics: ["Recent Context Retention", "Automatic Cleanup", "Task Continuity"],
        suitableFor: ["Multi-step Workflows", "Daily Operations", "Recent History"],
        retentionPeriod: "24-72 Hours",
        storageType: "Cache + Database",
        costMultiplier: 1.3
      },
      "long-term": {
        key: "long-term",
        label: "Long-Term Memory",
        description: "Persistent memory for extended periods with selective retention",
        characteristics: ["Extended Retention", "Selective Storage", "Historical Context"],
        suitableFor: ["Relationship Building", "Process Learning", "Long-term Projects"],
        retentionPeriod: "Weeks to Months",
        storageType: "Database + Archives",
        costMultiplier: 1.8
      },
      "episodic": {
        key: "episodic",
        label: "Episodic Memory",
        description: "Structured memory of specific events and experiences",
        characteristics: ["Event-based Storage", "Contextual Recall", "Experience Mapping"],
        suitableFor: ["Learning from Experience", "Pattern Recognition", "Case-based Reasoning"],
        retentionPeriod: "Event-based",
        storageType: "Structured Database",
        costMultiplier: 2.2
      },
      "adaptive-learning": {
        key: "adaptive-learning",
        label: "Adaptive Learning",
        description: "Dynamic memory that evolves and optimizes based on interactions",
        characteristics: ["Machine Learning", "Behavioral Adaptation", "Performance Optimization"],
        suitableFor: ["Continuous Improvement", "Personalization", "Advanced AI Systems"],
        retentionPeriod: "Permanent with Optimization",
        storageType: "ML Pipeline + Vector Store",
        costMultiplier: 3.0
      }
    };
    
    const stored = await this.getSetting('agent.memory.profile.options', scope);
    return stored || defaultProfiles;
  }

  /**
   * Get category-specific integration recommendations
   * @param category Agent category
   * @param maturityLevel Agent maturity level
   * @param scope Scope identifiers
   * @returns Recommended integrations for the category and maturity level
   */
  static async getCategoryIntegrationRecommendations(
    category: string,
    maturityLevel: string,
    scope: ScopeIdentifiers = {}
  ): Promise<any> {
    const key = `agent.category.${category}.integrations.${maturityLevel}`;
    const stored = await this.getSetting(key, scope);
    
    if (stored) return stored;
    
    // Default recommendations based on category and maturity
    const recommendations: any = {
      Reactive: {
        L0: ["webhooks", "basic_apis", "simple_triggers"],
        L1: ["event_streams", "monitoring_apis", "notification_services"],
        L2: ["complex_event_processing", "workflow_engines", "state_management"]
      },
      Deliberative: {
        L1: ["knowledge_bases", "reasoning_engines", "planning_tools"],
        L2: ["advanced_analytics", "decision_engines", "optimization_tools"],
        L3: ["collaborative_platforms", "shared_knowledge", "coordination_services"]
      },
      Learning: {
        L2: ["ml_pipelines", "data_lakes", "training_platforms"],
        L3: ["federated_learning", "model_registries", "experiment_tracking"],
        L4: ["automl_platforms", "continuous_learning", "adaptive_systems"]
      }
    };
    
    return recommendations[category]?.[maturityLevel] || [];
  }
}
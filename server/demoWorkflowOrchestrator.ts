import { db } from './db';
import { emails, activities, agentExecutions, agentExecutionSteps } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { ConfigService } from './configService';
import { getWorkflowSteps } from './demoSeedData';
import { randomUUID } from 'crypto';
import { broadcastAgentEvent } from './index';

/**
 * Demo 8-Step Workflow Orchestrator
 * Reads workflow configuration from ConfigService and executes the 8-step agentic underwriting process
 * Following NO HARD-CODING principle - all workflow steps and rules come from ConfigService
 */

export interface DemoWorkflowContext {
  emailId: number;
  userId: string;
  scenario: string;
  executionId: string;
  currentStep: number;
  totalSteps: number;
  persona: string;
  workflowData: any;
}

export class DemoWorkflowOrchestrator {
  private activeExecutions = new Map<string, DemoWorkflowContext>();

  /**
   * Start the 8-step agentic underwriting workflow for a demo email
   */
  async startDemoWorkflow(emailId: number, userId: string, scenario: string): Promise<string> {
    try {
      console.log(`🚀 Starting demo 8-step workflow for email ${emailId}, scenario: ${scenario}`);

      // Get workflow steps from ConfigService
      const workflowSteps = await getWorkflowSteps();
      if (workflowSteps.length === 0) {
        throw new Error('No workflow steps found in ConfigService');
      }

      console.log(`📋 Loaded ${workflowSteps.length} workflow steps from ConfigService`);

      // Get email data
      const [email] = await db.select().from(emails).where(eq(emails.id, emailId));
      if (!email) {
        throw new Error(`Email not found: ${emailId}`);
      }

      // Get persona from email - if not present, get from ConfigService
      let persona: string;
      if (email.persona) {
        persona = email.persona;
      } else {
        try {
          persona = await this.getDefaultPersona();
        } catch (error) {
          console.error('Failed to get default persona from ConfigService:', error);
          throw new Error('Email must have persona field or ConfigService must define demo.workflow.default_persona');
        }
      }

      // Validate all required ConfigService settings exist before starting
      await this.validateRequiredConfig(scenario, persona, workflowSteps);

      // Create execution record
      const executionId = `demo-${randomUUID()}`;
      
      // Get workflow configuration from ConfigService
      const workflowConfig = await this.getWorkflowConfig();
      
      const execution = await db.insert(agentExecutions).values({
        executionId,
        userId,
        persona,
        command: `Demo 8-step underwriting workflow - ${scenario}`,
        status: 'running',
        agentCount: workflowSteps.length,
        strategy: workflowConfig.strategy,
        metadata: JSON.stringify({
          isDemo: true,
          scenario,
          emailId,
          workflowType: workflowConfig.workflowType
        })
      }).returning();

      // Initialize workflow context
      const context: DemoWorkflowContext = {
        emailId,
        userId,
        scenario,
        executionId,
        currentStep: 0,
        totalSteps: workflowSteps.length,
        persona,
        workflowData: {
          email: email,
          steps: workflowSteps,
          results: {},
          scenario: scenario
        }
      };

      this.activeExecutions.set(executionId, context);

      // Start workflow execution
      await this.executeNextStep(context);

      // Log activity
      await db.insert(activities).values({
        userId,
        activity: `Started demo 8-step workflow: ${scenario}`,
        persona,
        status: 'completed',
        metadata: JSON.stringify({
          executionId,
          emailId,
          scenario,
          stepCount: workflowSteps.length
        })
      });

      return executionId;

    } catch (error) {
      console.error('Demo workflow startup error:', error);
      throw error;
    }
  }

  /**
   * Execute the next step in the workflow
   */
  private async executeNextStep(context: DemoWorkflowContext): Promise<void> {
    try {
      const { executionId, workflowData, currentStep, totalSteps } = context;
      
      if (currentStep >= totalSteps) {
        await this.completeWorkflow(context);
        return;
      }

      const step = workflowData.steps[currentStep];
      console.log(`🔄 Executing step ${currentStep + 1}/${totalSteps}: ${step.stepName}`);

      // Create individual execution ID for this step to get separate popup
      const stepExecutionId = `${executionId}-step-${currentStep + 1}`;
      console.log(`📋 Creating individual popup execution: ${stepExecutionId}`);

      // Create step-level execution record for individual popup
      const stepExecution = await db.insert(agentExecutions).values({
        executionId: stepExecutionId,
        userId: context.userId,
        persona: context.persona,
        command: `Step ${currentStep + 1}: ${step.stepName}`,
        status: 'running',
        agentCount: 1,
        strategy: 'demo-step',
        metadata: JSON.stringify({
          isDemo: true,
          isDemoStep: true,
          parentExecutionId: executionId,
          stepOrder: currentStep + 1,
          stepName: step.stepName,
          layer: step.layer,
          scenario: context.scenario,
          totalSteps: totalSteps
        })
      }).returning();

      // Get input data for rich display
      const stepInputs = this.getStepInputData(context, step);

      // Broadcast step execution started for individual popup AND parent workflow tracking
      this.broadcastStepExecutionEvent(stepExecutionId, 'execution_started', {
        executionId: stepExecutionId,
        stepName: step.stepName,
        agentType: step.agentType,
        layer: step.layer,
        description: step.description,
        inputs: stepInputs,
        stepOrder: currentStep + 1,
        totalSteps: totalSteps
      });

      // Also broadcast to parent execution for workflow-level tracking
      this.broadcastStepEvent(executionId, 'step_started', step, currentStep + 1);

      // Create step execution record
      const startTime = new Date();
      const stepId = await db.insert(agentExecutionSteps).values({
        executionId: stepExecutionId, // Use step-specific execution ID
        stepOrder: 1, // Always 1 for individual step execution
        layer: step.layer,
        agentId: null, // Demo steps use virtual agents
        agentName: step.stepName,
        agentType: step.agentType,
        action: step.description,
        status: 'running',
        startedAt: startTime,
        inputData: stepInputs
      }).returning({ id: agentExecutionSteps.id });

      // Broadcast step started for detailed step tracking
      this.broadcastStepExecutionEvent(stepExecutionId, 'step_started', {
        executionId: stepExecutionId,
        stepId: stepId[0].id,
        stepName: step.stepName,
        agentName: step.stepName,
        agentType: step.agentType,
        layer: step.layer,
        action: step.description,
        status: 'running',
        inputs: stepInputs
      });

      // Get business rules for this step using explicit config key
      const stepConfigKey = step.key || `step_${currentStep + 1}_${step.stepName.toLowerCase().replace(/\s+/g, '_')}`;
      const businessRules = await this.getStepBusinessRules(stepConfigKey, context.persona);

      // Simulate step execution
      const stepResult = await this.executeStep(context, step, businessRules, currentStep + 1);

      // Update step record with correct duration calculation
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      await db.update(agentExecutionSteps)
        .set({
          status: 'completed',
          completedAt: endTime,
          duration,
          outputData: stepResult
        })
        .where(eq(agentExecutionSteps.id, stepId[0].id));

      // Store step result
      workflowData.results[step.stepName] = stepResult;

      // Update step execution as completed
      await db.update(agentExecutions)
        .set({
          status: 'completed',
          completedAt: endTime,
          totalDuration: duration,
          result: JSON.stringify(stepResult)
        })
        .where(eq(agentExecutions.executionId, stepExecutionId));

      // Get next step for recommendation
      const nextStep = currentStep + 1 < totalSteps ? workflowData.steps[currentStep + 1] : null;

      // Broadcast step completed with rich content for popup
      this.broadcastStepExecutionEvent(stepExecutionId, 'step_completed', {
        executionId: stepExecutionId,
        stepId: stepId[0].id,
        stepName: step.stepName,
        agentName: step.stepName,
        agentType: step.agentType,
        layer: step.layer,
        action: step.description,
        status: 'completed',
        duration: duration,
        inputs: stepInputs,
        outputs: stepResult,
        nextAction: nextStep ? `Next: ${nextStep.stepName}` : 'Workflow Complete'
      });

      this.broadcastStepExecutionEvent(stepExecutionId, 'execution_completed', {
        executionId: stepExecutionId,
        totalDuration: duration,
        message: `${step.stepName} completed successfully`,
        layersExecuted: 1,
        result: stepResult,
        nextAction: nextStep ? `Next: ${nextStep.stepName}` : 'Workflow Complete'
      });

      // Also broadcast to parent execution for workflow-level tracking
      this.broadcastStepEvent(executionId, 'step_completed', step, currentStep + 1, stepResult, duration);

      // Check if we should continue to next step
      const shouldContinue = await this.evaluateStepTransition(context, step, stepResult, businessRules);

      if (shouldContinue) {
        // Move to next step
        context.currentStep++;
        this.activeExecutions.set(executionId, context);

        // Get inter-step delay from ConfigService
        const interStepDelay = await this.getInterStepDelay(step, context.scenario);
        setTimeout(() => {
          this.executeNextStep(context);
        }, interStepDelay);
      } else {
        await this.completeWorkflow(context, stepResult.reason || 'Workflow stopped by business rules');
      }

    } catch (error) {
      console.error('Step execution error:', error);
      await this.handleWorkflowError(context, error);
    }
  }

  /**
   * Execute individual step with realistic simulation
   */
  private async executeStep(context: DemoWorkflowContext, step: any, businessRules: any, stepOrder: number): Promise<any> {
    const { workflowData } = context;
    
    console.log(`⚡ Processing ${step.stepName} - ${step.description}`);

    // Get processing time from ConfigService
    const processingTime = await this.getStepProcessingTime(step, workflowData.scenario);
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Generate realistic step output based on step type
    const stepOutput = await this.generateStepOutput(step, workflowData, businessRules, stepOrder);

    // Apply business rules to determine outcome
    const ruleEvaluation = await this.evaluateBusinessRules(businessRules, stepOutput, workflowData);

    return {
      stepName: step.stepName,
      agentType: step.agentType,
      layer: step.layer,
      inputs: step.inputs,
      outputs: step.outputs,
      processingTime: step.processingTime,
      successCriteria: step.successCriteria,
      stepOutput,
      ruleEvaluation,
      nextAction: step.nextAction,
      timestamp: new Date(),
      status: 'completed'
    };
  }

  /**
   * Generate ConfigService-driven output for each step type
   */
  private async generateStepOutput(step: any, workflowData: any, businessRules: any, stepOrder: number): Promise<any> {
    const { email, scenario } = workflowData;
    
    try {
      // Get step output template from ConfigService
      const persona = email.persona || await this.getDefaultPersona();
      const outputTemplate = await ConfigService.getSetting(
        `demo.workflow.output-templates.${step.key || step.stepName.toLowerCase().replace(/\s+/g, '_')}`,
        { persona }
      );

      if (outputTemplate) {
        // Use ConfigService-driven template
        return this.renderOutputTemplate(outputTemplate, { email, scenario, step });
      }

      // NO FALLBACK - require ConfigService template
      throw new Error(`No output template found for step ${step.stepName}. Configure demo.workflow.output-templates.${step.key || step.stepName.toLowerCase().replace(/\s+/g, '_')} in ConfigService.`);
      
    } catch (error) {
      console.error(`ConfigService template required for step ${step.stepName}:`, error);
      throw new Error(`Output template must be configured in ConfigService for step: ${step.stepName}`);
    }
  }

  /**
   * Validate all required ConfigService settings exist before workflow starts
   */
  private async validateRequiredConfig(scenario: string, persona: string, workflowSteps: any[]): Promise<void> {
    const missingConfig: string[] = [];

    try {
      // Validate workflow configuration
      await this.getWorkflowConfig();
    } catch (error) {
      missingConfig.push('demo.workflow.config (strategy, workflowType)');
    }

    // Validate scenario configuration
    try {
      const scenarioConfig = await this.getScenarioConfig(scenario);
      if (!scenarioConfig) {
        missingConfig.push(`demo.scenarios.${scenario}`);
      }
    } catch (error) {
      missingConfig.push(`demo.scenarios.${scenario}`);
    }

    // Validate output templates for all steps
    for (const step of workflowSteps) {
      try {
        const templateKey = step.key || step.stepName.toLowerCase().replace(/\s+/g, '_');
        const template = await ConfigService.getSetting(
          `demo.workflow.output-templates.${templateKey}`,
          { persona }
        );
        if (!template) {
          missingConfig.push(`demo.workflow.output-templates.${templateKey}`);
        }
      } catch (error) {
        missingConfig.push(`demo.workflow.output-templates.${step.key || step.stepName}`);
      }
    }

    // Validate business rules for all steps
    for (const step of workflowSteps) {
      try {
        const ruleKey = step.key || step.stepName.toLowerCase().replace(/\s+/g, '_');
        const rules = await ConfigService.getSetting(
          `demo.workflow.rules.${ruleKey}_rules`,
          { persona }
        );
        // Rules are optional, just warn if missing
        if (!rules) {
          console.warn(`No business rules configured for step: ${ruleKey}`);
        }
      } catch (error) {
        console.warn(`No business rules configured for step: ${step.stepName}`);
      }
    }

    if (missingConfig.length > 0) {
      throw new Error(`Missing required ConfigService settings:\n${missingConfig.map(key => `- ${key}`).join('\n')}\n\nPlease run the demo seed endpoint first to configure all required settings.`);
    }
  }

  /**
   * Get workflow configuration from ConfigService
   */
  private async getWorkflowConfig(): Promise<any> {
    try {
      const config = await ConfigService.getSetting('demo.workflow.config', {});
      if (!config || !config.strategy || !config.workflowType) {
        throw new Error('Workflow config must include strategy and workflowType');
      }
      return config;
    } catch (error) {
      console.error('Failed to get workflow config from ConfigService:', error);
      throw new Error('demo.workflow.config must be configured in ConfigService with strategy and workflowType');
    }
  }

  /**
   * Get step processing time from ConfigService
   */
  private async getStepProcessingTime(step: any, scenario: string): Promise<number> {
    try {
      // Try step-specific processing time first
      const stepConfig = await ConfigService.getSetting(
        `demo.workflow.step-timing.${step.key || step.stepName.toLowerCase().replace(/\s+/g, '_')}`,
        {}
      );
      if (stepConfig?.processingTime) {
        return stepConfig.processingTime;
      }

      // Fall back to scenario-specific timing
      const scenarioConfig = await this.getScenarioConfig(scenario);
      if (scenarioConfig?.defaultProcessingTime) {
        return scenarioConfig.defaultProcessingTime;
      }

      // Final fallback to workflow default
      const workflowConfig = await this.getWorkflowConfig();
      if (workflowConfig?.defaultProcessingTime) {
        return workflowConfig.defaultProcessingTime;
      }

      // Safe default: 1-2 seconds processing time if no config found
      return 1000 + Math.random() * 1000; // 1-2 seconds
      
    } catch (error) {
      console.warn(`Using default processing time for step ${step.stepName}:`, error);
      return 1000 + Math.random() * 1000; // Safe default: 1-2 seconds
    }
  }

  /**
   * Render output template with context data
   */
  private renderOutputTemplate(template: any, context: any): any {
    // Simple template rendering - can be enhanced with handlebars or similar
    if (typeof template === 'object' && template !== null) {
      return JSON.parse(JSON.stringify(template).replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return context[key] || match;
      }));
    }
    return template;
  }

  /**
   * Get business rules for a specific step
   */
  private async getStepBusinessRules(stepKey: string, persona?: string): Promise<any> {
    try {
      const defaultPersona = persona || await this.getDefaultPersona();
      const rules = await ConfigService.getSetting(
        `demo.workflow.rules.${stepKey}_rules`,
        { persona: defaultPersona }
      );
      return rules || {};
    } catch (error) {
      console.warn(`No business rules found for step: ${stepKey}`);
      return {};
    }
  }

  /**
   * Get default persona from ConfigService - throws if not configured
   */
  private async getDefaultPersona(): Promise<string> {
    try {
      const defaultPersona = await ConfigService.getSetting(
        'demo.workflow.default_persona',
        {}
      );
      if (!defaultPersona) {
        throw new Error('No default persona configured in ConfigService. Configure demo.workflow.default_persona setting.');
      }
      return defaultPersona;
    } catch (error) {
      console.error('No default persona configured in ConfigService:', error);
      throw new Error('Default persona must be configured in ConfigService under demo.workflow.default_persona');
    }
  }

  /**
   * Evaluate business rules for step transition
   */
  private async evaluateStepTransition(context: DemoWorkflowContext, step: any, stepResult: any, businessRules: any): Promise<boolean> {
    // For demo purposes, always continue to next step unless it's the last step
    // In production, this would evaluate complex business rules
    
    if (businessRules?.conditions) {
      // Simple rule evaluation example
      if (businessRules.conditions.requiresReferral && stepResult.stepOutput.referralTriggers?.length > 0) {
        console.log(`⚠️ Step ${step.stepName} triggered referral - continuing workflow`);
      }
    }

    return context.currentStep < context.totalSteps - 1;
  }

  /**
   * Evaluate business rules against step output
   */
  private async evaluateBusinessRules(businessRules: any, stepOutput: any, workflowData: any): Promise<any> {
    if (!businessRules || !businessRules.conditions) {
      return { status: 'no_rules', continue: true };
    }

    // Simple rule evaluation - can be enhanced with json-logic or similar
    const evaluation = {
      rulesApplied: Object.keys(businessRules.conditions),
      results: {},
      continue: true,
      actions: businessRules.actions || []
    };

    return evaluation;
  }

  /**
   * Get input data for a step
   */
  private getStepInputData(context: DemoWorkflowContext, step: any): any {
    const { workflowData, currentStep } = context;
    
    if (currentStep === 0) {
      // First step gets email data
      return {
        email: workflowData.email,
        scenario: workflowData.scenario
      };
    }

    // Subsequent steps get output from previous steps
    const previousResults = Object.values(workflowData.results);
    return {
      previousStepOutputs: previousResults,
      cumulativeData: workflowData.results
    };
  }

  /**
   * Complete the workflow
   */
  private async completeWorkflow(context: DemoWorkflowContext, reason?: string): Promise<void> {
    const { executionId, userId, emailId, scenario } = context;

    try {
      // Update execution status
      await db.update(agentExecutions)
        .set({ 
          status: 'completed',
          completedAt: new Date(),
          result: JSON.stringify({
            workflowCompleted: true,
            totalSteps: context.totalSteps,
            finalResults: context.workflowData.results,
            reason
          })
        })
        .where(eq(agentExecutions.executionId, executionId));

      // Broadcast workflow completion
      this.broadcastWorkflowEvent(executionId, 'workflow_completed', {
        totalSteps: context.totalSteps,
        scenario,
        results: context.workflowData.results
      });

      // Get persona from workflow context
      const persona = context.persona;
      
      // Log completion activity
      await db.insert(activities).values({
        userId,
        activity: `Completed demo 8-step workflow: ${scenario}`,
        persona,
        status: 'completed',
        metadata: JSON.stringify({
          executionId,
          emailId,
          scenario,
          totalSteps: context.totalSteps,
          completionReason: reason
        })
      });

      // Clean up
      this.activeExecutions.delete(executionId);

      console.log(`✅ Demo workflow ${executionId} completed successfully`);

    } catch (error) {
      console.error('Workflow completion error:', error);
      await this.handleWorkflowError(context, error);
    }
  }

  /**
   * Handle workflow errors
   */
  private async handleWorkflowError(context: DemoWorkflowContext, error: any): Promise<void> {
    const { executionId, userId } = context;

    try {
      await db.update(agentExecutions)
        .set({ 
          status: 'failed',
          result: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            failedAt: new Date()
          })
        })
        .where(eq(agentExecutions.executionId, executionId));

      this.broadcastWorkflowEvent(executionId, 'workflow_failed', {
        error: error instanceof Error ? error.message : String(error)
      });

      this.activeExecutions.delete(executionId);

    } catch (updateError) {
      console.error('Error updating failed workflow:', updateError);
    }
  }

  /**
   * Broadcast step execution events to WebSocket clients for individual popups
   */
  private broadcastStepExecutionEvent(executionId: string, eventType: string, data: any): void {
    try {
      const event = {
        type: eventType,
        ...data,
        timestamp: new Date().toISOString()
      };

      console.log(`📡 Broadcasting step execution event ${eventType} for ${executionId}`);
      broadcastAgentEvent(executionId, event);
    } catch (error) {
      console.error('Error broadcasting step execution event:', error);
    }
  }

  /**
   * Broadcast step events to WebSocket clients
   */
  private broadcastStepEvent(executionId: string, eventType: string, step: any, stepOrder: number, result?: any, measuredDuration?: number): void {
    try {
      const event = {
        type: eventType,
        executionId,
        stepId: `demo-step-${stepOrder}`,
        stepOrder,
        layer: step.layer,
        agentName: step.stepName,
        agentType: step.agentType,
        description: step.description,
        action: step.description,
        status: eventType === 'step_started' ? 'running' : 'completed',
        timestamp: new Date().toISOString(),
        ...(result && { outputData: result, duration: measuredDuration || step.processingTime })
      };

      broadcastAgentEvent(executionId, event);
    } catch (error) {
      console.error('Error broadcasting step event:', error);
    }
  }

  /**
   * Broadcast workflow events
   */
  private broadcastWorkflowEvent(executionId: string, eventType: string, data: any): void {
    try {
      const event = {
        type: eventType,
        executionId,
        ...data,
        timestamp: new Date().toISOString()
      };

      broadcastAgentEvent(executionId, event);
    } catch (error) {
      console.error('Error broadcasting workflow event:', error);
    }
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(executionId: string): DemoWorkflowContext | null {
    return this.activeExecutions.get(executionId) || null;
  }

  /**
   * Get inter-step delay from ConfigService
   */
  private async getInterStepDelay(step: any, scenario: string): Promise<number> {
    try {
      // Try step-specific delay first
      const stepConfig = await ConfigService.getSetting(
        `demo.workflow.step-timing.${step.key || step.stepName.toLowerCase().replace(/\s+/g, '_')}`,
        {}
      );
      if (stepConfig?.interStepDelay) {
        return stepConfig.interStepDelay;
      }

      // Fall back to scenario-specific delay
      const scenarioConfig = await this.getScenarioConfig(scenario);
      if (scenarioConfig?.interStepDelay) {
        return scenarioConfig.interStepDelay;
      }

      // Final fallback to workflow default
      const workflowConfig = await this.getWorkflowConfig();
      if (workflowConfig?.interStepDelay) {
        return workflowConfig.interStepDelay;
      }

      // Safe default: 1 second between steps if no config found
      return 1000;
      
    } catch (error) {
      console.warn(`Using default inter-step delay for step ${step.stepName}:`, error);
      return 1000; // Safe default: 1 second
    }
  }

  /**
   * Get scenario-specific configuration from ConfigService
   */
  private async getScenarioConfig(scenario: string): Promise<any> {
    try {
      return await ConfigService.getSetting(
        `demo.scenarios.${scenario}`,
        {}
      );
    } catch (error) {
      console.warn(`No scenario config found for: ${scenario}`);
      return {};
    }
  }

  /**
   * Get all active workflows
   */
  getActiveWorkflows(): DemoWorkflowContext[] {
    return Array.from(this.activeExecutions.values());
  }
}

// Export singleton instance
export const demoWorkflowOrchestrator = new DemoWorkflowOrchestrator();
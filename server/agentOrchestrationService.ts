import { db } from './db';
import { agents, agentExecutions, agentExecutionSteps, agentExecutionLogs, experienceLayer, metaBrainLayer } from '@shared/schema';
import { eq, and, or, desc, isNull } from 'drizzle-orm';
import { storage } from './storage';
import { nanoid } from 'nanoid';
import { ConfigService } from './configService';
import jsonLogic from 'json-logic-js';
import { broadcastAgentEvent } from './index';

export interface AgentExecutionRequest {
  persona: string;
  command: string;
  userId: string;
  orchestrationStrategy?: 'sequential' | 'parallel' | 'hybrid';
}

export interface ExecutionContext {
  executionId: string;
  persona: string;
  command: string;
  userId: string;
  companyContext?: any;
  strategy: 'sequential' | 'parallel' | 'hybrid';
}

export interface AgentsByLayer {
  experience: any[];
  metaBrain: any[];
  role: any[];
  process: any[];
  system: any[];
  interface: any[];
}

export interface AgentSelectionContext {
  command: string;
  persona: string;
  workflowId?: number;
  agentId?: number;
  layer?: string;
  // Additional context for more sophisticated rules
  documentType?: string;
  riskLevel?: string;
  priority?: 'high' | 'medium' | 'low';
}

export class AgentOrchestrationService {
  private activeExecutions = new Map<string, any>();
  private executionListeners = new Map<string, ((update: any) => void)[]>();

  // Subscribe to execution updates for SSE/WebSocket
  subscribeToExecution(executionId: string, callback: (update: any) => void) {
    if (!this.executionListeners.has(executionId)) {
      this.executionListeners.set(executionId, []);
    }
    this.executionListeners.get(executionId)!.push(callback);
  }

  // Unsubscribe from execution updates
  unsubscribeFromExecution(executionId: string, callback: (update: any) => void) {
    const listeners = this.executionListeners.get(executionId);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      if (listeners.length === 0) {
        this.executionListeners.delete(executionId);
      }
    }
  }

  // Emit execution update to all subscribers and WebSocket clients
  private emitExecutionUpdate(executionId: string, update: any) {
    // Emit to internal listeners (SSE)
    const listeners = this.executionListeners.get(executionId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          console.error('Error in execution listener callback:', error);
        }
      });
    }

    // Broadcast to WebSocket clients
    try {
      broadcastAgentEvent(executionId, update);
    } catch (error) {
      console.error('Error broadcasting WebSocket event:', error);
    }
  }

  // Get agents filtered by persona and layer - Phase 5: Use unified hierarchy config
  async getAgentsByLayer(persona: string): Promise<AgentsByLayer> {
    try {
      // Use unified hierarchy config as single source of truth
      const { HierarchyConfigResolver } = await import('./services/hierarchyConfigResolver');
      const hierarchyConfig = await HierarchyConfigResolver.getUnifiedHierarchyConfig({ persona });

      // Transform unified config to legacy format for backward compatibility
      const result: AgentsByLayer = {
        experience: [],
        metaBrain: [],
        role: [],
        process: [],
        system: [],
        interface: []
      };

      // Add Experience Layer
      if (hierarchyConfig.experienceLayer) {
        result.experience = [{
          id: hierarchyConfig.experienceLayer.id,
          name: hierarchyConfig.experienceLayer.companyName,
          type: 'Insurance Company',
          layer: 'Experience',
          config: hierarchyConfig.experienceLayer,
          status: 'active'
        }];
      }

      // Add Meta Brain Layer
      if (hierarchyConfig.metaBrainLayer) {
        result.metaBrain = [{
          id: hierarchyConfig.metaBrainLayer.id,
          name: hierarchyConfig.metaBrainLayer.orchestratorName,
          type: 'Central Orchestrator',
          layer: 'Meta Brain',
          config: hierarchyConfig.metaBrainLayer,
          status: 'active'
        }];
      }

      // Map hierarchy layers to legacy format
      hierarchyConfig.layers.forEach((layerData: any) => {
        switch (layerData.layer) {
          case 'Role':
            result.role = layerData.agents;
            break;
          case 'Process':
            result.process = layerData.agents;
            break;
          case 'System':
            result.system = layerData.agents;
            break;
          case 'Interface':
            result.interface = layerData.agents;
            break;
        }
      });

      return result;
    } catch (error) {
      console.error('Error fetching agents by layer via unified config:', error);
      throw error;
    }
  }

  // Start agent execution orchestration
  async startExecution(request: AgentExecutionRequest): Promise<string> {
    // Prevent multiple simultaneous executions for the same user
    const existingExecution = Array.from(this.activeExecutions.entries())
      .find(([_, exec]) => exec.context.userId === request.userId && exec.status === 'running');
    
    if (existingExecution) {
      console.log(`⚠️ User ${request.userId} already has active execution: ${existingExecution[0]}`);
      return existingExecution[0]; // Return existing execution ID
    }

    const executionId = `exec_${nanoid(12)}`;
    const startTime = new Date();

    try {
      // Get company context from experience layer
      const experienceConfig = await storage.getExperienceLayer();
      
      // Create execution record
      await db.insert(agentExecutions).values({
        executionId,
        userId: request.userId,
        persona: request.persona,
        command: request.command,
        companyContext: experienceConfig,
        orchestrationStrategy: request.orchestrationStrategy || 'sequential',
        status: 'initializing',
        startedAt: startTime,
        agentCount: 0,
        layersInvolved: []
      });

      // Get agents by layer for this persona
      const agentsByLayer = await this.getAgentsByLayer(request.persona);

      // Create execution context
      const context: ExecutionContext = {
        executionId,
        persona: request.persona,
        command: request.command,
        userId: request.userId,
        companyContext: experienceConfig,
        strategy: request.orchestrationStrategy || 'sequential'
      };

      // Store active execution
      this.activeExecutions.set(executionId, {
        context,
        agentsByLayer,
        startTime,
        currentStep: 0,
        status: 'running'
      });

      // Store execution but don't start immediately - wait for WebSocket subscription
      console.log(`⏳ Execution ${executionId} created, waiting for client subscription...`);
      
      // The execution will be started when WebSocket client subscribes

      return executionId;
    } catch (error) {
      console.error('Error starting execution:', error);
      // Update execution status to error
      await db.update(agentExecutions)
        .set({ status: 'error', errorDetails: { message: error instanceof Error ? error.message : String(error) }, completedAt: new Date() })
        .where(eq(agentExecutions.executionId, executionId));
      throw error;
    }
  }

  // Start execution when client subscribes (called from WebSocket handler)
  startPendingExecution(executionId: string) {
    const execution = this.activeExecutions.get(executionId);
    if (execution && execution.status === 'running') {
      console.log(`🚀 Starting execution on client subscription: ${executionId}`);
      this.executeOrchestrationFlow(execution.context, execution.agentsByLayer).catch(error => {
        console.error(`Execution ${executionId} failed:`, error);
        this.handleExecutionError(executionId, error);
      });
    }
  }

  // Execute the 6-layer orchestration flow
  private async executeOrchestrationFlow(context: ExecutionContext, agentsByLayer: AgentsByLayer) {
    const { executionId, persona, command } = context;
    let stepOrder = 0;

    try {
      // Update execution status to running
      await db.update(agentExecutions)
        .set({ status: 'running', agentCount: this.getTotalAgentCount(agentsByLayer) })
        .where(eq(agentExecutions.executionId, executionId));

      console.log(`🚀 Starting executeOrchestrationFlow for ${executionId}`);
      
      this.emitExecutionUpdate(executionId, {
        type: 'execution_started',
        executionId,
        status: 'running',
        message: 'Starting 6-layer agent orchestration...'
      });
      
      console.log(`📡 Broadcasted execution_started event for ${executionId}`);

      // Layer 1: Experience Layer - Initialize company context
      console.log(`📋 Layer 1: Experience agents available: ${agentsByLayer.experience.length}`);
      if (agentsByLayer.experience.length > 0) {
        console.log(`🎯 Executing Experience layer with agent: ${agentsByLayer.experience[0].name}`);
        await this.executeStep(executionId, ++stepOrder, 'Experience', agentsByLayer.experience[0], 
          agentsByLayer.experience[0].specialization || agentsByLayer.experience[0].description || 'Initialize company configuration and persona context', { command, persona });
        console.log(`✅ Experience layer completed`);
      } else {
        console.log(`🔄 Executing virtual Experience layer`);
        await this.executeVirtualStep(executionId, ++stepOrder, 'Experience', 
          'ABC Insurance Experience Layer', 'Initialize company configuration and persona context', { command, persona });
        console.log(`✅ Virtual Experience layer completed`);
      }

      // Layer 2: Meta Brain Layer - Orchestrate routing
      if (agentsByLayer.metaBrain.length > 0) {
        await this.executeStep(executionId, ++stepOrder, 'Meta Brain', agentsByLayer.metaBrain[0],
          agentsByLayer.metaBrain[0].specialization || agentsByLayer.metaBrain[0].description || `Route request to ${persona} functions and coordinate workflow`, { command, persona });
      } else {
        // Create virtual meta brain layer execution
        await this.executeVirtualStep(executionId, ++stepOrder, 'Meta Brain', 
          'JARVIS Meta Brain Orchestrator', `Route request to ${persona} functions and coordinate workflow`, { command, persona });
      }

      // Layer 3: Role Layer - Execute persona-specific agent
      if (agentsByLayer.role.length > 0) {
        const roleAgent = await this.selectBestAgent(agentsByLayer.role, persona, command, 'Role');
        await this.executeStep(executionId, ++stepOrder, 'Role', roleAgent,
          this.getRoleAgentAction(roleAgent, persona, command), { command, persona });
      }

      // Layer 4: Process Layer - Invoke workflow agents with contextual selection
      if (agentsByLayer.process.length > 0) {
        const selectedProcessAgents = await this.selectAgents({
          command,
          persona,
          layer: 'Process'
        }, agentsByLayer.process);
        
        // Execute selected agents or fallback to first 2 if no rules match
        const agentsToExecute = selectedProcessAgents.length > 0 ? 
          selectedProcessAgents.slice(0, 2) : 
          agentsByLayer.process.slice(0, 2);
          
        // Execute with optional parallel processing
        stepOrder = await this.executeLayerAgents(executionId, stepOrder, 'Process', agentsToExecute, { command, persona });
      }

      // Layer 5: System Layer - Execute core processing with contextual selection
      if (agentsByLayer.system.length > 0) {
        const selectedSystemAgents = await this.selectAgents({
          command,
          persona,
          layer: 'System'
        }, agentsByLayer.system);
        
        // Execute selected agents or fallback to first 3 if no rules match
        const agentsToExecute = selectedSystemAgents.length > 0 ? 
          selectedSystemAgents.slice(0, 3) : 
          agentsByLayer.system.slice(0, 3);
          
        // Execute with optional parallel processing
        stepOrder = await this.executeLayerAgents(executionId, stepOrder, 'System', agentsToExecute, { command, persona });
      }

      // Layer 6: Interface Layer - Handle output
      if (agentsByLayer.interface.length > 0) {
        const interfaceAgent = await this.selectBestAgent(agentsByLayer.interface, persona, command, 'Interface');
        await this.executeStep(executionId, ++stepOrder, 'Interface', interfaceAgent,
          interfaceAgent.specialization || interfaceAgent.description || 'Present results through appropriate interface', { command, persona, results: 'Execution completed successfully' });
      }

      console.log(`🏁 All 6 layers completed for ${executionId}`);
      console.log(`📡 About to send execution_completed event for ${executionId}`);

      try {
        // Complete execution
        const endTime = new Date();
        const totalDuration = endTime.getTime() - (this.activeExecutions.get(executionId)?.startTime?.getTime() || 0);
        console.log(`🕐 Total duration calculated: ${totalDuration}ms`);

        console.log(`💾 Updating database with completion status...`);
        await db.update(agentExecutions)
          .set({ 
            status: 'completed', 
            completedAt: endTime,
            totalDuration,
            result: { message: 'Multi-layer agent orchestration completed successfully', executedLayers: stepOrder }
          })
          .where(eq(agentExecutions.executionId, executionId));
        console.log(`✅ Database updated successfully!`);

        console.log(`📤 Emitting execution_completed event...`);
        this.emitExecutionUpdate(executionId, {
          type: 'execution_completed',
          executionId,
          status: 'completed',
          message: 'Agent orchestration completed successfully',
          totalDuration,
          layersExecuted: stepOrder
        });
        console.log(`✅ execution_completed event emitted successfully!`);

      } catch (error) {
        console.error(`❌ Error in completion flow:`, error);
      }

      // Clean up
      this.activeExecutions.delete(executionId);
      setTimeout(() => this.executionListeners.delete(executionId), 30000); // Clean up listeners after 30s

    } catch (error) {
      await this.handleExecutionError(executionId, error);
    }
  }

  // Execute agents in a layer with optional parallel processing (Universal Framework)
  private async executeLayerAgents(executionId: string, currentStepOrder: number, layer: string, agents: any[], inputData: any): Promise<number> {
    if (agents.length === 0) return currentStepOrder;
    
    // Simple parallel check - only if multiple agents and parallel enabled
    const shouldUseParallel = await this.shouldUseParallelExecution(layer, agents);
    
    if (shouldUseParallel && agents.length > 1) {
      console.log(`🔄 Executing ${agents.length} ${layer} agents in PARALLEL`);
      return await this.executeParallelAgents(executionId, currentStepOrder, layer, agents, inputData);
    } else {
      console.log(`➡️ Executing ${agents.length} ${layer} agents SEQUENTIALLY`);
      return await this.executeSequentialAgents(executionId, currentStepOrder, layer, agents, inputData);
    }
  }

  // Check if parallel execution should be used (simple config-driven)
  private async shouldUseParallelExecution(layer: string, agents: any[]): Promise<boolean> {
    try {
      // Only check if multiple agents - single agents are always sequential
      if (agents.length <= 1) return false;
      
      const config = await ConfigService.getSetting('layer-parallel-groups.config');
      if (!config || !config.enabled) return false;
      
      const layerConfig = config[layer];
      if (!layerConfig || !Array.isArray(layerConfig)) return false;
      
      // Check if any group for this layer is enabled
      return layerConfig.some((group: any) => group.enabled && group.execution === 'parallel');
    } catch (error) {
      console.log(`ℹ️ No parallel config for ${layer}, using sequential`);
      return false;
    }
  }

  // Execute agents in parallel with grouping
  private async executeParallelAgents(executionId: string, startStepOrder: number, layer: string, agents: any[], inputData: any): Promise<number> {
    const groupId = `parallel_${layer}_${Date.now()}`;
    let stepOrder = startStepOrder;
    
    // Execute all agents in parallel but emit grouped WebSocket events
    const promises = agents.map(async (agent, index) => {
      const currentStepOrder = ++stepOrder;
      const action = agent.specialization || agent.description || this.getAgentAction(agent, layer, inputData.command);
      
      return this.executeStepWithGrouping(executionId, currentStepOrder, layer, agent, action, inputData, {
        groupId,
        isParallel: true,
        totalInGroup: agents.length,
        indexInGroup: index
      });
    });
    
    // Wait for all parallel agents to complete
    await Promise.all(promises);
    return stepOrder;
  }

  // Execute agents sequentially (default behavior)
  private async executeSequentialAgents(executionId: string, startStepOrder: number, layer: string, agents: any[], inputData: any): Promise<number> {
    let stepOrder = startStepOrder;
    
    for (const agent of agents) {
      const action = agent.specialization || agent.description || this.getAgentAction(agent, layer, inputData.command);
      await this.executeStep(executionId, ++stepOrder, layer, agent, action, inputData);
    }
    
    return stepOrder;
  }

  // Get appropriate action for agent based on layer
  private getAgentAction(agent: any, layer: string, command: string): string {
    switch (layer) {
      case 'Process':
        return this.getProcessAgentAction(agent, command);
      case 'System':
        return this.getSystemAgentAction(agent, command);
      default:
        return `Execute ${agent.name} operations`;
    }
  }

  // Execute step with parallel grouping information
  private async executeStepWithGrouping(executionId: string, stepOrder: number, layer: string, agent: any, action: string, inputData: any, groupInfo: any) {
    console.log(`🚀 executeStepWithGrouping START: ${layer} - ${agent.name} (Step ${stepOrder}) [Group: ${groupInfo.groupId}]`);
    const startTime = new Date();

    try {
      // Generate step ID for WebSocket events
      const stepId = `step_${executionId}_${stepOrder}`;
      
      console.log(`📡 Emitting step_started for ${agent.name} in parallel group`);
      // Emit step started with parallel grouping information
      this.emitExecutionUpdate(executionId, {
        type: 'step_started',
        executionId,
        stepId,
        stepOrder,
        layer,
        agentName: agent.name,
        agentType: agent.type || 'Agent',
        specialization: agent.specialization,
        description: agent.description,
        capabilities: agent.config?.capabilities,
        action,
        status: 'running',
        // Parallel group information
        groupId: groupInfo.groupId,
        isParallel: groupInfo.isParallel,
        totalInGroup: groupInfo.totalInGroup,
        indexInGroup: groupInfo.indexInGroup
      });

      // Simulate realistic agent processing time
      const processingTime = this.calculateProcessingTime(layer, agent.name);
      console.log(`⏱️ Processing ${agent.name} for ${processingTime}ms in parallel`);
      await new Promise(resolve => setTimeout(resolve, processingTime));

      // Generate realistic output
      console.log(`📊 Generating output for ${agent.name}`);
      const outputData = this.generateStepOutput(layer, agent, action, inputData);
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      console.log(`📡 Emitting step_completed for ${agent.name} (${duration}ms) in parallel group`);
      // Emit step completed with parallel grouping information
      this.emitExecutionUpdate(executionId, {
        type: 'step_completed',
        executionId,
        stepId,
        stepOrder,
        layer,
        agentName: agent.name,
        agentType: agent.type || 'Agent',
        specialization: agent.specialization,
        description: agent.description,
        capabilities: agent.config?.capabilities,
        action,
        status: 'completed',
        duration,
        outputData,
        // Parallel group information
        groupId: groupInfo.groupId,
        isParallel: groupInfo.isParallel,
        totalInGroup: groupInfo.totalInGroup,
        indexInGroup: groupInfo.indexInGroup
      });

      console.log(`✅ executeStepWithGrouping COMPLETED: ${layer} - ${agent.name} (Step ${stepOrder})`);

    } catch (error) {
      console.error(`❌ Error in parallel step execution ${executionId}:${stepOrder}:`, error);
      throw error;
    }
  }

  // Execute individual step in the orchestration - SIMPLIFIED FOR DEBUGGING
  private async executeStep(executionId: string, stepOrder: number, layer: string, agent: any, action: string, inputData: any) {
    console.log(`🚀 executeStep START: ${layer} - ${agent.name} (Step ${stepOrder})`);
    const startTime = new Date();

    try {
      // Generate a simple step ID for WebSocket events
      const stepId = `step_${executionId}_${stepOrder}`;
      
      console.log(`📡 Emitting step_started for ${agent.name}`);
      // Emit step started immediately with full agent information
      this.emitExecutionUpdate(executionId, {
        type: 'step_started',
        executionId,
        stepId,
        stepOrder,
        layer,
        agentName: agent.name,
        agentType: agent.type || 'Agent',
        specialization: agent.specialization,
        description: agent.description,
        capabilities: agent.config?.capabilities,
        action,
        status: 'running'
      });

      // Simulate realistic agent processing time
      const processingTime = this.calculateProcessingTime(layer, agent.name);
      console.log(`⏱️ Processing ${agent.name} for ${processingTime}ms`);
      await new Promise(resolve => setTimeout(resolve, processingTime));

      // Generate realistic output
      console.log(`📊 Generating output for ${agent.name}`);
      const outputData = this.generateStepOutput(layer, agent, action, inputData);
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      console.log(`📡 Emitting step_completed for ${agent.name} (${duration}ms)`);
      // Emit step completed with full agent information
      this.emitExecutionUpdate(executionId, {
        type: 'step_completed',
        executionId,
        stepId,
        stepOrder,
        layer,
        agentName: agent.name,
        agentType: agent.type || 'Agent',
        specialization: agent.specialization,
        description: agent.description,
        capabilities: agent.config?.capabilities,
        action,
        status: 'completed',
        duration,
        outputData
      });

      console.log(`✅ executeStep COMPLETED: ${layer} - ${agent.name} (Step ${stepOrder})`);

    } catch (error) {
      console.error(`❌ Error in step execution ${executionId}:${stepOrder}:`, error);
      throw error;
    }
  }

  // Execute virtual step for layers without real agent records (Experience, Meta Brain)
  private async executeVirtualStep(executionId: string, stepOrder: number, layer: string, 
    virtualAgentName: string, action: string, inputData: any) {
    const startTime = new Date();

    try {
      // Create step record with virtual agent (no agentId - use null)
      const stepId = await db.insert(agentExecutionSteps).values({
        executionId,
        stepOrder,
        layer,
        agentId: null, // Virtual agents don't have database records
        agentName: virtualAgentName,
        agentType: 'Virtual Agent',
        action,
        status: 'running',
        startedAt: startTime,
        inputData
      }).returning({ id: agentExecutionSteps.id });

      // Emit step started for virtual agent
      this.emitExecutionUpdate(executionId, {
        type: 'step_started',
        executionId,
        stepId: stepId[0].id,
        stepOrder,
        layer,
        agentName: virtualAgentName,
        agentType: layer === 'Experience' ? 'Insurance Company' : layer === 'Meta Brain' ? 'Central Orchestrator' : 'Virtual Agent',
        specialization: layer === 'Experience' ? 'Company configuration and branding' : layer === 'Meta Brain' ? 'Workflow orchestration and routing' : 'System coordination',
        description: `Virtual ${layer} agent for orchestration`,
        action,
        status: 'running'
      });

      // Log step execution
      await db.insert(agentExecutionLogs).values({
        executionId,
        stepId: stepId[0].id,
        logLevel: 'info',
        source: 'orchestrator',
        message: `Starting ${layer} layer execution with virtual agent ${virtualAgentName}`,
        details: { stepOrder, action, agentType: 'Virtual Agent' }
      });

      // Simulate realistic processing time (shorter for virtual agents)
      const processingTime = 800 + Math.random() * 1200; // 800-2000ms
      await new Promise(resolve => setTimeout(resolve, processingTime));

      // Generate realistic output for virtual agents
      const outputData = this.generateVirtualStepOutput(layer, virtualAgentName, action, inputData);
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Update step to completed
      await db.update(agentExecutionSteps)
        .set({ 
          status: 'completed',
          completedAt: endTime,
          duration,
          outputData
        })
        .where(eq(agentExecutionSteps.id, stepId[0].id));

      // Emit step completed for virtual agent
      this.emitExecutionUpdate(executionId, {
        type: 'step_completed',
        executionId,
        stepId: stepId[0].id,
        stepOrder,
        layer,
        agentName: virtualAgentName,
        agentType: layer === 'Experience' ? 'Insurance Company' : layer === 'Meta Brain' ? 'Central Orchestrator' : 'Virtual Agent',
        specialization: layer === 'Experience' ? 'Company configuration and branding' : layer === 'Meta Brain' ? 'Workflow orchestration and routing' : 'System coordination',
        description: `Virtual ${layer} agent for orchestration`,
        action,
        status: 'completed',
        duration,
        outputData
      });

      // Log completion
      await db.insert(agentExecutionLogs).values({
        executionId,
        stepId: stepId[0].id,
        logLevel: 'info',
        source: 'orchestrator',
        message: `Completed ${layer} layer virtual execution in ${duration}ms`,
        details: { duration, outputSize: JSON.stringify(outputData).length }
      });

    } catch (error) {
      console.error(`Error in virtual step execution ${executionId}:${stepOrder}:`, error);
      // Update step to error
      await db.update(agentExecutionSteps)
        .set({ status: 'error', errorDetails: error instanceof Error ? error.message : String(error), completedAt: new Date() })
        .where(and(eq(agentExecutionSteps.executionId, executionId), eq(agentExecutionSteps.stepOrder, stepOrder)));
      throw error;
    }
  }

  // Generate output for virtual agents based on layer
  private generateVirtualStepOutput(layer: string, agentName: string, action: string, inputData: any): any {
    switch (layer) {
      case 'Experience':
        return {
          companyContext: 'ABC Insurance Ltd',
          personaConfiguration: inputData.persona,
          brandingInitialized: true,
          experienceLayerStatus: 'configured',
          companySettings: {
            size: 'mid_market',
            type: 'commercial_lines',
            specializations: ['property', 'casualty', 'commercial_auto']
          }
        };
      
      case 'Meta Brain':
        return {
          routingDecision: `${inputData.persona} workflow activated`,
          orchestrationPlan: {
            strategy: 'sequential',
            estimatedLayers: 6,
            expectedDuration: '5-8 seconds'
          },
          workflowCoordination: 'active',
          resourceAllocation: 'optimal'
        };
      
      default:
        return {
          virtualProcessing: true,
          layer: layer,
          agent: agentName,
          status: 'completed'
        };
    }
  }

  // Handle execution errors
  private async handleExecutionError(executionId: string, error: any) {
    await db.update(agentExecutions)
      .set({ 
        status: 'error', 
        errorDetails: { message: error.message, stack: error.stack },
        completedAt: new Date()
      })
      .where(eq(agentExecutions.executionId, executionId));

    this.emitExecutionUpdate(executionId, {
      type: 'execution_error',
      executionId,
      status: 'error',
      message: `Execution failed: ${error.message}`
    });

    // Log error
    await db.insert(agentExecutionLogs).values({
      executionId,
      logLevel: 'error',
      source: 'orchestrator',
      message: `Execution failed: ${error.message}`,
      details: { error: error.stack }
    });

    this.activeExecutions.delete(executionId);
  }

  // Helper methods
  private async selectBestAgent(agents: any[], persona: string, command: string, layer?: string): Promise<any> {
    // Use contextual agent selection with ConfigService
    const selectedAgents = await this.selectAgents({
      command,
      persona,
      layer
    }, agents);
    
    // Return the first selected agent or fallback to original logic
    return selectedAgents.length > 0 ? selectedAgents[0] : this.fallbackAgentSelection(agents, persona, command);
  }

  /**
   * Contextual agent selection using ConfigService hierarchy
   * Follows the established pattern: Workflow > Agent > Persona > Global
   */
  async selectAgents(context: AgentSelectionContext, availableAgents: any[] = []): Promise<any[]> {
    const { command, persona, workflowId, agentId, layer } = context;
    
    try {
      const scope = {
        persona,
        agentId,
        workflowId
      };

      // Try specific command rule first (e.g., "agent-invocation.process-acord")
      let rule = await ConfigService.getRule(`agent-invocation.${command.toLowerCase().replace(/\s+/g, '-')}`, scope);
      
      // Fallback to layer-level rules (e.g., "agent-invocation.layer.role")
      if (!rule && layer) {
        rule = await ConfigService.getRule(`agent-invocation.layer.${layer.toLowerCase()}`, scope);
      }
      
      // Fallback to workflow-level rules
      if (!rule && workflowId) {
        rule = await ConfigService.getRule('agent-invocation.workflow.default', scope);
      }
      
      // Fallback to persona-level rules (e.g., "agent-invocation.persona.rachel")
      if (!rule) {
        rule = await ConfigService.getRule(`agent-invocation.persona.${persona}`, {});
      }
      
      // Global fallback
      if (!rule) {
        rule = await ConfigService.getRule('agent-invocation.global.default', {});
      }

      if (rule) {
        return this.applySelectionRule(rule, context, availableAgents);
      }

      // No rules found, use fallback logic
      return [this.fallbackAgentSelection(availableAgents, persona, command)];

    } catch (error) {
      console.error('Error in contextual agent selection:', error);
      // Fallback to original logic on error
      return [this.fallbackAgentSelection(availableAgents, persona, command)];
    }
  }

  /**
   * Apply JSONLogic rule to filter and select agents
   */
  private applySelectionRule(rule: any, context: AgentSelectionContext, availableAgents: any[]): any[] {
    try {
      if (!rule.expression) {
        return [this.fallbackAgentSelection(availableAgents, context.persona, context.command)];
      }

      // Create evaluation context with available agent names and types for JSONLogic
      const evaluationContext = {
        ...context,
        availableAgents: availableAgents.map(agent => ({
          name: agent.name,
          type: agent.type,
          specialization: agent.specialization,
          layer: agent.layer,
          capabilities: agent.config?.capabilities || []
        }))
      };

      // Apply JSONLogic rule
      const result = jsonLogic.apply(rule.expression, evaluationContext);
      
      if (Array.isArray(result)) {
        // Result is array of agent names/identifiers
        return this.findAgentsByNames(result, availableAgents);
      } else if (typeof result === 'string') {
        // Result is single agent name
        return this.findAgentsByNames([result], availableAgents);
      } else if (typeof result === 'boolean' && result) {
        // Rule returned true, use all available agents
        return availableAgents;
      }

      // Rule didn't match, use fallback
      return [this.fallbackAgentSelection(availableAgents, context.persona, context.command)];

    } catch (error) {
      console.error('Error applying selection rule:', error);
      return [this.fallbackAgentSelection(availableAgents, context.persona, context.command)];
    }
  }

  /**
   * Find agents by their names from available agents
   */
  private findAgentsByNames(names: string[], availableAgents: any[]): any[] {
    const found = names.map(name => 
      availableAgents.find(agent => 
        agent.name.toLowerCase().includes(name.toLowerCase()) ||
        agent.specialization?.toLowerCase().includes(name.toLowerCase())
      )
    ).filter(Boolean);

    return found.length > 0 ? found : [this.fallbackAgentSelection(availableAgents, '', '')];
  }

  /**
   * Fallback agent selection logic (original logic)
   */
  private fallbackAgentSelection(agents: any[], persona: string, command: string): any {
    return agents.find(agent => 
      agent.config?.invokingPersonas?.includes(persona) ||
      agent.specialization?.toLowerCase().includes(command.toLowerCase().split(' ')[0])
    ) || agents[0];
  }

  private getRoleAgentAction(agent: any, persona: string, command: string): string {
    if (persona === 'rachel') return `Process ${command} as Assistant Underwriter`;
    if (persona === 'john') return `Handle ${command} as IT Support Analyst`;
    return `Execute ${command} with administrator privileges`;
  }

  private getProcessAgentAction(agent: any, command: string): string {
    if (agent.name.includes('Submission')) return 'Execute submission processing workflow';
    if (agent.name.includes('Claims')) return 'Execute claims processing workflow';
    if (agent.name.includes('Incident')) return 'Execute incident management workflow';
    return `Execute ${agent.name.toLowerCase()} workflow operations`;
  }

  private getSystemAgentAction(agent: any, command: string): string {
    if (agent.name.includes('Document')) return 'Process and analyze documents';
    if (agent.name.includes('Security')) return 'Perform security monitoring and analysis';
    if (agent.name.includes('Database')) return 'Execute database operations and queries';
    return `Execute ${agent.name.toLowerCase()} system operations`;
  }

  private calculateProcessingTime(layer: string, agentName: string): number {
    // Simulate realistic processing times based on layer complexity
    const baseTimes = {
      'Experience': 200,
      'Meta Brain': 300, 
      'Role': 500,
      'Process': 800,
      'System': 600,
      'Interface': 400
    };
    
    const baseTime = baseTimes[layer as keyof typeof baseTimes] || 400;
    return baseTime + Math.random() * 300; // Add some randomness
  }

  private generateStepOutput(layer: string, agent: any, action: string, inputData: any): any {
    return {
      layer,
      agentName: agent.name,
      action,
      timestamp: new Date().toISOString(),
      status: 'success',
      executionContext: inputData,
      results: `${layer} layer execution completed successfully`,
      metadata: {
        agentType: agent.type,
        processingTime: Date.now()
      }
    };
  }

  private getTotalAgentCount(agentsByLayer: AgentsByLayer): number {
    return agentsByLayer.experience.length + 
           agentsByLayer.metaBrain.length +
           agentsByLayer.role.length +
           agentsByLayer.process.length +
           agentsByLayer.system.length +
           agentsByLayer.interface.length;
  }

  // Get execution status for frontend
  async getExecutionStatus(executionId: string) {
    try {
      const execution = await db.select()
        .from(agentExecutions)
        .where(eq(agentExecutions.executionId, executionId))
        .limit(1);

      if (execution.length === 0) {
        return null;
      }

      const steps = await db.select()
        .from(agentExecutionSteps)
        .where(eq(agentExecutionSteps.executionId, executionId))
        .orderBy(agentExecutionSteps.stepOrder);

      return {
        execution: execution[0],
        steps: steps
      };
    } catch (error) {
      console.error('Error fetching execution status:', error);
      return null;
    }
  }
}

// Singleton instance
export const agentOrchestrationService = new AgentOrchestrationService();
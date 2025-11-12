import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Play, Pause, Square, Clock, Zap, BarChart3, Settings, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const STATUS_ICONS = {
  active: Play,
  paused: Pause,
  stopped: Square,
  completed: CheckCircle,
  failed: XCircle,
  pending: Clock
};

const STATUS_COLORS = {
  active: 'text-green-400 bg-green-500/20',
  paused: 'text-yellow-400 bg-yellow-500/20',
  stopped: 'text-red-400 bg-red-500/20',
  completed: 'text-green-400 bg-green-500/20',
  failed: 'text-red-400 bg-red-500/20',
  pending: 'text-blue-400 bg-blue-500/20'
};

const TRIGGER_TYPE_ICONS = {
  schedule: Clock,
  event: Zap,
  manual: Settings
};

interface WorkflowCardProps {
  workflow: any;
}

function WorkflowCard({ workflow }: WorkflowCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const StatusIcon = STATUS_ICONS[workflow.status as keyof typeof STATUS_ICONS] || AlertCircle;
  const TriggerIcon = TRIGGER_TYPE_ICONS[workflow.triggerType as keyof typeof TRIGGER_TYPE_ICONS] || Settings;
  const statusColor = STATUS_COLORS[workflow.status as keyof typeof STATUS_COLORS] || 'text-gray-400 bg-gray-500/20';

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getSuccessRateColor = (rate: string) => {
    const numRate = parseFloat(rate);
    if (numRate >= 95) return 'text-green-400';
    if (numRate >= 85) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="hexaware-glass rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="font-bold text-white text-lg">{workflow.workflowName}</h3>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              <StatusIcon className="w-3 h-3" />
              <span className="capitalize">{workflow.status}</span>
            </div>
          </div>
          <p className="text-sm text-[#9CA3AF] mb-3">{workflow.description}</p>
          
          <div className="flex items-center space-x-4 text-xs text-[#9CA3AF]">
            <div className="flex items-center space-x-1">
              <TriggerIcon className="w-3 h-3" />
              <span className="capitalize">{workflow.triggerType}</span>
            </div>
            <div className="flex items-center space-x-1">
              <BarChart3 className="w-3 h-3" />
              <span>{workflow.executionCount || 0} executions</span>
            </div>
            {workflow.lastExecuted && (
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Last: {new Date(workflow.lastExecuted).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[#60A5FA] hover:text-white hover:bg-[#3B82F6]/20"
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-black/20 rounded-lg p-3">
          <div className="text-xs text-[#9CA3AF] mb-1">Success Rate</div>
          <div className={`text-lg font-bold ${getSuccessRateColor(workflow.successRate || '0')}`}>
            {workflow.successRate || '0'}%
          </div>
        </div>
        
        <div className="bg-black/20 rounded-lg p-3">
          <div className="text-xs text-[#9CA3AF] mb-1">Avg Execution Time</div>
          <div className="text-lg font-bold text-white">
            {workflow.avgExecutionTime ? formatExecutionTime(workflow.avgExecutionTime) : 'N/A'}
          </div>
        </div>
        
        <div className="bg-black/20 rounded-lg p-3">
          <div className="text-xs text-[#9CA3AF] mb-1">Total Executions</div>
          <div className="text-lg font-bold text-[#60A5FA]">
            {workflow.executionCount || 0}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-[#3B82F6]/30 pt-4">
          <h4 className="font-bold text-white mb-3">Workflow Steps</h4>
          <div className="space-y-2">
            {workflow.steps && Array.isArray(workflow.steps) ? (
              workflow.steps.map((step: any, index: number) => (
                <div key={index} className="flex items-center space-x-3 bg-black/20 rounded-lg p-3">
                  <div className="w-6 h-6 bg-[#3B82F6] text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{step.name || `Step ${index + 1}`}</div>
                    <div className="text-xs text-[#9CA3AF]">{step.description || step.action || 'Processing step'}</div>
                  </div>
                  <div className="text-xs text-[#60A5FA]">
                    {step.duration ? formatExecutionTime(step.duration) : '~'}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-black/20 rounded-lg p-3 text-center text-[#9CA3AF]">
                No workflow steps configured
              </div>
            )}
          </div>

          {workflow.triggerConfig && (
            <div className="mt-4">
              <h4 className="font-bold text-white mb-2">Trigger Configuration</h4>
              <div className="bg-black/20 rounded-lg p-3">
                <pre className="text-xs text-[#9CA3AF] whitespace-pre-wrap font-mono">
                  {JSON.stringify(workflow.triggerConfig, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function OrchestrationWorkflows() {
  const { user } = useAuth();
  const { data: workflows, isLoading } = useQuery({
    queryKey: ['/api/orchestration/workflows'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getCurrentPersona = () => {
    return (user as any)?.activePersona || 'admin';
  };

  const filterWorkflowsForPersona = (workflows: any[] = []) => {
    const currentPersona = getCurrentPersona();
    if (currentPersona !== 'rachel') return workflows;
    
    // For Rachel, prioritize underwriting-related workflows
    return workflows.filter(workflow => {
      const workflowName = workflow.workflowName?.toLowerCase() || '';
      const description = workflow.description?.toLowerCase() || '';
      
      return workflowName.includes('underwriting') || 
             workflowName.includes('submission') ||
             workflowName.includes('risk') ||
             workflowName.includes('claims') ||
             workflowName.includes('policy') ||
             workflowName.includes('auw') ||
             description.includes('underwriting') ||
             description.includes('risk assessment') ||
             description.includes('claims');
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Orchestration Workflows</h2>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="hexaware-glass rounded-xl p-6 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-[#3B82F6]/20 rounded w-1/3"></div>
                  <div className="h-4 bg-[#3B82F6]/20 rounded w-2/3"></div>
                  <div className="h-3 bg-[#3B82F6]/20 rounded w-1/2"></div>
                </div>
                <div className="h-8 bg-[#3B82F6]/20 rounded w-24"></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="bg-black/20 rounded-lg p-3">
                    <div className="h-3 bg-[#3B82F6]/20 rounded mb-2"></div>
                    <div className="h-6 bg-[#3B82F6]/20 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filteredWorkflows = filterWorkflowsForPersona(workflows as any[]);
  const activeWorkflows = filteredWorkflows?.filter(w => w.status === 'active') || [];
  const totalExecutions = filteredWorkflows?.reduce((sum, w) => sum + (w.executionCount || 0), 0) || 0;
  const avgSuccessRate = filteredWorkflows?.length > 0 
    ? (filteredWorkflows.reduce((sum, w) => sum + parseFloat(w.successRate || '0'), 0) / filteredWorkflows.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-[#3B82F6]/20 rounded-lg">
            <Settings className="w-6 h-6 text-[#60A5FA]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Orchestration Workflows</h2>
            <p className="text-sm text-[#9CA3AF]">Automated workflow management and execution</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-[#60A5FA]">{activeWorkflows.length}</div>
            <div className="text-[#9CA3AF]">Active</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">{avgSuccessRate}%</div>
            <div className="text-[#9CA3AF]">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{totalExecutions}</div>
            <div className="text-[#9CA3AF]">Total Runs</div>
          </div>
        </div>
      </div>

      {!workflows || (workflows as any[]).length === 0 ? (
        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Workflows Available</h3>
          <p className="text-[#9CA3AF]">Orchestration workflows will appear here once configured</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(workflows as any[]).map((workflow) => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))}
        </div>
      )}
    </div>
  );
}
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Bot, Zap, Clock, TrendingUp, Play, Settings, Target, Brain, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COMMAND_TYPE_ICONS = {
  workflow: Settings,
  agent: Bot,
  system: Network,
  integration: Zap
};

const COMMAND_TYPE_COLORS = {
  workflow: 'text-blue-400 bg-blue-500/20',
  agent: 'text-green-400 bg-green-500/20',
  system: 'text-purple-400 bg-purple-500/20',
  integration: 'text-orange-400 bg-orange-500/20'
};

interface CommandCardProps {
  command: any;
  onExecute: (commandId: number) => void;
}

function CommandCard({ command, onExecute }: CommandCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const TypeIcon = COMMAND_TYPE_ICONS[command.commandType as keyof typeof COMMAND_TYPE_ICONS] || Bot;
  const typeColor = COMMAND_TYPE_COLORS[command.commandType as keyof typeof COMMAND_TYPE_COLORS] || 'text-gray-400 bg-gray-500/20';

  const formatResponseTime = (ms: number) => {
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
            <div className="p-2 bg-[#3B82F6]/20 rounded-lg">
              <TypeIcon className="w-5 h-5 text-[#60A5FA]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{command.commandName}</h3>
              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${typeColor} mt-1`}>
                <span className="capitalize">{command.commandType}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-[#9CA3AF] mb-3">{command.description}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            onClick={() => onExecute(command.id)}
            className="bg-[#3B82F6] hover:bg-[#1E40AF] text-white"
          >
            <Play className="w-4 h-4 mr-1" />
            Execute
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[#60A5FA] hover:text-white hover:bg-[#3B82F6]/20"
          >
            {isExpanded ? 'Hide' : 'Details'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-black/20 rounded-lg p-3">
          <div className="text-xs text-[#9CA3AF] mb-1">Executions</div>
          <div className="text-lg font-bold text-white">
            {command.executionCount || 0}
          </div>
        </div>
        
        <div className="bg-black/20 rounded-lg p-3">
          <div className="text-xs text-[#9CA3AF] mb-1">Success Rate</div>
          <div className={`text-lg font-bold ${getSuccessRateColor(command.successRate || '0')}`}>
            {command.successRate || '0'}%
          </div>
        </div>
        
        <div className="bg-black/20 rounded-lg p-3">
          <div className="text-xs text-[#9CA3AF] mb-1">Avg Response</div>
          <div className="text-lg font-bold text-[#60A5FA]">
            {command.avgResponseTime ? formatResponseTime(command.avgResponseTime) : 'N/A'}
          </div>
        </div>
        
        <div className="bg-black/20 rounded-lg p-3">
          <div className="text-xs text-[#9CA3AF] mb-1">Status</div>
          <div className={`text-lg font-bold ${command.isActive ? 'text-green-400' : 'text-red-400'}`}>
            {command.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-[#3B82F6]/30 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {command.targetAgents && (
              <div>
                <h4 className="font-bold text-white mb-2">Target Agents</h4>
                <div className="bg-black/20 rounded-lg p-3">
                  {Array.isArray(command.targetAgents) ? (
                    <div className="space-y-1">
                      {command.targetAgents.map((agent: string, index: number) => (
                        <div key={index} className="text-sm text-[#9CA3AF]">• {agent}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-[#9CA3AF]">
                      {JSON.stringify(command.targetAgents)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {command.parameters && (
              <div>
                <h4 className="font-bold text-white mb-2">Parameters</h4>
                <div className="bg-black/20 rounded-lg p-3">
                  <pre className="text-xs text-[#9CA3AF] whitespace-pre-wrap font-mono">
                    {JSON.stringify(command.parameters, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {command.lastExecuted && (
            <div className="mt-4">
              <div className="flex items-center space-x-2 text-xs text-[#9CA3AF]">
                <Clock className="w-3 h-3" />
                <span>Last executed: {new Date(command.lastExecuted).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AiCommandCenter() {
  const { data: commands, isLoading } = useQuery({
    queryKey: ['/api/ai-commands'],
    refetchInterval: 30000,
  });

  const handleExecuteCommand = (commandId: number) => {
    // This would trigger command execution
    console.log(`Executing command ${commandId}`);
    // In a real implementation, this would make an API call to execute the command
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">AI Command Center</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="hexaware-glass rounded-xl p-6 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-9 h-9 bg-[#3B82F6]/20 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-[#3B82F6]/20 rounded w-32"></div>
                    <div className="h-3 bg-[#3B82F6]/20 rounded w-20"></div>
                    <div className="h-4 bg-[#3B82F6]/20 rounded w-48"></div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 bg-[#3B82F6]/20 rounded w-20"></div>
                  <div className="h-8 bg-[#3B82F6]/20 rounded w-16"></div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => (
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

  const activeCommands = (commands as any[])?.filter(cmd => cmd.isActive) || [];
  const totalExecutions = (commands as any[])?.reduce((sum, cmd) => sum + (cmd.executionCount || 0), 0) || 0;
  const avgSuccessRate = (commands as any[])?.length > 0 
    ? ((commands as any[]).reduce((sum, cmd) => sum + parseFloat(cmd.successRate || '0'), 0) / (commands as any[]).length).toFixed(1)
    : '0';

  // Group commands by type
  const groupedCommands = (commands as any[])?.reduce((acc, cmd) => {
    if (!acc[cmd.commandType]) acc[cmd.commandType] = [];
    acc[cmd.commandType].push(cmd);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-[#3B82F6]/20 rounded-lg">
            <Brain className="w-6 h-6 text-[#60A5FA]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Command Center</h2>
            <p className="text-sm text-[#9CA3AF]">Execute and manage AI-powered commands and workflows</p>
          </div>
        </div>
        <div className="flex items-center space-x-6 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-[#60A5FA]">{activeCommands.length}</div>
            <div className="text-[#9CA3AF]">Active</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">{avgSuccessRate}%</div>
            <div className="text-[#9CA3AF]">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{totalExecutions}</div>
            <div className="text-[#9CA3AF]">Executions</div>
          </div>
        </div>
      </div>

      {!commands || (commands as any[]).length === 0 ? (
        <div className="text-center py-12">
          <Bot className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Commands Available</h3>
          <p className="text-[#9CA3AF]">AI commands will appear here once configured</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedCommands).map(([type, typeCommands]) => {
            const TypeIcon = COMMAND_TYPE_ICONS[type as keyof typeof COMMAND_TYPE_ICONS] || Bot;
            
            return (
              <div key={type}>
                <div className="flex items-center space-x-2 mb-4">
                  <TypeIcon className="w-5 h-5 text-[#60A5FA]" />
                  <h3 className="text-lg font-bold text-[#60A5FA] capitalize">{type} Commands</h3>
                  <div className="flex-1 h-px bg-[#3B82F6]/30"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {(typeCommands as any[]).map((command) => (
                    <CommandCard
                      key={command.id}
                      command={command}
                      onExecute={handleExecuteCommand}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Lightbulb, 
  Code, 
  CheckCircle2, 
  Rocket,
  Network,
  TrendingUp,
  Target,
  BarChart3,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMaturityLevelDefinitions, useAgentCategoryOptions } from '@/hooks/useAgentConfig';

/**
 * AgentLifecyclePanel - Universal component for agent lifecycle management
 * Follows replit.md standards:
 * - UNIVERSAL COMPONENTS: Reusable component with "Universal" prefix pattern  
 * - NO HARD-CODING: All lifecycle rules from ConfigService
 * - SCHEMA FIRST: Uses agents table maturity and lifecycle fields
 */

export interface AgentLifecyclePanelProps {
  agentId?: number; // For existing agents
  formData: {
    maturityStage: 'prototype' | 'development' | 'testing' | 'production';
    auditTrailEnabled: boolean;
    dependencies: string[];
    // Enterprise fields
    maturityLevel?: string;
    agentCategory?: string;
    complianceFrameworks?: string[];
    riskLevel?: string;
    governanceStatus?: 'compliant' | 'pending' | 'risk';
  };
  onFormDataChange: (updates: Partial<AgentLifecyclePanelProps['formData']>) => void;
  showcaseMode?: boolean;
  disabled?: boolean;
}

interface LifecycleStage {
  stage: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  requirements: Array<{
    name: string;
    status: 'completed' | 'in_progress' | 'pending';
  }>;
}

interface DependencyMapping {
  id: string;
  name: string;
  type: 'workflow' | 'data' | 'service' | 'config';
  strength: 'weak' | 'medium' | 'strong' | 'critical';
  description: string;
}

export function AgentLifecyclePanel({ 
  agentId, 
  formData, 
  onFormDataChange, 
  showcaseMode = false, 
  disabled = false 
}: AgentLifecyclePanelProps) {
  const { toast } = useToast();
  
  // Local state
  const [currentDependency, setCurrentDependency] = useState('');

  // Enterprise lifecycle hooks
  const { maturityLevels } = useMaturityLevelDefinitions();
  const { categories: agentCategories } = useAgentCategoryOptions();
  
  // Get current enterprise configuration
  const currentMaturityLevel = formData.maturityLevel || 'L0';
  const currentCategory = formData.agentCategory || 'Reactive';
  const complianceFrameworks = formData.complianceFrameworks || [];
  const currentRiskLevel = formData.riskLevel || 'low';
  const currentGovernanceStatus = formData.governanceStatus || 'pending';

  // Fetch lifecycle configuration from ConfigService
  const { data: lifecycleConfig } = useQuery({
    queryKey: ['/api/config/setting/agent.lifecycle.stages'],
    queryFn: () => fetch('/api/config/setting/agent.lifecycle.stages').then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Fetch dependency mappings from ConfigService
  const { data: dependencyConfigResponse } = useQuery({
    queryKey: ['/api/config/setting/agent.dependencies.mappings'],
    queryFn: () => fetch('/api/config/setting/agent.dependencies.mappings').then(res => res.json()),
    staleTime: 5 * 60 * 1000,
  });

  // Extract dependency mappings from ConfigService response
  const dependencyMappings: DependencyMapping[] = dependencyConfigResponse?.value || [];

  // Define lifecycle stages with fallback (ConfigService returns {key, value} structure)
  const lifecycleStages: LifecycleStage[] = lifecycleConfig?.value || [
    {
      stage: 'prototype',
      label: 'Prototype',
      icon: Lightbulb,
      color: 'text-yellow-400',
      requirements: [
        { name: 'Core Logic Implementation', status: 'completed' },
        { name: 'Basic Testing Setup', status: 'pending' }
      ]
    },
    {
      stage: 'development',
      label: 'Development',
      icon: Code,
      color: 'text-blue-400',
      requirements: [
        { name: 'Full Feature Implementation', status: 'completed' },
        { name: 'Code Review Process', status: 'completed' },
        { name: 'Documentation', status: 'pending' }
      ]
    },
    {
      stage: 'testing',
      label: 'Testing',
      icon: CheckCircle2,
      color: 'text-orange-400',
      requirements: [
        { name: 'Unit Test Coverage > 80%', status: 'completed' },
        { name: 'Integration Testing', status: 'in_progress' },
        { name: 'Performance Benchmarks', status: 'pending' }
      ]
    },
    {
      stage: 'production',
      label: 'Production',
      icon: Rocket,
      color: 'text-green-400',
      requirements: [
        { name: 'Security Audit', status: 'completed' },
        { name: 'Load Testing', status: 'completed' },
        { name: 'Monitoring Setup', status: 'completed' },
        { name: 'Deployment Pipeline', status: 'completed' }
      ]
    }
  ];

  // Helper functions
  const handleFormUpdate = (updates: Partial<AgentLifecyclePanelProps['formData']>) => {
    onFormDataChange(updates);
  };

  const addDependency = () => {
    if (currentDependency.trim() && !formData.dependencies.includes(currentDependency.trim())) {
      handleFormUpdate({
        dependencies: [...formData.dependencies, currentDependency.trim()]
      });
      setCurrentDependency('');
    }
  };

  const removeDependency = (dependency: string) => {
    handleFormUpdate({
      dependencies: formData.dependencies.filter(d => d !== dependency)
    });
  };

  // Calculate progress percentage
  const currentStageIndex = lifecycleStages.findIndex(stage => stage.stage === formData.maturityStage);
  const progressPercentage = ((currentStageIndex + 1) / lifecycleStages.length) * 100;

  return (
    <div className="space-y-6">
      {/* Maturity Progression Roadmap */}
      <Card className="bg-slate-800/50 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <ArrowRight className="w-5 h-5 text-blue-400" />
            <span>Maturity Progression Roadmap</span>
            {showcaseMode && (
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 text-xs" data-testid="badge-showcase-lifecycle">
                Enhanced Analytics
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Stage Selection */}
          <div className="space-y-2">
            <Label className="text-white font-medium">Current Maturity Stage</Label>
            <Select 
              value={formData.maturityStage} 
              onValueChange={(value) => handleFormUpdate({ maturityStage: value as any })}
              disabled={disabled}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-maturity-stage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {lifecycleStages.map(stage => (
                  <SelectItem key={stage.stage} value={stage.stage} className="text-white">
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visual Maturity Roadmap */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-medium">Progression Pipeline</h4>
              <div className="text-sm text-slate-400">
                Progress: {Math.round(progressPercentage)}%
              </div>
            </div>
            
            <div className="relative">
              <div className="flex items-center justify-between">
                {lifecycleStages.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = formData.maturityStage === item.stage;
                  const isCompleted = currentStageIndex > index;
                  
                  return (
                    <div key={item.stage} className="flex flex-col items-center space-y-2 relative z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isActive ? 'bg-blue-500/20 border-blue-400 scale-110' : 
                        isCompleted ? 'bg-green-500/20 border-green-400' : 'border-slate-600 bg-slate-800'
                      }`}>
                        <Icon className={`w-5 h-5 ${isActive || isCompleted ? item.color : 'text-slate-400'}`} />
                      </div>
                      <span className={`text-sm font-medium ${isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-slate-400'}`}>
                        {item.label}
                      </span>
                      {isActive && (
                        <div className="absolute -bottom-2 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Progress Line */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-600 -z-10">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 via-blue-400 to-green-400 transition-all duration-700"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Maturity Progress</span>
              <span className="text-blue-400">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Stage-specific Requirements */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
            <h5 className="text-white font-medium mb-3">Current Stage Requirements</h5>
            <div className="grid grid-cols-2 gap-4">
              {lifecycleStages
                .find(stage => stage.stage === formData.maturityStage)
                ?.requirements.map(req => (
                  <div key={req.name} className="flex items-center space-x-2">
                    {req.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : req.status === 'in_progress' ? (
                      <Clock className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-sm text-slate-300">{req.name}</span>
                  </div>
                )) || []}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dependency Mapping */}
      <Card className="bg-slate-800/50 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Network className="w-5 h-5 text-purple-400" />
            <span>Dependency Mapping</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Dependencies */}
          <div className="space-y-2">
            <Label className="text-white font-medium">Agent Dependencies</Label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentDependency}
                onChange={(e) => setCurrentDependency(e.target.value)}
                placeholder="Add dependency"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white placeholder-slate-400"
                onKeyDown={(e) => e.key === 'Enter' && addDependency()}
                disabled={disabled}
                data-testid="input-dependency"
              />
              <Button 
                onClick={addDependency} 
                size="sm" 
                className="bg-purple-600 hover:bg-purple-700"
                disabled={disabled}
                data-testid="button-add-dependency"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {formData.dependencies.map(dependency => (
                <Badge key={dependency} variant="secondary" className="bg-purple-500/20 text-purple-400">
                  {dependency}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0"
                    onClick={() => removeDependency(dependency)}
                    disabled={disabled}
                  >
                    ×
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Recommended Dependencies */}
          {dependencyMappings.length > 0 && (
            <div className="space-y-2">
              <Label className="text-white font-medium">Recommended Dependencies</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dependencyMappings.map((dep: DependencyMapping) => (
                  <div key={dep.id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-white text-sm font-medium">{dep.name}</h4>
                        <p className="text-xs text-slate-400">{dep.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">{dep.type}</Badge>
                          <Badge 
                            variant={dep.strength === 'critical' ? 'destructive' : 'secondary'} 
                            className="text-xs"
                          >
                            {dep.strength}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (!formData.dependencies.includes(dep.name)) {
                            handleFormUpdate({
                              dependencies: [...formData.dependencies, dep.name]
                            });
                          }
                        }}
                        disabled={disabled || formData.dependencies.includes(dep.name)}
                      >
                        {formData.dependencies.includes(dep.name) ? 'Added' : 'Add'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Trail Configuration */}
      <Card className="bg-slate-800/50 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-400" />
            <span>Audit & Compliance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Governance Status */}
          <div className="space-y-2">
            <Label className="text-white font-medium">Governance Status</Label>
            <Select 
              value={currentGovernanceStatus} 
              onValueChange={(value: 'compliant' | 'pending' | 'risk') => handleFormUpdate({ governanceStatus: value })}
              disabled={disabled}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-governance-status">
                <SelectValue placeholder="Select governance status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="compliant" className="text-white hover:bg-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Compliant
                  </div>
                </SelectItem>
                <SelectItem value="pending" className="text-white hover:bg-slate-700">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    Pending Review
                  </div>
                </SelectItem>
                <SelectItem value="risk" className="text-white hover:bg-slate-700">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    Risk
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-400">Current compliance and governance review status</p>
          </div>

          {/* Audit Trail */}
          <div className="flex items-center justify-between rounded-lg border border-slate-600 p-4">
            <div className="space-y-0.5">
              <Label className="text-white font-medium">Audit Trail</Label>
              <p className="text-sm text-slate-400">Enable comprehensive audit logging for lifecycle changes</p>
            </div>
            <Switch
              checked={formData.auditTrailEnabled}
              onCheckedChange={(checked) => handleFormUpdate({ auditTrailEnabled: checked })}
              disabled={disabled}
              data-testid="switch-audit-trail"
            />
          </div>

          {formData.auditTrailEnabled && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <h4 className="text-green-300 font-medium mb-2">Audit Trail Active</h4>
              <p className="text-sm text-green-200">
                All lifecycle changes, dependency modifications, and stage transitions will be logged with timestamps and user attribution.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enterprise Lifecycle Projections */}
      {showcaseMode && (
        <div className="space-y-6">
          {/* Main Enterprise Projections Card */}
          <Card className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-indigo-500/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <div className="p-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span>✨ Enterprise Lifecycle Projections</span>
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0" data-testid="badge-showcase-projections">
                  {currentMaturityLevel} {currentCategory} Analytics
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Maturity Progression Timeline - Dynamic Based on Current Level */}
              <div className="bg-gradient-to-r from-violet-900/30 to-indigo-900/30 border border-violet-500/30 rounded-lg p-4">
                <h4 className="text-violet-300 font-medium mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  {currentMaturityLevel} → L4 Progression Timeline
                </h4>
                
                {currentMaturityLevel === 'L0' && (
                  <div className="space-y-3">
                    <div className="text-sm text-violet-200 mb-3">Complete roadmap from Tool Caller to Autonomous System:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-violet-100">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                          <span><strong>L0 → L1:</strong> 3-4 weeks (ReAct Loop)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                          <span><strong>L1 → L2:</strong> 6-8 weeks (Planning)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                          <span><strong>L2 → L3:</strong> 10-12 weeks (Multi-Agent)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                          <span><strong>L3 → L4:</strong> 16-20 weeks (Autonomous)</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-center p-3 bg-violet-500/20 rounded-lg">
                          <div className="text-lg font-bold text-violet-300">35-44 weeks</div>
                          <div className="text-xs text-violet-200">Total estimated timeline</div>
                        </div>
                        <div className="text-center p-2 bg-violet-500/10 rounded">
                          <div className="text-sm font-medium text-violet-300">Cost: $180K-250K</div>
                          <div className="text-xs text-violet-200">Development investment</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentMaturityLevel === 'L1' && (
                  <div className="space-y-3">
                    <div className="text-sm text-violet-200 mb-3">Progression from ReAct Loop to Autonomous System:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-violet-100">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span><strong>L1:</strong> Current (Reasoning Loop)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                          <span><strong>L1 → L2:</strong> 5-7 weeks (Planning)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                          <span><strong>L2 → L3:</strong> 8-10 weeks (Multi-Agent)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                          <span><strong>L3 → L4:</strong> 12-16 weeks (Autonomous)</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-center p-3 bg-violet-500/20 rounded-lg">
                          <div className="text-lg font-bold text-violet-300">25-33 weeks</div>
                          <div className="text-xs text-violet-200">Remaining timeline</div>
                        </div>
                        <div className="text-center p-2 bg-violet-500/10 rounded">
                          <div className="text-sm font-medium text-violet-300">Cost: $120K-180K</div>
                          <div className="text-xs text-violet-200">Remaining investment</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {['L2', 'L3'].includes(currentMaturityLevel) && (
                  <div className="space-y-3">
                    <div className="text-sm text-violet-200 mb-3">Advanced maturity progression timeline:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-violet-100">
                      <div className="space-y-2">
                        {currentMaturityLevel === 'L2' ? (
                          <>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span><strong>L2:</strong> Current (Planner+Executor)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                              <span><strong>L2 → L3:</strong> 6-8 weeks (Multi-Agent)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                              <span><strong>L3 → L4:</strong> 10-14 weeks (Autonomous)</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span><strong>L3:</strong> Current (Multi-Agent Crew)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                              <span><strong>L3 → L4:</strong> 8-12 weeks (Autonomous)</span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="text-center p-3 bg-violet-500/20 rounded-lg">
                          <div className="text-lg font-bold text-violet-300">
                            {currentMaturityLevel === 'L2' ? '16-22' : '8-12'} weeks
                          </div>
                          <div className="text-xs text-violet-200">Remaining timeline</div>
                        </div>
                        <div className="text-center p-2 bg-violet-500/10 rounded">
                          <div className="text-sm font-medium text-violet-300">
                            Cost: ${currentMaturityLevel === 'L2' ? '80K-120K' : '40K-60K'}
                          </div>
                          <div className="text-xs text-violet-200">Remaining investment</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentMaturityLevel === 'L4' && (
                  <div className="text-center p-4 bg-green-500/20 rounded-lg">
                    <div className="text-lg font-bold text-green-300">🎉 Maximum Maturity Achieved</div>
                    <div className="text-sm text-green-200 mt-2">
                      Your autonomous system is operating at peak enterprise capability
                    </div>
                  </div>
                )}
              </div>

              {/* Category Optimization Potential */}
              <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 rounded-lg p-4">
                <h4 className="text-emerald-300 font-medium mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  {currentCategory} Agent Optimization Potential
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentCategory === 'Reactive' && (
                    <>
                      <div className="text-center p-3 bg-emerald-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-400">85%</div>
                        <div className="text-xs text-emerald-200">Response Time Improvement</div>
                        <div className="text-xs text-emerald-300 mt-1">Event processing optimization</div>
                      </div>
                      <div className="text-center p-3 bg-emerald-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-400">60%</div>
                        <div className="text-xs text-emerald-200">Throughput Increase</div>
                        <div className="text-xs text-emerald-300 mt-1">Concurrent handling boost</div>
                      </div>
                      <div className="text-center p-3 bg-emerald-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-400">40%</div>
                        <div className="text-xs text-emerald-200">Resource Efficiency</div>
                        <div className="text-xs text-emerald-300 mt-1">Memory and CPU optimization</div>
                      </div>
                    </>
                  )}
                  
                  {currentCategory === 'Deliberative' && (
                    <>
                      <div className="text-center p-3 bg-emerald-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-400">75%</div>
                        <div className="text-xs text-emerald-200">Planning Accuracy</div>
                        <div className="text-xs text-emerald-300 mt-1">Strategic decision quality</div>
                      </div>
                      <div className="text-center p-3 bg-emerald-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-400">50%</div>
                        <div className="text-xs text-emerald-200">Goal Achievement Rate</div>
                        <div className="text-xs text-emerald-300 mt-1">Success rate improvement</div>
                      </div>
                      <div className="text-center p-3 bg-emerald-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-400">65%</div>
                        <div className="text-xs text-emerald-200">Resource Allocation</div>
                        <div className="text-xs text-emerald-300 mt-1">Optimal resource usage</div>
                      </div>
                    </>
                  )}
                  
                  {currentCategory === 'Hybrid' && (
                    <>
                      <div className="text-center p-3 bg-emerald-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-400">70%</div>
                        <div className="text-xs text-emerald-200">Adaptability Index</div>
                        <div className="text-xs text-emerald-300 mt-1">Context switching efficiency</div>
                      </div>
                      <div className="text-center p-3 bg-emerald-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-400">55%</div>
                        <div className="text-xs text-emerald-200">Decision Quality</div>
                        <div className="text-xs text-emerald-300 mt-1">Balanced response optimization</div>
                      </div>
                      <div className="text-center p-3 bg-emerald-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-400">45%</div>
                        <div className="text-xs text-emerald-200">Learning Rate</div>
                        <div className="text-xs text-emerald-300 mt-1">Pattern recognition boost</div>
                      </div>
                    </>
                  )}
                  
                  {['Learning', 'Collaborative', 'Autonomous'].includes(currentCategory) && (
                    <>
                      <div className="text-center p-3 bg-emerald-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-400">90%</div>
                        <div className="text-xs text-emerald-200">Intelligence Growth</div>
                        <div className="text-xs text-emerald-300 mt-1">Continuous improvement</div>
                      </div>
                      <div className="text-center p-3 bg-emerald-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-400">80%</div>
                        <div className="text-xs text-emerald-200">Autonomy Level</div>
                        <div className="text-xs text-emerald-300 mt-1">Self-management capability</div>
                      </div>
                      <div className="text-center p-3 bg-emerald-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-400">95%</div>
                        <div className="text-xs text-emerald-200">Scalability Potential</div>
                        <div className="text-xs text-emerald-300 mt-1">Growth capacity</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance ROI & Business Impact */}
          <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <span>Compliance ROI & Business Impact</span>
                <Badge variant="outline" className="text-amber-300 border-amber-400">
                  Risk Level: {currentRiskLevel.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Compliance Framework Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-amber-300 font-medium">Compliance Benefits</h4>
                  {complianceFrameworks.length > 0 ? (
                    <div className="space-y-3">
                      {complianceFrameworks.includes('GDPR') && (
                        <div className="p-3 bg-amber-500/20 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-sm text-amber-200">GDPR Compliance</span>
                            <span className="text-sm font-bold text-amber-300">$2.4M</span>
                          </div>
                          <div className="text-xs text-amber-300 mt-1">Avoided fines & penalties</div>
                        </div>
                      )}
                      {complianceFrameworks.includes('HIPAA') && (
                        <div className="p-3 bg-amber-500/20 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-sm text-amber-200">HIPAA Compliance</span>
                            <span className="text-sm font-bold text-amber-300">$1.8M</span>
                          </div>
                          <div className="text-xs text-amber-300 mt-1">Healthcare data protection ROI</div>
                        </div>
                      )}
                      {complianceFrameworks.includes('SOX') && (
                        <div className="p-3 bg-amber-500/20 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-sm text-amber-200">SOX Compliance</span>
                            <span className="text-sm font-bold text-amber-300">$1.2M</span>
                          </div>
                          <div className="text-xs text-amber-300 mt-1">Financial reporting benefits</div>
                        </div>
                      )}
                      {complianceFrameworks.includes('PCI-DSS') && (
                        <div className="p-3 bg-amber-500/20 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-sm text-amber-200">PCI-DSS Compliance</span>
                            <span className="text-sm font-bold text-amber-300">$800K</span>
                          </div>
                          <div className="text-xs text-amber-300 mt-1">Payment security ROI</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-500/10 rounded-lg text-amber-200 text-sm">
                      No compliance frameworks selected. Add frameworks to see ROI projections.
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-amber-300 font-medium">Business Impact Metrics</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-500/20 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-sm text-amber-200">Operational Efficiency</span>
                        <span className="text-sm font-bold text-amber-300">+65%</span>
                      </div>
                      <div className="text-xs text-amber-300 mt-1">Process automation gains</div>
                    </div>
                    <div className="p-3 bg-amber-500/20 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-sm text-amber-200">Cost Reduction</span>
                        <span className="text-sm font-bold text-amber-300">35%</span>
                      </div>
                      <div className="text-xs text-amber-300 mt-1">Operational cost savings</div>
                    </div>
                    <div className="p-3 bg-amber-500/20 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-sm text-amber-200">Revenue Impact</span>
                        <span className="text-sm font-bold text-amber-300">+$4.2M</span>
                      </div>
                      <div className="text-xs text-amber-300 mt-1">Annual revenue increase</div>
                    </div>
                    <div className="p-3 bg-amber-500/20 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-sm text-amber-200">ROI Timeline</span>
                        <span className="text-sm font-bold text-amber-300">8 months</span>
                      </div>
                      <div className="text-xs text-amber-300 mt-1">Break-even projection</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk-Based Projections */}
              <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-orange-500/30 rounded-lg p-4">
                <h4 className="text-orange-300 font-medium mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Risk-Adjusted Enterprise Value
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <div className="text-lg font-bold text-orange-300">
                      {currentRiskLevel === 'low' ? '$8.2M' : 
                       currentRiskLevel === 'medium' ? '$6.8M' : 
                       currentRiskLevel === 'high' ? '$4.5M' : '$3.2M'}
                    </div>
                    <div className="text-xs text-orange-200">3-Year NPV</div>
                  </div>
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <div className="text-lg font-bold text-orange-300">
                      {currentRiskLevel === 'low' ? '320%' : 
                       currentRiskLevel === 'medium' ? '250%' : 
                       currentRiskLevel === 'high' ? '180%' : '120%'}
                    </div>
                    <div className="text-xs text-orange-200">ROI</div>
                  </div>
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <div className="text-lg font-bold text-orange-300">
                      {currentRiskLevel === 'low' ? '95%' : 
                       currentRiskLevel === 'medium' ? '85%' : 
                       currentRiskLevel === 'high' ? '70%' : '60%'}
                    </div>
                    <div className="text-xs text-orange-200">Success Probability</div>
                  </div>
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <div className="text-lg font-bold text-orange-300">
                      {currentRiskLevel === 'low' ? '6' : 
                       currentRiskLevel === 'medium' ? '9' : 
                       currentRiskLevel === 'high' ? '14' : '18'} months
                    </div>
                    <div className="text-xs text-orange-200">Payback Period</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
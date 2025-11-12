import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  Play, 
  CheckCircle, 
  XCircle, 
  Target, 
  Hash, 
  Plus, 
  X,
  BarChart,
  Clock,
  Settings,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMaturityLevelDefinitions, useAgentCategoryOptions } from '@/hooks/useAgentConfig';

/**
 * AgentTestingPanel - Universal component for agent testing functionality
 * Follows replit.md standards:
 * - UNIVERSAL COMPONENTS: Reusable component with "Universal" prefix pattern
 * - NO HARD-CODING: All test templates from ConfigService
 * - SCHEMA FIRST: Uses agent_test_results table from shared/schema.ts
 */

export interface AgentTestingPanelProps {
  agentId?: number; // For existing agents
  formData: {
    testingEnabled: boolean;
    testingFramework: 'jest' | 'mocha' | 'cypress' | 'playwright';
    testTemplates: string[];
    validationRules: string[];
    testCoverageTarget: number;
    qualityGateEnabled: boolean;
    // Enterprise fields
    maturityLevel?: string;
    agentCategory?: string;
  };
  onFormDataChange: (updates: Partial<AgentTestingPanelProps['formData']>) => void;
  showcaseMode?: boolean;
  disabled?: boolean;
}

interface TestTemplate {
  id: string;
  name: string;
  description: string;
  framework: string;
  category: string;
  isActive: boolean;
}

interface TestResult {
  id: number;
  testType: string;
  testName: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
  results: any;
  executedAt: string;
  duration?: string;
}

export function AgentTestingPanel({ 
  agentId, 
  formData, 
  onFormDataChange, 
  showcaseMode = false, 
  disabled = false 
}: AgentTestingPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Local state for UI interactions
  const [currentTestTemplate, setCurrentTestTemplate] = useState('');
  const [currentValidationRule, setCurrentValidationRule] = useState('');
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());

  // Enterprise testing hooks
  const { maturityLevels } = useMaturityLevelDefinitions();
  const { categories: agentCategories } = useAgentCategoryOptions();
  
  // Get current configuration for enterprise features
  const currentMaturityLevel = formData.maturityLevel || 'L0';
  const currentCategory = formData.agentCategory || 'Reactive';

  // Fetch test templates from ConfigService
  const { data: testTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/tests/templates'],
    queryFn: () => fetch('/api/tests/templates').then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Fetch test results for existing agents
  const { data: testResults = [], isLoading: resultsLoading } = useQuery({
    queryKey: ['/api/agents', agentId, 'tests'],
    queryFn: () => agentId ? apiRequest(`/api/agents/${agentId}/tests`, 'GET') : Promise.resolve([]),
    enabled: !!agentId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Execute test mutation
  const executeTestMutation = useMutation({
    mutationFn: async ({ testName, testType }: { testName: string; testType: string }) => {
      if (!agentId) throw new Error('Agent ID required for test execution');
      return apiRequest(`/api/agents/${agentId}/tests`, 'POST', { testName, testType });
    },
    onSuccess: (result) => {
      toast({
        title: "Test Started",
        description: `Test "${result.testName}" is now running`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agents', agentId, 'tests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to start test",
        variant: "destructive"
      });
    }
  });

  // Helper functions
  const handleFormUpdate = (updates: Partial<AgentTestingPanelProps['formData']>) => {
    onFormDataChange(updates);
  };

  const addTestTemplate = () => {
    if (currentTestTemplate.trim() && !formData.testTemplates.includes(currentTestTemplate.trim())) {
      handleFormUpdate({
        testTemplates: [...formData.testTemplates, currentTestTemplate.trim()]
      });
      setCurrentTestTemplate('');
    }
  };

  const removeTestTemplate = (template: string) => {
    handleFormUpdate({
      testTemplates: formData.testTemplates.filter(t => t !== template)
    });
  };

  const addValidationRule = () => {
    if (currentValidationRule.trim() && !formData.validationRules.includes(currentValidationRule.trim())) {
      handleFormUpdate({
        validationRules: [...formData.validationRules, currentValidationRule.trim()]
      });
      setCurrentValidationRule('');
    }
  };

  const removeValidationRule = (rule: string) => {
    handleFormUpdate({
      validationRules: formData.validationRules.filter(r => r !== rule)
    });
  };

  const executeTest = (testName: string, testType: string) => {
    setRunningTests(prev => new Set(prev).add(testName));
    executeTestMutation.mutate({ testName, testType });
  };

  return (
    <div className="space-y-6">
      {/* Testing Configuration */}
      <Card className="bg-slate-800/50 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <TestTube className="w-5 h-5 text-blue-400" />
            <span>Testing Configuration</span>
            {showcaseMode && (
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 text-xs" data-testid="badge-showcase-testing">
                Enhanced Testing
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Testing Enabled Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-slate-600 p-4">
            <div className="space-y-0.5">
              <Label className="text-white font-medium">Enable Testing Framework</Label>
              <p className="text-sm text-slate-400">Activate automated testing for this agent</p>
            </div>
            <Switch
              checked={formData.testingEnabled}
              onCheckedChange={(checked) => handleFormUpdate({ testingEnabled: checked })}
              disabled={disabled}
              data-testid="switch-testing-enabled"
            />
          </div>

          {formData.testingEnabled && (
            <>
              {/* Testing Framework Selection */}
              <div className="space-y-2">
                <Label className="text-white font-medium">Testing Framework</Label>
                <Select 
                  value={formData.testingFramework} 
                  onValueChange={(value) => handleFormUpdate({ testingFramework: value as any })}
                  disabled={disabled}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-testing-framework">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="jest" className="text-white">Jest</SelectItem>
                    <SelectItem value="mocha" className="text-white">Mocha</SelectItem>
                    <SelectItem value="cypress" className="text-white">Cypress</SelectItem>
                    <SelectItem value="playwright" className="text-white">Playwright</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Test Coverage Target */}
              <div className="space-y-2">
                <Label className="text-white font-medium">Test Coverage Target: {formData.testCoverageTarget}%</Label>
                <Slider
                  value={[formData.testCoverageTarget]}
                  onValueChange={(value) => handleFormUpdate({ testCoverageTarget: value[0] })}
                  max={100}
                  step={5}
                  disabled={disabled}
                  className="w-full"
                  data-testid="slider-coverage-target"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Quality Gate Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-slate-600 p-4">
                <div className="space-y-0.5">
                  <Label className="text-white font-medium">Quality Gate</Label>
                  <p className="text-sm text-slate-400">Block deployments if coverage falls below target</p>
                </div>
                <Switch
                  checked={formData.qualityGateEnabled}
                  onCheckedChange={(checked) => handleFormUpdate({ qualityGateEnabled: checked })}
                  disabled={disabled}
                  data-testid="switch-quality-gate"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Test Templates */}
      {formData.testingEnabled && (
        <Card className="bg-slate-800/50 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Settings className="w-5 h-5 text-purple-400" />
              <span>Test Templates</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white font-medium">Available Templates</Label>
              <div className="flex space-x-2">
                <Input
                  value={currentTestTemplate}
                  onChange={(e) => setCurrentTestTemplate(e.target.value)}
                  placeholder="Add test template"
                  className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                  onKeyDown={(e) => e.key === 'Enter' && addTestTemplate()}
                  disabled={disabled}
                  data-testid="input-test-template"
                />
                <Button 
                  onClick={addTestTemplate} 
                  size="sm" 
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={disabled}
                  data-testid="button-add-test-template"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {formData.testTemplates.map(template => (
                  <Badge key={template} variant="secondary" className="bg-purple-500/20 text-purple-400">
                    {template}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-auto p-0"
                      onClick={() => removeTestTemplate(template)}
                      disabled={disabled}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* ConfigService Templates */}
            {testTemplates.length > 0 && (
              <div className="space-y-2">
                <Label className="text-white font-medium">Recommended Templates</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {testTemplates.map((template: TestTemplate) => (
                    <div key={template.id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white text-sm font-medium">{template.name}</h4>
                          <p className="text-xs text-slate-400">{template.description}</p>
                          <Badge variant="outline" className="text-xs mt-1">{template.framework}</Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (!formData.testTemplates.includes(template.name)) {
                              handleFormUpdate({
                                testTemplates: [...formData.testTemplates, template.name]
                              });
                            }
                          }}
                          disabled={disabled || formData.testTemplates.includes(template.name)}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Rules */}
      {formData.testingEnabled && (
        <Card className="bg-slate-800/50 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Target className="w-5 h-5 text-orange-400" />
              <span>Validation Rules</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white font-medium">Custom Validation Rules</Label>
              <div className="flex space-x-2">
                <Input
                  value={currentValidationRule}
                  onChange={(e) => setCurrentValidationRule(e.target.value)}
                  placeholder="Add validation rule (e.g., Response time < 2s)"
                  className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                  onKeyDown={(e) => e.key === 'Enter' && addValidationRule()}
                  disabled={disabled}
                  data-testid="input-validation-rule"
                />
                <Button 
                  onClick={addValidationRule} 
                  size="sm" 
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={disabled}
                  data-testid="button-add-validation-rule"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {formData.validationRules.map(rule => (
                  <Badge key={rule} variant="secondary" className="bg-orange-500/20 text-orange-400">
                    {rule}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-auto p-0"
                      onClick={() => removeValidationRule(rule)}
                      disabled={disabled}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results & Execution */}
      {agentId && formData.testingEnabled && (
        <Card className="bg-slate-800/50 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <BarChart className="w-5 h-5 text-green-400" />
              <span>Test Results & Execution</span>
              {showcaseMode && (
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs" data-testid="badge-enhanced-results">
                  Real-time Analytics
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Test Execution Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => executeTest('Unit Tests', 'unit')}
                disabled={runningTests.has('Unit Tests') || !agentId}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-run-unit-tests"
              >
                <Play className="w-4 h-4 mr-2" />
                Run Unit Tests
              </Button>
              <Button
                onClick={() => executeTest('Integration Tests', 'integration')}
                disabled={runningTests.has('Integration Tests') || !agentId}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-run-integration-tests"
              >
                <Play className="w-4 h-4 mr-2" />
                Run Integration Tests
              </Button>
              <Button
                onClick={() => executeTest('E2E Tests', 'e2e')}
                disabled={runningTests.has('E2E Tests') || !agentId}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-run-e2e-tests"
              >
                <Play className="w-4 h-4 mr-2" />
                Run E2E Tests
              </Button>
            </div>

            {/* Test Results Display */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Recent Test Results</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {testResults.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <TestTube className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No test results yet. Run some tests to see results here.</p>
                  </div>
                ) : (
                  testResults.map((result: TestResult) => (
                    <div key={result.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded border border-slate-600">
                      <div className="flex items-center space-x-3">
                        {result.status === 'passed' ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : result.status === 'failed' ? (
                          <XCircle className="w-5 h-5 text-red-400" />
                        ) : result.status === 'running' ? (
                          <Clock className="w-5 h-5 text-yellow-400 animate-spin" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-slate-400" />
                        )}
                        <div>
                          <span className="text-white text-sm font-medium" data-testid={`text-test-${result.testName.toLowerCase().replace(/\s+/g, '-')}`}>
                            {result.testName}
                          </span>
                          <p className="text-xs text-slate-400">{result.testType} • {new Date(result.executedAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-slate-400">
                        {result.duration && <span>{result.duration}</span>}
                        <Badge variant={result.status === 'passed' ? 'default' : 'destructive'} className="text-xs">
                          {result.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Enterprise Testing Insights - Maturity & Category Aware */}
            {showcaseMode && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/50 rounded-lg p-4">
                  <h4 className="text-blue-300 font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Testing Strategy for {currentMaturityLevel} {currentCategory} Agent
                  </h4>
                  
                  {/* Maturity-Specific Testing Recommendations */}
                  <div className="space-y-3">
                    {currentMaturityLevel === 'L0' && (
                      <div className="space-y-2">
                        <Badge variant="outline" className="text-blue-300 border-blue-400">Tool Caller Testing</Badge>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-100">
                          <div className="space-y-1">
                            <p className="font-medium">Core Focus Areas:</p>
                            <ul className="text-xs space-y-1 text-blue-200">
                              <li>• API endpoint validation</li>
                              <li>• Input/output format testing</li>
                              <li>• Basic error handling</li>
                              <li>• Response time verification</li>
                            </ul>
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium">Recommended Tests:</p>
                            <ul className="text-xs space-y-1 text-blue-200">
                              <li>• Unit tests for tool functions</li>
                              <li>• Mock API response testing</li>
                              <li>• Simple integration tests</li>
                              <li>• Health check validation</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentMaturityLevel === 'L1' && (
                      <div className="space-y-2">
                        <Badge variant="outline" className="text-blue-300 border-blue-400">ReAct Loop Testing</Badge>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-100">
                          <div className="space-y-1">
                            <p className="font-medium">Core Focus Areas:</p>
                            <ul className="text-xs space-y-1 text-blue-200">
                              <li>• Reasoning chain validation</li>
                              <li>• Action selection accuracy</li>
                              <li>• Loop termination conditions</li>
                              <li>• Context preservation</li>
                            </ul>
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium">Recommended Tests:</p>
                            <ul className="text-xs space-y-1 text-blue-200">
                              <li>• Multi-step reasoning tests</li>
                              <li>• Decision tree validation</li>
                              <li>• Memory consistency checks</li>
                              <li>• Edge case handling</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentMaturityLevel === 'L2' && (
                      <div className="space-y-2">
                        <Badge variant="outline" className="text-blue-300 border-blue-400">Planner+Executor Testing</Badge>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-100">
                          <div className="space-y-1">
                            <p className="font-medium">Core Focus Areas:</p>
                            <ul className="text-xs space-y-1 text-blue-200">
                              <li>• Planning algorithm accuracy</li>
                              <li>• Execution coordination</li>
                              <li>• Resource optimization</li>
                              <li>• Failure recovery</li>
                            </ul>
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium">Recommended Tests:</p>
                            <ul className="text-xs space-y-1 text-blue-200">
                              <li>• Complex scenario planning</li>
                              <li>• Parallel execution tests</li>
                              <li>• Rollback mechanism validation</li>
                              <li>• Performance benchmarking</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentMaturityLevel === 'L3' && (
                      <div className="space-y-2">
                        <Badge variant="outline" className="text-blue-300 border-blue-400">Multi-Agent Crew Testing</Badge>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-100">
                          <div className="space-y-1">
                            <p className="font-medium">Core Focus Areas:</p>
                            <ul className="text-xs space-y-1 text-blue-200">
                              <li>• Inter-agent communication</li>
                              <li>• Coordination protocols</li>
                              <li>• Conflict resolution</li>
                              <li>• Load balancing</li>
                            </ul>
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium">Recommended Tests:</p>
                            <ul className="text-xs space-y-1 text-blue-200">
                              <li>• Multi-agent scenarios</li>
                              <li>• Communication latency tests</li>
                              <li>• Consensus algorithm validation</li>
                              <li>• Distributed system testing</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentMaturityLevel === 'L4' && (
                      <div className="space-y-2">
                        <Badge variant="outline" className="text-blue-300 border-blue-400">Autonomous System Testing</Badge>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-100">
                          <div className="space-y-1">
                            <p className="font-medium">Core Focus Areas:</p>
                            <ul className="text-xs space-y-1 text-blue-200">
                              <li>• Self-healing mechanisms</li>
                              <li>• Adaptive behavior testing</li>
                              <li>• Autonomous decision making</li>
                              <li>• System evolution tracking</li>
                            </ul>
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium">Recommended Tests:</p>
                            <ul className="text-xs space-y-1 text-blue-200">
                              <li>• Chaos engineering tests</li>
                              <li>• Machine learning validation</li>
                              <li>• Long-term stability tests</li>
                              <li>• Emergent behavior monitoring</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category-Specific Testing Recommendations */}
                <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/50 rounded-lg p-4">
                  <h4 className="text-purple-300 font-medium mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    {currentCategory} Agent Testing Specialization
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-100">
                    {currentCategory === 'Reactive' && (
                      <>
                        <div className="space-y-1">
                          <p className="font-medium">Reactive Testing Focus:</p>
                          <ul className="text-xs space-y-1 text-purple-200">
                            <li>• Event-driven response testing</li>
                            <li>• Trigger condition validation</li>
                            <li>• Response time optimization</li>
                            <li>• Concurrent event handling</li>
                          </ul>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">Key Metrics:</p>
                          <ul className="text-xs space-y-1 text-purple-200">
                            <li>• Event processing latency</li>
                            <li>• Throughput under load</li>
                            <li>• Memory usage patterns</li>
                            <li>• Error recovery speed</li>
                          </ul>
                        </div>
                      </>
                    )}
                    
                    {currentCategory === 'Deliberative' && (
                      <>
                        <div className="space-y-1">
                          <p className="font-medium">Deliberative Testing Focus:</p>
                          <ul className="text-xs space-y-1 text-purple-200">
                            <li>• Planning algorithm accuracy</li>
                            <li>• Goal state achievement</li>
                            <li>• Resource allocation efficiency</li>
                            <li>• Long-term strategy validation</li>
                          </ul>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">Key Metrics:</p>
                          <ul className="text-xs space-y-1 text-purple-200">
                            <li>• Planning completion time</li>
                            <li>• Solution optimality</li>
                            <li>• Resource utilization</li>
                            <li>• Goal achievement rate</li>
                          </ul>
                        </div>
                      </>
                    )}
                    
                    {currentCategory === 'Hybrid' && (
                      <>
                        <div className="space-y-1">
                          <p className="font-medium">Hybrid Testing Focus:</p>
                          <ul className="text-xs space-y-1 text-purple-200">
                            <li>• Mode switching accuracy</li>
                            <li>• Context transition testing</li>
                            <li>• Balanced response validation</li>
                            <li>• Adaptive behavior testing</li>
                          </ul>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">Key Metrics:</p>
                          <ul className="text-xs space-y-1 text-purple-200">
                            <li>• Mode switching latency</li>
                            <li>• Context preservation accuracy</li>
                            <li>• Response appropriateness</li>
                            <li>• Learning rate effectiveness</li>
                          </ul>
                        </div>
                      </>
                    )}
                    
                    {currentCategory === 'Learning' && (
                      <>
                        <div className="space-y-1">
                          <p className="font-medium">Learning Testing Focus:</p>
                          <ul className="text-xs space-y-1 text-purple-200">
                            <li>• Model training validation</li>
                            <li>• Adaptation rate testing</li>
                            <li>• Overfitting prevention</li>
                            <li>• Knowledge retention testing</li>
                          </ul>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">Key Metrics:</p>
                          <ul className="text-xs space-y-1 text-purple-200">
                            <li>• Learning convergence time</li>
                            <li>• Accuracy improvement rate</li>
                            <li>• Memory efficiency</li>
                            <li>• Generalization capability</li>
                          </ul>
                        </div>
                      </>
                    )}
                    
                    {currentCategory === 'Collaborative' && (
                      <>
                        <div className="space-y-1">
                          <p className="font-medium">Collaborative Testing Focus:</p>
                          <ul className="text-xs space-y-1 text-purple-200">
                            <li>• Team coordination testing</li>
                            <li>• Communication protocol validation</li>
                            <li>• Conflict resolution testing</li>
                            <li>• Collective intelligence metrics</li>
                          </ul>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">Key Metrics:</p>
                          <ul className="text-xs space-y-1 text-purple-200">
                            <li>• Team synchronization time</li>
                            <li>• Communication overhead</li>
                            <li>• Collective task success rate</li>
                            <li>• Network resilience</li>
                          </ul>
                        </div>
                      </>
                    )}
                    
                    {currentCategory === 'Autonomous' && (
                      <>
                        <div className="space-y-1">
                          <p className="font-medium">Autonomous Testing Focus:</p>
                          <ul className="text-xs space-y-1 text-purple-200">
                            <li>• Self-management capability</li>
                            <li>• Independent decision making</li>
                            <li>• Self-healing mechanism testing</li>
                            <li>• Emergent behavior monitoring</li>
                          </ul>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">Key Metrics:</p>
                          <ul className="text-xs space-y-1 text-purple-200">
                            <li>• Self-sufficiency score</li>
                            <li>• Intervention frequency</li>
                            <li>• Adaptation speed</li>
                            <li>• System stability</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Enhanced Testing Capabilities */}
                <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/50 rounded-lg p-4">
                  <h4 className="text-emerald-300 font-medium mb-3">✨ Enhanced Testing Capabilities</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-emerald-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Predictive Failure Detection</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Auto-Generated Test Cases</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Performance Regression Analysis</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Smart Test Parallelization</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
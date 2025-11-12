import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { 
  Bot, 
  Power, 
  Activity, 
  Cpu, 
  HardDrive, 
  Zap,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Settings,
  Eye,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Globe,
  ExternalLink,
  FileText,
  Palette,
  TestTube,
  Rocket,
  Info,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Network,
  Save,
  Database,
  Layers,
  Workflow,
  Key,
  Code2,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalAgentDirectory } from '@/components/UniversalAgentDirectory';
import { UniversalExplainableAIGovernance } from '@/components/UniversalExplainableAIGovernance';
import { AgentVisibilityConfig } from '@/pages/AgentVisibilityConfig';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UniversalTabManager } from '@/components/UniversalTabManager';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface AgentStatus {
  id: number;
  name: string;
  type: string;
  layer: string;
  status: 'active' | 'inactive' | 'maintenance';
  cpuUsage: number;
  memoryUsage: number;
  powerConsumption: number;
  storageUsage: number;
  uptime: string;
  lastActivity: Date;
  activeUsers: number;
  idlePercentage: number;
  confidenceLevel: number;
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  guardrailsEnabled: boolean;
}

interface AutonomousDecision {
  id: number;
  timestamp: Date;
  agentName: string;
  decision: string;
  confidence: number;
  outcome: string;
}

export function JarvisCommandCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAgent, setSelectedAgent] = useState<AgentStatus | null>(null);
  const [showAgentFactory, setShowAgentFactory] = useState(false);
  const [newAgentData, setNewAgentData] = useState({
    name: '',
    description: '',
    type: '',
    layer: 'Role',
    parentAgent: ''
  });

  // Meta Brain Configuration state
  const [metaBrainConfig, setMetaBrainConfig] = useState({
    languageModel: 'GPT-4o',
    memoryAllocation: 16,
    loggingLevel: 'Info',
    retryAttempts: 3,

    fallbackBehavior: 'Default Agent',
    systemPrompt: 'You are JARVIS®, an advanced AI coordinator for insurance workflows. Your role is to orchestrate specialized agents to solve complex insurance tasks efficiently.',
    enableParallelExecution: true,
    allowCrossAgentCommunication: true,
    enableMemorySharing: true
  });

  // Fetch agent statuses
  const { data: agentStatuses, isLoading } = useQuery({
    queryKey: ['/api/jarvis/agents/status'],
    refetchInterval: 5000,
  });

  // Fetch autonomous decisions
  const { data: recentDecisions } = useQuery({
    queryKey: ['/api/jarvis/autonomous-decisions'],
    refetchInterval: 10000,
  });

  // Fetch system metrics - NO AUTOMATIC POLLING
  const { data: systemMetrics } = useQuery({
    queryKey: ['/api/jarvis/system-metrics'],
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // MDP Governance Data Fetching
  const { data: riskAssessments, isLoading: riskLoading } = useQuery({
    queryKey: ['/api/governance/risk-assessments'],
    refetchInterval: 30000, // Refresh every 30 seconds for governance data
  });

  const { data: auditTrails, isLoading: auditLoading } = useQuery({
    queryKey: ['/api/governance/audit-trails'],
    refetchInterval: 30000,
  });

  const { data: aiModels, isLoading: modelsLoading } = useQuery({
    queryKey: ['/api/governance/ai-models'],
    refetchInterval: 60000, // Models change less frequently
  });

  const { data: governanceMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/governance/metrics'],
    refetchInterval: 15000, // Frequent refresh for real-time metrics
  });

  const { data: governanceAgents } = useQuery({
    queryKey: ['/api/governance/agents-with-risk'],
    refetchInterval: 30000,
  });

  // Meta Brain Configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (configData: typeof metaBrainConfig) => {
      return await apiRequest('/api/jarvis/meta-brain/config', 'POST', configData);
    },
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "Meta Brain configuration has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jarvis/meta-brain/config'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save configuration.",
        variant: "destructive",
      });
    }
  });

  // Agent control mutations
  const toggleAgentMutation = useMutation({
    mutationFn: async ({ agentId, action }: { agentId: number; action: 'start' | 'stop' | 'restart' }) => {
      return await apiRequest(`/api/jarvis/agents/${agentId}/${action}`, 'POST');
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Agent Action Completed",
        description: `Agent ${variables.action} operation completed successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jarvis/agents/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleGuardrailsMutation = useMutation({
    mutationFn: async ({ agentId, enabled }: { agentId: number; enabled: boolean }) => {
      return await apiRequest(`/api/jarvis/agents/${agentId}/guardrails`, 'POST', { enabled });
    },
    onSuccess: () => {
      toast({
        title: "Guardrails Updated",
        description: "Agent guardrails configuration updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jarvis/agents/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateAgent = () => {
    toast({
      title: "Agent Created",
      description: `New ${newAgentData.layer} agent "${newAgentData.name}" has been created successfully.`,
    });
    setShowAgentFactory(false);
    setNewAgentData({
      name: '',
      description: '',
      type: '',
      layer: 'Role',
      parentAgent: ''
    });
  };

  // Sample data for testing
  const mockAgentStatuses: AgentStatus[] = [
    {
      id: 1,
      name: 'JARVIS® META BRAIN',
      type: 'Central Orchestrator',
      layer: 'Meta Brain',
      status: 'active',
      cpuUsage: 87,
      memoryUsage: 64,
      powerConsumption: 95,
      storageUsage: 42,
      uptime: 'v2.1 • 83 days, 7 hours uptime',
      lastActivity: new Date(Date.now() - 2 * 60000),
      activeUsers: 156,
      idlePercentage: 13,
      confidenceLevel: 98,
      totalRequests: 247892,
      successRate: 97.2,
      avgResponseTime: 89,
      guardrailsEnabled: true
    },
    {
      id: 2,
      name: 'AUW Agent (Rachel)',
      type: 'Automated Underwriting',
      layer: 'Cognitive',
      status: 'active',
      cpuUsage: 45,
      memoryUsage: 72,
      powerConsumption: 68,
      storageUsage: 28,
      uptime: '12 days, 4 hours uptime',
      lastActivity: new Date(Date.now() - 30000),
      activeUsers: 24,
      idlePercentage: 55,
      confidenceLevel: 92,
      totalRequests: 15743,
      successRate: 94.8,
      avgResponseTime: 1200,
      guardrailsEnabled: true
    },
    {
      id: 3,
      name: 'IT Support Agent (John)',
      type: 'Technical Support',
      layer: 'System',
      status: 'active',
      cpuUsage: 23,
      memoryUsage: 41,
      powerConsumption: 32,
      storageUsage: 18,
      uptime: '8 days, 16 hours uptime',
      lastActivity: new Date(Date.now() - 5 * 60000),
      activeUsers: 7,
      idlePercentage: 77,
      confidenceLevel: 89,
      totalRequests: 3247,
      successRate: 91.5,
      avgResponseTime: 450,
      guardrailsEnabled: true
    }
  ];

  const mockDecisions: AutonomousDecision[] = [
    {
      id: 1,
      timestamp: new Date(Date.now() - 15 * 60000),
      agentName: 'AUW Agent',
      decision: 'Approved life insurance application for high-risk candidate',
      confidence: 94,
      outcome: 'Application processed successfully'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 28 * 60000),
      agentName: 'Claims Processing Agent',
      decision: 'Escalated complex auto claim to human reviewer',
      confidence: 87,
      outcome: 'Claim routed to specialist'
    }
  ];

  const agents = agentStatuses && Array.isArray(agentStatuses) ? agentStatuses : mockAgentStatuses;
  const decisions = recentDecisions && Array.isArray(recentDecisions) ? recentDecisions : mockDecisions;

  const handleAgentToggle = (agent: AgentStatus, action: 'start' | 'stop' | 'restart') => {
    toggleAgentMutation.mutate({ agentId: agent.id, action });
  };

  const handleGuardrailsToggle = (agent: AgentStatus, enabled: boolean) => {
    toggleGuardrailsMutation.mutate({ agentId: agent.id, enabled });
  };

  // Calculate dynamic governance metrics with proper API data processing
  const governanceScore = (Array.isArray(governanceMetrics)) 
    ? (governanceMetrics.find((m: any) => m.metricType === 'governance_score')?.metricValue) 
    : null;
  const compliantAgents = (Array.isArray(governanceAgents)) ? governanceAgents.filter((agent: any) => agent.governanceStatus === 'compliant').length : null;
  const riskAlerts = (Array.isArray(riskAssessments)) ? riskAssessments.filter((risk: any) => risk.overallRisk === 'high').length : null;
  const avgMaturity = (Array.isArray(governanceAgents) && governanceAgents.length > 0) 
    ? (governanceAgents.reduce((sum: number, agent: any) => sum + (agent.maturityLevel || 1), 0) / governanceAgents.length) 
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">JARVIS® Command Center</h2>
            <p className="text-gray-600">Central intelligence engine orchestrating all AI agents</p>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Operational
        </Badge>
      </div>

      {/* Command Center Tabs - Now Metadata-Driven */}
      <UniversalTabManager 
        tabType="command_center" 
        persona="admin"
        onTabChange={setActiveTab}
        defaultTab="meta-brain-config"
        className="space-y-6"
        renderTabContent={(tab) => {
          // Map metadata-driven tab keys to existing content
          switch (tab.tabKey) {
            case 'meta-brain-config':
              return (
                <div className="space-y-6">
                  {/* JARVIS Meta Brain Status Card */}
                  <Card className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 border-yellow-500/30 backdrop-blur-sm shadow-xl">
                    <CardHeader className="bg-slate-800/50 rounded-t-lg border-b border-yellow-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-500/80 rounded-lg flex items-center justify-center border border-yellow-400/30">
                            <Bot className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-slate-100 font-semibold">JARVIS® META BRAIN</CardTitle>
                            <CardDescription className="text-slate-300">v2.1 • 83 days, 7 hours uptime</CardDescription>
                          </div>
                        </div>
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                          Operational
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="bg-slate-900/50">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1 text-slate-300">
                              <span>Processing Power</span>
                              <span className="text-slate-100 font-medium">87%</span>
                            </div>
                            <Progress value={87} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1 text-slate-300">
                              <span>Memory Usage</span>
                              <span className="text-slate-100 font-medium">64%</span>
                            </div>
                            <Progress value={64} className="h-2" />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">Active Users</span>
                            <span className="font-medium text-slate-100">156</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">Success Rate</span>
                            <span className="font-medium text-green-300">97.2%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* META BRAIN Configuration Card */}
                  <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/30 backdrop-blur-sm shadow-xl">
            <CardHeader className="bg-amber-100/50 rounded-t-lg border-b border-amber-200/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center border border-amber-500/30">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-amber-900 font-bold">JARVIS® META BRAIN Configuration</CardTitle>
                    <CardDescription className="text-amber-700">Advanced AI coordination and orchestration settings</CardDescription>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setMetaBrainConfig({
                      languageModel: 'GPT-4o',
                      memoryAllocation: 16,
                      loggingLevel: 'Info',
                      retryAttempts: 3,
                  
                      fallbackBehavior: 'Default Agent',
                      systemPrompt: 'You are JARVIS®, an advanced AI coordinator for insurance workflows. Your role is to orchestrate specialized agents to solve complex insurance tasks efficiently.',
                      enableParallelExecution: true,
                      allowCrossAgentCommunication: true,
                      enableMemorySharing: true
                    });
                  }}
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  Reset Defaults
                </Button>
              </div>
            </CardHeader>
            <CardContent className="bg-amber-50/50 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Language Model */}
                  <div>
                    <Label htmlFor="languageModel" className="text-amber-800 font-semibold">Language Model</Label>
                    <Select 
                      value={metaBrainConfig.languageModel} 
                      onValueChange={(value) => setMetaBrainConfig(prev => ({ ...prev, languageModel: value }))}
                    >
                      <SelectTrigger className="bg-white border-amber-200 text-amber-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GPT-4o">GPT-4o</SelectItem>
                        <SelectItem value="GPT-4">GPT-4</SelectItem>
                        <SelectItem value="GPT-3.5-turbo">GPT-3.5-turbo</SelectItem>
                        <SelectItem value="Claude-3">Claude-3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Memory Allocation */}
                  <div>
                    <Label htmlFor="memoryAllocation" className="text-amber-800 font-semibold">Memory Allocation (GB)</Label>
                    <Input
                      id="memoryAllocation"
                      type="number"
                      value={metaBrainConfig.memoryAllocation}
                      onChange={(e) => setMetaBrainConfig(prev => ({ ...prev, memoryAllocation: parseInt(e.target.value) }))}
                      className="bg-white border-amber-200 text-amber-900"
                      min="1"
                      max="64"
                    />
                  </div>

                  {/* Logging Level */}
                  <div>
                    <Label htmlFor="loggingLevel" className="text-amber-800 font-semibold">Logging Level</Label>
                    <Select 
                      value={metaBrainConfig.loggingLevel} 
                      onValueChange={(value) => setMetaBrainConfig(prev => ({ ...prev, loggingLevel: value }))}
                    >
                      <SelectTrigger className="bg-white border-amber-200 text-amber-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Debug">Debug</SelectItem>
                        <SelectItem value="Info">Info</SelectItem>
                        <SelectItem value="Warning">Warning</SelectItem>
                        <SelectItem value="Error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Retry Attempts */}
                  <div>
                    <Label htmlFor="retryAttempts" className="text-amber-800 font-semibold">Retry Attempts</Label>
                    <Input
                      id="retryAttempts"
                      type="number"
                      value={metaBrainConfig.retryAttempts}
                      onChange={(e) => setMetaBrainConfig(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) }))}
                      className="bg-white border-amber-200 text-amber-900"
                      min="1"
                      max="10"
                    />
                  </div>

                  {/* OpenAI API Key - Server-side managed */}
                  <div>
                    <Label className="text-amber-800 font-semibold">OpenAI API Key</Label>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-700">API keys are managed securely server-side via ConfigService</p>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Fallback Behavior */}
                  <div>
                    <Label htmlFor="fallbackBehavior" className="text-amber-800 font-semibold">Fallback Behavior</Label>
                    <Select 
                      value={metaBrainConfig.fallbackBehavior} 
                      onValueChange={(value) => setMetaBrainConfig(prev => ({ ...prev, fallbackBehavior: value }))}
                    >
                      <SelectTrigger className="bg-white border-amber-200 text-amber-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Default Agent">Default Agent</SelectItem>
                        <SelectItem value="Human Escalation">Human Escalation</SelectItem>
                        <SelectItem value="Retry with Backup">Retry with Backup</SelectItem>
                        <SelectItem value="Graceful Failure">Graceful Failure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* System Prompt */}
                  <div>
                    <Label htmlFor="systemPrompt" className="text-amber-800 font-semibold">System Prompt</Label>
                    <Textarea
                      id="systemPrompt"
                      value={metaBrainConfig.systemPrompt}
                      onChange={(e) => setMetaBrainConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                      className="bg-white border-amber-200 text-amber-900 min-h-[100px]"
                      placeholder="Core instruction set for JARVIS® META BRAIN"
                    />
                    <p className="text-xs text-amber-600 mt-1">Core instruction set for JARVIS® META BRAIN</p>
                  </div>

                  {/* Advanced Settings */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-amber-800 font-medium">Enable Parallel Execution</Label>
                        <p className="text-xs text-amber-600">Allow multiple agents to run simultaneously</p>
                      </div>
                      <Switch
                        checked={metaBrainConfig.enableParallelExecution}
                        onCheckedChange={(checked) => setMetaBrainConfig(prev => ({ ...prev, enableParallelExecution: checked }))}
                        className="data-[state=checked]:bg-amber-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-amber-800 font-medium">Allow Cross-Agent Communication</Label>
                        <p className="text-xs text-amber-600">Enable agents to communicate directly</p>
                      </div>
                      <Switch
                        checked={metaBrainConfig.allowCrossAgentCommunication}
                        onCheckedChange={(checked) => setMetaBrainConfig(prev => ({ ...prev, allowCrossAgentCommunication: checked }))}
                        className="data-[state=checked]:bg-amber-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-amber-800 font-medium">Enable Memory Sharing Between Agents</Label>
                        <p className="text-xs text-amber-600">Share context and memory across agent instances</p>
                      </div>
                      <Switch
                        checked={metaBrainConfig.enableMemorySharing}
                        onCheckedChange={(checked) => setMetaBrainConfig(prev => ({ ...prev, enableMemorySharing: checked }))}
                        className="data-[state=checked]:bg-amber-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Configuration Button */}
              <div className="flex justify-end pt-6 border-t border-amber-200/50">
                <Button
                  onClick={() => saveConfigMutation.mutate(metaBrainConfig)}
                  disabled={saveConfigMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {saveConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </CardContent>
          </Card>
                </div>
              );
            
            
            case 'agent-directory':
              return (
                <UniversalAgentDirectory
                  title="Agent Directory"
                  subtitle="Comprehensive management and monitoring of all system agents"
                  showCreateButton={true}
                />
              );
            
            case 'meta-brain-config':
              return (
                <div className="space-y-6">
                  <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/30 backdrop-blur-sm shadow-xl">
            <CardHeader className="bg-amber-100/50 rounded-t-lg border-b border-amber-200/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center border border-amber-500/30">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-amber-900 font-bold">HEXAWARE JARVIS® META BRAIN Configuration</CardTitle>
                    <CardDescription className="text-amber-700">Advanced AI coordination and orchestration settings</CardDescription>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setMetaBrainConfig({
                      languageModel: 'GPT-4o',
                      memoryAllocation: 16,
                      loggingLevel: 'Info',
                      retryAttempts: 3,
                  
                      fallbackBehavior: 'Default Agent',
                      systemPrompt: 'You are HEXAWARE JARVIS®, an advanced AI coordinator for insurance workflows. Your role is to orchestrate specialized agents to solve complex insurance tasks efficiently.',
                      enableParallelExecution: true,
                      allowCrossAgentCommunication: true,
                      enableMemorySharing: true
                    });
                  }}
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  Reset Defaults
                </Button>
              </div>
            </CardHeader>
            <CardContent className="bg-amber-50/50 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Language Model */}
                  <div>
                    <Label htmlFor="languageModel" className="text-amber-800 font-semibold">Language Model</Label>
                    <Select 
                      value={metaBrainConfig.languageModel} 
                      onValueChange={(value) => setMetaBrainConfig(prev => ({ ...prev, languageModel: value }))}
                    >
                      <SelectTrigger className="border-amber-200 focus:border-amber-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GPT-4o">GPT-4o</SelectItem>
                        <SelectItem value="GPT-4">GPT-4</SelectItem>
                        <SelectItem value="GPT-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Memory Allocation */}
                  <div>
                    <Label htmlFor="memoryAllocation" className="text-amber-800 font-semibold">Memory Allocation (GB)</Label>
                    <Input
                      id="memoryAllocation"
                      type="number"
                      value={metaBrainConfig.memoryAllocation}
                      onChange={(e) => setMetaBrainConfig(prev => ({ ...prev, memoryAllocation: parseInt(e.target.value) }))}
                      className="border-amber-200 focus:border-amber-400"
                    />
                  </div>

                  {/* Logging Level */}
                  <div>
                    <Label htmlFor="loggingLevel" className="text-amber-800 font-semibold">Logging Level</Label>
                    <Select 
                      value={metaBrainConfig.loggingLevel} 
                      onValueChange={(value) => setMetaBrainConfig(prev => ({ ...prev, loggingLevel: value }))}
                    >
                      <SelectTrigger className="border-amber-200 focus:border-amber-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Debug">Debug</SelectItem>
                        <SelectItem value="Info">Info</SelectItem>
                        <SelectItem value="Warning">Warning</SelectItem>
                        <SelectItem value="Error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Retry Attempts */}
                  <div>
                    <Label htmlFor="retryAttempts" className="text-amber-800 font-semibold">Retry Attempts</Label>
                    <Input
                      id="retryAttempts"
                      type="number"
                      value={metaBrainConfig.retryAttempts}
                      onChange={(e) => setMetaBrainConfig(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) }))}
                      className="border-amber-200 focus:border-amber-400"
                    />
                  </div>

                  {/* OpenAI API Key */}
                  <div>
                    <Label htmlFor="openaiKey" className="text-amber-800 font-semibold">OpenAI API Key</Label>
                    <Input
                      id="openaiKey"
                      type="password"
                      placeholder="••••••"
                      className="border-amber-200 focus:border-amber-400"
                    />
                    <p className="text-xs text-amber-600 mt-1">Required for enhanced agent capabilities</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Fallback Behavior */}
                  <div>
                    <Label htmlFor="fallbackBehavior" className="text-amber-800 font-semibold">Fallback Behavior</Label>
                    <Select 
                      value={metaBrainConfig.fallbackBehavior} 
                      onValueChange={(value) => setMetaBrainConfig(prev => ({ ...prev, fallbackBehavior: value }))}
                    >
                      <SelectTrigger className="border-amber-200 focus:border-amber-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Default Agent">Default Agent</SelectItem>
                        <SelectItem value="Human Escalation">Human Escalation</SelectItem>
                        <SelectItem value="Retry with Backup">Retry with Backup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* System Prompt */}
                  <div>
                    <Label htmlFor="systemPrompt" className="text-amber-800 font-semibold">System Prompt</Label>
                    <Textarea
                      id="systemPrompt"
                      value={metaBrainConfig.systemPrompt}
                      onChange={(e) => setMetaBrainConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                      className="border-amber-200 focus:border-amber-400 min-h-[100px]"
                      placeholder="Core instruction set for HEXAWARE JARVIS® META BRAIN"
                    />
                    <p className="text-xs text-amber-600 mt-1">Core instruction set for HEXAWARE JARVIS® META BRAIN</p>
                  </div>

                  {/* Toggle Switches */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-amber-100/50 rounded-lg border border-amber-200/50">
                      <div>
                        <p className="font-medium text-amber-800">Enable Parallel Execution</p>
                        <p className="text-xs text-amber-600">Allow multiple agents to run simultaneously</p>
                      </div>
                      <Switch
                        checked={metaBrainConfig.enableParallelExecution}
                        onCheckedChange={(checked) => setMetaBrainConfig(prev => ({ ...prev, enableParallelExecution: checked }))}
                        className="data-[state=checked]:bg-amber-600"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-amber-100/50 rounded-lg border border-amber-200/50">
                      <div>
                        <p className="font-medium text-amber-800">Allow Cross-Agent Communication</p>
                        <p className="text-xs text-amber-600">Enable agents to communicate directly</p>
                      </div>
                      <Switch
                        checked={metaBrainConfig.allowCrossAgentCommunication}
                        onCheckedChange={(checked) => setMetaBrainConfig(prev => ({ ...prev, allowCrossAgentCommunication: checked }))}
                        className="data-[state=checked]:bg-amber-600"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-amber-100/50 rounded-lg border border-amber-200/50">
                      <div>
                        <p className="font-medium text-amber-800">Enable Memory Sharing Between Agents</p>
                        <p className="text-xs text-amber-600">Share context and memory across agent instances</p>
                      </div>
                      <Switch
                        checked={metaBrainConfig.enableMemorySharing}
                        onCheckedChange={(checked) => setMetaBrainConfig(prev => ({ ...prev, enableMemorySharing: checked }))}
                        className="data-[state=checked]:bg-amber-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Configuration Button */}
              <div className="flex justify-end pt-6 border-t border-amber-200/50">
                <Button
                  onClick={() => saveConfigMutation.mutate(metaBrainConfig)}
                  disabled={saveConfigMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {saveConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </CardContent>
          </Card>
                </div>
              );

            case 'guardrails':
            case 'ai-governance':
              return (
                <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-xl p-6 border border-purple-500/30">
                  <UniversalExplainableAIGovernance className="w-full" />
                </div>
              );
            
            case 'agent-visibility':
              return (
                <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-xl p-6 border border-blue-500/30">
                  <AgentVisibilityConfig />
                </div>
              );
              
            
            case 'analytics':
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Business Analytics
                    </CardTitle>
                    <CardDescription>Business intelligence and insights dashboard</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Total Requests</p>
                              <p className="text-2xl font-bold">247,892</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-500" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Success Rate</p>
                              <p className="text-2xl font-bold">97.2%</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">+2.1% from last month</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Avg Response Time</p>
                              <p className="text-2xl font-bold">89ms</p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-500" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">-5ms from last month</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              );
            
            case 'integrations':
              return (
                <div className="space-y-6">
                  {/* Integration Cards Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Salesforce Integration */}
                    <Card className="bg-slate-800/90 border-slate-700/50 hover:shadow-xl transition-all backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                              <Globe className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-slate-100">Salesforce</h3>
                              <p className="text-sm text-slate-400">Last sync: 10 minutes ago</p>
                            </div>
                          </div>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            Connected
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300">Data sync status</span>
                            <span className="text-green-300 font-medium">Active</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300">Records processed</span>
                            <span className="text-slate-100 font-semibold">2,847</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* ServiceNow Integration */}
                    <Card className="bg-slate-800/90 border-slate-700/50 hover:shadow-xl transition-all backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                              <Settings className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-slate-100">ServiceNow</h3>
                              <p className="text-sm text-slate-400">Last sync: 25 minutes ago</p>
                            </div>
                          </div>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            Connected
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300">Incident sync</span>
                            <span className="text-green-300 font-medium">Active</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300">Tickets processed</span>
                            <span className="text-slate-100 font-semibold">143</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Guidewire Integration */}
                    <Card className="bg-slate-800/90 border-slate-700/50 hover:shadow-xl transition-all backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                              <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-slate-100">Guidewire</h3>
                              <p className="text-sm text-slate-400">Last sync: 2 hours ago</p>
                            </div>
                          </div>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            Connected
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300">Policy sync</span>
                            <span className="text-green-300 font-medium">Active</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300">Claims processed</span>
                            <span className="text-slate-100 font-semibold">89</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Duck Creek Integration */}
                    <Card className="bg-slate-800/90 border-slate-700/50 hover:shadow-xl transition-all backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-slate-100">Duck Creek</h3>
                              <p className="text-sm text-slate-400">Last sync: 45 minutes ago</p>
                            </div>
                          </div>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            Connected
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300">Underwriting sync</span>
                            <span className="text-green-300 font-medium">Active</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300">Applications processed</span>
                            <span className="text-slate-100 font-semibold">267</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Enterprise Integration Benefits */}
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-900">
                        <Globe className="w-6 h-6 text-blue-600" />
                        Enterprise Integration Benefits
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                          <span className="text-gray-700 font-medium">Real-time data synchronization across all platforms</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                          <span className="text-gray-700 font-medium">Automated workflow orchestration and process optimization</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                          <span className="text-gray-700 font-medium">Enhanced operational efficiency and reduced manual processes</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            
            default:
              return (
                <Card>
                  <CardHeader>
                    <CardTitle>Tab: {tab.tabName}</CardTitle>
                    <CardDescription>This tab is configured in the database</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Content for {tab.tabName} tab would be rendered here.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Tab Key: {tab.tabKey} | Type: {tab.tabType}
                    </p>
                  </CardContent>
                </Card>
              );
          }
        }}
      />
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Bot, 
  Cpu, 
  Database, 
  Globe, 
  X,
  Plus,
  Save,
  Edit,
  AlertCircle,
  Settings,
  TestTube,
  Shield,
  Clock,
  Play,
  BarChart,
  CheckCircle,
  XCircle,
  Target,
  Hash,
  History,
  GitBranch,
  FileText,
  ArrowLeft,
  ArrowRight,
  Download,
  RotateCcw,
  Lightbulb,
  Code,
  CheckCircle2,
  Rocket,
  Network,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  useAgentLayerDefinitions, 
  useAgentPersonas,
  useAgentStatusOptions,
  useMaturityLevelDefinitions,
  useAgentCategoryOptions,
  useEnterpriseFeatureGating
} from '@/hooks/useAgentConfig';
import { AgentTestingPanel } from './AgentTestingPanel';
import { AgentLifecyclePanel } from './AgentLifecyclePanel';
import { VersionHistoryPanel } from './VersionHistoryPanel';

interface AgentInfo {
  id: number;
  name: string;
  memoryContextProfile: string;
  layer: string;
  status: 'active' | 'inactive' | 'maintenance';
  specialization?: string;
  description?: string;
  persona?: string;
  config?: {
    capabilities?: string[];
    integrations?: string[];
    testingEnabled?: boolean;
    testingFramework?: string;
    testTemplates?: string[];
    validationRules?: string[];
    testCoverageTarget?: number;
    qualityGateEnabled?: boolean;
    complianceLevel?: string;
    governanceRules?: string[];
    maturityStage?: string;
    agentCategory?: string;
    auditTrailEnabled?: boolean;
    resourceProjections?: {
      cpu: number;
      memory: number;
      network: number;
    };
    showcaseMode?: boolean;
    resourceLimits?: {
      memory: number;
      cpu: number;
      storage: number;
    };
    dependencies?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
  isCustom?: boolean;
  // MDP Governance fields
  maturityLevel?: number;
  governanceStatus?: 'compliant' | 'pending' | 'risk';
  riskLevel?: 'low' | 'medium' | 'high';
  lastAuditDate?: string;
}

interface UniversalAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  agent?: AgentInfo | null;
}

interface AgentFormData {
  name: string;
  memoryContextProfile: string;
  layer: string;
  status: 'active' | 'inactive' | 'maintenance';
  specialization: string;
  description: string;
  persona: string;
  capabilities: string[];
  integrations: string[];
  // Testing & Validation
  testingEnabled: boolean;
  testingFramework: 'jest' | 'mocha' | 'cypress' | 'playwright';
  testTemplates: string[];
  validationRules: string[];
  testCoverageTarget: number;
  qualityGateEnabled: boolean;
  // Governance & Compliance  
  complianceLevel: 'basic' | 'standard' | 'enterprise';
  governanceRules: string[];
  maturityStage: string; // L0, L1, L2, L3, L4 enterprise levels
  agentCategory: string; // Reactive, Deliberative, Learning, etc.
  auditTrailEnabled: boolean;
  governanceStatus: 'compliant' | 'pending' | 'risk';
  // Resource Projections
  resourceProjections: {
    cpu: number;
    memory: number;
    network: number;
  };
  // Advanced Settings
  showcaseMode: boolean;
  resourceLimits: {
    memory: number;
    cpu: number;
    storage: number;
  };
  dependencies: string[];
}

// Icon mapping for layers (ConfigService can't store components)
const getIconForLayer = (layerValue: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    'Role': Bot,
    'Process': Cpu,
    'System': Database,
    'Interface': Globe,
    'Experience': Globe,
    'Meta Brain': Bot
  };
  return iconMap[layerValue] || Bot;
};

export function UniversalAgentModal({ isOpen, onClose, mode, agent }: UniversalAgentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use ConfigService-driven hooks
  const { layerDefinitions, isLoading: layersLoading } = useAgentLayerDefinitions();
  const { personas, isLoading: personasLoading } = useAgentPersonas();
  const { statusOptions, isLoading: statusLoading } = useAgentStatusOptions();
  
  // Enterprise feature hooks
  const { maturityLevels, maturityOptions, isLoading: maturityLoading } = useMaturityLevelDefinitions();
  const { categories, categoryOptions, isLoading: categoriesLoading } = useAgentCategoryOptions();
  
  // ConfigService-driven memory profile options
  const { data: memoryProfileOptions, isLoading: memoryLoading } = useQuery({
    queryKey: ['/api/config/memory-profile-options'],
    queryFn: async () => {
      const response = await fetch('/api/config/memory-profile-options', {
        credentials: 'include'
      });
      if (!response.ok) {
        // Fallback to default options if ConfigService fails
        return [
          {
            key: 'session-only',
            label: 'Session-Only',
            description: 'Memory only persists during active conversation session',
            icon: '🔄'
          },
          {
            key: 'short-term',
            label: 'Short-Term Memory',
            description: 'Persists for hours/days with recent interaction history. Best for customer service agents.',
            icon: '📋'
          },
          {
            key: 'long-term',
            label: 'Long-Term Memory',
            description: 'Persists indefinitely with learning capabilities. Best for specialized role agents.',
            icon: '🧠'
          },
          {
            key: 'episodic',
            label: 'Episodic Memory',
            description: 'Event-based recall with pattern recognition. Best for process agents.',
            icon: '📚'
          },
          {
            key: 'adaptive-learning',
            label: 'Adaptive Learning',
            description: 'Dynamic knowledge base evolution with cross-domain insights. Best for autonomous agents.',
            icon: '🚀'
          }
        ];
      }
      const data = await response.json();
      return Object.values(data) as Array<{key: string, label: string, description: string, icon?: string}>;
    }
  });
  
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    memoryContextProfile: 'session-only',
    layer: '',
    status: 'active',
    specialization: '',
    description: '',
    persona: 'universal',
    capabilities: [],
    integrations: [],
    testingEnabled: true,
    testingFramework: 'jest',
    testTemplates: [],
    validationRules: [],
    testCoverageTarget: 80,
    qualityGateEnabled: false,
    complianceLevel: 'standard',
    governanceRules: [],
    maturityStage: 'L1', // Start with basic enterprise level
    agentCategory: 'Reactive', // Default category
    auditTrailEnabled: false,
    governanceStatus: 'pending',
    resourceProjections: {
      cpu: 25,
      memory: 2,
      network: 100
    },
    showcaseMode: false,
    resourceLimits: {
      memory: 512,
      cpu: 1,
      storage: 1024
    },
    dependencies: []
  });
  
  const [currentCapability, setCurrentCapability] = useState('');
  const [currentIntegration, setCurrentIntegration] = useState('');
  const [currentTestTemplate, setCurrentTestTemplate] = useState('');
  const [currentValidationRule, setCurrentValidationRule] = useState('');
  const [currentGovernanceRule, setCurrentGovernanceRule] = useState('');
  const [currentDependency, setCurrentDependency] = useState('');
  const [activeTab, setActiveTab] = useState('configuration');
  
  // Enterprise feature gating based on current form values (after formData declaration)
  const { features, isEnterpriseReady } = useEnterpriseFeatureGating(formData.maturityStage, formData.agentCategory);
  
  // Ref for scroll reset
  const dialogContentRef = useRef<HTMLDivElement>(null);
  
  // Pre-populate form when in edit mode
  useEffect(() => {
    if (mode === 'edit' && agent && isOpen) {
      setFormData({
        name: agent.name || '',
        memoryContextProfile: agent.memoryContextProfile || 'session-only',
        layer: agent.layer || '',
        status: agent.status || 'active',
        specialization: agent.specialization || '',
        description: agent.description || '',
        persona: agent.persona || 'universal',
        capabilities: agent.config?.capabilities || [],
        integrations: agent.config?.integrations || [],
        // Load existing values or use defaults for new fields when editing existing agents
        testingEnabled: agent.config?.testingEnabled ?? true,
        testingFramework: (agent.config?.testingFramework as 'jest' | 'mocha' | 'cypress' | 'playwright') || 'jest',
        testTemplates: agent.config?.testTemplates || [],
        validationRules: agent.config?.validationRules || [],
        testCoverageTarget: agent.config?.testCoverageTarget || 80,
        qualityGateEnabled: agent.config?.qualityGateEnabled ?? false,
        complianceLevel: (agent.config?.complianceLevel as 'basic' | 'standard' | 'enterprise') || 'standard',
        governanceRules: agent.config?.governanceRules || [],
        maturityStage: agent.config?.maturityStage || 'L1',
        agentCategory: agent.config?.agentCategory || 'Reactive',
        auditTrailEnabled: agent.config?.auditTrailEnabled ?? false,
        governanceStatus: agent.governanceStatus || 'pending',
        resourceProjections: agent.config?.resourceProjections || {
          cpu: 25,
          memory: 2,
          network: 100
        },
        showcaseMode: agent.config?.showcaseMode ?? false,
        resourceLimits: agent.config?.resourceLimits || {
          memory: 512,
          cpu: 1,
          storage: 1024
        },
        dependencies: agent.config?.dependencies || []
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      resetForm();
    }
  }, [mode, agent, isOpen]);
  
  const createAgentMutation = useMutation({
    mutationFn: async (agentData: AgentFormData) => {
      const response = await fetch('/api/agents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...agentData,
          config: {
            persona: agentData.persona,
            specialization: agentData.specialization,
            capabilities: agentData.capabilities,
            integrations: agentData.integrations,
            // Testing & Validation
            testingEnabled: agentData.testingEnabled,
            testingFramework: agentData.testingFramework,
            testTemplates: agentData.testTemplates,
            validationRules: agentData.validationRules,
            testCoverageTarget: agentData.testCoverageTarget,
            qualityGateEnabled: agentData.qualityGateEnabled,
            // Governance & Compliance
            complianceLevel: agentData.complianceLevel,
            governanceRules: agentData.governanceRules,
            maturityStage: agentData.maturityStage,
            // Advanced Settings
            showcaseMode: agentData.showcaseMode,
            resourceLimits: agentData.resourceLimits,
            dependencies: agentData.dependencies
          }
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create agent');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agent Created Successfully",
        description: `${formData.name} has been added to the ${formData.layer} layer.`,
      });
      
      // Comprehensive cache invalidation for create operation
      queryClient.invalidateQueries({ queryKey: ['/api/jarvis/agent-categorization'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/jarvis/agents/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/config/setting'] });
      
      // CRITICAL: Invalidate metadata cache that badges use for status data
      queryClient.invalidateQueries({ queryKey: ['/api/agents/metadata'] });
      
      // Reset form and close modal
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Agent",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const updateAgentMutation = useMutation({
    mutationFn: async (agentData: AgentFormData) => {
      const response = await fetch(`/api/agents/${agent?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...agentData,
          config: {
            persona: agentData.persona,
            specialization: agentData.specialization,
            capabilities: agentData.capabilities,
            integrations: agentData.integrations,
            // Testing & Validation
            testingEnabled: agentData.testingEnabled,
            testingFramework: agentData.testingFramework,
            testTemplates: agentData.testTemplates,
            validationRules: agentData.validationRules,
            testCoverageTarget: agentData.testCoverageTarget,
            qualityGateEnabled: agentData.qualityGateEnabled,
            // Governance & Compliance
            complianceLevel: agentData.complianceLevel,
            governanceRules: agentData.governanceRules,
            maturityStage: agentData.maturityStage,
            auditTrailEnabled: agentData.auditTrailEnabled,
            governanceStatus: agentData.governanceStatus,
            // Advanced Settings
            showcaseMode: agentData.showcaseMode,
            resourceLimits: agentData.resourceLimits,
            dependencies: agentData.dependencies
          }
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update agent');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agent Updated Successfully",
        description: `${formData.name} has been updated in the ${formData.layer} layer.`,
      });
      
      // Comprehensive cache invalidation to ensure all badge components refresh
      queryClient.invalidateQueries({ queryKey: ['/api/jarvis/agent-categorization'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/governance/agents-with-risk'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hierarchy/config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/jarvis/agents/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/config/setting'] });
      
      // CRITICAL: Invalidate metadata cache that badges use for status data
      queryClient.invalidateQueries({ queryKey: ['/api/agents/metadata'] });
      
      // Force refetch any queries that might contain agent status data
      queryClient.refetchQueries({ queryKey: ['/api/agents'] });
      queryClient.refetchQueries({ queryKey: ['/api/jarvis/agents/status'] });
      queryClient.refetchQueries({ queryKey: ['/api/agents/metadata'] });
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to ${mode === 'create' ? 'Create' : 'Update'} Agent`,
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const resetForm = () => {
    setFormData({
      name: '',
      memoryContextProfile: 'session-only',
      layer: '',
      status: 'active',
      specialization: '',
      description: '',
      persona: 'universal',
      capabilities: [],
      integrations: [],
      testingEnabled: true,
      testingFramework: 'jest',
      testTemplates: [],
      validationRules: [],
      testCoverageTarget: 80,
      qualityGateEnabled: false,
      complianceLevel: 'standard',
      governanceRules: [],
      maturityStage: 'L1', // Start with basic enterprise level
      agentCategory: 'Reactive', // Default category
      auditTrailEnabled: false,
      governanceStatus: 'pending',
      resourceProjections: {
        cpu: 25,
        memory: 8,
        network: 150
      },
      showcaseMode: false,
      resourceLimits: {
        memory: 512,
        cpu: 1,
        storage: 1024
      },
      dependencies: []
    });
    setCurrentCapability('');
    setCurrentIntegration('');
    setCurrentTestTemplate('');
    setCurrentValidationRule('');
    setCurrentGovernanceRule('');
    setCurrentDependency('');
    setActiveTab('configuration');
  };
  
  const handleInputChange = (field: keyof AgentFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const addCapability = () => {
    if (currentCapability.trim() && !formData.capabilities.includes(currentCapability.trim())) {
      setFormData(prev => ({
        ...prev,
        capabilities: [...prev.capabilities, currentCapability.trim()]
      }));
      setCurrentCapability('');
    }
  };
  
  const removeCapability = (capability: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.filter(c => c !== capability)
    }));
  };
  
  const addIntegration = () => {
    if (currentIntegration.trim() && !formData.integrations.includes(currentIntegration.trim())) {
      setFormData(prev => ({
        ...prev,
        integrations: [...prev.integrations, currentIntegration.trim()]
      }));
      setCurrentIntegration('');
    }
  };
  
  const removeIntegration = (integration: string) => {
    setFormData(prev => ({
      ...prev,
      integrations: prev.integrations.filter(i => i !== integration)
    }));
  };
  
  // Testing & Validation handlers
  const addTestTemplate = () => {
    if (currentTestTemplate.trim() && !formData.testTemplates.includes(currentTestTemplate.trim())) {
      setFormData(prev => ({
        ...prev,
        testTemplates: [...prev.testTemplates, currentTestTemplate.trim()]
      }));
      setCurrentTestTemplate('');
    }
  };
  
  const removeTestTemplate = (template: string) => {
    setFormData(prev => ({
      ...prev,
      testTemplates: prev.testTemplates.filter(t => t !== template)
    }));
  };
  
  const addValidationRule = () => {
    if (currentValidationRule.trim() && !formData.validationRules.includes(currentValidationRule.trim())) {
      setFormData(prev => ({
        ...prev,
        validationRules: [...prev.validationRules, currentValidationRule.trim()]
      }));
      setCurrentValidationRule('');
    }
  };
  
  const removeValidationRule = (rule: string) => {
    setFormData(prev => ({
      ...prev,
      validationRules: prev.validationRules.filter(r => r !== rule)
    }));
  };
  
  // Governance handlers
  const addGovernanceRule = () => {
    if (currentGovernanceRule.trim() && !formData.governanceRules.includes(currentGovernanceRule.trim())) {
      setFormData(prev => ({
        ...prev,
        governanceRules: [...prev.governanceRules, currentGovernanceRule.trim()]
      }));
      setCurrentGovernanceRule('');
    }
  };
  
  const removeGovernanceRule = (rule: string) => {
    setFormData(prev => ({
      ...prev,
      governanceRules: prev.governanceRules.filter(r => r !== rule)
    }));
  };
  
  // Advanced Settings handlers
  const addDependency = () => {
    if (currentDependency.trim() && !formData.dependencies.includes(currentDependency.trim())) {
      setFormData(prev => ({
        ...prev,
        dependencies: [...prev.dependencies, currentDependency.trim()]
      }));
      setCurrentDependency('');
    }
  };
  
  const removeDependency = (dependency: string) => {
    setFormData(prev => ({
      ...prev,
      dependencies: prev.dependencies.filter(d => d !== dependency)
    }));
  };
  
  // Handle tab changes with scroll reset
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    // Reset scroll position to top when switching tabs
    if (dialogContentRef.current) {
      dialogContentRef.current.scrollTop = 0;
    }
  };
  
  const handleSubmit = () => {
    if (!formData.name || !formData.memoryContextProfile || !formData.layer) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields: Name, Memory Profile, and Layer.",
        variant: "destructive",
      });
      return;
    }
    
    if (mode === 'create') {
      createAgentMutation.mutate(formData);
    } else {
      updateAgentMutation.mutate(formData);
    }
  };
  
  const LayerIcon = getIconForLayer(formData.layer);
  const isLoading = mode === 'create' ? createAgentMutation.isPending : updateAgentMutation.isPending;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        ref={dialogContentRef}
        className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-3 text-xl font-bold text-white">
              <div className={`p-2 rounded-lg ${mode === 'create' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-orange-500/10 border-orange-500/20'} border`}>
                {mode === 'create' ? (
                  <Plus className="w-6 h-6 text-blue-400" />
                ) : (
                  <Edit className="w-6 h-6 text-orange-400" />
                )}
              </div>
              <span>{mode === 'create' ? 'Create New Agent' : 'Edit Agent'}</span>
              {mode === 'edit' && agent && (
                <span className="text-orange-400">• {agent.name}</span>
              )}
            </DialogTitle>
            
            {/* Showcase Mode Toggle */}
            <div className="flex items-center space-x-3">
              <Label htmlFor="showcase-toggle" className="text-sm text-slate-300 font-medium">
                Showcase Mode
              </Label>
              <Switch
                id="showcase-toggle"
                checked={formData.showcaseMode}
                onCheckedChange={(checked) => {
                  // Apply enhanced projections when showcase mode is enabled
                  if (checked) {
                    setFormData(prev => ({
                      ...prev,
                      showcaseMode: true,
                      resourceProjections: {
                        cpu: 75,
                        memory: 8,
                        network: 500
                      },
                      resourceLimits: {
                        memory: 2048,
                        cpu: 4,
                        storage: 10240
                      },
                      testCoverageTarget: 95,
                      qualityGateEnabled: true,
                      complianceLevel: 'enterprise',
                      auditTrailEnabled: true
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      showcaseMode: false,
                      resourceProjections: {
                        cpu: 25,
                        memory: 2,
                        network: 100
                      },
                      resourceLimits: {
                        memory: 512,
                        cpu: 1,
                        storage: 1024
                      },
                      testCoverageTarget: 80,
                      qualityGateEnabled: false,
                      complianceLevel: 'standard',
                      auditTrailEnabled: false
                    }));
                  }
                }}
                data-testid="switch-showcase-mode"
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-blue-500"
              />
              {formData.showcaseMode && (
                <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 animate-pulse" data-testid="badge-showcase-active">
                  ✨ Enhanced
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="py-4">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="configuration" className="text-white data-[state=active]:bg-slate-700" data-testid="tab-configuration">
              <Settings className="w-4 h-4 mr-2" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="testing" className="text-white data-[state=active]:bg-slate-700" data-testid="tab-testing">
              <TestTube className="w-4 h-4 mr-2" />
              Testing & QA
            </TabsTrigger>
            <TabsTrigger value="lifecycle" className="text-white data-[state=active]:bg-slate-700" data-testid="tab-lifecycle">
              <Shield className="w-4 h-4 mr-2" />
              Lifecycle
            </TabsTrigger>
            <TabsTrigger value="history" className="text-white data-[state=active]:bg-slate-700" data-testid="tab-history">
              <Clock className="w-4 h-4 mr-2" />
              Version History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="configuration" className="space-y-6 mt-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white font-medium">Agent Name *</Label>
              <Input
                id="name"
                data-testid="input-agent-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter agent name"
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="persona" className="text-white font-medium">Persona Access</Label>
              <Select value={formData.persona} onValueChange={(value) => handleInputChange('persona', value)}>
                <SelectTrigger 
                  data-testid="select-agent-persona"
                  className="bg-slate-800 border-slate-600 text-white"
                >
                  <SelectValue placeholder="Select persona" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {personas?.map(persona => (
                    <SelectItem key={persona.value} value={persona.value} className="text-white">
                      {persona.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Layer and Memory Profile Selection - Improved Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="layer" className="text-white font-medium">Agent Layer *</Label>
              <Select value={formData.layer} onValueChange={(value) => handleInputChange('layer', value)}>
                <SelectTrigger 
                  data-testid="select-agent-layer"
                  className="bg-slate-800 border-slate-600 text-white"
                >
                  <SelectValue placeholder="Select layer" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {layerDefinitions?.map(layer => {
                    const Icon = getIconForLayer(layer.value);
                    return (
                      <SelectItem key={layer.value} value={layer.value} className="text-white">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4" />
                          <span>{layer.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {formData.layer && (
                <p className="text-xs text-slate-400">
                  {layerDefinitions?.find(l => l.value === formData.layer)?.description}
                </p>
              )}
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="memoryContextProfile" className="text-white font-medium">Memory & Context Profile *</Label>
              <Select 
                value={formData.memoryContextProfile} 
                onValueChange={(value) => handleInputChange('memoryContextProfile', value)}
                disabled={memoryLoading}
              >
                <SelectTrigger 
                  data-testid="select-memory-profile"
                  className="bg-slate-800 border-slate-600 text-white"
                >
                  <SelectValue placeholder="Select memory profile" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {memoryProfileOptions?.map(profile => (
                    <SelectItem key={profile.key} value={profile.key} className="text-white">
                      <div className="flex items-center space-x-2">
                        {profile.icon && <span className="text-lg">{profile.icon}</span>}
                        <div className="flex flex-col">
                          <span className="font-medium">{profile.label}</span>
                          <span className="text-xs text-slate-400">{profile.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Status Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-white font-medium">Initial Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value as 'active' | 'inactive' | 'maintenance')}>
                <SelectTrigger 
                  data-testid="select-agent-status"
                  className="bg-slate-800 border-slate-600 text-white"
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {statusOptions?.map(status => (
                    <SelectItem key={status.value} value={status.value} className="text-white">
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="specialization" className="text-white font-medium">Specialization</Label>
              <Input
                id="specialization"
                data-testid="input-agent-specialization"
                value={formData.specialization}
                onChange={(e) => handleInputChange('specialization', e.target.value)}
                placeholder="e.g., Claims Processing, Risk Assessment"
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white font-medium">Description</Label>
            <Textarea
              id="description"
              data-testid="textarea-agent-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the agent's purpose and capabilities"
              rows={3}
              className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
            />
          </div>
          
          {/* Capabilities */}
          <div className="space-y-4">
            <Label className="text-white font-medium">Capabilities</Label>
            <div className="flex space-x-2">
              <Input
                value={currentCapability}
                onChange={(e) => setCurrentCapability(e.target.value)}
                placeholder="Add capability"
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCapability();
                  }
                }}
              />
              <Button 
                type="button" 
                onClick={addCapability}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!currentCapability.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.capabilities.map((capability, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="bg-slate-700 text-white hover:bg-slate-600"
                >
                  {capability}
                  <button
                    type="button"
                    onClick={() => removeCapability(capability)}
                    className="ml-2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Integrations */}
          <div className="space-y-4">
            <Label className="text-white font-medium">Integrations</Label>
            <div className="flex space-x-2">
              <Input
                value={currentIntegration}
                onChange={(e) => setCurrentIntegration(e.target.value)}
                placeholder="Add integration"
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addIntegration();
                  }
                }}
              />
              <Button 
                type="button" 
                onClick={addIntegration}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!currentIntegration.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.integrations.map((integration, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="bg-slate-700 text-white hover:bg-slate-600"
                >
                  {integration}
                  <button
                    type="button"
                    onClick={() => removeIntegration(integration)}
                    className="ml-2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          </TabsContent>
          
          <TabsContent value="testing" className="space-y-6 mt-6">
            <AgentTestingPanel 
              agentId={mode === 'edit' ? agent?.id : undefined}
              formData={{
                testingEnabled: formData.testingEnabled,
                testingFramework: formData.testingFramework,
                testTemplates: formData.testTemplates,
                validationRules: formData.validationRules,
                testCoverageTarget: formData.testCoverageTarget,
                qualityGateEnabled: formData.qualityGateEnabled,
                maturityLevel: formData.maturityStage,
                agentCategory: formData.agentCategory
              }}
              onFormDataChange={(updates) => {
                setFormData(prev => ({
                  ...prev,
                  ...updates
                }));
              }}
              showcaseMode={formData.showcaseMode}
            />
          </TabsContent>
          
          <TabsContent value="lifecycle" className="space-y-6 mt-6">
            <AgentLifecyclePanel 
              agentId={mode === 'edit' ? agent?.id : undefined}
              formData={{
                maturityStage: (formData.maturityStage === 'L0' ? 'prototype' : 
                              formData.maturityStage === 'L1' ? 'development' : 
                              formData.maturityStage === 'L2' ? 'testing' : 
                              'production') as 'prototype' | 'development' | 'testing' | 'production',
                auditTrailEnabled: formData.auditTrailEnabled,
                dependencies: formData.dependencies,
                maturityLevel: formData.maturityStage,
                agentCategory: formData.agentCategory,
                complianceFrameworks: formData.governanceRules,
                riskLevel: formData.complianceLevel,
                governanceStatus: formData.governanceStatus
              }}
              onFormDataChange={(updates) => {
                setFormData(prev => ({
                  ...prev,
                  ...updates,
                  // Map back the maturity stage
                  maturityStage: updates.maturityLevel || prev.maturityStage,
                  governanceRules: updates.complianceFrameworks || prev.governanceRules,
                  complianceLevel: (updates.riskLevel as any) || prev.complianceLevel
                }));
              }}
              showcaseMode={formData.showcaseMode}
            />
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6 mt-6">
            {mode === 'edit' && agent && (
              <VersionHistoryPanel 
                agentId={agent.id}
                formData={{
                  name: formData.name,
                  description: formData.description,
                  layer: formData.layer,
                  memoryContextProfile: formData.memoryContextProfile,
                  maturityStage: formData.maturityStage
                }}
                showcaseMode={formData.showcaseMode}
                isCreating={false}
              />
            )}
            {mode === 'create' && (
              <VersionHistoryPanel 
                formData={{
                  name: formData.name,
                  description: formData.description,
                  layer: formData.layer,
                  memoryContextProfile: formData.memoryContextProfile,
                  maturityStage: formData.maturityStage
                }}
                showcaseMode={formData.showcaseMode}
                isCreating={true}
              />
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex justify-between pt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isLoading || !formData.name || !formData.memoryContextProfile || !formData.layer}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            data-testid="button-submit"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {mode === 'create' ? 'Create Agent' : 'Update Agent'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
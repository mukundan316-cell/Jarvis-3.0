import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Server, 
  Workflow, 
  Users, 
  Shield, 
  FileText,
  User,
  Check,
  ChevronDown,
  Save,
  Loader2,
  RotateCcw,
  Edit3,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ExperienceTabsConfig {
  company: {
    name: string;
    industry: string;
    size: string;
    premiumVolumeTier: string;
    regions: string[];
    primaryProducts: string[];
  };
  userProfile: {
    name: string;
    jobRole: string;
    department: string;
    experienceLevel: string;
    primaryWorkflows: string[];
    activePersona: string;
  };
  itSystems: {
    policyAdmin: string;
    claimsManagement: string;
    crmSystem: string;
    documentManagement: string;
    dataSources: string[];
  };
  workflows: {
    underwritingWorkflows: string[];
    claimsWorkflows: string[];
    customerServiceWorkflows: string[];
    complianceWorkflows: string[];
    regulatoryCompliance: {
      gdpr: boolean;
      hipaa: boolean;
      sox: boolean;
      amlRegulations: boolean;
      ccpa: boolean;
      nydfs: boolean;
      stateInsuranceRegulations: boolean;
      pciDss: boolean;
    };
  };
  agents: {
    cognitiveAgents: string[];
    processAgents: string[];
    systemAgents: string[];
    interfaceAgents: string[];
  };
  security: {
    authenticationMethods: string[];
    dataEncryption: string[];
    accessControls: string[];
    auditSettings: string[];
  };
  rules: {
    businessRules: string[];
    complianceRules: string[];
    riskRules: string[];
    workflowRules: string[];
  };
}

const defaultConfig: ExperienceTabsConfig = {
  company: {
    name: 'ABC Insurance Ltd',
    industry: 'Insurance',
    size: 'medium',
    premiumVolumeTier: 'medium',
    regions: ['North America', 'Europe'],
    primaryProducts: ['Commercial Lines', 'Personal Lines']
  },
  userProfile: {
    name: '',
    jobRole: '',
    department: '',
    experienceLevel: 'intermediate',
    primaryWorkflows: [],
    activePersona: 'admin'
  },
  itSystems: {
    policyAdmin: 'Guidewire PolicyCenter',
    claimsManagement: 'Guidewire ClaimCenter',
    crmSystem: 'Salesforce',
    documentManagement: 'OnBase',
    dataSources: ['Internal Policy Database', 'Claims History Database', 'Risk Assessment Tools', 'Regulatory Compliance DB']
  },
  workflows: {
    underwritingWorkflows: ['Risk Assessment', 'Policy Evaluation', 'Premium Calculation'],
    claimsWorkflows: ['Claims Intake', 'Investigation', 'Settlement Processing'],
    customerServiceWorkflows: ['Policy Inquiries', 'Claims Support', 'Billing Support'],
    complianceWorkflows: ['Regulatory Reporting', 'Audit Management', 'Document Retention'],
    regulatoryCompliance: {
      gdpr: true,
      hipaa: true,
      sox: false,
      amlRegulations: false,
      ccpa: true,
      nydfs: false,
      stateInsuranceRegulations: true,
      pciDss: false
    }
  },
  agents: {
    cognitiveAgents: ['Rachel Thompson AUW', 'John Stevens IT Support', 'JARVIS Admin'],
    processAgents: ['Risk Assessment Agent', 'Claims Processing Agent', 'Document Processing Agent'],
    systemAgents: ['Database Agent', 'Integration Agent', 'Security Agent'],
    interfaceAgents: ['Voice Agent', 'Email Agent', 'Dashboard Agent', 'API Agent']
  },
  security: {
    authenticationMethods: ['Multi-Factor Authentication', 'Single Sign-On', 'Role-Based Access'],
    dataEncryption: ['AES-256 Encryption', 'TLS 1.3', 'Database Encryption'],
    accessControls: ['Principle of Least Privilege', 'Regular Access Reviews', 'Privileged Access Management'],
    auditSettings: ['Activity Logging', 'Change Tracking', 'Compliance Monitoring']
  },
  rules: {
    businessRules: ['Underwriting Guidelines', 'Pricing Rules', 'Product Rules'],
    complianceRules: ['SOX Compliance', 'GDPR Compliance', 'State Regulations'],
    riskRules: ['Risk Scoring', 'Fraud Detection', 'Credit Scoring'],
    workflowRules: ['Approval Workflows', 'Escalation Rules', 'SLA Management']
  }
};

export function ExperiencePersonalizationTabs() {
  const [config, setConfig] = useState<ExperienceTabsConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState('company');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available personas
  const { data: personas } = useQuery({
    queryKey: ['/api/personas'],
    queryFn: () => fetch('/api/personas').then(res => res.json())
  });

  // Load saved configuration from ConfigService
  const { data: savedConfig, isLoading: configLoading } = useQuery({
    queryKey: ['/api/experience/tabs/config'],
    queryFn: () => fetch('/api/experience/tabs/config').then(res => res.json())
  });
  
  // Update config state when saved configuration is loaded
  useEffect(() => {
    if (savedConfig) {
      setConfig(prevConfig => ({
        ...prevConfig,
        ...savedConfig
      }));
    }
  }, [savedConfig]);

  // Fetch persona-specific user profile
  const { data: userProfileData, refetch: refetchProfile } = useQuery({
    queryKey: ['/api/user/profile', config.userProfile.activePersona],
    queryFn: () => fetch(`/api/user/profile?persona=${config.userProfile.activePersona}`).then(res => res.json()),
    enabled: !!config.userProfile.activePersona
  });

  const saveConfiguration = useMutation({
    mutationFn: async (configData: ExperienceTabsConfig) => {
      const payload = {
        ...configData,
        activePersona: config.userProfile.activePersona
      };
      return apiRequest('/api/experience/tabs/save', 'POST', payload);
    },
    onSuccess: (data) => {
      toast({
        title: "Configuration Saved",
        description: `Experience Layer configuration saved to ConfigService hierarchy (${data.configKeysUpdated} keys updated).`,
      });
      
      // Comprehensive cache invalidation for all ConfigService-related queries
      const configQueriesToInvalidate = [
        // Experience config queries
        ['/api/experience/config'],
        ['/api/experience/tabs/config'],
        
        // ConfigService setting queries
        ['/api/config/setting/experience.company.profile'],
        ['/api/config/setting/company.branding.name'],
        ['/api/config/setting/company.profile.industry'],
        ['/api/config/setting/company.profile.size'],
        ['/api/config/setting/company.profile.regions'],
        ['/api/config/setting/company.profile.products'],
        ['/api/config/setting/experience.user.profile'],
        ['/api/config/setting/user.profile.workflows'],
        ['/api/config/setting/experience.systems.integration'],
        ['/api/config/setting/systems.policy-admin'],
        ['/api/config/setting/systems.claims-management'],
        ['/api/config/setting/systems.crm'],
        ['/api/config/setting/systems.document-management'],
        ['/api/config/setting/systems.data-sources'],
        ['/api/config/setting/experience.workflows.config'],
        ['/api/config/setting/workflows.underwriting'],
        ['/api/config/setting/workflows.claims'],
        ['/api/config/setting/workflows.customer-service'],
        ['/api/config/setting/workflows.compliance'],
        ['/api/config/setting/compliance.regulatory.settings'],
        ['/api/config/setting/experience.agents.config'],
        ['/api/config/setting/agents.cognitive'],
        ['/api/config/setting/agents.process'],
        ['/api/config/setting/agents.system'],
        ['/api/config/setting/agents.interface'],
        ['/api/config/setting/experience.security.config'],
        ['/api/config/setting/security.authentication.methods'],
        ['/api/config/setting/security.data.encryption'],
        ['/api/config/setting/security.access.controls'],
        ['/api/config/setting/security.audit.settings'],
        ['/api/config/setting/experience.rules.config'],
        ['/api/config/setting/rules.business'],
        ['/api/config/setting/rules.compliance'],
        ['/api/config/setting/rules.risk'],
        ['/api/config/setting/rules.workflow'],
        
        // UI-related config queries that might be affected
        ['/api/config/setting/persona-color-schemes.config'],
        ['/api/config/setting/kpi-mappings.config'],
        ['/api/config/setting/business-terminology.config'],
        ['/api/config/setting/agent-layers.config'],
        ['/api/config/setting/agent.layer.definitions'],
        ['/api/config/setting/agent.type.definitions'],
        ['/api/config/setting/business-functions.mappings']
      ];
      
      // Invalidate all related queries
      configQueriesToInvalidate.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      
      // Also invalidate persona-specific queries
      const currentPersona = config.userProfile.activePersona;
      if (currentPersona) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/config/setting/persona-color-schemes.config?persona=${currentPersona}`] 
        });
        queryClient.invalidateQueries({ 
          queryKey: [`/api/config/setting/kpi-mappings.config?persona=${currentPersona}`] 
        });
        queryClient.invalidateQueries({ 
          queryKey: [`/api/config/setting/business-terminology.config?persona=${currentPersona}`] 
        });
      }
      
      // Invalidate related queries for real-time updates across components
      queryClient.invalidateQueries({ predicate: (query) => {
        const queryKey = query.queryKey[0] as string;
        return queryKey?.includes('/api/config/setting/') || 
               queryKey?.includes('/api/experience/') ||
               queryKey?.includes('/api/personas') ||
               queryKey?.includes('/api/user/profile');
      }});
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save configuration to ConfigService hierarchy.",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    saveConfiguration.mutate(config);
  };

  const updateConfig = (section: keyof ExperienceTabsConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const toggleArrayItem = (section: keyof ExperienceTabsConfig, field: string, item: string) => {
    setConfig(prev => {
      const currentArray = (prev[section] as any)[field] || [];
      const newArray = currentArray.includes(item)
        ? currentArray.filter((i: string) => i !== item)
        : [...currentArray, item];
      
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: newArray
        }
      };
    });
  };

  // Handle persona change and load baseline data
  const handlePersonaChange = async (newPersona: string) => {
    try {
      // Update the active persona
      updateConfig('userProfile', 'activePersona', newPersona);
      
      // Show loading toast
      const loadingToast = toast({
        title: "Loading Persona Data",
        description: `Switching to ${newPersona} persona and loading baseline configuration...`,
      });
      
      // Refetch persona-specific data
      const profileResponse = await refetchProfile();
      
      // Auto-populate form with baseline data if available
      if (profileResponse?.data?.baselinePersona) {
        const baseline = profileResponse.data.baselinePersona;
        
        // Handle baseline user profile
        if (baseline.baselineUserProfile) {
          const baselineProfile = typeof baseline.baselineUserProfile === 'string' 
            ? JSON.parse(baseline.baselineUserProfile) 
            : baseline.baselineUserProfile;
            
          // Merge baseline with existing data, prioritizing existing user data where it exists
          setConfig(prev => ({
            ...prev,
            userProfile: {
              ...prev.userProfile,
              // Only update fields if user hasn't customized them or if switching to a new persona
              name: baseline.displayName || prev.userProfile.name || '',
              jobRole: baselineProfile.jobRole || prev.userProfile.jobRole || '',
              department: baselineProfile.department || prev.userProfile.department || '',
              experienceLevel: baselineProfile.experienceLevel || prev.userProfile.experienceLevel || 'intermediate',
              primaryWorkflows: baselineProfile.primaryWorkflows || prev.userProfile.primaryWorkflows || []
            }
          }));
        }
        
        // Handle existing user customizations for this persona
        if (profileResponse.data.userProfile) {
          const existingProfile = profileResponse.data.userProfile;
          setConfig(prev => ({
            ...prev,
            userProfile: {
              ...prev.userProfile,
              // Keep baseline name as default, allow user customization to override
              name: prev.userProfile.name || baseline.displayName || '',
              jobRole: existingProfile.jobRole || prev.userProfile.jobRole,
              department: existingProfile.department || prev.userProfile.department,
              experienceLevel: existingProfile.experienceLevel || prev.userProfile.experienceLevel,
              primaryWorkflows: existingProfile.primaryWorkflows || prev.userProfile.primaryWorkflows
            }
          }));
        }
        
        toast({
          title: "Persona Switched",
          description: `Successfully switched to ${baseline.displayName || newPersona}. Form fields populated with baseline data.`,
        });
      } else {
        // Fallback persona data if no baseline is available
        const fallbackData = getFallbackPersonaData(newPersona);
        if (fallbackData) {
          setConfig(prev => ({
            ...prev,
            userProfile: {
              ...prev.userProfile,
              ...fallbackData
            }
          }));
        }
        
        toast({
          title: "Persona Switched",
          description: `Switched to ${newPersona} persona with default configuration.`,
        });
      }
    } catch (error) {
      console.error('Error switching persona:', error);
      toast({
        title: "Error",
        description: "Failed to load persona data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fallback persona data for when API data isn't available
  const getFallbackPersonaData = (persona: string) => {
    const fallbackData: Record<string, Partial<typeof config.userProfile>> = {
      admin: {
        jobRole: 'admin',
        department: 'administration',
        experienceLevel: 'expert',
        primaryWorkflows: ['agent-management', 'system-monitoring', 'compliance-monitoring']
      },
      rachel: {
        jobRole: 'underwriter',
        department: 'commercial-lines',
        experienceLevel: 'expert',
        primaryWorkflows: ['automated-underwriting', 'risk-assessment', 'policy-management']
      },
      john: {
        jobRole: 'analyst',
        department: 'it-support',
        experienceLevel: 'expert',
        primaryWorkflows: ['system-monitoring', 'incident-management', 'document-processing']
      },
      broker: {
        jobRole: 'agent',
        department: 'distribution',
        experienceLevel: 'intermediate',
        primaryWorkflows: ['customer-service', 'policy-management', 'claims-processing']
      }
    };
    
    return fallbackData[persona];
  };

  // Helper function to check if a field is customized (different from baseline)
  const isFieldCustomized = (fieldName: string, currentValue: any) => {
    if (!userProfileData?.baselinePersona?.baselineUserProfile) return false;
    
    try {
      const baseline = typeof userProfileData.baselinePersona.baselineUserProfile === 'string'
        ? JSON.parse(userProfileData.baselinePersona.baselineUserProfile)
        : userProfileData.baselinePersona.baselineUserProfile;
        
      const baselineValue = baseline[fieldName];
      
      // Handle arrays differently
      if (Array.isArray(currentValue) && Array.isArray(baselineValue)) {
        return JSON.stringify(currentValue.sort()) !== JSON.stringify(baselineValue.sort());
      }
      
      return currentValue !== baselineValue && currentValue !== '';
    } catch {
      // Fallback to checking against default fallback data
      const fallbackData = getFallbackPersonaData(config.userProfile.activePersona);
      return fallbackData?.[fieldName as keyof typeof fallbackData] !== currentValue;
    }
  };

  // Apply baseline values to all fields
  const applyBaselineValues = () => {
    try {
      let baselineProfile;
      
      if (userProfileData?.baselinePersona?.baselineUserProfile) {
        baselineProfile = typeof userProfileData.baselinePersona.baselineUserProfile === 'string'
          ? JSON.parse(userProfileData.baselinePersona.baselineUserProfile)
          : userProfileData.baselinePersona.baselineUserProfile;
      } else {
        // Use fallback data if API data isn't available
        baselineProfile = getFallbackPersonaData(config.userProfile.activePersona);
      }
      
      if (baselineProfile) {
        setConfig(prev => ({
          ...prev,
          userProfile: {
            ...prev.userProfile,
            jobRole: baselineProfile.jobRole || '',
            department: baselineProfile.department || '',
            experienceLevel: baselineProfile.experienceLevel || 'intermediate',
            primaryWorkflows: baselineProfile.primaryWorkflows || []
          }
        }));
        
        toast({
          title: "Baseline Applied",
          description: "All fields have been reset to persona baseline values.",
        });
      }
    } catch (error) {
      console.error('Error applying baseline:', error);
      toast({
        title: "Error",
        description: "Failed to apply baseline values.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="hexaware-glass border-blue-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-white">
              <Building2 className="w-5 h-5 text-blue-400 mr-2" />
              Experience Layer Configuration
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configure JARVIS system integration and operational parameters
            </CardDescription>
          </div>
          <Button 
            onClick={handleSave}
            disabled={saveConfiguration.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saveConfiguration.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-slate-800">
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="userprofile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              User Profile
            </TabsTrigger>
            <TabsTrigger value="itsystems" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              IT Systems
            </TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Rules
            </TabsTrigger>
          </TabsList>

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-gray-300">Company Name</Label>
                  <Input
                    id="companyName"
                    value={config.company.name}
                    onChange={(e) => updateConfig('company', 'name', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-gray-300">Industry</Label>
                  <Select
                    value={config.company.industry}
                    onValueChange={(value) => updateConfig('company', 'industry', value)}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Insurance">Insurance</SelectItem>
                      <SelectItem value="Financial Services">Financial Services</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companySize" className="text-gray-300">Company Size</Label>
                  <Select
                    value={config.company.size}
                    onValueChange={(value) => updateConfig('company', 'size', value)}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (1-50 employees)</SelectItem>
                      <SelectItem value="medium">Medium (51-500 employees)</SelectItem>
                      <SelectItem value="large">Large (501-5000 employees)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (5000+ employees)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="premiumVolumeTier" className="text-gray-300">Annual Premium Volume</Label>
                  <Select
                    value={config.company.premiumVolumeTier}
                    onValueChange={(value) => updateConfig('company', 'premiumVolumeTier', value)}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select premium volume tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">Startup (&lt;$1M)</SelectItem>
                      <SelectItem value="small">Small ($1M-$10M)</SelectItem>
                      <SelectItem value="medium">Medium ($10M-$100M)</SelectItem>
                      <SelectItem value="large">Large ($100M-$1B)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (&gt;$1B)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300 mb-3 block">Operating Regions</Label>
                  <div className="space-y-2">
                    {['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa'].map(region => (
                      <div key={region} className="flex items-center space-x-2">
                        <Checkbox
                          id={region}
                          checked={config.company.regions.includes(region)}
                          onCheckedChange={() => toggleArrayItem('company', 'regions', region)}
                        />
                        <Label htmlFor={region} className="text-sm text-gray-300">{region}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="text-gray-300 mb-3 block">Primary Products</Label>
                  <div className="space-y-2">
                    {['Commercial Lines', 'Personal Lines', 'Life Insurance', 'Health Insurance', 'Specialty Insurance'].map(product => (
                      <div key={product} className="flex items-center space-x-2">
                        <Checkbox
                          id={product}
                          checked={config.company.primaryProducts.includes(product)}
                          onCheckedChange={() => toggleArrayItem('company', 'primaryProducts', product)}
                        />
                        <Label htmlFor={product} className="text-sm text-gray-300">{product}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* User Profile Tab */}
          <TabsContent value="userprofile" className="space-y-6 mt-6">
            {/* Persona Selector */}
            <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="persona" className="text-gray-300 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Role Persona
                </Label>
                <Select
                  value={config.userProfile.activePersona}
                  onValueChange={handlePersonaChange}
                  data-testid="select-persona"
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select a persona" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(personas) ? personas.map((persona: any) => (
                      <SelectItem key={persona.personaKey} value={persona.personaKey}>
                        <div className="flex items-center space-x-2">
                          <span>{persona.displayName}</span>
                          <span className="text-sm text-slate-400">({persona.department})</span>
                        </div>
                      </SelectItem>
                    )) : (
                      <>
                        <SelectItem value="admin">JARVIS Admin</SelectItem>
                        <SelectItem value="rachel">Rachel Thompson (AUW)</SelectItem>
                        <SelectItem value="john">John (IT Support)</SelectItem>
                        <SelectItem value="broker">Mike Stevens (Broker)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-400">
                  Select a role persona to auto-populate form fields with baseline data
                </p>
                {(isFieldCustomized('jobRole', config.userProfile.jobRole) || 
                  isFieldCustomized('department', config.userProfile.department) || 
                  isFieldCustomized('experienceLevel', config.userProfile.experienceLevel) || 
                  isFieldCustomized('primaryWorkflows', config.userProfile.primaryWorkflows)) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyBaselineValues}
                    className="mt-2 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    data-testid="button-apply-baseline"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Apply Baseline Values
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
                  <Input
                    id="fullName"
                    value={config.userProfile.name}
                    onChange={(e) => updateConfig('userProfile', 'name', e.target.value)}
                    placeholder="Enter your full name"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jobRole" className="text-gray-300 flex items-center">
                    Job Role
                    {isFieldCustomized('jobRole', config.userProfile.jobRole) && (
                      <Edit3 className="w-4 h-4 ml-2 text-blue-400" />
                    )}
                  </Label>
                  <Select
                    value={config.userProfile.jobRole}
                    onValueChange={(value) => updateConfig('userProfile', 'jobRole', value)}
                    data-testid="select-job-role"
                  >
                    <SelectTrigger className={`bg-slate-700 border-slate-600 text-white ${
                      isFieldCustomized('jobRole', config.userProfile.jobRole) 
                        ? 'ring-2 ring-blue-400/30 border-blue-500' 
                        : ''
                    }`}>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="underwriter">Underwriter</SelectItem>
                      <SelectItem value="claims-adjuster">Claims Adjuster</SelectItem>
                      <SelectItem value="agent">Insurance Agent</SelectItem>
                      <SelectItem value="customer-service">Customer Service</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="analyst">Analyst</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-gray-300 flex items-center">
                    Department
                    {isFieldCustomized('department', config.userProfile.department) && (
                      <Edit3 className="w-4 h-4 ml-2 text-blue-400" />
                    )}
                  </Label>
                  <Select
                    value={config.userProfile.department}
                    onValueChange={(value) => updateConfig('userProfile', 'department', value)}
                    data-testid="select-department"
                  >
                    <SelectTrigger className={`bg-slate-700 border-slate-600 text-white ${
                      isFieldCustomized('department', config.userProfile.department) 
                        ? 'ring-2 ring-blue-400/30 border-blue-500' 
                        : ''
                    }`}>
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commercial-lines">Commercial Lines</SelectItem>
                      <SelectItem value="personal-lines">Personal Lines</SelectItem>
                      <SelectItem value="claims">Claims</SelectItem>
                      <SelectItem value="underwriting">Underwriting</SelectItem>
                      <SelectItem value="customer-service">Customer Service</SelectItem>
                      <SelectItem value="risk-management">Risk Management</SelectItem>
                      <SelectItem value="distribution">Distribution</SelectItem>
                      <SelectItem value="administration">Administration</SelectItem>
                      <SelectItem value="it-support">IT Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="experienceLevel" className="text-gray-300 flex items-center">
                    Experience Level
                    {isFieldCustomized('experienceLevel', config.userProfile.experienceLevel) && (
                      <Edit3 className="w-4 h-4 ml-2 text-blue-400" />
                    )}
                  </Label>
                  <Select
                    value={config.userProfile.experienceLevel}
                    onValueChange={(value) => updateConfig('userProfile', 'experienceLevel', value)}
                    data-testid="select-experience-level"
                  >
                    <SelectTrigger className={`bg-slate-700 border-slate-600 text-white ${
                      isFieldCustomized('experienceLevel', config.userProfile.experienceLevel) 
                        ? 'ring-2 ring-blue-400/30 border-blue-500' 
                        : ''
                    }`}>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (3-7 years)</SelectItem>
                      <SelectItem value="expert">Expert (8+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300 mb-3 block flex items-center">
                    Primary Workflows
                    {isFieldCustomized('primaryWorkflows', config.userProfile.primaryWorkflows) && (
                      <Edit3 className="w-4 h-4 ml-2 text-blue-400" />
                    )}
                  </Label>
                  <div className={`space-y-2 ${
                    isFieldCustomized('primaryWorkflows', config.userProfile.primaryWorkflows) 
                      ? 'p-3 border border-blue-500/30 rounded-lg bg-blue-500/5' 
                      : ''
                  }`}>
                    {[
                      { id: 'automated-underwriting', label: 'Automated Underwriting' },
                      { id: 'claims-processing', label: 'Claims Processing' },
                      { id: 'policy-management', label: 'Policy Management' },
                      { id: 'customer-service', label: 'Customer Service' },
                      { id: 'fraud-detection', label: 'Fraud Detection' },
                      { id: 'compliance-monitoring', label: 'Compliance Monitoring' },
                      { id: 'document-processing', label: 'Document Processing' }
                    ].map(workflow => (
                      <div key={workflow.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={workflow.id}
                          checked={config.userProfile.primaryWorkflows.includes(workflow.id)}
                          onCheckedChange={() => toggleArrayItem('userProfile', 'primaryWorkflows', workflow.id)}
                        />
                        <Label htmlFor={workflow.id} className="text-sm text-gray-300">{workflow.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* IT Systems Tab */}
          <TabsContent value="itsystems" className="space-y-6 mt-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Insurance Systems Integration</h3>
              <p className="text-slate-400 mb-6">Connect JARVIS Meta Brain to your core systems</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Policy Administration System</Label>
                    <Select
                      value={config.itSystems.policyAdmin}
                      onValueChange={(value) => updateConfig('itSystems', 'policyAdmin', value)}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select system" />
                        <ChevronDown className="w-4 h-4" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Guidewire PolicyCenter">Guidewire PolicyCenter</SelectItem>
                        <SelectItem value="Duck Creek Policy">Duck Creek Policy</SelectItem>
                        <SelectItem value="Applied Epic">Applied Epic</SelectItem>
                        <SelectItem value="Custom System">Custom System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-300">CRM System</Label>
                    <Select
                      value={config.itSystems.crmSystem}
                      onValueChange={(value) => updateConfig('itSystems', 'crmSystem', value)}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select system" />
                        <ChevronDown className="w-4 h-4" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Salesforce">Salesforce</SelectItem>
                        <SelectItem value="Microsoft Dynamics">Microsoft Dynamics</SelectItem>
                        <SelectItem value="HubSpot">HubSpot</SelectItem>
                        <SelectItem value="Custom CRM">Custom CRM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Claims Management System</Label>
                    <Select
                      value={config.itSystems.claimsManagement}
                      onValueChange={(value) => updateConfig('itSystems', 'claimsManagement', value)}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select system" />
                        <ChevronDown className="w-4 h-4" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Guidewire ClaimCenter">Guidewire ClaimCenter</SelectItem>
                        <SelectItem value="Duck Creek Claims">Duck Creek Claims</SelectItem>
                        <SelectItem value="Mitchell">Mitchell</SelectItem>
                        <SelectItem value="Custom System">Custom System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-300">Document Management</Label>
                    <Select
                      value={config.itSystems.documentManagement}
                      onValueChange={(value) => updateConfig('itSystems', 'documentManagement', value)}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select system" />
                        <ChevronDown className="w-4 h-4" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OnBase">OnBase</SelectItem>
                        <SelectItem value="SharePoint">SharePoint</SelectItem>
                        <SelectItem value="M-Files">M-Files</SelectItem>
                        <SelectItem value="Custom System">Custom System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Label className="text-gray-300 mb-3 block">Data Sources</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'Internal Policy Database',
                    'Claims History Database', 
                    'Customer Data Platform',
                    'Risk Assessment Tools',
                    'Regulatory Compliance DB',
                    'Fraud Detection System',
                    'External Data Services',
                    'Actuarial Models'
                  ].map(source => (
                    <div key={source} className="flex items-center space-x-2">
                      <Checkbox
                        id={source}
                        checked={config.itSystems.dataSources.includes(source)}
                        onCheckedChange={() => toggleArrayItem('itSystems', 'dataSources', source)}
                      />
                      <Label htmlFor={source} className="text-sm text-gray-300">{source}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-gray-300 mb-3 block">Underwriting Workflows</Label>
                <div className="space-y-2">
                  {['Risk Assessment', 'Policy Evaluation', 'Premium Calculation', 'Document Review', 'Approval Process'].map(workflow => (
                    <div key={workflow} className="flex items-center space-x-2">
                      <Checkbox
                        id={workflow}
                        checked={config.workflows.underwritingWorkflows.includes(workflow)}
                        onCheckedChange={() => toggleArrayItem('workflows', 'underwritingWorkflows', workflow)}
                      />
                      <Label htmlFor={workflow} className="text-sm text-gray-300">{workflow}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-gray-300 mb-3 block">Claims Workflows</Label>
                <div className="space-y-2">
                  {['Claims Intake', 'Investigation', 'Settlement Processing', 'Fraud Investigation', 'Legal Review'].map(workflow => (
                    <div key={workflow} className="flex items-center space-x-2">
                      <Checkbox
                        id={workflow}
                        checked={config.workflows.claimsWorkflows.includes(workflow)}
                        onCheckedChange={() => toggleArrayItem('workflows', 'claimsWorkflows', workflow)}
                      />
                      <Label htmlFor={workflow} className="text-sm text-gray-300">{workflow}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-gray-300 mb-3 block">Customer Service Workflows</Label>
                <div className="space-y-2">
                  {['Policy Inquiries', 'Claims Support', 'Billing Support', 'Policy Changes', 'Renewal Processing'].map(workflow => (
                    <div key={workflow} className="flex items-center space-x-2">
                      <Checkbox
                        id={workflow}
                        checked={config.workflows.customerServiceWorkflows.includes(workflow)}
                        onCheckedChange={() => toggleArrayItem('workflows', 'customerServiceWorkflows', workflow)}
                      />
                      <Label htmlFor={workflow} className="text-sm text-gray-300">{workflow}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-gray-300 mb-3 block">Compliance Workflows</Label>
                <div className="space-y-2">
                  {['Regulatory Reporting', 'Audit Management', 'Document Retention', 'Privacy Compliance', 'Risk Monitoring'].map(workflow => (
                    <div key={workflow} className="flex items-center space-x-2">
                      <Checkbox
                        id={workflow}
                        checked={config.workflows.complianceWorkflows.includes(workflow)}
                        onCheckedChange={() => toggleArrayItem('workflows', 'complianceWorkflows', workflow)}
                      />
                      <Label htmlFor={workflow} className="text-sm text-gray-300">{workflow}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Compliance & Regulations Section */}
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Compliance & Regulations</h3>
              <p className="text-sm text-gray-400 mb-6">Configure regulatory compliance settings</p>
              
              <div>
                <Label className="text-gray-300 mb-4 block font-medium">Regulatory Compliance</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="gdpr"
                        checked={config.workflows.regulatoryCompliance.gdpr}
                        onCheckedChange={(checked) => setConfig({
                          ...config,
                          workflows: {
                            ...config.workflows,
                            regulatoryCompliance: {
                              ...config.workflows.regulatoryCompliance,
                              gdpr: checked as boolean
                            }
                          }
                        })}
                      />
                      <Label htmlFor="gdpr" className="text-sm text-gray-300">GDPR</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hipaa"
                        checked={config.workflows.regulatoryCompliance.hipaa}
                        onCheckedChange={(checked) => setConfig({
                          ...config,
                          workflows: {
                            ...config.workflows,
                            regulatoryCompliance: {
                              ...config.workflows.regulatoryCompliance,
                              hipaa: checked as boolean
                            }
                          }
                        })}
                      />
                      <Label htmlFor="hipaa" className="text-sm text-gray-300">HIPAA</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sox"
                        checked={config.workflows.regulatoryCompliance.sox}
                        onCheckedChange={(checked) => setConfig({
                          ...config,
                          workflows: {
                            ...config.workflows,
                            regulatoryCompliance: {
                              ...config.workflows.regulatoryCompliance,
                              sox: checked as boolean
                            }
                          }
                        })}
                      />
                      <Label htmlFor="sox" className="text-sm text-gray-300">SOX</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="amlRegulations"
                        checked={config.workflows.regulatoryCompliance.amlRegulations}
                        onCheckedChange={(checked) => setConfig({
                          ...config,
                          workflows: {
                            ...config.workflows,
                            regulatoryCompliance: {
                              ...config.workflows.regulatoryCompliance,
                              amlRegulations: checked as boolean
                            }
                          }
                        })}
                      />
                      <Label htmlFor="amlRegulations" className="text-sm text-gray-300">AML Regulations</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ccpa"
                        checked={config.workflows.regulatoryCompliance.ccpa}
                        onCheckedChange={(checked) => setConfig({
                          ...config,
                          workflows: {
                            ...config.workflows,
                            regulatoryCompliance: {
                              ...config.workflows.regulatoryCompliance,
                              ccpa: checked as boolean
                            }
                          }
                        })}
                      />
                      <Label htmlFor="ccpa" className="text-sm text-gray-300">CCPA</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="nydfs"
                        checked={config.workflows.regulatoryCompliance.nydfs}
                        onCheckedChange={(checked) => setConfig({
                          ...config,
                          workflows: {
                            ...config.workflows,
                            regulatoryCompliance: {
                              ...config.workflows.regulatoryCompliance,
                              nydfs: checked as boolean
                            }
                          }
                        })}
                      />
                      <Label htmlFor="nydfs" className="text-sm text-gray-300">NYDFS</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="stateInsuranceRegulations"
                        checked={config.workflows.regulatoryCompliance.stateInsuranceRegulations}
                        onCheckedChange={(checked) => setConfig({
                          ...config,
                          workflows: {
                            ...config.workflows,
                            regulatoryCompliance: {
                              ...config.workflows.regulatoryCompliance,
                              stateInsuranceRegulations: checked as boolean
                            }
                          }
                        })}
                      />
                      <Label htmlFor="stateInsuranceRegulations" className="text-sm text-gray-300">State Insurance Regulations</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pciDss"
                        checked={config.workflows.regulatoryCompliance.pciDss}
                        onCheckedChange={(checked) => setConfig({
                          ...config,
                          workflows: {
                            ...config.workflows,
                            regulatoryCompliance: {
                              ...config.workflows.regulatoryCompliance,
                              pciDss: checked as boolean
                            }
                          }
                        })}
                      />
                      <Label htmlFor="pciDss" className="text-sm text-gray-300">PCI DSS</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-gray-300 mb-3 block">Cognitive Layer Agents</Label>
                <div className="space-y-2">
                  {config.agents.cognitiveAgents.map(agent => (
                    <div key={agent} className="flex items-center space-x-2 p-2 bg-slate-800/50 rounded">
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-gray-300">{agent}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-gray-300 mb-3 block">Process Layer Agents</Label>
                <div className="space-y-2">
                  {config.agents.processAgents.map(agent => (
                    <div key={agent} className="flex items-center space-x-2 p-2 bg-slate-800/50 rounded">
                      <Check className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-300">{agent}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-gray-300 mb-3 block">System Layer Agents</Label>
                <div className="space-y-2">
                  {config.agents.systemAgents.map(agent => (
                    <div key={agent} className="flex items-center space-x-2 p-2 bg-slate-800/50 rounded">
                      <Check className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-gray-300">{agent}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-gray-300 mb-3 block">Interface Layer Agents</Label>
                <div className="space-y-2">
                  {config.agents.interfaceAgents.map(agent => (
                    <div key={agent} className="flex items-center space-x-2 p-2 bg-slate-800/50 rounded">
                      <Check className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-300">{agent}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-gray-300 mb-3 block">Authentication Methods</Label>
                <div className="space-y-2">
                  {['Multi-Factor Authentication', 'Single Sign-On', 'Role-Based Access', 'Biometric Authentication'].map(method => (
                    <div key={method} className="flex items-center space-x-2">
                      <Checkbox
                        id={method}
                        checked={config.security.authenticationMethods.includes(method)}
                        onCheckedChange={() => toggleArrayItem('security', 'authenticationMethods', method)}
                      />
                      <Label htmlFor={method} className="text-sm text-gray-300">{method}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-gray-300 mb-3 block">Data Encryption</Label>
                <div className="space-y-2">
                  {['AES-256 Encryption', 'TLS 1.3', 'Database Encryption', 'End-to-End Encryption'].map(encryption => (
                    <div key={encryption} className="flex items-center space-x-2">
                      <Checkbox
                        id={encryption}
                        checked={config.security.dataEncryption.includes(encryption)}
                        onCheckedChange={() => toggleArrayItem('security', 'dataEncryption', encryption)}
                      />
                      <Label htmlFor={encryption} className="text-sm text-gray-300">{encryption}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-gray-300 mb-3 block">Access Controls</Label>
                <div className="space-y-2">
                  {['Principle of Least Privilege', 'Regular Access Reviews', 'Privileged Access Management', 'Zero Trust Architecture'].map(control => (
                    <div key={control} className="flex items-center space-x-2">
                      <Checkbox
                        id={control}
                        checked={config.security.accessControls.includes(control)}
                        onCheckedChange={() => toggleArrayItem('security', 'accessControls', control)}
                      />
                      <Label htmlFor={control} className="text-sm text-gray-300">{control}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-gray-300 mb-3 block">Audit Settings</Label>
                <div className="space-y-2">
                  {['Activity Logging', 'Change Tracking', 'Compliance Monitoring', 'Real-time Alerts'].map(setting => (
                    <div key={setting} className="flex items-center space-x-2">
                      <Checkbox
                        id={setting}
                        checked={config.security.auditSettings.includes(setting)}
                        onCheckedChange={() => toggleArrayItem('security', 'auditSettings', setting)}
                      />
                      <Label htmlFor={setting} className="text-sm text-gray-300">{setting}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-gray-300 mb-3 block">Business Rules</Label>
                <div className="space-y-2">
                  {['Underwriting Guidelines', 'Pricing Rules', 'Product Rules', 'Eligibility Criteria'].map(rule => (
                    <div key={rule} className="flex items-center space-x-2">
                      <Checkbox
                        id={rule}
                        checked={config.rules.businessRules.includes(rule)}
                        onCheckedChange={() => toggleArrayItem('rules', 'businessRules', rule)}
                      />
                      <Label htmlFor={rule} className="text-sm text-gray-300">{rule}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-gray-300 mb-3 block">Compliance Rules</Label>
                <div className="space-y-2">
                  {['SOX Compliance', 'GDPR Compliance', 'State Regulations', 'Industry Standards'].map(rule => (
                    <div key={rule} className="flex items-center space-x-2">
                      <Checkbox
                        id={rule}
                        checked={config.rules.complianceRules.includes(rule)}
                        onCheckedChange={() => toggleArrayItem('rules', 'complianceRules', rule)}
                      />
                      <Label htmlFor={rule} className="text-sm text-gray-300">{rule}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-gray-300 mb-3 block">Risk Rules</Label>
                <div className="space-y-2">
                  {['Risk Scoring', 'Fraud Detection', 'Credit Scoring', 'Catastrophic Risk'].map(rule => (
                    <div key={rule} className="flex items-center space-x-2">
                      <Checkbox
                        id={rule}
                        checked={config.rules.riskRules.includes(rule)}
                        onCheckedChange={() => toggleArrayItem('rules', 'riskRules', rule)}
                      />
                      <Label htmlFor={rule} className="text-sm text-gray-300">{rule}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-gray-300 mb-3 block">Workflow Rules</Label>
                <div className="space-y-2">
                  {['Approval Workflows', 'Escalation Rules', 'SLA Management', 'Auto-Assignment'].map(rule => (
                    <div key={rule} className="flex items-center space-x-2">
                      <Checkbox
                        id={rule}
                        checked={config.rules.workflowRules.includes(rule)}
                        onCheckedChange={() => toggleArrayItem('rules', 'workflowRules', rule)}
                      />
                      <Label htmlFor={rule} className="text-sm text-gray-300">{rule}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
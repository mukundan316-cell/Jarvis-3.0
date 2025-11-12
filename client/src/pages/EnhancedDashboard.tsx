import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BrainCircuit, Settings, BarChart3, Database, Bot, Cloud, Layers, Activity, User2, Mic, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePersonaColors } from '@/hooks/usePersonaColors';
import type { PersonaType } from '@/lib/personaColors';
import type { UserPreferences } from '@shared/schema';

import { UniversalAgentExecutionPopup } from '@/components/UniversalAgentExecutionPopup';
import { InteractionMode } from '@/components/InteractionMode';
import { AgentHierarchy } from '@/components/AgentHierarchy';
import { PersonaSwitcher } from '@/components/PersonaSwitcher';
import { UniversalRecentActivities } from '@/components/UniversalRecentActivities';
import { UniversalDashboardMetrics } from '@/components/UniversalDashboardMetrics';
import { UniversalBusinessKPISection } from '@/components/UniversalBusinessKPISection';
import { UniversalInsightsKPISection } from '@/components/UniversalInsightsKPISection';
import { ExperiencePersonalization } from '@/components/ExperiencePersonalization';
import EmailOutbox from '@/components/EmailOutbox';

import { EnhancedDataPrepLayer } from '@/components/EnhancedDataPrepLayer';
import { JarvisCommandCenter } from '@/components/JarvisCommandCenter';
import { AgentVisibilityConfig } from '@/pages/AgentVisibilityConfig';
import { SystemIntegrations } from '@/components/SystemIntegrations';
import { RachelDashboard } from '@/components/RachelDashboard';
import { JohnDashboard } from '@/components/JohnDashboard';
import { AUWDashboard } from '@/components/AUWDashboard';
import { BrokerDashboard } from '@/components/BrokerDashboard';
import { SarahClaimsDashboard } from '@/components/SarahClaimsDashboard';
import { UniversalExplainableAIGovernance } from '@/components/UniversalExplainableAIGovernance';
import { UniversalMetadataManager } from '@/components/UniversalMetadataManager';

import { AgentFactory } from '@/components/AgentFactory';
import { UniversalAgentCategorization } from '@/components/UniversalAgentCategorization';
import { UniversalVoiceAuthenticator } from '@/components/UniversalVoiceAuthenticator';
import { PersonaBriefingSystem } from '@/components/PersonaBriefingSystem';
import { UniversalEmailInbox } from '@/components/UniversalEmailInbox';
import { ViewModeToggle } from '@/components/ViewModeToggle';

import { apiRequest } from '@/lib/queryClient';

// Fallback persona data for offline/error scenarios - Following replit.md FALLBACK requirement
const FALLBACK_PERSONA_DATA = {
  admin: {
    name: 'Jarvis Admin',
    role: 'System Administrator',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150'
  },
  rachel: {
    name: 'Rachel Thompson',
    role: 'Senior Underwriter (AUW)',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b90d5155?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150'
  },
  john: {
    name: 'John Stevens',
    role: 'IT Support Analyst',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150'
  },
  broker: {
    name: 'Mike Stevens',
    role: 'Insurance Broker',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150'
  },
  sarah: {
    name: 'Sarah Geller',
    role: 'Jr Claims Adjustor',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b90d5155?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150'
  }
};

interface AgentPopupState {
  isVisible: boolean;
  executionId?: string; // Connect to real orchestration execution
  agentName: string;
  agentType: string;
  action: string;
  result?: string;
  submissionDetails?: Record<string, unknown>;
  originalCommand?: string;
}

export default function EnhancedDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // All state declarations together to maintain hook order
  const [currentPersona, setCurrentPersona] = useState<PersonaType>('admin');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [agentPopup, setAgentPopup] = useState<AgentPopupState>({
    isVisible: false,
    executionId: undefined,
    agentName: '',
    agentType: '',
    action: ''
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [governanceAgentFilter, setGovernanceAgentFilter] = useState<{agentId?: number, agentName?: string} | null>(null);
  const [showVoiceAuth, setShowVoiceAuth] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [briefingPersona, setBriefingPersona] = useState<'admin' | 'rachel' | 'john' | 'broker' | 'sarah'>('admin');
  const [showEmailInbox, setShowEmailInbox] = useState(false);
  
  // Apply adaptive colors based on current persona
  const { colors, tailwindClasses, getCardStyle } = usePersonaColors(currentPersona);

  // Query current persona from user session
  const { data: userSession } = useQuery<{ activePersona?: PersonaType }>({
    queryKey: ['/api/auth/user'],
  });

  // Database-driven persona data query - Following replit.md NO HARD-CODING principle
  const { data: personaDataConfig, isLoading: personaDataLoading } = useQuery<{key: string; value: any}>({
    queryKey: [`/api/config/setting/personas.config?persona=${currentPersona}`, { persona: currentPersona }],
    enabled: !!currentPersona,
    staleTime: 5 * 60 * 1000, // 5 minutes - persona data changes infrequently
  });

  // Query user preferences for view mode (technical vs business)
  const { data: userPreferences } = useQuery<UserPreferences>({
    queryKey: ["/api/auth/user-preferences"],
    retry: false,
  });

  // Extract current view mode from user preferences (default to 'technical')
  const currentViewMode = userPreferences?.viewMode || 'technical';

  // Update persona and invalidate all queries when persona changes
  useEffect(() => {
    if (userSession?.activePersona && userSession.activePersona !== currentPersona) {
      setCurrentPersona(userSession.activePersona);
      
      // Invalidate all dashboard data queries to force persona-specific refresh
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/jarvis/agent-categorization'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/kpis'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orchestration/workflows'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dataprep/layers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/jarvis/agents/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/jarvis/system-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/jarvis/autonomous-decisions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/commands'] });
      queryClient.invalidateQueries({ queryKey: ['/api/system/integrations'] });
      // Invalidate persona data to fetch new persona configuration
      queryClient.invalidateQueries({ queryKey: ['/api/config/setting/personas.config'] });
    }
  }, [userSession?.activePersona, currentPersona, queryClient]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Phase 2.5: Handle governance navigation from agent directory
  useEffect(() => {
    const handleGovernanceNavigation = (event: CustomEvent) => {
      const { agentId, agentName } = event.detail;
      setGovernanceAgentFilter({ agentId, agentName });
      setActiveTab('hierarchy'); // Navigate to hierarchy tab where agent governance is displayed
      
      // Show toast notification
      toast({
        title: "Governance Dashboard",
        description: `Viewing governance details for ${agentName}`,
        duration: 3000,
      });
    };

    window.addEventListener('openGovernanceDashboard', handleGovernanceNavigation as EventListener);
    
    return () => {
      window.removeEventListener('openGovernanceDashboard', handleGovernanceNavigation as EventListener);
    };
  }, [toast]);

  // Process command mutation
  const processCommandMutation = useMutation({
    mutationFn: async (command: { command: string; persona: string; mode: string }) => {
      return apiRequest('/api/commands', 'POST', {
        input: command.command,
        mode: command.mode,
        persona: command.persona
      });
    },
    onSuccess: async (data: { response?: string; speakResponse?: boolean; executionId?: string; agentExecution?: any; command?: any }, variables: { command: string; persona: string; mode: string }) => {
      // Only invalidate activities for real-time command tracking
      console.log('Command executed successfully, updating activities only');
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      
      // Skip popup for authentication commands
      const isAuthCommand = variables.mode === 'Voice-Auth' || 
                           variables.command.startsWith('authenticate ') ||
                           variables.command.toLowerCase().includes('this is ');
      
      // Voice responses now handled by UniversalAgentExecutionPopup
      console.log('🔍 Command Success Debug:', { 
        command: variables.command, 
        persona: variables.persona, 
        isAuthCommand
      });
      
      // Show Jarvis response as toast notification (only for non-voice modes and non-auth commands)
      if (data.response && !data.speakResponse && !isAuthCommand) {
        toast({
          title: "JARVIS Response",
          description: data.response,
          duration: 5000,
        });
      }
      
      // Display agent execution popup (skip for authentication commands)
      if (!isAuthCommand) {
        setTimeout(() => {
          const popupData = {
            isVisible: true,
            executionId: data.executionId, // Connect to real orchestration execution
            agentName: data.agentExecution?.agentName || "JARVIS AI System",
            agentType: data.agentExecution?.agentType || "Command Processor",
            action: data.agentExecution?.action || "Processing your command request",
            result: data.response || "Command executed successfully",
            originalCommand: data.command?.input || variables.command, // Pass original command for voice responses
            submissionDetails: {
              ...data.agentExecution?.details,
              ...data.agentExecution?.submissionDetails,
              orchestrationFlow: data.agentExecution?.details?.orchestrationFlow || data.agentExecution?.orchestrationFlow,
              emailType: data.agentExecution?.details?.emailType,
              recipient: data.agentExecution?.details?.recipient,
              subject: data.agentExecution?.details?.subject,
              context: data.agentExecution?.details?.context,
              status: data.agentExecution?.details?.status,
              propertyType: data.agentExecution?.details?.propertyType,
              riskFactors: data.agentExecution?.details?.riskFactors,
              pricing: data.agentExecution?.details?.pricing
            }
          };
          
          console.log('🚀 Starting agent execution popup with executionId:', data.executionId);
          setAgentPopup(popupData);
        }, 50);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Command Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isProcessing = processCommandMutation.isPending;

  const handleCommand = async (command: string, mode: string) => {
    console.log('Dashboard handleCommand called:', { command, persona: currentPersona, mode });
    
    // Handle inbox commands directly in frontend
    if (command.toLowerCase().includes('show inbox') || command.toLowerCase().includes('inbox')) {
      setShowEmailInbox(true);
      toast({
        title: "Opening Email Inbox",
        description: `Loading ${currentPersona} email communications...`,
        duration: 2000,
      });
      return;
    }
    
    // Handle voice authentication commands completely in frontend - no API call needed
    if (mode === 'Voice-Auth' && command.startsWith('authenticate ')) {
      // Parse the command to check for briefing flag
      const commandParts = command.split(' ');
      const targetPersona = commandParts[1];
      const requestsBriefing = commandParts.includes('with-briefing');
      
      console.log('Voice authentication detected:', { 
        targetPersona, 
        requestsBriefing, 
        fullCommand: command 
      });
      
      // Validate persona before proceeding
      if (!['admin', 'rachel', 'john', 'broker'].includes(targetPersona)) {
        console.error('Invalid persona for voice auth:', targetPersona);
        toast({
          title: "Invalid Persona",
          description: `Cannot switch to ${targetPersona}. Supported personas: admin, rachel, john, broker`,
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      // Show success toast for voice authentication
      toast({
        title: "Voice Authentication Successful",
        description: `Switching to ${targetPersona.charAt(0).toUpperCase() + targetPersona.slice(1)}'s workspace...`,
        duration: 3000,
      });
      
      // Switch persona directly without API call
      console.log('Calling handlePersonaSwitch with:', targetPersona);
      await handlePersonaSwitch(targetPersona);
      
      // Only show morning briefing if explicitly requested
      if (requestsBriefing) {
        console.log('Morning briefing requested, setting up for:', targetPersona);
        setBriefingPersona(targetPersona as 'admin' | 'rachel' | 'john' | 'broker');
        
        // Small delay to ensure state updates, then show briefing
        setTimeout(() => {
          console.log('Showing morning briefing for:', targetPersona);
          setShowBriefing(true);
        }, 500);
      } else {
        console.log('Simple persona switch - no briefing requested');
      }
      return;
    }
    
    // Process regular commands through mutation
    processCommandMutation.mutate({
      command,
      persona: currentPersona,
      mode
    });
  };

  // Handle persona switching without agent popup
  const handlePersonaSwitch = async (targetPersona: string) => {
    console.log('handlePersonaSwitch called with targetPersona:', targetPersona);
    console.log('Current persona before switch:', currentPersona);
    
    try {
      // Validate persona
      if (!['admin', 'rachel', 'john', 'broker'].includes(targetPersona)) {
        throw new Error(`Invalid persona: ${targetPersona}`);
      }

      console.log('Making API call to /api/persona/switch');
      // Direct API call to switch persona
      const response = await fetch('/api/persona/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: targetPersona })
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', errorText);
        throw new Error(`Failed to switch persona: ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('API response result:', result);
      
      // Update local state immediately
      console.log('Updating local state to:', targetPersona);
      setCurrentPersona(targetPersona as PersonaType);
      
      // Comprehensive cache invalidation for all dashboard components
      console.log('Invalidating all queries for complete dashboard refresh');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/activities'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/metrics'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/agents'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/jarvis/agent-categorization'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/kpis'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/submissions'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/incidents'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/jarvis/agents/status'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/jarvis/system-metrics'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/orchestration/workflows'] }),
      ]);
      
      // Force immediate refetch of critical data
      queryClient.refetchQueries({ queryKey: ['/api/agents'] });
      queryClient.refetchQueries({ queryKey: ['/api/metrics'] });
      queryClient.refetchQueries({ queryKey: ['/api/jarvis/agent-categorization'] });
      
      // Success notification (only for manual dropdown switches, not voice auth)
      toast({
        title: "Persona Switched",
        description: `Successfully switched to ${targetPersona.charAt(0).toUpperCase() + targetPersona.slice(1)}'s workspace`,
        duration: 2000,
      });
      
      console.log('Persona switch completed successfully');
      
      // For manual switches (non-voice), also show briefing
      setTimeout(() => {
        setBriefingPersona(targetPersona as 'admin' | 'rachel' | 'john' | 'broker');
        setShowBriefing(true);
      }, 1500);
      
    } catch (error) {
      console.error('Error switching persona:', error);
      toast({
        title: "Persona Switch Failed",
        description: `Unable to switch to ${targetPersona} workspace. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleCloseAgentPopup = () => {
    setAgentPopup(prev => ({ ...prev, isVisible: false }));
  };

  // Helper function to render metrics based on view mode
  const renderMetrics = (persona?: PersonaType) => {
    if (currentViewMode === 'business') {
      return <UniversalBusinessKPISection persona={persona} />;
    }
    return <UniversalDashboardMetrics persona={persona} />;
  };

  // Handle custom jarvis commands from other components
  useEffect(() => {
    const handleJarvisCommand = (event: CustomEvent) => {
      const { command, mode } = event.detail;
      if (command === 'Show Inbox') {
        setShowEmailInbox(true);
      } else {
        // Process ALL commands through the mutation system to trigger Universal Popup
        processCommandMutation.mutate({
          command,
          mode: mode || 'Pill',
          persona: currentPersona
        });
      }
    };

    window.addEventListener('jarvis-command', handleJarvisCommand as EventListener);
    return () => window.removeEventListener('jarvis-command', handleJarvisCommand as EventListener);
  }, [currentPersona, processCommandMutation]);

  // Voice authentication handlers
  const handlePersonaDetected = (persona: string, command: string) => {
    console.log('Voice persona detected:', persona, command);
    if (['admin', 'rachel', 'john', 'broker'].includes(persona)) {
      setBriefingPersona(persona as 'admin' | 'rachel' | 'john' | 'broker');
      setCurrentPersona(persona as PersonaType);
      setShowVoiceAuth(false);
    }
  };

  const handleBriefingRequested = (persona: string) => {
    console.log('Briefing requested for:', persona);
    if (['admin', 'rachel', 'john', 'broker'].includes(persona)) {
      setBriefingPersona(persona as 'admin' | 'rachel' | 'john' | 'broker');
      setShowBriefing(true);
    }
  };

  const handleBriefingComplete = () => {
    setShowBriefing(false);
    toast({
      title: "Good morning!",
      description: "Ready to start your day with JARVIS",
      variant: "default",
    });
  };

  const toggleVoiceAuth = () => {
    setShowVoiceAuth(!showVoiceAuth);
  };

  // Get database-driven persona data with fallback handling
  const currentPersonaData = (() => {
    // Use ConfigService data if available, otherwise fallback to hardcoded data
    if (personaDataConfig?.value && typeof personaDataConfig.value === 'object' && personaDataConfig.value[currentPersona]) {
      return personaDataConfig.value[currentPersona];
    }
    // If ConfigService fails or data not available, use fallback
    return FALLBACK_PERSONA_DATA[currentPersona as keyof typeof FALLBACK_PERSONA_DATA] || FALLBACK_PERSONA_DATA.admin;
  })();

  // Comprehensive development guards to detect undefined components during HMR
  const validateComponents = () => {
    const components = {
      UniversalAgentExecutionPopup,
      PersonaBriefingSystem,
      UniversalEmailInbox,
      PersonaSwitcher
    };
    
    const issues = [];
    for (const [name, component] of Object.entries(components)) {
      if (typeof component !== 'function') {
        issues.push(`${name}: ${typeof component}`);
      }
    }
    
    if (issues.length > 0) {
      console.error('🚨 HMR Component Issues:', issues);
      return false;
    }
    return true;
  };

  const componentsValid = import.meta.env.DEV ? validateComponents() : true;

  // Fallback component for HMR issues
  const HMRFallback = () => (
    <div className="fixed inset-0 bg-red-900/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-red-900/90 text-white p-6 rounded-lg border border-red-500">
        <h3 className="text-lg font-bold mb-2">🔄 Hot Reload Issue</h3>
        <p>Components are reloading. Please wait or refresh the page.</p>
      </div>
    </div>
  );

  if (import.meta.env.DEV && !componentsValid) {
    return <HMRFallback />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-blue-500/30 bg-black/20 backdrop-blur-md">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <BrainCircuit className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">JARVIS® IntelliAgent</h1>
                <p className="text-sm text-blue-300">Enhanced Admin Dashboard</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-sm text-blue-300">
                {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-xs text-gray-400">
                System Status: Operational
              </div>
            </div>

            <PersonaSwitcher
              currentPersona={currentPersona}
              onPersonaChange={async (persona: string) => {
                setCurrentPersona(persona as PersonaType);
                // Trigger comprehensive cache invalidation for persona-dependent data
                await handlePersonaSwitch(persona);
              }}
              onBriefingTrigger={(persona: string) => {
                console.log('Briefing trigger from PersonaSwitcher:', persona);
                setBriefingPersona(persona as 'admin' | 'rachel' | 'john' | 'broker');
                setShowBriefing(true);
              }}
            />

            {/* View Mode Toggle - Admin Only */}
            <ViewModeToggle currentPersona={currentPersona} />

            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleVoiceAuth}
                className={`text-${tailwindClasses.primary}-400 hover:text-${tailwindClasses.primary}-300 ${showVoiceAuth ? `bg-${tailwindClasses.primary}-500/20` : ''}`}
              >
                <Mic className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className={`text-${tailwindClasses.primary}-400 hover:text-${tailwindClasses.primary}-300`}>
                <Bell className="w-4 h-4" />
              </Button>
              <img
                src={currentPersonaData.avatar}
                alt={currentPersonaData.name}
                className={`w-8 h-8 rounded-full border-2 border-${tailwindClasses.primary}-400`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${currentPersona === 'admin' ? 'grid-cols-7' : 'grid-cols-3'} bg-black/20 border border-blue-500/30`}>
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500/20 flex items-center justify-center gap-2 px-3 py-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">{currentPersona === 'rachel' ? 'AUW Dashboard' : currentPersona === 'john' ? 'IT Support Dashboard' : currentPersona === 'broker' ? 'Broker Portal' : currentPersona === 'sarah' ? 'Claims Center' : 'Overview'}</span>
            </TabsTrigger>
            <TabsTrigger value="kpis" className="data-[state=active]:bg-blue-500/20 flex items-center justify-center gap-2 px-3 py-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
            {currentPersona === 'admin' && (
              <TabsTrigger value="experience" className="data-[state=active]:bg-blue-500/20 flex items-center justify-center gap-2 px-3 py-2">
                <User2 className="w-4 h-4" />
                <span className="hidden sm:inline">Experience Personalization</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="hierarchy" className="data-[state=active]:bg-blue-500/20 flex items-center justify-center gap-2 px-3 py-2">
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Agent Hierarchy</span>
            </TabsTrigger>
            {currentPersona === 'admin' && (
              <TabsTrigger value="dataprep" className="data-[state=active]:bg-blue-500/20 flex items-center justify-center gap-2 px-3 py-2">
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Data Prep</span>
              </TabsTrigger>
            )}
            {currentPersona === 'admin' && (
              <TabsTrigger value="aicommand" className="data-[state=active]:bg-blue-500/20 flex items-center justify-center gap-2 px-3 py-2">
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">Jarvis Command Center</span>
              </TabsTrigger>
            )}
            {currentPersona === 'admin' && (
              <TabsTrigger value="metadata" className="data-[state=active]:bg-blue-500/20 flex items-center justify-center gap-2 px-3 py-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Metadata Manager</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <InteractionMode
                  currentPersona={currentPersona}
                  onCommand={handleCommand}
                  isVoiceActive={isVoiceActive}
                  disabled={processCommandMutation.isPending}
                />
                {currentPersona === 'rachel' ? (
                  <AUWDashboard />
                ) : currentPersona === 'john' ? (
                  <JohnDashboard />
                ) : currentPersona === 'broker' ? (
                  <BrokerDashboard />
                ) : currentPersona === 'sarah' ? (
                  <SarahClaimsDashboard />
                ) : (
                  <>
                    {renderMetrics(currentPersona as 'admin' | 'rachel' | 'john' | 'broker' | 'sarah')}
                    <AgentHierarchy />
                  </>
                )}
              </div>
              <div className="space-y-6">
                {showVoiceAuth && (
                  <UniversalVoiceAuthenticator
                    onPersonaDetected={handlePersonaDetected}
                    onBriefingRequested={handleBriefingRequested}
                    isActive={showVoiceAuth}
                    currentPersona={currentPersona}
                  />
                )}
                <UniversalRecentActivities persona={currentPersona as 'admin' | 'rachel' | 'john' | 'broker' | 'sarah'} showPersonaFilter={false} />
                <UniversalAgentCategorization
                  title={
                    currentPersona === 'rachel' ? 'AUW Agent Categories' :
                    currentPersona === 'john' ? 'IT Support Agent Categories' :
                    currentPersona === 'sarah' ? 'Claims Agent Categories' :
                    'Agent Categorization'
                  }
                  subtitle="AI agents across 4-layer architecture"
                  currentPersona={currentPersona}
                  showCreateButton={currentPersona === 'admin'}
                />
              </div>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="kpis" className="space-y-6">
            <UniversalInsightsKPISection persona={currentPersona} viewMode={currentViewMode as 'technical' | 'business' | undefined} />
          </TabsContent>

          {/* Experience Agent Personalization Tab - Admin Only */}
          {currentPersona === 'admin' && (
            <TabsContent value="experience" className="space-y-6">
              <ExperiencePersonalization />
            </TabsContent>
          )}



          {/* Data Preparation Layer Tab - Admin Only */}
          {currentPersona === 'admin' && (
            <TabsContent value="dataprep" className="space-y-6">
              <EnhancedDataPrepLayer />
            </TabsContent>
          )}

          {/* Agent Hierarchy Tab */}
          <TabsContent value="hierarchy" className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-xl p-6 border border-blue-500/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Layers className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Agent Hierarchy</h2>
                    <p className="text-blue-200">Multi-layered intelligent agent architecture</p>
                  </div>
                </div>
              </div>
              <AgentHierarchy />
            </div>
          </TabsContent>

          {/* Jarvis Command Center Tab - Admin Only */}
          {currentPersona === 'admin' && (
            <TabsContent value="aicommand" className="space-y-6">
              <JarvisCommandCenter />
            </TabsContent>
          )}

          {/* Metadata Manager Tab - Admin Only */}
          {currentPersona === 'admin' && (
            <TabsContent value="metadata" className="space-y-6">
              <UniversalMetadataManager className="w-full" />
            </TabsContent>
          )}

        </Tabs>
      </div>



      {/* Agent Execution Popup */}
      <UniversalAgentExecutionPopup
        isVisible={agentPopup.isVisible}
        executionId={agentPopup.executionId}
        agentName={agentPopup.agentName}
        agentType={agentPopup.agentType}
        action={agentPopup.action}
        persona={currentPersona as 'admin' | 'rachel' | 'john' | 'broker' | 'sarah'}
        submissionDetails={agentPopup.submissionDetails}
        originalCommand={agentPopup.originalCommand}
        onClose={handleCloseAgentPopup}
      />

      {/* Persona Briefing System */}
      <PersonaBriefingSystem
        detectedPersona={briefingPersona}
        onBriefingComplete={handleBriefingComplete}
        autoPlay={true}
        isVisible={showBriefing}
      />

      {/* Universal Email Inbox */}
      <UniversalEmailInbox
        isVisible={showEmailInbox}
        onClose={() => setShowEmailInbox(false)}
        persona={currentPersona as 'admin' | 'rachel' | 'john' | 'broker' | 'sarah'}
      />

    </div>
  );
}
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings2, 
  Sparkles, 
  User, 
  MessageSquare, 
  Workflow, 
  Building2, 
  Brain, 
  Check,
  ChevronRight,
  ChevronLeft,
  Save,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PersonalizationConfig {
  userProfile: {
    name: string;
    jobRole: string;
    department: string;
    experienceLevel: 'beginner' | 'intermediate' | 'expert';
    primaryWorkflows: string[];
    accessLevel: 'standard' | 'advanced' | 'admin';
  };
  userPreferences: {
    communicationStyle: 'formal' | 'casual' | 'technical';
    responseLength: 'brief' | 'detailed' | 'comprehensive';
    explanationLevel: 'basic' | 'intermediate' | 'expert';
    preferredInputMethod: 'voice' | 'text' | 'both';
    autoSuggestions: boolean;
    confirmBeforeActions: boolean;
    notificationSettings: {
      systemAlerts: boolean;
      workflowUpdates: boolean;
      agentCompletions: boolean;
      urgentAlerts: boolean;
      emailNotifications: boolean;
    };
    customInstructions: string;
    workflowInstructions: Record<string, string>;
  };
  enterpriseConfig: {
    companyName: string;
    industry: string;
    companySize: 'small' | 'medium' | 'large' | 'enterprise';
    integrations: string[];
    workflowCustomizations: Record<string, boolean>;
  };
}

const defaultConfig: PersonalizationConfig = {
  userProfile: {
    name: '',
    jobRole: '',
    department: '',
    experienceLevel: 'intermediate',
    primaryWorkflows: [],
    accessLevel: 'standard'
  },
  userPreferences: {
    communicationStyle: 'casual',
    responseLength: 'detailed',
    explanationLevel: 'intermediate',
    preferredInputMethod: 'both',
    autoSuggestions: true,
    confirmBeforeActions: true,
    notificationSettings: {
      systemAlerts: true,
      workflowUpdates: true,
      agentCompletions: true,
      urgentAlerts: true,
      emailNotifications: true
    },
    customInstructions: '',
    workflowInstructions: {}
  },
  enterpriseConfig: {
    companyName: 'ABC Insurance Ltd',
    industry: 'Insurance',
    companySize: 'medium',
    integrations: [],
    workflowCustomizations: {}
  }
};

const workflowOptions = [
  { id: 'automated-underwriting', label: 'Automated Underwriting' },
  { id: 'claims-processing', label: 'Claims Processing' },
  { id: 'policy-management', label: 'Policy Management' },
  { id: 'customer-service', label: 'Customer Service' },
  { id: 'fraud-detection', label: 'Fraud Detection' },
  { id: 'compliance-monitoring', label: 'Compliance Monitoring' },
  { id: 'document-processing', label: 'Document Processing' }
];

interface StepProps {
  configuration: PersonalizationConfig;
  setConfiguration: React.Dispatch<React.SetStateAction<PersonalizationConfig>>;
}

const ProfileStep = ({ configuration, setConfiguration }: StepProps) => {
  const handleProfileChange = (field: string, value: any) => {
    setConfiguration(prev => ({
      ...prev,
      userProfile: {
        ...prev.userProfile,
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">Full Name</Label>
            <Input
              id="name"
              value={configuration.userProfile.name}
              onChange={(e) => handleProfileChange('name', e.target.value)}
              placeholder="Enter your full name"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role" className="text-gray-300">Job Role</Label>
            <Select
              value={configuration.userProfile.jobRole}
              onValueChange={(value) => handleProfileChange('jobRole', value)}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
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
            <Label htmlFor="department" className="text-gray-300">Department</Label>
            <Select
              value={configuration.userProfile.department}
              onValueChange={(value) => handleProfileChange('department', value)}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select your department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="commercial-lines">Commercial Lines</SelectItem>
                <SelectItem value="personal-lines">Personal Lines</SelectItem>
                <SelectItem value="claims">Claims</SelectItem>
                <SelectItem value="underwriting">Underwriting</SelectItem>
                <SelectItem value="customer-service">Customer Service</SelectItem>
                <SelectItem value="risk-management">Risk Management</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="experience" className="text-gray-300">Experience Level</Label>
            <Select
              value={configuration.userProfile.experienceLevel}
              onValueChange={(value) => handleProfileChange('experienceLevel', value)}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
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
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white">Primary Workflows</h3>
        <div className="grid grid-cols-2 gap-3">
          {workflowOptions.map(workflow => (
            <div key={workflow.id} className="flex items-center space-x-2">
              <Checkbox
                id={workflow.id}
                checked={configuration.userProfile.primaryWorkflows.includes(workflow.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleProfileChange('primaryWorkflows', [
                      ...configuration.userProfile.primaryWorkflows,
                      workflow.id
                    ]);
                  } else {
                    handleProfileChange('primaryWorkflows', 
                      configuration.userProfile.primaryWorkflows.filter(w => w !== workflow.id)
                    );
                  }
                }}
              />
              <Label htmlFor={workflow.id} className="text-sm text-gray-300">
                {workflow.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PreferencesStep = ({ configuration, setConfiguration }: StepProps) => {
  const handlePreferenceChange = (field: string, value: any) => {
    setConfiguration(prev => ({
      ...prev,
      userPreferences: {
        ...prev.userPreferences,
        [field]: value
      }
    }));
  };

  const handleNotificationChange = (field: string, checked: boolean) => {
    setConfiguration(prev => ({
      ...prev,
      userPreferences: {
        ...prev.userPreferences,
        notificationSettings: {
          ...prev.userPreferences.notificationSettings,
          [field]: checked
        }
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white">Communication Style</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="communicationStyle" className="text-gray-300">Preferred Communication Style</Label>
            <Select
              value={configuration.userPreferences.communicationStyle}
              onValueChange={(value) => handlePreferenceChange('communicationStyle', value)}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select communication style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">Formal - Professional and structured</SelectItem>
                <SelectItem value="casual">Casual - Friendly and conversational</SelectItem>
                <SelectItem value="technical">Technical - Detailed and precise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="responseLength" className="text-gray-300">Response Length</Label>
            <Select
              value={configuration.userPreferences.responseLength}
              onValueChange={(value) => handlePreferenceChange('responseLength', value)}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select response length" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brief">Brief - Quick and concise</SelectItem>
                <SelectItem value="detailed">Detailed - Thorough explanations</SelectItem>
                <SelectItem value="comprehensive">Comprehensive - Complete information</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white">Interaction Preferences</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inputMethod" className="text-gray-300">Preferred Input Method</Label>
            <Select
              value={configuration.userPreferences.preferredInputMethod}
              onValueChange={(value) => handlePreferenceChange('preferredInputMethod', value)}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select input method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="voice">Voice - Speak to JARVIS</SelectItem>
                <SelectItem value="text">Text - Type commands</SelectItem>
                <SelectItem value="both">Both - Voice and text</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="autoSuggestions"
              checked={configuration.userPreferences.autoSuggestions}
              onCheckedChange={(checked) => handlePreferenceChange('autoSuggestions', checked)}
            />
            <Label htmlFor="autoSuggestions" className="text-gray-300">Enable auto-suggestions</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="confirmBeforeActions"
              checked={configuration.userPreferences.confirmBeforeActions}
              onCheckedChange={(checked) => handlePreferenceChange('confirmBeforeActions', checked)}
            />
            <Label htmlFor="confirmBeforeActions" className="text-gray-300">Confirm before executing actions</Label>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white">Notification Settings</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="systemAlerts" className="text-gray-300">System Alerts</Label>
              <p className="text-sm text-gray-400">Important system notifications</p>
            </div>
            <Switch
              id="systemAlerts"
              checked={configuration.userPreferences.notificationSettings.systemAlerts}
              onCheckedChange={(checked) => handleNotificationChange('systemAlerts', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="workflowUpdates" className="text-gray-300">Workflow Updates</Label>
              <p className="text-sm text-gray-400">Progress on active workflows</p>
            </div>
            <Switch
              id="workflowUpdates"
              checked={configuration.userPreferences.notificationSettings.workflowUpdates}
              onCheckedChange={(checked) => handleNotificationChange('workflowUpdates', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="agentCompletions" className="text-gray-300">Agent Completions</Label>
              <p className="text-sm text-gray-400">When agents complete tasks</p>
            </div>
            <Switch
              id="agentCompletions"
              checked={configuration.userPreferences.notificationSettings.agentCompletions}
              onCheckedChange={(checked) => handleNotificationChange('agentCompletions', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const AIBehaviorStep = ({ configuration, setConfiguration }: StepProps) => {
  const handleCustomInstructionsChange = (value: string) => {
    setConfiguration(prev => ({
      ...prev,
      userPreferences: {
        ...prev.userPreferences,
        customInstructions: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white">AI Behavior Customization</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customInstructions" className="text-gray-300">Custom Instructions for JARVIS</Label>
            <Textarea
              id="customInstructions"
              value={configuration.userPreferences.customInstructions}
              onChange={(e) => handleCustomInstructionsChange(e.target.value)}
              placeholder="Enter specific instructions for how JARVIS should interact with you..."
              className="bg-slate-700 border-slate-600 text-white min-h-32"
            />
            <p className="text-sm text-gray-400">
              Provide specific instructions for how JARVIS should present information, prioritize workflows, and adapt to your work style.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewStep = ({ configuration }: StepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white">Review Your Configuration</h3>
        
        <div className="space-y-4">
          <Card className="bg-slate-800 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p><strong>Name:</strong> {configuration.userProfile.name || 'Not specified'}</p>
              <p><strong>Role:</strong> {configuration.userProfile.jobRole || 'Not specified'}</p>
              <p><strong>Department:</strong> {configuration.userProfile.department || 'Not specified'}</p>
              <p><strong>Experience:</strong> {configuration.userProfile.experienceLevel}</p>
              <p><strong>Primary Workflows:</strong> {configuration.userProfile.primaryWorkflows.length > 0 ? configuration.userProfile.primaryWorkflows.join(', ') : 'None selected'}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Communication Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p><strong>Style:</strong> {configuration.userPreferences.communicationStyle}</p>
              <p><strong>Response Length:</strong> {configuration.userPreferences.responseLength}</p>
              <p><strong>Input Method:</strong> {configuration.userPreferences.preferredInputMethod}</p>
              <p><strong>Auto Suggestions:</strong> {configuration.userPreferences.autoSuggestions ? 'Enabled' : 'Disabled'}</p>
            </CardContent>
          </Card>
          
          {configuration.userPreferences.customInstructions && (
            <Card className="bg-slate-800 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Custom Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                <p className="text-sm">{configuration.userPreferences.customInstructions}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export function PersonalizationWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [configuration, setConfiguration] = useState<PersonalizationConfig>(defaultConfig);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const savePersonalization = useMutation({
    mutationFn: async (config: PersonalizationConfig) => {
      return apiRequest('/api/personalization/save', 'POST', config);
    },
    onSuccess: () => {
      toast({
        title: "Personalization Saved",
        description: "Your JARVIS experience has been personalized successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/experience-config'] });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to save personalization settings.",
        variant: "destructive",
      });
    }
  });

  const steps = [
    {
      id: "profile",
      title: "User Profile",
      description: "Set up your personal information and role",
      icon: User,
      component: <ProfileStep configuration={configuration} setConfiguration={setConfiguration} />
    },
    {
      id: "preferences", 
      title: "Interaction Preferences",
      description: "Configure how JARVIS interacts with you",
      icon: MessageSquare,
      component: <PreferencesStep configuration={configuration} setConfiguration={setConfiguration} />
    },
    {
      id: "ai-behavior",
      title: "AI Behavior",
      description: "Personalize JARVIS behavior and responses",
      icon: Brain,
      component: <AIBehaviorStep configuration={configuration} setConfiguration={setConfiguration} />
    },
    {
      id: "review",
      title: "Review & Save",
      description: "Review and save your personalization settings",
      icon: Check,
      component: <ReviewStep configuration={configuration} setConfiguration={setConfiguration} />
    }
  ];

  const handleSaveConfiguration = () => {
    savePersonalization.mutate(configuration);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full bg-slate-800 border-slate-600 text-white hover:bg-slate-700">
          <Settings2 className="w-4 h-4 mr-2" />
          Personalize Experience
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-600">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5" />
            JARVIS Experience Personalization
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Customize your JARVIS experience to match your work style and preferences
          </DialogDescription>
        </DialogHeader>
        
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                ${index <= currentStep ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300'}
              `}>
                <step.icon className="w-4 h-4" />
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  flex-1 h-0.5 mx-2 
                  ${index < currentStep ? 'bg-blue-500' : 'bg-gray-600'}
                `} />
              )}
            </div>
          ))}
        </div>
        
        {/* Step Title */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">{steps[currentStep].title}</h2>
          <p className="text-gray-400">{steps[currentStep].description}</p>
        </div>
        
        {/* Current Step Content */}
        <div className="min-h-[400px] mb-6">
          {steps[currentStep].component}
        </div>
        
        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t border-slate-600">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentStep === steps.length - 1 ? (
              <Button 
                onClick={handleSaveConfiguration} 
                disabled={savePersonalization.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {savePersonalization.isPending ? (
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
            ) : (
              <Button
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Bot, Brain, Settings, Layers, Code, Save, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  useAgentLayerDefinitions, 
  useAgentTypeDefinitions, 
  useAgentCapabilities,
  useSeedAgentCRUDConfig
} from '@/hooks/useAgentConfig';

interface TemplateCardProps {
  template: any;
  onUse: (template: any) => void;
}

function TemplateCard({ template, onUse }: TemplateCardProps) {
  return (
    <div className="hexaware-glass rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-bold text-white text-sm mb-1">{template.templateName}</h4>
          <p className="text-xs text-[#9CA3AF] mb-2">{template.description}</p>
          <div className="flex items-center space-x-2 text-xs">
            <span className="bg-[#3B82F6]/20 text-[#60A5FA] px-2 py-1 rounded">
              {template.agentType}
            </span>
            <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
              {template.layer}
            </span>
            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">
              Used {template.usageCount || 0}x
            </span>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => onUse(template)}
          className="bg-[#3B82F6] hover:bg-[#1E40AF] text-white"
        >
          Use Template
        </Button>
      </div>
      
      {template.capabilities && Array.isArray(template.capabilities) && (
        <div className="mt-3">
          <div className="text-xs text-[#9CA3AF] mb-1">Capabilities:</div>
          <div className="flex flex-wrap gap-1">
            {template.capabilities.slice(0, 3).map((capability: string, index: number) => (
              <span key={index} className="text-xs bg-black/40 text-[#9CA3AF] px-2 py-1 rounded">
                {capability}
              </span>
            ))}
            {template.capabilities.length > 3 && (
              <span className="text-xs text-[#60A5FA]">+{template.capabilities.length - 3} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface CreateAgentFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

function CreateAgentForm({ isOpen, onClose, initialData }: CreateAgentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use ConfigService-driven hooks
  const { layerDefinitions, isLoading: layersLoading } = useAgentLayerDefinitions();
  const { typeDefinitions, isLoading: typesLoading } = useAgentTypeDefinitions();
  const { capabilities, isLoading: capabilitiesLoading } = useAgentCapabilities();
  
  const [formData, setFormData] = useState({
    templateName: initialData?.templateName || '',
    agentType: initialData?.agentType || typeDefinitions?.[0]?.value || 'Role',
    layer: initialData?.layer || layerDefinitions?.[0]?.value || 'Experience',
    description: initialData?.description || '',
    capabilities: initialData?.capabilities || [],
    configuration: initialData?.configuration || {},
    dependencies: initialData?.dependencies || []
  });

  const createAgentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/agent-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create agent template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agent-templates'] });
      toast({
        title: "Agent Created",
        description: "New agent template has been successfully created.",
      });
      onClose();
      setFormData({
        templateName: '',
        agentType: 'Role',
        layer: 'Experience',
        description: '',
        capabilities: [],
        configuration: {},
        dependencies: []
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCapabilityToggle = (capabilityName: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(capabilityName)
        ? prev.capabilities.filter((c: string) => c !== capabilityName)
        : [...prev.capabilities, capabilityName]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.templateName.trim()) {
      toast({
        title: "Validation Error",
        description: "Agent name is required.",
        variant: "destructive",
      });
      return;
    }
    createAgentMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="hexaware-glass rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#3B82F6]/20 rounded-lg">
                <Plus className="w-5 h-5 text-[#60A5FA]" />
              </div>
              <h3 className="text-xl font-bold text-white">Create New Agent</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Agent Name</label>
                <input
                  type="text"
                  value={formData.templateName}
                  onChange={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))}
                  className="w-full bg-black/40 border border-[#3B82F6]/30 rounded-lg px-3 py-2 text-white"
                  placeholder="Enter agent name..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Agent Type</label>
                <select
                  value={formData.agentType}
                  onChange={(e) => setFormData(prev => ({ ...prev, agentType: e.target.value }))}
                  className="w-full bg-black/40 border border-[#3B82F6]/30 rounded-lg px-3 py-2 text-white"
                  disabled={typesLoading}
                >
                  {typeDefinitions?.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Layer</label>
                <select
                  value={formData.layer}
                  onChange={(e) => setFormData(prev => ({ ...prev, layer: e.target.value }))}
                  className="w-full bg-black/40 border border-[#3B82F6]/30 rounded-lg px-3 py-2 text-white"
                  disabled={layersLoading}
                >
                  {layerDefinitions?.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full bg-black/40 border border-[#3B82F6]/30 rounded-lg px-3 py-2 text-white"
                placeholder="Describe the agent's purpose and functionality..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Capabilities</label>
              {capabilitiesLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-2 text-sm">
                      <div className="w-4 h-4 bg-[#3B82F6]/20 rounded animate-pulse"></div>
                      <div className="h-3 bg-[#3B82F6]/20 rounded w-24 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {capabilities?.map(capability => (
                    <label key={capability.name} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.capabilities.includes(capability.name)}
                        onChange={() => handleCapabilityToggle(capability.name)}
                        className="rounded border-[#3B82F6]/30 bg-black/40 text-[#3B82F6]"
                      />
                      <span className="text-[#9CA3AF]">{capability.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <Button
                type="submit"
                disabled={createAgentMutation.isPending}
                className="bg-[#3B82F6] hover:bg-[#1E40AF] text-white"
              >
                {createAgentMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Agent
                  </>
                )}
              </Button>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AgentFactory() {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const { toast } = useToast();

  // Use ConfigService-driven hooks for layer definitions
  const { layerDefinitions } = useAgentLayerDefinitions();
  
  // Seeding utility for testing
  const { refetch: seedConfigs } = useSeedAgentCRUDConfig();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/agent-templates'],
    refetchInterval: 60000,
  });

  const handleSeedConfigs = async () => {
    try {
      await seedConfigs();
      toast({
        title: "Config Seeded",
        description: "Agent CRUD configurations have been seeded successfully.",
      });
    } catch (error) {
      toast({
        title: "Seeding Failed",
        description: "Failed to seed configurations.",
        variant: "destructive",
      });
    }
  };

  const handleUseTemplate = (template: any) => {
    setSelectedTemplate(template);
    setIsCreateFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsCreateFormOpen(false);
    setSelectedTemplate(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Agent Factory</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="hexaware-glass rounded-lg p-4 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-[#3B82F6]/20 rounded w-3/4"></div>
                <div className="h-3 bg-[#3B82F6]/20 rounded w-full"></div>
                <div className="flex space-x-2">
                  <div className="h-5 bg-[#3B82F6]/20 rounded w-16"></div>
                  <div className="h-5 bg-[#3B82F6]/20 rounded w-20"></div>
                </div>
                <div className="h-8 bg-[#3B82F6]/20 rounded w-24 ml-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Group templates by layer
  const groupedTemplates = (templates as any[])?.reduce((acc, template) => {
    if (!acc[template.layer]) acc[template.layer] = [];
    acc[template.layer].push(template);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-[#3B82F6]/20 rounded-lg">
            <Bot className="w-6 h-6 text-[#60A5FA]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Agent Factory</h2>
            <p className="text-sm text-[#9CA3AF]">Create and deploy new intelligent agents</p>
          </div>
        </div>
        <Button
          onClick={() => setIsCreateFormOpen(true)}
          className="bg-[#3B82F6] hover:bg-[#1E40AF] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Agent
        </Button>
      </div>

      {Object.keys(groupedTemplates).length === 0 ? (
        <div className="text-center py-12">
          <Bot className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Agent Templates Available</h3>
          <p className="text-[#9CA3AF] mb-4">Start by creating your first agent template</p>
          <Button
            onClick={() => setIsCreateFormOpen(true)}
            className="bg-[#3B82F6] hover:bg-[#1E40AF] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Agent
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {layerDefinitions?.map(layerOption => {
            const layerTemplates = groupedTemplates[layerOption.value] || [];
            
            if (layerTemplates.length === 0) return null;
            
            return (
              <div key={layerOption.value}>
                <div className="flex items-center space-x-2 mb-4">
                  <Layers className="w-5 h-5 text-[#60A5FA]" />
                  <h3 className="text-lg font-bold text-[#60A5FA]">{layerOption.label}</h3>
                  <div className="flex-1 h-px bg-[#3B82F6]/30"></div>
                  <span className="text-sm text-[#9CA3AF]">{layerTemplates.length} templates</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {layerTemplates.map((template: any) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onUse={handleUseTemplate}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateAgentForm
        isOpen={isCreateFormOpen}
        onClose={handleCloseForm}
        initialData={selectedTemplate}
      />
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Settings, Activity, Bot, Info, AlertTriangle } from 'lucide-react';

// Tab configuration types
interface TabConfiguration {
  id: number;
  tabKey: string;
  tabName: string;
  tabType: 'command_center' | 'experience_layer' | 'governance' | 'agent_directory' | 'config_registry' | 'meta_brain' | 'integrations';
  icon?: string;
  description?: string;
  order: number;
  isVisible: boolean;
  isActive: boolean;
  personaAccess: string[];
  requiredPermissions?: string[];
  configurationKeys?: string[];
  contentConfig?: Record<string, any>;
  layoutConfig?: Record<string, any>;
  conditionalDisplay?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Form validation schema
const tabConfigSchema = z.object({
  tabKey: z.string().min(1, "Tab key is required").regex(/^[a-z-_]+$/, "Tab key must be lowercase with hyphens or underscores only"),
  tabName: z.string().min(1, "Tab name is required"),
  tabType: z.enum(['command_center', 'experience_layer', 'governance', 'agent_directory', 'config_registry', 'meta_brain', 'integrations']),
  icon: z.string().optional(),
  description: z.string().optional(),
  order: z.number().min(1, "Order must be positive"),
  isVisible: z.boolean(),
  isActive: z.boolean(),
  personaAccess: z.array(z.string()).min(1, "At least one persona must have access"),
  requiredPermissions: z.array(z.string()).optional(),
  configurationKeys: z.array(z.string()).optional(),
});

type TabConfigFormData = z.infer<typeof tabConfigSchema>;

// Available personas and icons
const AVAILABLE_PERSONAS = ['admin', 'rachel', 'john', 'broker', 'underwriter', 'claims_agent'];
const AVAILABLE_ICONS = {
  'Activity': Activity,
  'Bot': Bot,
  'Settings': Settings,
  'Info': Info,
  'AlertTriangle': AlertTriangle,
  'Eye': Eye,
} as const;

export function TabConfigurationManager() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTab, setEditingTab] = useState<TabConfiguration | null>(null);
  const [selectedTabType, setSelectedTabType] = useState<string>('command_center');

  // Fetch tab configurations
  const { data: tabConfigurations = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/tabs', { tabType: selectedTabType }],
    queryFn: async () => {
      const response = await fetch(`/api/tabs?tabType=${selectedTabType}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tab configurations');
      }
      return response.json();
    }
  });

  // Create tab mutation
  const createTabMutation = useMutation({
    mutationFn: async (data: TabConfigFormData) => {
      return apiRequest(`/api/tabs`, 'POST', data);
    },
    onSuccess: () => {
      toast({ title: "Tab created successfully" });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/tabs'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create tab", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update tab mutation
  const updateTabMutation = useMutation({
    mutationFn: async ({ id, ...data }: TabConfigFormData & { id: number }) => {
      return apiRequest(`/api/tabs/${id}`, 'PATCH', data);
    },
    onSuccess: () => {
      toast({ title: "Tab updated successfully" });
      setEditingTab(null);
      queryClient.invalidateQueries({ queryKey: ['/api/tabs'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update tab", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete tab mutation
  const deleteTabMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/tabs/${id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({ title: "Tab deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/tabs'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete tab", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, isVisible }: { id: number; isVisible: boolean }) => {
      return apiRequest(`/api/tabs/${id}`, 'PATCH', { isVisible });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tabs'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update tab visibility", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Reorder tabs mutation
  const reorderTabMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: number; newOrder: number }) => {
      return apiRequest(`/api/tabs/${id}`, 'PATCH', { order: newOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tabs'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to reorder tabs", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const form = useForm<TabConfigFormData>({
    resolver: zodResolver(tabConfigSchema),
    defaultValues: {
      tabKey: '',
      tabName: '',
      tabType: 'command_center',
      icon: 'Activity',
      description: '',
      order: tabConfigurations.length + 1,
      isVisible: true,
      isActive: true,
      personaAccess: ['admin'],
      requiredPermissions: [],
      configurationKeys: [],
    },
  });

  // Reset form when editing tab changes
  useEffect(() => {
    if (editingTab) {
      form.reset({
        tabKey: editingTab.tabKey,
        tabName: editingTab.tabName,
        tabType: editingTab.tabType,
        icon: editingTab.icon || 'Activity',
        description: editingTab.description || '',
        order: editingTab.order,
        isVisible: editingTab.isVisible,
        isActive: editingTab.isActive,
        personaAccess: editingTab.personaAccess,
        requiredPermissions: editingTab.requiredPermissions || [],
        configurationKeys: editingTab.configurationKeys || [],
      });
    } else {
      form.reset({
        tabKey: '',
        tabName: '',
        tabType: selectedTabType as any,
        icon: 'Activity',
        description: '',
        order: tabConfigurations.length + 1,
        isVisible: true,
        isActive: true,
        personaAccess: ['admin'],
        requiredPermissions: [],
        configurationKeys: [],
      });
    }
  }, [editingTab, form, tabConfigurations.length, selectedTabType]);

  const onSubmit = (data: TabConfigFormData) => {
    if (editingTab) {
      updateTabMutation.mutate({ ...data, id: editingTab.id });
    } else {
      createTabMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this tab configuration?')) {
      deleteTabMutation.mutate(id);
    }
  };

  const handleReorder = (id: number, direction: 'up' | 'down') => {
    const currentTab = tabConfigurations.find((tab: TabConfiguration) => tab.id === id);
    if (!currentTab) return;

    const newOrder = direction === 'up' ? currentTab.order - 1 : currentTab.order + 1;
    if (newOrder < 1 || newOrder > tabConfigurations.length) return;

    reorderTabMutation.mutate({ id, newOrder });
  };

  const getIconComponent = (iconName?: string) => {
    if (!iconName || !(iconName in AVAILABLE_ICONS)) return Activity;
    return AVAILABLE_ICONS[iconName as keyof typeof AVAILABLE_ICONS];
  };

  const sortedTabs = [...tabConfigurations].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6" data-testid="tab-configuration-manager">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Tab Configuration Manager
          </CardTitle>
          <div className="flex items-center gap-4">
            <Label htmlFor="tab-type-filter">Filter by Tab Type:</Label>
            <Select 
              value={selectedTabType} 
              onValueChange={setSelectedTabType}
              data-testid="select-tab-type"
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="command_center">Command Center</SelectItem>
                <SelectItem value="experience_layer">Experience Layer</SelectItem>
                <SelectItem value="governance">Governance</SelectItem>
                <SelectItem value="agent_directory">Agent Directory</SelectItem>
                <SelectItem value="config_registry">Config Registry</SelectItem>
                <SelectItem value="meta_brain">Meta Brain</SelectItem>
                <SelectItem value="integrations">Integrations</SelectItem>
              </SelectContent>
            </Select>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-tab">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tab
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTab ? 'Edit Tab Configuration' : 'Create New Tab Configuration'}
                  </DialogTitle>
                </DialogHeader>
                <TabConfigForm 
                  form={form}
                  onSubmit={onSubmit}
                  editingTab={editingTab}
                  isLoading={createTabMutation.isPending || updateTabMutation.isPending}
                  onCancel={() => {
                    setIsCreateDialogOpen(false);
                    setEditingTab(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Tab Configurations List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedTabType.replace('_', ' ').toUpperCase()} Tabs ({sortedTabs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading tab configurations...</div>
          ) : sortedTabs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tab configurations found for {selectedTabType.replace('_', ' ')}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedTabs.map((tab: TabConfiguration, index: number) => {
                const IconComponent = getIconComponent(tab.icon);
                return (
                  <Card key={tab.id} className={`transition-all ${!tab.isVisible ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-5 h-5" />
                            <div>
                              <h3 className="font-medium">{tab.tabName}</h3>
                              <p className="text-sm text-muted-foreground">
                                Key: <code>{tab.tabKey}</code> • Order: {tab.order}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Badge variant={tab.isActive ? 'default' : 'secondary'}>
                              {tab.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant={tab.isVisible ? 'outline' : 'destructive'}>
                              {tab.isVisible ? 'Visible' : 'Hidden'}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Persona Access */}
                          <div className="flex gap-1">
                            {tab.personaAccess.map((persona: string) => (
                              <Badge key={persona} variant="outline" className="text-xs">
                                {persona}
                              </Badge>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReorder(tab.id, 'up')}
                              disabled={index === 0}
                              data-testid={`button-move-up-${tab.id}`}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReorder(tab.id, 'down')}
                              disabled={index === sortedTabs.length - 1}
                              data-testid={`button-move-down-${tab.id}`}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleVisibilityMutation.mutate({ 
                                id: tab.id, 
                                isVisible: !tab.isVisible 
                              })}
                              data-testid={`button-toggle-visibility-${tab.id}`}
                            >
                              {tab.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingTab(tab);
                                setIsCreateDialogOpen(true);
                              }}
                              data-testid={`button-edit-${tab.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(tab.id)}
                              data-testid={`button-delete-${tab.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {tab.description && (
                        <p className="text-sm text-muted-foreground mt-2">{tab.description}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Tab Configuration Form Component
function TabConfigForm({ 
  form, 
  onSubmit, 
  editingTab, 
  isLoading, 
  onCancel 
}: {
  form: any;
  onSubmit: (data: TabConfigFormData) => void;
  editingTab: TabConfiguration | null;
  isLoading: boolean;
  onCancel: () => void;
}) {
  const [personaInput, setPersonaInput] = useState('');
  const [permissionInput, setPermissionInput] = useState('');
  const [configKeyInput, setConfigKeyInput] = useState('');

  const addPersona = () => {
    if (personaInput && !form.getValues().personaAccess.includes(personaInput)) {
      const currentPersonas = form.getValues().personaAccess;
      form.setValue('personaAccess', [...currentPersonas, personaInput]);
      setPersonaInput('');
    }
  };

  const removePersona = (persona: string) => {
    const currentPersonas = form.getValues().personaAccess;
    form.setValue('personaAccess', currentPersonas.filter((p: string) => p !== persona));
  };

  const addPermission = () => {
    if (permissionInput) {
      const current = form.getValues().requiredPermissions || [];
      if (!current.includes(permissionInput)) {
        form.setValue('requiredPermissions', [...current, permissionInput]);
        setPermissionInput('');
      }
    }
  };

  const removePermission = (permission: string) => {
    const current = form.getValues().requiredPermissions || [];
    form.setValue('requiredPermissions', current.filter((p: string) => p !== permission));
  };

  const addConfigKey = () => {
    if (configKeyInput) {
      const current = form.getValues().configurationKeys || [];
      if (!current.includes(configKeyInput)) {
        form.setValue('configurationKeys', [...current, configKeyInput]);
        setConfigKeyInput('');
      }
    }
  };

  const removeConfigKey = (key: string) => {
    const current = form.getValues().configurationKeys || [];
    form.setValue('configurationKeys', current.filter((k: string) => k !== key));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tabKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tab Key</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="overview" data-testid="input-tab-key" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tabName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tab Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Overview" data-testid="input-tab-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tabType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tab Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-tab-type-form">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="command_center">Command Center</SelectItem>
                    <SelectItem value="experience_layer">Experience Layer</SelectItem>
                    <SelectItem value="governance">Governance</SelectItem>
                    <SelectItem value="agent_directory">Agent Directory</SelectItem>
                    <SelectItem value="config_registry">Config Registry</SelectItem>
                    <SelectItem value="meta_brain">Meta Brain</SelectItem>
                    <SelectItem value="integrations">Integrations</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icon</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-icon">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.keys(AVAILABLE_ICONS).map(iconName => (
                      <SelectItem key={iconName} value={iconName}>
                        {iconName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Tab description..." data-testid="input-description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={e => field.onChange(parseInt(e.target.value))}
                    data-testid="input-order"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isVisible"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Visible</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-visible"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Active</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-active"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Persona Access */}
        <div>
          <Label>Persona Access</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Select value={personaInput} onValueChange={setPersonaInput}>
                <SelectTrigger className="flex-1" data-testid="select-add-persona">
                  <SelectValue placeholder="Select persona..." />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_PERSONAS.map(persona => (
                    <SelectItem key={persona} value={persona}>
                      {persona}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addPersona} data-testid="button-add-persona">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.watch('personaAccess')?.map((persona: string) => (
                <Badge key={persona} variant="secondary" className="flex items-center gap-1">
                  {persona}
                  <button 
                    type="button" 
                    onClick={() => removePersona(persona)}
                    className="ml-1 hover:text-destructive"
                    data-testid={`button-remove-persona-${persona}`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} data-testid="button-submit">
            {isLoading ? 'Saving...' : editingTab ? 'Update Tab' : 'Create Tab'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Save,
  X,
  Key,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { ConfigRegistry, InsertConfigRegistry } from '@shared/schema';
import { insertConfigRegistrySchema } from '@shared/schema';

// Form validation schema extending the shared insert schema with UI-only field
const configFormSchema = insertConfigRegistrySchema.extend({
  defaultValueString: z.string().optional(), // String representation for form input
});

type ConfigFormData = z.infer<typeof configFormSchema>;

// Type-safe constants aligned with shared schema definitions
// These match the enums defined in insertConfigRegistrySchema
const CONFIG_TYPES = [
  { value: 'string' as const, label: 'String', description: 'Text value' },
  { value: 'number' as const, label: 'Number', description: 'Numeric value' },
  { value: 'boolean' as const, label: 'Boolean', description: 'True/false value' },
  { value: 'json' as const, label: 'JSON', description: 'Complex object' },
  { value: 'array' as const, label: 'Array', description: 'List of values' }
] as const;

const SCOPE_OPTIONS = [
  { value: 'global' as const, label: 'Global', description: 'System-wide default' },
  { value: 'persona' as const, label: 'Persona', description: 'Per-persona override' },
  { value: 'agent' as const, label: 'Agent', description: 'Agent-specific setting' },
  { value: 'workflow' as const, label: 'Workflow', description: 'Workflow-specific setting' }
] as const;

// Category options - TODO: Make this metadata-driven by fetching from backend or shared enum
const CATEGORY_OPTIONS = [
  'ui', 'business', 'security', 'voice', 'email', 'workflow', 'agent', 'persona', 'integration', 'analytics'
] as const;

export function ConfigRegistryManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ConfigRegistry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      key: '',
      description: '',
      type: 'string',
      scope: 'global',
      category: 'ui',
      defaultValueString: '',
    },
  });

  // Fetch configuration registry entries with proper typing
  const { data: configEntries = [], isLoading } = useQuery<ConfigRegistry[]>({
    queryKey: ['/api/config/registry'],
    refetchInterval: 30000,
  });

  // Create configuration entry mutation
  const createConfigMutation = useMutation({
    mutationFn: async (data: ConfigFormData) => {
      const payload = {
        key: data.key,
        description: data.description,
        type: data.type as 'string' | 'number' | 'boolean' | 'json' | 'array',
        scope: data.scope as 'global' | 'persona' | 'agent' | 'workflow',
        category: data.category,
        defaultValue: parseDefaultValue(data.defaultValueString || '', data.type)
      };
      return await apiRequest('/api/config/registry', 'POST', payload);
    },
    onSuccess: () => {
      toast({
        title: "Configuration Key Created",
        description: "New configuration key has been registered successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/config/registry'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create configuration key.",
        variant: "destructive",
      });
    }
  });

  // Update configuration entry mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: ConfigFormData & { id: number }) => {
      const payload = {
        key: data.key,
        description: data.description,
        type: data.type as 'string' | 'number' | 'boolean' | 'json' | 'array',
        scope: data.scope as 'global' | 'persona' | 'agent' | 'workflow',
        category: data.category,
        defaultValue: parseDefaultValue(data.defaultValueString || '', data.type)
      };
      return await apiRequest(`/api/config/registry/${data.id}`, 'PUT', payload);
    },
    onSuccess: () => {
      toast({
        title: "Configuration Key Updated",
        description: "Configuration key has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/config/registry'] });
      setIsEditDialogOpen(false);
      setSelectedEntry(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update configuration key.",
        variant: "destructive",
      });
    }
  });

  // Delete configuration entry mutation
  const deleteConfigMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/config/registry/${id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Configuration Key Deleted",
        description: "Configuration key has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/config/registry'] });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete configuration key.",
        variant: "destructive",
      });
    }
  });

  const parseDefaultValue = (value: string, type: string): any => {
    if (!value) return null;
    
    try {
      switch (type) {
        case 'number':
          return parseFloat(value);
        case 'boolean':
          return value.toLowerCase() === 'true';
        case 'json':
        case 'array':
          return JSON.parse(value);
        default:
          return value;
      }
    } catch (error) {
      throw new Error(`Invalid ${type} format`);
    }
  };

  const formatDefaultValue = (value: any, type: string): string => {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case 'json':
      case 'array':
        return JSON.stringify(value, null, 2);
      default:
        return String(value);
    }
  };


  const handleEdit = (entry: ConfigRegistry) => {
    setSelectedEntry(entry);
    form.reset({
      key: entry.key,
      description: entry.description,
      type: entry.type as 'string' | 'number' | 'boolean' | 'json' | 'array',
      defaultValueString: formatDefaultValue(entry.defaultValue, entry.type),
      scope: entry.scope as 'global' | 'persona' | 'agent' | 'workflow',
      category: entry.category
    });
    setIsEditDialogOpen(true);
  };

  const handleCreate = () => {
    form.reset();
    setIsCreateDialogOpen(true);
  };

  const handleSubmit = (data: ConfigFormData) => {
    if (selectedEntry) {
      updateConfigMutation.mutate({ ...data, id: selectedEntry.id });
    } else {
      createConfigMutation.mutate(data);
    }
  };

  // Filter entries based on search and filters
  const filteredEntries = configEntries.filter(entry => {
    const matchesSearch = entry.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || entry.category === categoryFilter;
    const matchesScope = scopeFilter === 'all' || entry.scope === scopeFilter;
    return matchesSearch && matchesCategory && matchesScope;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-blue-900">Configuration Registry</h3>
            <p className="text-blue-700">Loading configuration keys...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="bg-blue-50/50 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-blue-200 rounded w-full mb-3"></div>
              <div className="flex space-x-2">
                <div className="h-5 bg-blue-200 rounded w-16"></div>
                <div className="h-5 bg-blue-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-blue-900">Configuration Registry</h3>
          <p className="text-blue-700">Manage configuration key definitions and metadata</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="button-create-config-key"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Config Key
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-blue-50/30 border-blue-200/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-blue-500" />
              <Input
                placeholder="Search keys or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-blue-200"
                data-testid="input-search-config"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-white border-blue-200">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORY_OPTIONS.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={scopeFilter} onValueChange={setScopeFilter}>
              <SelectTrigger className="bg-white border-blue-200">
                <SelectValue placeholder="Filter by scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scopes</SelectItem>
                {SCOPE_OPTIONS.map(scope => (
                  <SelectItem key={scope.value} value={scope.value}>
                    {scope.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2 text-blue-700">
              <Database className="w-4 h-4" />
              <span className="text-sm font-medium">{filteredEntries.length} keys</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Keys Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEntries.map((entry) => (
          <Card key={entry.id} className="hover:shadow-md transition-shadow bg-white border-blue-200/50">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Key className="w-4 h-4 text-blue-600" />
                      <h4 className="font-semibold text-blue-900 text-sm">{entry.key}</h4>
                    </div>
                    <p className="text-xs text-blue-600 mb-2 line-clamp-2">{entry.description}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-blue-100 text-blue-800 border-blue-300"
                  >
                    {entry.type}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-purple-100 text-purple-800 border-purple-300"
                  >
                    {entry.scope}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-emerald-100 text-emerald-800 border-emerald-300"
                  >
                    {entry.category}
                  </Badge>
                </div>

                {entry.defaultValue !== null && (
                  <div className="text-xs text-blue-600">
                    <span className="font-medium">Default:</span> {formatDefaultValue(entry.defaultValue, entry.type).slice(0, 50)}
                    {formatDefaultValue(entry.defaultValue, entry.type).length > 50 && '...'}
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(entry)}
                    className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                    data-testid={`button-edit-${entry.key}`}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteConfigMutation.mutate(entry.id)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    data-testid={`button-delete-${entry.key}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEntries.length === 0 && (
        <div className="text-center py-12">
          <Database className="w-16 h-16 text-blue-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-blue-800 mb-2">No Configuration Keys Found</h3>
          <p className="text-blue-600 mb-4">
            {searchTerm || categoryFilter !== 'all' || scopeFilter !== 'all' 
              ? 'Try adjusting your filters or search terms.'
              : 'Start by creating your first configuration key.'}
          </p>
          <Button 
            onClick={handleCreate} 
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="button-create-first-config"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Config Key
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedEntry(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedEntry ? 'Edit Configuration Key' : 'Create Configuration Key'}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800 font-medium">Configuration Key *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., ui.theme.primaryColor"
                          className="border-blue-200 focus:border-blue-500"
                          disabled={!!selectedEntry}
                          data-testid="input-config-key"
                        />
                      </FormControl>
                      <p className="text-xs text-blue-600">Use dot notation for hierarchical keys</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800 font-medium">Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-blue-200 focus:border-blue-500">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map(category => (
                            <SelectItem key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
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
                    <FormLabel className="text-blue-800 font-medium">Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe what this configuration controls..."
                        className="border-blue-200 focus:border-blue-500 min-h-[80px]"
                        data-testid="textarea-config-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800 font-medium">Data Type *</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('defaultValueString', '');
                      }} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-blue-200 focus:border-blue-500">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CONFIG_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-gray-500">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800 font-medium">Default Scope *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-blue-200 focus:border-blue-500">
                            <SelectValue placeholder="Select scope" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SCOPE_OPTIONS.map(scope => (
                            <SelectItem key={scope.value} value={scope.value}>
                              <div>
                                <div className="font-medium">{scope.label}</div>
                                <div className="text-xs text-gray-500">{scope.description}</div>
                              </div>
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
                name="defaultValueString"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-800 font-medium">Default Value</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={
                          form.watch('type') === 'json' ? '{"key": "value"}' :
                          form.watch('type') === 'array' ? '["item1", "item2"]' :
                          form.watch('type') === 'boolean' ? 'true or false' :
                          form.watch('type') === 'number' ? '42' :
                          'Enter default value...'
                        }
                        className="border-blue-200 focus:border-blue-500 min-h-[80px]"
                        data-testid="textarea-config-default-value"
                      />
                    </FormControl>
                    <p className="text-xs text-blue-600 mt-1">
                      {form.watch('type') === 'json' || form.watch('type') === 'array' 
                        ? 'Enter valid JSON format'
                        : `Enter a valid ${form.watch('type')} value`}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setIsEditDialogOpen(false);
                    setSelectedEntry(null);
                    form.reset();
                  }}
                  className="text-gray-600 border-gray-300"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createConfigMutation.isPending || updateConfigMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-save-config"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {createConfigMutation.isPending || updateConfigMutation.isPending 
                    ? 'Saving...' 
                    : selectedEntry ? 'Update Key' : 'Create Key'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
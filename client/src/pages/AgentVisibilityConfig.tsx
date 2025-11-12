import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Save, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAgentLayerDefinitions } from '@/hooks/useAgentConfig';
import { usePersona } from '@/hooks/usePersona';

interface AgentVisibilityRule {
  maxAgents?: number;
  includeAgents?: string[];
  excludeAgents?: string[];
  filterByKeywords?: string[];
}

interface VisibilityRules {
  [command: string]: {
    [layer: string]: AgentVisibilityRule;
  };
}

// ConfigService-driven approach: All rules and layer definitions come from database
// Following replit.md NO HARD-CODING principle - no hardcoded fallbacks

export function AgentVisibilityConfig() {
  const [selectedCommand, setSelectedCommand] = useState('review_submissions');
  const [newCommand, setNewCommand] = useState('');
  const [editingRules, setEditingRules] = useState<VisibilityRules>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentPersona } = usePersona();

  // ConfigService-driven layer definitions (aligned with Experience Personalization pattern)
  const { layerDefinitions = [], isLoading: layersLoading } = useAgentLayerDefinitions();
  
  // Dedupe layer definitions by canonical key to avoid duplicate tabs
  const uniqueLayerDefinitions = layerDefinitions.reduce((acc, def: any) => {
    const key = def.value;
    if (!acc.has(key)) {
      acc.set(key, def);
    }
    return acc;
  }, new Map());
  
  const deduplicatedLayers = Array.from(uniqueLayerDefinitions.values());

  // ConfigService-driven visibility rules with scope-based precedence
  const { data: currentRules = {}, isLoading: rulesLoading } = useQuery({
    queryKey: ['/api/config/setting/agent-visibility-rules', { persona: currentPersona }],
    queryFn: async () => {
      const url = new URL('/api/config/setting/agent-visibility-rules', window.location.origin);
      if (currentPersona) {
        url.searchParams.set('persona', currentPersona);
      }
      const response = await fetch(url.toString(), {
        credentials: 'include'
      });
      const data = await response.json();
      return data.value || {};
    },
    staleTime: 5 * 60 * 1000, // Align with ConfigService cache TTL
    gcTime: 10 * 60 * 1000,
    retry: 1,
    retryDelay: 1000
  });

  // Fetch available agents for reference
  const { data: allAgents = {} } = useQuery({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const response = await fetch('/api/agents', {
        credentials: 'include'
      });
      return await response.json();
    },
    staleTime: 60000
  });

  // Save visibility rules mutation with scope-based precedence using ConfigService API
  const saveRules = useMutation({
    mutationFn: async (rules: VisibilityRules) => {
      const url = new URL('/api/config/setting/agent-visibility-rules', window.location.origin);
      if (currentPersona) {
        url.searchParams.set('persona', currentPersona);
      }
      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          value: rules,
          scope: currentPersona ? { persona: currentPersona } : {},
          effectiveFrom: new Date().toISOString()
        })
      });
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate with scope-aware keys including persona
      queryClient.invalidateQueries({ queryKey: ['/api/config/setting/agent-visibility-rules', { persona: currentPersona }] });
      queryClient.invalidateQueries({ queryKey: ['/api/config/setting/agent-visibility-rules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hierarchy/config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/config/setting/agent.layer.definitions'] });
      toast({ title: 'Success', description: 'Agent visibility rules updated successfully!' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update visibility rules', variant: 'destructive' });
    }
  });

  // Initialize editing rules from ConfigService only
  useEffect(() => {
    setEditingRules({ ...currentRules });
  }, [currentRules]);

  const commands = Object.keys(editingRules);
  const layers = deduplicatedLayers.map((def: any) => def.value) || [];
  const isLoading = rulesLoading || layersLoading;

  const updateRule = (command: string, layer: string, field: keyof AgentVisibilityRule, value: any) => {
    setEditingRules(prev => ({
      ...prev,
      [command]: {
        ...prev[command],
        [layer]: {
          ...prev[command]?.[layer],
          [field]: value
        }
      }
    }));
  };

  const addCommand = () => {
    if (!newCommand.trim() || layers.length === 0) return;
    const commandKey = newCommand.toLowerCase().replace(/\s+/g, '_');
    
    // Initialize with default rules for each available layer from ConfigService
    const defaultRules: { [layer: string]: AgentVisibilityRule } = {};
    layers.forEach(layer => {
      defaultRules[layer] = { maxAgents: layer === 'interface' ? 2 : 3 };
    });
    
    setEditingRules(prev => ({
      ...prev,
      [commandKey]: defaultRules
    }));
    setSelectedCommand(commandKey);
    setNewCommand('');
  };

  const deleteCommand = (command: string) => {
    setEditingRules(prev => {
      const { [command]: deleted, ...rest } = prev;
      return rest;
    });
    setSelectedCommand(commands[0] || 'default');
  };

  const handleSave = () => {
    saveRules.mutate(editingRules);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center space-y-2">
          <div>Loading agent visibility configuration...</div>
          {layersLoading && <div className="text-sm text-muted-foreground">Loading layer definitions from ConfigService...</div>}
          {rulesLoading && <div className="text-sm text-muted-foreground">Loading visibility rules...</div>}
        </div>
      </div>
    );
  }

  if (layers.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="text-yellow-600">No layer definitions found in ConfigService</div>
          <div className="text-sm text-muted-foreground mt-2">
            Please configure agent layer definitions in the Config Registry first.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6" data-testid="agent-visibility-config">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Agent Visibility Rules</h1>
          <p className="text-muted-foreground mt-2">
            Configure which agents appear in the Universal popup for each command and layer
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saveRules.isPending}
          data-testid="save-rules-button"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveRules.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Command Selection Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Commands</CardTitle>
            <CardDescription>Select a command to configure agent visibility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Add New Command */}
            <div className="flex space-x-2">
              <Input
                placeholder="New command..."
                value={newCommand}
                onChange={(e) => setNewCommand(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCommand()}
                data-testid="new-command-input"
              />
              <Button size="sm" onClick={addCommand} data-testid="add-command-button">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Command List */}
            <div className="space-y-2">
              {commands.map(command => (
                <div key={command} className="flex items-center justify-between">
                  <Button
                    variant={selectedCommand === command ? "default" : "ghost"}
                    className="flex-1 justify-start"
                    onClick={() => setSelectedCommand(command)}
                    data-testid={`command-button-${command}`}
                  >
                    {command.replace(/_/g, ' ')}
                  </Button>
                  {command !== 'default' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteCommand(command)}
                      data-testid={`delete-command-${command}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rules Configuration */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Rules for: {selectedCommand.replace(/_/g, ' ')}
                <Badge variant={selectedCommand === 'default' ? 'secondary' : 'default'}>
                  {selectedCommand === 'default' ? 'Fallback' : 'Command-specific'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Configure agent visibility rules for each layer. These rules control which agents appear in the Universal popup.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={layers[0]} data-testid="layer-tabs">
                <TabsList className={`grid w-full ${
                  layers.length === 1 ? 'grid-cols-1' :
                  layers.length === 2 ? 'grid-cols-2' :
                  layers.length === 3 ? 'grid-cols-3' :
                  layers.length === 4 ? 'grid-cols-4' :
                  layers.length === 5 ? 'grid-cols-5' :
                  'grid-cols-6'
                }`}>
                  {layers.map(layer => (
                    <TabsTrigger key={layer} value={layer} data-testid={`tab-${layer}`}>
                      {layer.replace(/_/g, ' ')}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {layers.map(layer => (
                  <TabsContent key={layer} value={layer} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Max Agents */}
                      <div className="space-y-2">
                        <Label htmlFor={`max-${layer}`}>Maximum Agents</Label>
                        <Input
                          id={`max-${layer}`}
                          type="number"
                          min="1"
                          max="10"
                          value={editingRules[selectedCommand]?.[layer]?.maxAgents || 3}
                          onChange={(e) => updateRule(selectedCommand, layer, 'maxAgents', parseInt(e.target.value))}
                          data-testid={`max-agents-${layer}`}
                        />
                        <p className="text-sm text-muted-foreground">
                          Maximum number of agents to show for this layer
                        </p>
                      </div>

                      {/* Filter Keywords */}
                      <div className="space-y-2">
                        <Label htmlFor={`keywords-${layer}`}>Filter Keywords</Label>
                        <Input
                          id={`keywords-${layer}`}
                          placeholder="pricing, quote, commercial"
                          value={editingRules[selectedCommand]?.[layer]?.filterByKeywords?.join(', ') || ''}
                          onChange={(e) => updateRule(selectedCommand, layer, 'filterByKeywords', 
                            e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
                          data-testid={`keywords-${layer}`}
                        />
                        <p className="text-sm text-muted-foreground">
                          Comma-separated keywords to filter agents by name/description
                        </p>
                      </div>
                    </div>

                    {/* Available Agents for Reference */}
                    <div className="space-y-3">
                      <Label>Available {layer} Layer Agents</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded p-3">
                        {(() => {
                          // Map layer names to API keys
                          const layerKeyMap: { [key: string]: string } = {
                            'Experience': 'experience',
                            'Meta Brain': 'metaBrain', 
                            'Role': 'cognitive',
                            'Cognitive': 'cognitive',
                            'Process': 'process',
                            'System': 'system',
                            'Interface': 'interface'
                          };
                          const apiKey = layerKeyMap[layer] || layer.toLowerCase();
                          const layerAgents = allAgents[apiKey] || [];
                          
                          return (
                            <>
                              {layerAgents.map((agent: any) => (
                                <Badge key={agent.id} variant="outline" className="text-xs">
                                  {agent.name}
                                </Badge>
                              ))}
                              {layerAgents.length === 0 && (
                                <span className="text-sm text-muted-foreground">No agents found</span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="space-y-2">
                      <Label>Rule Preview</Label>
                      <div className="bg-muted p-3 rounded text-sm">
                        <code>
                          {JSON.stringify(editingRules[selectedCommand]?.[layer] || {}, null, 2)}
                        </code>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex space-x-4">
          <Button
            variant="outline"
            onClick={() => setEditingRules({})}
            data-testid="clear-rules-button"
          >
            Clear All Rules
          </Button>
          <Button
            variant="outline"
            onClick={() => setEditingRules({ ...editingRules, ...currentRules })}
            data-testid="revert-changes-button"
          >
            Revert Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
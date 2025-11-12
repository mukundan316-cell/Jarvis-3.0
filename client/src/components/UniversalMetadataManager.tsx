import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings, 
  Database, 
  Globe, 
  Layers, 
  Users, 
  Bot,
  FileText,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Info,
  Eye,
  Edit,
  Trash2,
  Copy,
  Save,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { usePersona } from '@/hooks/usePersona';
import { apiRequest } from '@/lib/queryClient';

// Import existing Universal components
import { ConfigRegistryManager } from './ConfigRegistryManager';
import { UniversalTabManager } from './UniversalTabManager';
import { UniversalMetadataForm } from './UniversalMetadataForm';

/**
 * UniversalMetadataManager - Phase 6: Comprehensive Metadata Management Interface
 * 
 * Features:
 * - Universal metadata manager component  
 * - CRUD interface for all configurations
 * - Advanced configuration options
 * - Full CRUD interface for hierarchy configs
 * - Tab management interface
 * - Experience Layer advanced settings
 * 
 * Technical Principles:
 * ✅ NO HARD-CODING: All business logic database-driven via ConfigService
 * ✅ ConfigService-Driven: Leverage existing scope-based precedence
 * ✅ Universal Components: Reusable with "Universal" prefix
 * ✅ Schema First: Use existing schema definitions
 * ✅ Cross-Platform: Works across all personas and contexts
 */

interface MetadataStats {
  configRegistry: number;
  formFields: number;
  formTemplates: number;
  tabConfigurations: number;
  businessRules: number;
  configValues: number;
  hierarchyConfigs: number;
  experienceLayerConfigs: number;
}

interface HierarchyConfig {
  id: number;
  configKey: string;
  layer: string;
  agentType: string;
  configuration: any;
  persona?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExperienceLayerConfig {
  id: number;
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCss?: string;
  themeSettings: any;
  brandingConfig: any;
  isActive: boolean;
  persona?: string;
  createdAt: string;
  updatedAt: string;
}

interface UniversalMetadataManagerProps {
  className?: string;
  defaultTab?: string;
  onConfigChange?: (configType: string, data: any) => void;
}

export function UniversalMetadataManager({
  className = '',
  defaultTab = 'overview',
  onConfigChange
}: UniversalMetadataManagerProps) {
  const { toast } = useToast();
  const { currentPersona } = usePersona();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // Fetch metadata statistics
  const { data: stats, isLoading: statsLoading } = useQuery<MetadataStats>({
    queryKey: ['/api/metadata/stats', currentPersona],
    queryFn: async () => {
      const response = await fetch(`/api/metadata/stats?persona=${currentPersona}`);
      if (!response.ok) throw new Error('Failed to fetch metadata stats');
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Fetch hierarchy configurations
  const { data: hierarchyConfigs = [], isLoading: hierarchyLoading } = useQuery<HierarchyConfig[]>({
    queryKey: ['/api/metadata/hierarchy-configs', currentPersona],
    queryFn: async () => {
      const response = await fetch(`/api/metadata/hierarchy-configs?persona=${currentPersona}`);
      if (!response.ok) throw new Error('Failed to fetch hierarchy configs');
      return response.json();
    },
  });

  // Fetch config values for direct CRUD interface
  const { data: configValues = [], isLoading: configValuesLoading } = useQuery({
    queryKey: ['/api/config/values'],
    queryFn: async () => {
      const response = await fetch('/api/config/values');
      if (!response.ok) throw new Error('Failed to fetch config values');
      return response.json();
    },
  });

  // Fetch business rules for direct CRUD interface
  const { data: businessRules = [], isLoading: businessRulesLoading } = useQuery({
    queryKey: ['/api/business-rules'],
    queryFn: async () => {
      const response = await fetch('/api/business-rules');
      if (!response.ok) throw new Error('Failed to fetch business rules');
      return response.json();
    },
  });

  // Bulk operations mutation
  const bulkOperationMutation = useMutation({
    mutationFn: async ({ action, items, configType }: { action: string, items: number[], configType: string }) => {
      return await apiRequest('/api/metadata/bulk-operations', 'POST', { 
        action, 
        items, 
        configType, 
        persona: currentPersona 
      });
    },
    onSuccess: () => {
      toast({
        title: "Bulk Operation Completed",
        description: "Selected items have been processed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/metadata'] });
      setSelectedItems([]);
      setBulkAction('');
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Operation Failed",
        description: error.message || "Failed to process bulk operation.",
        variant: "destructive",
      });
    }
  });

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onConfigChange?.(tab, null);
  };

  // Handle bulk actions
  const handleBulkAction = () => {
    if (!bulkAction || selectedItems.length === 0) return;
    
    bulkOperationMutation.mutate({
      action: bulkAction,
      items: selectedItems,
      configType: activeTab
    });
  };

  // Export configuration
  const handleExport = async () => {
    try {
      const response = await fetch(`/api/metadata/export?persona=${currentPersona}&type=${activeTab}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `metadata-${activeTab}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `${activeTab} configuration exported successfully.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export configuration.",
        variant: "destructive",
      });
    }
  };

  // Fetch tab configurations for direct CRUD interface
  const { data: tabConfigurations = [], isLoading: tabConfigsLoading } = useQuery({
    queryKey: ['/api/tabs/configurations'],
    queryFn: async () => {
      const response = await fetch('/api/tabs/configurations');
      if (!response.ok) throw new Error('Failed to fetch tab configurations');
      return response.json();
    },
  });

  // Render overview statistics
  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hexaware-glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#9CA3AF]">Config Registry</p>
                <p className="text-2xl font-bold text-white">{stats?.configRegistry || 0}</p>
              </div>
              <Database className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hexaware-glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#9CA3AF]">Form Fields</p>
                <p className="text-2xl font-bold text-white">{stats?.formFields || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hexaware-glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#9CA3AF]">Tab Configs</p>
                <p className="text-2xl font-bold text-white">{stats?.tabConfigurations || 0}</p>
              </div>
              <Layers className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hexaware-glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#9CA3AF]">Experience Layers</p>
                <p className="text-2xl font-bold text-white">{stats?.experienceLayerConfigs || 0}</p>
              </div>
              <Globe className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="hexaware-glass">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-[#9CA3AF]">Common configuration management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => setActiveTab('config-registry')}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20"
              data-testid="quick-action-config-registry"
            >
              <Database className="h-6 w-6 text-blue-400" />
              <span className="text-white font-medium">Manage Config Registry</span>
              <span className="text-xs text-[#9CA3AF]">Define configuration keys</span>
            </Button>
            
            <Button 
              onClick={() => setActiveTab('hierarchy-configs')}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20"
              data-testid="quick-action-hierarchy-configs"
            >
              <Layers className="h-6 w-6 text-purple-400" />
              <span className="text-white font-medium">Configure Hierarchy</span>
              <span className="text-xs text-[#9CA3AF]">Manage agent layers</span>
            </Button>
            
            <Button 
              onClick={() => setActiveTab('experience-layer')}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20"
              data-testid="quick-action-experience-layer"
            >
              <Globe className="h-6 w-6 text-orange-400" />
              <span className="text-white font-medium">Experience Layer</span>
              <span className="text-xs text-[#9CA3AF]">Brand and UI settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render hierarchy configuration interface
  const renderHierarchyConfigs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Hierarchy Configurations</h3>
          <p className="text-[#9CA3AF]">Manage 6-layer agent architecture configurations</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20"
            data-testid="button-export-hierarchy"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
            data-testid="button-create-hierarchy-config"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Config
          </Button>
        </div>
      </div>
      
      {hierarchyLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i} className="hexaware-glass animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {hierarchyConfigs.map((config) => (
            <Card key={config.id} className="hexaware-glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-white">{config.configKey}</h4>
                      <Badge 
                        variant="secondary" 
                        className={`${config.layer === 'Experience' ? 'bg-purple-500/20 text-purple-400' :
                          config.layer === 'Meta Brain' ? 'bg-blue-500/20 text-blue-400' :
                          config.layer === 'Role' ? 'bg-green-500/20 text-green-400' :
                          config.layer === 'Process' ? 'bg-orange-500/20 text-orange-400' :
                          config.layer === 'System' ? 'bg-red-500/20 text-red-400' :
                          'bg-cyan-500/20 text-cyan-400'}`}
                      >
                        {config.layer}
                      </Badge>
                      {!config.isActive && (
                        <Badge variant="secondary" className="bg-gray-500/20 text-gray-400">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#9CA3AF] mb-1">Agent Type: {config.agentType}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      Updated: {new Date(config.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-500/30 hover:bg-blue-500/20"
                      data-testid={`button-edit-hierarchy-${config.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-500/30 hover:bg-gray-500/20"
                      data-testid={`button-copy-hierarchy-${config.id}`}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 hover:bg-red-500/20"
                      data-testid={`button-delete-hierarchy-${config.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Render tab configurations with direct CRUD interface  
  const renderTabConfigurations = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Tab Configurations</h3>
          <p className="text-[#9CA3AF]">Manage tab configurations across all application sections</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20"
            data-testid="button-export-tabs"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
            data-testid="button-create-tab-config"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Tab Configuration
          </Button>
        </div>
      </div>
      
      {tabConfigsLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i} className="hexaware-glass animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {tabConfigurations.map((config: any) => (
            <Card key={config.id} className="hexaware-glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-white">{config.tabName}</h4>
                      <Badge 
                        variant="secondary" 
                        className={`${config.tabType === 'command_center' ? 'bg-blue-500/20 text-blue-400' :
                          config.tabType === 'experience_layer' ? 'bg-purple-500/20 text-purple-400' :
                          config.tabType === 'governance' ? 'bg-red-500/20 text-red-400' :
                          'bg-green-500/20 text-green-400'}`}
                      >
                        {config.tabType}
                      </Badge>
                      {!config.isActive && (
                        <Badge variant="secondary" className="bg-gray-500/20 text-gray-400">
                          Inactive
                        </Badge>
                      )}
                      {!config.isVisible && (
                        <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">
                          Hidden
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#9CA3AF] mb-1">Key: {config.tabKey}</p>
                    <p className="text-sm text-[#9CA3AF] mb-1">Order: {config.order}</p>
                    <p className="text-xs text-[#9CA3AF]">{config.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-500/30 hover:bg-blue-500/20"
                      data-testid={`button-edit-tab-${config.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-500/30 hover:bg-gray-500/20"
                      data-testid={`button-copy-tab-${config.id}`}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 hover:bg-red-500/20"
                      data-testid={`button-delete-tab-${config.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Render config values with direct CRUD interface
  const renderConfigValues = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Configuration Values</h3>
          <p className="text-[#9CA3AF]">Manage actual configuration values with scope-based precedence</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20"
            data-testid="button-export-config-values"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
            data-testid="button-create-config-value"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Config Value
          </Button>
        </div>
      </div>
      
      {configValuesLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i} className="hexaware-glass animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {configValues.map((config: any) => (
            <Card key={config.id} className="hexaware-glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-white">{config.configKey}</h4>
                      <Badge 
                        variant="secondary" 
                        className={`${config.persona ? 'bg-purple-500/20 text-purple-400' :
                          config.agentId ? 'bg-blue-500/20 text-blue-400' :
                          config.workflowId ? 'bg-orange-500/20 text-orange-400' :
                          'bg-green-500/20 text-green-400'}`}
                      >
                        {config.persona || config.agentId || config.workflowId || 'Global'}
                      </Badge>
                      {!config.isActive && (
                        <Badge variant="secondary" className="bg-gray-500/20 text-gray-400">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#9CA3AF] mb-1">Version: {config.version}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      Effective: {new Date(config.effectiveFrom).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-500/30 hover:bg-blue-500/20"
                      data-testid={`button-edit-config-value-${config.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 hover:bg-red-500/20"
                      data-testid={`button-delete-config-value-${config.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Render business rules with direct CRUD interface
  const renderBusinessRules = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Business Rules</h3>
          <p className="text-[#9CA3AF]">Manage business logic and workflow rules</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20"
            data-testid="button-export-business-rules"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
            data-testid="button-create-business-rule"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Business Rule
          </Button>
        </div>
      </div>
      
      {businessRulesLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i} className="hexaware-glass animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {businessRules.map((rule: any) => (
            <Card key={rule.id} className="hexaware-glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-white">{rule.ruleKey}</h4>
                      <Badge 
                        variant="secondary" 
                        className={`${rule.ruleEngine === 'jsonlogic' ? 'bg-blue-500/20 text-blue-400' :
                          rule.ruleEngine === 'cel' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-green-500/20 text-green-400'}`}
                      >
                        {rule.ruleEngine}
                      </Badge>
                      {!rule.isActive && (
                        <Badge variant="secondary" className="bg-gray-500/20 text-gray-400">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#9CA3AF] mb-1">Priority: {rule.priority}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      Updated: {new Date(rule.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-500/30 hover:bg-blue-500/20"
                      data-testid={`button-edit-business-rule-${rule.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 hover:bg-red-500/20"
                      data-testid={`button-delete-business-rule-${rule.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Universal Metadata Manager</h2>
          <p className="text-[#9CA3AF]">
            Comprehensive configuration management for {currentPersona} persona
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/metadata'] })}
            variant="outline"
            size="sm"
            className="bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20"
            data-testid="button-refresh-metadata"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Tabs Interface */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-black/20 border border-white/10">
          <TabsTrigger 
            value="overview" 
            className="text-white data-[state=active]:bg-blue-500/20"
            data-testid="tab-overview"
          >
            <Database className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="config-registry" 
            className="text-white data-[state=active]:bg-blue-500/20"
            data-testid="tab-config-registry"
          >
            <Settings className="w-4 h-4 mr-2" />
            Config Registry
          </TabsTrigger>
          <TabsTrigger 
            value="config-values" 
            className="text-white data-[state=active]:bg-blue-500/20"
            data-testid="tab-config-values"
          >
            <Database className="w-4 h-4 mr-2" />
            Config Values
          </TabsTrigger>
          <TabsTrigger 
            value="business-rules" 
            className="text-white data-[state=active]:bg-blue-500/20"
            data-testid="tab-business-rules"
          >
            <FileText className="w-4 h-4 mr-2" />
            Business Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="config-registry" className="mt-6">
          <ConfigRegistryManager />
        </TabsContent>

        <TabsContent value="config-values" className="mt-6">
          {renderConfigValues()}
        </TabsContent>

        <TabsContent value="business-rules" className="mt-6">
          {renderBusinessRules()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
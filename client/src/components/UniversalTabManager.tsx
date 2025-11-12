import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Eye, Settings, Info, Activity, Network, Shield, TrendingUp, Database, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Types for tab configuration
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

interface UniversalTabManagerProps {
  tabType: string;
  persona?: string;
  className?: string;
  renderTabContent?: (tabConfig: TabConfiguration) => React.ReactNode;
  onTabChange?: (tabKey: string) => void;
  defaultTab?: string;
}

// Icon mapping for tab configurations
const iconMap = {
  'Bot': Bot,
  'Activity': Activity,
  'Settings': Settings,
  'AlertTriangle': AlertTriangle,
  'Info': Info,
  'Eye': Eye,
  'Network': Network,
  'Shield': Shield,
  'TrendingUp': TrendingUp,
  'Database': Database,
} as const;

export function UniversalTabManager({
  tabType,
  persona = 'admin',
  className = '',
  renderTabContent,
  onTabChange,
  defaultTab
}: UniversalTabManagerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>(defaultTab || '');

  // Fetch tab configurations from API
  const { data: tabConfigurations = [], isLoading, error } = useQuery({
    queryKey: ['/api/tabs/persona', persona, { tabType }],
    queryFn: async () => {
      const response = await fetch(`/api/tabs/persona/${persona}?tabType=${tabType}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tab configurations');
      }
      return response.json();
    }
  });

  // Set default tab when configurations load
  useEffect(() => {
    if (tabConfigurations.length > 0 && !activeTab) {
      const enabledTabs = tabConfigurations.filter((tab: TabConfiguration) => tab.isActive && tab.isVisible);
      if (enabledTabs.length > 0) {
        const defaultTabConfig = enabledTabs.find((tab: TabConfiguration) => tab.tabKey === defaultTab) || enabledTabs[0];
        setActiveTab(defaultTabConfig.tabKey);
      }
    }
  }, [tabConfigurations, activeTab, defaultTab]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
  };

  // Get icon component from string
  const getIconComponent = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  // Filter and sort enabled tabs
  const enabledTabs = tabConfigurations
    .filter((tab: TabConfiguration) => tab.isActive && tab.isVisible)
    .sort((a: TabConfiguration, b: TabConfiguration) => a.order - b.order);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Loading Tabs...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Failed to Load Tabs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Unable to load tab configurations. Please try again.
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            size="sm"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (enabledTabs.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>No Tabs Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No tab configurations are available for the current persona and tab type.
          </p>
          <Badge variant="outline" className="mt-2">
            Persona: {persona} | Type: {tabType}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className} data-testid="universal-tab-manager">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="flex w-full gap-1" data-testid="tabs-list">
          {enabledTabs.map((tab: TabConfiguration) => (
            <TabsTrigger 
              key={tab.tabKey} 
              value={tab.tabKey}
              className="flex items-center gap-2"
              data-testid={`tab-trigger-${tab.tabKey}`}
            >
              {getIconComponent(tab.icon)}
              <span>{tab.tabName}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {enabledTabs.map((tab: TabConfiguration) => (
          <TabsContent 
            key={tab.tabKey} 
            value={tab.tabKey} 
            className="mt-6"
            data-testid={`tab-content-${tab.tabKey}`}
          >
            {renderTabContent ? (
              renderTabContent(tab)
            ) : (
              <DefaultTabContent tab={tab} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// Default tab content component
function DefaultTabContent({ tab }: { tab: TabConfiguration }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {tab.icon && (() => {
            const IconComponent = iconMap[tab.icon as keyof typeof iconMap];
            return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
          })()}
          {tab.tabName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            This is the default content for the {tab.tabName} tab.
          </p>
          
          {tab.contentConfig && (
            <div className="space-y-2">
              <h4 className="font-medium">Content Config:</h4>
              <pre className="bg-muted p-2 rounded text-sm overflow-auto">
                {JSON.stringify(tab.contentConfig, null, 2)}
              </pre>
            </div>
          )}

          {tab.layoutConfig && Object.keys(tab.layoutConfig).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Layout Configuration:</h4>
              <pre className="bg-muted p-2 rounded text-sm overflow-auto">
                {JSON.stringify(tab.layoutConfig, null, 2)}
              </pre>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Tab Key:</span> {tab.tabKey}
            </div>
            <div>
              <span className="font-medium">Type:</span> {tab.tabType}
            </div>
            <div>
              <span className="font-medium">Order:</span> {tab.order}
            </div>
            <div>
              <span className="font-medium">Active:</span> {tab.isActive ? 'Yes' : 'No'}
            </div>
          </div>

          {tab.personaAccess && tab.personaAccess.length > 0 && (
            <div>
              <span className="font-medium">Persona Access:</span>
              <div className="flex gap-1 mt-1">
                {tab.personaAccess.map((p: string) => (
                  <Badge key={p} variant="outline" className="text-xs">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export type { TabConfiguration, UniversalTabManagerProps };
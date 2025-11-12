import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users,
  Database,
  Wifi,
  Shield,
  HardDrive,
  Cpu,
  Activity,
  Bug,
  Wrench,
  MonitorSpeaker
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PersonaRecentActivities } from './PersonaRecentActivities';
import { ViewModeToggle } from '@/components/ViewModeToggle';
import { UniversalBusinessKPISection } from '@/components/UniversalBusinessKPISection';
import { UniversalDashboardMetrics } from '@/components/UniversalDashboardMetrics';
import { UniversalInsightsKPISection } from '@/components/UniversalInsightsKPISection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UserPreferences } from '@shared/schema';
import { BarChart3 } from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  requester: string;
  department: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'pending' | 'resolved';
  category: 'hardware' | 'software' | 'network' | 'security' | 'access';
  createdAt: string;
  description: string;
}

interface SystemHealth {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime?: number;
  lastCheck: string;
}

export function JohnDashboard() {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Query user preferences for view mode (technical vs business)
  const { data: userPreferences } = useQuery<UserPreferences>({
    queryKey: ["/api/auth/user-preferences"],
    retry: false,
  });

  // Extract current view mode from user preferences (default to 'technical')
  const currentViewMode = userPreferences?.viewMode || 'technical';

  // Helper function to render metrics based on view mode
  const renderMetrics = () => {
    if (currentViewMode === 'business') {
      return <UniversalBusinessKPISection persona="john" />;
    }
    return <UniversalDashboardMetrics persona="john" />;
  };

  // Function to add new IT Support activity
  const addITActivity = (activity: string, agentName: string, status: 'success' | 'warning' | 'error' | 'info' = 'success') => {
    if ((window as any).addJohnActivity) {
      (window as any).addJohnActivity({
        activity,
        agentName,
        status
      });
    }
  };

  // Handle Quick Action clicks
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'diagnostics':
        addITActivity('JARVIS system diagnostics completed successfully', 'IT Support Agent', 'success');
        break;
      case 'database':
        addITActivity('Database maintenance and optimization initiated', 'System Monitor Agent', 'info');
        break;
      case 'users':
        addITActivity('User access permissions reviewed and updated', 'IT Support Agent', 'success');
        break;
      case 'security':
        addITActivity('Security scan detected and resolved 3 vulnerabilities', 'Security Agent', 'warning');
        break;
    }
  };

  // Fetch John's IT Support specific data
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/john/tickets'],
    queryFn: async () => {
      return [
        {
          id: 'TICK-2024-001',
          title: 'JARVIS Agent Communication Timeout',
          requester: 'Rachel Thompson',
          department: 'Underwriting',
          priority: 'critical' as const,
          status: 'in-progress' as const,
          category: 'software' as const,
          createdAt: '2025-06-10T09:30:00Z',
          description: 'Meta Brain agents showing intermittent timeouts during risk assessment workflows'
        },
        {
          id: 'TICK-2024-002',
          title: 'Database Connection Pool Exhausted',
          requester: 'System Monitor',
          department: 'IT Operations',
          priority: 'high' as const,
          status: 'open' as const,
          category: 'database' as const,
          createdAt: '2025-06-10T10:15:00Z',
          description: 'PostgreSQL connection pool reaching maximum capacity during peak hours'
        },
        {
          id: 'TICK-2024-003',
          title: 'VPN Access Request - New Employee',
          requester: 'Sarah Mitchell',
          department: 'Claims',
          priority: 'medium' as const,
          status: 'pending' as const,
          category: 'access' as const,
          createdAt: '2025-06-10T08:45:00Z',
          description: 'Need VPN access setup for new claims adjuster starting Monday'
        },
        {
          id: 'TICK-2024-004',
          title: 'Printer Queue Error - 3rd Floor',
          requester: 'Mike Johnson',
          department: 'Administration',
          priority: 'low' as const,
          status: 'open' as const,
          category: 'hardware' as const,
          createdAt: '2025-06-09T16:20:00Z',
          description: 'Print jobs stuck in queue, users unable to print documents'
        },
        {
          id: 'TICK-2024-005',
          title: 'Email Server Performance Degradation',
          requester: 'System Monitor',
          department: 'IT Operations',
          priority: 'high' as const,
          status: 'in-progress' as const,
          category: 'network' as const,
          createdAt: '2025-06-09T14:30:00Z',
          description: 'Exchange server showing slow response times and delayed message delivery'
        }
      ];
    }
  });

  const { data: systemHealth = [], isLoading: healthLoading } = useQuery({
    queryKey: ['/api/john/system-health'],
    queryFn: async () => {
      return [
        {
          component: 'JARVIS Meta Brain',
          status: 'healthy' as const,
          uptime: 99.2,
          responseTime: 184,
          lastCheck: new Date().toISOString()
        },
        {
          component: 'PostgreSQL Database',
          status: 'warning' as const,
          uptime: 98.7,
          responseTime: 256,
          lastCheck: new Date().toISOString()
        },
        {
          component: 'API Gateway',
          status: 'healthy' as const,
          uptime: 99.8,
          responseTime: 92,
          lastCheck: new Date().toISOString()
        },
        {
          component: 'Email Server',
          status: 'warning' as const,
          uptime: 97.1,
          responseTime: 1240,
          lastCheck: new Date().toISOString()
        },
        {
          component: 'File Server',
          status: 'healthy' as const,
          uptime: 99.9,
          responseTime: 45,
          lastCheck: new Date().toISOString()
        },
        {
          component: 'VPN Gateway',
          status: 'healthy' as const,
          uptime: 99.5,
          responseTime: 38,
          lastCheck: new Date().toISOString()
        }
      ];
    }
  });

  const kpiData = {
    openTickets: tickets.filter(t => t.status === 'open').length,
    avgResolutionTime: 4.2,
    systemUptime: 98.9,
    criticalAlerts: tickets.filter(t => t.priority === 'critical').length
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border border-green-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'in-progress': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border border-green-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hardware': return <HardDrive className="w-4 h-4" />;
      case 'software': return <Cpu className="w-4 h-4" />;
      case 'network': return <Wifi className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      case 'access': return <Users className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      default: return <Wrench className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              IT Support Dashboard
            </h1>
            <p className="text-slate-300 mt-2 text-lg">
              Good afternoon, John Stevens • {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center space-x-6">
            {/* View Mode Toggle */}
            <ViewModeToggle currentPersona="john" />
            <div className="text-right bg-slate-800/50 rounded-xl px-6 py-4 border border-slate-700/50 backdrop-blur-sm">
              <div className="text-sm text-slate-400">System Status</div>
              <div className="text-2xl font-bold text-green-400">Operational</div>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-black/20 border border-blue-500/30">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500/20">
              <BarChart3 className="w-4 h-4 mr-2" />
              IT Support Dashboard
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-blue-500/20">
              <Activity className="w-4 h-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Dual-View KPIs */}
            {renderMetrics()}

            <div className="grid grid-cols-1 gap-6">
              {/* Active Tickets */}
              <div className="space-y-6">
                {/* Active Tickets */}
                <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
                  <CardHeader className="bg-slate-800/50 rounded-t-lg border-b border-slate-700/30">
                    <CardTitle className="flex items-center gap-2 text-slate-100 font-semibold">
                      <Bug className="w-5 h-5 text-red-400" />
                      Active Support Tickets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 bg-slate-900/50">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="border border-slate-700/50 rounded-lg p-4 space-y-3 bg-slate-800/30 hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-slate-300">{getCategoryIcon(ticket.category)}</div>
                            <div>
                              <div className="font-medium text-sm text-slate-100">{ticket.title}</div>
                              <div className="text-xs text-slate-400">{ticket.id}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={`${getPriorityColor(ticket.priority)} border-opacity-30`} variant="outline">
                              {ticket.priority}
                            </Badge>
                            <Badge className={`${getStatusColor(ticket.status)} border-opacity-30`} variant="outline">
                              {ticket.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-xs text-slate-300">
                          {ticket.description}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{ticket.requester} • {ticket.department}</span>
                          <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* System Health Monitor */}
                <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
                  <CardHeader className="bg-slate-800/50 rounded-t-lg border-b border-slate-700/30">
                    <CardTitle className="flex items-center gap-2 text-slate-100 font-semibold">
                      <Server className="w-5 h-5 text-green-400" />
                      System Health Monitor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 bg-slate-900/50">
                    {systemHealth.map((system) => (
                      <div key={system.component} className="flex items-center justify-between p-3 border border-slate-700/50 rounded-lg bg-slate-800/30 hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getHealthColor(system.status)}`}>
                            <div className="text-slate-100">{getHealthIcon(system.status)}</div>
                          </div>
                          <div>
                            <div className="font-medium text-sm text-slate-100">{system.component}</div>
                            <div className="text-xs text-slate-400">
                              Uptime: {system.uptime}%
                              {system.responseTime && ` • Response: ${system.responseTime}ms`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`${getHealthColor(system.status)} border-opacity-30`} variant="outline">
                            {system.status}
                          </Badge>
                          <div className="text-xs text-slate-400 mt-1">
                            {formatDistanceToNow(new Date(system.lastCheck), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
                  <CardHeader className="bg-slate-800/50 rounded-t-lg border-b border-slate-700/30">
                    <CardTitle className="flex items-center gap-2 text-slate-100 font-semibold">
                      <Wrench className="w-5 h-5 text-blue-400" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="bg-slate-900/50">
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col gap-2 bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/50 text-slate-100"
                        onClick={() => handleQuickAction('diagnostics')}
                      >
                        <MonitorSpeaker className="w-6 h-6 text-blue-400" />
                        <span className="text-sm">JARVIS Diagnostics</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col gap-2 bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/50 text-slate-100"
                        onClick={() => handleQuickAction('database')}
                      >
                        <Database className="w-6 h-6 text-green-400" />
                        <span className="text-sm">Database Maintenance</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col gap-2 bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/50 text-slate-100"
                        onClick={() => handleQuickAction('users')}
                      >
                        <Users className="w-6 h-6 text-purple-400" />
                        <span className="text-sm">User Management</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col gap-2 bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/50 text-slate-100"
                        onClick={() => handleQuickAction('security')}
                      >
                        <Shield className="w-6 h-6 text-yellow-400" />
                        <span className="text-sm">Security Scan</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* John's Agent Status Section - Using Universal Registry */}
                <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
                  <CardHeader className="bg-slate-800/50 rounded-t-lg border-b border-slate-700/30">
                    <CardTitle className="flex items-center gap-2 text-slate-100 font-semibold">
                      <Users className="w-5 h-5 text-blue-400" />
                      My IT Support Agents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="bg-slate-900/50">
                    <JohnAgentStatus />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Insights Tab - Comprehensive Analytics */}
          <TabsContent value="insights" className="space-y-6">
            <UniversalInsightsKPISection persona="john" viewMode={currentViewMode as 'technical' | 'business'} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// John's Agent Status Component using Universal Registry
function JohnAgentStatus() {
  const { data: agentStatuses, isLoading } = useQuery({
    queryKey: ['/api/jarvis/agents/status', 'john'],
    queryFn: () => fetch('/api/jarvis/agents/status').then(res => res.json()),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p className="text-slate-400">Loading agent status...</p>
      </div>
    );
  }

  if (!agentStatuses || agentStatuses.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-slate-400">No agents assigned to your IT support workflow</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      {agentStatuses.slice(0, 5).map((agent: any) => (
        <div key={agent.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${agent.status === 'active' ? 'bg-green-400' : 'bg-gray-500'}`} />
            <div>
              <p className="text-slate-100 text-sm font-medium">{agent.name}</p>
              <p className="text-slate-400 text-xs">{agent.layer}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-green-400 text-xs">{agent.cpuUsage}% CPU</p>
            <p className="text-blue-400 text-xs">{agent.memoryUsage}% RAM</p>
          </div>
        </div>
      ))}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-500">Database-driven agent filtering active</p>
      </div>
    </div>
  );
}
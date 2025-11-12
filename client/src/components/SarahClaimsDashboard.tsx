import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileCheck, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Building,
  User,
  Users,
  CheckCircle,
  AlertCircle,
  Eye,
  Search,
  Phone,
  Mail,
  Camera,
  Shield,
  BarChart3,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PersonaRecentActivities } from './PersonaRecentActivities';
import { ViewModeToggle } from '@/components/ViewModeToggle';
import { UniversalBusinessKPISection } from '@/components/UniversalBusinessKPISection';
import { UniversalDashboardMetrics } from '@/components/UniversalDashboardMetrics';
import { UniversalInsightsKPISection } from '@/components/UniversalInsightsKPISection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UserPreferences } from '@shared/schema';

interface ClaimsEntry {
  id: string;
  claimNumber: string;
  policyHolder: string;
  dateReported: string;
  status: 'new' | 'investigating' | 'pending-payment' | 'settled' | 'denied';
  claimType: 'property' | 'liability' | 'auto' | 'workers-comp';
  estimatedValue: number;
  adjustorAssigned?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  description: string;
  lastUpdate: string;
  reserveAmount?: number;
  paidAmount?: number;
}

interface InvestigationTask {
  id: string;
  claimId: string;
  taskType: 'site-inspection' | 'document-review' | 'interview' | 'estimate-review';
  assignee: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'urgent' | 'high' | 'medium' | 'low';
}

export function SarahClaimsDashboard() {
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
      return <UniversalBusinessKPISection persona="sarah" />;
    }
    return <UniversalDashboardMetrics persona="sarah" />;
  };

  // Fetch claims data - using real API endpoints that will be created
  const { data: activeClaims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['/api/claims/active'],
    queryFn: () => fetch('/api/claims/active').then(res => res.json()).catch(() => []),
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const { data: investigationTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/claims/investigation-tasks'],
    queryFn: () => fetch('/api/claims/investigation-tasks').then(res => res.json()).catch(() => []),
    refetchInterval: 30000
  });

  // Calculate summary metrics from real data
  const claimsMetrics = {
    newClaims: activeClaims.filter((claim: ClaimsEntry) => claim.status === 'new').length,
    investigating: activeClaims.filter((claim: ClaimsEntry) => claim.status === 'investigating').length,
    pendingPayment: activeClaims.filter((claim: ClaimsEntry) => claim.status === 'pending-payment').length,
    totalReserves: activeClaims.reduce((sum: number, claim: ClaimsEntry) => sum + (claim.reserveAmount || 0), 0),
    totalPaid: activeClaims.reduce((sum: number, claim: ClaimsEntry) => sum + (claim.paidAmount || 0), 0),
    urgentTasks: investigationTasks.filter((task: InvestigationTask) => task.priority === 'urgent' && task.status !== 'completed').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'investigating': return 'bg-yellow-500';
      case 'pending-payment': return 'bg-orange-500';
      case 'settled': return 'bg-green-500';
      case 'denied': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 border-red-500';
      case 'high': return 'text-orange-400 border-orange-500';
      case 'medium': return 'text-yellow-400 border-yellow-500';
      case 'low': return 'text-green-400 border-green-500';
      default: return 'text-gray-400 border-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sarah's Claims Header */}
      <div className="border-b border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-white mb-2">
          Claims Adjustment Center
        </h1>
        <p className="text-gray-300">
          Welcome back, Sarah Geller. Managing claims investigations and settlements.
        </p>
        
        {/* Claims processing status indicator */}
        <div className="mt-2 text-sm text-gray-400">
          {activeClaims.length} active claims • {claimsMetrics.urgentTasks} urgent tasks pending
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-auto grid-cols-3 bg-slate-900/50 border border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="claims" className="data-[state=active]:bg-slate-700">
              <FileCheck className="w-4 h-4 mr-2" />
              Active Claims
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-slate-700">
              <Activity className="w-4 h-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>
          <ViewModeToggle currentPersona="sarah" />
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Claims Overview KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-900/50 border-blue-500/30" data-testid="card-new-claims">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">New Claims</p>
                    <p className="text-2xl font-bold text-white" data-testid="text-new-claims-count">
                      {claimsMetrics.newClaims}
                    </p>
                  </div>
                  <FileCheck className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-yellow-500/30" data-testid="card-investigating-claims">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Investigating</p>
                    <p className="text-2xl font-bold text-white" data-testid="text-investigating-count">
                      {claimsMetrics.investigating}
                    </p>
                  </div>
                  <Search className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-orange-500/30" data-testid="card-pending-payment">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Pending Payment</p>
                    <p className="text-2xl font-bold text-white" data-testid="text-pending-payment-count">
                      {claimsMetrics.pendingPayment}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-green-500/30" data-testid="card-total-reserves">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Reserves</p>
                    <p className="text-2xl font-bold text-white" data-testid="text-total-reserves">
                      £{(claimsMetrics.totalReserves / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Universal Metrics Section */}
          {renderMetrics()}

          {/* Investigation Tasks */}
          <Card className="bg-slate-900/50 border-slate-700" data-testid="card-investigation-tasks">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Urgent Investigation Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {investigationTasks
                  .filter((task: InvestigationTask) => task.priority === 'urgent' && task.status !== 'completed')
                  .slice(0, 5)
                  .map((task: InvestigationTask) => (
                    <div key={task.id} className="p-3 bg-slate-800/50 rounded-lg border border-red-500/20" data-testid={`task-${task.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`capitalize ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                          <span className="text-white text-sm font-medium">{task.taskType.replace('-', ' ')}</span>
                        </div>
                        <Badge 
                          variant={task.status === 'completed' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {task.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-400">Claim ID</p>
                          <p className="text-white">{task.claimId}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Due Date</p>
                          <p className="text-white">{new Date(task.dueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                
                {investigationTasks.filter((task: InvestigationTask) => task.priority === 'urgent' && task.status !== 'completed').length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-400">No urgent investigation tasks at this time</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sarah's Claims Agent Status */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="bg-slate-900/30 border-blue-500/30" data-testid="card-claims-agents">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>My Claims Processing Agents</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SarahAgentStatus />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Active Claims Tab */}
        <TabsContent value="claims" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-700" data-testid="card-active-claims-list">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Active Claims Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeClaims.length > 0 ? activeClaims.map((claim: ClaimsEntry) => (
                  <div key={claim.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-600" data-testid={`claim-${claim.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(claim.status)}`}></div>
                        <span className="text-white font-medium">{claim.claimNumber}</span>
                        <Badge className={`capitalize ${getPriorityColor(claim.priority)}`}>
                          {claim.priority}
                        </Badge>
                      </div>
                      <Badge 
                        variant={claim.status === 'settled' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {claim.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-400">Policy Holder</p>
                        <p className="text-white">{claim.policyHolder}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Claim Type</p>
                        <p className="text-white capitalize">{claim.claimType.replace('-', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Estimated Value</p>
                        <p className="text-white">£{claim.estimatedValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Reserve Amount</p>
                        <p className="text-white">£{(claim.reserveAmount || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="text-sm text-gray-300 mb-3">
                      {claim.description}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-gray-400 text-xs">
                        Reported {formatDistanceToNow(new Date(claim.dateReported))} ago
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs" data-testid={`button-review-${claim.id}`}>
                          <Eye className="w-3 h-3 mr-1" />
                          Review
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs" data-testid={`button-investigate-${claim.id}`}>
                          <Search className="w-3 h-3 mr-1" />
                          Investigate
                        </Button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <FileCheck className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No active claims at this time</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <UniversalInsightsKPISection persona="sarah" viewMode={currentViewMode as 'technical' | 'business'} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sarah's Claims Agent Status Component using Universal Registry
function SarahAgentStatus() {
  const { data: agentStatuses, isLoading } = useQuery({
    queryKey: ['/api/jarvis/agents/status', 'sarah'],
    queryFn: () => fetch('/api/jarvis/agents/status').then(res => res.json()),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-400">Loading agent status...</p>
      </div>
    );
  }

  if (!agentStatuses || agentStatuses.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-400">No agents assigned to your claims workflow</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {agentStatuses.slice(0, 5).map((agent: any) => (
        <div key={agent.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-blue-500/20" data-testid={`agent-status-${agent.id}`}>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${agent.status === 'active' ? 'bg-green-400' : 'bg-gray-500'}`} />
            <div>
              <p className="text-white text-sm font-medium">{agent.name}</p>
              <p className="text-gray-400 text-xs">{agent.layer}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-green-400 text-xs">{agent.cpuUsage}% CPU</p>
            <p className="text-blue-400 text-xs">{agent.activeUsers} users</p>
          </div>
        </div>
      ))}
      <div className="text-center pt-2">
        <p className="text-xs text-gray-500">Database-driven agent filtering active</p>
      </div>
    </div>
  );
}
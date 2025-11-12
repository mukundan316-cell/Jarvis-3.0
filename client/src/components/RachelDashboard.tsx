import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Building,
  User,
  CheckCircle,
  AlertCircle,
  Eye,
  BarChart3,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ViewModeToggle } from '@/components/ViewModeToggle';
import { UniversalBusinessKPISection } from '@/components/UniversalBusinessKPISection';
import { UniversalDashboardMetrics } from '@/components/UniversalDashboardMetrics';
import { UniversalInsightsKPISection } from '@/components/UniversalInsightsKPISection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UserPreferences } from '@shared/schema';

interface Submission {
  id: string;
  submitterName: string;
  broker: string;
  dateSubmitted: string;
  status: 'incomplete' | 'new' | 'under review' | 'approved';
  coverage: number;
  issues?: string[];
  urgency: 'high' | 'medium' | 'low';
}

interface PipelineStatus {
  stage: string;
  count: number;
  color: string;
  percentage: number;
}

export function RachelDashboard() {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  // Update time every minute
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
      return <UniversalBusinessKPISection persona="rachel" />;
    }
    return <UniversalDashboardMetrics persona="rachel" />;
  };

  // Fetch Rachel's AUW specific data from email-driven pipeline
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ['/api/submissions'],
    enabled: true,
    refetchInterval: 5000 // Refresh every 5 seconds to show new email-derived submissions
  });

  // Type-safe submissions array
  const typedSubmissions = (Array.isArray(submissions) ? submissions : []) as any[];

  // Get dynamic metrics from email-driven pipeline
  const { data: dynamicMetrics } = useQuery({
    queryKey: ['/api/dynamic-metrics'],
    enabled: true,
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Calculate real-time KPIs from actual submissions
  const metricsData = dynamicMetrics as any || {};
  const kpiData = {
    quoteToBindRatio: metricsData.quoteToBindRatio || 0,
    avgProcessingTime: metricsData.avgProcessingTime || 0,
    pipelineValue: metricsData.pipelineValue || 0,
    conversionRate: metricsData.conversionRate || 0
  };

  // Calculate pipeline data from real submissions
  const calculatePipelineData = (): PipelineStatus[] => {
    const total = typedSubmissions.length || 1; // Avoid division by zero
    const newCount = typedSubmissions.filter((s: any) => s.status === 'new').length;
    const reviewCount = typedSubmissions.filter((s: any) => s.status === 'under review').length;
    const approvedCount = typedSubmissions.filter((s: any) => s.status === 'approved').length;
    const incompleteCount = typedSubmissions.filter((s: any) => s.status === 'incomplete').length;
    
    return [
      { stage: 'New', count: newCount, color: 'bg-blue-500', percentage: Math.round((newCount / total) * 100) },
      { stage: 'Under Review', count: reviewCount, color: 'bg-yellow-500', percentage: Math.round((reviewCount / total) * 100) },
      { stage: 'Approved', count: approvedCount, color: 'bg-green-500', percentage: Math.round((approvedCount / total) * 100) },
      { stage: 'Incomplete', count: incompleteCount, color: 'bg-red-500', percentage: Math.round((incompleteCount / total) * 100) }
    ];
  };
  const pipelineData = calculatePipelineData();

  // Use real submissions data instead of hardcoded activeSubmissionsData
  const activeSubmissionsData = typedSubmissions.slice(0, 4).map((submission: any) => ({
    id: submission.submissionId || submission.id,
    type: submission.details?.propertyType || 'Property',
    submitter: submission.clientName || submission.submitterName || 'Unknown',
    amount: submission.details?.value ? `$${(submission.details.value / 1000).toFixed(0)}K` : '$0',
    status: submission.status || 'unknown',
    dueDate: submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : 'TBD'
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'incomplete': return 'bg-red-100 text-red-800 border border-red-200';
      case 'new': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'under review': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border border-green-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              AUW Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-1">
              Good afternoon, Rachel Thompson • {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center space-x-6">
            {/* View Mode Toggle */}
            <ViewModeToggle currentPersona="rachel" />
            <div className="text-right">
              <div className="text-sm text-slate-600 dark:text-slate-300">Total Portfolio Value</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ${metricsData.totalPortfolioValue ? (metricsData.totalPortfolioValue / 1000000).toFixed(2) + 'M' : '0.00M'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-black/20 border border-blue-500/30">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500/20">
              <BarChart3 className="w-4 h-4 mr-2" />
              AUW Dashboard
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-blue-500/20">
              <Activity className="w-4 h-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Panel - Active Submissions */}
              <div className="lg:col-span-1">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="w-5 h-5" />
                      Active Submissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {typedSubmissions.slice(0, 7).map((submission: any) => (
                      <div key={submission.id} className="border rounded-lg p-3 space-y-2 bg-white dark:bg-slate-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-500" />
                            <span className="font-medium text-sm">{submission.clientName || submission.submitterName || 'Unknown'}</span>
                            <span className="text-xs text-slate-500">({submission.brokerName || submission.broker || 'Unknown Broker'})</span>
                          </div>
                          {getUrgencyIcon(submission.urgency)}
                        </div>
                        
                        <div className="text-xs text-slate-500">
                          {submission.createdAt || submission.dateSubmitted ? 
                            formatDistanceToNow(new Date(submission.createdAt || submission.dateSubmitted), { addSuffix: true }) : 
                            'Unknown date'
                          }
                        </div>
                        
                        <Badge className={getStatusColor(submission.status)} variant="outline">
                          {submission.status}
                        </Badge>
                        
                        {(submission.missingDocuments?.length > 0 || submission.issues?.length > 0) && (
                          <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                            <span className="font-medium">Issue:</span> {submission.missingDocuments?.[0] || submission.issues?.[0] || 'Documentation required'}
                          </div>
                        )}
                        
                        {(submission.details?.value || submission.coverage) && (
                          <div className="text-xs">
                            <span className="text-slate-500">Coverage:</span> 
                            <span className="font-medium ml-1">${(submission.details?.value || submission.coverage || 0).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - KPIs and Pipeline */}
              <div className="lg:col-span-3 space-y-6">
                {/* Dual-View KPIs */}
                {renderMetrics()}

                {/* Submissions Pipeline Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Submissions Pipeline Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-6 gap-4">
                      {pipelineData.map((stage) => (
                        <div key={stage.stage} className="text-center">
                          <div className={`w-12 h-12 rounded-full ${stage.color} text-white flex items-center justify-center font-bold mx-auto mb-2`}>
                            {stage.count}
                          </div>
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{stage.stage}</div>
                          <div className="text-xs text-slate-500">{stage.percentage}%</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Active Submissions Table */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Active Submissions</CardTitle>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {activeSubmissionsData.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div>
                              <div className="font-medium">{item.id}</div>
                              <div className="text-sm text-slate-500">{item.type}</div>
                            </div>
                            <div>
                              <div className="text-sm">{item.submitter}</div>
                              <div className="text-xs text-slate-500">{item.amount}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="mb-1">
                              {item.status}
                            </Badge>
                            <div className="text-xs text-slate-500">Target Close: {item.dueDate}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Insights Tab - Comprehensive Analytics */}
          <TabsContent value="insights" className="space-y-6">
            <UniversalInsightsKPISection persona="rachel" viewMode={currentViewMode as 'technical' | 'business'} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
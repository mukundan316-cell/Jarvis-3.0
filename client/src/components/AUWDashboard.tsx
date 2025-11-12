import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mic, 
  MicOff, 
  FileText, 
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
  Send,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';
import { InteractionMode } from './InteractionMode';
import { PersonaRecentActivities } from './PersonaRecentActivities';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';

interface Submission {
  id: string;
  submitterName: string;
  broker: string;
  dateSubmitted: string;
  status: 'incomplete' | 'new' | 'under review' | 'approved';
  coverage: number;
  issues?: string[];
  urgency: 'high' | 'medium' | 'low';
  riskLevel?: 'low' | 'high';
  lineRecommendation?: string;
  claimHistory?: string;
  emailProcessingStatus?: string;
  documentCount?: number;
  linesOfBusiness?: string[];
}

export function AUWDashboard() {
  const queryClient = useQueryClient();
  
  // Fetch real broker emails and their processing status
  const { data: brokerEmails = [], isLoading: emailsLoading } = useQuery({
    queryKey: ['/api/emails'],
    queryFn: () => fetch('/api/emails').then(res => res.json()),
    refetchInterval: 10000 // Refetch every 10 seconds for real-time updates
  });

  // Fetch processed submissions from emails
  const { data: realSubmissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ['/api/submissions'],
    queryFn: () => fetch('/api/submissions').then(res => res.json()),
    refetchInterval: 10000
  });

  // Process broker emails into submission format for compatibility
  const processedSubmissions: Submission[] = [
    // Convert real broker emails to submission format
    ...brokerEmails
      .filter((email: any) => ['wtkbrokers.com', 'aombrokers.com', 'acmbrokers.com', 'docbrokers.com'].some(domain => 
        email.fromEmail?.includes(domain)))
      .map((email: any, index: number) => ({
        id: email.submissionId || `EMAIL-${email.id}`,
        submitterName: email.extractedIntentData?.businessDetails?.businessName || email.fromEmail.split('@')[0],
        broker: email.brokerInfo?.brokerName || email.fromEmail.split('@')[1],
        dateSubmitted: email.createdAt,
        status: email.processingStatus === 'completed' ? 'new' : 'incomplete',
        coverage: email.extractedIntentData?.coverageAmounts ? 
          Object.values(email.extractedIntentData.coverageAmounts).reduce((sum: number, val: any) => sum + (parseInt(String(val)) || 0), 0) : 
          0,
        issues: email.processingStatus === 'pending' ? ['Email processing in progress'] :
                email.processingStatus === 'failed' ? ['Email processing failed'] : [],
        urgency: email.priority === 'high' || email.priority === 'urgent' ? 'high' : 
                 email.priority === 'normal' ? 'medium' : 'low',
        emailProcessingStatus: email.processingStatus,
        documentCount: email.attachments?.length || 0,
        linesOfBusiness: email.extractedIntentData?.linesOfBusiness || []
      })),
    // Add real submissions
    ...realSubmissions.map((sub: any) => ({
      id: sub.submissionId || sub.id,
      submitterName: sub.clientName,
      broker: sub.brokerName,
      dateSubmitted: sub.createdAt,
      status: sub.status === 'pending' ? 'new' : sub.status,
      coverage: parseInt(sub.details?.coverage) || 0,
      issues: [],
      urgency: sub.details?.priority === 'high' ? 'high' : 'medium'
    }))
  ];

  // Use only real processed submissions - NO HARDCODED FALLBACK DATA
  const allSubmissions = processedSubmissions;

  // Mutation to auto-process broker emails
  const autoProcessEmailsMutation = useMutation({
    mutationFn: () => fetch('/api/emails/auto-process-broker-emails', { method: 'POST' }).then(res => res.json()),
    onSuccess: (data) => {
      console.log('✅ Auto-processed broker emails:', data);
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
    },
    onError: (error) => {
      console.error('❌ Error auto-processing emails:', error);
    }
  });

  // Command processing now handled by EnhancedDashboard to prevent duplicate popups

  return (
    <div className="space-y-6">
      {/* Rachel's AUW Header */}
      <div className="border-b border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-white mb-2">
          Assistant Underwriter (AUW)
        </h1>
        <p className="text-gray-300">
          Welcome back, Rachael Thompson. Managing underwriting decisions and risk assessments.
        </p>
        
        {/* Email processing status indicator */}
        {brokerEmails.length > 0 && (
          <div className="mt-2 text-sm text-gray-400">
            {brokerEmails.filter((email: any) => ['wtkbrokers.com', 'aombrokers.com', 'acmbrokers.com', 'docbrokers.com'].some(domain => 
              email.fromEmail?.includes(domain))).length} broker emails detected
            {autoProcessEmailsMutation.isPending && " - Processing intelligent agents..."}
          </div>
        )}
      </div>

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 gap-6">
        {/* Submissions Overview */}
        <div className="space-y-6">
          {/* Submissions Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-900/50 border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">New Submissions</p>
                    <p className="text-2xl font-bold text-white">
                      {allSubmissions.filter(s => s.status === 'new').length}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-yellow-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Incomplete</p>
                    <p className="text-2xl font-bold text-white">
                      {allSubmissions.filter(s => s.status === 'incomplete').length}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-green-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Under Review</p>
                    <p className="text-2xl font-bold text-white">
                      {allSubmissions.filter(s => s.status === 'under review').length}
                    </p>
                  </div>
                  <Eye className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Coverage</p>
                    <p className="text-2xl font-bold text-white">
                      £{(allSubmissions.reduce((sum, s) => sum + s.coverage, 0) / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submissions List */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Recent Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allSubmissions.map((submission) => (
                  <div key={submission.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={submission.status === 'new' ? 'default' : 
                                  submission.status === 'incomplete' ? 'destructive' : 
                                  submission.status === 'under review' ? 'secondary' : 'outline'}
                          className="capitalize"
                        >
                          {submission.status}
                        </Badge>
                        <span className="text-white font-medium">{submission.id}</span>
                      </div>
                      <Badge 
                        variant={submission.urgency === 'high' ? 'destructive' : 
                                submission.urgency === 'medium' ? 'secondary' : 'outline'}
                        className="capitalize"
                      >
                        {submission.urgency} Priority
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Submitter</p>
                        <p className="text-white">{submission.submitterName}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Broker</p>
                        <p className="text-white">{submission.broker}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Coverage</p>
                        <p className="text-white">£{submission.coverage.toLocaleString()}</p>
                      </div>
                    </div>

                    {submission.issues && submission.issues.length > 0 && (
                      <div className="mt-3">
                        <p className="text-gray-400 text-sm mb-1">Issues:</p>
                        <div className="flex flex-wrap gap-1">
                          {submission.issues.map((issue, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {issue}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {(submission as any).riskLevel && (
                      <div className="mt-3">
                        <p className="text-gray-400 text-sm">Risk Assessment: 
                          <span className={`ml-2 font-medium ${(submission as any).riskLevel === 'low' ? 'text-green-400' : 'text-red-400'}`}>
                            {(submission as any).riskLevel.toUpperCase()} RISK
                          </span>
                        </p>
                        {(submission as any).lineRecommendation && (
                          <p className="text-blue-400 text-sm">Recommendation: {(submission as any).lineRecommendation}</p>
                        )}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-gray-400 text-xs">
                        Submitted {formatDistanceToNow(new Date(submission.dateSubmitted))} ago
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          Review
                        </Button>
                        {submission.status === 'incomplete' && (
                          <Button size="sm" variant="outline" className="text-xs">
                            <Mail className="w-3 h-3 mr-1" />
                            Request Docs
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rachel's Agent Status Section - Using Universal Registry */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="bg-slate-900/30 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>My Underwriting Agents</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RachelAgentStatus />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Rachel's Agent Status Component using Universal Registry
function RachelAgentStatus() {
  const { data: agentStatuses, isLoading } = useQuery({
    queryKey: ['/api/jarvis/agents/status', 'rachel'],
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
        <p className="text-gray-400">No agents assigned to your underwriting workflow</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {agentStatuses.slice(0, 5).map((agent: any) => (
        <div key={agent.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-blue-500/20">
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
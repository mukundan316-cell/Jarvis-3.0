import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Upload, FileText, Clock, CheckCircle, BarChart3, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CPEmailIntake } from '@/components/commercial-property/CPEmailIntake';
import { apiRequest } from '@/lib/queryClient';
import { ViewModeToggle } from '@/components/ViewModeToggle';
import { UniversalBusinessKPISection } from '@/components/UniversalBusinessKPISection';
import { UniversalDashboardMetrics } from '@/components/UniversalDashboardMetrics';
import { UniversalInsightsKPISection } from '@/components/UniversalInsightsKPISection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UserPreferences } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';

interface BrokerDashboardProps {}

interface DocumentSubmissionData {
  brokerEmail: string;
  insuredBusinessName: string;
  effectiveDate: string;
  coverageLines: string;
  propertyDetails?: string;
  attachments: File[];
}

export function BrokerDashboard({}: BrokerDashboardProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [submissionHistory, setSubmissionHistory] = useState([
    {
      id: '1',
      insuredName: 'Riverside Manufacturing LLC',
      submissionDate: '2024-12-19',
      status: 'processing',
      coverageAmount: '$12,500,000'
    }
  ]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      return <UniversalBusinessKPISection persona="broker" />;
    }
    return <UniversalDashboardMetrics persona="broker" />;
  };

  // Document submission mutation to create email records
  const submitDocumentsMutation = useMutation({
    mutationFn: async (data: DocumentSubmissionData) => {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('brokerEmail', data.brokerEmail);
      formData.append('insuredBusinessName', data.insuredBusinessName);
      formData.append('effectiveDate', data.effectiveDate);
      formData.append('coverageLines', data.coverageLines);
      formData.append('propertyDetails', data.propertyDetails || '');
      
      // Add all attachments with attachment_ prefix to match backend
      data.attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });

      console.log('📤 Submitting broker documents with FormData:', {
        brokerEmail: data.brokerEmail,
        insuredBusinessName: data.insuredBusinessName,
        attachmentCount: data.attachments.length
      });

      // Submit to broker document endpoint that creates email records
      return apiRequest('/api/broker/submit-documents', 'POST', formData);
    },
    onSuccess: (response) => {
      toast({
        title: "Documents Submitted Successfully",
        description: `Your submission has been sent to underwriting for processing. Submission ID: ${response.submissionId}`,
        duration: 6000,
      });

      // Add to submission history
      setSubmissionHistory(prev => [
        {
          id: response.submissionId,
          insuredName: response.insuredBusinessName,
          submissionDate: new Date().toISOString().split('T')[0],
          status: 'processing',
          coverageAmount: response.totalInsuredValue || 'TBD'
        },
        ...prev
      ]);

      // Close upload form
      setShowUploadForm(false);

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    },
    onError: (error) => {
      console.error('Document submission error:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your documents. Please try again.",
        variant: "destructive",
        duration: 6000,
      });
    }
  });

  const handleDocumentSubmission = (data: DocumentSubmissionData) => {
    submitDocumentsMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'under_review': return <FileText className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'under_review': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="bg-gradient-to-br from-slate-800 via-orange-900 to-slate-800 border-orange-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Stateline Insurance Brokers</CardTitle>
                <p className="text-orange-200">Mike Stevens - Commercial Lines Broker Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <ViewModeToggle currentPersona="broker" />
              <Button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                disabled={submitDocumentsMutation.isPending}
              >
                <Upload className="w-4 h-4 mr-2" />
                {showUploadForm ? 'Cancel Upload' : 'Upload Documents'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Document Upload Form */}
      {showUploadForm && (
        <Card className="bg-slate-800 border-orange-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Submit Commercial Property Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CPEmailIntake
              onSubmit={handleDocumentSubmission}
              onCancel={() => setShowUploadForm(false)}
              initialData={{
                brokerEmail: 'mike.stevens@statelinebrokers.com'
              }}
            />
            {submitDocumentsMutation.isPending && (
              <div className="mt-4 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                <p className="text-orange-200 text-sm">Submitting documents and creating email record...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-black/20 border border-orange-500/30">
          <TabsTrigger value="overview" className="data-[state=active]:bg-orange-500/20">
            <BarChart3 className="w-4 h-4 mr-2" />
            Broker Portal
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-orange-500/20">
            <Activity className="w-4 h-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Dual-View KPIs */}
          {renderMetrics()}
          
          {/* Submission History */}
          <Card className="bg-slate-800 border-orange-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Recent Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {submissionHistory.map((submission) => (
                  <div 
                    key={submission.id}
                    className="flex items-center justify-between p-4 bg-slate-700 rounded-lg border border-slate-600"
                  >
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(submission.status)}
                      <div>
                        <h3 className="text-white font-medium">{submission.insuredName}</h3>
                        <p className="text-slate-400 text-sm">
                          Submitted: {new Date(submission.submissionDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-300 text-sm">{submission.coverageAmount}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(submission.status)}`}>
                        {submission.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
                
                {submissionHistory.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No submissions yet. Upload your first commercial property documents above.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-slate-800 border-orange-500/30">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col border-orange-500/30 text-orange-300 hover:bg-orange-500/10"
                  onClick={() => setShowUploadForm(true)}
                >
                  <Upload className="w-6 h-6 mb-2" />
                  New Submission
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col border-orange-500/30 text-orange-300 hover:bg-orange-500/10"
                >
                  <Clock className="w-6 h-6 mb-2" />
                  Check Status
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col border-orange-500/30 text-orange-300 hover:bg-orange-500/10"
                >
                  <FileText className="w-6 h-6 mb-2" />
                  View History
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab - Comprehensive Analytics */}
        <TabsContent value="insights" className="space-y-6">
          <UniversalInsightsKPISection persona="broker" viewMode={currentViewMode as 'technical' | 'business'} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
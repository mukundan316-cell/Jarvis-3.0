import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  Clock, 
  BarChart3, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Play,
  Pause,
  Settings,
  Upload,
  Download,
  Filter,
  ArrowRight,
  FileText,
  Cpu,
  TrendingUp,
  Activity,
  Zap,
  Shield,
  Target,
  Users,
  Globe
} from "lucide-react";

interface DataLayer {
  id: number;
  layerName: string;
  sourceSystem: string;
  dataType: string;
  processingStatus: string;
  recordsProcessed: number;
  recordsTotal: number;
  lastProcessed?: string;
  qualityScore: string;
  errorCount: number;
  config?: any;
}

function DataSourceCard({ source, isActive = false }: { source: any; isActive?: boolean }) {
  return (
    <Card className={`transition-all duration-200 ${isActive ? 'border-blue-500 bg-blue-50' : 'hover:shadow-md'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-600' : 'bg-gray-100'}`}>
              <Database className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
            </div>
            <div>
              <h4 className="font-medium text-sm">{source.name}</h4>
              <p className="text-xs text-gray-500">{source.type}</p>
            </div>
          </div>
          <Badge variant={source.status === 'connected' ? 'default' : 'secondary'}>
            {source.status}
          </Badge>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Records:</span>
            <span className="font-medium">{source.recordCount?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Last Sync:</span>
            <span className="font-medium">{source.lastSync}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TransformationStep({ step, index, isActive = false }: { step: any; index: number; isActive?: boolean }) {
  return (
    <div className={`relative p-4 rounded-lg border-2 transition-all ${
      isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {index + 1}
          </div>
          <span className="font-medium text-sm">{step.name}</span>
        </div>
        <Badge variant={step.status === 'completed' ? 'default' : step.status === 'running' ? 'secondary' : 'outline'}>
          {step.status}
        </Badge>
      </div>
      <p className="text-xs text-gray-600 mb-2">{step.description}</p>
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">Duration: {step.duration}</span>
        <span className="text-gray-500">Quality: {step.qualityScore}%</span>
      </div>
    </div>
  );
}

function QualityMetricCard({ metric }: { metric: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className={`border-2 ${getStatusColor(metric.status)}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm">{metric.name}</h4>
          <Badge variant="outline" className={getStatusColor(metric.status)}>
            {metric.status}
          </Badge>
        </div>
        <div className="text-2xl font-bold mb-1">{metric.value}</div>
        <div className="flex items-center text-xs text-gray-500">
          <TrendingUp className="w-3 h-3 mr-1" />
          <span>{metric.trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function DataPrepLayer() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const { data: layers, isLoading } = useQuery<DataLayer[]>({
    queryKey: ['/api/dataprep/layers'],
    refetchInterval: 15000,
  });

  // Mock data for comprehensive interface
  const dataSources = [
    { name: 'Policy Management System', type: 'Core System', status: 'connected', recordCount: 2456789, lastSync: '2 min ago' },
    { name: 'Claims Database', type: 'Transactional', status: 'connected', recordCount: 987654, lastSync: '5 min ago' },
    { name: 'Customer Portal', type: 'External API', status: 'connected', recordCount: 156432, lastSync: '1 min ago' },
    { name: 'Third-Party Risk Data', type: 'External Feed', status: 'syncing', recordCount: 89234, lastSync: '15 min ago' },
    { name: 'Regulatory Updates', type: 'Compliance Feed', status: 'connected', recordCount: 12567, lastSync: '30 min ago' },
    { name: 'Market Intelligence', type: 'Analytics Feed', status: 'connected', recordCount: 45678, lastSync: '8 min ago' }
  ];

  const transformationSteps = [
    { name: 'Data Ingestion', description: 'Raw data extraction from source systems', status: 'completed', duration: '2.3s', qualityScore: 98 },
    { name: 'Schema Validation', description: 'Validate data structure and types', status: 'completed', duration: '1.1s', qualityScore: 97 },
    { name: 'Data Cleansing', description: 'Remove duplicates and invalid entries', status: 'running', duration: '4.2s', qualityScore: 95 },
    { name: 'Normalization', description: 'Standardize formats and values', status: 'pending', duration: '3.8s', qualityScore: 94 },
    { name: 'Enrichment', description: 'Add derived fields and calculations', status: 'pending', duration: '2.9s', qualityScore: 96 },
    { name: 'Quality Validation', description: 'Final quality checks and scoring', status: 'pending', duration: '1.7s', qualityScore: 98 }
  ];

  const qualityMetrics = [
    { name: 'Data Completeness', value: '94.7%', status: 'excellent', trend: '+2.3% vs last week' },
    { name: 'Data Accuracy', value: '96.2%', status: 'excellent', trend: '+1.8% vs last week' },
    { name: 'Schema Compliance', value: '98.9%', status: 'excellent', trend: '+0.5% vs last week' },
    { name: 'Duplicate Rate', value: '1.2%', status: 'good', trend: '-0.3% vs last week' },
    { name: 'Processing Speed', value: '2.4s', status: 'good', trend: '-0.2s vs last week' },
    { name: 'Error Rate', value: '0.8%', status: 'warning', trend: '+0.1% vs last week' }
  ];

  const processingWorkflows = [
    { name: 'Real-time Claims Processing', status: 'active', throughput: '1,247 records/min', lastRun: '2 min ago' },
    { name: 'Policy Data Synchronization', status: 'active', throughput: '856 records/min', lastRun: '5 min ago' },
    { name: 'Customer Profile Updates', status: 'scheduled', throughput: '432 records/min', lastRun: '15 min ago' },
    { name: 'Risk Assessment Data Prep', status: 'active', throughput: '298 records/min', lastRun: '3 min ago' },
    { name: 'Compliance Report Generation', status: 'completed', throughput: '124 records/min', lastRun: '1 hour ago' }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalRecords = layers?.reduce((sum: number, layer: DataLayer) => sum + (layer.recordsTotal || 0), 0) || 2847564;
  const processedRecords = layers?.reduce((sum: number, layer: DataLayer) => sum + (layer.recordsProcessed || 0), 0) || 2698743;
  const avgQualityScore = layers && layers.length > 0 
    ? (layers.reduce((sum: number, layer: DataLayer) => sum + parseFloat(layer.qualityScore || '0'), 0) / layers.length).toFixed(1)
    : '95.4';
  const activeLayers = layers?.filter((layer: DataLayer) => layer.processingStatus === 'processing' || layer.processingStatus === 'ready').length || 12;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Database className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Data Preparation Layer</h2>
            <p className="text-gray-600">Comprehensive data pipeline and quality management</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Records</p>
                <p className="text-2xl font-bold">{totalRecords.toLocaleString()}</p>
              </div>
              <Database className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Processed</p>
                <p className="text-2xl font-bold">{Math.round((processedRecords / totalRecords) * 100)}%</p>
              </div>
              <Cpu className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Quality Score</p>
                <p className="text-2xl font-bold">{avgQualityScore}%</p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Layers</p>
                <p className="text-2xl font-bold">{activeLayers}</p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pipeline">Data Pipeline</TabsTrigger>
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
          <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        {/* Data Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Data Processing Pipeline</CardTitle>
              <CardDescription>Monitor data transformation steps and processing status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transformationSteps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <TransformationStep step={step} index={index} isActive={step.status === 'running'} />
                    {index < transformationSteps.length - 1 && (
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Processing Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Processing Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Data Cleansing</span>
                    <Badge variant="secondary">Running</Badge>
                  </div>
                  <Progress value={67} className="h-2" />
                  <div className="text-sm text-gray-500">
                    Processing 1,247,891 records • 67% complete • ETA: 3 minutes
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processing Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Throughput:</span>
                    <span className="font-medium">2,456 records/sec</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Error Rate:</span>
                    <span className="font-medium text-green-600">0.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Average Latency:</span>
                    <span className="font-medium">2.4ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Success Rate:</span>
                    <span className="font-medium text-green-600">99.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Data Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dataSources.map((source, index) => (
              <DataSourceCard key={index} source={source} isActive={source.status === 'syncing'} />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Source System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">6/6</div>
                  <div className="text-sm text-gray-500">Connected Sources</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">2.8M</div>
                  <div className="text-sm text-gray-500">Records/Hour</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">98.7%</div>
                  <div className="text-sm text-gray-500">Uptime</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Metrics Tab */}
        <TabsContent value="quality" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {qualityMetrics.map((metric, index) => (
              <QualityMetricCard key={index} metric={metric} />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Data Quality Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border border-dashed rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Quality trend charts would appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <div className="space-y-4">
            {processingWorkflows.map((workflow, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        workflow.status === 'active' ? 'bg-green-100' : 
                        workflow.status === 'scheduled' ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}>
                        <Zap className={`w-5 h-5 ${
                          workflow.status === 'active' ? 'text-green-600' : 
                          workflow.status === 'scheduled' ? 'text-yellow-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium">{workflow.name}</h4>
                        <p className="text-sm text-gray-500">
                          {workflow.throughput} • Last run: {workflow.lastRun}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        workflow.status === 'active' ? 'default' : 
                        workflow.status === 'scheduled' ? 'secondary' : 'outline'
                      }>
                        {workflow.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        {workflow.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
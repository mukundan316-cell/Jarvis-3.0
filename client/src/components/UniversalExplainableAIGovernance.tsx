import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Shield, 
  Brain, 
  Scale, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  FileCheck,
  Users,
  Eye,
  BarChart3,
  Layers,
  Search,
  AlertCircle,
  Target,
  Lightbulb,
  Bell,
  Settings,
  Plus,
  ChevronRight,
  FileText,
  Bot,
  Workflow,
  GitBranch,
  Rocket,
  ArrowRight,
  Network
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import type { RiskAssessment as SchemaRiskAssessment, AuditTrail as SchemaAuditTrail, GovernanceMetric as SchemaGovernanceMetric } from '@shared/schema';

interface ExplainableAIGovernanceProps {
  className?: string;
  agentFilter?: {agentId?: number, agentName?: string} | null;
}

interface RiskAssessment {
  id: number;
  targetName: string;
  riskCategory: string;
  riskLevel: string;
  riskScore: string;
  assessmentDate: string;
  status: string;
  overallRisk: string; // Added missing property from schema
  // Phase 2.1: EU AI Act Compliance Fields
  euAiActCompliance?: string;
  euAiActRiskCategory?: string;
  euAiActRequirements?: string[];
  // Phase 2.1: Decision Reasoning Fields
  decisionReasoning?: string;
  explainabilityScore?: string;
  decisionFactors?: any;
  // Phase 2.1: Enhanced Bias Detection Fields
  biasTestResults?: any;
  fairnessMetrics?: any;
  biasCategories?: string[];
  biasDetectionMethod?: string;
}

interface AuditTrail {
  id: number;
  auditType: string;
  targetName: string;
  auditDate: string;
  status: string;
  complianceScore: string;
  // Phase 2.1: EU AI Act Compliance Tracking
  euAiActAuditType?: string;
  euAiActArticles?: string[];
  euAiActComplianceStatus?: string;
  // Phase 2.1: Decision Reasoning Tracking
  decisionReasoningAudit?: any;
  explainabilityGaps?: string[];
  decisionTraceability?: any;
  // Phase 2.1: Enhanced Bias Detection Tracking
  biasDetectionResults?: any;
  fairnessAuditMetrics?: any;
  biasRemediationPlan?: string;
  biasImpactAssessment?: any;
}

interface GovernanceMetric {
  id: number;
  metricType: string;
  value: string;
  targetValue: string;
  status: string;
  lastUpdated: string;
}

// EU AI Act Risk Categories with descriptions
const EU_AI_ACT_RISK_CATEGORIES = {
  'prohibited': { 
    label: 'Prohibited', 
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    description: 'Systems with unacceptable risk'
  },
  'high-risk': { 
    label: 'High Risk', 
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    description: 'Systems requiring strict compliance measures'
  },
  'limited': { 
    label: 'Limited Risk', 
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    description: 'Systems with transparency obligations'
  },
  'minimal': { 
    label: 'Minimal Risk', 
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    description: 'Systems with minimal regulatory requirements'
  }
};

// Compliance Status Colors
const COMPLIANCE_STATUS_COLORS = {
  'fully-compliant': 'bg-green-500/20 text-green-400 border-green-500/30',
  'partially-compliant': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'non-compliant': 'bg-red-500/20 text-red-400 border-red-500/30',
  'pending': 'bg-blue-500/20 text-blue-400 border-blue-500/30'
};

export function UniversalExplainableAIGovernance({ className, agentFilter }: ExplainableAIGovernanceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRiskCategory, setFilterRiskCategory] = useState('All');
  const [filterCompliance, setFilterCompliance] = useState('All');
  const [activeGovernanceTab, setActiveGovernanceTab] = useState('overview');
  const [biasAlertsEnabled, setBiasAlertsEnabled] = useState(true);
  const { toast } = useToast();

  // Fetch governance data using existing API endpoints
  const { data: riskAssessments, isLoading: riskLoading } = useQuery<RiskAssessment[]>({
    queryKey: ['/api/governance/risk-assessments'],
    staleTime: 2 * 60 * 1000,
  });

  const { data: auditTrails, isLoading: auditLoading } = useQuery<AuditTrail[]>({
    queryKey: ['/api/governance/audit-trails'],
    staleTime: 2 * 60 * 1000,
  });

  const { data: governanceMetrics, isLoading: metricsLoading } = useQuery<GovernanceMetric[]>({
    queryKey: ['/api/governance/metrics'],
    staleTime: 2 * 60 * 1000,
  });

  // Calculate EU AI Act compliance summary
  const complianceSummary = riskAssessments?.reduce((acc, assessment) => {
    const category = assessment.euAiActRiskCategory || 'minimal';
    const compliance = assessment.euAiActCompliance || 'pending';
    
    if (!acc[category]) acc[category] = { total: 0, compliant: 0 };
    acc[category].total++;
    if (compliance === 'fully-compliant') acc[category].compliant++;
    
    return acc;
  }, {} as Record<string, { total: number; compliant: number }>);

  // Calculate explainability metrics
  const explainabilityStats = riskAssessments?.reduce((acc, assessment) => {
    if (assessment.explainabilityScore) {
      const score = parseFloat(assessment.explainabilityScore);
      if (!isNaN(score)) {
        acc.total++;
        acc.sum += score;
        if (score >= 80) acc.high++;
        else if (score >= 60) acc.medium++;
        else acc.low++;
      }
    }
    return acc;
  }, { total: 0, sum: 0, high: 0, medium: 0, low: 0 });

  const avgExplainabilityScore = explainabilityStats?.total ? 
    explainabilityStats.sum / explainabilityStats.total : 0;

  // Calculate bias detection summary with enhanced metrics
  const biasDetectionSummary = riskAssessments?.reduce((acc, assessment) => {
    if (assessment.biasTestResults) {
      acc.total++;
      const biasResults = assessment.biasTestResults;
      if (biasResults.overallBiasScore) {
        const score = parseFloat(biasResults.overallBiasScore);
        if (score < 0.1) acc.low++;
        else if (score < 0.3) acc.medium++;
        else acc.high++;
        
        // Phase 2.3: Track critical alerts
        if (score > 0.4) acc.critical++;
        if (score > 0.3) acc.needsRemediation++;
      }
    }
    return acc;
  }, { total: 0, low: 0, medium: 0, high: 0, critical: 0, needsRemediation: 0 }) || 
  { total: 0, low: 0, medium: 0, high: 0, critical: 0, needsRemediation: 0 };

  // Phase 2.3: Bias alert system
  const highBiasAssessments = riskAssessments?.filter(assessment => {
    if (assessment.biasTestResults?.overallBiasScore) {
      const score = parseFloat(assessment.biasTestResults.overallBiasScore);
      return score > 0.3; // High bias threshold
    }
    return false;
  }) || [];

  // Phase 2.3: Enhanced fairness scoring breakdown
  const fairnessBreakdown = riskAssessments?.reduce((acc, assessment) => {
    if (assessment.fairnessMetrics) {
      const metrics = assessment.fairnessMetrics;
      if (metrics.demographicParity) acc.demographicParity += metrics.demographicParity;
      if (metrics.equalizedOdds) acc.equalizedOdds += metrics.equalizedOdds;
      if (metrics.equalOpportunity) acc.equalOpportunity += metrics.equalOpportunity;
      acc.count++;
    }
    return acc;
  }, { demographicParity: 0, equalizedOdds: 0, equalOpportunity: 0, count: 0 }) || 
  { demographicParity: 0, equalizedOdds: 0, equalOpportunity: 0, count: 0 };

  // Phase 2.3: Generate bias remediation suggestions
  const generateRemediationSuggestions = (assessment: RiskAssessment) => {
    const suggestions = [];
    if (assessment.biasTestResults?.overallBiasScore) {
      const score = parseFloat(assessment.biasTestResults.overallBiasScore);
      
      if (score > 0.3) {
        suggestions.push("Implement data augmentation to balance training dataset");
        suggestions.push("Review feature selection to remove potentially biased variables");
        suggestions.push("Apply fairness constraints during model training");
      }
      
      if (assessment.biasCategories?.includes('gender')) {
        suggestions.push("Conduct gender bias audit with equalized odds metrics");
      }
      
      if (assessment.biasCategories?.includes('age')) {
        suggestions.push("Implement age-aware preprocessing to ensure fair representation");
      }
      
      if (score > 0.4) {
        suggestions.push("URGENT: Suspend model deployment until bias is addressed");
        suggestions.push("Consult with ethics review board for remediation strategy");
      }
    }
    return suggestions;
  };

  // Phase 2.3: Real-time bias alert system
  useEffect(() => {
    if (biasAlertsEnabled && highBiasAssessments.length > 0) {
      highBiasAssessments.forEach(assessment => {
        const score = parseFloat(assessment.biasTestResults?.overallBiasScore || '0');
        if (score > 0.4) {
          toast({
            title: "Critical Bias Alert",
            description: `${assessment.targetName} shows critical bias level (${(score * 100).toFixed(1)}%). Immediate action required.`,
            variant: "destructive",
            duration: 10000,
          });
        } else if (score > 0.3) {
          toast({
            title: "High Bias Warning",
            description: `${assessment.targetName} shows elevated bias risk (${(score * 100).toFixed(1)}%). Review recommended.`,
            duration: 8000,
          });
        }
      });
    }
  }, [highBiasAssessments.length, biasAlertsEnabled, toast]);

  // Filter assessments based on search and filters
  const filteredAssessments = riskAssessments?.filter(assessment => {
    const matchesSearch = !searchQuery || 
      assessment.targetName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRiskCategory = filterRiskCategory === 'All' || 
      assessment.euAiActRiskCategory === filterRiskCategory;
    
    const matchesCompliance = filterCompliance === 'All' || 
      assessment.euAiActCompliance === filterCompliance;
    
    // Phase 2.5: Agent-specific filtering when agentFilter is provided
    const matchesAgent = !agentFilter || 
      assessment.targetName === agentFilter.agentName;
    
    return matchesSearch && matchesRiskCategory && matchesCompliance && matchesAgent;
  });

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">AI Governance & Explainability</h2>
            <p className="text-purple-200">EU AI Act Compliance, Decision Reasoning & Bias Detection</p>
          </div>
        </div>
      </div>

      <Tabs value={activeGovernanceTab} onValueChange={setActiveGovernanceTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-black/20 border border-purple-500/30">
          <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500/20">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="compliance" className="data-[state=active]:bg-purple-500/20">
            <Shield className="w-4 h-4 mr-2" />
            EU AI Act
          </TabsTrigger>
          <TabsTrigger value="explainability" className="data-[state=active]:bg-purple-500/20">
            <Eye className="w-4 h-4 mr-2" />
            Explainability
          </TabsTrigger>
          <TabsTrigger value="bias" className="data-[state=active]:bg-purple-500/20">
            <Scale className="w-4 h-4 mr-2" />
            Bias Detection
          </TabsTrigger>
          <TabsTrigger value="management" className="data-[state=active]:bg-purple-500/20">
            <Settings className="w-4 h-4 mr-2" />
            Management
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Governance Metrics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-200 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  EU AI Act Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {complianceSummary ? 
                    Math.round((Object.values(complianceSummary).reduce((acc, cat) => acc + cat.compliant, 0) / 
                               Object.values(complianceSummary).reduce((acc, cat) => acc + cat.total, 0)) * 100) : 0}%
                </div>
                <p className="text-xs text-purple-300 mt-1">Overall compliance rate</p>
              </CardContent>
            </Card>

            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-200 flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  Explainability Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {avgExplainabilityScore.toFixed(1)}
                </div>
                <p className="text-xs text-purple-300 mt-1">Average explainability</p>
              </CardContent>
            </Card>

            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-200 flex items-center">
                  <Scale className="w-4 h-4 mr-2" />
                  Bias Risk Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {biasDetectionSummary?.total ? 
                    Math.round((biasDetectionSummary.low / biasDetectionSummary.total) * 100) : 0}%
                </div>
                <p className="text-xs text-purple-300 mt-1">Low bias systems</p>
              </CardContent>
            </Card>

            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-200 flex items-center">
                  <FileCheck className="w-4 h-4 mr-2" />
                  Audit Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {auditTrails?.length || 0}
                </div>
                <p className="text-xs text-purple-300 mt-1">Active audit trails</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="bg-black/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Layers className="w-5 h-5 mr-2" />
                Risk Assessment Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search AI systems..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-black/40 border-purple-500/30 text-white"
                      data-testid="input-governance-search"
                    />
                  </div>
                </div>
                <Select value={filterRiskCategory} onValueChange={setFilterRiskCategory}>
                  <SelectTrigger className="w-[180px] bg-black/40 border-purple-500/30 text-white" data-testid="select-risk-category">
                    <SelectValue placeholder="Risk Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    <SelectItem value="prohibited">Prohibited</SelectItem>
                    <SelectItem value="high-risk">High Risk</SelectItem>
                    <SelectItem value="limited">Limited Risk</SelectItem>
                    <SelectItem value="minimal">Minimal Risk</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCompliance} onValueChange={setFilterCompliance}>
                  <SelectTrigger className="w-[180px] bg-black/40 border-purple-500/30 text-white" data-testid="select-compliance-status">
                    <SelectValue placeholder="Compliance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="fully-compliant">Fully Compliant</SelectItem>
                    <SelectItem value="partially-compliant">Partially Compliant</SelectItem>
                    <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Risk Assessments List */}
              <div className="space-y-3">
                {riskLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                    <p className="text-purple-300 mt-2">Loading governance data...</p>
                  </div>
                ) : filteredAssessments?.length ? (
                  filteredAssessments.map((assessment) => (
                    <Card key={assessment.id} className="bg-black/40 border-purple-500/20" data-testid={`card-assessment-${assessment.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-medium text-white" data-testid={`text-assessment-name-${assessment.id}`}>
                                {assessment.targetName}
                              </h4>
                              <Badge 
                                className={EU_AI_ACT_RISK_CATEGORIES[assessment.euAiActRiskCategory as keyof typeof EU_AI_ACT_RISK_CATEGORIES]?.color || 'bg-gray-500/20 text-gray-400'}
                                data-testid={`badge-risk-category-${assessment.id}`}
                              >
                                {EU_AI_ACT_RISK_CATEGORIES[assessment.euAiActRiskCategory as keyof typeof EU_AI_ACT_RISK_CATEGORIES]?.label || assessment.euAiActRiskCategory}
                              </Badge>
                              <Badge 
                                className={COMPLIANCE_STATUS_COLORS[assessment.euAiActCompliance as keyof typeof COMPLIANCE_STATUS_COLORS] || 'bg-gray-500/20 text-gray-400'}
                                data-testid={`badge-compliance-status-${assessment.id}`}
                              >
                                {assessment.euAiActCompliance?.replace('-', ' ') || 'Pending'}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-purple-300">
                              {assessment.explainabilityScore && (
                                <span data-testid={`text-explainability-score-${assessment.id}`}>
                                  Explainability: {assessment.explainabilityScore}%
                                </span>
                              )}
                              {assessment.biasTestResults?.overallBiasScore && (
                                <span data-testid={`text-bias-score-${assessment.id}`}>
                                  Bias Score: {((1 - parseFloat(assessment.biasTestResults.overallBiasScore)) * 100).toFixed(1)}%
                                </span>
                              )}
                              <span className="text-xs" data-testid={`text-assessment-date-${assessment.id}`}>
                                {new Date(assessment.assessmentDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-purple-400 hover:text-purple-300"
                            data-testid={`button-view-details-${assessment.id}`}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                    <p className="text-purple-300">No risk assessments found matching your criteria</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EU AI Act Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <Card className="bg-black/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                EU AI Act Compliance Dashboard
              </CardTitle>
              <CardDescription className="text-purple-300">
                Track compliance with European Union AI Act requirements and risk categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Risk Category Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(EU_AI_ACT_RISK_CATEGORIES).map(([key, category]) => {
                  const categoryData = complianceSummary?.[key] || { total: 0, compliant: 0 };
                  const complianceRate = categoryData.total ? (categoryData.compliant / categoryData.total) * 100 : 0;
                  
                  return (
                    <Card key={key} className="bg-black/40 border-purple-500/20" data-testid={`card-risk-category-${key}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={category.color} data-testid={`badge-category-${key}`}>
                            {category.label}
                          </Badge>
                          <span className="text-white font-medium" data-testid={`text-category-count-${key}`}>
                            {categoryData.total}
                          </span>
                        </div>
                        <p className="text-xs text-purple-300 mb-2">{category.description}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-purple-300">Compliant</span>
                            <span className="text-white" data-testid={`text-compliance-rate-${key}`}>
                              {complianceRate.toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={complianceRate} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Separator className="border-purple-500/30" />

              {/* Recent Compliance Audits */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                  <FileCheck className="w-5 h-5 mr-2" />
                  Recent Compliance Audits
                </h3>
                <div className="space-y-3">
                  {auditTrails?.filter(audit => audit.euAiActAuditType).slice(0, 5).map((audit) => (
                    <Card key={audit.id} className="bg-black/40 border-purple-500/20" data-testid={`card-audit-${audit.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-white" data-testid={`text-audit-target-${audit.id}`}>
                              {audit.targetName}
                            </h4>
                            <div className="flex items-center space-x-3 mt-1 text-sm text-purple-300">
                              <span data-testid={`text-audit-type-${audit.id}`}>
                                {audit.euAiActAuditType?.replace('-', ' ')}
                              </span>
                              <span data-testid={`text-audit-date-${audit.id}`}>
                                {new Date(audit.auditDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              className={COMPLIANCE_STATUS_COLORS[audit.euAiActComplianceStatus as keyof typeof COMPLIANCE_STATUS_COLORS] || 'bg-gray-500/20 text-gray-400'}
                              data-testid={`badge-audit-status-${audit.id}`}
                            >
                              {audit.euAiActComplianceStatus?.replace('-', ' ') || 'Pending'}
                            </Badge>
                            <span className="text-white font-medium" data-testid={`text-audit-score-${audit.id}`}>
                              {audit.complianceScore}%
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )) || (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                      <p className="text-purple-300">No EU AI Act audits found</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Explainability Tab */}
        <TabsContent value="explainability" className="space-y-6">
          <Card className="bg-black/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                AI Decision Explainability
              </CardTitle>
              <CardDescription className="text-purple-300">
                Monitor and improve AI decision reasoning and transparency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Explainability Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-black/40 border-purple-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-purple-300">High Explainability</span>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-white" data-testid="text-high-explainability">
                      {explainabilityStats?.high || 0}
                    </div>
                    <p className="text-xs text-purple-300">Systems ≥80% score</p>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-purple-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-purple-300">Medium Explainability</span>
                      <Clock className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div className="text-2xl font-bold text-white" data-testid="text-medium-explainability">
                      {explainabilityStats?.medium || 0}
                    </div>
                    <p className="text-xs text-purple-300">Systems 60-79% score</p>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-purple-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-purple-300">Low Explainability</span>
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="text-2xl font-bold text-white" data-testid="text-low-explainability">
                      {explainabilityStats?.low || 0}
                    </div>
                    <p className="text-xs text-purple-300">Systems &lt;60% score</p>
                  </CardContent>
                </Card>
              </div>

              <Separator className="border-purple-500/30" />

              {/* Decision Reasoning Examples */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  Recent Decision Explanations
                </h3>
                <div className="space-y-3">
                  {filteredAssessments?.filter(assessment => assessment.decisionReasoning).slice(0, 3).map((assessment) => (
                    <Card key={assessment.id} className="bg-black/40 border-purple-500/20" data-testid={`card-decision-${assessment.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-white" data-testid={`text-decision-system-${assessment.id}`}>
                            {assessment.targetName}
                          </h4>
                          <Badge className="bg-blue-500/20 text-blue-400" data-testid={`badge-explainability-${assessment.id}`}>
                            {assessment.explainabilityScore}% Explainable
                          </Badge>
                        </div>
                        <div className="bg-black/60 rounded-lg p-3 mb-3">
                          <p className="text-sm text-purple-200" data-testid={`text-decision-reasoning-${assessment.id}`}>
                            {assessment.decisionReasoning}
                          </p>
                        </div>
                        {assessment.decisionFactors && (
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(assessment.decisionFactors).slice(0, 3).map(([factor, weight]) => (
                              <Badge 
                                key={factor} 
                                variant="outline" 
                                className="text-xs"
                                data-testid={`badge-factor-${assessment.id}-${factor}`}
                              >
                                {factor}: {typeof weight === 'number' ? (weight * 100).toFixed(0) : String(weight)}%
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )) || (
                    <div className="text-center py-8">
                      <Eye className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                      <p className="text-purple-300">No decision explanations available</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bias Detection Tab */}
        <TabsContent value="bias" className="space-y-6">
          <Card className="bg-black/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Scale className="w-5 h-5 mr-2" />
                Bias Detection & Fairness Analytics
              </CardTitle>
              <CardDescription className="text-purple-300">
                Monitor algorithmic fairness and detect potential biases across AI systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bias Risk Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-black/40 border-purple-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-purple-300">Low Bias Risk</span>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-white" data-testid="text-low-bias">
                      {biasDetectionSummary?.low || 0}
                    </div>
                    <p className="text-xs text-purple-300">Bias score &lt;10%</p>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-purple-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-purple-300">Medium Bias Risk</span>
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div className="text-2xl font-bold text-white" data-testid="text-medium-bias">
                      {biasDetectionSummary?.medium || 0}
                    </div>
                    <p className="text-xs text-purple-300">Bias score 10-30%</p>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-purple-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-purple-300">High Bias Risk</span>
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="text-2xl font-bold text-white" data-testid="text-high-bias">
                      {biasDetectionSummary?.high || 0}
                    </div>
                    <p className="text-xs text-purple-300">Bias score &gt;30%</p>
                  </CardContent>
                </Card>
              </div>

              <Separator className="border-purple-500/30" />

              {/* Phase 2.3: Bias Remediation Overview */}
              {biasDetectionSummary.needsRemediation > 0 && (
                <Card className="bg-black/40 border-orange-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Bias Remediation Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-purple-300">Systems Needing Action</span>
                          <span className="text-white font-medium" data-testid="text-remediation-count">
                            {biasDetectionSummary.needsRemediation}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-purple-300">Critical Priority</span>
                          <span className="text-red-400 font-medium" data-testid="text-critical-count">
                            {biasDetectionSummary.critical}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-purple-300">Common Remediation Actions:</div>
                        <ul className="text-xs text-purple-200 space-y-1">
                          <li>• Dataset rebalancing</li>
                          <li>• Feature selection review</li>
                          <li>• Fairness constraint implementation</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator className="border-purple-500/30" />

              {/* Bias Test Results */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Recent Bias Assessments
                </h3>
                <div className="space-y-3">
                  {filteredAssessments?.filter(assessment => assessment.biasTestResults).slice(0, 4).map((assessment) => {
                    const biasScore = assessment.biasTestResults?.overallBiasScore ? 
                      parseFloat(assessment.biasTestResults.overallBiasScore) : 0;
                    const fairnessScore = (1 - biasScore) * 100;
                    
                    return (
                      <Card key={assessment.id} className="bg-black/40 border-purple-500/20" data-testid={`card-bias-${assessment.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-white" data-testid={`text-bias-system-${assessment.id}`}>
                                {assessment.targetName}
                              </h4>
                              <p className="text-sm text-purple-300" data-testid={`text-bias-method-${assessment.id}`}>
                                Method: {assessment.biasDetectionMethod || 'Statistical Analysis'}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-white" data-testid={`text-fairness-score-${assessment.id}`}>
                                {fairnessScore.toFixed(1)}%
                              </div>
                              <p className="text-xs text-purple-300">Fairness Score</p>
                            </div>
                          </div>
                          
                          {assessment.biasCategories && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {assessment.biasCategories.map((category, index) => (
                                <Badge 
                                  key={index} 
                                  variant="outline"
                                  className="text-xs"
                                  data-testid={`badge-bias-category-${assessment.id}-${index}`}
                                >
                                  {category}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-purple-300">Bias Risk Level</span>
                              <span className={`font-medium ${
                                biasScore < 0.1 ? 'text-green-400' : 
                                biasScore < 0.3 ? 'text-yellow-400' : 'text-red-400'
                              }`} data-testid={`text-bias-level-${assessment.id}`}>
                                {biasScore < 0.1 ? 'Low' : biasScore < 0.3 ? 'Medium' : 'High'}
                              </span>
                            </div>
                            <Progress 
                              value={fairnessScore} 
                              className="h-2"
                            />
                          </div>

                          {/* Phase 2.3: Bias Remediation Suggestions */}
                          {biasScore > 0.3 && (
                            <div className="mt-4 p-3 bg-black/60 rounded-lg border border-orange-500/30">
                              <div className="flex items-center space-x-2 mb-2">
                                <Lightbulb className="w-4 h-4 text-orange-400" />
                                <span className="text-sm font-medium text-orange-300">Remediation Suggestions</span>
                              </div>
                              <div className="space-y-1">
                                {generateRemediationSuggestions(assessment).slice(0, 3).map((suggestion, index) => (
                                  <div key={index} className="text-xs text-purple-200 flex items-start space-x-2">
                                    <span className="text-orange-400 mt-0.5">•</span>
                                    <span data-testid={`text-suggestion-${assessment.id}-${index}`}>{suggestion}</span>
                                  </div>
                                ))}
                              </div>
                              {biasScore > 0.4 && (
                                <Alert className="mt-2 border-red-500/50 bg-red-500/10 py-2" data-testid={`alert-critical-bias-${assessment.id}`}>
                                  <AlertTriangle className="h-3 w-3 text-red-400" />
                                  <AlertDescription className="text-red-200 text-xs">
                                    Critical bias level detected. Immediate review required.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  }) || (
                    <div className="text-center py-8">
                      <Scale className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                      <p className="text-purple-300">No bias assessments available</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Management Tab - Restoring Original Audit Trail and Management Features */}
        <TabsContent value="management" className="space-y-6">
          {/* Governance Management Dashboard */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Risk Assessment Management */}
            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <CardTitle className="text-lg text-white">Risk Assessments</CardTitle>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    data-testid="button-create-risk-assessment"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New Assessment
                  </Button>
                </div>
                <CardDescription className="text-purple-300">Monitor and assess risks across all AI agents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {filteredAssessments?.slice(0, 3).map((assessment) => {
                    const getRiskColor = (risk: string) => {
                      switch(risk?.toLowerCase()) {
                        case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
                        case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                        case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
                        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
                      }
                    };
                    
                    const getDescription = (assessment: any) => {
                      if (assessment.targetName.includes('Claims')) return 'Claims processing risk assessment and bias monitoring';
                      if (assessment.targetName.includes('Underwriter') || assessment.targetName.includes('UW')) return 'High-risk AI Act compliance review';
                      if (assessment.targetName.includes('API') || assessment.targetName.includes('Interface')) return 'Interface security and minimal risk evaluation';
                      if (assessment.targetName.includes('Database') || assessment.targetName.includes('System')) return 'System compliance verification';
                      if (assessment.targetName.includes('Customer')) return 'Customer-facing AI bias and fairness review';
                      return 'Routine compliance and risk assessment';
                    };
                    
                    // Use correct TypeScript property name from schema
                    const overallRisk = assessment.overallRisk;
                    
                    return (
                      <div key={assessment.id} className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-purple-500/20">
                        <div className="flex items-center space-x-3">
                          <Badge className={getRiskColor(overallRisk)}>
                            {overallRisk?.charAt(0).toUpperCase() + overallRisk?.slice(1)}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium text-white">{assessment.targetName}</p>
                            <p className="text-xs text-purple-300">{getDescription(assessment)}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" data-testid={`button-view-risk-assessment-${assessment.id}`} className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  }) || (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                      <p className="text-purple-300">No risk assessments available</p>
                    </div>
                  )}
                </div>
                
                <div className="pt-3 border-t border-purple-500/20">
                  <Button variant="outline" className="w-full text-orange-400 border-orange-500/30 hover:bg-orange-900/20" data-testid="button-view-all-assessments">
                    View All Risk Assessments
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Audit Trail Management */}
            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <CardTitle className="text-lg text-white">Audit Trails</CardTitle>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-create-audit-trail"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New Audit
                  </Button>
                </div>
                <CardDescription className="text-purple-300">Track compliance and governance activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {auditTrails?.slice(0, 3).map((audit: any) => (
                    <div key={audit.id} className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-purple-500/20">
                      <div className="flex items-center space-x-3">
                        <Badge className={
                          audit.status === 'passed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          audit.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }>
                          {audit.status === 'passed' ? 'Passed' : 
                           audit.status === 'pending' ? 'Review' : 'Scheduled'}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium text-white">{audit.auditType?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
                          <p className="text-xs text-purple-300">
                            {audit.status === 'passed' ? 'Completed 2 hours ago' :
                             audit.status === 'pending' ? 'In progress' : 'Due in 3 days'}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" data-testid="button-view-audit-trail" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  )) || (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                      <p className="text-purple-300">No audit trails available</p>
                    </div>
                  )}
                </div>
                
                <div className="pt-3 border-t border-purple-500/20">
                  <Button variant="outline" className="w-full text-blue-400 border-blue-500/30 hover:bg-blue-900/20" data-testid="button-view-all-audits">
                    View All Audit Trails
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Additional Management Components */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* AI Models Registry */}
            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-purple-500" />
                    <CardTitle className="text-lg text-white">AI Models Registry</CardTitle>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    data-testid="button-register-model"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Register Model
                  </Button>
                </div>
                <CardDescription className="text-purple-300">Manage and track AI model deployments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {filteredAssessments?.slice(0, 4).map((assessment) => {
                    const getModelInfo = (targetName: string) => {
                      if (targetName.includes('Claims Processing')) return { name: 'GPT-4o (Claims Processing)', version: 'v1.2.3 • Production', status: 'Active' };
                      if (targetName.includes('Policy Underwriter') || targetName.includes('UW Co-Pilot')) return { name: 'Claude-3.5 (Underwriting)', version: 'v2.1.0 • Production', status: 'Active' };
                      if (targetName.includes('Customer Service')) return { name: 'GPT-4o-mini (Customer Support)', version: 'v1.0.8 • Production', status: 'Active' };
                      if (targetName.includes('Commercial Property')) return { name: 'Mixtral-8x7B (Property Analysis)', version: 'v0.9.2 • Staging', status: 'Testing' };
                      if (targetName.includes('API Interface')) return { name: 'Rule Engine (API Gateway)', version: 'v3.2.1 • Production', status: 'Active' };
                      return { name: 'GPT-4o (General)', version: 'v1.1.5 • Production', status: 'Active' };
                    };
                    
                    const modelInfo = getModelInfo(assessment.targetName);
                    const statusColor = modelInfo.status === 'Active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                    
                    return (
                      <div key={assessment.id} className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-purple-500/20">
                        <div className="flex items-center space-x-3">
                          <Badge className={statusColor}>{modelInfo.status}</Badge>
                          <div>
                            <p className="text-sm font-medium text-white">{modelInfo.name}</p>
                            <p className="text-xs text-purple-300">{modelInfo.version}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" data-testid={`button-view-model-${assessment.id}`} className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  }) || (
                    <div className="text-center py-8">
                      <Bot className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                      <p className="text-purple-300">No AI models registered</p>
                    </div>
                  )}
                </div>
                
                <div className="pt-3 border-t border-purple-500/20">
                  <Button variant="outline" className="w-full text-purple-400 border-purple-500/30 hover:bg-purple-900/20" data-testid="button-view-all-models">
                    Manage All Models
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Governance Health Metrics */}
            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <CardTitle className="text-lg text-white">Governance Metrics</CardTitle>
                </div>
                <CardDescription className="text-purple-300">Real-time governance health indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-300">Compliance Rate</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-purple-900/20 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{width: '89%'}}></div>
                      </div>
                      <span className="text-sm font-medium text-green-400">89%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-300">Risk Mitigation</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-purple-900/20 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{width: '76%'}}></div>
                      </div>
                      <span className="text-sm font-medium text-yellow-400">76%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-300">Audit Coverage</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-purple-900/20 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{width: '94%'}}></div>
                      </div>
                      <span className="text-sm font-medium text-blue-400">94%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-300">Model Reliability</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-purple-900/20 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{width: '87%'}}></div>
                      </div>
                      <span className="text-sm font-medium text-purple-400">87%</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-purple-500/20">
                  <Button variant="outline" className="w-full text-green-400 border-green-500/30 hover:bg-green-900/20" data-testid="button-view-metrics-dashboard">
                    View Metrics Dashboard
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Agent Lifecycle Management Section */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Workflow className="w-5 h-5 text-cyan-500" />
                    <CardTitle className="text-lg text-white">Agent Lifecycle Management</CardTitle>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    data-testid="button-create-agent"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create Agent
                  </Button>
                </div>
                <CardDescription className="text-purple-300">Monitor agent maturity stages, dependencies, and lifecycle progression</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Maturity Stage Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {[
                    { stage: 'Prototype', count: 3, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/30', icon: Lightbulb },
                    { stage: 'Development', count: 8, color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30', icon: Settings },
                    { stage: 'Testing', count: 5, color: 'text-orange-400', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/30', icon: CheckCircle },
                    { stage: 'Production', count: 12, color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30', icon: Rocket }
                  ].map(({ stage, count, color, bgColor, borderColor, icon: Icon }) => (
                    <div key={stage} className={`p-4 rounded-lg border ${bgColor} ${borderColor}`}>
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-5 h-5 ${color}`} />
                        <span className={`text-2xl font-bold ${color}`}>{count}</span>
                      </div>
                      <h4 className="text-white font-medium text-sm">{stage}</h4>
                      <p className="text-xs text-purple-300">agents in {stage.toLowerCase()}</p>
                    </div>
                  ))}
                </div>
                
                {/* Recent Lifecycle Activities */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">Recent Lifecycle Activities</h4>
                    <Button variant="outline" size="sm" className="text-cyan-400 border-cyan-500/30" data-testid="button-view-all-activities">
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      {
                        id: 1,
                        agent: 'Claims Processing AI',
                        activity: 'Promoted to Production',
                        stage: 'production',
                        time: '2 hours ago',
                        details: 'Successfully completed testing phase with 95% test coverage'
                      },
                      {
                        id: 2,
                        agent: 'Customer Support Bot',
                        activity: 'Resource Projection Updated',
                        stage: 'development',
                        time: '4 hours ago',
                        details: 'CPU usage projection increased to 35% based on load testing'
                      },
                      {
                        id: 3,
                        agent: 'Risk Assessment Engine',
                        activity: 'Dependency Added',
                        stage: 'testing',
                        time: '6 hours ago',
                        details: 'Added dependency on External Credit API for enhanced risk scoring'
                      },
                      {
                        id: 4,
                        agent: 'Document Parser',
                        activity: 'Governance Rule Applied',
                        stage: 'development',
                        time: '1 day ago',
                        details: 'Applied new data retention policy: 90 days for processed documents'
                      }
                    ].map((activity) => {
                      const getStageColor = (stage: string) => {
                        switch(stage) {
                          case 'prototype': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                          case 'development': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                          case 'testing': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
                          case 'production': return 'bg-green-500/20 text-green-400 border-green-500/30';
                          default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
                        }
                      };
                      
                      const getActivityIcon = (activity: string) => {
                        if (activity.includes('Promoted')) return <ArrowRight className="w-4 h-4 text-green-400" />;
                        if (activity.includes('Resource')) return <BarChart3 className="w-4 h-4 text-blue-400" />;
                        if (activity.includes('Dependency')) return <Network className="w-4 h-4 text-purple-400" />;
                        if (activity.includes('Governance')) return <Shield className="w-4 h-4 text-yellow-400" />;
                        return <Bell className="w-4 h-4 text-cyan-400" />;
                      };
                      
                      return (
                        <div key={activity.id} className="flex items-start space-x-4 p-3 bg-black/40 rounded-lg border border-purple-500/20">
                          <div className="flex-shrink-0 mt-1">
                            {getActivityIcon(activity.activity)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-white truncate">{activity.agent}</p>
                              <span className="text-xs text-purple-400">{activity.time}</span>
                            </div>
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={getStageColor(activity.stage)} data-testid={`badge-stage-${activity.id}`}>
                                {activity.stage.charAt(0).toUpperCase() + activity.stage.slice(1)}
                              </Badge>
                              <span className="text-sm text-cyan-400">{activity.activity}</span>
                            </div>
                            <p className="text-xs text-purple-300">{activity.details}</p>
                          </div>
                          <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10" data-testid={`button-view-activity-${activity.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Quick Actions & Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4 border-t border-purple-500/20">
                  {/* Lifecycle Progression */}
                  <div className="space-y-2">
                    <h5 className="text-white font-medium text-sm">Lifecycle Progression</h5>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-purple-300">Ready for Testing</span>
                        <span className="text-cyan-400 font-medium">3 agents</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-purple-300">Pending Deployment</span>
                        <span className="text-green-400 font-medium">2 agents</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-purple-300">Needs Review</span>
                        <span className="text-yellow-400 font-medium">1 agent</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Resource Utilization */}
                  <div className="space-y-2">
                    <h5 className="text-white font-medium text-sm">Resource Utilization</h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-purple-300">Avg CPU</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-purple-900/20 rounded-full h-1.5">
                            <div className="bg-cyan-500 h-1.5 rounded-full" style={{width: '32%'}}></div>
                          </div>
                          <span className="text-xs font-medium text-cyan-400">32%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-purple-300">Avg Memory</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-purple-900/20 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '58%'}}></div>
                          </div>
                          <span className="text-xs font-medium text-blue-400">58%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dependencies Health */}
                  <div className="space-y-2">
                    <h5 className="text-white font-medium text-sm">Dependencies Health</h5>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs text-purple-300">All systems operational</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-purple-300">Active Dependencies</span>
                        <span className="text-green-400 font-medium">24</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-purple-300">Health Score</span>
                        <span className="text-green-400 font-medium">98%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" className="flex-1 text-cyan-400 border-cyan-500/30 hover:bg-cyan-900/20" data-testid="button-lifecycle-dashboard">
                    <Workflow className="w-4 h-4 mr-2" />
                    Lifecycle Dashboard
                  </Button>
                  <Button variant="outline" className="flex-1 text-purple-400 border-purple-500/30 hover:bg-purple-900/20" data-testid="button-dependency-map">
                    <Network className="w-4 h-4 mr-2" />
                    Dependency Map
                  </Button>
                  <Button variant="outline" className="flex-1 text-green-400 border-green-500/30 hover:bg-green-900/20" data-testid="button-deployment-pipeline">
                    <Rocket className="w-4 h-4 mr-2" />
                    Deployment Pipeline
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
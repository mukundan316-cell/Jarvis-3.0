import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, AlertCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export interface WorkflowStep {
  id: number;
  name: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

export interface WorkflowStepperProps {
  steps: WorkflowStep[];
  onStepClick?: (stepId: number) => void; // Pass step ID, not index
  className?: string;
  showProgress?: boolean;
}

const getStepIcon = (step: WorkflowStep) => {
  switch (step.status) {
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />;
    case 'active':
      return <Circle className="w-5 h-5 text-blue-500 dark:text-blue-400 animate-pulse" />;
    default:
      return <Circle className="w-5 h-5 text-slate-500 dark:text-slate-400" />;
  }
};

const getStepStatus = (step: WorkflowStep): 'default' | 'secondary' | 'destructive' => {
  switch (step.status) {
    case 'completed':
      return 'default'; // green
    case 'error':
      return 'destructive'; // red
    case 'active':
      return 'secondary'; // blue
    default:
      return 'secondary'; // slate
  }
};

export function WorkflowStepper({ 
  steps, 
  onStepClick, 
  className,
  showProgress = true 
}: WorkflowStepperProps) {
  // Guard against empty steps array
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progressPercentage = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  return (
    <div className={cn("space-y-4", className)} data-testid="workflow-stepper">
      {/* Progress Bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-400 dark:text-slate-300">
            <span data-testid="progress-label">Progress</span>
            <span data-testid="progress-count">{completedSteps}/{steps.length} completed</span>
          </div>
          <Progress value={progressPercentage} className="h-2" data-testid="progress-bar" />
        </div>
      )}

      {/* Step Navigation */}
      <div className="flex items-center space-x-4 overflow-x-auto pb-2" data-testid="step-navigation">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <button
              onClick={() => onStepClick?.(step.id)}
              disabled={!onStepClick}
              data-testid={`step-button-${step.id}`}
              className={cn(
                "flex items-center justify-center min-w-10 h-10 rounded-full border-2 transition-all",
                step.status === 'completed' && "bg-green-500/20 border-green-500 dark:bg-green-400/20 dark:border-green-400",
                step.status === 'active' && "bg-blue-500/20 border-blue-500 dark:bg-blue-400/20 dark:border-blue-400",
                step.status === 'error' && "bg-red-500/20 border-red-500 dark:bg-red-400/20 dark:border-red-400",
                step.status === 'pending' && "bg-slate-600/20 border-slate-600 dark:bg-slate-500/20 dark:border-slate-500",
                onStepClick && "hover:scale-105 cursor-pointer",
                !onStepClick && "cursor-default"
              )}
            >
              {getStepIcon(step)}
            </button>

            {/* Step Label */}
            <div className="ml-3 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span 
                  className={cn(
                    "text-sm font-medium truncate",
                    step.status === 'active' && "text-blue-500 dark:text-blue-400",
                    step.status === 'completed' && "text-green-500 dark:text-green-400",
                    step.status === 'error' && "text-red-500 dark:text-red-400",
                    step.status === 'pending' && "text-slate-500 dark:text-slate-400"
                  )}
                  data-testid={`step-name-${step.id}`}
                >
                  {step.name}
                </span>
                <Badge variant={getStepStatus(step)} className="text-xs" data-testid={`step-status-${step.id}`}>
                  {step.status}
                </Badge>
              </div>
              {step.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate" data-testid={`step-description-${step.id}`}>
                  {step.description}
                </p>
              )}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={cn(
                "w-8 h-0.5 mx-4 transition-colors",
                steps[index + 1].status === 'completed' || step.status === 'completed' 
                  ? "bg-green-500 dark:bg-green-400" 
                  : "bg-slate-600 dark:bg-slate-500"
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Configuration-driven workflow stepper component - Following replit.md NO HARD-CODING principle
export interface ApiWorkflowStepperProps {
  workflowType: string;
  persona: string;
  currentStep?: number;
  onStepClick?: (stepId: number) => void;
  className?: string;
  showProgress?: boolean;
}

export function ApiWorkflowStepper({ 
  workflowType, 
  persona,
  currentStep = 1,
  onStepClick, 
  className,
  showProgress = true 
}: ApiWorkflowStepperProps) {
  // Fetch step definitions from API instead of hardcoded values
  const { data: stepDefinitions, isLoading, error } = useQuery({
    queryKey: ['step-definitions', workflowType, persona],
    queryFn: async () => {
      const response = await fetch(`/api/step-definitions/${workflowType}?persona=${persona}`);
      if (!response.ok) {
        throw new Error('Failed to fetch step definitions');
      }
      return response.json();
    }
  });

  // Transform API response to WorkflowStep format with dynamic status
  const steps: WorkflowStep[] = stepDefinitions?.map((step: any) => ({
    id: step.stepNumber,
    name: step.stepTitle,
    description: step.stepDescription,
    status: step.stepNumber < currentStep ? 'completed' : 
           step.stepNumber === currentStep ? 'active' : 'pending'
  })) || [];

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <span className="text-slate-400">Loading workflow steps...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-4 rounded-lg bg-red-500/10 border border-red-500/30", className)}>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-400">Failed to load workflow steps</span>
        </div>
      </div>
    );
  }

  return <WorkflowStepper steps={steps} onStepClick={onStepClick} className={className} showProgress={showProgress} />;
}

// Legacy function maintained for backward compatibility - DEPRECATED
// @deprecated Use ApiWorkflowStepper instead for configuration-driven step definitions
export const createCommercialPropertySteps = (currentStep: number = 1): WorkflowStep[] => {
  console.warn('⚠️ createCommercialPropertySteps is deprecated. Use ApiWorkflowStepper component instead.');
  
  // Fallback hardcoded definitions - should be replaced with API calls
  const stepDefinitions = [
    { id: 1, name: "Email Intake", description: "Process incoming submission emails" },
    { id: 2, name: "Document Ingestion", description: "OCR and data extraction" },
    { id: 3, name: "Data Enrichment", description: "Geocoding and peril overlays" },
    { id: 4, name: "Comparative Analytics", description: "Similar risk analysis" },
    { id: 5, name: "Appetite Triage", description: "Decision tree evaluation" },
    { id: 6, name: "Propensity Scoring", description: "Broker behavior analysis" },
    { id: 7, name: "Underwriting Copilot", description: "Rate adequacy assessment" },
    { id: 8, name: "Core Integration", description: "System data flow" }
  ];

  return stepDefinitions.map(step => ({
    ...step,
    status: step.id < currentStep ? 'completed' : 
           step.id === currentStep ? 'active' : 'pending'
  }));
};
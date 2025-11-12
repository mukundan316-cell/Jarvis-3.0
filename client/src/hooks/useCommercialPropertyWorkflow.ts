import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { WorkflowStep } from '@/components/WorkflowStepper';

// Use types from shared schema (these will need to be added to shared/schema.ts)
export interface CommercialPropertyWorkflowState {
  id?: string;
  submissionId: string;
  currentStep: number;
  completedSteps: number[];
  stepData: Record<number, any>;
  status: 'draft' | 'in_progress' | 'completed' | 'error';
  createdAt?: string;
  updatedAt?: string;
}

// Commercial Property workflow hook
export function useCommercialPropertyWorkflow(submissionId: string) {
  const queryClient = useQueryClient();

  // Query key following project patterns (segmented for better cache management)
  const workflowQueryKey = ['/api/commercial-property/workflow', submissionId];

  // Fetch workflow state from database (using project defaults)
  const { 
    data: workflowState, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: workflowQueryKey,
    // No custom queryFn - using project default fetcher
    // No custom staleTime - using project defaults (Infinity)
  });

  // Initialize workflow mutation with proper cache-based optimistic updates
  const initializeWorkflowMutation = useMutation({
    mutationFn: (initialData: Partial<CommercialPropertyWorkflowState>) =>
      apiRequest('/api/commercial-property/workflow/initialize', 'POST', {
        submissionId,
        ...initialData,
      }),
    onMutate: async (newWorkflow) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: workflowQueryKey });
      
      // Snapshot the previous value
      const previousWorkflow = queryClient.getQueryData(workflowQueryKey);
      
      // Optimistically update the cache (safe for empty cache)
      queryClient.setQueryData(workflowQueryKey, {
        submissionId,
        currentStep: 1,
        completedSteps: [],
        stepData: {},
        status: 'in_progress',
        ...newWorkflow,
      });
      
      return { previousWorkflow };
    },
    onError: (err, newWorkflow, context) => {
      // Rollback on error
      queryClient.setQueryData(workflowQueryKey, context?.previousWorkflow);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: workflowQueryKey });
    },
  });

  // Update step data mutation with cache-based optimistic updates
  const updateStepMutation = useMutation({
    mutationFn: ({ stepNumber, data }: { stepNumber: number; data: any }) =>
      apiRequest(`/api/commercial-property/workflow/${submissionId}/step/${stepNumber}`, 'PUT', {
        stepData: data,
      }),
    onMutate: async ({ stepNumber, data }) => {
      await queryClient.cancelQueries({ queryKey: workflowQueryKey });
      const previousWorkflow = queryClient.getQueryData(workflowQueryKey);
      
      // Optimistically update step data (safe for empty cache)
      queryClient.setQueryData(workflowQueryKey, (old: any) => {
        const base = old ?? {
          submissionId,
          currentStep: 1,
          completedSteps: [],
          stepData: {},
          status: 'in_progress'
        };
        return {
          ...base,
          stepData: {
            ...base.stepData,
            [stepNumber]: data,
          },
        };
      });
      
      return { previousWorkflow };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(workflowQueryKey, context?.previousWorkflow);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workflowQueryKey });
    },
  });

  // Navigate to step mutation with cache-based optimistic updates
  const navigateToStepMutation = useMutation({
    mutationFn: ({ stepNumber }: { stepNumber: number }) =>
      apiRequest(`/api/commercial-property/workflow/${submissionId}/navigate`, 'PUT', {
        currentStep: stepNumber,
      }),
    onMutate: async ({ stepNumber }) => {
      await queryClient.cancelQueries({ queryKey: workflowQueryKey });
      const previousWorkflow = queryClient.getQueryData(workflowQueryKey);
      
      // Optimistically update current step (safe for empty cache)
      queryClient.setQueryData(workflowQueryKey, (old: any) => {
        const base = old ?? {
          submissionId,
          currentStep: 1,
          completedSteps: [],
          stepData: {},
          status: 'in_progress'
        };
        return {
          ...base,
          currentStep: stepNumber,
        };
      });
      
      return { previousWorkflow };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(workflowQueryKey, context?.previousWorkflow);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workflowQueryKey });
    },
  });

  // Complete step mutation with cache-based optimistic updates
  const completeStepMutation = useMutation({
    mutationFn: async ({ stepNumber, stepData }: { stepNumber: number; stepData?: any }) => {
      // First update step data if provided
      if (stepData) {
        await apiRequest(`/api/commercial-property/workflow/${submissionId}/step/${stepNumber}`, 'PUT', {
          stepData,
        });
      }
      
      // Then mark step as completed
      return apiRequest(`/api/commercial-property/workflow/${submissionId}/complete-step`, 'PUT', {
        stepNumber,
        nextStep: stepNumber < 8 ? stepNumber + 1 : stepNumber,
      });
    },
    onMutate: async ({ stepNumber, stepData }) => {
      await queryClient.cancelQueries({ queryKey: workflowQueryKey });
      const previousWorkflow = queryClient.getQueryData(workflowQueryKey);
      
      // Optimistically update completion and navigation (safe for empty cache)
      queryClient.setQueryData(workflowQueryKey, (old: any) => {
        const base = old ?? {
          submissionId,
          currentStep: 1,
          completedSteps: [],
          stepData: {},
          status: 'in_progress'
        };
        
        const newCompletedSteps = [...(base.completedSteps || [])];
        if (!newCompletedSteps.includes(stepNumber)) {
          newCompletedSteps.push(stepNumber);
        }
        
        return {
          ...base,
          completedSteps: newCompletedSteps,
          currentStep: stepNumber < 8 ? stepNumber + 1 : stepNumber,
          stepData: stepData ? {
            ...base.stepData,
            [stepNumber]: stepData,
          } : base.stepData,
        };
      });
      
      return { previousWorkflow };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(workflowQueryKey, context?.previousWorkflow);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workflowQueryKey });
    },
  });

  // Complete workflow mutation with cache-based optimistic updates
  const completeWorkflowMutation = useMutation({
    mutationFn: (finalData?: any) =>
      apiRequest(`/api/commercial-property/workflow/${submissionId}/complete`, 'POST', {
        finalData,
      }),
    onMutate: async (finalData) => {
      await queryClient.cancelQueries({ queryKey: workflowQueryKey });
      const previousWorkflow = queryClient.getQueryData(workflowQueryKey);
      
      // Optimistically mark as completed (safe for empty cache)
      queryClient.setQueryData(workflowQueryKey, (old: any) => {
        const base = old ?? {
          submissionId,
          currentStep: 1,
          completedSteps: [],
          stepData: {},
          status: 'in_progress'
        };
        return {
          ...base,
          status: 'completed',
          completedSteps: [1, 2, 3, 4, 5, 6, 7, 8],
        };
      });
      
      return { previousWorkflow };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(workflowQueryKey, context?.previousWorkflow);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workflowQueryKey });
    },
  });

  // Current state from server data with fallback defaults
  const currentState: CommercialPropertyWorkflowState = {
    submissionId,
    currentStep: 1,
    completedSteps: [],
    stepData: {},
    status: 'draft',
    ...(workflowState || {}),
  };

  // Action functions using proper mutations (no local state overlay)
  const initializeWorkflow = useCallback(
    (initialData?: Partial<CommercialPropertyWorkflowState>) => {
      return initializeWorkflowMutation.mutateAsync({
        currentStep: 1,
        completedSteps: [],
        stepData: {},
        status: 'in_progress',
        ...initialData,
      });
    },
    [initializeWorkflowMutation]
  );

  const updateStepData = useCallback(
    (stepNumber: number, data: any) => {
      return updateStepMutation.mutateAsync({ stepNumber, data });
    },
    [updateStepMutation]
  );

  const completeStep = useCallback(
    (stepNumber: number, stepData?: any) => {
      return completeStepMutation.mutateAsync({ stepNumber, stepData });
    },
    [completeStepMutation]
  );

  const navigateToStep = useCallback(
    (stepNumber: number) => {
      return navigateToStepMutation.mutateAsync({ stepNumber });
    },
    [navigateToStepMutation]
  );

  const completeWorkflow = useCallback(
    (finalData?: any) => {
      return completeWorkflowMutation.mutateAsync(finalData);
    },
    [completeWorkflowMutation]
  );

  const resetWorkflow = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: workflowQueryKey });
  }, [queryClient, workflowQueryKey]);

  // Helper to generate WorkflowStep array for the stepper component
  const generateSteps = useCallback((): WorkflowStep[] => {
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
      status: 
        currentState.completedSteps?.includes(step.id) ? 'completed' :
        currentState.currentStep === step.id ? 'active' : 'pending'
    }));
  }, [currentState.completedSteps, currentState.currentStep]);

  // Helper to check if step can be navigated to
  const canNavigateToStep = useCallback(
    (stepNumber: number): boolean => {
      // Can navigate to current step, completed steps, or next step after last completed
      const maxCompletedStep = Math.max(0, ...(currentState.completedSteps || []));
      return stepNumber <= maxCompletedStep + 1;
    },
    [currentState.completedSteps]
  );

  return {
    // State
    workflowState: currentState,
    isLoading,
    error,
    
    // Computed state
    steps: generateSteps(),
    canNavigateBack: currentState.currentStep > 1,
    canNavigateForward: currentState.currentStep < 8,
    isWorkflowComplete: currentState.status === 'completed',
    
    // Actions
    initializeWorkflow,
    updateStepData,
    completeStep,
    navigateToStep,
    completeWorkflow,
    resetWorkflow,
    canNavigateToStep,
    
    // Mutation states
    isInitializing: initializeWorkflowMutation.isPending,
    isUpdating: updateStepMutation.isPending,
    isNavigating: navigateToStepMutation.isPending,
    isCompleting: completeWorkflowMutation.isPending,
  };
}
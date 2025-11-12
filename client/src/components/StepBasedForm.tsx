import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { WorkflowStepper, WorkflowStep } from '@/components/WorkflowStepper';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, Check, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

// Type definitions for step-based forms following replit.md guidelines
export interface StepFieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'email' | 'tel';
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: z.ZodType<any>;
  defaultValue?: any;
  disabled?: boolean;
  conditional?: {
    dependsOn: string;
    value: any;
  };
}

export interface StepDefinition {
  id: number;
  name: string;
  title: string;
  description?: string;
  fields: StepFieldDefinition[];
  submitLabel?: string;
  skipable?: boolean;
  validationSchema?: z.ZodObject<any>;
}

export interface StepBasedFormProps {
  steps: StepDefinition[];
  initialData?: Record<string, any>;
  onStepComplete?: (stepId: number, data: Record<string, any>) => void;
  onFormComplete?: (allData: Record<string, any>) => void;
  onCancel?: () => void;
  className?: string;
  submitButtonLabel?: string;
  allowNavigation?: boolean;
  persona?: string;
}

// Dynamic field renderer following existing shadcn/ui patterns
const FieldRenderer: React.FC<{
  field: StepFieldDefinition;
  form: any;
  formData: Record<string, any>;
}> = ({ field, form, formData }) => {
  // Conditional field logic
  if (field.conditional) {
    const dependentValue = formData[field.conditional.dependsOn];
    if (dependentValue !== field.conditional.value) {
      return null;
    }
  }

  return (
    <FormField
      control={form.control}
      name={field.name}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>{field.label}</FormLabel>
          <FormControl>
            {field.type === 'textarea' ? (
              <Textarea
                placeholder={field.placeholder}
                disabled={field.disabled}
                {...formField}
                data-testid={`field-${field.name}`}
              />
            ) : field.type === 'select' ? (
              <Select onValueChange={formField.onChange} defaultValue={formField.value} disabled={field.disabled}>
                <SelectTrigger data-testid={`field-${field.name}`}>
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === 'checkbox' ? (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formField.value}
                  onCheckedChange={formField.onChange}
                  disabled={field.disabled}
                  data-testid={`field-${field.name}`}
                />
                <span className="text-sm">{field.description}</span>
              </div>
            ) : (
              <Input
                type={field.type}
                placeholder={field.placeholder}
                disabled={field.disabled}
                {...formField}
                data-testid={`field-${field.name}`}
              />
            )}
          </FormControl>
          {field.description && field.type !== 'checkbox' && (
            <p className="text-sm text-slate-500">{field.description}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

// Main StepBasedForm component - extends existing WorkflowStepper
export function StepBasedForm({
  steps,
  initialData = {},
  onStepComplete,
  onFormComplete,
  onCancel,
  className,
  submitButtonLabel = "Complete",
  allowNavigation = true,
  persona = 'admin'
}: StepBasedFormProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  
  const currentStep = steps[currentStepIndex];
  
  // Create validation schema for current step
  const currentStepSchema = currentStep?.validationSchema || z.object({});
  
  // Initialize form with react-hook-form
  const form = useForm({
    resolver: zodResolver(currentStepSchema),
    defaultValues: formData,
    mode: 'onChange'
  });

  // Update form when step changes
  useEffect(() => {
    if (currentStep) {
      const stepData: Record<string, any> = {};
      currentStep.fields.forEach(field => {
        stepData[field.name] = formData[field.name] ?? field.defaultValue ?? '';
      });
      form.reset(stepData);
    }
  }, [currentStepIndex, currentStep, form, formData]);

  // Convert steps to WorkflowStep format
  const workflowSteps: WorkflowStep[] = steps.map((step, index) => ({
    id: step.id,
    name: step.name,
    description: step.description,
    status: completedSteps.includes(step.id) ? 'completed' :
            index === currentStepIndex ? 'active' : 'pending'
  }));

  const handleStepSubmit = async (data: Record<string, any>) => {
    // Merge current step data with existing form data
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);

    // Mark current step as completed
    const stepId = currentStep.id;
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }

    // Call step completion callback
    onStepComplete?.(stepId, data);

    // Move to next step or complete form
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // All steps completed
      onFormComplete?.(updatedFormData);
    }
  };

  const handleStepNavigation = (stepId: number) => {
    if (!allowNavigation) return;
    
    const stepIndex = steps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      // Only allow navigation to completed steps or the next step
      // Fix: Handle empty completedSteps array to prevent -Infinity
      const completedStepIndices = completedSteps.map(id => steps.findIndex(s => s.id === id));
      const maxCompletedStepIndex = completedStepIndices.length > 0 ? Math.max(...completedStepIndices) : -1;
      const isStepAccessible = completedSteps.includes(stepId) || stepIndex <= maxCompletedStepIndex + 1;
      
      if (isStepAccessible) {
        setCurrentStepIndex(stepIndex);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  if (!currentStep) {
    return (
      <div className="text-center text-slate-400">
        No steps defined for this form.
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)} data-testid="step-based-form">
      {/* Step Progress */}
      <WorkflowStepper
        steps={workflowSteps}
        onStepClick={allowNavigation ? handleStepNavigation : undefined}
        showProgress={true}
        className="mb-6"
      />

      {/* Current Step Form */}
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleStepSubmit)} className="space-y-6">
          {/* Step Header */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-white">{currentStep.title}</h3>
            {currentStep.description && (
              <p className="text-slate-400">{currentStep.description}</p>
            )}
          </div>

          {/* Step Fields */}
          <div className="space-y-4">
            {currentStep.fields.map((field) => (
              <FieldRenderer
                key={field.name}
                field={field}
                form={form}
                formData={form.watch()}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-600">
            <div className="flex gap-2">
              {!isFirstStep && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousStep}
                  className="flex items-center gap-2"
                  data-testid="button-previous"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>
              )}
              
              {onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onCancel}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {currentStep.skipable && !isLastStep && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStepIndex(prev => prev + 1)}
                  data-testid="button-skip"
                >
                  Skip
                </Button>
              )}
              
              <Button
                type="submit"
                className="flex items-center gap-2"
                data-testid={isLastStep ? "button-complete" : "button-next"}
              >
                {isLastStep ? (
                  <>
                    <Check className="w-4 h-4" />
                    {submitButtonLabel}
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
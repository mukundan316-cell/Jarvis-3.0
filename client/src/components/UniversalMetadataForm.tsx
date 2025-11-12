import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * UniversalMetadataForm - Core lego block component for metadata-driven UI
 * Follows JARVIS 3.0 architecture patterns with full ConfigService integration
 * 
 * Features:
 * - Fully metadata-driven field definitions
 * - Atomic/molecular/organism component hierarchy  
 * - Persona and maturity level filtering
 * - Backward compatibility with existing forms
 * - ConfigService integration with fallback strategy
 */

interface FormFieldDefinition {
  id: number;
  formType: string;
  fieldKey: string;
  fieldType: string;
  label: string;
  description?: string;
  placeholder?: string;
  validationRules?: any;
  options?: Array<{ value: string; label: string; description?: string }>;
  dependencies?: any;
  uiProps?: any;
  order: number;
  isRequired: boolean;
  isActive: boolean;
  persona?: string;
  maturityLevel?: string;
  scope: string;
}

interface FormTemplate {
  id: number;
  templateName: string;
  formType: string;
  description?: string;
  configuration: any;
  persona?: string;
  maturityLevel?: string;
  isDefault: boolean;
  isActive: boolean;
}

interface UniversalMetadataFormProps {
  formType: string;
  persona?: string;
  maturityLevel?: string;
  templateName?: string;
  onSubmit: (data: Record<string, any>) => void;
  onCancel?: () => void;
  defaultValues?: Record<string, any>;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  // Component hierarchy support
  componentType?: 'atomic' | 'molecular' | 'organism';
  enableTabs?: boolean;
  showProgress?: boolean;
  layout?: 'vertical' | 'horizontal' | 'grid' | 'modal';
}

interface ScopeIdentifiers {
  persona?: string;
  agentId?: number;
  workflowId?: number;
  formType?: string;
  maturityLevel?: string;
}

/**
 * Hook to fetch form field definitions from EnhancedConfigService
 */
function useFormFieldDefinitions(formType: string, scope: ScopeIdentifiers = {}) {
  return useQuery({
    queryKey: ['/api/metadata/form-fields', formType, scope],
    queryFn: async () => {
      const params = new URLSearchParams({
        formType,
        ...(scope.persona && { persona: scope.persona }),
        ...(scope.maturityLevel && { maturityLevel: scope.maturityLevel }),
      });
      
      const response = await fetch(`/api/metadata/form-fields?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch form field definitions');
      }
      return response.json();
    },
  });
}

/**
 * Hook to fetch form template configuration
 */
function useFormTemplate(templateName?: string, scope: ScopeIdentifiers = {}) {
  return useQuery({
    queryKey: ['/api/metadata/form-template', templateName, scope],
    queryFn: async () => {
      if (!templateName) return null;
      
      const params = new URLSearchParams({
        templateName,
        ...(scope.persona && { persona: scope.persona }),
        ...(scope.maturityLevel && { maturityLevel: scope.maturityLevel }),
      });
      
      const response = await fetch(`/api/metadata/form-template?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch form template');
      }
      return response.json();
    },
    enabled: !!templateName,
  });
}

/**
 * Atomic Component: Dynamic Field Renderer
 */
function UniversalFormField({ 
  field, 
  form, 
  disabled = false 
}: { 
  field: FormFieldDefinition; 
  form: any; 
  disabled?: boolean;
}) {
  const fieldName = field.fieldKey;
  
  // Parse validation rules from JSON
  const validationRules = useMemo(() => {
    if (!field.validationRules) return {};
    
    try {
      return typeof field.validationRules === 'string' 
        ? JSON.parse(field.validationRules)
        : field.validationRules;
    } catch {
      return {};
    }
  }, [field.validationRules]);

  // Handle array fields (capabilities, integrations, etc.)
  const [arrayValue, setArrayValue] = useState('');
  const currentValues = form.watch(fieldName) || [];

  const addArrayValue = () => {
    if (arrayValue.trim() && !currentValues.includes(arrayValue.trim())) {
      const newValues = [...currentValues, arrayValue.trim()];
      form.setValue(fieldName, newValues);
      setArrayValue('');
    }
  };

  const removeArrayValue = (valueToRemove: string) => {
    const newValues = currentValues.filter((v: string) => v !== valueToRemove);
    form.setValue(fieldName, newValues);
  };

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field: formField }) => (
        <FormItem className={cn(field.uiProps?.className)}>
          <FormLabel className="text-sm font-medium text-foreground">
            {field.label}
            {field.isRequired && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          
          <FormControl>
            {(() => {
              switch (field.fieldType) {
                case 'text':
                case 'email':
                case 'url':
                case 'tel':
                case 'password':
                  return (
                    <Input
                      type={field.fieldType}
                      placeholder={field.placeholder}
                      disabled={disabled}
                      {...formField}
                      className="bg-background/50 border-border/50 focus:border-primary/50"
                    />
                  );
                
                case 'textarea':
                  return (
                    <Textarea
                      placeholder={field.placeholder}
                      disabled={disabled}
                      {...formField}
                      className="bg-background/50 border-border/50 focus:border-primary/50 min-h-[80px]"
                    />
                  );
                
                case 'select':
                  return (
                    <Select 
                      onValueChange={formField.onChange} 
                      defaultValue={formField.value}
                      disabled={disabled}
                    >
                      <SelectTrigger className="bg-background/50 border-border/50">
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              {option.description && (
                                <div className="text-xs text-muted-foreground">
                                  {option.description}
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                
                case 'multiselect':
                  return (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={arrayValue}
                          onChange={(e) => setArrayValue(e.target.value)}
                          placeholder={field.placeholder}
                          disabled={disabled}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayValue())}
                          className="bg-background/50 border-border/50"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addArrayValue}
                          disabled={disabled || !arrayValue.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {currentValues.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {currentValues.map((value: string) => (
                            <Badge key={value} variant="secondary" className="text-xs">
                              {value}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 ml-1"
                                onClick={() => removeArrayValue(value)}
                                disabled={disabled}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                
                case 'toggle':
                case 'checkbox':
                  return (
                    <div className="flex items-center space-x-2">
                      {field.fieldType === 'toggle' ? (
                        <Switch
                          checked={formField.value}
                          onCheckedChange={formField.onChange}
                          disabled={disabled}
                        />
                      ) : (
                        <Checkbox
                          checked={formField.value}
                          onCheckedChange={formField.onChange}
                          disabled={disabled}
                        />
                      )}
                    </div>
                  );
                
                case 'number':
                  return (
                    <Input
                      type="number"
                      placeholder={field.placeholder}
                      disabled={disabled}
                      {...formField}
                      onChange={(e) => formField.onChange(e.target.valueAsNumber)}
                      className="bg-background/50 border-border/50 focus:border-primary/50"
                    />
                  );
                
                default:
                  return (
                    <Input
                      placeholder={field.placeholder}
                      disabled={disabled}
                      {...formField}
                      className="bg-background/50 border-border/50 focus:border-primary/50"
                    />
                  );
              }
            })()}
          </FormControl>
          
          {field.description && (
            <FormDescription className="text-xs text-muted-foreground">
              {field.description}
            </FormDescription>
          )}
          
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Main UniversalMetadataForm Component (Organism)
 */
export function UniversalMetadataForm({
  formType,
  persona,
  maturityLevel,
  templateName,
  onSubmit,
  onCancel,
  defaultValues = {},
  submitText = 'Submit',
  cancelText = 'Cancel',
  isLoading = false,
  disabled = false,
  className,
  componentType = 'organism',
  enableTabs = false,
  showProgress = false,
  layout = 'vertical',
}: UniversalMetadataFormProps) {
  const scope = { persona, maturityLevel, formType };
  
  // Fetch form configuration
  const { 
    data: fields = [], 
    isLoading: fieldsLoading, 
    error: fieldsError 
  } = useFormFieldDefinitions(formType, scope);
  
  const { 
    data: template, 
    isLoading: templateLoading 
  } = useFormTemplate(templateName, scope);

  // Create dynamic Zod schema based on field definitions
  const formSchema = useMemo(() => {
    const schemaObject: Record<string, z.ZodTypeAny> = {};
    
    fields.forEach((field: FormFieldDefinition) => {
      let fieldSchema: z.ZodTypeAny;
      
      switch (field.fieldType) {
        case 'email':
          fieldSchema = z.string().email('Invalid email address');
          break;
        case 'url':
          fieldSchema = z.string().url('Invalid URL');
          break;
        case 'number':
          fieldSchema = z.number();
          break;
        case 'multiselect':
          fieldSchema = z.array(z.string()).default([]);
          break;
        case 'toggle':
        case 'checkbox':
          fieldSchema = z.boolean().default(false);
          break;
        default:
          fieldSchema = z.string();
      }
      
      // Apply validation rules
      if (field.validationRules) {
        try {
          const rules = typeof field.validationRules === 'string' 
            ? JSON.parse(field.validationRules)
            : field.validationRules;
          
          if (rules.minLength && fieldSchema instanceof z.ZodString) {
            fieldSchema = fieldSchema.min(rules.minLength);
          }
          if (rules.maxLength && fieldSchema instanceof z.ZodString) {
            fieldSchema = fieldSchema.max(rules.maxLength);
          }
        } catch (error) {
          console.warn('Invalid validation rules for field:', field.fieldKey, error);
        }
      }
      
      // Make required fields non-optional
      if (!field.isRequired) {
        fieldSchema = fieldSchema.optional();
      }
      
      schemaObject[field.fieldKey] = fieldSchema;
    });
    
    return z.object(schemaObject);
  }, [fields]);

  // Initialize form with dynamic schema
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      // Ensure multiselect fields default to arrays
      ...fields.reduce((acc: Record<string, any>, field: FormFieldDefinition) => {
        if (field.fieldType === 'multiselect' && !defaultValues[field.fieldKey]) {
          acc[field.fieldKey] = [];
        }
        return acc;
      }, {} as Record<string, any>),
    },
  });

  // Group fields for tabbed layout
  const fieldGroups = useMemo(() => {
    if (!enableTabs) return [{ name: 'General', fields }];
    
    // Group fields by their category or use a default grouping
    const groups = fields.reduce((acc: Record<string, FormFieldDefinition[]>, field: FormFieldDefinition) => {
      const category = field.uiProps?.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(field);
      return acc;
    }, {} as Record<string, FormFieldDefinition[]>);
    
    return Object.entries(groups).map(([name, fields]) => ({ name, fields }));
  }, [fields, enableTabs]);

  const handleSubmit = (data: Record<string, any>) => {
    onSubmit(data);
  };

  if (fieldsLoading || templateLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading form...</span>
      </div>
    );
  }

  if (fieldsError) {
    return (
      <div className="p-4 text-center text-destructive">
        <p>Failed to load form configuration</p>
        <p className="text-sm text-muted-foreground mt-1">
          {fieldsError instanceof Error ? fieldsError.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No form fields configured for {formType}</p>
        {persona && <p className="text-sm">Persona: {persona}</p>}
        {maturityLevel && <p className="text-sm">Maturity Level: {maturityLevel}</p>}
      </div>
    );
  }

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {enableTabs && fieldGroups.length > 1 ? (
          <Tabs defaultValue={fieldGroups[0]?.name} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
              {fieldGroups.map((group) => (
                <TabsTrigger key={group.name} value={group.name}>
                  {group.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {fieldGroups.map((group) => (
              <TabsContent key={group.name} value={group.name} className="space-y-4">
                {group.fields
                  .sort((a, b) => a.order - b.order)
                  .map((field) => (
                    <UniversalFormField
                      key={field.id}
                      field={field}
                      form={form}
                      disabled={disabled}
                    />
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className={cn(
            "space-y-4",
            layout === 'grid' && "grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0",
            layout === 'horizontal' && "flex flex-wrap gap-4 space-y-0"
          )}>
            {fields
              .sort((a, b) => a.order - b.order)
              .map((field) => (
                <UniversalFormField
                  key={field.id}
                  field={field}
                  form={form}
                  disabled={disabled}
                />
              ))}
          </div>
        )}
        
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading || disabled}
            className="flex-1"
            data-testid="button-submit"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitText}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              data-testid="button-cancel"
            >
              {cancelText}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );

  // Wrap in Card for organism-level components
  if (componentType === 'organism' && layout === 'modal') {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>
            {template?.description || `${formType} Configuration`}
          </CardTitle>
          {template?.description && (
            <CardDescription>{template.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {formContent}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {formContent}
    </div>
  );
}

// Export additional components for reusability
export { UniversalFormField };

// Default export for backward compatibility
export default UniversalMetadataForm;
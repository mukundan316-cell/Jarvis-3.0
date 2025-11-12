import { ComponentType, ReactElement, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * Higher-Order Component (HOC) for gradual migration to metadata-driven UI
 * Wraps existing components to provide metadata-driven configurations
 * while maintaining backward compatibility with JARVIS 3.0 architecture
 * 
 * Features:
 * - Non-breaking migration path
 * - Fallback to hardcoded values if metadata not available
 * - Persona and maturity level aware
 * - ConfigService integration via EnhancedConfigService
 */

interface MetadataConfigOptions {
  formType?: string;
  templateName?: string;
  enableMetadata?: boolean;
  fallbackMode?: 'hardcoded' | 'hybrid' | 'metadata-only';
  persona?: string;
  maturityLevel?: string;
  componentType?: 'atomic' | 'molecular' | 'organism';
  debugMode?: boolean;
}

interface WithMetadataConfigProps {
  metadataConfig?: MetadataConfigOptions;
  // Allow any additional props that the wrapped component might need
  [key: string]: any;
}

/**
 * Hook to fetch metadata configuration with fallback strategy
 */
function useMetadataConfig(options: MetadataConfigOptions) {
  const {
    formType,
    templateName,
    enableMetadata = true,
    fallbackMode = 'hybrid',
    persona,
    maturityLevel,
    debugMode = false,
  } = options;

  // Fetch form field definitions if formType is provided
  const {
    data: fieldDefinitions,
    isLoading: fieldsLoading,
    error: fieldsError,
  } = useQuery({
    queryKey: ['/api/metadata/form-fields', formType, persona, maturityLevel],
    queryFn: async () => {
      if (!formType) return null;
      
      const params = new URLSearchParams({
        formType,
        ...(persona && { persona }),
        ...(maturityLevel && { maturityLevel }),
      });
      
      const response = await fetch(`/api/metadata/form-fields?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch form field definitions');
      }
      return response.json();
    },
    enabled: enableMetadata && !!formType,
  });

  // Fetch form template if templateName is provided
  const {
    data: template,
    isLoading: templateLoading,
    error: templateError,
  } = useQuery({
    queryKey: ['/api/metadata/form-template', templateName, persona, maturityLevel],
    queryFn: async () => {
      if (!templateName) return null;
      
      const params = new URLSearchParams({
        templateName,
        ...(persona && { persona }),
        ...(maturityLevel && { maturityLevel }),
      });
      
      const response = await fetch(`/api/metadata/form-template?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch form template');
      }
      return response.json();
    },
    enabled: enableMetadata && !!templateName,
  });

  const isLoading = fieldsLoading || templateLoading;
  const hasErrors = fieldsError || templateError;

  // Determine whether to use metadata or fallback
  const shouldUseMetadata = useMemo(() => {
    if (!enableMetadata) return false;
    
    switch (fallbackMode) {
      case 'metadata-only':
        return true;
      case 'hardcoded':
        return false;
      case 'hybrid':
      default:
        // Use metadata if available and no errors, otherwise fallback
        return !hasErrors && (fieldDefinitions || template);
    }
  }, [enableMetadata, fallbackMode, hasErrors, fieldDefinitions, template]);

  const metadataConfig = useMemo(() => ({
    fieldDefinitions: shouldUseMetadata ? fieldDefinitions : null,
    template: shouldUseMetadata ? template : null,
    isLoading,
    hasErrors,
    shouldUseMetadata,
    fallbackMode,
    debugInfo: debugMode ? {
      fieldsError: fieldsError?.message,
      templateError: templateError?.message,
      fieldDefinitionsCount: fieldDefinitions?.length || 0,
      templateAvailable: !!template,
    } : undefined,
  }), [
    shouldUseMetadata,
    fieldDefinitions,
    template,
    isLoading,
    hasErrors,
    fallbackMode,
    debugMode,
    fieldsError,
    templateError,
  ]);

  return metadataConfig;
}

/**
 * HOC that wraps components with metadata-driven configuration capabilities
 * 
 * @param WrappedComponent - The component to wrap
 * @param defaultOptions - Default metadata configuration options
 * @returns Enhanced component with metadata capabilities
 */
export function withMetadataConfig<T extends object>(
  WrappedComponent: ComponentType<T>,
  defaultOptions: MetadataConfigOptions = {}
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const MetadataEnhancedComponent = (props: T & WithMetadataConfigProps): ReactElement => {
    const {
      metadataConfig: propMetadataConfig,
      ...restProps
    } = props;

    // Merge default options with prop-provided options
    const mergedOptions = {
      ...defaultOptions,
      ...propMetadataConfig,
    };

    // Get metadata configuration
    const metadataConfig = useMetadataConfig(mergedOptions);

    // Enhanced props to pass to wrapped component
    const enhancedProps = {
      ...restProps,
      // Provide metadata config to wrapped component
      metadataConfig,
      // Legacy props for backward compatibility
      $isMetadataDriven: metadataConfig.shouldUseMetadata,
      $fieldDefinitions: metadataConfig.fieldDefinitions,
      $template: metadataConfig.template,
      $metadataLoading: metadataConfig.isLoading,
      $metadataError: metadataConfig.hasErrors,
      // Debug information if enabled
      ...(mergedOptions.debugMode && {
        $debugInfo: metadataConfig.debugInfo,
      }),
    } as T & WithMetadataConfigProps;

    return <WrappedComponent {...enhancedProps} />;
  };

  MetadataEnhancedComponent.displayName = `withMetadataConfig(${displayName})`;
  MetadataEnhancedComponent.WrappedComponent = WrappedComponent;

  return MetadataEnhancedComponent;
}

/**
 * Preset HOCs for common JARVIS 3.0 use cases
 */

// Agent creation form enhancement
export const withAgentCreateMetadata = <T extends object>(component: ComponentType<T>) =>
  withMetadataConfig(component, {
    formType: 'agent_create',
    templateName: 'agent-creation-default',
    fallbackMode: 'hybrid',
    enableMetadata: true,
    componentType: 'organism',
  });

// Agent editing form enhancement
export const withAgentEditMetadata = <T extends object>(component: ComponentType<T>) =>
  withMetadataConfig(component, {
    formType: 'agent_edit',
    templateName: 'agent-editing-default',
    fallbackMode: 'hybrid',
    enableMetadata: true,
    componentType: 'organism',
  });

// Governance form enhancement
export const withGovernanceMetadata = <T extends object>(component: ComponentType<T>) =>
  withMetadataConfig(component, {
    formType: 'governance',
    templateName: 'governance-default',
    fallbackMode: 'hybrid',
    enableMetadata: true,
    componentType: 'organism',
  });

// Configuration form enhancement
export const withConfigMetadata = <T extends object>(component: ComponentType<T>) =>
  withMetadataConfig(component, {
    formType: 'config',
    templateName: 'config-default',
    fallbackMode: 'hybrid',
    enableMetadata: true,
    componentType: 'molecular',
  });

/**
 * Helper hook for components that want to access metadata config directly
 * without being wrapped by the HOC
 */
export function useComponentMetadata(options: MetadataConfigOptions) {
  return useMetadataConfig(options);
}

/**
 * Utility function to check if a component is metadata-enhanced
 */
export function isMetadataEnhanced(component: any): boolean {
  return !!(component?.WrappedComponent);
}

/**
 * Migration helper to gradually enable metadata for existing components
 * Usage: const EnhancedModal = enableMetadataForComponent(CreateNewAgentModal, 'agent_create');
 */
export function enableMetadataForComponent<T extends object>(
  component: ComponentType<T>,
  formType: string,
  options: Partial<MetadataConfigOptions> = {}
) {
  return withMetadataConfig(component, {
    formType,
    fallbackMode: 'hybrid',
    enableMetadata: true,
    ...options,
  });
}

/**
 * Development helper to create metadata-aware components with debug info
 */
export function withMetadataDebug<T extends object>(
  component: ComponentType<T>,
  options: MetadataConfigOptions = {}
) {
  return withMetadataConfig(component, {
    ...options,
    debugMode: true,
    fallbackMode: 'hybrid',
  });
}

/**
 * Export default for backward compatibility
 */
export default withMetadataConfig;
import React, { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useTooltipContent, type TooltipScope } from '@/hooks/useTooltipContent';

// TypeScript interfaces following replit.md standards
export interface TooltipConfig {
  content: string | ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  skipDelayDuration?: number;
  variant?: 'default' | 'enhanced' | 'compact' | 'rich';
  showArrow?: boolean;
  maxWidth?: number;
  className?: string;
}

export interface EnhancedTooltipContent {
  title?: string;
  description?: string;
  icon?: ReactNode;
  badge?: string;
  shortcut?: string;
  details?: Array<{ label: string; value: string }>;
}

interface UniversalEnhancedTooltipProps {
  children: ReactNode;
  config: TooltipConfig;
  testId?: string;
  disabled?: boolean;
}

// Interface for database-driven tooltip component
interface DatabaseTooltipProps {
  children: ReactNode;
  tooltipKey: string;
  scope?: TooltipScope;
  fallbackContent?: string;
  testId?: string;
  disabled?: boolean;
}

// Glassmorphism styling variants following established patterns
const tooltipVariants = {
  default: cn(
    // Base glassmorphism from hexaware-glass pattern
    'bg-[rgba(15,23,42,0.95)] backdrop-blur-[20px] saturate-[180%]',
    'border border-blue-500/40',
    'shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]',
    'text-white text-sm font-medium',
    'px-3 py-2 rounded-lg',
    'animate-in fade-in-0 zoom-in-95 duration-200',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
    'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
    'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'
  ),
  enhanced: cn(
    // Enhanced glassmorphism with stronger effects (dialog-level styling)
    'bg-gradient-to-br from-blue-500/10 to-slate-900/20 backdrop-blur-[40px] saturate-[180%]',
    'border-2 border-blue-500/60',
    'shadow-[0_25px_50px_0_rgba(0,0,0,0.3)] shadow-[inset_0_3px_0_0_rgba(255,255,255,0.2)]',
    'shadow-[0_0_80px_0_rgba(59,130,246,0.2)] shadow-[inset_0_0_20px_0_rgba(59,130,246,0.05)]',
    'text-white font-medium',
    'px-4 py-3 rounded-xl',
    'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-300',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
  ),
  compact: cn(
    // Minimal glassmorphism for space-constrained areas
    'bg-[rgba(15,23,42,0.9)] backdrop-blur-[12px]',
    'border border-blue-500/30',
    'shadow-[0_4px_16px_0_rgba(31,38,135,0.2)]',
    'text-white text-xs',
    'px-2 py-1 rounded-md',
    'animate-in fade-in-0 duration-150'
  ),
  rich: cn(
    // Rich content variant with enhanced styling for complex tooltips
    'bg-[rgba(15,23,42,0.98)] backdrop-blur-[25px] saturate-[180%]',
    'border border-blue-500/50',
    'shadow-[0_20px_40px_0_rgba(31,38,135,0.4)] shadow-[inset_0_2px_0_0_rgba(255,255,255,0.15)]',
    'text-white',
    'p-4 rounded-xl max-w-sm',
    'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-3 duration-250'
  )
};

/**
 * Universal Enhanced Tooltip Component with glassmorphism styling
 * Follows replit.md principles: TypeScript safety, Universal components, data-testid attributes
 * Integrates with the established glassmorphism design language
 */
export function UniversalEnhancedTooltip({
  children,
  config,
  testId,
  disabled = false
}: UniversalEnhancedTooltipProps) {
  if (disabled) {
    return <>{children}</>;
  }

  const {
    content,
    side = 'top',
    align = 'center',
    delayDuration = 300,
    skipDelayDuration = 100,
    variant = 'default',
    showArrow = true,
    maxWidth = 300,
    className
  } = config;

  const tooltipClassName = cn(
    tooltipVariants[variant],
    className
  );

  // Handle rich content format
  const renderContent = () => {
    if (typeof content === 'string') {
      return content;
    }

    if (React.isValidElement(content)) {
      return content;
    }

    // Handle structured content for rich tooltips
    const richContent = content as EnhancedTooltipContent;
    if (richContent && typeof richContent === 'object' && 'title' in richContent) {
      return (
        <div className="space-y-2" data-testid={testId ? `${testId}-rich-content` : undefined}>
          {richContent.title && (
            <div className="flex items-center gap-2">
              {richContent.icon && (
                <span className="text-blue-400" data-testid={testId ? `${testId}-icon` : undefined}>
                  {richContent.icon}
                </span>
              )}
              <span className="font-semibold text-white" data-testid={testId ? `${testId}-title` : undefined}>
                {richContent.title}
              </span>
              {richContent.badge && (
                <span 
                  className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded"
                  data-testid={testId ? `${testId}-badge` : undefined}
                >
                  {richContent.badge}
                </span>
              )}
            </div>
          )}
          
          {richContent.description && (
            <p className="text-gray-300 text-sm leading-relaxed" data-testid={testId ? `${testId}-description` : undefined}>
              {richContent.description}
            </p>
          )}
          
          {richContent.details && richContent.details.length > 0 && (
            <div className="space-y-1" data-testid={testId ? `${testId}-details` : undefined}>
              {richContent.details.map((detail, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-gray-400">{detail.label}:</span>
                  <span className="text-white font-medium">{detail.value}</span>
                </div>
              ))}
            </div>
          )}
          
          {richContent.shortcut && (
            <div className="pt-2 border-t border-blue-500/20">
              <span className="text-xs text-blue-400" data-testid={testId ? `${testId}-shortcut` : undefined}>
                {richContent.shortcut}
              </span>
            </div>
          )}
        </div>
      );
    }

    return String(content);
  };

  return (
    <TooltipProvider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
      <Tooltip>
        <TooltipTrigger asChild data-testid={testId ? `${testId}-trigger` : undefined}>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={tooltipClassName}
          style={{ maxWidth }}
          data-testid={testId ? `${testId}-content` : undefined}
          sideOffset={8}
          arrowPadding={8}
        >
          {renderContent()}
          {!showArrow && <style>{`[data-radix-tooltip-content] > [data-radix-tooltip-arrow] { display: none; }`}</style>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Convenience wrapper for simple text tooltips
export function SimpleTooltip({
  children,
  content,
  testId,
  ...otherProps
}: {
  children: ReactNode;
  content: string;
  testId?: string;
} & Partial<TooltipConfig>) {
  return (
    <UniversalEnhancedTooltip
      config={{ content, ...otherProps }}
      testId={testId}
    >
      {children}
    </UniversalEnhancedTooltip>
  );
}

// Convenience wrapper for rich content tooltips
export function RichTooltip({
  children,
  content,
  testId,
  ...otherProps
}: {
  children: ReactNode;
  content: EnhancedTooltipContent;
  testId?: string;
} & Partial<TooltipConfig>) {
  return (
    <UniversalEnhancedTooltip
      config={{ content, variant: 'rich', ...otherProps }}
      testId={testId}
    >
      {children}
    </UniversalEnhancedTooltip>
  );
}

/**
 * Database-driven tooltip component that fetches content from ConfigService
 * Follows replit.md NO HARD-CODING principle
 */
export function DatabaseTooltip({
  children,
  tooltipKey,
  scope,
  fallbackContent = 'Loading...',
  testId,
  disabled = false
}: DatabaseTooltipProps) {
  const { content, isLoading, error } = useTooltipContent(tooltipKey, scope, fallbackContent);
  
  if (disabled || (!content && !isLoading)) {
    return <>{children}</>;
  }

  // Show fallback content while loading or on error
  if (isLoading || error) {
    return (
      <UniversalEnhancedTooltip
        config={{ content: fallbackContent }}
        testId={testId ? `${testId}-fallback` : undefined}
      >
        {children}
      </UniversalEnhancedTooltip>
    );
  }

  // Use database content
  const tooltipConfig: TooltipConfig = {
    content: content?.content || fallbackContent,
    side: content?.side || 'top',
    align: content?.align || 'center',
    variant: content?.variant || 'default',
    delayDuration: content?.delayDuration || 300,
    maxWidth: content?.maxWidth || 300,
    ...content
  };

  return (
    <UniversalEnhancedTooltip
      config={tooltipConfig}
      testId={testId}
      disabled={disabled}
    >
      {children}
    </UniversalEnhancedTooltip>
  );
}

// Enhanced convenience wrappers for database-driven tooltips
export function DatabaseSimpleTooltip({
  children,
  tooltipKey,
  fallbackContent,
  testId,
  scope,
  ...otherProps
}: {
  children: ReactNode;
  tooltipKey: string;
  fallbackContent: string;
  testId?: string;
  scope?: TooltipScope;
} & Partial<TooltipConfig>) {
  return (
    <DatabaseTooltip
      tooltipKey={tooltipKey}
      scope={scope}
      fallbackContent={fallbackContent}
      testId={testId}
    >
      {children}
    </DatabaseTooltip>
  );
}

export default UniversalEnhancedTooltip;
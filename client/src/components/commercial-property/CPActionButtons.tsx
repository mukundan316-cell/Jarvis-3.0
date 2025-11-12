import { LucideIcon } from 'lucide-react';

interface CPActionButtonProps {
  onClick: () => void;
  icon?: LucideIcon;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Standardized action button for Commercial Property workflows
 * Provides consistent styling and theming
 */
export function CPActionButton({ 
  onClick, 
  icon: Icon, 
  children, 
  variant = 'primary',
  size = 'md'
}: CPActionButtonProps) {
  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'success':
        return 'bg-green-600 hover:bg-green-500 text-white';
      case 'secondary':
        return 'bg-slate-600 hover:bg-slate-500 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-500 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-500 text-white';
    }
  };

  const getSizeStyles = (size: string) => {
    switch (size) {
      case 'sm':
        return 'text-xs px-3 py-1.5';
      case 'lg':
        return 'text-base px-6 py-3';
      default:
        return 'text-sm px-4 py-2';
    }
  };

  return (
    <button
      onClick={onClick}
      data-testid={`button-${typeof children === 'string' ? children.toLowerCase().replace(/\s+/g, '-') : 'action'}`}
      className={`${getVariantStyles(variant)} ${getSizeStyles(size)} rounded transition-colors flex items-center gap-2`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

interface CPActionButtonGroupProps {
  buttons: Array<{
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: 'primary' | 'secondary' | 'success' | 'warning';
  }>;
  className?: string;
}

/**
 * Action button group for Commercial Property workflow steps
 * Consistent spacing and layout for multiple actions
 */
export function CPActionButtonGroup({ buttons, className = "" }: CPActionButtonGroupProps) {
  return (
    <div className={`border-t border-slate-600 pt-3 flex gap-2 ${className}`} data-testid="action-button-group">
      {buttons.map((button, index) => (
        <CPActionButton
          key={index}
          onClick={button.onClick}
          icon={button.icon}
          variant={button.variant}
          size="sm"
        >
          {button.label}
        </CPActionButton>
      ))}
    </div>
  );
}
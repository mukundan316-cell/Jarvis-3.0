import { Badge } from '@/components/ui/badge';

interface CPStatusBadgeProps {
  status: 'good' | 'moderate' | 'high' | 'level2' | 'level3' | 'green' | 'yellow' | 'red';
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Standardized status badge for Commercial Property risk indicators
 * Provides consistent color coding across all CP components
 */
export function CPStatusBadge({ status, children, size = 'md' }: CPStatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'good':
      case 'green':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'moderate':
      case 'level2':
      case 'yellow':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high':
      case 'level3':
      case 'red':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getSizeStyles = (size: string) => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-sm';
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };

  return (
    <Badge 
      variant="secondary" 
      className={`${getStatusStyles(status)} ${getSizeStyles(size)} font-medium border`}
    >
      {children}
    </Badge>
  );
}
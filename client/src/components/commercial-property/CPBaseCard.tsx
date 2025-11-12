import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface CPBaseCardProps {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  iconColor?: string;
  className?: string;
}

/**
 * Base card component for Commercial Property workflow steps
 * Provides consistent styling across all CP components
 * Based on the Risk Assessment Results design pattern
 */
export function CPBaseCard({ 
  icon: Icon, 
  title, 
  children, 
  iconColor = "text-purple-400",
  className = ""
}: CPBaseCardProps) {
  return (
    <div className={`bg-slate-800/50 rounded-lg p-4 mt-4 border border-slate-600 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <span className="font-semibold text-white">{title}</span>
      </div>
      <div className="space-y-3 text-sm">
        {children}
      </div>
    </div>
  );
}
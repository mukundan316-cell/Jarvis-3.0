import { ReactNode } from 'react';

interface CPDataRowProps {
  label: string;
  value: ReactNode;
  valueColor?: string;
}

/**
 * Consistent data row component for Commercial Property displays
 * Matches the Risk Assessment Results key-value pattern
 */
export function CPDataRow({ 
  label, 
  value, 
  valueColor = "text-white" 
}: CPDataRowProps) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}:</span>
      <span className={valueColor}>{value}</span>
    </div>
  );
}
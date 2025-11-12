import { CPStatusBadge } from './CPStatusBadge';

interface CPRiskFactorProps {
  name: string;
  description: string;
  score: string;
  status: 'green' | 'yellow' | 'red';
}

/**
 * Risk factor display component for Commercial Property assessments
 * Matches the Risk Assessment Results factor display pattern
 */
export function CPRiskFactor({ name, description, score, status }: CPRiskFactorProps) {
  return (
    <div className="flex justify-between items-center bg-slate-700/50 p-2 rounded">
      <div className="flex flex-col">
        <span className="text-white capitalize">{name.replace(/([A-Z])/g, ' $1').trim()}</span>
        <span className="text-xs text-slate-400">{description}</span>
      </div>
      <div className="flex items-center gap-2">
        <CPStatusBadge status={status} size="sm">
          {score}
        </CPStatusBadge>
        <div className={`w-3 h-3 rounded-full ${
          status === 'green' ? 'bg-green-400' : 
          status === 'yellow' ? 'bg-yellow-400' : 
          'bg-red-400'
        }`} />
      </div>
    </div>
  );
}
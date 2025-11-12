import { Shield } from 'lucide-react';
import { CPBaseCard } from './CPBaseCard';
import { CPDataRow } from './CPDataRow';
import { CPRiskFactor } from './CPRiskFactor';
import { CPActionButtonGroup } from './CPActionButtons';

interface RiskFactor {
  name: string;
  description: string;
  score: string;
  status: 'green' | 'yellow' | 'red';
}

interface SubmissionDetails {
  client: string;
  broker: string;
  propertyType: string;
  location: string;
  propertyValue: string;
}

interface CPRiskAssessmentProps {
  submissionDetails: SubmissionDetails;
  overallRisk?: string;
  riskScore?: string;
  riskFactors?: Record<string, RiskFactor>;
  onClose?: () => void;
}

/**
 * Enhanced Commercial Property Risk Assessment Results component
 * Uses unified CP design system - refactored from existing renderRiskAnalysisContent
 */
export function CPRiskAssessment({ 
  submissionDetails, 
  overallRisk, 
  riskScore, 
  riskFactors,
  onClose 
}: CPRiskAssessmentProps) {
  const triggerCommand = (command: string) => {
    onClose?.();
    setTimeout(() => {
      const event = new CustomEvent('jarvis-command', {
        detail: { command, mode: 'Pill' }
      });
      window.dispatchEvent(event);
    }, 100);
  };

  return (
    <CPBaseCard 
      icon={Shield} 
      title="Risk Assessment Results"
      iconColor="text-purple-400"
    >
      {/* Submission Details Section */}
      <div className="space-y-2 mb-4">
        <CPDataRow label="Client" value={submissionDetails.client} />
        <CPDataRow label="Broker" value={submissionDetails.broker} />
        <CPDataRow 
          label="Property" 
          value={`${submissionDetails.propertyType} - ${submissionDetails.location}`} 
        />
        <CPDataRow label="Property Value" value={submissionDetails.propertyValue} />
      </div>

      {/* Overall Risk Section */}
      {overallRisk && (
        <CPDataRow 
          label="Overall Risk" 
          value={`${overallRisk} (${riskScore})`}
          valueColor="text-green-400"
        />
      )}

      {/* Risk Factors Section */}
      {riskFactors && (
        <div className="space-y-2 mt-4">
          <span className="text-slate-400">Risk Assessment Details:</span>
          <div className="space-y-2">
            {Object.entries(riskFactors).map(([key, factor]) => (
              <CPRiskFactor
                key={key}
                name={key}
                description={factor.description}
                score={factor.score}
                status={factor.status}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <CPActionButtonGroup
        buttons={[
          {
            label: "View Inbox",
            onClick: () => triggerCommand('Show Inbox'),
            variant: "primary"
          },
          {
            label: "Send Email",
            onClick: () => triggerCommand('Send Email'),
            variant: "success"
          }
        ]}
        className="mt-4"
      />
    </CPBaseCard>
  );
}
// Commercial Property Component Library
// Unified design system for consistent CP workflow styling

export { CPBaseCard } from './CPBaseCard';
export { CPDataRow } from './CPDataRow';
export { CPStatusBadge } from './CPStatusBadge';
// export { CPRiskFactor } from './CPRiskFactor'; // Disabled - risk assessment agents purged
export { CPActionButton, CPActionButtonGroup } from './CPActionButtons';
export { CPEmailIntake } from './CPEmailIntake';
// export { CPRiskAssessment } from './CPRiskAssessment'; // Disabled - risk assessment agents purged

// Commercial Property theme colors for consistent theming
export const CP_THEME_COLORS = {
  'email-intake': 'text-blue-400',
  'document-processing': 'text-cyan-400',
  'data-enrichment': 'text-emerald-400',
  // 'risk-assessment': 'text-purple-400', // Disabled - risk assessment agents purged
  'appetite-triage': 'text-amber-400',
  'propensity-scoring': 'text-orange-400',
  'underwriting': 'text-green-400',
  'core-integration': 'text-indigo-400'
} as const;
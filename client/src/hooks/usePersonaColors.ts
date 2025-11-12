import { useEffect } from 'react';
import { PersonaType, usePersonaColorsData, applyPersonaColors, getPersonaTailwindClasses } from '@/lib/personaColors';

/**
 * React hook for managing adaptive persona colors with ConfigService integration
 * Automatically applies color scheme based on current persona
 * Provides loading states and error handling for dynamic color loading
 */
export function usePersonaColors(persona: PersonaType) {
  const { colors, isLoading, error } = usePersonaColorsData(persona);
  const tailwindClasses = getPersonaTailwindClasses(persona);

  // Apply persona colors to document root when persona changes
  useEffect(() => {
    applyPersonaColors(persona);
  }, [persona]);

  return {
    colors,
    tailwindClasses,
    // ConfigService integration status
    isLoading,
    error,
    // Helper functions for common color operations
    getPrimaryColor: () => colors.primary,
    getAccentColor: () => colors.accent,
    getGradientClasses: () => colors.cardGradient,
    getBorderClasses: () => tailwindClasses.border,
    getBadgeClasses: () => tailwindClasses.badge,
    
    // Dynamic style generators
    getButtonStyle: (variant: 'primary' | 'secondary' = 'primary') => ({
      backgroundColor: variant === 'primary' ? colors.primary : colors.accent,
      color: colors.textPrimary,
      borderColor: variant === 'primary' ? colors.border : colors.accent,
    }),
    
    getCardStyle: () => ({
      backgroundImage: `linear-gradient(135deg, ${colors.gradientFrom}20, ${colors.gradientTo}20)`,
      borderColor: colors.border + '30', // 30% opacity
    }),
    
    getTextStyle: (variant: 'primary' | 'secondary' | 'accent' = 'primary') => ({
      color: variant === 'primary' ? colors.textPrimary : 
             variant === 'secondary' ? colors.textSecondary : 
             colors.textAccent
    })
  };
}

/**
 * Hook specifically for getting persona-aware CSS classes
 */
export function usePersonaClasses(persona: PersonaType) {
  const { tailwindClasses } = usePersonaColors(persona);
  
  return {
    // Card styling
    card: `bg-gradient-to-br ${tailwindClasses.gradient} rounded-xl p-6 border ${tailwindClasses.border}/30`,
    
    // Button styling
    primaryButton: `bg-${tailwindClasses.primary}-600 hover:bg-${tailwindClasses.primary}-700 text-white border ${tailwindClasses.border}`,
    secondaryButton: `bg-${tailwindClasses.accent}-600 hover:bg-${tailwindClasses.accent}-700 text-white border border-${tailwindClasses.accent}-500`,
    
    // Badge styling
    badge: tailwindClasses.badge,
    
    // Text styling
    primaryText: 'text-white',
    secondaryText: 'text-slate-200',
    accentText: `text-${tailwindClasses.accent}-300`,
    
    // Border styling
    border: tailwindClasses.border,
    
    // Progress bar
    progressBar: `bg-${tailwindClasses.primary}-600`,
    
    // Header gradient
    headerGradient: `bg-gradient-to-r ${tailwindClasses.gradient}/20`,
    
    // Status indicators
    statusCompleted: 'text-green-400 bg-green-500/20 border-green-500/30',
    statusRunning: `text-${tailwindClasses.primary}-400 bg-${tailwindClasses.primary}-500/20 border-${tailwindClasses.primary}-500/30`,
    statusPending: 'text-slate-400 bg-slate-500/20 border-slate-500/30',
    statusError: 'text-red-400 bg-red-500/20 border-red-500/30'
  };
}
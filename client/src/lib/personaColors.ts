/**
 * Adaptive Color Scheme System for Agent Personas
 * Provides consistent color theming across all components based on active persona
 * Uses ConfigService for dynamic color scheme loading with fallback support
 */

import { useQuery } from '@tanstack/react-query';

export type PersonaType = 'admin' | 'rachel' | 'john' | 'broker' | 'sarah';

export interface PersonaColorScheme {
  // Primary colors
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryDark: string;
  
  // Accent colors
  accent: string;
  accentHover: string;
  accentLight: string;
  accentDark: string;
  
  // Background gradients
  gradientFrom: string;
  gradientTo: string;
  cardGradient: string;
  
  // Border colors
  border: string;
  borderLight: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textAccent: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  
  // Badge colors
  badgeBackground: string;
  badgeText: string;
  badgeBorder: string;
  
  // Tailwind class names for dynamic usage
  tailwind: {
    primary: string;
    accent: string;
    gradient: string;
    border: string;
    badge: string;
  };
}

export interface PersonaColorSchemesConfig {
  admin: PersonaColorScheme;
  rachel: PersonaColorScheme;
  john: PersonaColorScheme;
  broker: PersonaColorScheme;
  sarah: PersonaColorScheme;
}

export interface PersonaColorsQueryResult {
  colorSchemes: PersonaColorSchemesConfig | null;
  isLoading: boolean;
  error: any;
}

/**
 * Fallback color schemes for when ConfigService is unavailable
 * These serve as default values and maintain backward compatibility
 */
const FALLBACK_PERSONA_COLOR_SCHEMES: PersonaColorSchemesConfig = {
  admin: {
    // JARVIS Admin - Blue/Cyan theme
    primary: '#3B82F6', // blue-500
    primaryHover: '#2563EB', // blue-600
    primaryLight: '#93C5FD', // blue-300
    primaryDark: '#1E40AF', // blue-700
    
    accent: '#06B6D4', // cyan-500
    accentHover: '#0891B2', // cyan-600
    accentLight: '#67E8F9', // cyan-300
    accentDark: '#0E7490', // cyan-700
    
    gradientFrom: '#1E40AF', // blue-700
    gradientTo: '#0E7490', // cyan-700
    cardGradient: 'from-blue-900/20 to-cyan-900/20',
    
    border: '#3B82F6', // blue-500
    borderLight: '#93C5FD', // blue-300
    
    textPrimary: '#FFFFFF',
    textSecondary: '#E2E8F0', // slate-200
    textAccent: '#67E8F9', // cyan-300
    
    success: '#10B981', // emerald-500
    warning: '#F59E0B', // amber-500
    error: '#EF4444', // red-500
    
    badgeBackground: '#1E40AF20', // blue-700 with opacity
    badgeText: '#93C5FD', // blue-300
    badgeBorder: '#3B82F6', // blue-500
    
    tailwind: {
      primary: 'blue',
      accent: 'cyan',
      gradient: 'from-blue-700 to-cyan-700',
      border: 'border-blue-500',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    }
  },
  
  rachel: {
    // Rachel Thompson (AUW) - Purple/Violet theme
    primary: '#8B5CF6', // violet-500
    primaryHover: '#7C3AED', // violet-600
    primaryLight: '#C4B5FD', // violet-300
    primaryDark: '#6D28D9', // violet-700
    
    accent: '#A855F7', // purple-500
    accentHover: '#9333EA', // purple-600
    accentLight: '#D8B4FE', // purple-300
    accentDark: '#7E22CE', // purple-700
    
    gradientFrom: '#6D28D9', // violet-700
    gradientTo: '#7E22CE', // purple-700
    cardGradient: 'from-violet-900/20 to-purple-900/20',
    
    border: '#8B5CF6', // violet-500
    borderLight: '#C4B5FD', // violet-300
    
    textPrimary: '#FFFFFF',
    textSecondary: '#E2E8F0', // slate-200
    textAccent: '#D8B4FE', // purple-300
    
    success: '#10B981', // emerald-500
    warning: '#F59E0B', // amber-500
    error: '#EF4444', // red-500
    
    badgeBackground: '#6D28D920', // violet-700 with opacity
    badgeText: '#C4B5FD', // violet-300
    badgeBorder: '#8B5CF6', // violet-500
    
    tailwind: {
      primary: 'violet',
      accent: 'purple',
      gradient: 'from-violet-700 to-purple-700',
      border: 'border-violet-500',
      badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30'
    }
  },
  
  john: {
    // John Stevens (IT Support) - Green/Emerald theme
    primary: '#10B981', // emerald-500
    primaryHover: '#059669', // emerald-600
    primaryLight: '#6EE7B7', // emerald-300
    primaryDark: '#047857', // emerald-700
    
    accent: '#22C55E', // green-500
    accentHover: '#16A34A', // green-600
    accentLight: '#86EFAC', // green-300
    accentDark: '#15803D', // green-700
    
    gradientFrom: '#047857', // emerald-700
    gradientTo: '#15803D', // green-700
    cardGradient: 'from-emerald-900/20 to-green-900/20',
    
    border: '#10B981', // emerald-500
    borderLight: '#6EE7B7', // emerald-300
    
    textPrimary: '#FFFFFF',
    textSecondary: '#E2E8F0', // slate-200
    textAccent: '#86EFAC', // green-300
    
    success: '#22C55E', // green-500
    warning: '#F59E0B', // amber-500
    error: '#EF4444', // red-500
    
    badgeBackground: '#04785720', // emerald-700 with opacity
    badgeText: '#6EE7B7', // emerald-300
    badgeBorder: '#10B981', // emerald-500
    
    tailwind: {
      primary: 'emerald',
      accent: 'green',
      gradient: 'from-emerald-700 to-green-700',
      border: 'border-emerald-500',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    }
  },
  
  broker: {
    // Mike Stevens (Insurance Broker) - Orange/Amber theme
    primary: '#F59E0B', // amber-500
    primaryHover: '#D97706', // amber-600
    primaryLight: '#FCD34D', // amber-300
    primaryDark: '#B45309', // amber-700
    
    accent: '#F97316', // orange-500
    accentHover: '#EA580C', // orange-600
    accentLight: '#FDBA74', // orange-300
    accentDark: '#C2410C', // orange-700
    
    gradientFrom: '#B45309', // amber-700
    gradientTo: '#C2410C', // orange-700
    cardGradient: 'from-amber-900/20 to-orange-900/20',
    
    border: '#F59E0B', // amber-500
    borderLight: '#FCD34D', // amber-300
    
    textPrimary: '#FFFFFF',
    textSecondary: '#E2E8F0', // slate-200
    textAccent: '#FDBA74', // orange-300
    
    success: '#10B981', // emerald-500
    warning: '#F59E0B', // amber-500
    error: '#EF4444', // red-500
    
    badgeBackground: '#B4530920', // amber-700 with opacity
    badgeText: '#FCD34D', // amber-300
    badgeBorder: '#F59E0B', // amber-500
    
    tailwind: {
      primary: 'amber',
      accent: 'orange',
      gradient: 'from-amber-700 to-orange-700',
      border: 'border-amber-500',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    }
  },
  
  sarah: {
    // Sarah Geller (Jr Claims Adjustor) - Teal/Slate theme
    primary: '#14B8A6', // teal-500
    primaryHover: '#0D9488', // teal-600
    primaryLight: '#5EEAD4', // teal-300
    primaryDark: '#0F766E', // teal-700
    
    accent: '#64748B', // slate-500
    accentHover: '#475569', // slate-600
    accentLight: '#CBD5E1', // slate-300
    accentDark: '#334155', // slate-700
    
    gradientFrom: '#0F766E', // teal-700
    gradientTo: '#334155', // slate-700
    cardGradient: 'from-teal-900/20 to-slate-900/20',
    
    border: '#14B8A6', // teal-500
    borderLight: '#5EEAD4', // teal-300
    
    textPrimary: '#FFFFFF',
    textSecondary: '#E2E8F0', // slate-200
    textAccent: '#CBD5E1', // slate-300
    
    success: '#10B981', // emerald-500
    warning: '#F59E0B', // amber-500
    error: '#EF4444', // red-500
    
    badgeBackground: '#0F766E20', // teal-700 with opacity
    badgeText: '#5EEAD4', // teal-300
    badgeBorder: '#14B8A6', // teal-500
    
    tailwind: {
      primary: 'teal',
      accent: 'slate',
      gradient: 'from-teal-700 to-slate-700',
      border: 'border-teal-500',
      badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
    }
  }
};

/**
 * Hook to fetch persona color schemes from ConfigService with fallback support
 * Uses persona-specific scoping and proper caching via TanStack Query
 */
export function usePersonaColorSchemes(persona?: PersonaType): PersonaColorsQueryResult {
  const { data: colorSchemesConfig, isLoading, error } = useQuery({
    queryKey: ['/api/config/setting/persona-color-schemes.config', { persona }],
    queryFn: () => {
      const url = new URL('/api/config/setting/persona-color-schemes.config', window.location.origin);
      if (persona) {
        url.searchParams.set('persona', persona);
      }
      return fetch(url.toString()).then(res => res.json());
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - align with ConfigService cache TTL
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    retry: 1, // Retry once on failure, then fallback
    retryDelay: 1000,
    enabled: true
  });
  
  // Extract color schemes from ConfigService response or use fallbacks
  const colorSchemes = colorSchemesConfig?.value || FALLBACK_PERSONA_COLOR_SCHEMES;
  
  return {
    colorSchemes,
    isLoading,
    error
  };
}

/**
 * Get color scheme for a specific persona with ConfigService integration
 * Falls back to hardcoded schemes if ConfigService is unavailable
 */
export function getPersonaColors(persona: PersonaType): PersonaColorScheme {
  // For non-React contexts, return fallback values immediately
  return FALLBACK_PERSONA_COLOR_SCHEMES[persona] || FALLBACK_PERSONA_COLOR_SCHEMES.admin;
}

/**
 * React hook for getting dynamic persona colors with ConfigService integration
 */
export function usePersonaColorsData(persona: PersonaType): {
  colors: PersonaColorScheme;
  isLoading: boolean;
  error: any;
} {
  const { colorSchemes, isLoading, error } = usePersonaColorSchemes(persona);
  
  const colors = colorSchemes?.[persona] || FALLBACK_PERSONA_COLOR_SCHEMES[persona] || FALLBACK_PERSONA_COLOR_SCHEMES.admin;
  
  return {
    colors,
    isLoading,
    error
  };
}

/**
 * Generate dynamic CSS variables for a persona
 */
export function generatePersonaCSSVariables(persona: PersonaType): Record<string, string> {
  const colors = getPersonaColors(persona);
  
  return {
    '--persona-primary': colors.primary,
    '--persona-primary-hover': colors.primaryHover,
    '--persona-primary-light': colors.primaryLight,
    '--persona-primary-dark': colors.primaryDark,
    '--persona-accent': colors.accent,
    '--persona-accent-hover': colors.accentHover,
    '--persona-accent-light': colors.accentLight,
    '--persona-accent-dark': colors.accentDark,
    '--persona-border': colors.border,
    '--persona-border-light': colors.borderLight,
    '--persona-text-primary': colors.textPrimary,
    '--persona-text-secondary': colors.textSecondary,
    '--persona-text-accent': colors.textAccent,
    '--persona-success': colors.success,
    '--persona-warning': colors.warning,
    '--persona-error': colors.error,
    '--persona-badge-bg': colors.badgeBackground,
    '--persona-badge-text': colors.badgeText,
    '--persona-badge-border': colors.badgeBorder
  };
}

/**
 * Apply persona colors to document root
 */
export function applyPersonaColors(persona: PersonaType): void {
  const variables = generatePersonaCSSVariables(persona);
  const root = document.documentElement;
  
  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

/**
 * Get tailwind classes for persona styling
 */
export function getPersonaTailwindClasses(persona: PersonaType) {
  const colors = getPersonaColors(persona);
  return colors.tailwind;
}
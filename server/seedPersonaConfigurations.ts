/**
 * Persona Configuration Seeder
 * Consolidates all scattered persona-related fallback configurations into ConfigService
 * Following replit.md "NO HARD-CODING" principle
 */

import { ConfigService } from './configService';

export async function seedPersonaConfigurations(userId: string = 'system') {
  console.log('🎭 Seeding Persona configurations using ConfigService...');
  
  try {
    // 1. Persona Color Schemes - replaces FALLBACK_PERSONA_COLOR_SCHEMES
    const personaColorSchemes = {
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
        // Sarah Wilson (Claims Agent) - Rose/Pink theme
        primary: '#EC4899', // pink-500
        primaryHover: '#DB2777', // pink-600
        primaryLight: '#F9A8D4', // pink-300
        primaryDark: '#BE185D', // pink-700
        
        accent: '#F43F5E', // rose-500
        accentHover: '#E11D48', // rose-600
        accentLight: '#FDA4AF', // rose-300
        accentDark: '#BE123C', // rose-700
        
        gradientFrom: '#BE185D', // pink-700
        gradientTo: '#BE123C', // rose-700
        cardGradient: 'from-pink-900/20 to-rose-900/20',
        
        border: '#EC4899', // pink-500
        borderLight: '#F9A8D4', // pink-300
        
        textPrimary: '#FFFFFF',
        textSecondary: '#E2E8F0', // slate-200
        textAccent: '#FDA4AF', // rose-300
        
        success: '#10B981', // emerald-500
        warning: '#F59E0B', // amber-500
        error: '#EF4444', // red-500
        
        badgeBackground: '#BE185D20', // pink-700 with opacity
        badgeText: '#F9A8D4', // pink-300
        badgeBorder: '#EC4899', // pink-500
        
        tailwind: {
          primary: 'pink',
          accent: 'rose',
          gradient: 'from-pink-700 to-rose-700',
          border: 'border-pink-500',
          badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30'
        }
      }
    };

    await ConfigService.setSetting(
      'persona-color-schemes.config',
      personaColorSchemes,
      {}, // Global scope
      new Date(),
      undefined,
      userId
    );

    // 2. Persona Directory - replaces FALLBACK_PERSONAS
    const personaDirectory = {
      personas: [
        {
          key: 'admin',
          name: 'Admin (Jarvis)',
          displayName: 'Jarvis Admin (System Administrator)',
          icon: 'Shield',
          badge: 'A',
          agentRole: 'System Administrator',
          department: 'Technology',
          description: 'Full system access, agent creation, configuration management',
          accessLevel: 'admin'
        },
        {
          key: 'rachel',
          name: 'Rachel (AUW)',
          displayName: 'Rachel Thompson (Assistant UW)',
          icon: 'Building2',
          badge: 'R',
          agentRole: 'Assistant Underwriter',
          department: 'Underwriting',
          description: 'Commercial property underwriting, submission management',
          accessLevel: 'advanced'
        },
        {
          key: 'john',
          name: 'John (IT Support)',
          displayName: 'John Stevens (IT Support)',
          icon: 'Wrench',
          badge: 'J',
          agentRole: 'IT Support Analyst',
          department: 'IT Support',
          description: 'System monitoring, incident management, technical operations',
          accessLevel: 'advanced'
        },
        {
          key: 'broker',
          name: 'Mike (Broker)',
          displayName: 'Mike Stevens (Insurance Broker)',
          icon: 'Target',
          badge: 'M',
          agentRole: 'Insurance Broker',
          department: 'Sales',
          description: 'Insurance broker workflows and client management',
          accessLevel: 'standard'
        },
        {
          key: 'sarah',
          name: 'Sarah (Claims)',
          displayName: 'Sarah Wilson (Claims Agent)',
          icon: 'UserCheck',
          badge: 'S',
          agentRole: 'Claims Agent',
          department: 'Claims',
          description: 'Claims processing and management',
          accessLevel: 'standard'
        }
      ]
    };

    await ConfigService.setSetting(
      'persona.directory',
      personaDirectory,
      {}, // Global scope
      new Date(),
      undefined,
      userId
    );

    // 3. UI Status Colors - replaces scattered FALLBACK_STATUS_COLORS
    const statusColors = {
      agent: {
        active: 'bg-green-500/20 text-green-400 border-green-500/30',
        inactive: 'bg-red-500/20 text-red-400 border-red-500/30',
        maintenance: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      },
      governance: {
        compliant: 'bg-green-500/20 text-green-400 border-green-500/30',
        pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        risk: 'bg-red-500/20 text-red-400 border-red-500/30'
      },
      riskLevel: {
        low: 'bg-green-500/20 text-green-400 border-green-500/30',
        medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        high: 'bg-red-500/20 text-red-400 border-red-500/30',
        critical: 'bg-red-600/20 text-red-300 border-red-600/30'
      },
      compliance: {
        'fully-compliant': 'bg-green-500/20 text-green-400 border-green-500/30',
        'partially-compliant': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'non-compliant': 'bg-red-500/20 text-red-400 border-red-500/30',
        'pending': 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      }
    };

    await ConfigService.setSetting(
      'ui.status-colors',
      statusColors,
      {}, // Global scope
      new Date(),
      undefined,
      userId
    );

    // 4. Layer Icons and Colors - replaces FALLBACK_LAYER_ICONS and FALLBACK_LAYER_COLORS
    const layerConfiguration = {
      icons: {
        'Experience': 'Globe',
        'Meta Brain': 'Bot',
        'Role': 'Users',
        'Process': 'Cpu',
        'System': 'Database',
        'Interface': 'Globe'
      },
      colors: {
        'Experience': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        'Meta Brain': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'Role': 'bg-green-500/20 text-green-400 border-green-500/30',
        'Process': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        'System': 'bg-red-500/20 text-red-400 border-red-500/30',
        'Interface': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
      }
    };

    await ConfigService.setSetting(
      'ui.layer-configuration',
      layerConfiguration,
      {}, // Global scope
      new Date(),
      undefined,
      userId
    );

    // 5. Maturity Levels - replaces MATURITY_LEVELS
    const maturityLevels = {
      0: { label: 'Initial', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
      1: { label: 'Managed', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      2: { label: 'Defined', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
      3: { label: 'Measured', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      4: { label: 'Optimized', color: 'bg-green-500/20 text-green-400 border-green-500/30' }
    };

    await ConfigService.setSetting(
      'ui.maturity-levels',
      maturityLevels,
      {}, // Global scope
      new Date(),
      undefined,
      userId
    );

    // 6. EU AI Act Risk Categories - replaces EU_AI_ACT_RISK_CATEGORIES
    const euAiActRiskCategories = {
      'prohibited': { 
        label: 'Prohibited', 
        color: 'bg-red-500/20 text-red-400 border-red-500/30',
        description: 'Systems with unacceptable risk'
      },
      'high-risk': { 
        label: 'High Risk', 
        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        description: 'Systems requiring strict compliance measures'
      },
      'limited': { 
        label: 'Limited Risk', 
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        description: 'Systems with transparency obligations'
      },
      'minimal': { 
        label: 'Minimal Risk', 
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        description: 'Systems with minimal regulatory requirements'
      }
    };

    await ConfigService.setSetting(
      'compliance.eu-ai-act-risk-categories',
      euAiActRiskCategories,
      {}, // Global scope
      new Date(),
      undefined,
      userId
    );

    console.log('✅ Persona configurations seeded successfully');
    return true;

  } catch (error) {
    console.error('❌ Error seeding persona configurations:', error);
    throw error;
  }
}
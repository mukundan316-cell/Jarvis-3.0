import { db } from './db';
import { tabConfigurations } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function seedTabConfigurations() {
  try {
    console.log('🎯 Starting tab configurations seeding...');

    // Define command center tab configurations
    const commandCenterTabs = [
      {
        tabKey: 'overview',
        tabName: 'Overview',
        tabType: 'command_center' as const,
        icon: 'Activity',
        description: 'System overview and status dashboard',
        order: 1,
        isVisible: true,
        isActive: true,
        personaAccess: ['admin', 'rachel', 'john', 'broker'],
        configurationKeys: ['dashboard.refresh-interval', 'overview.show-metrics'],
        contentConfig: {
          features: ['system-metrics', 'agent-status', 'real-time-monitoring']
        }
      },
    {
      tabKey: 'agent-directory',
      tabName: 'Agent Directory',
      tabType: 'command_center' as const,
      icon: 'Bot',
      description: 'Browse and manage AI agents',
      order: 2,
      isVisible: true,
      isActive: true,
      personaAccess: ['admin', 'rachel'],
      configurationKeys: ['agents.default-view', 'agents.show-performance'],
      contentConfig: {
        features: ['agent-browser', 'agent-management', 'permissions'],
        isBeta: true
      }
    },
    {
      tabKey: 'agent-visibility',
      tabName: 'Agent Visibility',
      tabType: 'command_center' as const,
      icon: 'Eye',
      description: 'Configure agent visibility rules',
      order: 3,
      isVisible: true,
      isActive: true,
      personaAccess: ['admin'],
      configurationKeys: ['agent-visibility.auto-apply', 'agent-visibility.strict-mode'],
      contentConfig: {
        features: ['visibility-rules', 'layer-filtering', 'persona-access']
      }
    },
    {
      tabKey: 'integrations',
      tabName: 'Integrations',
      tabType: 'command_center' as const,
      icon: 'Network',
      description: 'External system integrations',
      order: 4,
      isVisible: true,
      isActive: true,
      personaAccess: ['admin', 'rachel'],
      configurationKeys: ['integrations.auto-sync', 'integrations.retry-count'],
      contentConfig: {
        features: ['api-connections', 'webhooks', 'data-sync']
      }
    },
    {
      tabKey: 'ai-governance',
      tabName: 'AI Governance Suite',
      tabType: 'command_center' as const,
      icon: 'Shield',
      description: 'AI governance and compliance management',
      order: 5,
      isVisible: true,
      isActive: true,
      personaAccess: ['admin'],
      configurationKeys: ['governance.auto-scan', 'governance.alert-threshold'],
      contentConfig: {
        features: ['risk-assessment', 'audit-trails', 'bias-detection']
      }
    },
    {
      tabKey: 'performance',
      tabName: 'Performance',
      tabType: 'command_center' as const,
      icon: 'Activity',
      description: 'System performance metrics',
      order: 6,
      isVisible: true,
      isActive: true,
      personaAccess: ['admin', 'rachel', 'john'],
      configurationKeys: ['dashboard.performance-alerts'],
      contentConfig: {
        refreshInterval: 30
      }
    },
    {
      tabKey: 'analytics',
      tabName: 'Analytics',
      tabType: 'command_center' as const,
      icon: 'TrendingUp',
      description: 'Business analytics and insights',
      order: 7,
      isVisible: true,
      isActive: true,
      personaAccess: ['admin', 'rachel', 'john', 'broker'],
      configurationKeys: ['analytics.retention-days', 'analytics.auto-refresh'],
      contentConfig: {
        chartTypes: ['line', 'bar', 'pie']
      }
    }
  ];

  // All tabs are now in the commandCenterTabs array above

    // Insert command center tabs
    for (const tab of commandCenterTabs) {
      // Check if tab already exists
      const existing = await db.select().from(tabConfigurations).where(eq(tabConfigurations.tabKey, tab.tabKey)).limit(1);
      
      if (existing.length === 0) {
        await db.insert(tabConfigurations).values([tab]);
        console.log(`✅ Created tab configuration: ${tab.tabName} (${tab.tabKey})`);
      } else {
        console.log(`⏭️  Tab configuration already exists: ${tab.tabName} (${tab.tabKey})`);
      }
    }

    // All tabs are now handled in the command center tabs loop above

    console.log('🎯 Tab configurations seeding completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error seeding tab configurations:', error);
    throw error;
  }
}

// Function to update existing tab configuration
export async function updateTabConfiguration(tabKey: string, updates: any) {
  try {
    await db.update(tabConfigurations)
      .set(updates)
      .where(eq(tabConfigurations.tabKey, tabKey));
    console.log(`✅ Updated tab configuration: ${tabKey}`);
  } catch (error) {
    console.error(`❌ Error updating tab configuration ${tabKey}:`, error);
    throw error;
  }
}

// Function to disable a tab
export async function disableTab(tabKey: string) {
  return updateTabConfiguration(tabKey, { isActive: false });
}

// Function to enable a tab
export async function enableTab(tabKey: string) {
  return updateTabConfiguration(tabKey, { isActive: true });
}
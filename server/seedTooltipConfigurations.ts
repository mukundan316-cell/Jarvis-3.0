import { ConfigService } from './configService';

/**
 * Seed tooltip configurations for database-driven tooltip content management
 * Follows replit.md NO HARD-CODING principle by storing all tooltip content in ConfigService
 */
export async function seedTooltipConfigurations() {
  console.log('🎯 Seeding tooltip configurations via ConfigService...');

  const tooltipConfigurations = [
    // Agent Directory tooltips
    {
      key: 'agent.version.badge',
      value: {
        content: 'Agent version information',
        variant: 'compact',
        side: 'top',
        delayDuration: 300,
        richContent: {
          title: 'Version Control',
          description: 'Track agent configuration changes and rollback capabilities',
          icon: 'GitBranch'
        }
      },
      scope: {},
      description: 'Version badge tooltip for agent version indicators'
    },
    {
      key: 'agent.unsaved.changes',
      value: {
        content: 'Configuration has unsaved changes',
        variant: 'compact',
        side: 'top',
        delayDuration: 200,
        richContent: {
          title: 'Unsaved Changes',
          description: 'This agent has configuration modifications that haven\'t been saved',
          icon: 'AlertOctagon',
          badge: 'WARNING',
          shortcut: 'Ctrl+S to save'
        }
      },
      scope: {},
      description: 'Unsaved changes indicator tooltip'
    },
    {
      key: 'agent.version.history',
      value: {
        content: 'View version history',
        variant: 'compact',
        side: 'top',
        delayDuration: 300,
        richContent: {
          title: 'Version History',
          description: 'Browse previous versions and restore configurations',
          icon: 'History',
          details: [
            { label: 'Action', value: 'Click to view' },
            { label: 'Access', value: 'Admin level' }
          ]
        }
      },
      scope: {},
      description: 'Version history button tooltip'
    },
    {
      key: 'showcase.mode.toggle',
      value: {
        content: 'Toggle between realistic and enhanced demo data',
        variant: 'default',
        side: 'top',
        delayDuration: 250,
        richContent: {
          title: 'Showcase Mode',
          description: 'Switch between production data and enhanced demonstration scenarios',
          icon: 'Sparkles',
          details: [
            { label: 'Realistic', value: 'Live system data' },
            { label: 'Enhanced', value: 'Optimized scenarios' }
          ]
        }
      },
      scope: {},
      description: 'Showcase mode toggle button tooltip'
    },

    // Showcase Mode Scenario Tooltips - Clean dropdown experience
    {
      key: 'scenario.peak.performance',
      value: {
        content: 'Optimized for maximum efficiency with 40% better CPU/Memory usage, 5% higher success rates, and faster response times',
        variant: 'default',
        side: 'right',
        maxWidth: 320,
        delayDuration: 300,
        richContent: {
          title: 'Peak Performance Mode',
          description: 'Maximum efficiency configuration',
          icon: 'Zap',
          details: [
            { label: 'CPU Efficiency', value: '+40%' },
            { label: 'Success Rate', value: '+5%' },
            { label: 'Response Time', value: 'Faster' }
          ]
        }
      },
      scope: {},
      description: 'Peak Performance scenario tooltip for dropdown'
    },
    {
      key: 'scenario.high.volume',
      value: {
        content: 'High throughput configuration with 50% more throughput, optimized for bulk operations',
        variant: 'default',
        side: 'right',
        maxWidth: 320,
        delayDuration: 300,
        richContent: {
          title: 'High-Volume Processing',
          description: 'Optimized for bulk operations',
          icon: 'Flame',
          details: [
            { label: 'Throughput', value: '+50%' },
            { label: 'Batch Size', value: 'Large' },
            { label: 'Processing', value: 'Parallel' }
          ]
        }
      },
      scope: {},
      description: 'High Volume scenario tooltip for dropdown'
    },
    {
      key: 'scenario.cost.optimization',
      value: {
        content: 'Efficiency-focused with 25% better resource efficiency and improved cost effectiveness',
        variant: 'default',
        side: 'right',
        maxWidth: 320,
        delayDuration: 300,
        richContent: {
          title: 'Cost Optimization Focus',
          description: 'Resource-efficient configuration',
          icon: 'DollarSign',
          details: [
            { label: 'Resource Efficiency', value: '+25%' },
            { label: 'Cost Savings', value: 'Optimized' },
            { label: 'Usage', value: 'Smart allocation' }
          ]
        }
      },
      scope: {},
      description: 'Cost Optimization scenario tooltip for dropdown'
    },
    {
      key: 'scenario.zero.downtime',
      value: {
        content: 'Maximum reliability with 100% uptime and optimized for continuous operations',
        variant: 'default',
        side: 'right',
        maxWidth: 320,
        delayDuration: 300,
        richContent: {
          title: 'Zero-Downtime Deployment',
          description: 'Maximum reliability configuration',
          icon: 'Shield',
          details: [
            { label: 'Uptime', value: '100%' },
            { label: 'Reliability', value: 'Maximum' },
            { label: 'Operations', value: 'Continuous' }
          ]
        }
      },
      scope: {},
      description: 'Zero Downtime scenario tooltip for dropdown'
    },

    // Persona-specific tooltip overrides
    {
      key: 'agent.version.badge',
      value: {
        content: 'Agent version with underwriting context',
        variant: 'compact',
        side: 'top',
        richContent: {
          title: 'UW Agent Version',
          description: 'Underwriting agent configuration version for risk assessment workflows',
          icon: 'GitBranch',
          badge: 'UW'
        }
      },
      scope: { persona: 'rachel' },
      description: 'Version badge tooltip customized for Rachel Thompson (AUW)'
    },
    {
      key: 'agent.version.badge',
      value: {
        content: 'System agent version for IT operations',
        variant: 'compact',
        side: 'top',
        richContent: {
          title: 'IT System Version',
          description: 'Technical agent configuration for infrastructure monitoring and support',
          icon: 'GitBranch',
          badge: 'IT'
        }
      },
      scope: { persona: 'john' },
      description: 'Version badge tooltip customized for John Stevens (IT Support)'
    },

    // Rich tooltip examples for complex UI elements
    {
      key: 'agent.execution.status',
      value: {
        content: 'Agent execution monitoring',
        variant: 'rich',
        side: 'right',
        maxWidth: 350,
        richContent: {
          title: 'Execution Monitor',
          description: 'Real-time agent performance metrics and status indicators',
          icon: 'Activity',
          details: [
            { label: 'Response Time', value: '< 2s avg' },
            { label: 'Success Rate', value: '99.2%' },
            { label: 'Last Update', value: 'Live' }
          ],
          shortcut: 'Alt+E for details'
        }
      },
      scope: {},
      description: 'Detailed execution status tooltip for agent monitoring'
    },
    {
      key: 'agent.governance.risk',
      value: {
        content: 'AI governance and risk assessment',
        variant: 'enhanced',
        side: 'left',
        maxWidth: 400,
        richContent: {
          title: 'Governance Overview',
          description: 'EU AI Act compliance status and risk assessment metrics',
          icon: 'Shield',
          badge: 'COMPLIANT',
          details: [
            { label: 'Risk Level', value: 'Low' },
            { label: 'Compliance', value: '94%' },
            { label: 'Last Audit', value: '2 days ago' }
          ]
        }
      },
      scope: {},
      description: 'Governance and compliance tooltip for AI risk management'
    },

    // Workflow-specific tooltips
    {
      key: 'workflow.commercial.property',
      value: {
        content: 'Commercial property underwriting workflow',
        variant: 'default',
        side: 'bottom',
        richContent: {
          title: 'CP Underwriting',
          description: 'Automated COPE data analysis and risk assessment workflow',
          icon: 'Building',
          details: [
            { label: 'Process', value: 'COPE Analysis' },
            { label: 'Duration', value: '5-8 minutes' },
            { label: 'Accuracy', value: '96.8%' }
          ]
        }
      },
      scope: { workflowId: 1 },
      description: 'Commercial property workflow tooltip'
    }
  ];

  try {
    for (const config of tooltipConfigurations) {
      await ConfigService.setSetting(
        `tooltip.${config.key}`,
        config.value,
        config.scope,
        new Date(),
        undefined,
        'system_seed'
      );
      console.log(`✅ Seeded tooltip config: tooltip.${config.key}`);
    }

    console.log(`🎯 Successfully seeded ${tooltipConfigurations.length} tooltip configurations`);
    return { success: true, count: tooltipConfigurations.length };
  } catch (error) {
    console.error('❌ Error seeding tooltip configurations:', error);
    return { success: false, error };
  }
}
/**
 * Showcase Enhancement Functions
 * Phase 1: Agent Lifecycle Database Foundation and Version Control
 * 
 * These functions enhance agent and system data for demonstration purposes,
 * providing optimized scenarios that showcase platform capabilities without
 * compromising actual production data integrity.
 */

interface AgentVersionMetrics {
  currentVersion: string;
  versionCount: number;
  deploymentFrequency: number; // versions per week
  rollbackRate: number; // percentage
  configStability: number; // stability score 0-100
  lastRollback?: string;
  avgTimeToRollback?: number; // minutes
}

interface AgentPerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  responseTime: number;
  successRate: number;
  throughput: number;
  errorRate: number;
  uptime: number;
  costEfficiency: number;
}

interface OptimalScenario {
  name: string;
  description: string;
  agentEnhancements: Array<{
    agentId: number;
    enhancedMetrics: Partial<AgentPerformanceMetrics>;
    showcaseFeatures: string[];
  }>;
  systemMetrics: {
    totalAgents: number;
    activeAgents: number;
    systemUptime: number;
    avgResponseTime: number;
    totalCostSavings: number;
  };
}

/**
 * Enhance version control metrics for showcase mode
 * Provides realistic but optimized version control statistics
 */
export function enhanceVersionControlMetrics(
  agentId: number, 
  baseMetrics?: Partial<AgentVersionMetrics>
): AgentVersionMetrics {
  const enhanced: AgentVersionMetrics = {
    currentVersion: baseMetrics?.currentVersion || '2.4.1',
    versionCount: baseMetrics?.versionCount || Math.floor(Math.random() * 20) + 10, // 10-30 versions
    deploymentFrequency: baseMetrics?.deploymentFrequency || Math.random() * 3 + 1, // 1-4 per week
    rollbackRate: baseMetrics?.rollbackRate || Math.random() * 5 + 2, // 2-7%
    configStability: baseMetrics?.configStability || Math.floor(Math.random() * 20) + 80, // 80-100%
    lastRollback: baseMetrics?.lastRollback || generateRandomDate(-30, -7), // 7-30 days ago
    avgTimeToRollback: baseMetrics?.avgTimeToRollback || Math.floor(Math.random() * 15) + 5 // 5-20 minutes
  };

  // Apply showcase optimizations
  if (enhanced.configStability < 85) enhanced.configStability = 85;
  if (enhanced.rollbackRate > 8) enhanced.rollbackRate = Math.random() * 3 + 2;
  if (enhanced.deploymentFrequency < 1.5) enhanced.deploymentFrequency = Math.random() * 2 + 1.5;

  return enhanced;
}

/**
 * Enhance agent performance metrics for showcase mode
 * Provides optimized performance indicators that demonstrate system efficiency
 */
export function enhanceAgentPerformance(
  agentId: number,
  agentType: string,
  baseMetrics?: Partial<AgentPerformanceMetrics>
): AgentPerformanceMetrics {
  // Base performance by agent type
  const typeMultipliers = {
    'AUW': { cpu: 0.7, memory: 0.8, responseTime: 0.6, successRate: 1.05 },
    'Claims Processing': { cpu: 0.8, memory: 0.9, responseTime: 0.7, successRate: 1.03 },
    'System Agent': { cpu: 0.6, memory: 0.7, responseTime: 0.5, successRate: 1.02 },
    'Voice Interface': { cpu: 0.9, memory: 0.8, responseTime: 0.8, successRate: 1.01 },
    'default': { cpu: 0.8, memory: 0.8, responseTime: 0.8, successRate: 1.0 }
  };

  const multiplier = typeMultipliers[agentType as keyof typeof typeMultipliers] || typeMultipliers.default;

  const enhanced: AgentPerformanceMetrics = {
    cpuUsage: Math.min(95, (baseMetrics?.cpuUsage || Math.random() * 60 + 20) * multiplier.cpu),
    memoryUsage: Math.min(90, (baseMetrics?.memoryUsage || Math.random() * 50 + 25) * multiplier.memory),
    responseTime: Math.max(50, (baseMetrics?.responseTime || Math.random() * 800 + 200) * multiplier.responseTime),
    successRate: Math.min(99.9, (baseMetrics?.successRate || Math.random() * 10 + 85) * multiplier.successRate),
    throughput: baseMetrics?.throughput || Math.floor(Math.random() * 500) + 100, // requests per minute
    errorRate: Math.max(0.1, (baseMetrics?.errorRate || Math.random() * 5 + 1) / multiplier.successRate),
    uptime: Math.max(95, baseMetrics?.uptime || Math.random() * 5 + 95), // 95-100%
    costEfficiency: baseMetrics?.costEfficiency || Math.random() * 20 + 80 // 80-100
  };

  // Apply showcase optimizations
  if (enhanced.cpuUsage > 85) enhanced.cpuUsage = Math.random() * 25 + 60;
  if (enhanced.memoryUsage > 80) enhanced.memoryUsage = Math.random() * 20 + 60;
  if (enhanced.successRate < 90) enhanced.successRate = Math.random() * 9 + 90;
  if (enhanced.errorRate > 3) enhanced.errorRate = Math.random() * 2 + 0.5;
  if (enhanced.uptime < 98) enhanced.uptime = Math.random() * 2 + 98;

  return enhanced;
}

/**
 * Generate optimal scenarios for showcase demonstrations
 * Creates realistic scenarios that highlight different platform capabilities
 */
export function generateOptimalScenarios(): OptimalScenario[] {
  return [
    {
      name: "Peak Performance Mode",
      description: "Optimized configuration showing maximum system efficiency and minimal resource usage",
      agentEnhancements: [
        {
          agentId: 1,
          enhancedMetrics: {
            cpuUsage: 45,
            memoryUsage: 35,
            responseTime: 120,
            successRate: 99.7,
            uptime: 99.9,
            costEfficiency: 95
          },
          showcaseFeatures: ["Low Resource Usage", "High Success Rate", "Optimal Response Time"]
        },
        {
          agentId: 2,
          enhancedMetrics: {
            cpuUsage: 38,
            memoryUsage: 42,
            responseTime: 95,
            successRate: 99.5,
            uptime: 99.8,
            costEfficiency: 92
          },
          showcaseFeatures: ["Ultra-Fast Response", "Maximum Uptime", "Cost Optimized"]
        }
      ],
      systemMetrics: {
        totalAgents: 24,
        activeAgents: 24,
        systemUptime: 99.9,
        avgResponseTime: 105,
        totalCostSavings: 450000
      }
    },
    {
      name: "High-Volume Processing",
      description: "Configuration optimized for handling large volumes with excellent throughput",
      agentEnhancements: [
        {
          agentId: 1,
          enhancedMetrics: {
            throughput: 850,
            cpuUsage: 72,
            memoryUsage: 68,
            responseTime: 180,
            successRate: 99.2,
            uptime: 99.6,
            costEfficiency: 88
          },
          showcaseFeatures: ["High Throughput", "Scalable Processing", "Load Balanced"]
        }
      ],
      systemMetrics: {
        totalAgents: 28,
        activeAgents: 26,
        systemUptime: 99.7,
        avgResponseTime: 165,
        totalCostSavings: 380000
      }
    },
    {
      name: "Cost Optimization Focus",
      description: "Maximum cost efficiency while maintaining excellent service quality",
      agentEnhancements: [
        {
          agentId: 1,
          enhancedMetrics: {
            costEfficiency: 97,
            cpuUsage: 55,
            memoryUsage: 48,
            responseTime: 140,
            successRate: 99.3,
            uptime: 99.5
          },
          showcaseFeatures: ["Maximum Cost Efficiency", "Resource Optimization", "Smart Scaling"]
        }
      ],
      systemMetrics: {
        totalAgents: 22,
        activeAgents: 20,
        systemUptime: 99.5,
        avgResponseTime: 135,
        totalCostSavings: 520000
      }
    },
    {
      name: "Zero-Downtime Deployment",
      description: "Showcase seamless updates and version control with no service interruption",
      agentEnhancements: [
        {
          agentId: 1,
          enhancedMetrics: {
            uptime: 100.0,
            successRate: 99.8,
            responseTime: 110,
            cpuUsage: 62,
            memoryUsage: 58,
            costEfficiency: 90
          },
          showcaseFeatures: ["Zero Downtime", "Seamless Updates", "Version Control", "Auto-Rollback"]
        }
      ],
      systemMetrics: {
        totalAgents: 25,
        activeAgents: 25,
        systemUptime: 100.0,
        avgResponseTime: 115,
        totalCostSavings: 425000
      }
    }
  ];
}

/**
 * Enhanced data fetching that applies showcase optimizations only to display layer
 * Preserves actual data integrity while providing enhanced visualization
 */
export function applyShowcaseEnhancements(
  agentData: any[], 
  scenarioName?: string,
  showcaseEnabled: boolean = false
): any[] {
  if (!showcaseEnabled) {
    return agentData;
  }

  const scenario = scenarioName 
    ? generateOptimalScenarios().find(s => s.name === scenarioName)
    : generateOptimalScenarios()[0];

  return agentData.map(agent => {
    const enhancement = scenario?.agentEnhancements.find(e => e.agentId === agent.id);
    
    if (!enhancement) {
      return {
        ...agent,
        // Apply general showcase optimizations
        ...enhanceAgentPerformance(agent.id, agent.type),
        versionMetrics: enhanceVersionControlMetrics(agent.id)
      };
    }

    return {
      ...agent,
      ...enhancement.enhancedMetrics,
      versionMetrics: enhanceVersionControlMetrics(agent.id),
      showcaseFeatures: enhancement.showcaseFeatures,
      isShowcaseEnhanced: true
    };
  });
}

/**
 * Generate random date within a range (for realistic test data)
 */
function generateRandomDate(minDaysAgo: number, maxDaysAgo: number): string {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * (maxDaysAgo - minDaysAgo)) + minDaysAgo;
  const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  return date.toISOString();
}

/**
 * Showcase enhancement multipliers based on ConfigService settings
 */
export async function getShowcaseMultipliers(): Promise<Record<string, number>> {
  // These would typically come from ConfigService but providing defaults
  return {
    performanceBoost: 1.15, // 15% performance improvement
    costReduction: 1.25,    // 25% cost efficiency improvement
    uptimeBoost: 1.02,      // 2% uptime improvement
    responseTimeImprovement: 0.75, // 25% faster response times
    errorReduction: 0.4,    // 60% error rate reduction
    throughputBoost: 1.3    // 30% throughput increase
  };
}
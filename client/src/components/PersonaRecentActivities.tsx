import { useState, useEffect } from 'react';
import { Activity, User, Wrench, FileText, Shield, Database, Cpu, Wifi } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STATUS_COLORS = {
  success: 'bg-green-500',
  processing: 'bg-blue-500',
  error: 'bg-red-500',
  info: 'bg-purple-500',
  warning: 'bg-yellow-500'
};

const STATUS_TEXT_COLORS = {
  success: 'text-green-400',
  processing: 'text-blue-400',
  error: 'text-red-400',
  info: 'text-purple-400',
  warning: 'text-yellow-400'
};

const PERSONA_FILTERS = {
  rachel: {
    keywords: ['auw', 'underwriting', 'submission', 'risk', 'quote', 'policy', 'claims', 'assessment'],
    agentTypes: ['AUW Agent', 'Risk Assessment Agent', 'Document Analysis Agent', 'Claims Processing Agent'],
    title: 'AUW Activities',
    icon: FileText,
    color: 'blue'
  },
  john: {
    keywords: ['it', 'support', 'incident', 'ticket', 'system', 'network', 'server', 'maintenance', 'security'],
    agentTypes: ['IT Support Agent', 'System Monitor Agent', 'Network Analysis Agent', 'Security Agent'],
    title: 'Recent IT Activities',
    icon: Wrench,
    color: 'orange'
  }
};

const getAgentIcon = (agentName: string) => {
  if (agentName.toLowerCase().includes('risk') || agentName.toLowerCase().includes('auw')) {
    return FileText;
  } else if (agentName.toLowerCase().includes('security')) {
    return Shield;
  } else if (agentName.toLowerCase().includes('database')) {
    return Database;
  } else if (agentName.toLowerCase().includes('system')) {
    return Cpu;
  } else if (agentName.toLowerCase().includes('network')) {
    return Wifi;
  }
  return Activity;
};

interface PersonaRecentActivitiesProps {
  persona: 'rachel' | 'john';
}

// Global activity storage for each persona
const personaActivities = {
  john: [] as any[],
  rachel: [] as any[]
};

export function PersonaRecentActivities({ persona }: PersonaRecentActivitiesProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const personaConfig = PERSONA_FILTERS[persona];
  const IconComponent = personaConfig.icon;

  // Generate initial persona-specific activities
  const generateInitialActivities = () => {
    if (persona === 'john') {
      return [
        {
          id: 'it-1',
          activity: 'Resolved critical server outage in datacenter',
          agentName: 'IT Support Agent',
          status: 'success',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
          id: 'it-2', 
          activity: 'Updated security patches on production systems',
          agentName: 'Security Agent',
          status: 'success',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        },
        {
          id: 'it-3',
          activity: 'Network monitoring detected anomaly in traffic',
          agentName: 'Network Analysis Agent',
          status: 'warning',
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString()
        },
        {
          id: 'it-4',
          activity: 'Database backup completed successfully',
          agentName: 'System Monitor Agent',
          status: 'success',
          timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString()
        },
        {
          id: 'it-5',
          activity: 'User access permissions updated for new employee',
          agentName: 'IT Support Agent',
          status: 'success',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
        },
        {
          id: 'it-6',
          activity: 'System maintenance window scheduled for weekend',
          agentName: 'System Monitor Agent',
          status: 'info',
          timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString()
        },
        {
          id: 'it-7',
          activity: 'Firewall rules updated to block suspicious IPs',
          agentName: 'Security Agent',
          status: 'success',
          timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString()
        },
        {
          id: 'it-8',
          activity: 'Help desk ticket TK-2024-1547 closed',
          agentName: 'IT Support Agent',
          status: 'success',
          timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString()
        }
      ];
    } else {
      // Rachel's AUW activities
      return [
        {
          id: 'auw-1',
          activity: 'Risk assessment completed for Policy #POL-2024-3847',
          agentName: 'AUW Agent',
          status: 'success',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        },
        {
          id: 'auw-2',
          activity: 'Document analysis found missing certificates',
          agentName: 'Document Analysis Agent',
          status: 'warning',
          timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString()
        },
        {
          id: 'auw-3',
          activity: 'Quote generated for commercial property submission',
          agentName: 'Risk Assessment Agent',
          status: 'success',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: 'auw-4',
          activity: 'Claims history review flagged high-risk property',
          agentName: 'Claims Processing Agent',
          status: 'error',
          timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString()
        },
        {
          id: 'auw-5',
          activity: 'Underwriting decision approved for small business',
          agentName: 'Assistant Underwriter Agent',
          status: 'success',
          timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString()
        },
        {
          id: 'auw-6',
          activity: 'Policy renewal notification sent to broker',
          agentName: 'Document Analysis Agent',
          status: 'info',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
        }
      ];
    }
  };

  // Initialize activities on mount
  useEffect(() => {
    if (personaActivities[persona].length === 0) {
      personaActivities[persona] = generateInitialActivities();
    }
    setActivities([...personaActivities[persona]]);
  }, [persona]);

  // Function to add new activity when agent is executed
  const addNewActivity = (activity: any) => {
    const newActivity = {
      ...activity,
      id: `${persona}-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    personaActivities[persona].unshift(newActivity);
    personaActivities[persona] = personaActivities[persona].slice(0, 8); // Keep only last 8
    setActivities([...personaActivities[persona]]);
  };

  // Expose addNewActivity function globally for agent executions
  useEffect(() => {
    (window as any)[`add${persona.charAt(0).toUpperCase() + persona.slice(1)}Activity`] = addNewActivity;
    return () => {
      delete (window as any)[`add${persona.charAt(0).toUpperCase() + persona.slice(1)}Activity`];
    };
  }, [persona]);

  const filteredActivities = activities;

  return (
    <Card className={`bg-slate-900/50 border-${personaConfig.color}-500/30`} data-persona={persona}>
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <IconComponent className={`w-5 h-5 text-${personaConfig.color}-400`} />
          <span>{personaConfig.title}</span>
          <Badge variant="outline" className="ml-2 text-xs">
            {filteredActivities.length} items
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <IconComponent className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p>No recent {persona === 'rachel' ? 'underwriting' : 'IT support'} activities</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredActivities.map((activity: any) => {
              const AgentIcon = getAgentIcon(activity.agentName || '');
              
              return (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  {/* Status indicator */}
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        STATUS_COLORS[activity.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.info
                      }`}
                    />
                  </div>

                  {/* Agent icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    <AgentIcon className={`w-4 h-4 text-${personaConfig.color}-400`} />
                  </div>

                  {/* Activity content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {activity.activity}
                    </p>
                    {activity.agentName && (
                      <p className="text-xs text-gray-400 mt-1">
                        Agent: {activity.agentName}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`text-xs font-medium ${
                          STATUS_TEXT_COLORS[activity.status as keyof typeof STATUS_TEXT_COLORS] || 
                          STATUS_TEXT_COLORS.info
                        }`}
                      >
                        {activity.status || 'completed'}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
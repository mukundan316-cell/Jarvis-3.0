import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MousePointer, Clock, BarChart3, Users, Activity, TrendingUp, Eye, Filter } from 'lucide-react';

interface HeatmapPoint {
  x: number;
  y: number;
  count: number;
  intensity?: number;
}

interface UserJourneyInteraction {
  id: number;
  userId: string;
  sessionId: string;
  persona: string;
  interactionType: string;
  targetElement: string;
  commandInput?: string;
  workflowStep?: string;
  duration?: number;
  coordinates?: { x: number; y: number };
  viewport?: { width: number; height: number };
  metadata?: any;
  timestamp: string;
}

interface JourneySession {
  id: number;
  userId: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  totalDuration?: number;
  personaSwitches: number;
  commandsExecuted: number;
  workflowsCompleted: number;
  primaryPersona?: string;
  completionRate?: number;
}

interface HeatmapData {
  id: number;
  userId: string;
  persona: string;
  pageRoute: string;
  componentId: string;
  interactionCount: number;
  totalDuration: number;
  avgDuration: number;
  clickCoordinates?: HeatmapPoint[];
  heatmapData?: {
    totalInteractions: number;
    avgDuration: number;
    clickDensity: HeatmapPoint[];
    interactionTypes: Record<string, number>;
  };
}

interface UserJourneyHeatmapProps {
  className?: string;
}

export function UserJourneyHeatmap({ className }: UserJourneyHeatmapProps) {
  const [selectedPersona, setSelectedPersona] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('7d');
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const queryClient = useQueryClient();

  // Fetch user journey sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/journey/sessions'],
    queryFn: async () => {
      const response = await fetch('/api/journey/sessions?limit=20');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json() as Promise<JourneySession[]>;
    },
  });

  // Fetch user journey interactions
  const { data: interactions = [], isLoading: interactionsLoading } = useQuery({
    queryKey: ['/api/journey/interactions', selectedPersona],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '500' });
      if (selectedPersona !== 'all') {
        params.append('persona', selectedPersona);
      }
      const response = await fetch(`/api/journey/interactions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch interactions');
      return response.json() as Promise<UserJourneyInteraction[]>;
    },
  });

  // Fetch heatmap data
  const { data: heatmaps = [], isLoading: heatmapsLoading } = useQuery({
    queryKey: ['/api/journey/heatmap', selectedPersona, selectedTimeRange],
    queryFn: async () => {
      const params = new URLSearchParams({ dateRange: selectedTimeRange });
      if (selectedPersona !== 'all') {
        params.append('persona', selectedPersona);
      }
      const response = await fetch(`/api/journey/heatmap?${params}`);
      if (!response.ok) throw new Error('Failed to fetch heatmap data');
      return response.json() as Promise<HeatmapData[]>;
    },
  });

  // Track interaction mutation
  const trackInteraction = useMutation({
    mutationFn: async (data: Partial<UserJourneyInteraction>) => {
      const response = await fetch('/api/journey/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to track interaction');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journey/interactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/journey/heatmap'] });
    },
  });

  // Start session mutation
  const startSession = useMutation({
    mutationFn: async (data: { primaryPersona: string }) => {
      const response = await fetch('/api/journey/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to start session');
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentSessionId(data.session.sessionId);
      queryClient.invalidateQueries({ queryKey: ['/api/journey/sessions'] });
    },
  });

  // End session mutation
  const endSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch('/api/journey/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (!response.ok) throw new Error('Failed to end session');
      return response.json();
    },
    onSuccess: () => {
      setCurrentSessionId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/journey/sessions'] });
    },
  });

  // Setup click tracking
  useEffect(() => {
    if (!trackingEnabled) return;

    const handleClick = (event: MouseEvent) => {
      if (!currentSessionId) return;
      
      const target = event.target as HTMLElement;
      const targetElement = target.id || target.className || target.tagName;
      
      trackInteraction.mutate({
        sessionId: currentSessionId,
        persona: selectedPersona === 'all' ? 'admin' : selectedPersona,
        interactionType: 'click',
        targetElement,
        coordinates: { x: event.clientX, y: event.clientY },
        viewport: { width: window.innerWidth, height: window.innerHeight },
        // Device info stored in metadata for analytics
        metadata: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
        },
      });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [trackingEnabled, currentSessionId, selectedPersona, trackInteraction]);

  // Render heatmap on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || heatmaps.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Aggregate all click coordinates
    const allPoints: HeatmapPoint[] = [];
    heatmaps.forEach(heatmap => {
      if (heatmap.clickCoordinates) {
        allPoints.push(...heatmap.clickCoordinates);
      }
    });

    // Draw heatmap points
    allPoints.forEach(point => {
      const intensity = Math.min(point.count / 10, 1); // Normalize intensity
      const radius = 20 + (intensity * 30);
      
      // Create radial gradient
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
      gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity * 0.8})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 0, ${intensity * 0.4})`);
      gradient.addColorStop(1, `rgba(255, 255, 0, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [heatmaps]);

  const personaMetrics = interactions.reduce((acc, interaction) => {
    if (!acc[interaction.persona]) {
      acc[interaction.persona] = {
        count: 0,
        totalDuration: 0,
        commands: new Set(),
        workflows: new Set(),
      };
    }
    acc[interaction.persona].count++;
    acc[interaction.persona].totalDuration += interaction.duration || 0;
    if (interaction.commandInput) {
      acc[interaction.persona].commands.add(interaction.commandInput);
    }
    if (interaction.workflowStep) {
      acc[interaction.persona].workflows.add(interaction.workflowStep);
    }
    return acc;
  }, {} as Record<string, any>);

  const interactionTypeMetrics = interactions.reduce((acc, interaction) => {
    acc[interaction.interactionType] = (acc[interaction.interactionType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">User Journey Heatmap</h2>
          <p className="text-slate-400">Track and visualize user interactions across personas</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPersona} onValueChange={setSelectedPersona}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Personas</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="rachel">Rachel</SelectItem>
              <SelectItem value="john">John</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">1 Day</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>

          {currentSessionId ? (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => endSession.mutate(currentSessionId)}
            >
              End Session
            </Button>
          ) : (
            <Button 
              size="sm"
              onClick={() => startSession.mutate({ primaryPersona: selectedPersona === 'all' ? 'admin' : selectedPersona })}
            >
              Start Tracking
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/60 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-slate-400">Total Interactions</span>
            </div>
            <p className="text-2xl font-bold text-white">{interactions.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-400">Active Sessions</span>
            </div>
            <p className="text-2xl font-bold text-white">{sessions.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-slate-400">Avg Duration</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {Math.round(interactions.reduce((sum, i) => sum + (i.duration || 0), 0) / interactions.length / 1000)}s
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-slate-400">Heatmap Points</span>
            </div>
            <p className="text-2xl font-bold text-white">{heatmaps.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="heatmap" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="heatmap">Click Heatmap</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap" className="space-y-4">
          <Card className="bg-slate-800/60 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="w-5 h-5" />
                Click Heatmap Visualization
              </CardTitle>
              <CardDescription>
                Visual representation of user click patterns across the interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-96 bg-slate-900 rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full"
                  style={{ mixBlendMode: 'screen' }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                  {heatmapsLoading ? 'Loading heatmap data...' : 
                   heatmaps.length === 0 ? 'No heatmap data available' : 
                   'Heatmap overlay active'}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <Card className="bg-slate-800/60 border-slate-700">
            <CardHeader>
              <CardTitle>Recent Interactions</CardTitle>
              <CardDescription>Latest user interactions across all personas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {interactions.slice(0, 50).map((interaction) => (
                  <div key={interaction.id} className="flex items-center justify-between p-3 bg-slate-700/40 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {interaction.persona}
                      </Badge>
                      <span className="text-sm text-slate-300">{interaction.interactionType}</span>
                      <span className="text-xs text-slate-500">{interaction.targetElement}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(interaction.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card className="bg-slate-800/60 border-slate-700">
            <CardHeader>
              <CardTitle>Journey Sessions</CardTitle>
              <CardDescription>User session data and completion metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sessions.map((session) => (
                  <div key={session.id} className="p-4 bg-slate-700/40 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{session.primaryPersona}</Badge>
                      <span className="text-xs text-slate-400">
                        {new Date(session.startTime).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Duration:</span>
                        <p className="text-white">{session.totalDuration || 0}s</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Commands:</span>
                        <p className="text-white">{session.commandsExecuted}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Completion:</span>
                        <p className="text-white">{session.completionRate || 0}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle>Persona Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(personaMetrics).map(([persona, metrics]) => (
                    <div key={persona} className="flex items-center justify-between p-3 bg-slate-700/40 rounded-lg">
                      <div>
                        <Badge variant="outline" className="mb-1">{persona}</Badge>
                        <p className="text-xs text-slate-400">
                          {metrics.commands.size} unique commands, {metrics.workflows.size} workflows
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{metrics.count} interactions</p>
                        <p className="text-xs text-slate-400">{Math.round(metrics.totalDuration / 1000)}s total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle>Interaction Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(interactionTypeMetrics).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-3 bg-slate-700/40 rounded-lg">
                      <span className="text-sm text-slate-300 capitalize">{type}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
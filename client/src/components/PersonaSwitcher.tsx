import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck, Wrench, Building2, Target, ChevronDown, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { usePersonaManagement } from '@/hooks/usePersonaManagement';

interface PersonaSwitcherProps {
  currentPersona: string;
  onPersonaChange: (persona: string) => void;
  onBriefingTrigger?: (persona: string) => void;
}

// Icon mapping for database persona data
const getIconByRole = (agentRole: string) => {
  const roleIconMap: Record<string, any> = {
    'System Administrator': Shield,
    'Assistant Underwriter': Building2,
    'Assistant UW': Building2,
    'Broker': Target,
    'IT Support': Wrench,
    'Sales': UserCheck,
    'Claims Processor': User,
  };
  return roleIconMap[agentRole] || UserCheck;
};

// Generate display badge from persona name
const getBadgeFromName = (name: string) => {
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export function PersonaSwitcher({ currentPersona, onPersonaChange, onBriefingTrigger }: PersonaSwitcherProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use unified database-driven persona management
  const { allPersonas, isLoading: directoryLoading } = usePersonaManagement();

  // Convert database personas to display format
  const getPersonas = () => {
    if (!allPersonas?.length) return {};
    
    const personas: any = {};
    allPersonas.forEach((persona: any) => {
      personas[persona.personaKey] = {
        key: persona.personaKey,
        name: persona.displayName,
        displayName: persona.displayName,
        icon: getIconByRole(persona.agentRole || ''),
        badge: getBadgeFromName(persona.displayName),
        agentRole: persona.agentRole,
        department: persona.department,
        personaType: persona.personaType || 'static',
      };
    });
    return personas;
  };

  const switchPersonaMutation = useMutation({
    mutationFn: async (persona: string) => {
      return apiRequest('/api/persona/switch', 'POST', { persona });
    },
    onSuccess: (data: any) => {
      onPersonaChange(data.activePersona);
      
      // Invalidate all persona-dependent queries to prevent stale data issues
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/kpis'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/jarvis/agent-categorization'] });
      
      // Invalidate new database-driven persona endpoints
      queryClient.invalidateQueries({ queryKey: ['/api/personas/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/static'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/dynamic'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas/registry'] });
      
      // Keep legacy endpoints for backward compatibility
      queryClient.invalidateQueries({ queryKey: ['/api/config/setting/kpi-mappings.config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/config/setting/personas.config'] });
      
      toast({
        title: "Persona Switched",
        description: `Successfully switched to ${data.activePersona} persona`,
      });
      
      // Trigger morning briefing after persona switch
      if (onBriefingTrigger) {
        setTimeout(() => {
          onBriefingTrigger(data.activePersona);
        }, 1000);
      }
    },
    onError: (error) => {
      console.error('Failed to switch persona:', error);
      toast({
        title: "Switch Failed",
        description: "Failed to switch persona. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePersonaSwitch = (persona: string) => {
    if (persona !== currentPersona) {
      switchPersonaMutation.mutate(persona);
    }
  };

  const personas = getPersonas();
  const currentPersonaData = personas[currentPersona as keyof typeof personas] || {
    name: currentPersona,
    displayName: currentPersona,
    icon: UserCheck,
    badge: currentPersona.slice(0, 2).toUpperCase(),
  };

  // Show loading state while fetching persona directory
  if (directoryLoading) {
    return (
      <Button disabled className="animate-pulse">
        Loading...
      </Button>
    );
  }

  // Show fallback if no personas available
  if (!allPersonas?.length) {
    return (
      <Button disabled className="opacity-50">
        No personas available
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full max-w-sm bg-blue-600/20 border-blue-500/30 hover:bg-blue-600/30 text-white rounded-full px-4 py-2 h-auto min-h-[48px] justify-between"
          disabled={switchPersonaMutation.isPending}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/30 border border-blue-400/50 flex items-center justify-center text-sm font-medium">
              {currentPersonaData.badge}
            </div>
            <span className="text-sm font-medium">{currentPersonaData.displayName}</span>
          </div>
          <ChevronDown className="w-4 h-4 ml-2 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-80 bg-gray-900/95 border-blue-500/30 backdrop-blur-md shadow-xl rounded-xl p-2"
        align="start"
      >
        {Object.entries(personas).map(([key, persona]: [string, any]) => {
          const Icon = persona.icon;
          const isActive = currentPersona === key;
          
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => handlePersonaSwitch(key)}
              disabled={switchPersonaMutation.isPending || isActive}
              className={`flex items-center space-x-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${
                isActive
                  ? 'bg-blue-600/30 text-blue-200'
                  : 'hover:bg-blue-600/20 text-gray-200 hover:text-blue-200'
              } focus:bg-blue-600/20 focus:text-blue-200`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-blue-500/40 flex items-center justify-center text-xs font-medium">
                  {persona.badge}
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{persona.name}</div>
              </div>
              {switchPersonaMutation.isPending && isActive && (
                <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

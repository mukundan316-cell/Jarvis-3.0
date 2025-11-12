import { useQuery, useMutation } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserPreferences } from "@shared/schema";

interface ViewModeToggleProps {
  currentPersona: string;
  onViewModeChange?: (viewMode: 'technical' | 'business') => void;
}

export function ViewModeToggle({ currentPersona, onViewModeChange }: ViewModeToggleProps) {
  const { toast } = useToast();

  // Query dual-view feature flag with persona parameter
  const dualViewUrl = `/api/config/setting/dual-view-enabled.config?persona=${encodeURIComponent(currentPersona)}`;
  const { data: dualViewConfig, isLoading: configLoading } = useQuery<{ value?: boolean | { enabled?: boolean } }>({
    queryKey: [dualViewUrl],
    staleTime: 5 * 60 * 1000, // 5 minutes - align with ConfigService cache TTL
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    retry: 1, // Retry once on failure, then fallback
    retryDelay: 1000,
    enabled: !!currentPersona // Only fetch when persona is available
  });

  // Query current user preferences
  const { data: userPreferences, isLoading: userLoading } = useQuery<UserPreferences>({
    queryKey: ["/api/auth/user-preferences"],
    retry: false,
  });

  // Extract feature enabled status from config response
  // Handle both possible response formats: direct boolean or nested object
  const isFeatureEnabled = 
    typeof dualViewConfig?.value === 'boolean' 
      ? dualViewConfig.value 
      : (dualViewConfig?.value as any)?.enabled || false;
  
  // Extract current view mode from user preferences (default to 'technical')
  const currentViewMode = userPreferences?.viewMode || 'technical';

  // Mutation to update view mode
  const updateViewModeMutation = useMutation({
    mutationFn: async (viewMode: 'technical' | 'business') => {
      return apiRequest('/api/config/user-view-mode', 'POST', { mode: viewMode });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user-preferences"] });
      toast({
        title: "View Mode Updated",
        description: `Switched to ${variables} view successfully.`,
      });
      onViewModeChange?.(variables);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update view mode. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Don't render if feature not enabled for current persona
  if (!isFeatureEnabled) {
    return null;
  }

  // Show loading state
  if (configLoading || userLoading) {
    return (
      <div className="flex items-center space-x-2 opacity-50">
        <Switch 
          disabled 
          className="bg-slate-700/20 border-slate-600/30"
          data-testid="view-mode-toggle-loading"
        />
        <Label className="text-slate-400 text-sm">Loading...</Label>
      </div>
    );
  }

  const handleViewModeToggle = (checked: boolean) => {
    const newViewMode = checked ? 'business' : 'technical';
    updateViewModeMutation.mutate(newViewMode);
  };

  return (
    <div className="flex items-center space-x-3">
      <Label 
        htmlFor="view-mode-toggle" 
        className="text-sm font-medium text-slate-300 cursor-pointer"
      >
        Technical
      </Label>
      <Switch
        id="view-mode-toggle"
        checked={currentViewMode === 'business'}
        onCheckedChange={handleViewModeToggle}
        disabled={updateViewModeMutation.isPending}
        className={`
          bg-slate-700/50 border-slate-600/50 
          data-[state=checked]:bg-emerald-600 
          data-[state=unchecked]:bg-slate-600/50
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
        `}
        data-testid="view-mode-toggle"
      />
      <Label 
        htmlFor="view-mode-toggle" 
        className="text-sm font-medium text-slate-300 cursor-pointer"
      >
        Business
      </Label>
    </div>
  );
}
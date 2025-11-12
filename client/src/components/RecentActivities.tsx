import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Fallback configurations for graceful degradation
const FALLBACK_STATUS_COLORS = {
  success: 'bg-green-500',
  processing: 'bg-blue-500',
  error: 'bg-red-500',
  info: 'bg-purple-500',
  warning: 'bg-yellow-500'
};

const FALLBACK_STATUS_TEXT_COLORS = {
  success: 'text-green-400',
  processing: 'text-blue-400',
  error: 'text-red-400',
  info: 'text-purple-400',
  warning: 'text-yellow-400'
};

// Custom hook for status colors configuration
function useStatusColorsConfig(persona?: string) {
  const { data: statusColorsConfig, isLoading, error } = useQuery({
    queryKey: ['/api/config/setting/status-colors.config', { persona }],
    queryFn: () => {
      const url = new URL('/api/config/setting/status-colors.config', window.location.origin);
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

  // Extract configurations from ConfigService response or use fallbacks
  const statusColors = statusColorsConfig?.value?.statusColors || FALLBACK_STATUS_COLORS;
  const statusTextColors = statusColorsConfig?.value?.statusTextColors || FALLBACK_STATUS_TEXT_COLORS;
  
  return {
    statusColors,
    statusTextColors,
    isLoading,
    error
  };
}

export function RecentActivities() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['/api/activities'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get status colors configuration from ConfigService
  const { statusColors, statusTextColors, isLoading: configLoading } = useStatusColorsConfig();

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
          <Activity className="w-5 h-5 text-blue-400 mr-2" />
          Recent Activities
        </h3>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg animate-pulse">
              <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="w-16 h-4 bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="hexaware-glass rounded-xl p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center text-white">
        <Activity className="w-5 h-5 text-[#60A5FA] mr-2" />
        Recent Activities
      </h3>
      
      <div className="space-y-3">
        {(activities as any[])?.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No recent activities</p>
          </div>
        ) : (
          (activities as any[])?.map((activity: any) => {
            const statusColor = statusColors[activity.status as keyof typeof statusColors] || statusColors.info;
            const statusTextColor = statusTextColors[activity.status as keyof typeof statusTextColors] || statusTextColors.info;
            
            return (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg">
                <div className={`w-2 h-2 ${statusColor} rounded-full`}></div>
                <div className="flex-1">
                  <p className="text-sm text-white">{activity.activity}</p>
                  <p className="text-xs text-gray-400">
                    {activity.persona && `${activity.persona} persona • `}
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <span className={`text-xs ${statusTextColor} capitalize`}>
                  {activity.status}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Settings, Brain, Shield, Zap, Database, Network, Save, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const CATEGORY_ICONS = {
  'Performance': Zap,
  'Security': Shield,
  'Neural Networks': Brain,
  'Data Processing': Database,
  'Network': Network,
  'System': Settings
};

const SETTING_TYPE_LABELS = {
  'string': 'Text',
  'number': 'Number',
  'boolean': 'Toggle',
  'json': 'JSON Configuration'
};

interface SettingItemProps {
  setting: any;
  onUpdate: (settingName: string, value: string) => void;
}

function SettingItem({ setting, onUpdate }: SettingItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(setting.settingValue);

  const handleSave = () => {
    onUpdate(setting.settingName, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(setting.settingValue);
    setIsEditing(false);
  };

  const renderValueInput = () => {
    switch (setting.settingType) {
      case 'boolean':
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full bg-black/40 border border-[#3B82F6]/30 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        );
      case 'number':
        return (
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full bg-black/40 border border-[#3B82F6]/30 rounded-lg px-3 py-2 text-white text-sm"
          />
        );
      case 'json':
        return (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={4}
            className="w-full bg-black/40 border border-[#3B82F6]/30 rounded-lg px-3 py-2 text-white text-sm font-mono"
            placeholder="Enter valid JSON..."
          />
        );
      default:
        return (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full bg-black/40 border border-[#3B82F6]/30 rounded-lg px-3 py-2 text-white text-sm"
          />
        );
    }
  };

  const formatDisplayValue = (value: string, type: string) => {
    switch (type) {
      case 'boolean':
        return value === 'true' ? 'Enabled' : 'Disabled';
      case 'json':
        try {
          return JSON.stringify(JSON.parse(value), null, 2);
        } catch {
          return value;
        }
      default:
        return value;
    }
  };

  return (
    <div className="hexaware-glass rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-bold text-white text-sm mb-1">{setting.settingName}</h4>
          <p className="text-xs text-[#9CA3AF] mb-2">{setting.description}</p>
          <div className="flex items-center space-x-2 text-xs">
            <span className="bg-[#3B82F6]/20 text-[#60A5FA] px-2 py-1 rounded">
              {SETTING_TYPE_LABELS[setting.settingType as keyof typeof SETTING_TYPE_LABELS] || setting.settingType}
            </span>
            {setting.isActive ? (
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">Active</span>
            ) : (
              <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded">Inactive</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="text-[#60A5FA] hover:text-white hover:bg-[#3B82F6]/20"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {isEditing ? (
          <div className="space-y-3">
            {renderValueInput()}
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-[#3B82F6] hover:bg-[#1E40AF] text-white"
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                className="text-[#9CA3AF] hover:text-white"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-black/20 rounded-lg p-3">
            <div className="text-sm text-white font-mono">
              {setting.settingType === 'json' ? (
                <pre className="whitespace-pre-wrap text-xs">
                  {formatDisplayValue(setting.settingValue, setting.settingType)}
                </pre>
              ) : (
                formatDisplayValue(setting.settingValue, setting.settingType)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MetaBrainSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/metabrain/settings'],
    refetchInterval: 60000, // Refresh every minute
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ settingName, settingValue }: { settingName: string; settingValue: string }) => {
      const response = await fetch(`/api/metabrain/settings/${settingName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settingValue }),
      });
      if (!response.ok) throw new Error('Failed to update setting');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/metabrain/settings'] });
      toast({
        title: "Setting Updated",
        description: "Meta Brain setting has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateSetting = (settingName: string, settingValue: string) => {
    updateSettingMutation.mutate({ settingName, settingValue });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Meta Brain Settings</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="hexaware-glass rounded-lg p-4 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-[#3B82F6]/20 rounded w-3/4"></div>
                <div className="h-3 bg-[#3B82F6]/20 rounded w-full"></div>
                <div className="h-8 bg-[#3B82F6]/20 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Group settings by category
  const groupedSettings = (settings as any[])?.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-[#3B82F6]/20 rounded-lg">
            <Brain className="w-6 h-6 text-[#60A5FA]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Meta Brain Settings</h2>
            <p className="text-sm text-[#9CA3AF]">Configure neural network and processing parameters</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-[#9CA3AF]">
          <div className="w-2 h-2 bg-[#60A5FA] rounded-full animate-pulse"></div>
          <span>Active Configuration</span>
        </div>
      </div>

      {Object.keys(groupedSettings).length === 0 ? (
        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Settings Available</h3>
          <p className="text-[#9CA3AF]">Meta Brain settings will appear here once configured</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedSettings).map(([category, categorySettings]) => {
            const IconComponent = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || Settings;
            
            return (
              <div key={category}>
                <div className="flex items-center space-x-2 mb-4">
                  <IconComponent className="w-5 h-5 text-[#60A5FA]" />
                  <h3 className="text-lg font-bold text-[#60A5FA]">{category}</h3>
                  <div className="flex-1 h-px bg-[#3B82F6]/30"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {(categorySettings as any[]).map((setting) => (
                    <SettingItem
                      key={setting.id}
                      setting={setting}
                      onUpdate={handleUpdateSetting}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {updateSettingMutation.isPending && (
        <div className="fixed bottom-4 right-4 bg-[#3B82F6] text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Updating setting...</span>
          </div>
        </div>
      )}
    </div>
  );
}
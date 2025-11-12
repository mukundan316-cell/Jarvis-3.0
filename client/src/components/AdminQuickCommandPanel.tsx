import { useState } from 'react';
import { Send, Mic, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { usePersona } from '@/hooks/usePersona';

interface AdminQuickCommandPanelProps {
  onCommand: (command: string, mode: 'Voice' | 'Text') => void;
  disabled?: boolean;
}

interface QuickCommand {
  text: string;
  description: string;
}

// Fallback commands for graceful degradation
const FALLBACK_QUICK_COMMANDS: QuickCommand[] = [
  { text: "Show metrics", description: "Display system performance" },
  { text: "View hierarchy", description: "Show agent architecture" },
  { text: "Create agent", description: "Deploy new agent" },
  { text: "Check integrations", description: "Verify system connections" },
  { text: "Show system status", description: "Overall health check" }
];

export function AdminQuickCommandPanel({ onCommand, disabled = false }: AdminQuickCommandPanelProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCommand(input.trim(), 'Text');
      setInput('');
    }
  };

  // Fetch Admin-specific quick commands from ConfigService
  const { data: quickCommandsConfig, isLoading: commandsLoading } = useQuery({
    queryKey: ['/api/config/setting/quickcommands.config', { persona: 'admin' }],
    queryFn: () => 
      fetch('/api/config/setting/quickcommands.config?persona=admin')
        .then(res => res.json()),
    enabled: true
  });

  // Get quick commands with fallback
  const getQuickCommands = (): QuickCommand[] => {
    const configData = quickCommandsConfig?.value;
    if (Array.isArray(configData)) {
      return configData;
    }
    return FALLBACK_QUICK_COMMANDS;
  };

  const quickCommands = getQuickCommands();

  return (
    <Card className="bg-slate-900/50 border-blue-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>JARVIS Admin Command Center</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Text Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type admin command or use quick buttons below"
            className="flex-1 bg-gray-800/50 text-white placeholder-gray-400 border-gray-600 focus:border-blue-500"
            disabled={disabled}
          />
          <Button
            type="submit"
            disabled={disabled || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* Quick Command Buttons */}
        <div className="space-y-2">
          <p className="text-gray-400 text-sm">System Administration:</p>
          {commandsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="bg-gray-800/30 rounded p-3 animate-pulse">
                  <div className="h-4 bg-gray-600 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {quickCommands.map((cmd) => (
                <motion.button
                  key={cmd.text}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onCommand(cmd.text, 'Voice')}
                  disabled={disabled}
                  className="bg-gray-800/50 hover:bg-gray-700/50 text-left p-3 rounded border border-gray-600 hover:border-blue-500 transition-colors disabled:opacity-50"
                  data-testid={`button-quickcommand-admin-${cmd.text.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="text-white font-medium text-sm">{cmd.text}</div>
                  <div className="text-gray-400 text-xs">{cmd.description}</div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {disabled && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded p-2">
            <p className="text-yellow-300 text-sm">Processing command...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
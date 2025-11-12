import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkflowSuggestion {
  nextAction: string;
  context: string;
  priority: 'high' | 'medium' | 'low';
}

interface EnhancedWorkflowSuggestionsProps {
  suggestions: WorkflowSuggestion[];
  isVisible: boolean;
  onSuggestionClick: (action: string) => void;
  onClose: () => void;
  isVoiceEnabled: boolean;
  onVoiceToggle: () => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};

export function EnhancedWorkflowSuggestions({
  suggestions,
  isVisible,
  onSuggestionClick,
  onClose,
  isVoiceEnabled,
  onVoiceToggle
}: EnhancedWorkflowSuggestionsProps) {
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible && suggestions.length > 0) {
      // Auto-close after 15 seconds if no interaction
      const timer = setTimeout(() => {
        onClose();
      }, 15000);
      
      setAutoCloseTimer(timer);
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [isVisible, suggestions.length, onClose]);

  const handleSuggestionClick = (action: string) => {
    if (autoCloseTimer) clearTimeout(autoCloseTimer);
    onSuggestionClick(action);
    onClose();
  };

  if (!isVisible || suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 z-50 max-w-md"
      >
        <Card className="bg-slate-900/95 border-blue-500/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-blue-400" />
                JARVIS Workflow Suggestions
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onVoiceToggle}
                  className={`p-1 ${isVoiceEnabled ? 'text-blue-400' : 'text-slate-500'}`}
                >
                  {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-slate-400 hover:text-white p-1"
                >
                  ×
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant="ghost"
                  onClick={() => handleSuggestionClick(suggestion.nextAction)}
                  className="w-full justify-start text-left p-3 h-auto hover:bg-slate-800/50"
                >
                  <div className="flex items-start gap-3 w-full">
                    <Badge className={getPriorityColor(suggestion.priority)}>
                      {suggestion.priority}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm">
                        {suggestion.nextAction}
                      </div>
                      <div className="text-slate-400 text-xs mt-1">
                        {suggestion.context}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </div>
                </Button>
              </motion.div>
            ))}
            
            <div className="pt-2 border-t border-slate-700">
              <div className="text-xs text-slate-500 text-center">
                Auto-closes in 15 seconds • Voice: {isVoiceEnabled ? 'ON' : 'OFF'}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
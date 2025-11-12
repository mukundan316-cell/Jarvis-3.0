import { useState } from 'react';
import { Send, Mic } from 'lucide-react';
import { motion } from 'framer-motion';

interface SimpleCommandInputProps {
  onCommand: (command: string, mode: 'Voice' | 'Text') => void;
  disabled?: boolean;
}

export function SimpleCommandInput({ onCommand, disabled = false }: SimpleCommandInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCommand(input.trim(), 'Text');
      setInput('');
    }
  };

  const handleVoiceCommand = () => {
    // Simple voice commands without speech recognition
    const commands = [
      "Show submissions",
      "Request missing docs", 
      "Review prospects",
      "Mr. Smith",
      "Summarize claims"
    ];
    
    const randomCommand = commands[Math.floor(Math.random() * commands.length)];
    onCommand(randomCommand, 'Voice');
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-blue-500/30">
      <h3 className="text-white font-medium mb-3">Command Center</h3>
      
      {/* Text Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a command (e.g., 'Show submissions', 'Review prospects')"
          className="flex-1 bg-gray-800/50 text-white placeholder-gray-400 px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          disabled={disabled}
        />
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={disabled || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-2 rounded transition-colors"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </form>

      {/* Quick Voice Commands */}
      <div className="space-y-2">
        <p className="text-gray-400 text-xs">Quick Commands:</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            "Show submissions",
            "Review prospects", 
            "Request missing docs",
            "Summarize claims"
          ].map((cmd) => (
            <motion.button
              key={cmd}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCommand(cmd, 'Voice')}
              disabled={disabled}
              className="bg-gray-800/50 hover:bg-gray-700/50 text-white text-xs px-2 py-1 rounded border border-gray-600 hover:border-blue-500 transition-colors disabled:opacity-50"
            >
              {cmd}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
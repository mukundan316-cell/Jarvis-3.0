import { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useVoice } from '@/hooks/useVoice';

interface VoiceButtonProps {
  onTranscript: (transcript: string) => void;
  onStateChange?: (isListening: boolean) => void;
}

export function VoiceButton({ onTranscript, onStateChange }: VoiceButtonProps) {
  const { isListening, isSupported, transcript, error, startListening, stopListening, resetTranscript } = useVoice();

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
    onStateChange?.(isListening);
  };

  // Handle transcript changes
  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
      resetTranscript();
    }
  }, [transcript]);

  if (!isSupported) {
    return (
      <div className="fixed bottom-6 right-6">
        <div className="w-16 h-16 bg-gray-600 rounded-full shadow-2xl flex items-center justify-center">
          <MicOff className="w-8 h-8 text-gray-400" />
        </div>
        <div className="absolute -top-12 right-0 bg-red-500/90 text-white text-xs px-2 py-1 rounded">
          Voice not supported
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-[#3B82F6] hover:bg-[#1E40AF]'
        }`}
        aria-label={isListening ? 'Stop listening' : 'Start voice command'}
      >
        <Mic className="w-8 h-8 text-white" />
      </motion.button>
      
      {/* Status indicator */}
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
        <motion.div
          className="w-2 h-2 bg-white rounded-full"
          animate={isListening ? { scale: [1, 1.5, 1] } : { scale: 1 }}
          transition={{ repeat: isListening ? Infinity : 0, duration: 1 }}
        />
      </div>

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute -top-16 right-0 bg-red-500/90 text-white text-xs px-3 py-2 rounded-lg max-w-xs"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}

import { useState, useCallback } from 'react';
import { globalVoiceManager } from '@/utils/GlobalVoiceManager';

interface VoiceOutputConfig {
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface UnifiedVoiceOutputHook {
  speak: (text: string, persona?: string, config?: VoiceOutputConfig) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

/**
 * Unified Voice Output Hook - Delegates to GlobalVoiceManager
 * This hook provides a React-friendly interface to the centralized voice manager
 * while maintaining backward compatibility for existing components.
 */
export function useUnifiedVoiceOutput(): UnifiedVoiceOutputHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stop = useCallback(() => {
    globalVoiceManager.stopAll();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (
    text: string, 
    persona: string = 'admin', 
    config: VoiceOutputConfig = {}
  ): Promise<void> => {
    if (!isSupported) {
      console.log('Speech synthesis not supported');
      return Promise.resolve();
    }

    console.log(`Unified voice hook delegating to GlobalVoiceManager for ${persona}`);
    setIsSpeaking(true);
    
    try {
      // Note: GlobalVoiceManager doesn't currently accept config parameters
      // but we maintain the interface for backward compatibility
      await globalVoiceManager.speak(text, persona);
    } catch (error) {
      console.error('Voice synthesis error in hook:', error);
    } finally {
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported
  };
}
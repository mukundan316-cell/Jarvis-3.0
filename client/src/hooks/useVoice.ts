import { useState, useCallback, useRef } from 'react';

interface VoiceState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
}

interface UseVoiceReturn extends VoiceState {
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useVoice(): UseVoiceReturn {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isSupported: typeof window !== 'undefined' && 'webkitSpeechRecognition' in window,
    transcript: '',
    error: null,
  });

  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Speech recognition not supported' }));
      return;
    }

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setState(prev => ({ ...prev, isListening: true, error: null }));
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setState(prev => ({ ...prev, transcript, isListening: false }));
      };

      recognitionRef.current.onerror = (event: any) => {
        let errorMessage = 'Voice recognition failed';
        
        switch (event.error) {
          case 'network':
            errorMessage = 'Network connection required for voice recognition';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone permissions.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not found or unavailable';
            break;
          case 'service-not-allowed':
            errorMessage = 'Voice service not available';
            break;
          default:
            errorMessage = `Voice error: ${event.error}`;
        }
        
        setState(prev => ({ 
          ...prev, 
          error: errorMessage,
          isListening: false 
        }));
        
        // Auto-clear error after 5 seconds
        setTimeout(() => {
          setState(prev => ({ ...prev, error: null }));
        }, 5000);
      };

      recognitionRef.current.onend = () => {
        setState(prev => ({ ...prev, isListening: false }));
      };

      recognitionRef.current.start();
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: `Failed to start speech recognition: ${error}`,
        isListening: false 
      }));
    }
  }, [state.isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setState(prev => ({ ...prev, isListening: false }));
  }, []);

  const resetTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '', error: null }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    resetTranscript,
  };
}

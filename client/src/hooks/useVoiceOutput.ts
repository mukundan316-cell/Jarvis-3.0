import { useRef, useCallback, useState, useEffect } from 'react';

interface VoiceOutputConfig {
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useVoiceOutput() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const selectPersonaVoice = useCallback((persona: string) => {
    if (!synthRef.current) return null;
    
    const voices = synthRef.current.getVoices();
    let selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
    
    switch (persona) {
      case 'rachel':
      case 'sarah':
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.toLowerCase().includes('woman') ||
          voice.name.toLowerCase().includes('zira') ||
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('heera') ||
          voice.name.toLowerCase().includes('karen')
        ) || selectedVoice;
        break;
      
      case 'john':
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('male') || 
          voice.name.toLowerCase().includes('man') ||
          voice.name.toLowerCase().includes('david') ||
          voice.name.toLowerCase().includes('alex') ||
          voice.name.toLowerCase().includes('rishi') ||
          voice.name.toLowerCase().includes('tom')
        ) || selectedVoice;
        break;
      
      default: // admin/jarvis
        selectedVoice = voices.find(voice => 
          voice.default || 
          voice.name.toLowerCase().includes('system') ||
          voice.name.toLowerCase().includes('daniel') ||
          voice.name.toLowerCase().includes('mark') ||
          voice.name.toLowerCase().includes('microsoft')
        ) || selectedVoice;
    }
    
    return selectedVoice;
  }, []);

  const speak = useCallback((
    text: string, 
    persona: string = 'admin', 
    config: VoiceOutputConfig = {}
  ) => {
    return new Promise<void>((resolve, reject) => {
      // Check if speech synthesis is available
      if (!window.speechSynthesis) {
        console.warn('Speech synthesis not supported in this browser');
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = config.rate || 0.9;
      utterance.pitch = config.pitch || 1.0;
      utterance.volume = config.volume || 0.8;
      
      // Wait for voices to be loaded
      const setVoiceAndSpeak = () => {
        const selectedVoice = selectPersonaVoice(persona);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        
        utterance.onstart = () => {
          console.log(`JARVIS speaking as ${persona}:`, text.substring(0, 50) + '...');
          setIsSpeaking(true);
        };
        
        utterance.onend = () => {
          console.log('JARVIS finished speaking');
          setIsSpeaking(false);
          resolve();
        };
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          setIsSpeaking(false);
          
          // Don't reject for 'interrupted' errors - they're often browser-imposed
          if (event.error === 'interrupted') {
            console.log('Speech interrupted - treating as completed');
            resolve();
          } else {
            reject(new Error(`Speech synthesis failed: ${event.error}`));
          }
        };
        
        // Store reference and speak with small delay for browser compatibility
        utteranceRef.current = utterance;
        
        // Clear any existing speech and wait before starting new speech
        window.speechSynthesis.cancel();
        
        setTimeout(() => {
          // Ensure speech synthesis is ready
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          
          // Split long text into shorter chunks to avoid interruption
          const chunks = text.split(/[.!?]+/).filter(chunk => chunk.trim().length > 0);
          
          if (chunks.length <= 1) {
            // Short text - speak directly
            window.speechSynthesis.speak(utterance);
          } else {
            // Long text - speak in chunks with small delays
            let chunkIndex = 0;
            
            const speakNextChunk = () => {
              if (chunkIndex < chunks.length) {
                const chunkUtterance = new SpeechSynthesisUtterance(chunks[chunkIndex].trim() + '.');
                if (selectedVoice) {
                  chunkUtterance.voice = selectedVoice;
                }
                chunkUtterance.rate = 0.9;
                chunkUtterance.pitch = 1.0;
                chunkUtterance.volume = 0.8;
                
                chunkUtterance.onend = () => {
                  chunkIndex++;
                  setTimeout(speakNextChunk, 200); // Small pause between chunks
                };
                
                chunkUtterance.onerror = (event) => {
                  console.error('Chunk speech error:', event);
                  chunkIndex++;
                  setTimeout(speakNextChunk, 200);
                };
                
                window.speechSynthesis.speak(chunkUtterance);
              } else {
                // All chunks completed
                setIsSpeaking(false);
                resolve();
              }
            };
            
            speakNextChunk();
          }
        }, 200);
      };

      // Handle voice loading
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // Voices not loaded yet, wait for them
        window.speechSynthesis.onvoiceschanged = () => {
          setVoiceAndSpeak();
        };
      } else {
        // Voices already loaded
        setVoiceAndSpeak();
      }
    });
  }, [selectPersonaVoice]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const isSupported = useCallback(() => {
    return typeof window !== 'undefined' && 
           'speechSynthesis' in window && 
           'SpeechSynthesisUtterance' in window;
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported: isSupported()
  };
}
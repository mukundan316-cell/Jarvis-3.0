/**
 * Global Voice Manager - Single source of truth for all voice synthesis
 * Prevents duplicate voice outputs across components
 */

class GlobalVoiceManager {
  private static instance: GlobalVoiceManager | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private isEdge: boolean = false;
  private isSpeaking: boolean = false;

  private constructor() {
    if (typeof navigator !== 'undefined') {
      this.isEdge = navigator.userAgent.includes('Edg');
      console.log(`Global Voice Manager initialized for: ${this.isEdge ? 'Edge' : 'Standard'} browser`);
    }
  }

  public static getInstance(): GlobalVoiceManager {
    if (!GlobalVoiceManager.instance) {
      GlobalVoiceManager.instance = new GlobalVoiceManager();
    }
    return GlobalVoiceManager.instance;
  }

  public stopAll(): void {
    if (this.activeUtterance && window.speechSynthesis) {
      console.log('Global Voice Manager: Stopping all speech synthesis');
      window.speechSynthesis.cancel();
      this.activeUtterance = null;
      this.isSpeaking = false;
    }
  }



  private selectPersonaVoice(persona: string): SpeechSynthesisVoice | null {
    if (!window.speechSynthesis) return null;
    
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice: SpeechSynthesisVoice | undefined = voices.find(voice => voice.lang.startsWith('en'));
    
    // For Edge, prefer Microsoft voices
    if (this.isEdge) {
      const microsoftVoice = voices.find(voice => 
        voice.name.includes('Microsoft') && voice.lang.startsWith('en')
      );
      if (microsoftVoice) {
        return microsoftVoice;
      }
    }
    
    // Persona-specific voice selection
    switch (persona) {
      case 'rachel':
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.toLowerCase().includes('woman') ||
          voice.name.toLowerCase().includes('zira') ||
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('karen')
        ) || selectedVoice;
        break;
      
      case 'john':
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('male') || 
          voice.name.toLowerCase().includes('man') ||
          voice.name.toLowerCase().includes('david') ||
          voice.name.toLowerCase().includes('alex') ||
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
    
    return selectedVoice ?? null;
  }

  public async speak(text: string, persona: string = 'admin'): Promise<void> {
    if (!window.speechSynthesis) {
      console.log('Global Voice Manager: Speech synthesis not supported');
      return Promise.resolve();
    }

    // Prevent multiple simultaneous speech requests
    if (this.isSpeaking) {
      console.log('Global Voice Manager: Speech already in progress, ignoring new request');
      return Promise.resolve();
    }

    // Stop any existing speech first
    this.stopAll();

    return new Promise((resolve) => {
      console.log(`Global Voice Manager: Starting speech for ${persona}`);
      this.isSpeaking = true;
      
      // Process text for optimal speech synthesis - prevent truncation
      let processedText = text;
      if (text.length > 200 && this.isEdge) {
        // Split into sentences and take first 2-3 sentences for Edge
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const maxSentences = 2;
        processedText = sentences.slice(0, maxSentences).join('. ') + '.';
      }
      
      const utterance = new SpeechSynthesisUtterance(processedText);
      
      // Browser-specific settings
      if (this.isEdge) {
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
      } else {
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
      }
      
      const setVoiceAndSpeak = () => {
        const selectedVoice = this.selectPersonaVoice(persona);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log(`Global Voice Manager: Using voice: ${selectedVoice.name}`);
        }
        
        let resolved = false;
        const resolveOnce = () => {
          if (!resolved) {
            resolved = true;
            this.isSpeaking = false;
            this.activeUtterance = null;
            resolve();
          }
        };
        
        // Event handling with fallback timers
        if (this.isEdge) {
          // Calculate dynamic timeout based on text length (roughly 150 words per minute)
          const estimatedDuration = Math.max(3000, (processedText.length / 10) * 1000);
          const fallbackTimer = setTimeout(resolveOnce, estimatedDuration + 1000);
          
          utterance.onstart = () => {
            console.log('Global Voice Manager: Edge speech started');
            // Don't resolve immediately on start - wait for end event
          };
          
          utterance.onend = () => {
            console.log('Global Voice Manager: Edge speech ended');
            clearTimeout(fallbackTimer);
            resolveOnce();
          };
          
          utterance.onerror = () => {
            console.log('Global Voice Manager: Edge speech error (ignoring)');
            clearTimeout(fallbackTimer);
            resolveOnce();
          };
        } else {
          // Calculate dynamic timeout for non-Edge browsers too
          const estimatedDuration = Math.max(4000, (processedText.length / 8) * 1000);
          const fallbackTimer = setTimeout(resolveOnce, estimatedDuration + 1000);
          
          utterance.onstart = () => {
            console.log(`Global Voice Manager: Speech started for ${persona}`);
          };
          
          utterance.onend = () => {
            console.log('Global Voice Manager: Speech ended');
            clearTimeout(fallbackTimer);
            resolveOnce();
          };
          
          utterance.onerror = (event) => {
            console.error('Global Voice Manager: Speech error:', event.error);
            clearTimeout(fallbackTimer);
            resolveOnce();
          };
        }
        
        // Store reference and speak
        this.activeUtterance = utterance;
        
        setTimeout(() => {
          try {
            window.speechSynthesis.speak(utterance);
          } catch (error) {
            console.log('Global Voice Manager: Speech failed to start:', error);
            resolveOnce();
          }
        }, this.isEdge ? 50 : 200);
      };

      // Handle voice loading
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
      } else {
        setVoiceAndSpeak();
      }
    });
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

// Export singleton instance
export const globalVoiceManager = GlobalVoiceManager.getInstance();

// Global window functions for compatibility
if (typeof window !== 'undefined') {
  (window as any).jarvisSpeakResponse = (text: string, persona: string = 'admin') => {
    globalVoiceManager.speak(text, persona);
  };
  
  (window as any).jarvisSpeakWithPersona = (text: string, persona: string) => {
    globalVoiceManager.speak(text, persona);
  };
}
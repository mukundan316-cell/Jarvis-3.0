import { useCallback, useRef, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface WorkflowSuggestion {
  nextAction: string;
  context: string;
  priority: 'high' | 'medium' | 'low';
  reasoning?: string;
  dataSource?: string;
}

interface VoiceWorkflowConfig {
  enabled: boolean;
  persona: string;
  onWorkflowSuggestion?: (suggestions: WorkflowSuggestion[]) => void;
}

interface DynamicVoiceResponse {
  response: string;
  suggestions: WorkflowSuggestion[];
}

// Fallback voice response templates for offline/error scenarios
const FALLBACK_VOICE_RESPONSES: Record<string, Record<string, { response: string; suggestions: WorkflowSuggestion[] }>> = {
  rachel: {
    'Send Email': {
      response: 'Email composed and ready for review. Would you like me to suggest the next workflow steps?',
      suggestions: [
        { nextAction: 'Review Submissions', context: 'Check for new underwriting cases', priority: 'high' },
        { nextAction: 'Policy Evaluation', context: 'Evaluate pending applications', priority: 'medium' },
        { nextAction: 'Show Inbox', context: 'Review broker communications', priority: 'medium' }
      ]
    },
    'Policy Evaluation': {
      response: 'Policy evaluation completed. I have some recommendations for your next actions.',
      suggestions: [
        { nextAction: 'Review Submissions', context: 'Check evaluation results', priority: 'high' },
        { nextAction: 'Send Email', context: 'Notify broker of decisions', priority: 'high' },
        { nextAction: 'Policy Generation', context: 'Generate approved policies', priority: 'medium' }
      ]
    },
    'Review Submissions': {
      response: 'Submission review complete. Here are the recommended next steps based on your findings.',
      suggestions: [
        { nextAction: 'Policy Evaluation', context: 'Evaluate flagged applications', priority: 'high' },
        { nextAction: 'Send Email', context: 'Request additional documentation', priority: 'high' },
        { nextAction: 'Policy Generation', context: 'Process approved cases', priority: 'medium' }
      ]
    },
    'Policy Generation': {
      response: 'Policy generation process initiated. I suggest these follow-up workflows.',
      suggestions: [
        { nextAction: 'Send Email', context: 'Notify broker of policy details', priority: 'high' },
        { nextAction: 'Review Submissions', context: 'Check remaining cases', priority: 'medium' },
        { nextAction: 'Show Inbox', context: 'Handle broker responses', priority: 'low' }
      ]
    },
    'Show Inbox': {
      response: 'Inbox reviewed. Based on your email activity, here are the next recommended actions.',
      suggestions: [
        { nextAction: 'Send Email', context: 'Respond to broker inquiries', priority: 'high' },
        { nextAction: 'Review Submissions', context: 'Process mentioned cases', priority: 'medium' },
        { nextAction: 'Policy Evaluation', context: 'Evaluate new applications', priority: 'medium' }
      ]
    }
  },
  john: {
    'System Status': {
      response: 'System status checked. Here are the recommended IT maintenance workflows.',
      suggestions: [
        { nextAction: 'Security Scan', context: 'Run security vulnerability check', priority: 'high' },
        { nextAction: 'Database Backup', context: 'Perform scheduled backup', priority: 'medium' },
        { nextAction: 'Monitor Logs', context: 'Check system error logs', priority: 'medium' }
      ]
    },
    'Security Scan': {
      response: 'Security scan completed. I recommend these next IT security steps.',
      suggestions: [
        { nextAction: 'Patch Management', context: 'Apply critical security patches', priority: 'high' },
        { nextAction: 'Monitor Logs', context: 'Review security event logs', priority: 'high' },
        { nextAction: 'Database Backup', context: 'Secure data backup', priority: 'medium' }
      ]
    },
    'Send Email': {
      response: 'IT notification sent. Here are the recommended follow-up actions.',
      suggestions: [
        { nextAction: 'System Status', context: 'Verify system health', priority: 'high' },
        { nextAction: 'Monitor Logs', context: 'Track incident resolution', priority: 'medium' },
        { nextAction: 'Show Inbox', context: 'Check user responses', priority: 'low' }
      ]
    }
  },
  admin: {
    'Show Metrics': {
      response: 'System metrics reviewed. Here are the recommended administrative actions.',
      suggestions: [
        { nextAction: 'System Status', context: 'Check overall system health', priority: 'high' },
        { nextAction: 'Agent Monitoring', context: 'Review agent performance', priority: 'medium' },
        { nextAction: 'Integration Check', context: 'Verify system integrations', priority: 'medium' }
      ]
    },
    'System Status': {
      response: 'System status analyzed. I suggest these administrative workflows.',
      suggestions: [
        { nextAction: 'Show Metrics', context: 'Review performance metrics', priority: 'high' },
        { nextAction: 'Agent Monitoring', context: 'Check agent operations', priority: 'medium' },
        { nextAction: 'Send Email', context: 'Notify stakeholders', priority: 'low' }
      ]
    },
    'Send Email': {
      response: 'Administrative notification sent. Here are the next recommended steps.',
      suggestions: [
        { nextAction: 'Show Metrics', context: 'Monitor system impact', priority: 'medium' },
        { nextAction: 'System Status', context: 'Verify system stability', priority: 'medium' },
        { nextAction: 'Show Inbox', context: 'Review responses', priority: 'low' }
      ]
    }
  }
};

export function useWorkflowVoiceEnhancement(config: VoiceWorkflowConfig) {
  const [isProcessing, setIsProcessing] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech synthesis
  const initializeSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      return true;
    }
    return false;
  }, []);

  // Get appropriate voice for JARVIS
  const getJarvisVoice = useCallback(() => {
    if (!synthRef.current) return null;
    
    const voices = synthRef.current.getVoices();
    
    // Prefer deep/male voices for JARVIS
    const preferredVoices = [
      'Google UK English Male',
      'Microsoft David - English (United States)',
      'Alex',
      'Daniel',
      'Google US English'
    ];
    
    for (const preferred of preferredVoices) {
      const voice = voices.find(v => v.name.includes(preferred));
      if (voice) return voice;
    }
    
    // Fallback to any English voice
    return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
  }, []);

  // Get dynamic voice response from email-driven API
  const getDynamicVoiceResponse = useCallback(async (command: string, persona: string): Promise<DynamicVoiceResponse> => {
    try {
      console.log('🎤 Voice Enhancement - Fetching dynamic response from API:', { command, persona });
      
      const response = await apiRequest('/api/voice-response', 'POST', { command, persona });

      console.log('🎤 Voice Enhancement - Dynamic response received:', response);
      
      return {
        response: response.response,
        suggestions: response.suggestions
      };
    } catch (error) {
      console.warn('🎤 Voice Enhancement - API call failed, using fallback:', error);
      
      // Use fallback responses if API fails
      const personaResponses = FALLBACK_VOICE_RESPONSES[persona.toLowerCase()];
      if (personaResponses && personaResponses[command]) {
        return personaResponses[command];
      }
      
      // Ultimate fallback
      return {
        response: `Command "${command}" executed successfully. Email-driven suggestions temporarily unavailable.`,
        suggestions: []
      };
    }
  }, []);

  // Provide voice response with dynamic workflow suggestions
  const provideVoiceResponse = useCallback(async (command: string, persona: string) => {
    console.log('🎤 Voice Enhancement - provideVoiceResponse called:', { command, persona, enabled: config.enabled, isProcessing });
    
    if (!config.enabled || isProcessing) {
      console.log('🎤 Voice Enhancement - Skipped (disabled or processing):', { enabled: config.enabled, isProcessing });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Get dynamic response from email-driven API
      const commandResponse = await getDynamicVoiceResponse(command, persona);
      
      console.log('🎤 Voice Enhancement - Dynamic response retrieved:', commandResponse);
      
      if (!initializeSpeech()) {
        console.warn('Speech synthesis not available');
        setIsProcessing(false);
        
        // Still show suggestions even if voice fails
        if (config.onWorkflowSuggestion && commandResponse.suggestions.length > 0) {
          setTimeout(() => {
            config.onWorkflowSuggestion!(commandResponse.suggestions);
          }, 500);
        }
        return;
      }
      
      const jarvisVoice = getJarvisVoice();
      const utterance = new SpeechSynthesisUtterance(commandResponse.response);
      
      if (jarvisVoice) {
        utterance.voice = jarvisVoice;
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 0.8;
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        setIsProcessing(false);
        
        // Show dynamic workflow suggestions after voice response
        if (config.onWorkflowSuggestion && commandResponse.suggestions.length > 0) {
          setTimeout(() => {
            config.onWorkflowSuggestion!(commandResponse.suggestions);
          }, 1000);
        }
      };
      
      utterance.onerror = (event) => {
        console.warn('Speech synthesis error:', event.error);
        setIsProcessing(false);
        
        // Still show suggestions even if voice fails
        if (config.onWorkflowSuggestion && commandResponse.suggestions.length > 0) {
          setTimeout(() => {
            config.onWorkflowSuggestion!(commandResponse.suggestions);
          }, 500);
        }
      };
      
      utteranceRef.current = utterance;
      
      // Small delay to ensure proper sequencing
      setTimeout(() => {
        if (synthRef.current && utteranceRef.current) {
          synthRef.current.speak(utteranceRef.current);
        }
      }, 100);
      
    } catch (error) {
      console.error('🎤 Voice Enhancement - Error in provideVoiceResponse:', error);
      setIsProcessing(false);
      
      // Fallback to generic response
      if (config.onWorkflowSuggestion) {
        setTimeout(() => config.onWorkflowSuggestion!([]), 500);
      }
    }
    
  }, [config, isProcessing, initializeSpeech, getJarvisVoice, getDynamicVoiceResponse]);

  // Stop current voice response
  const stopVoiceResponse = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsProcessing(false);
  }, []);

  return {
    provideVoiceResponse,
    stopVoiceResponse,
    isProcessing
  };
}
import { useCallback, useState } from 'react';
import { useVoiceOutput } from './useVoiceOutput';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface WorkflowSuggestion {
  action: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  context?: string;
}

interface VoiceResponse {
  acknowledgment: string;
  nextSteps: WorkflowSuggestion[];
  question?: string;
}

export function useIntelligentVoiceResponse() {
  const { speak, isSpeaking } = useVoiceOutput();
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  // Generate intelligent workflow suggestions based on command and persona
  const generateWorkflowSuggestions = useCallback((command: string, persona: string, context?: any): VoiceResponse => {
    const commandLower = command.toLowerCase();
    
    if (persona === 'rachel') {
      // Rachel (AUW) specific workflow intelligence
      if (commandLower.includes('send email')) {
        return {
          acknowledgment: "Email sent successfully to the broker. The documentation request has been delivered.",
          nextSteps: [
            { action: "Review Submissions", description: "Check for any new submissions while waiting for documents", priority: "high" },
            { action: "Risk Assessment", description: "Continue with pending risk assessments", priority: "medium" },
            { action: "Show Inbox", description: "Monitor for broker responses", priority: "low" }
          ],
          question: "Would you like me to show you any new submissions while we wait for the broker's response?"
        };
      }
      
      if (commandLower.includes('risk assessment')) {
        return {
          acknowledgment: "Risk assessment completed. The property shows low risk with favorable underwriting terms.",
          nextSteps: [
            { action: "Generate Quote", description: "Create policy quote based on assessment", priority: "high" },
            { action: "Review Submissions", description: "Check other pending assessments", priority: "medium" },
            { action: "Send Email", description: "Communicate findings to broker", priority: "medium" }
          ],
          question: "The risk analysis is favorable. Should I generate a policy quote for this submission?"
        };
      }
      
      if (commandLower.includes('review submissions')) {
        return {
          acknowledgment: "Submission review complete. You have new applications requiring attention.",
          nextSteps: [
            { action: "Risk Assessment", description: "Begin risk analysis for new submissions", priority: "high" },
            { action: "Send Email", description: "Request missing documentation", priority: "high" },
            { action: "Generate Quote", description: "Generate quotes for existing submissions", priority: "medium" }
          ],
          question: "I found submissions missing documentation. Should I prepare documentation request emails for the brokers?"
        };
      }
      
      if (commandLower.includes('generate quote')) {
        return {
          acknowledgment: "Policy quote generated successfully with competitive terms and coverage options.",
          nextSteps: [
            { action: "Send Email", description: "Send quote to broker for client review", priority: "high" },
            { action: "Review Submissions", description: "Continue with other pending quotes", priority: "medium" },
            { action: "Compliance Check", description: "Verify regulatory compliance", priority: "low" }
          ],
          question: "The quote is ready. Should I email this to the broker immediately?"
        };
      }
      
      if (commandLower.includes('show inbox')) {
        return {
          acknowledgment: "Inbox updated. You have new communications from brokers requiring review.",
          nextSteps: [
            { action: "Review Submissions", description: "Check submissions mentioned in emails", priority: "high" },
            { action: "Send Email", description: "Respond to broker inquiries", priority: "medium" },
            { action: "Broker Communication", description: "Follow up on correspondence", priority: "medium" }
          ],
          question: "I see responses from WTK Brokers with additional documentation. Should I review the updated submissions?"
        };
      }
      
    }
    
    // Default response for unmatched commands
    return {
      acknowledgment: `Command executed successfully. Task completed for ${persona} persona.`,
      nextSteps: [
        { action: "Review Submissions", description: "Check for new work items", priority: "medium" },
        { action: "Show Inbox", description: "Review communications", priority: "low" }
      ],
      question: "What would you like to work on next?"
    };
  }, []);

  // Execute command with voice response
  const executeCommandWithVoice = useMutation({
    mutationFn: async ({ command, persona, mode }: { command: string, persona: string, mode: string }) => {
      const response = await apiRequest('/api/commands', 'POST', { input: command, persona, mode });
      return response;
    },
    onSuccess: (data, variables) => {
      const { command, persona } = variables;
      
      // Generate intelligent response based on command and context
      const voiceResponse = generateWorkflowSuggestions(command, persona, data);
      
      // Speak the acknowledgment and question
      const spokenText = `${voiceResponse.acknowledgment} ${voiceResponse.question || ''}`;
      speak(spokenText, persona);
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      
      return { ...data, voiceResponse };
    },
    onError: (error) => {
      speak("I encountered an issue processing your request. Please try again.", 'admin');
    }
  });

  // Voice-activated workflow transition
  const suggestNextWorkflow = useCallback(async (currentCommand: string, persona: string) => {
    setIsProcessing(true);
    
    try {
      const suggestions = generateWorkflowSuggestions(currentCommand, persona);
      
      // Speak workflow suggestions
      if (suggestions.nextSteps.length > 0) {
        const highPriorityActions = suggestions.nextSteps
          .filter(step => step.priority === 'high')
          .map(step => step.action);
        
        if (highPriorityActions.length > 0) {
          const suggestionText = `I recommend: ${highPriorityActions.join(' or ')}. Which would you prefer?`;
          speak(suggestionText, persona);
        }
      }
      
      return suggestions;
    } finally {
      setIsProcessing(false);
    }
  }, [speak, generateWorkflowSuggestions]);

  // Enhanced command execution with contextual prompts
  const executeWithIntelligentPrompt = useCallback(async (command: string, persona: string, mode: string = 'Pills') => {
    return executeCommandWithVoice.mutateAsync({ command, persona, mode });
  }, [executeCommandWithVoice]);

  return {
    executeWithIntelligentPrompt,
    suggestNextWorkflow,
    isProcessing: isProcessing || executeCommandWithVoice.isPending,
    isSpeaking,
    generateWorkflowSuggestions
  };
}
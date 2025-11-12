import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { globalVoiceManager } from '@/utils/GlobalVoiceManager';
import { BrowserCompatibilityNotice } from '@/components/BrowserCompatibilityNotice';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Mic, 
  MessageSquare, 
  Mail, 
  Code, 
  Send,
  MicOff,
  Volume2,
  Clock,
  User
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface InteractionModeProps {
  currentPersona: string;
  onCommand: (command: string, mode: string) => void;
  isVoiceActive?: boolean;
  disabled?: boolean;
  onResponse?: (response: string) => void;
}

type InteractionType = 'Voice' | 'Chat' | 'Email' | 'API';

export function InteractionMode({ 
  currentPersona, 
  onCommand, 
  isVoiceActive = false, 
  disabled = false,
  onResponse
}: InteractionModeProps) {
  const [activeMode, setActiveMode] = useState<InteractionType>('Voice');
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showTranscripts, setShowTranscripts] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get user data for voice transcript storage
  const { data: user } = useQuery({ queryKey: ['/api/auth/user'] });

  // Voice Transcript queries with error handling
  const { data: transcriptsData, error: transcriptsError } = useQuery({
    queryKey: ['/api/voice/transcripts', currentPersona],
    queryFn: () => fetch(`/api/voice/transcripts?persona=${currentPersona}&limit=20`)
      .then(res => res.json())
      .catch(() => ({ transcripts: [] })), // Fallback for missing table
    refetchInterval: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
    retry: false
  });

  // Create voice transcript mutation
  const createTranscriptMutation = useMutation({
    mutationFn: (transcriptData: any) => 
      fetch('/api/voice/transcripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transcriptData)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/voice/transcripts'] });
    }
  });
  // Voice output capability check
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Voice Authentication Pattern Detection
  const isVoiceAuthenticationCommand = (transcript: string): boolean => {
    const authPatterns = [
      // "Morning, Jarvis, this is [persona]" - with flexible punctuation
      /morning,?\s+jarvis[.,]?\s+this\s+is\s+(rachel|john|admin)/i,
      // "Good morning Jarvis, this is [persona]"
      /good\s+morning,?\s+jarvis[.,]?\s+this\s+is\s+(rachel|john|admin)/i,
      // "Hey Jarvis, this is [persona]"
      /hey\s+jarvis[.,]?\s+this\s+is\s+(rachel|john|admin)/i,
      // "Jarvis, this is [persona]" - with flexible punctuation
      /jarvis[.,]?\s+this\s+is\s+(rachel|john|admin)/i,
      // "This is [persona]"
      /^this\s+is\s+(rachel|john|admin)$/i,
      // "Hello Jarvis, this is [persona]"
      /hello\s+jarvis[.,]?\s+this\s+is\s+(rachel|john|admin)/i,
      // "Jarvis start my day, this is [persona]"
      /jarvis[.,]?\s+start\s+my\s+day,?\s+this\s+is\s+(rachel|john|admin)/i,
      // "Hey JARVIS, start my day, this is [persona]"
      /hey\s+jarvis[.,]?\s+start\s+my\s+day,?\s+this\s+is\s+(rachel|john|admin)/i
    ];
    
    return authPatterns.some(pattern => pattern.test(transcript));
  };

  // Voice Authentication Handler
  const handleVoiceAuthentication = async (transcript: string) => {
    console.log('Voice authentication handler called with:', transcript);
    
    // Extract persona from transcript
    const personaMatch = transcript.match(/(rachel|john|admin)/i);
    if (!personaMatch) {
      console.log('No persona match found in transcript:', transcript);
      return;
    }
    
    const detectedPersona = personaMatch[1].toLowerCase();
    console.log('Detected persona:', detectedPersona);
    
    // Check if the command specifically requests a morning briefing
    const briefingPatterns = [
      /morning/i,
      /start\s+my\s+day/i,
      /good\s+morning/i,
      /hello.*jarvis/i
    ];
    
    const requestsBriefing = briefingPatterns.some(pattern => pattern.test(transcript));
    console.log('Command requests briefing:', requestsBriefing);
    
    toast({
      title: "Voice Authentication",
      description: `Welcome ${detectedPersona.charAt(0).toUpperCase() + detectedPersona.slice(1)}! Switching to your workspace...`,
      duration: 3000,
    });

    // Trigger persona authentication with briefing flag
    const authCommand = requestsBriefing 
      ? `authenticate ${detectedPersona} with-briefing`
      : `authenticate ${detectedPersona}`;
    
    console.log('Triggering voice auth command:', authCommand);
    onCommand(authCommand, 'Voice-Auth');
  };

  // Check browser speech recognition support
  const checkSpeechRecognitionSupport = () => {
    const hasWebkitSpeechRecognition = 'webkitSpeechRecognition' in window;
    const hasSpeechRecognition = 'SpeechRecognition' in window;
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isEdge = navigator.userAgent.indexOf('Edg') > -1;
    
    return {
      supported: hasWebkitSpeechRecognition || hasSpeechRecognition,
      preferredBrowser: isChrome || isEdge,
      hasWebkit: hasWebkitSpeechRecognition,
      hasStandard: hasSpeechRecognition
    };
  };

  // Initialize Speech Recognition and Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const speechSupport = checkSpeechRecognitionSupport();
      
      // Initialize Speech Recognition with better browser detection
      if (speechSupport.supported) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
        if (recognitionRef.current) {
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = 'en-US';
          
          recognitionRef.current.onstart = () => {
            console.log('Voice recognition started');
            setIsListening(true);
            setTranscript('');
            toast({
              title: "Voice Recognition Active",
              description: "Listening for your command...",
              duration: 2000,
            });
          };
          
          recognitionRef.current.onresult = (event: any) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            setTranscript(transcript);
            
            if (event.results[current].isFinal) {
              setInput(transcript);
              setIsListening(false);
              
              if (transcript.trim()) {
                console.log('Voice transcript received:', transcript.trim());
                
                // Save voice transcript to database (with fallback for missing table)
                try {
                  createTranscriptMutation.mutate({
                    userId: (user as any)?.id || '',
                    persona: currentPersona,
                    transcriptText: transcript.trim(),
                    isCommand: !isVoiceAuthenticationCommand(transcript.trim()),
                    confidence: event.results[current][0].confidence || 0.8,
                    processingStatus: 'processed'
                  });
                } catch (error) {
                  console.log('Voice transcript storage temporarily unavailable');
                }
                
                // Check for voice authentication patterns first
                if (isVoiceAuthenticationCommand(transcript.trim())) {
                  console.log('Voice authentication pattern detected');
                  handleVoiceAuthentication(transcript.trim());
                } else {
                  console.log('Processing as regular command');
                  // Process as regular command
                  onCommand(transcript.trim(), 'Voice');
                }
                setInput('');
                setTranscript('');
              }
            }
          };
          
          recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            
            let errorMessage = 'Voice recognition failed';
            
            switch (event.error) {
              case 'network':
                errorMessage = 'Voice recognition temporarily unavailable. Please use text input instead.';
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
            
            // For network errors, show a less intrusive message
            if (event.error === 'network') {
              toast({
                title: "Voice Input Offline",
                description: errorMessage,
                variant: "default",
                duration: 3000
              });
            } else {
              toast({
                title: "Voice Recognition Error", 
                description: errorMessage,
                variant: "destructive",
              });
            }
          };
          
          recognitionRef.current.onend = () => {
            console.log('Voice recognition ended');
            setIsListening(false);
          };
        }
      } else {
        // Handle browsers with limited speech recognition support
        const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        
        if (isFirefox) {
          toast({
            title: "Voice Input Limited in Firefox",
            description: "JARVIS voice output works perfectly! Use text commands and quick buttons below for input.",
            variant: "destructive",
            duration: 4000,
          });
        } else {
          toast({
            title: "Voice Not Supported",
            description: "Speech recognition is not supported in this browser. Try Chrome for voice input.",
            variant: "destructive",
            duration: 5000,
          });
        }
      }
      

    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onCommand, toast]);

  // Voice Response Function using global voice manager
  const speakResponse = async (text: string, forcePersona?: string) => {
    if (!isSupported) {
      console.warn('Speech synthesis not supported');
      return;
    }
    
    const persona = forcePersona || currentPersona;
    
    try {
      await globalVoiceManager.speak(text, persona);
    } catch (error) {
      console.error('Voice response error:', error);
    }
  };

  // Voice command triggers
  const startVoiceRecognition = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice Recognition Unavailable",
        description: "Speech recognition is not supported in this browser. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      console.log('Voice recognition already active');
      return;
    }

    try {
      console.log('Starting voice recognition...');
      recognitionRef.current.start();
    } catch (error: any) {
      console.error('Error starting voice recognition:', error);
      let errorMessage = "Could not start voice recognition. Please try again.";
      
      if (error.name === 'InvalidStateError') {
        errorMessage = "Voice recognition is already running. Please wait.";
      } else if (error.name === 'NotAllowedError') {
        errorMessage = "Microphone access denied. Please allow microphone permissions.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Speech recognition not supported in this browser.";
      }
      
      toast({
        title: "Voice Recognition Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current && isListening) {
      console.log('Stopping voice recognition...');
      recognitionRef.current.stop();
      setIsListening(false);
      setTranscript('');
    }
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCommand(input.trim(), activeMode);
      setInput('');
    }
  };

  const handlePillCommand = (command: string) => {
    onCommand(command, 'Pill');
  };

  // Global voice functions now handled by GlobalVoiceManager - no competing functions needed
  useEffect(() => {
    // GlobalVoiceManager handles all voice synthesis centrally
    // This prevents duplicate voice outputs during persona switching
  }, [currentPersona]);

  const getPersonaCommands = () => {
    switch (currentPersona) {
      case 'admin':
        return [
          'Show metrics',
          'View hierarchy',
          'Send Email',
          'Show Inbox',
          'Create agent',
          'Check integrations',
          'JARVIS status',
          'Agent status',
          'System diagnostics'
        ];
      case 'rachel':
        return [
          'Review Submissions',
          'Auto-Process Broker Emails',
          'Send Email',
          'Show Inbox',
          'Generate Quote',
          'Compliance Check',
          'Broker Communication'
        ];
      case 'john':
        return [
          'System Diagnostics',
          'Send Email',
          'Show Inbox',
          'Database Health Check',
          'Security Scan',
          'Incident Resolution',
          'JARVIS Agent Status'
        ];
      default:
        return [
          'Transcribe & Summarize',
          'Multilingual Conversation',
          'Extract Metadata',
          'Show Lead Pipeline'
        ];
    }
  };

  const getPlaceholderText = () => {
    switch (currentPersona) {
      case 'admin':
        return 'Try: Summarize last call, Talk in Hindi, Extract lead info...';
      case 'rachel':
        return 'Try: Review submissions, Auto-process emails, Generate quote...';
      case 'john':
        return 'Try: Check system health, Run diagnostics, Security scan...';
      default:
        return 'Try: Enter your command or use pill buttons below...';
    }
  };

  const interactionModes = [
    { type: 'Voice' as InteractionType, icon: isVoiceActive ? MicOff : Mic, activeColor: 'bg-blue-600 hover:bg-blue-700', inactiveColor: 'bg-slate-700 hover:bg-slate-600' },
    { type: 'Chat' as InteractionType, icon: MessageSquare, activeColor: 'bg-green-600 hover:bg-green-700', inactiveColor: 'bg-slate-700 hover:bg-slate-600' },
    { type: 'Email' as InteractionType, icon: Mail, activeColor: 'bg-purple-600 hover:bg-purple-700', inactiveColor: 'bg-slate-700 hover:bg-slate-600' },
    { type: 'API' as InteractionType, icon: Code, activeColor: 'bg-orange-600 hover:bg-orange-700', inactiveColor: 'bg-slate-700 hover:bg-slate-600' }
  ];

  return (
    <Card className="bg-slate-900/50 border-blue-500/30">
      <CardHeader>
        <CardTitle className="text-white text-lg">Interaction Mode</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Interaction Mode Buttons */}
        <div className="flex gap-2">
          {interactionModes.map(({ type, icon: Icon, activeColor, inactiveColor }) => (
            <Button
              key={type}
              onClick={() => {
                setActiveMode(type);
                // Auto-start voice recognition when Voice mode is selected
                if (type === 'Voice' && !isListening) {
                  setTimeout(() => startVoiceRecognition(), 100);
                }
              }}
              disabled={disabled}
              className={`flex items-center gap-2 px-4 py-2 transition-all duration-200 ${
                activeMode === type 
                  ? `${activeColor} text-white border-2 border-white/20 shadow-lg scale-105` 
                  : `${inactiveColor} text-slate-300 border-2 border-transparent`
              } disabled:bg-gray-600 disabled:text-gray-400`}
            >
              <Icon className="w-4 h-4" />
              {type}
            </Button>
          ))}
        </div>



        {/* Input Field */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-gray-800/50 rounded border border-gray-600 focus-within:border-blue-500 px-3 py-2">
            {activeMode === 'Voice' ? (
              <>
                <Button
                  type="button"
                  onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                  disabled={disabled || !recognitionRef.current}
                  className={`p-1 rounded-full ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                  size="sm"
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
                <Input
                  type="text"
                  value={transcript || input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Listening... speak now" : "Click microphone or type your command"}
                  className="flex-1 bg-transparent border-0 text-white placeholder-gray-400 focus:ring-0 p-0"
                  disabled={disabled}
                  readOnly={isListening}
                />
                {isListening && (
                  <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-xs animate-pulse">
                    🎤 Listening
                  </Badge>
                )}
                {globalVoiceManager.getIsSpeaking() && (
                  <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">
                    🔊 Speaking
                  </Badge>
                )}
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={getPlaceholderText()}
                  className="flex-1 bg-transparent border-0 text-white placeholder-gray-400 focus:ring-0 p-0"
                  disabled={disabled}
                />
              </>
            )}
          </div>
          
          {activeMode === 'Voice' ? (
            <Button
              type="button"
              onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
              disabled={disabled}
              className={`${
                isListening 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:bg-gray-600`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={disabled || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </form>

        {/* Pill Commands */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
            {getPersonaCommands().slice(0, 4).map((command) => (
              <motion.button
                key={command}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePillCommand(command)}
                disabled={disabled}
                className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-full px-3 py-1.5 text-xs text-white transition-colors disabled:opacity-50"
              >
                {command}
              </motion.button>
            ))}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
            {getPersonaCommands().slice(4, 8).map((command) => (
              <motion.button
                key={command}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePillCommand(command)}
                disabled={disabled}
                className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-full px-3 py-1.5 text-xs text-white transition-colors disabled:opacity-50"
              >
                {command}
              </motion.button>
            ))}
          </div>

          {/* Voice Status */}
          {globalVoiceManager.getIsSpeaking() && (
            <div className="flex items-center justify-center pt-2 border-t border-slate-700">
              <Badge variant="outline" className="text-blue-400 border-blue-500/30 bg-blue-500/10">
                <Volume2 className="w-3 h-3 mr-1" />
                Speaking
              </Badge>
            </div>
          )}

          {getPersonaCommands().length > 8 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
              {getPersonaCommands().slice(8).map((command) => (
                <motion.button
                  key={command}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePillCommand(command)}
                  disabled={disabled}
                  className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-full px-3 py-1.5 text-xs text-white transition-colors disabled:opacity-50"
                >
                  {command}
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

        {/* Voice Transcript History Toggle */}
        {activeMode === 'Voice' && (
          <div className="border-t border-slate-700 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTranscripts(!showTranscripts)}
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Clock className="w-4 h-4 mr-2" />
              {showTranscripts ? 'Hide' : 'Show'} Voice History
            </Button>
          </div>
        )}

        {/* Voice Transcript History Panel */}
        {showTranscripts && activeMode === 'Voice' && (
          <div className="border-t border-slate-700 mt-4 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-300">Voice Transcript History</h4>
              <Badge variant="outline" className="text-xs">
                {currentPersona}
              </Badge>
            </div>
            
            <ScrollArea className="h-48 w-full rounded border border-slate-600">
              <div className="p-3 space-y-2">
                {transcriptsData?.transcripts && transcriptsData.transcripts.length > 0 ? (
                  transcriptsData.transcripts.map((transcript: any, index: number) => (
                    <div
                      key={transcript.id || index}
                      className="bg-slate-800/50 rounded p-2 border border-slate-700"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200 break-words">
                            {transcript.transcriptText}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={transcript.isCommand ? "default" : "secondary"} 
                              className="text-xs"
                            >
                              {transcript.isCommand ? 'Command' : 'Auth'}
                            </Badge>
                            {transcript.confidence && (
                              <span className="text-xs text-slate-400">
                                {Math.round(transcript.confidence * 100)}% confident
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-slate-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(transcript.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <User className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                    <p className="text-sm text-slate-400">No voice transcripts yet</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Start speaking to JARVIS to see your voice history
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

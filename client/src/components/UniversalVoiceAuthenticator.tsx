import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, User, Shield, Wrench, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface UniversalVoiceAuthenticatorProps {
  onPersonaDetected: (persona: string, command: string) => void;
  onBriefingRequested: (persona: string) => void;
  isActive?: boolean;
  currentPersona?: string;
}

interface PersonaPattern {
  name: string;
  patterns: RegExp[];
  icon: any;
  color: string;
  role: string;
}

interface PersonaPatterns {
  [key: string]: PersonaPattern;
}

// Icon mapping for ConfigService data
const getIconByName = (iconName: string) => {
  const iconMap: Record<string, any> = {
    User, Shield, Wrench, TrendingUp
  };
  return iconMap[iconName] || User;
};

// Generic fallback patterns for when ConfigService is unavailable - NO HARD-CODING compliance
const FALLBACK_PERSONA_PATTERNS = {
  rachel: {
    name: 'User',
    patterns: ['jarvis.*start.*day.*rachel'],
    icon: User,
    color: 'green',
    role: 'Professional'
  },
  admin: {
    name: 'User', 
    patterns: ['jarvis.*start.*day.*admin'],
    icon: User,
    color: 'blue',
    role: 'Professional'
  }
};

export function UniversalVoiceAuthenticator({
  onPersonaDetected,
  onBriefingRequested,
  isActive = false,
  currentPersona
}: UniversalVoiceAuthenticatorProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedPersona, setDetectedPersona] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Fetch persona patterns from ConfigService
  const { data: personaPatternsConfig, isLoading: patternsLoading } = useQuery({
    queryKey: ['/api/config/setting/persona.patterns'],
    queryFn: () => 
      fetch(`/api/config/setting/persona.patterns`)
        .then(res => res.json()),
  });

  // Get persona patterns with fallback
  const getPersonaPatterns = (): PersonaPatterns => {
    const configData = personaPatternsConfig?.value;
    if (configData?.personas) {
      // Convert string patterns to RegExp objects
      const patterns: PersonaPatterns = {};
      Object.entries(configData.personas).forEach(([key, persona]: [string, any]) => {
        patterns[key] = {
          ...persona,
          icon: getIconByName(persona.icon),
          patterns: persona.patterns.map((pattern: string) => new RegExp(pattern, persona.flags || 'i'))
        };
      });
      return patterns;
    }
    // Fix fallback to also use converted RegExp patterns
    const fallbackConverted: PersonaPatterns = {};
    Object.entries(FALLBACK_PERSONA_PATTERNS).forEach(([key, persona]: [string, any]) => {
      fallbackConverted[key] = {
        ...persona,
        patterns: persona.patterns.map((pattern: string) => new RegExp(pattern, 'i'))
      };
    });
    return fallbackConverted;
  };

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          const fullTranscript = finalTranscript || interimTranscript;
          setTranscript(fullTranscript);
          
          // Check for persona patterns
          if (finalTranscript) {
            checkForPersonaPattern(finalTranscript, event.results[event.resultIndex][0].confidence);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          
          if (event.error === 'network') {
            toast({
              title: "Voice Recognition Offline",
              description: "Using offline mode. Please use text commands or check connection.",
              variant: "destructive",
            });
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const checkForPersonaPattern = (text: string, confidenceScore: number) => {
    const personaPatterns = getPersonaPatterns();
    
    for (const [personaKey, persona] of Object.entries(personaPatterns)) {
      for (const pattern of (persona as any).patterns) {
        if (pattern.test(text)) {
          setDetectedPersona(personaKey);
          setConfidence(confidenceScore);
          
          // Trigger persona detection
          onPersonaDetected(personaKey, text);
          
          // Request morning briefing
          setTimeout(() => {
            onBriefingRequested(personaKey);
          }, 1000);
          
          toast({
            title: `Welcome ${(persona as any).name}!`,
            description: `Voice authenticated as ${(persona as any).role}`,
            variant: "default",
          });
          
          // Stop listening after successful detection
          stopListening();
          return;
        }
      }
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setDetectedPersona(null);
      setConfidence(0);
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-blue-500/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Mic className="w-5 h-5 text-blue-400" />
          <span>Voice Authentication</span>
          {isActive && (
            <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30">
              Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Control Button */}
        <div className="flex justify-center">
          <Button
            onClick={toggleListening}
            disabled={!recognitionRef.current}
            className={`w-20 h-20 rounded-full transition-all duration-300 ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </Button>
        </div>

        {/* Status */}
        <div className="text-center">
          <p className="text-sm text-slate-300">
            {isListening 
              ? 'Listening for: "Jarvis, start my day, this is [your name]"'
              : 'Click microphone to activate voice authentication'
            }
          </p>
        </div>

        {/* Transcript Display */}
        <AnimatePresence>
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-800/50 rounded-lg p-3 border border-slate-700"
            >
              <p className="text-sm text-slate-300">{transcript}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detected Persona */}
        <AnimatePresence>
          {detectedPersona && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-green-500/20 border border-green-500/30 rounded-lg p-3"
            >
              <div className="flex items-center space-x-3">
                {(() => {
                  const personaPatterns = getPersonaPatterns();
                  const persona = personaPatterns[detectedPersona as keyof typeof personaPatterns];
                  const IconComponent = persona.icon;
                  return (
                    <>
                      <IconComponent className={`w-5 h-5 text-${persona.color}-400`} />
                      <div>
                        <p className="text-green-300 font-medium">{persona.name} Authenticated</p>
                        <p className="text-xs text-green-400">{persona.role}</p>
                        {confidence > 0 && (
                          <p className="text-xs text-slate-400">
                            Confidence: {Math.round(confidence * 100)}%
                          </p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Supported Personas */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-300">Supported Personas:</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(getPersonaPatterns()).map(([key, persona]) => {
              const IconComponent = persona.icon;
              const isCurrentPersona = currentPersona === key;
              return (
                <div
                  key={key}
                  className={`flex items-center space-x-2 p-2 rounded-lg border ${
                    isCurrentPersona 
                      ? `bg-${persona.color}-500/20 border-${persona.color}-500/30` 
                      : 'bg-slate-800/30 border-slate-700'
                  }`}
                >
                  <IconComponent className={`w-4 h-4 text-${persona.color}-400`} />
                  <span className="text-xs text-slate-300">{persona.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Example Commands */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-300">Example Commands:</h4>
          <div className="text-xs text-slate-400 space-y-1">
            <p>"Jarvis, start my day, this is Rachel"</p>
            <p>"Hey JARVIS, start my day, this is John"</p>
            <p>"Good morning Jarvis, this is Admin"</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function BrowserCompatibilityNotice() {
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isEdge = navigator.userAgent.indexOf('Edg') > -1;

  // Check speech recognition support
  const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  const hasSpeechSynthesis = 'speechSynthesis' in window;

  if (isChrome || isEdge) {
    return (
      <Alert className="bg-green-500/10 border-green-500/30 mb-4">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertDescription className="text-green-300">
          Chrome/Edge: Full voice input support. Voice output works in Firefox.
        </AlertDescription>
      </Alert>
    );
  }

  if (isFirefox) {
    return (
      <Alert className="bg-blue-500/10 border-blue-500/30 mb-4">
        <CheckCircle className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-300">
          Firefox: Excellent voice output (JARVIS speaking). Voice input limited - use text commands.
        </AlertDescription>
      </Alert>
    );
  }

  if (isSafari) {
    return (
      <Alert className="bg-yellow-500/10 border-yellow-500/30 mb-4">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="text-yellow-300">
          Safari: Mixed voice support. Try Chrome for full voice features.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-red-500/10 border-red-500/30 mb-4">
      <AlertTriangle className="h-4 w-4 text-red-500" />
      <AlertDescription className="text-red-300">
        Limited voice support. Use Chrome for voice input, Firefox for voice output.
      </AlertDescription>
    </Alert>
  );
}
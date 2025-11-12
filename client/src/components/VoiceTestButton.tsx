import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { globalVoiceManager } from '@/utils/GlobalVoiceManager';

interface VoiceTestButtonProps {
  persona?: string;
}

export function VoiceTestButton({ persona = 'admin' }: VoiceTestButtonProps) {
  const [isTesting, setIsTesting] = useState(false);

  const testVoice = async () => {
    if (isTesting) return;
    
    setIsTesting(true);
    console.log('=== JARVIS Voice Test Started ===');
    
    // Check speech synthesis support
    if (!window.speechSynthesis) {
      console.error('❌ Speech synthesis not supported');
      alert('Speech synthesis not supported in this browser');
      setIsTesting(false);
      return;
    }
    
    console.log('✅ Speech synthesis available');
    
    try {
      // Use GlobalVoiceManager for centralized voice handling
      const testMessage = `Hello! This is JARVIS testing voice output for ${persona} persona. Can you hear me speaking?`;
      
      console.log(`🎤 Testing voice for persona: ${persona}`);
      console.log('🔊 Using GlobalVoiceManager for voice synthesis');
      
      // GlobalVoiceManager handles all the browser-specific logic, voice selection, and error handling
      await globalVoiceManager.speak(testMessage, persona);
      
      console.log('✅ Voice test completed successfully');
    } catch (error) {
      console.error('❌ Voice test error:', error);
      alert(`Voice test failed: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Button
      onClick={testVoice}
      variant="outline"
      size="sm"
      disabled={isTesting}
      className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
      data-testid="button-test-voice"
    >
      {isTesting ? (
        <>
          <VolumeX className="w-3 h-3 mr-1" />
          Testing...
        </>
      ) : (
        <>
          <Volume2 className="w-3 h-3 mr-1" />
          Test Voice
        </>
      )}
    </Button>
  );
}
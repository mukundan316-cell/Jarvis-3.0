import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

export function AudioTestButton() {
  const [isTesting, setIsTesting] = useState(false);

  const testAudio = () => {
    if (isTesting) return;
    
    setIsTesting(true);
    console.log('=== Audio System Test ===');
    
    // Test 1: Basic audio context
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('✅ Audio Context available');
      
      // Create a simple beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      console.log('🔊 Playing test beep...');
      
      setTimeout(() => {
        console.log('✅ Audio test completed');
        setIsTesting(false);
      }, 600);
      
    } catch (error) {
      console.error('❌ Audio Context error:', error);
      
      // Fallback: Try speech synthesis directly
      console.log('⚠️ Trying speech synthesis as fallback...');
      
      const utterance = new SpeechSynthesisUtterance('Audio test');
      utterance.volume = 1.0;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
        console.log('✅ Speech synthesis test completed');
        setIsTesting(false);
      };
      
      utterance.onerror = (event) => {
        console.error('❌ Speech synthesis error:', event);
        setIsTesting(false);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Button
      onClick={testAudio}
      variant="outline"
      size="sm"
      disabled={isTesting}
      className="text-green-400 border-green-500/30 hover:bg-green-500/10"
    >
      {isTesting ? (
        <>
          <VolumeX className="w-3 h-3 mr-1" />
          Testing...
        </>
      ) : (
        <>
          <Volume2 className="w-3 h-3 mr-1" />
          Test Audio
        </>
      )}
    </Button>
  );
}
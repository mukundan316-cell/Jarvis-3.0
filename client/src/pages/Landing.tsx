import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BrainCircuit } from 'lucide-react';

export default function Landing() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Logo and Branding */}
        <div className="space-y-4">
          <div className="w-24 h-24 bg-gradient-to-r from-[#3B82F6] to-[#1E40AF] rounded-2xl flex items-center justify-center mx-auto">
            <BrainCircuit className="w-12 h-12 text-white" />
          </div>
          <div>
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              JARVIS®
            </h1>
            <p className="text-xl text-[#60A5FA] font-medium">META BRAIN</p>
            <p className="text-[#9CA3AF] mt-2">Powers all your complex Insurance Workflows Autonomously and Intelligently</p>
          </div>
        </div>

        {/* Description */}
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl font-semibold text-white">
            AI-Powered Insurance Industry Automation
          </h2>
          <p className="text-gray-300 leading-relaxed">
            JARVIS IntelliAgent 3.0 is a comprehensive 6-layer AI agent hierarchy designed 
            specifically for the insurance industry. Experience seamless workflow automation 
            with multi-persona authentication, voice interactions, and intelligent agent coordination.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="hexaware-glass">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BrainCircuit className="w-6 h-6 text-[#60A5FA]" />
              </div>
              <h3 className="font-bold text-white mb-2">6-Layer Architecture</h3>
              <p className="text-[#9CA3AF] text-sm">
                From Experience Agent personalization to Interface Layer interactions
              </p>
            </CardContent>
          </Card>

          <Card className="hexaware-glass">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BrainCircuit className="w-6 h-6 text-[#60A5FA]" />
              </div>
              <h3 className="font-bold text-white mb-2">Multi-Persona Support</h3>
              <p className="text-[#9CA3AF] text-sm">
                Admin, Underwriter (AUW), and IT Support personas with specialized workflows
              </p>
            </CardContent>
          </Card>

          <Card className="hexaware-glass">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BrainCircuit className="w-6 h-6 text-[#60A5FA]" />
              </div>
              <h3 className="font-bold text-white mb-2">Voice Interactions</h3>
              <p className="text-[#9CA3AF] text-sm">
                Natural language processing with real-time agent execution feedback
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Login Button */}
        <div className="pt-8">
          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-[#3B82F6] hover:bg-[#1E40AF] text-white px-8 py-3 text-lg font-bold"
          >
            Login with Replit
          </Button>
          <p className="text-[#9CA3AF] text-sm mt-3">
            Secure authentication powered by Replit
          </p>
        </div>
      </div>
    </div>
  );
}

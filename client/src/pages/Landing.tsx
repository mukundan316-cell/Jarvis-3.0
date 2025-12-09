import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BrainCircuit, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await apiRequest(endpoint, 'POST', { username, password });

      if (response.success) {
        toast({
          title: isLogin ? "Welcome back!" : "Account created!",
          description: "Logging you in...",
        });
        window.location.href = '/';
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || (isLogin ? "Login failed" : "Registration failed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

        {/* Login Form - Replaces "Login with Replit" button */}
        <div className="pt-8 max-w-sm mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-400 text-center"
              data-testid="input-username"
            />
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={5}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-400 text-center pr-10"
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full bg-[#3B82F6] hover:bg-[#1E40AF] text-white px-8 py-3 text-lg font-bold"
              data-testid="button-submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="mt-4 text-[#60A5FA] hover:text-[#3B82F6] text-sm"
            data-testid="button-toggle-mode"
          >
            {isLogin ? "New user? Create account" : "Have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { Building2, Users, Mic, Bell, Sparkles } from 'lucide-react';
import { PersonalizationWizard } from './PersonalizationWizard';
import { ExperiencePersonalizationTabs } from './ExperiencePersonalizationTabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ExperiencePersonalization() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Building2 className="w-6 h-6 text-blue-400 mr-3" />
            Experience Layer Personalization
          </h2>
          <p className="text-slate-400 mt-1">
            Configure JARVIS system for your insurance company's specific needs
          </p>
        </div>
      </div>


      {/* Comprehensive Experience Layer Configuration */}
      <ExperiencePersonalizationTabs />
    </div>
  );
}
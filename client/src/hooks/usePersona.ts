import { useQuery } from '@tanstack/react-query';
import type { PersonaType } from '@/lib/personaColors';

export function usePersona() {
  const { data: user } = useQuery<{ activePersona?: PersonaType }>({
    queryKey: ['/api/auth/user'],
  });

  const currentPersona = user?.activePersona || 'admin';

  return {
    currentPersona,
    user
  };
}
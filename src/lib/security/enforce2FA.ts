import { createClient } from '@/lib/supabase/server';

// Verifica se user precisa de 2FA mas não tem activado
export async function enforce2FA(): Promise<{ required: boolean; enrolled: boolean; role: string | null }> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { required: false, enrolled: false, role: null };
  
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role || 'student';
  const isPrivileged = ['admin', 'super_admin', 'instructor'].includes(role);
  
  if (!isPrivileged) return { required: false, enrolled: false, role };
  
  // Check MFA factors
  const { data: factors } = await sb.auth.mfa.listFactors();
  const enrolled = !!factors?.totp?.some((f: any) => f.status === 'verified');
  
  return { required: true, enrolled, role };
}

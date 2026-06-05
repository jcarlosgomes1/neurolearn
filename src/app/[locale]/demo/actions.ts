'use server';

import { createAdminClient } from '@/lib/supabase/server';

const PERSONA_EMAILS: Record<string, string> = {
  owner: 'demo-owner@neurolearn.demo',
  admin: 'demo-admin@neurolearn.demo',
  manager: 'demo-manager@neurolearn.demo',
  aluno: 'demo-aluno@neurolearn.demo',
  instrutor: 'demo-instrutor@neurolearn.demo',
  talent: 'demo-talent@neurolearn.demo',
};

const PERSONA_REDIRECT: Record<string, string> = {
  owner: '/pt/empresa/demo-inc',
  admin: '/pt/empresa/demo-inc',
  manager: '/pt/empresa/demo-inc',
  aluno: '/pt/learn',
  instrutor: '/pt/teach',
  talent: '/pt/talento',
};

export async function loginAsPersonaAction(persona: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  const email = PERSONA_EMAILS[persona];
  if (!email) return { ok: false, error: 'invalid_persona' };

  try {
    const sb = createAdminClient();
    const redirectPath = PERSONA_REDIRECT[persona] || '/pt';
    const { data, error } = await sb.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `https://neurolearn-rosy.vercel.app${redirectPath}` },
    });
    if (error) return { ok: false, error: error.message };
    const url = data?.properties?.action_link;
    if (!url) return { ok: false, error: 'no_action_link' };
    return { ok: true, url };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'unknown' };
  }
}

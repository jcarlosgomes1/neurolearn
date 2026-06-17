'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { toast } from 'sonner';

type OAuthProvider = 'google' | 'github' | 'azure';

export function LoginForm() {
  const t = useTranslations();
  const router = useRouter();
  const params = useSearchParams();
  const locale = useLocale();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success(t('login.welcome'));
    // #168: honrar lingua preferida no destino pos-login (semeia NEXT_LOCALE via router locale)
    let destLocale = locale;
    try {
      const { data: prof } = await supabase.from('nl_profiles').select('preferred_lang').eq('id', data.user!.id).maybeSingle();
      const pl = (prof as any)?.preferred_lang;
      if (pl && ['pt', 'en', 'es', 'fr'].includes(pl)) destLocale = pl;
    } catch {}
    const redirect = params.get('redirect_to') || params.get('next');
    if (redirect) { router.push(redirect as any); router.refresh(); return; }
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/auth-whoami`, {
        headers: { Authorization: `Bearer ${data.session?.access_token}` },
      });
      const me = await r.json();
      const area = me?.area;
      const dest = area === 'admin' ? '/admin' : area === 'instructor' ? '/teach' : '/learn';
      router.push(dest as any, { locale: destLocale });
    } catch { router.push('/learn' as any, { locale: destLocale }); }
    router.refresh();
  }

  async function handleOAuth(provider: OAuthProvider) {
    setOauthLoading(provider);
    const next = params.get('redirect_to') || params.get('next') || '';
    const redirectTo = `${window.location.origin}/${locale}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : undefined,
      },
    });
    if (error) {
      toast.error(t('login.oauth_error'));
      setOauthLoading(null);
    }
    // On success the browser is redirected away
  }

  return (
    <div className="space-y-4">
      {/* OAuth providers */}
      <div className="space-y-2">
        <button type="button" onClick={() => handleOAuth('google')} disabled={!!oauthLoading || loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium transition-colors disabled:opacity-50">
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
          </svg>
          <span>{oauthLoading === 'google' ? '…' : t('login.continue_with_google')}</span>
        </button>

        <button type="button" onClick={() => handleOAuth('github')} disabled={!!oauthLoading || loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors disabled:opacity-50">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.1.83-.26.83-.58v-2c-3.34.73-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.76-1.34-1.76-1.08-.74.08-.73.08-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18a4.65 4.65 0 0 1 1.24 3.22c0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.58A12 12 0 0 0 12 .3"/>
          </svg>
          <span>{oauthLoading === 'github' ? '…' : t('login.continue_with_github')}</span>
        </button>

        <button type="button" onClick={() => handleOAuth('azure')} disabled={!!oauthLoading || loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium transition-colors disabled:opacity-50">
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#7FBA00" d="M13 1h10v10H13z"/><path fill="#00A4EF" d="M1 13h10v10H1z"/><path fill="#FFB900" d="M13 13h10v10H13z"/>
          </svg>
          <span>{oauthLoading === 'azure' ? '…' : t('login.continue_with_microsoft')}</span>
        </button>
      </div>

      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 uppercase tracking-wider">{t('login.or_continue_with')}</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">{t('login.email')}</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">{t('login.password')}</label>
          <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
        </div>
        <button type="submit" disabled={loading || !!oauthLoading} className="btn-primary w-full">
          {loading ? t('login.entering') : t('login.btn')}
        </button>
      </form>

      <p className="text-xs text-center text-slate-400 pt-2">{t('login.sso_for_business')}</p>
    </div>
  );
}

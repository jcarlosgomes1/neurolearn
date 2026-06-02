'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { toast } from 'sonner';

export function LoginForm() {
  const t = useTranslations();
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success(t('login.welcome'));
    const redirect = params.get('redirect_to');
    if (redirect) { router.push(redirect as any); router.refresh(); return; }
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/auth-whoami`, {
        headers: { Authorization: `Bearer ${data.session?.access_token}` },
      });
      const me = await r.json();
      const area = me?.area;
      const dest = area === 'admin' ? '/admin' : area === 'instructor' ? '/teach' : '/learn';
      router.push(dest as any);
    } catch { router.push('/learn' as any); }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">{t('login.email')}</label>
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">{t('login.password')}</label>
        <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? t('login.entering') : t('login.btn')}
      </button>
    </form>
  );
}

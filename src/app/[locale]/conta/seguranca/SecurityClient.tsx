'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Shield, Key, Smartphone, ArrowLeft, Loader2, Eye, EyeOff, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';
import { changePasswordAction } from '../actions';

interface TotpFactor {
  id: string;
  friendly_name: string;
  status: string;
  created_at: string;
}

export function SecurityClient({ userEmail, totpFactors }: { userEmail: string; totpFactors: TotpFactor[] }) {
  const t = useTranslations();
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link href={`/conta` as any} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" /> {t('btn.back')}
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="h-6 w-6 text-brand-600" /> {t('security.title')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{t('security.subtitle')}</p>
      </div>

      <PasswordChangeCard />
      <TwoFactorCard initial={totpFactors} />

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-xs text-indigo-900">
        💡 <strong>{t('security.tip_label')}</strong>{t('security.tip_body')}
      </div>
    </div>
  );
}

function PasswordChangeCard() {
  const t = useTranslations();
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (pw.length < 8) { toast.error(t('security.pw_min')); return; }
    if (pw !== pw2) { toast.error(t('security.pw_mismatch')); return; }
    startTransition(async () => {
      const r = await changePasswordAction(pw);
      if (r.ok) { toast.success(t('security.pw_updated')); setPw(''); setPw2(''); }
      else toast.error(r.error || t('security.failed'));
    });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
      <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
        <Key className="h-4 w-4 text-brand-600" /> {t('security.pw_change_title')}
      </h3>
      <div className="space-y-3">
        <Field label={t('security.pw_new_label')}>
          <div className="relative">
            <input type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)}
              placeholder={t('security.pw_min_ph')} className="w-full text-sm px-3 py-2 pr-9 rounded-lg border border-slate-200 focus:border-brand-400 outline-none" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700">
              {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </Field>
        <Field label={t('security.pw_confirm_label')}>
          <input type={show ? 'text' : 'password'} value={pw2} onChange={(e) => setPw2(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200" />
        </Field>
        <button onClick={handleSubmit} disabled={isPending || !pw || !pw2}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
          {t('security.pw_update_btn')}
        </button>
      </div>
    </div>
  );
}

function TwoFactorCard({ initial }: { initial: TotpFactor[] }) {
  const t = useTranslations();
  const [factors, setFactors] = useState<TotpFactor[]>(initial);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollData, setEnrollData] = useState<{ id: string; qr_code: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [friendlyName, setFriendlyName] = useState('');
  const [isPending, startTransition] = useTransition();

  const verified = factors.filter((f) => f.status === 'verified');

  async function startEnroll() {
    setEnrolling(true);
    const sb = createClient();
    const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: friendlyName || 'NeuroLearn' });
    if (error) { toast.error(error.message); setEnrolling(false); return; }
    setEnrollData({ id: data.id, qr_code: data.totp.qr_code, secret: data.totp.secret });
  }

  function verifyEnroll() {
    if (!enrollData) return;
    if (code.length !== 6) { toast.error(t('security.code_6')); return; }
    startTransition(async () => {
      const sb = createClient();
      const { data: challenge, error: chErr } = await sb.auth.mfa.challenge({ factorId: enrollData.id });
      if (chErr) { toast.error(chErr.message); return; }
      const { data: verify, error: vErr } = await sb.auth.mfa.verify({ factorId: enrollData.id, challengeId: challenge.id, code });
      if (vErr) { toast.error(vErr.message); return; }
      toast.success(t('security.twofa_enabled'));
      setFactors((prev) => [...prev, { id: enrollData.id, friendly_name: friendlyName || 'NeuroLearn', status: 'verified', created_at: new Date().toISOString() }]);
      setEnrolling(false); setEnrollData(null); setCode(''); setFriendlyName('');
    });
  }

  function unenroll(factorId: string) {
    if (!confirm(t('security.confirm_unenroll'))) return;
    startTransition(async () => {
      const sb = createClient();
      const { error } = await sb.auth.mfa.unenroll({ factorId });
      if (error) { toast.error(error.message); return; }
      toast.success(t('security.factor_removed'));
      setFactors((prev) => prev.filter((f) => f.id !== factorId));
    });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
      <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
        <Smartphone className="h-4 w-4 text-brand-600" /> {t('security.twofa_title')}
      </h3>

      {verified.length > 0 ? (
        <div className="space-y-2 mb-4">
          {verified.map((f) => (
            <div key={f.id} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-900">{f.friendly_name}</span>
              </div>
              <button onClick={() => unenroll(f.id)} disabled={isPending} className="p-1.5 hover:bg-emerald-100 rounded">
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <div>{t('security.twofa_inactive')}</div>
        </div>
      )}

      {!enrolling ? (
        <button onClick={() => setEnrolling(true)} disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">
          <Smartphone className="h-4 w-4" /> {t('security.add_factor')}
        </button>
      ) : enrollData ? (
        <div className="space-y-3 border-t border-slate-100 pt-3 mt-3">
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
            <div dangerouslySetInnerHTML={{ __html: enrollData.qr_code }} className="inline-block" />
            <p className="text-xs text-slate-500 mt-2">{t('security.scan_hint')}</p>
            <div className="mt-2 text-[10px] font-mono bg-slate-50 rounded px-2 py-1 break-all">{enrollData.secret}</div>
          </div>
          <Field label={t('security.code_label')}>
            <input type="text" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder={t('security.code_ph')} autoComplete="off" inputMode="numeric"
              className="w-full text-center text-2xl font-mono tracking-widest px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-400 outline-none" />
          </Field>
          <div className="flex gap-2">
            <button onClick={() => { setEnrolling(false); setEnrollData(null); }} disabled={isPending}
              className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">{t('btn.cancel')}</button>
            <button onClick={verifyEnroll} disabled={isPending || code.length !== 6}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {t('security.confirm_activate')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 border-t border-slate-100 pt-3 mt-3">
          <Field label={t('security.name_optional')}>
            <input type="text" value={friendlyName} onChange={(e) => setFriendlyName(e.target.value)}
              placeholder={t('security.name_ph')}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200" />
          </Field>
          <div className="flex gap-2">
            <button onClick={() => setEnrolling(false)} className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">{t('btn.cancel')}</button>
            <button onClick={startEnroll} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">
              <Smartphone className="h-4 w-4" /> {t('security.gen_qr')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs text-slate-600 block mb-1">{label}</label>{children}</div>;
}

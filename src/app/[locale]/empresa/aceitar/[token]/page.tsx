import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { Building2, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { AcceptClient } from './AcceptClient';

export const dynamic = 'force-dynamic';

export default async function AcceptPage({ params }: { params: Promise<{ token: string; locale: string }> }) {
  const { token, locale } = await params;
  const sb = await createClient();
  const t = await getTranslations();
  const { data: inv } = await sb.rpc('nl_org_invitation_lookup', { p_token: token });
  const invitation = Array.isArray(inv) && inv.length > 0 ? inv[0] : null;
  const { data: { user } } = await sb.auth.getUser();

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <AppPageHeader title={safeT('empresa.aceitar.title', 'Aceitar convite')} emoji="🏢" />

        {!invitation ? (
          <StatusCard
            icon={XCircle}
            cls="from-rose-500 to-red-600"
            title="Convite não encontrado"
            description="Este link não corresponde a nenhum convite válido. Verifica se copiaste o URL completo ou contacta quem te convidou."
          />
        ) : invitation.status === 'accepted' ? (
          <StatusCard
            icon={CheckCircle}
            cls="from-emerald-500 to-teal-600"
            title="Já aceitaste este convite"
            description={`Já és membro de ${invitation.org_name}. Acede ao teu painel para começar.`}
            cta={{ href: '/conta/aprendizagem', label: 'Ir para o painel' }}
          />
        ) : invitation.status === 'expired' ? (
          <StatusCard
            icon={Clock}
            cls="from-amber-500 to-orange-600"
            title="Convite expirado"
            description={`Este convite para ${invitation.org_name} expirou. Pede ao admin para te enviar um novo.`}
          />
        ) : !user ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Foste convidado(a) para fazer parte de <strong className="text-slate-900">{invitation.org_name}</strong> como{' '}
              <span className="font-semibold text-violet-700">{invitation.role}</span>.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Para aceitar, inicia sessão com <strong>{invitation.email}</strong>. Se ainda não tens conta, regista-te primeiro.
              </p>
            </div>
            <div className="grid gap-2">
              <Link href={{ pathname: '/auth/login', query: { next: `/empresa/aceitar/${token}`, email: invitation.email } } as any}
                className="block text-center px-4 py-2.5 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-sm">
                Iniciar sessão e aceitar
              </Link>
              <Link href={{ pathname: '/auth/register', query: { next: `/empresa/aceitar/${token}`, email: invitation.email } } as any}
                className="block text-center px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg">
                Criar conta
              </Link>
            </div>
          </div>
        ) : (
          <AcceptClient
            token={token}
            invitation={invitation}
            userEmail={user.email || ''}
            mismatch={invitation.email.toLowerCase() !== (user.email || '').toLowerCase()}
          />
        )}
      </div>
    </div>
  );
}

function StatusCard({ icon: Icon, cls, title, description, cta }: { icon: any; cls: string; title: string; description: string; cta?: { href: string; label: string } }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
      <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-br ${cls} text-white items-center justify-center shadow-sm mb-3`}>
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="font-bold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-600 mt-2 leading-relaxed">{description}</p>
      {cta && (
        <Link href={cta.href as any}
          className="inline-block mt-4 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800">
          {cta.label}
        </Link>
      )}
    </div>
  );
}

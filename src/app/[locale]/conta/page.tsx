import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { User, Shield, Bell, Award, FileText, CreditCard, LogOut, Globe } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  
  const { data: profile } = await sb.from('nl_profiles').select('name, role, preferred_lang').eq('id', user.id).maybeSingle();
  const { data: unreadCount } = await sb.rpc('nl_notifications_unread_count');
  
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><User className="h-6 w-6 text-brand-600" /> A minha conta</h1>
        <p className="text-sm text-slate-500 mt-1">{profile?.name || user.email}</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AccountTile href={`/conta/perfil`} icon={<User className="h-5 w-5" />} title="Perfil" desc="Nome, idioma, contactos" color="text-brand-600" />
        <AccountTile href={`/conta/seguranca`} icon={<Shield className="h-5 w-5" />} title="Segurança" desc="Password, 2FA" color="text-emerald-600" />
        <AccountTile href={`/conta/notificacoes`} icon={<Bell className="h-5 w-5" />} title="Notificações" desc={`${unreadCount || 0} não lidas`} color="text-amber-600" badge={(unreadCount as number) || 0} />
        <AccountTile href={`/conta/certificados`} icon={<Award className="h-5 w-5" />} title="Certificados" desc="Conclusões e partilhar" color="text-indigo-600" />
        <AccountTile href={`/conta/privacidade`} icon={<FileText className="h-5 w-5" />} title="Privacidade" desc="Exportar, eliminar dados" color="text-rose-600" />
        {profile?.role === 'admin' && (
          <AccountTile href={`/conta/subscription`} icon={<CreditCard className="h-5 w-5" />} title="Admin" desc="Plataforma" color="text-slate-700" />
        )}
      </div>
      
      <form action={`/${locale}/logout`} method="POST" className="pt-2">
        <button type="submit" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium">
          <LogOut className="h-4 w-4" /> Terminar sessão
        </button>
      </form>
    </div>
  );
}

function AccountTile({ href, icon, title, desc, color, badge }: { href: string; icon: React.ReactNode; title: string; desc: string; color: string; badge?: number }) {
  return (
    <Link href={href as any} className="bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition p-4 group relative">
      <div className={`${color} mb-2`}>{icon}</div>
      <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">{title}</h3>
      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      {badge != null && badge > 0 && (
        <span className="absolute top-3 right-3 min-w-[18px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}

import { createClient } from '@/lib/supabase/server';
import { EmailTemplatesClient } from './EmailTemplatesClient';
import { Mail } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminEmailTemplatesPage() {
  const sb = await createClient();
  const { data: templates } = await sb.rpc('nl_admin_email_templates_list');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Mail className="h-3.5 w-3.5" /> Comunicação
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Templates de email</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
          Personaliza os emails transacionais por idioma. Suporta variáveis no formato <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">{`{{nome_variavel}}`}</code>.
        </p>
      </div>

      <EmailTemplatesClient templates={Array.isArray(templates) ? templates : []} />
    </div>
  );
}

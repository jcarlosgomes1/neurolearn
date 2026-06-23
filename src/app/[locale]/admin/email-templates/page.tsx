import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { EmailTemplatesClient } from './EmailTemplatesClient';

export const dynamic = 'force-dynamic';

export default async function AdminEmailTemplatesPage() {
  const sb = await createClient();
  const { data: templates } = await sb.rpc('nl_admin_email_templates_list');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="✉️"
        eyebrow="Comunicação"
        title="Templates de email"
      />
      <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
        Personaliza os emails transacionais por idioma. Suporta variáveis no formato <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">{`{{nome_variavel}}`}</code>.
      </p>

      <EmailTemplatesClient templates={Array.isArray(templates) ? templates : []} />
    </div>
  );
}

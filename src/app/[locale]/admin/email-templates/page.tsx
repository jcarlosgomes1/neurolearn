import { EmailTemplatesClient } from './EmailTemplatesClient';

export const dynamic = 'force-dynamic';

export default function AdminEmailTemplatesPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Email templates</h1>
        <p className="text-sm text-slate-500 mt-1">Edita os emails transacionais. Cada template tem variantes por idioma.</p>
      </div>
      <EmailTemplatesClient />
    </div>
  );
}

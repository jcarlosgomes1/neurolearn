import { SeoConsole } from './SeoConsole';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader emoji="🔎" title="SEO" description="Gere metadados por página e aplica sugestões. Tudo configurável." />
      <SeoConsole />
    </div>
  );
}

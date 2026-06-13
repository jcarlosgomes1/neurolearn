import { SeoConsole } from './SeoConsole';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <>
      <AdminPageHeader emoji="🔎" title="SEO" description="Gere metadados por página e aplica sugestões. Tudo configurável." />
      <SeoConsole />
    </>
  );
}

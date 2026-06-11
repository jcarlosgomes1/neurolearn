import { Link } from '@/i18n/routing';
import { AIFeaturesList } from './AIFeaturesList';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const metadata = { title: 'AI Features dos Instrutores · Admin' };

export default function Page() {
  return (
    <>

        <div className="">
          <AdminPageHeader backHref="/admin" emoji="🤖" title="AI Features dos Instrutores" description="Activa funcionalidades AI para cada instrutor aprovado. Por defeito, ninguém tem acesso." />
          <AIFeaturesList />
        </div>
      
    </>
  );
}

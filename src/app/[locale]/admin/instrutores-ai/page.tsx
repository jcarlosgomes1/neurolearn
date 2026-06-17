import { Link } from '@/i18n/routing';
import { AIFeaturesList } from './AIFeaturesList';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const metadata = { title: 'Funcionalidades dos Instrutores · Admin' };

export default function Page() {
  return (
    <>

        <div className="">
          <AdminPageHeader emoji="⚙️" title="Funcionalidades dos Instrutores" description="Activa funcionalidades avançadas para cada instrutor aprovado. Por defeito, ninguém tem acesso." />
          <AIFeaturesList />
        </div>
      
    </>
  );
}

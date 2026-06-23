import { Link } from '@/i18n/routing';
import { AIFeaturesList } from './AIFeaturesList';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const metadata = { title: 'Funcionalidades dos Instrutores · Admin' };

export default function Page() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        <div className="">
          <AdminPageHeader emoji="⚙️" title="Funcionalidades dos Instrutores" description="Activa funcionalidades avançadas para cada instrutor aprovado. Por defeito, ninguém tem acesso." />
          <AIFeaturesList />
        </div>
      
    </div>
  );
}

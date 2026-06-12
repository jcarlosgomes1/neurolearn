import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { TrendingUp } from 'lucide-react';
import { DemandQueueClient } from './DemandQueueClient';

export const dynamic = 'force-dynamic';

export default function AdminPathDemandPage() {
  return (
    <>
      <AdminPageHeader
        backHref="/admin/learning-paths"
        backLabel="Percursos"
        eyebrow="Percursos · Procura"
        eyebrowIcon={TrendingUp}
        icon={TrendingUp}
        iconGradient="from-fuchsia-500 to-violet-600"
        title="Procura & Propostas"
        description="Lacunas de percursos com procura real. Decide: gerar a formação por IA ou atribuir a um instrutor candidato."
      />
      <DemandQueueClient />
    </>
  );
}

'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Contact, Users, GraduationCap, Building2, ClipboardList, Handshake, FileText } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { CrmHub } from './CrmHub';
import { UsersTab } from './UsersTab';
import { EmpresasTab } from './EmpresasTab';
import { AdminInstructors } from '@/app/[locale]/admin/instrutores/AdminInstructors';
import { CandidaturasList } from '@/app/[locale]/admin/candidaturas/CandidaturasList';
import { MentoresCockpit } from '@/app/[locale]/admin/mentores/MentoresCockpit';
import { ClausesClient } from '@/app/[locale]/admin/instructor-terms/ClausesClient';
import { CourseTermsClient } from '@/app/[locale]/admin/course-terms/CourseTermsClient';

const TABS = [
  { k: 'crm', label: 'CRM', icon: Contact },
  { k: 'users', label: 'Utilizadores', icon: Users },
  { k: 'instrutores', label: 'Instrutores', icon: GraduationCap },
  { k: 'empresas', label: 'Empresas', icon: Building2 },
  { k: 'candidaturas', label: 'Candidaturas', icon: ClipboardList },
  { k: 'mentores', label: 'Mentores', icon: Handshake },
  { k: 'termos', label: 'Termos', icon: FileText },
] as const;

const KEYS = TABS.map((x) => x.k) as string[];

export function PessoasHub() {
  const t = useTranslations();
  const sp = useSearchParams();
  const requested = sp.get('tab') || 'crm';
  const [tab, setTab] = useState<string>(KEYS.includes(requested) ? requested : 'crm');
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <AppPageHeader title={t('pessoas.title')} description={t('pessoas.subtitle')} />
      <Tabs items={TABS} value={tab} onChange={setTab} />
      {tab === 'crm' && <CrmHub embedded />}
      {tab === 'users' && <UsersTab />}
      {tab === 'instrutores' && <AdminInstructors embedded />}
      {tab === 'empresas' && <EmpresasTab />}
      {tab === 'candidaturas' && <CandidaturasList embedded />}
      {tab === 'mentores' && <MentoresCockpit embedded />}
      {tab === 'termos' && (
        <div className="space-y-10">
          <ClausesClient />
          <CourseTermsClient />
        </div>
      )}
    </div>
  );
}

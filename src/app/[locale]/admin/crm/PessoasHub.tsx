'use client';

import { useState } from 'react';
import { Users, ClipboardList, GraduationCap, FileText } from 'lucide-react';
import { Tabs } from '@/components/ui/Tabs';
import { CrmHub } from './CrmHub';
import { CandidaturasList } from '@/app/[locale]/admin/candidaturas/CandidaturasList';
import { MentoresCockpit } from '@/app/[locale]/admin/mentores/MentoresCockpit';
import { ClausesClient } from '@/app/[locale]/admin/instructor-terms/ClausesClient';
import { CourseTermsClient } from '@/app/[locale]/admin/course-terms/CourseTermsClient';

const TABS = [
  { k: 'crm', label: 'CRM', icon: Users },
  { k: 'candidaturas', label: 'Candidaturas', icon: ClipboardList },
  { k: 'mentores', label: 'Mentores', icon: GraduationCap },
  { k: 'termos', label: 'Termos', icon: FileText },
] as const;

export function PessoasHub() {
  const [tab, setTab] = useState<string>('crm');
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <Tabs items={TABS} value={tab} onChange={setTab} />
      {tab === 'crm' && <CrmHub />}
      {tab === 'candidaturas' && <CandidaturasList />}
      {tab === 'mentores' && <MentoresCockpit />}
      {tab === 'termos' && (
        <div className="space-y-10">
          <ClausesClient />
          <CourseTermsClient />
        </div>
      )}
    </div>
  );
}

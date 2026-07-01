'use client';

import { useState } from 'react';
import { Users, ClipboardList, GraduationCap, FileText } from 'lucide-react';
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
    <>
      <div className="border-b border-slate-200 mb-5 flex gap-1 overflow-x-auto -mx-1 px-1">
        {TABS.map((tb) => {
          const Icon = tb.icon; const active = tab === tb.k;
          return (
            <button key={tb.k} type="button" onClick={() => setTab(tb.k)}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${active ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'}`}>
              <Icon className="h-4 w-4" /> {tb.label}
            </button>
          );
        })}
      </div>
      {tab === 'crm' && <CrmHub />}
      {tab === 'candidaturas' && <CandidaturasList />}
      {tab === 'mentores' && <MentoresCockpit />}
      {tab === 'termos' && (
        <div className="space-y-10">
          <ClausesClient />
          <CourseTermsClient />
        </div>
      )}
    </>
  );
}

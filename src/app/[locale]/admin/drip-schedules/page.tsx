import { createClient } from '@/lib/supabase/server';
import { DripClient } from './DripClient';
import { CalendarClock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDripSchedulesPage() {
  const sb = await createClient();
  const [{ data: schedules }, { data: courses }] = await Promise.all([
    sb.rpc('nl_admin_drip_schedules_list', { p_course_id: null }),
    sb.from('nl_courses').select('id, title, emoji').eq('published', true).order('title'),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <CalendarClock className="h-3.5 w-3.5" /> Drip content
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Calendarização de aulas</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
          Liberta aulas progressivamente após a inscrição — aumenta retenção e cria expectativa. Definido em dias a partir do enrolment.
        </p>
      </div>

      <DripClient
        schedules={Array.isArray(schedules) ? schedules : []}
        courses={Array.isArray(courses) ? courses : []}
      />
    </div>
  );
}

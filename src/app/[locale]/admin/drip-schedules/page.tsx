import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DripClient } from './DripClient';

export const dynamic = 'force-dynamic';

export default async function AdminDripSchedulesPage() {
  const sb = await createClient();
  const [{ data: schedules }, { data: courses }] = await Promise.all([
    sb.rpc('nl_admin_drip_schedules_list', { p_course_id: null }),
    sb.from('nl_courses').select('id, title, emoji').eq('published', true).order('title'),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="📅"
        eyebrow="Drip content"
        title="Calendarização de aulas"
        description="Liberta aulas progressivamente após a inscrição — aumenta retenção e cria expectativa. Definido em dias a partir do enrolment."
      />

      <DripClient
        schedules={Array.isArray(schedules) ? schedules : []}
        courses={Array.isArray(courses) ? courses : []}
      />
    </div>
  );
}

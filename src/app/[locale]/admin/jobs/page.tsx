import { Header } from '@/components/layout/Header';
import { AdminList } from '../AdminList';

export const metadata = { title: 'Jobs · Admin' };

export default function Page() {
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <AdminList
          title="Jobs"
          action="list_jobs"
          dataKey="rows"
          backHref="/admin"
          columns={[
            { key: 'job_type', label: 'Tipo', primary: true },
            { key: 'status', label: 'Estado', kind: 'badge' },
            { key: 'created_at', label: 'Criado', kind: 'reltime' },
          ]}
        />
      </main>
    </>
  );
}

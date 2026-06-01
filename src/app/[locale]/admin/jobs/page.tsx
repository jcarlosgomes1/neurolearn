import { AdminList } from '../AdminList';

export const metadata = { title: 'Jobs · Admin' };

export default function Page() {
  return (
    <>

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
      
    </>
  );
}

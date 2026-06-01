import { AdminList } from '../AdminList';

export const metadata = { title: 'Agentes · Admin' };

export default function Page() {
  return (
    <>

        <AdminList
          title="Agentes activos"
          action="list_agents"
          dataKey="agents"
          backHref="/admin"
          columns={[
            { key: 'name', label: 'Agente', primary: true },
            { key: 'status', label: 'Estado', kind: 'badge' },
            { key: 'last_active_at', label: 'Última atividade', kind: 'reltime' },
          ]}
        />
      
    </>
  );
}

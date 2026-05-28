import { ComingSoon } from '@/components/shared/ComingSoon';

export const metadata = { title: 'Cockpit Admin' };

export default function AdminPage() {
  return (
    <ComingSoon
      emoji="🛠️"
      title="Cockpit Administrador"
      description="A consola que opera a plataforma com 19 agentes IA. Aprovação de conteúdo em 1 tap, configuração de preços via experiments, gestão de campanhas social."
      features={[
        'Cockpit estilo Twitter — feed de sugestões dos agentes a aprovar com 1 tap',
        'Editor visual dos blocos da home (sem JSON cru)',
        'Aprovação de blog posts, social posts, novos cursos',
        '19 agentes activos com prompts editáveis',
        'Pricing experiments (A/B test automático)',
        'Compliance dashboard (GDPR, AI Act, facturação)',
        'Distribuição social automatizada',
      ]}
    />
  );
}

import { ComingSoon } from '@/components/shared/ComingSoon';

export const metadata = { title: 'Cockpit Admin' };

export default function AdminPage() {
  return (
    <ComingSoon
      emoji="\u{1F6E0}\uFE0F"
      title="Cockpit Administrador"
      description="A consola que opera a plataforma com 19 agentes IA. Aprova\u00e7\u00e3o de conte\u00fado em 1 tap, configura\u00e7\u00e3o de pre\u00e7os via experiments, gest\u00e3o de campanhas social."
      features={[
        'Cockpit estilo Twitter \u2014 feed de sugest\u00f5es dos agentes a aprovar com 1 tap',
        'Editor visual dos blocos da home (sem JSON cru)',
        'Aprova\u00e7\u00e3o de blog posts, social posts, novos cursos',
        '19 agentes activos com prompts edit\u00e1veis',
        'Pricing experiments (A/B test autom\u00e1tico)',
        'Compliance dashboard (GDPR, AI Act, factura\u00e7\u00e3o)',
        'Distribui\u00e7\u00e3o social automatizada',
      ]}
    />
  );
}

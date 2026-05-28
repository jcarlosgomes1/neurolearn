import { ComingSoon } from '@/components/shared/ComingSoon';

export const metadata = { title: 'Painel instrutor' };

export default function TeachPage() {
  return (
    <ComingSoon
      emoji="\u{1F393}"
      title="Painel Instrutor"
      description="Aqui vais gerir os teus cursos, alunos, payouts e reviews. Criar um curso novo levar\u00e1 menos de 1 hora com o nosso AI Course Designer."
      features={[
        'AI Course Designer (outline em 30s a partir do tema)',
        'Upload de v\u00eddeo Mux com transcoding autom\u00e1tico',
        'Gerador autom\u00e1tico de quizzes',
        'Marketing Pack autom\u00e1tico ao publicar',
        'Stripe Connect para receber pagamentos directamente',
        'Dashboard com receita, alunos e reviews em tempo real',
      ]}
    />
  );
}

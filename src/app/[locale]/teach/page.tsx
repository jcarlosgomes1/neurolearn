import { ComingSoon } from '@/components/shared/ComingSoon';

export const metadata = { title: 'Painel instrutor' };

export default function TeachPage() {
  return (
    <ComingSoon
      emoji="🎓"
      title="Painel Instrutor"
      description="Aqui vais gerir os teus cursos, alunos, payouts e reviews. Criar um curso novo levará menos de 1 hora com o nosso AI Course Designer."
      features={[
        'AI Course Designer (outline em 30s a partir do tema)',
        'Upload de vídeo Mux com transcoding automático',
        'Gerador automático de quizzes',
        'Marketing Pack automático ao publicar',
        'Stripe Connect para receber pagamentos directamente',
        'Dashboard com receita, alunos e reviews em tempo real',
      ]}
    />
  );
}

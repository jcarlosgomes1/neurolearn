import { ComingSoon } from '@/components/shared/ComingSoon';

export const metadata = { title: 'A minha aprendizagem' };

export default function LearnPage() {
  return (
    <ComingSoon
      emoji="📚"
      title="A tua área de aluno"
      description="Aqui vais ver os teus cursos, certificados, notificações e progresso. Estamos a construir o player com vídeo, notas e quizzes."
      features={[
        'Os meus cursos com barra de progresso por aula',
        'Player de vídeo Mux com legendas em 4 línguas',
        'Notas e marcadores por aula',
        'Certificados em PDF + verificáveis',
        'AI Tutor 24h dentro de cada curso',
      ]}
    />
  );
}

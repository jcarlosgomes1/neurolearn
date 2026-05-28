import { ComingSoon } from '@/components/shared/ComingSoon';

export const metadata = { title: 'A minha aprendizagem' };

export default function LearnPage() {
  return (
    <ComingSoon
      emoji="\u{1F4DA}"
      title="A tua \u00e1rea de aluno"
      description="Aqui vais ver os teus cursos, certificados, notifica\u00e7\u00f5es e progresso. Estamos a construir o player com v\u00eddeo, notas e quizzes."
      features={[
        'Os meus cursos com barra de progresso por aula',
        'Player de v\u00eddeo Mux com legendas em 4 l\u00ednguas',
        'Notas e marcadores por aula',
        'Certificados em PDF + verific\u00e1veis',
        'AI Tutor 24h dentro de cada curso',
      ]}
    />
  );
}

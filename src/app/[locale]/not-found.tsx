import { ComingSoon } from '@/components/shared/ComingSoon';

export const metadata = { title: 'Página não encontrada' };

export default function LocaleNotFound() {
  return (
    <ComingSoon
      emoji="🔍"
      title="Página não encontrada"
      description="A página que procuras não existe ou ainda está em construção. Volta à página inicial ou explora os nossos cursos."
    />
  );
}

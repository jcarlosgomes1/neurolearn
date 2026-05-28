import { ComingSoon } from '@/components/shared/ComingSoon';

export const metadata = { title: 'P\u00e1gina n\u00e3o encontrada' };

export default function LocaleNotFound() {
  return (
    <ComingSoon
      emoji="\u{1F50D}"
      title="P\u00e1gina n\u00e3o encontrada"
      description="A p\u00e1gina que procuras n\u00e3o existe ou ainda est\u00e1 em constru\u00e7\u00e3o. Volta \u00e0 p\u00e1gina inicial ou explora os nossos cursos."
    />
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Atelier · Preview de design',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-static';

// Rota de teste isolada: serve o preview da direção "Atelier" dentro do site,
// sem tocar em nenhuma página existente. O design real será integrado por fatias
// (tokens → modo foco → títulos) só depois de validado aqui.
export default function AtelierPreviewPage() {
  return (
    <iframe
      title="NeuroLearn · Atelier (preview de design)"
      src="/design/dir4-atelier.html"
      style={{ border: 0, width: '100%', height: '100dvh', display: 'block' }}
    />
  );
}

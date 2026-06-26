'use client';

import React from 'react';

const TXT: Record<string, { t: string; d: string; r: string }> = {
  pt: { t: 'Não foi possível mostrar esta aula', d: 'Ocorreu um erro ao carregar o conteúdo desta aula. Podes recarregar a página.', r: 'Recarregar' },
  en: { t: 'We could not display this lesson', d: 'An error occurred while loading this lesson. You can reload the page.', r: 'Reload' },
  es: { t: 'No se pudo mostrar esta lección', d: 'Ocurrió un error al cargar esta lección. Puedes recargar la página.', r: 'Recargar' },
  fr: { t: 'Impossible d’afficher ce cours', d: 'Une erreur est survenue lors du chargement. Vous pouvez recharger la page.', r: 'Recharger' },
};

interface Props { children: React.ReactNode; locale?: string }
interface State { hasError: boolean }

export class LessonErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(): State { return { hasError: true }; }
  componentDidCatch(error: unknown) { console.error('Lesson render error:', error); }
  render() {
    if (this.state.hasError) {
      const x = TXT[this.props.locale || 'pt'] || TXT.pt;
      return (
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-2xl font-bold text-amber-500">!</div>
            <h2 className="text-lg font-bold text-slate-900">{x.t}</h2>
            <p className="mt-2 text-sm text-slate-500">{x.d}</p>
            <button
              onClick={() => { if (typeof window !== 'undefined') window.location.reload(); }}
              className="mt-5 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              {x.r}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

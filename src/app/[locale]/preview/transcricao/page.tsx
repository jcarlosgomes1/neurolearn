'use client';

import { useState } from 'react';
import { LessonMedia } from '@/components/lesson/LessonMedia';
import type { TranscriptSegment } from '@/components/lesson/LessonTranscript';

const SAMPLE = 'https://test-streams.mux.dev/x36xhzz/url_0/url_525kbps.m3u8';

const DEMO: Record<string, TranscriptSegment[]> = {
  pt: [
    { start: 0, end: 4, text: 'Bem-vindo a esta aula. Hoje vamos explorar os conceitos essenciais passo a passo.' },
    { start: 4, end: 9, text: 'Primeiro, vamos perceber o problema que estamos a tentar resolver e porque é importante.' },
    { start: 9, end: 15, text: 'De seguida, mostro-te um exemplo prático para fixares a ideia com clareza.' },
    { start: 15, end: 21, text: 'Repara neste pormenor: é aqui que a maioria das pessoas se engana no início.' },
    { start: 21, end: 27, text: 'Agora vamos aplicar o que aprendemos a um caso real, do princípio ao fim.' },
    { start: 27, end: 33, text: 'Para terminar, resumo os pontos-chave e deixo-te um desafio para praticares.' },
  ],
  en: [
    { start: 0, end: 4, text: 'Welcome to this lesson. Today we will explore the essential concepts step by step.' },
    { start: 4, end: 9, text: 'First, we will understand the problem we are trying to solve and why it matters.' },
    { start: 9, end: 15, text: 'Next, I will show you a practical example to make the idea clear.' },
    { start: 15, end: 21, text: 'Notice this detail: this is where most people get it wrong at the start.' },
    { start: 21, end: 27, text: 'Now we will apply what we learned to a real case, from beginning to end.' },
    { start: 27, end: 33, text: 'To finish, I summarise the key points and leave you a challenge to practise.' },
  ],
};

function vttTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}.000`;
}

function toVtt(segs: TranscriptSegment[]): string {
  return 'WEBVTT\n\n' + segs.map((s, i) => `${i + 1}\n${vttTime(s.start)} --> ${vttTime(s.end)}\n${s.text}`).join('\n\n');
}

export default function TranscricaoPreviewPage() {
  const [lang, setLang] = useState('pt');
  const segs = DEMO[lang];
  const capSrc = 'data:text/vtt;charset=utf-8,' + encodeURIComponent(toVtt(segs));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transcrição interativa — pré-visualização</h1>
        <p className="text-sm text-slate-500 mt-1">
          Interface de demonstração. Carrega numa linha para saltar para esse momento, pesquisa dentro do vídeo,
          alterna o idioma e ativa as legendas no leitor. Com vídeo real, o texto é gerado automaticamente.
        </p>
      </div>
      <LessonMedia
        src={SAMPLE}
        title="Demonstração"
        captions={[{ lang, label: lang.toUpperCase(), src: capSrc }]}
        segments={segs}
        status="ready"
        available={['pt', 'en']}
        lang={lang}
        onLangChange={setLang}
      />
    </div>
  );
}

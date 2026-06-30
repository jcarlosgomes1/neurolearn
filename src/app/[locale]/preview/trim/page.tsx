'use client';

import { useState } from 'react';
import { VideoTrimmer } from '@/components/course-editor/VideoTrimmer';

export default function TrimPreviewPage() {
  const [blob, setBlob] = useState<Blob | null>(null);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 lg:py-12 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cortar vídeo — pré-visualização</h1>
        <p className="text-sm text-slate-500 mt-1">
          Escolhe um vídeo do teu dispositivo, define o <strong>início</strong> e o <strong>fim</strong>, e carrega em <strong>Cortar</strong>.
          O processamento acontece no teu browser (nada é enviado). No gravador, isto aparece logo a seguir à gravação.
        </p>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Vídeo</span>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setBlob(f); }}
          className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-white file:font-medium hover:file:bg-brand-700"
        />
      </label>

      {blob ? (
        <VideoTrimmer blob={blob} defaultOpen onTrimmed={(b) => setBlob(b)} />
      ) : (
        <p className="text-sm text-slate-400">Sem vídeo selecionado.</p>
      )}
    </div>
  );
}

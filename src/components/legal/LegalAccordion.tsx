'use client';

import { useState, useMemo } from 'react';
import { Markdown } from '@/components/shared/Markdown';
import { ChevronDown } from 'lucide-react';

interface Section {
  heading: string;
  body: string;
}

/**
 * Recebe markdown e converte cada H2 (`## Title`) em item de accordion.
 * Tudo acima do primeiro H2 fica como introdução estática.
 * Se não houver H2s, renderiza markdown normal.
 */
export function LegalAccordion({ source, pageTitle }: { source: string; pageTitle?: string }) {
  // Strip primeiro `# Title` se duplicar o pageTitle (header já renderizado fora)
  const cleanedSource = useMemo(() => {
    if (!source) return '';
    let s = source.trim();
    // Remove primeira H1 sempre — o título principal é renderizado pelo layout
    s = s.replace(/^#\s+[^\n]*\n+/, '');
    // Remove linha de ultima atualizacao no topo (duplica o subtitulo da pagina)
    s = s.replace(/^\*\*\s*(última atualiza|last updated|última actualiza|dernière mise)[^\n]*\n+/i, '');
    return s;
  }, [source]);

  const { intro, sections } = useMemo(() => parseSections(cleanedSource), [cleanedSource]);

  if (sections.length === 0) {
    return (
      <div className="prose prose-slate prose-sm sm:prose-base max-w-none prose-h2:font-bold prose-h2:text-slate-900 prose-h2:mt-8 prose-h2:mb-3 prose-p:text-slate-700 prose-p:leading-relaxed">
        <Markdown source={cleanedSource} />
      </div>
    );
  }

  return (
    <div>
      {intro.trim().length > 0 && (
        <div className="prose prose-slate prose-sm sm:prose-base max-w-none prose-p:text-slate-700 prose-p:leading-relaxed mb-8">
          <Markdown source={intro} />
        </div>
      )}
      <div className="space-y-2">
        {sections.map((s, i) => (
          <AccordionItem key={i} heading={s.heading} body={s.body} />
        ))}
      </div>
    </div>
  );
}

function AccordionItem({ heading, body }: Section) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-slate-300 transition-colors">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50/50 transition-colors">
        <span className="font-semibold text-slate-900 text-base">{heading}</span>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 -mt-1 prose prose-slate prose-sm max-w-none prose-p:text-slate-700 prose-p:leading-relaxed animate-in fade-in slide-in-from-top-1 duration-150">
          <Markdown source={body} />
        </div>
      )}
    </div>
  );
}

function parseSections(md: string): { intro: string; sections: Section[] } {
  if (!md) return { intro: '', sections: [] };
  const lines = md.split('\n');
  const sections: Section[] = [];
  let intro: string[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+?)\s*$/);
    if (h2Match) {
      if (current) sections.push(current);
      current = { heading: h2Match[1].trim(), body: '' };
    } else if (current) {
      current.body += line + '\n';
    } else {
      intro.push(line);
    }
  }
  if (current) sections.push(current);

  // Strip trailing whitespace in section bodies
  for (const s of sections) s.body = s.body.trim();

  return { intro: intro.join('\n').trim(), sections };
}

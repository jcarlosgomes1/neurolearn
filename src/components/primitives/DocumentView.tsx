import type { ReactNode } from 'react';
import { ScrollText, PenLine } from 'lucide-react';

function inline(text: string, keyBase: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={keyBase + '-' + i} className="font-semibold text-slate-900">{p.slice(2, -2)}</strong>;
    return <span key={keyBase + '-' + i}>{p}</span>;
  });
}

/** Renderizador markdown-lite: titulos (#/##/###), negrito (**), listas (-/*) e paragrafos. */
function renderMarkdownLite(md: string): ReactNode {
  const lines = (md || '').replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];
  const flushPara = (k: number) => { if (para.length) { blocks.push(<p key={'p' + k} className="text-sm text-slate-700 leading-relaxed mb-3">{inline(para.join(' '), 'p' + k)}</p>); para = []; } };
  const flushList = (k: number) => { if (list.length) { blocks.push(<ul key={'u' + k} className="list-disc pl-5 mb-3 space-y-1">{list.map((li, i) => <li key={i} className="text-sm text-slate-700 leading-relaxed">{inline(li, 'l' + k + '-' + i)}</li>)}</ul>); list = []; } };
  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (/^\s*$/.test(line)) { flushPara(idx); flushList(idx); return; }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushPara(idx); flushList(idx);
      const lvl = h[1].length;
      const cls = lvl === 1 ? 'text-lg font-bold text-slate-900 mt-1 mb-2' : lvl === 2 ? 'text-base font-semibold text-slate-900 mt-3 mb-2' : 'text-sm font-semibold text-slate-800 mt-2 mb-1';
      blocks.push(<p key={'h' + idx} className={cls}>{inline(h[2], 'h' + idx)}</p>);
      return;
    }
    const li = line.match(/^\s*[-*]\s+(.*)$/);
    if (li) { flushPara(idx); list.push(li[1]); return; }
    para.push(line.trim());
  });
  flushPara(9999); flushList(9999);
  return <div>{blocks}</div>;
}

/**
 * Primitivo Documento/Acordo — apresenta conteudo como um documento (contrato),
 * com cabecalho, selo de assinavel, metadados e bloco de assinatura.
 */
export function DocumentView({ eyebrow, title, signable, signableLabel, meta = [], bodyMd, signatureBlock }: {
  eyebrow?: string;
  title: string;
  signable?: boolean;
  signableLabel?: string;
  meta?: { label: string; value: string }[];
  bodyMd: string;
  signatureBlock?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
        {eyebrow && <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{eyebrow}</div>}
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2"><ScrollText className="w-5 h-5 text-amber-500 shrink-0" />{title}</h2>
          {signable && signableLabel && <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 text-[11px] font-medium px-2.5 py-1"><PenLine className="w-3 h-3" />{signableLabel}</span>}
        </div>
        {meta.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            {meta.map((m, i) => <span key={i} className="text-xs text-slate-500"><span className="text-slate-400">{m.label}:</span> <span className="font-medium text-slate-600">{m.value}</span></span>)}
          </div>
        )}
      </div>
      <div className="px-6 py-6 max-w-2xl">{renderMarkdownLite(bodyMd)}</div>
      {signatureBlock && <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">{signatureBlock}</div>}
    </div>
  );
}

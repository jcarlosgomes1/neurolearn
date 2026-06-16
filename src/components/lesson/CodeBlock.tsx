'use client';

import { useMemo } from 'react';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';

const LANGS = ['javascript', 'typescript', 'python', 'bash', 'json', 'sql', 'xml', 'css'];
let registered = false;
function ensureRegistered() {
  if (registered) return;
  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('typescript', typescript);
  hljs.registerLanguage('python', python);
  hljs.registerLanguage('bash', bash);
  hljs.registerLanguage('json', json);
  hljs.registerLanguage('sql', sql);
  hljs.registerLanguage('xml', xml);
  hljs.registerLanguage('css', css);
  registered = true;
}

// Tema escuro inline (sem import de CSS global — proibido fora do root no Next)
const THEME = `
.nl-hljs .hljs-comment,.nl-hljs .hljs-quote{color:#8b949e;font-style:italic}
.nl-hljs .hljs-keyword,.nl-hljs .hljs-selector-tag,.nl-hljs .hljs-built_in,.nl-hljs .hljs-meta{color:#ff7b72}
.nl-hljs .hljs-string,.nl-hljs .hljs-attr,.nl-hljs .hljs-template-tag,.nl-hljs .hljs-regexp{color:#a5d6ff}
.nl-hljs .hljs-number,.nl-hljs .hljs-literal,.nl-hljs .hljs-type{color:#79c0ff}
.nl-hljs .hljs-title,.nl-hljs .hljs-function .hljs-title,.nl-hljs .hljs-section{color:#d2a8ff}
.nl-hljs .hljs-variable,.nl-hljs .hljs-params,.nl-hljs .hljs-attribute{color:#ffa657}
.nl-hljs .hljs-tag,.nl-hljs .hljs-name{color:#7ee787}
.nl-hljs .hljs-symbol,.nl-hljs .hljs-bullet,.nl-hljs .hljs-link{color:#79c0ff}
.nl-hljs .hljs-emphasis{font-style:italic}.nl-hljs .hljs-strong{font-weight:700}
`;

export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const html = useMemo(() => {
    ensureRegistered();
    try {
      if (lang && LANGS.includes(lang)) return hljs.highlight(code, { language: lang }).value;
      return hljs.highlightAuto(code, LANGS).value;
    } catch {
      return null;
    }
  }, [code, lang]);

  return (
    <>
      <style>{THEME}</style>
      <pre className="nl-hljs text-slate-100 p-4 sm:p-5 text-xs sm:text-sm overflow-x-auto">
        {html ? <code dangerouslySetInnerHTML={{ __html: html }} /> : <code>{code}</code>}
      </pre>
    </>
  );
}

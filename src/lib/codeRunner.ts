// Motor de execução de código no browser para exercícios da sandbox.
// Python via Pyodide (carregado do CDN sob demanda); JavaScript em sandbox simples com consola capturada.

export type RunResult = { ok: boolean; output: string; error?: string };

const PYODIDE_VERSION = 'v0.26.4';
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

declare global {
  interface Window { loadPyodide?: (opts?: { indexURL?: string }) => Promise<unknown>; __nl_pyodide?: Promise<unknown>; }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Não foi possível carregar o motor de execução.'));
    document.head.appendChild(s);
  });
}

async function getPyodide(): Promise<{ runPythonAsync: (c: string) => Promise<unknown>; setStdout: (o: { batched: (s: string) => void }) => void; setStderr: (o: { batched: (s: string) => void }) => void }> {
  if (typeof window === 'undefined') throw new Error('no_window');
  if (!window.__nl_pyodide) {
    window.__nl_pyodide = (async () => {
      if (!window.loadPyodide) await loadScript(`${PYODIDE_BASE}pyodide.js`);
      if (!window.loadPyodide) throw new Error('Motor Python indisponível.');
      return await window.loadPyodide({ indexURL: PYODIDE_BASE });
    })();
  }
  return window.__nl_pyodide as Promise<never>;
}

export function pythonEngineReady(): boolean {
  return typeof window !== 'undefined' && !!window.__nl_pyodide;
}

async function runPython(code: string): Promise<RunResult> {
  let out = '';
  try {
    const py = await getPyodide();
    const sink = { batched: (s: string) => { out += s; if (!s.endsWith('\n')) out += '\n'; } };
    py.setStdout(sink); py.setStderr(sink);
    await py.runPythonAsync(code);
    return { ok: true, output: out };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, output: out, error: msg };
  }
}

function runJavaScript(code: string): RunResult {
  const logs: string[] = [];
  const fmt = (a: unknown[]) => a.map((x) => {
    try { return typeof x === 'string' ? x : JSON.stringify(x); } catch { return String(x); }
  }).join(' ');
  const sandboxConsole = { log: (...a: unknown[]) => logs.push(fmt(a)), info: (...a: unknown[]) => logs.push(fmt(a)), warn: (...a: unknown[]) => logs.push(fmt(a)), error: (...a: unknown[]) => logs.push(fmt(a)) };
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('console', `"use strict";\n${code}`);
    fn(sandboxConsole);
    return { ok: true, output: logs.join('\n') };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, output: logs.join('\n'), error: msg };
  }
}

export async function runCode(language: string, code: string): Promise<RunResult> {
  const lang = (language || 'python').toLowerCase();
  if (lang === 'javascript' || lang === 'js') return runJavaScript(code);
  if (lang === 'python' || lang === 'py') return await runPython(code);
  return { ok: false, output: '', error: `Linguagem não suportada na sandbox: ${language}` };
}

// Corre o código do aluno seguido do conjunto de testes. Passa se executar sem erros.
export async function runWithTests(language: string, code: string, tests: string | null): Promise<RunResult & { passed: boolean }> {
  if (!tests || !tests.trim()) {
    const r = await runCode(language, code);
    return { ...r, passed: r.ok };
  }
  const combined = `${code}\n\n${tests}`;
  const r = await runCode(language, combined);
  return { ...r, passed: r.ok };
}

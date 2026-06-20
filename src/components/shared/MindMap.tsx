'use client';

import { useMemo, useState, useCallback } from 'react';
import { MermaidRender } from '@/components/shared/MermaidRender';

/* ---------- tipos ---------- */
interface RawNode { id: string; label: string; decision: boolean }
interface TreeNode { id: string; label: string; decision: boolean; depth: number; edgeLabel?: string; children: TreeNode[] }
interface Laid { node: TreeNode; x: number; y: number; w: number; h: number; lines: string[]; hiddenCount: number }

/* ---------- parser mermaid flowchart -> arvore ---------- */
function cleanLabel(raw: string): string {
  return raw
    .replace(/<br\s*\/?>(?:\s*)/gi, ' ')
    .replace(/^["'`]|["'`]$/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFlowchart(code: string): { nodes: Record<string, RawNode>; edges: Array<{ from: string; to: string; label?: string }> } {
  const nodes: Record<string, RawNode> = {};
  const edges: Array<{ from: string; to: string; label?: string }> = [];
  const lines = code.split(/\r?\n/);

  // 1) declaracoes de nos com rotulo: id[..] id{..} id(..) id([..]) id((..))
  const declRe = /([A-Za-z0-9_]+)\s*(\[\[[^\]]*\]\]|\(\([^)]*\)\)|\(\[[^\]]*\]\)|\[[^\]]*\]|\{[^}]*\}|\([^)]*\))/g;
  for (const line of lines) {
    let m: RegExpExecArray | null;
    declRe.lastIndex = 0;
    while ((m = declRe.exec(line)) !== null) {
      const id = m[1];
      const wrap = m[2];
      const decision = wrap.startsWith('{');
      const inner = wrap.replace(/^[\[\({]+/, '').replace(/[\]\)}]+$/, '');
      if (!nodes[id] || nodes[id].label === id) nodes[id] = { id, label: cleanLabel(inner) || id, decision };
    }
  }

  // 2) arestas: remover grupos de rotulo, manter |label| de aresta
  const arrow = /(-->|---|-\.->|-\.-|==>|=\=>|--)/;
  for (const line of lines) {
    const stripped = line
      .replace(/\[\[[^\]]*\]\]|\(\([^)]*\)\)|\(\[[^\]]*\]\)|\[[^\]]*\]|\{[^}]*\}|\([^)]*\)/g, '')
      .trim();
    if (!arrow.test(stripped)) continue;
    const edgeRe = /([A-Za-z0-9_]+)\s*(?:-->|---|-\.->|-\.-|==>|--)\s*(?:\|([^|]+)\|\s*)?([A-Za-z0-9_]+)/g;
    let m: RegExpExecArray | null;
    while ((m = edgeRe.exec(stripped)) !== null) {
      const from = m[1]; const label = m[2] ? cleanLabel(m[2]) : undefined; const to = m[3];
      if (from && to && from !== to) {
        edges.push({ from, to, label });
        if (!nodes[from]) nodes[from] = { id: from, label: from, decision: false };
        if (!nodes[to]) nodes[to] = { id: to, label: to, decision: false };
      }
    }
  }
  return { nodes, edges };
}

function buildTree(code: string): TreeNode | null {
  const { nodes, edges } = parseFlowchart(code);
  const ids = Object.keys(nodes);
  if (ids.length < 2 || edges.length < 1) return null;

  const indeg: Record<string, number> = {};
  const out: Record<string, Array<{ to: string; label?: string }>> = {};
  ids.forEach((id) => { indeg[id] = 0; out[id] = []; });
  edges.forEach((e) => { indeg[e.to] = (indeg[e.to] || 0) + 1; out[e.from].push({ to: e.to, label: e.label }); });

  const roots = ids.filter((id) => indeg[id] === 0);
  const rootId = roots[0] || ids[0];

  const visited = new Set<string>();
  function walk(id: string, depth: number, edgeLabel?: string): TreeNode {
    visited.add(id);
    const n = nodes[id];
    const node: TreeNode = { id, label: n.label, decision: n.decision, depth, edgeLabel, children: [] };
    for (const nb of out[id] || []) {
      if (visited.has(nb.to)) continue;
      node.children.push(walk(nb.to, depth + 1, nb.label));
    }
    return node;
  }
  const root = walk(rootId, 0);
  // anexar nos nao alcancados como ramos do root (grafos desconexos)
  for (const id of ids) {
    if (!visited.has(id)) root.children.push(walk(id, 1));
  }
  return root;
}

/* ---------- wrap de texto ---------- */
function wrapLabel(label: string, max = 22, maxLines = 3): string[] {
  const words = label.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= max) cur = (cur + ' ' + w).trim();
    else { if (cur) lines.push(cur); cur = w; }
    if (lines.length >= maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines) {
    const joined = lines.join(' ');
    if (joined.length < label.length) lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…';
  }
  return lines.length ? lines : [label];
}

/* ---------- paleta por nivel ---------- */
const PALETTE = [
  { bg: '#eef2ff', border: '#c7d2fe', text: '#312e81', dot: '#6366f1' },
  { bg: '#f5f3ff', border: '#ddd6fe', text: '#5b21b6', dot: '#8b5cf6' },
  { bg: '#ecfeff', border: '#a5f3fc', text: '#155e75', dot: '#0891b2' },
  { bg: '#f0fdfa', border: '#99f6e4', text: '#115e59', dot: '#0d9488' },
  { bg: '#fffbeb', border: '#fde68a', text: '#92400e', dot: '#d97706' },
  { bg: '#fdf2f8', border: '#fbcfe8', text: '#9d174d', dot: '#db2777' },
];
const pal = (d: number) => PALETTE[Math.min(d, PALETTE.length - 1)];

const X_GAP = 232;
const NODE_W = 176;
const V_GAP = 16;
const LINE_H = 17;
const PAD_Y = 22;
const MARGIN = 28;

export function MindMap({ code, className = '' }: { code: string; className?: string }) {
  const tree = useMemo(() => { try { return buildTree(code || ''); } catch { return null; } }, [code]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setCollapsed((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }, []);

  const layout = useMemo(() => {
    if (!tree) return null;
    const items: Laid[] = [];
    let cursorY = MARGIN;
    let maxDepth = 0;

    function countHidden(n: TreeNode): number {
      let c = n.children.length;
      for (const ch of n.children) c += countHidden(ch);
      return c;
    }

    function place(n: TreeNode): Laid {
      const lines = wrapLabel(n.label);
      const h = lines.length * LINE_H + PAD_Y;
      const x = MARGIN + n.depth * X_GAP;
      maxDepth = Math.max(maxDepth, n.depth);
      const isCollapsed = collapsed.has(n.id);
      const kids = isCollapsed ? [] : n.children;
      let y: number;
      if (kids.length === 0) {
        y = cursorY;
        cursorY += h + V_GAP;
      } else {
        const laidKids = kids.map(place);
        const first = laidKids[0]; const last = laidKids[laidKids.length - 1];
        y = (first.y + first.h / 2 + last.y + last.h / 2) / 2 - h / 2;
      }
      const item: Laid = { node: n, x, y, w: NODE_W, h, lines, hiddenCount: isCollapsed ? countHidden(n) : 0 };
      items.push(item);
      return item;
    }
    place(tree);
    const width = MARGIN * 2 + (maxDepth + 1) * X_GAP - (X_GAP - NODE_W);
    const height = Math.max(cursorY + MARGIN, 160);
    return { items, width, height };
  }, [tree, collapsed]);

  if (!tree || !layout) {
    // conversao falhou -> fallback ao render tecnico
    return <MermaidRender code={code} className={className} />;
  }

  const byId = new Map(layout.items.map((it) => [it.node.id, it]));
  const motionOff = typeof document !== 'undefined' && document.documentElement.dataset.motion === 'off';

  return (
    <div className={`rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white ${className}`}>
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-[11px] text-slate-400">Toca num ramo para expandir ou recolher</span>
        <button
          onClick={() => setCollapsed(new Set())}
          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >Expandir tudo</button>
      </div>
      <div className="overflow-auto px-2 pb-3" style={{ maxHeight: 560 }}>
        <div className="relative mx-auto" style={{ width: layout.width, height: layout.height }}>
          <svg width={layout.width} height={layout.height} className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
            {layout.items.map((it) => {
              if (collapsed.has(it.node.id)) return null;
              return it.node.children.map((ch) => {
                const c = byId.get(ch.id);
                if (!c) return null;
                const x1 = it.x + it.w; const y1 = it.y + it.h / 2;
                const x2 = c.x; const y2 = c.y + c.h / 2;
                const mx = (x1 + x2) / 2;
                const color = pal(ch.depth).dot;
                return (
                  <g key={it.node.id + '-' + ch.id}>
                    <path d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={1.6} strokeOpacity={0.45} />
                    {ch.edgeLabel ? (
                      <foreignObject x={mx - 30} y={(y1 + y2) / 2 - 11} width={60} height={22} style={{ overflow: 'visible' }}>
                        <div className="flex justify-center">
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 whitespace-nowrap shadow-sm">{ch.edgeLabel}</span>
                        </div>
                      </foreignObject>
                    ) : null}
                  </g>
                );
              });
            })}
          </svg>

          {layout.items.map((it) => {
            const p = pal(it.node.depth);
            const hasKids = it.node.children.length > 0;
            const isCollapsed = collapsed.has(it.node.id);
            const isRoot = it.node.depth === 0;
            return (
              <div
                key={it.node.id}
                className={`absolute select-none ${hasKids ? 'cursor-pointer' : ''} ${motionOff ? '' : 'transition-all duration-200'}`}
                style={{ left: it.x, top: it.y, width: it.w }}
                onClick={() => hasKids && toggle(it.node.id)}
              >
                <div
                  className="rounded-2xl border px-3 py-2 shadow-sm hover:shadow-md flex items-start gap-2"
                  style={{
                    background: isRoot ? `linear-gradient(135deg, ${p.dot}, ${pal(1).dot})` : p.bg,
                    borderColor: isRoot ? 'transparent' : p.border,
                    boxShadow: it.node.decision ? `0 0 0 2px ${p.border} inset` : undefined,
                  }}
                >
                  <span className="mt-0.5 shrink-0 inline-block w-1.5 h-1.5 rounded-full" style={{ background: isRoot ? 'rgba(255,255,255,0.9)' : p.dot }} />
                  <div className="min-w-0 flex-1">
                    {it.lines.map((ln, i) => (
                      <p key={i} className={`leading-tight ${isRoot ? 'text-white font-bold text-[13px]' : 'font-semibold text-[12px]'}`} style={{ color: isRoot ? '#fff' : p.text }}>{ln}</p>
                    ))}
                  </div>
                  {hasKids ? (
                    <span
                      className="shrink-0 mt-0.5 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                      style={{ background: isRoot ? 'rgba(255,255,255,0.25)' : '#fff', color: isRoot ? '#fff' : p.text, border: isRoot ? 'none' : `1px solid ${p.border}` }}
                    >{isCollapsed ? '+' : '–'}</span>
                  ) : null}
                </div>
                {isCollapsed && it.hiddenCount > 0 ? (
                  <span className="ml-4 mt-0.5 inline-block text-[9px] text-slate-400">+{it.hiddenCount}</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'sec';
}

export function ArticleToc({ label }: { label: string }) {
  const [items, setItems] = useState<{ id: string; text: string }[]>([]);
  const [active, setActive] = useState<string>('');

  useEffect(() => {
    const root = document.getElementById('article-body');
    if (!root) return;
    const hs = Array.from(root.querySelectorAll('h2')) as HTMLElement[];
    const used = new Set<string>();
    const list = hs.map((h) => {
      const text = (h.textContent || '').trim();
      let id = h.id || slugify(text);
      const base = id; let n = 2;
      while (used.has(id)) { id = `${base}-${n++}`; }
      used.add(id);
      h.id = id;
      h.style.scrollMarginTop = '96px';
      return { id, text };
    });
    setItems(list);

    if (hs.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive((vis[0].target as HTMLElement).id);
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );
    hs.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, []);

  if (items.length < 2) return null;

  return (
    <nav className="text-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">{label}</div>
      <ol className="space-y-1">
        {items.map((it, i) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              onClick={(e) => { e.preventDefault(); const el = document.getElementById(it.id); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
              className={`flex gap-2 -ml-px border-l-2 pl-3 py-1 leading-snug transition-colors ${active === it.id ? 'border-brand-500 text-brand-700 font-medium' : 'border-slate-100 text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
            >
              <span className="text-slate-300 tabular-nums flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
              <span className="line-clamp-2">{it.text}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

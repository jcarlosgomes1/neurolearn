'use client';

import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { Link, useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { Search, BookOpen, Users, Package, Home, GraduationCap, Briefcase, Settings, Building2, Mail, FileText, Sparkles, ArrowRight } from 'lucide-react';

const QUICK_NAVS = [
  { id: 'home', label: 'Home', href: '/', icon: Home, group: 'Navigation' },
  { id: 'catalogo', label: 'Catálogo de cursos', href: '/cursos', icon: BookOpen, group: 'Navigation' },
  { id: 'bundles', label: 'Bundles', href: '/bundles', icon: Package, group: 'Navigation' },
  { id: 'precos', label: 'Preços', href: '/precos', icon: Sparkles, group: 'Navigation' },
  { id: 'learn', label: 'A minha aprendizagem', href: '/learn', icon: GraduationCap, group: 'Conta' },
  { id: 'teach', label: 'Ensinar', href: '/teach', icon: Briefcase, group: 'Conta' },
  { id: 'talento', label: 'Talent profile', href: '/talento', icon: Users, group: 'Conta' },
  { id: 'conta', label: 'A minha conta', href: '/conta', icon: Settings, group: 'Conta' },
  { id: 'empresas', label: 'Para empresas', href: '/empresas', icon: Building2, group: 'Empresa' },
  { id: 'blog', label: 'Blog', href: '/blog', icon: FileText, group: 'Mais' },
];

const ADMIN_NAVS = [
  { id: 'a-admin', label: 'Admin home', href: '/admin', icon: Home, group: 'Admin' },
  { id: 'a-rev', label: 'Revenue', href: '/admin/revenue', icon: Sparkles, group: 'Admin' },
  { id: 'a-mon', label: 'Monetização', href: '/admin/monetizacao', icon: Settings, group: 'Admin' },
  { id: 'a-orgs', label: 'Empresas', href: '/admin/empresas', icon: Building2, group: 'Admin' },
  { id: 'a-add', label: 'Add-ons', href: '/admin/addons', icon: Package, group: 'Admin' },
  { id: 'a-cup', label: 'Cupões', href: '/admin/cupoes', icon: FileText, group: 'Admin' },
  { id: 'a-inv', label: 'Invoices', href: '/admin/invoices', icon: FileText, group: 'Admin' },
  { id: 'a-ref', label: 'Refunds', href: '/admin/refunds', icon: FileText, group: 'Admin' },
  { id: 'a-ups', label: 'Upsell signals', href: '/admin/upsells', icon: Mail, group: 'Admin' },
];

export function CommandPalette({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ courses: any[]; instructors: any[]; bundles: any[] }>({ courses: [], instructors: [], bundles: [] });
  const [searching, setSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape' && open) setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) { setQuery(''); setResults({ courses: [], instructors: [], bundles: [] }); }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults({ courses: [], instructors: [], bundles: [] }); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const sb = createClient();
        const { data } = await sb.rpc('nl_global_search', { p_q: query.trim(), p_limit: 5 });
        if (data?.ok) setResults({ courses: data.courses || [], instructors: data.instructors || [], bundles: data.bundles || [] });
      } catch {}
      finally { setSearching(false); }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const navigate = useCallback((href: string) => {
    setOpen(false);
    router.push(href as any);
  }, [router]);

  const navs = isAdmin ? [...QUICK_NAVS, ...ADMIN_NAVS] : QUICK_NAVS;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4" onClick={() => setOpen(false)}>
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <Command label="Command palette" shouldFilter={false}>
          <div className="flex items-center gap-2 border-b border-slate-100 px-4">
            <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <Command.Input value={query} onValueChange={setQuery} placeholder="Procurar cursos, instrutores ou navegar..."
              className="flex-1 py-4 outline-none text-sm bg-transparent placeholder:text-slate-400" autoFocus />
            <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">ESC</kbd>
          </div>
          <Command.List className="max-h-96 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-slate-500">
              {searching ? 'A procurar...' : query.length >= 2 ? 'Nada encontrado.' : 'Começa a escrever para procurar.'}
            </Command.Empty>

            {results.courses.length > 0 && (
              <Command.Group heading="Cursos" className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-2 py-1">
                {results.courses.map((c) => (
                  <Command.Item key={c.id} value={c.id} onSelect={() => navigate(`/curso/${c.id}`)}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer aria-selected:bg-slate-100">
                    <div className="text-xl">{c.emoji || '📘'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{c.title}</div>
                      <div className="text-xs text-slate-500 truncate">{c.subtitle}</div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results.instructors.length > 0 && (
              <Command.Group heading="Instrutores" className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-2 py-1 mt-2">
                {results.instructors.map((i) => (
                  <Command.Item key={i.id} value={'ins-' + i.id} onSelect={() => navigate(`/instrutor/${i.public_slug || i.id}`)}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer aria-selected:bg-slate-100">
                    {i.avatar_url ? <img src={i.avatar_url} alt={i.display_name} className="h-8 w-8 rounded-full object-cover" /> :
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs">{i.display_name?.[0]}</div>}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{i.display_name}</div>
                      {i.rating_avg && <div className="text-xs text-slate-500">★ {Number(i.rating_avg).toFixed(1)}</div>}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results.bundles.length > 0 && (
              <Command.Group heading="Bundles" className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-2 py-1 mt-2">
                {results.bundles.map((b) => (
                  <Command.Item key={b.id} value={'bun-' + b.id} onSelect={() => navigate(`/bundles/${b.slug}`)}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer aria-selected:bg-slate-100">
                    <Package className="h-5 w-5 text-violet-500" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{b.title}</div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {query.length < 2 && (
              <>
                {Array.from(new Set(navs.map((n) => n.group))).map((group) => (
                  <Command.Group key={group} heading={group} className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-2 py-1 mt-1">
                    {navs.filter((n) => n.group === group).map((n) => {
                      const Icon = n.icon;
                      return (
                        <Command.Item key={n.id} value={n.id + ' ' + n.label} onSelect={() => navigate(n.href)}
                          className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer aria-selected:bg-slate-100">
                          <Icon className="h-4 w-4 text-slate-500" />
                          <span className="text-sm text-slate-700">{n.label}</span>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                ))}
              </>
            )}
          </Command.List>
          <div className="border-t border-slate-100 px-4 py-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>↑↓ navegar · ↵ abrir</span>
            <span>⌘K</span>
          </div>
        </Command>
      </div>
    </div>
  );
}

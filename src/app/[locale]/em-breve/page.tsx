export const dynamic = 'force-dynamic';

async function cfg() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const fallback = { company_name: 'NeuroLearn', coming_soon_title: 'Em breve', coming_soon_message: '' };
  try {
    const r = await fetch(`${url}/rest/v1/nl_platform_config?key=in.(company_name,coming_soon_title,coming_soon_message)&select=key,value`, {
      headers: { apikey: key as string, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!r.ok) return fallback;
    const rows = await r.json();
    const m: Record<string, string> = Object.fromEntries(rows.map((x: { key: string; value: string }) => [x.key, x.value]));
    return {
      company_name: m.company_name || fallback.company_name,
      coming_soon_title: m.coming_soon_title || fallback.coming_soon_title,
      coming_soon_message: m.coming_soon_message || fallback.coming_soon_message,
    };
  } catch {
    return fallback;
  }
}

export default async function EmBrevePage() {
  const c = await cfg();
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 animate-pulse rounded-full bg-violet-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 animate-pulse rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="relative z-10 mx-auto max-w-xl px-6 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-slate-300 backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          {c.company_name}
        </div>
        <h1 className="bg-gradient-to-r from-violet-300 via-white to-indigo-300 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
          {c.coming_soon_title}
        </h1>
        {c.coming_soon_message ? (
          <p className="mt-6 text-lg leading-relaxed text-slate-300">{c.coming_soon_message}</p>
        ) : null}
      </div>
    </main>
  );
}

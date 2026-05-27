interface Testimonial {
  n: string;        // name
  r: string;        // role
  t: string;        // text
  av: string;       // avatar initials
  rating: number;
}

interface TestimonialsData {
  title?: string;
  items: Testimonial[];
}

export function Testimonials({ data }: { data: TestimonialsData }) {
  if (!data?.items?.length) return null;
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        {data.title && (
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-slate-900 mb-12 tracking-tight text-balance">
            {data.title}
          </h2>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {data.items.map((t, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex gap-0.5 text-amber-400 mb-3">
                {Array.from({ length: t.rating || 5 }).map((_, j) => (
                  <span key={j}>★</span>
                ))}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed flex-1 text-pretty">{t.t}</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {t.av}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 text-sm truncate">{t.n}</div>
                  <div className="text-xs text-slate-500 truncate">{t.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

interface FeaturesData {
  title?: string;
  sub?: string;
  items: { ic: string; t: string; d: string }[];
}

export function Features({ data }: { data: FeaturesData }) {
  if (!data?.items?.length) return null;
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          {data.title && <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">{data.title}</h2>}
          {data.sub && <p className="mt-4 text-lg text-slate-600 text-pretty">{data.sub}</p>}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-brand-200 transition-all"
            >
              <div className="text-3xl mb-3">{item.ic}</div>
              <h3 className="font-semibold text-slate-900 text-lg">{item.t}</h3>
              <p className="mt-2 text-sm text-slate-600 text-pretty leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

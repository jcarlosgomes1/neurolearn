interface StatsData {
  items: { l: string; v: string }[];
}

export function Stats({ data }: { data: StatsData }) {
  if (!data?.items?.length) return null;
  return (
    <section style={{ background: 'var(--card)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {data.items.map((item, i) => (
            <div key={i} className="text-center">
              <div
                className="t-num tabular-nums"
                style={{ color: 'var(--accent)', fontSize: 'clamp(1.6rem, 1.2rem + 1.4vw, 2.25rem)', fontWeight: 600, lineHeight: 1 }}
              >
                {item.v}
              </div>
              <div className="t-eyebrow mt-2" style={{ color: 'var(--ink-3)' }}>{item.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

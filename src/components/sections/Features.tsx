import { Globe, Rocket, GraduationCap, Zap, MessageCircle, BarChart3, Sparkles, Award, ShieldCheck, Users, BookOpen, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { IconTile } from '@/components/shared/IconTile';
import { getIconPalette } from '@/lib/ui/icon-palette';

const ICONS: Record<string, LucideIcon> = {
  'globe': Globe, 'rocket': Rocket, 'graduation-cap': GraduationCap, 'zap': Zap,
  'message-circle': MessageCircle, 'bar-chart-3': BarChart3, 'sparkles': Sparkles,
  'award': Award, 'shield-check': ShieldCheck, 'users': Users, 'book-open': BookOpen, 'trending-up': TrendingUp,
};

interface FeaturesData {
  title?: string;
  sub?: string;
  items: { ic: string; t: string; d: string }[];
}

export async function Features({ data }: { data: FeaturesData }) {
  if (!data?.items?.length) return null;
  const palette = await getIconPalette();
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          {data.title && <h2 className="t-h2 text-slate-900 text-balance">{data.title}</h2>}
          {data.sub && <p className="mt-4 text-lg text-slate-600 text-pretty">{data.sub}</p>}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item, i) => {
            const Icon = ICONS[item.ic];
            return (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-brand-200 transition-all"
              >
                {Icon ? (
                  <IconTile Icon={Icon} from={palette[i % palette.length].from} to={palette[i % palette.length].to} className="mb-4" />
                ) : (
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-brand-50 text-brand-600 mb-4"><span className="text-2xl">{item.ic}</span></div>
                )}
                <h3 className="t-h3 text-slate-900">{item.t}</h3>
                <p className="mt-2 text-sm text-slate-600 text-pretty leading-relaxed">{item.d}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

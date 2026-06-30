import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

interface Plan {
  id: string;
  name: string;
  desc?: string;
  price: number;
  period?: string;
  billed?: string;
  popular?: boolean;
  features: string[];
}

interface PlansData {
  items: Plan[];
}

interface HeaderData {
  title?: string;
  sub?: string;
  cta?: string;
  popular?: string;
}

export function Pricing({ header, plans }: { header: HeaderData; plans: PlansData }) {
  const t = useTranslations();
  if (!plans?.items?.length) return null;
  return (
    <section className="py-20 bg-white" id="pricing">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          {header.title && <h2 className="t-h2 text-slate-900 text-balance">{header.title}</h2>}
          {header.sub && <p className="mt-4 text-lg text-slate-600 text-pretty">{header.sub}</p>}
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.items.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 flex flex-col transition-all ${
                plan.popular
                  ? 'border-brand-500 shadow-xl bg-gradient-to-br from-white to-brand-50/30 scale-[1.02]'
                  : 'border-slate-200 bg-white hover:shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-600 text-white text-xs font-semibold">
                  {header.popular || t('pricing.most_popular')}
                </div>
              )}
              <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
              {plan.desc && <p className="mt-1 text-sm text-slate-500">{plan.desc}</p>}

              <div className="mt-6">
                <span className="text-4xl font-bold text-slate-900">€{plan.price}</span>
                {plan.period && <span className="text-slate-500 ml-1">{plan.period}</span>}
              </div>
              {plan.billed && <p className="text-xs text-slate-500 mt-1">{plan.billed}</p>}

              <ul className="mt-6 space-y-2.5 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/register?plan=${plan.id}` as any}
                className={`mt-6 w-full text-center py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  plan.popular
                    ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md'
                    : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {header.cta || t('btn.start')}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

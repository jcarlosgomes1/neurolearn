/**
 * Schema.org JSON-LD components para SEO.
 * Usar diretamente em page server components (async).
 */
import { getPlatformBrand } from '@/lib/platform-brand';

export async function CourseStructuredData({ course, baseUrl }: {
  course: {
    title: string; description?: string | null; slug: string;
    duration_hours?: number | null; level?: string | null; language?: string | null;
    instructor_name?: string | null; instructor_id?: string | null;
    price_cents?: number | null; currency?: string | null;
    rating_avg?: number | null; rating_count?: number | null;
    skills?: string[] | null; created_at?: string | null;
    cover_url?: string | null;
  };
  baseUrl?: string;
}) {
  const brand = await getPlatformBrand();
  const base = baseUrl || brand.url;
  const url = `${base}/cursos/${course.slug}`;

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description || course.title,
    provider: { '@type': 'Organization', name: brand.name, sameAs: base },
    url,
    inLanguage: course.language || 'pt',
    educationalLevel: course.level || 'Beginner',
  };

  if (course.cover_url) data.image = course.cover_url;
  if (course.instructor_name) data.instructor = { '@type': 'Person', name: course.instructor_name };

  if (course.duration_hours) {
    const hours = Math.max(1, Math.round(course.duration_hours));
    data.timeRequired = `PT${hours}H`;
  }

  if (course.price_cents != null && course.price_cents > 0) {
    data.offers = {
      '@type': 'Offer',
      price: (course.price_cents / 100).toFixed(2),
      priceCurrency: course.currency || 'EUR',
      availability: 'https://schema.org/InStock',
      url,
    };
  } else if (course.price_cents === 0) {
    data.isAccessibleForFree = true;
  }

  if (course.rating_avg && course.rating_count && course.rating_count > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: course.rating_avg.toFixed(2),
      reviewCount: course.rating_count,
      bestRating: 5, worstRating: 1,
    };
  }

  if (course.skills && course.skills.length > 0) data.teaches = course.skills;
  if (course.created_at) data.datePublished = course.created_at;

  data.hasCourseInstance = {
    '@type': 'CourseInstance',
    courseMode: 'Online',
    courseWorkload: course.duration_hours ? `PT${Math.max(1, Math.round(course.duration_hours))}H` : undefined,
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export async function OrganizationStructuredData({ baseUrl }: { baseUrl?: string }) {
  const brand = await getPlatformBrand();
  const base = baseUrl || brand.url;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand.name,
    url: base,
    logo: `${base}/apple-icon`,
    description: brand.description || undefined,
    sameAs: [],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export async function WebsiteStructuredData({ baseUrl }: { baseUrl?: string }) {
  const brand = await getPlatformBrand();
  const base = baseUrl || brand.url;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: brand.name,
    url: base,
    description: brand.description || undefined,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${base}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export async function BreadcrumbStructuredData({ items, baseUrl }: {
  items: Array<{ name: string; href: string }>;
  baseUrl?: string;
}) {
  const brand = await getPlatformBrand();
  const base = baseUrl || brand.url;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.href.startsWith('http') ? item.href : `${base}${item.href}`,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function FAQStructuredData({ items }: { items: Array<{ q: string; a: string }> }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export async function ArticleStructuredData({ post, baseUrl }: {
  post: {
    title: string; description?: string | null; slug: string;
    cover_url?: string | null; published_at?: string | null;
    author_name?: string | null; updated_at?: string | null;
  };
  baseUrl?: string;
}) {
  const brand = await getPlatformBrand();
  const base = baseUrl || brand.url;
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description || post.title,
    image: post.cover_url || undefined,
    datePublished: post.published_at || undefined,
    dateModified: post.updated_at || post.published_at || undefined,
    author: { '@type': 'Person', name: post.author_name || brand.name },
    publisher: {
      '@type': 'Organization',
      name: brand.name,
      logo: { '@type': 'ImageObject', url: `${base}/apple-icon` }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${base}/blog/${post.slug}` },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

import { getNavItems } from '@/lib/api/nav-items';
import FooterClient from './FooterClient';

interface FooterData { brand?: string }

export async function Footer({ data }: { data: FooterData }) {
  const [platform, solutions, company, legal] = await Promise.all([
    getNavItems('footer_platform'),
    getNavItems('footer_solutions'),
    getNavItems('footer_company'),
    getNavItems('footer_legal'),
  ]);
  return <FooterClient data={data} platform={platform} solutions={solutions} company={company} legal={legal} />;
}

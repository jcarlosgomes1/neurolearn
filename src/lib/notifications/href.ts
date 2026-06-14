// Fonte ÚNICA de resolução de destino de uma notificação.
// Regra: tem destino associado -> serve de atalho; não tem -> fica só informação.
// Mapa centralizado (sem hardcode espalhado pelas superfícies). Reutilizável por
// qualquer superfície (dropdown do sino, página de notificações, painel do dashboard)
// e por tipos futuros: basta acrescentar um caso aqui.
//
// IMPORTANTE: devolve sempre um caminho SEM prefixo de locale. As superfícies usam
// o <Link> de next-intl (localePrefix: 'always'), que adiciona o locale. Devolver o
// locale aqui criaria caminhos duplicados (/pt/pt/...). Devolve null quando não há
// destino — nesse caso a notificação fica como texto não-clicável.

export interface NotificationLike {
  link_kind?: string | null;
  link_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

export function notificationHref(n: NotificationLike): string | null {
  const kind = n.link_kind || null;
  const id = n.link_id || null;
  const meta = (n.metadata || {}) as Record<string, any>;

  switch (kind) {
    // Aprovação de agente: o metadata costuma trazer o URL completo do destino
    // (ex.: https://.../admin/agentes). Extraímos o pathname e removemos o locale,
    // deixando o <Link> next-intl voltar a prefixá-lo.
    case 'agent_approval': {
      const raw = typeof meta.url === 'string' ? meta.url : null;
      if (!raw) return '/admin/agentes';
      try {
        const path = raw.startsWith('http') ? new URL(raw).pathname : raw;
        return stripLocale(path);
      } catch {
        return '/admin/agentes';
      }
    }

    // Proposta de curso B2B -> página da proposta da organização.
    case 'proposal': {
      const slug = meta.org_slug || null;
      if (!slug || !id) return null;
      return `/empresa/${slug}/cursos/propostas/${id}`;
    }

    // Ingestão / conteúdos da organização.
    case 'org_content': {
      const slug = meta.org_slug || null;
      return slug ? `/empresa/${slug}/conteudo` : null;
    }

    case 'course':
      return id ? `/curso/${id}` : null;

    case 'certificate':
      return '/conta/certificados';

    case 'billing':
      return '/conta/subscription';

    case 'gdpr':
      return '/conta/privacidade';

    case 'evaluation':
      return '/teach/avaliacoes-pendentes';

    case 'org': {
      const slug = meta.org_slug || id || null;
      return slug ? `/empresa/${slug}` : null;
    }

    default:
      return null;
  }
}

function stripLocale(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return clean.replace(/^\/(pt|en|es|fr)(?=\/|$)/, '') || '/';
}

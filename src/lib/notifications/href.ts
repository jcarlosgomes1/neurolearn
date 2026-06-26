// Fonte UNICA de resolucao de destino de uma notificacao.
// Regra: tem destino associado -> serve de atalho; nao tem -> fica so informacao.
// Mapa centralizado (sem hardcode espalhado pelas superficies). Reutilizavel por
// qualquer superficie (dropdown do sino, pagina de notificacoes, painel do dashboard)
// e por tipos futuros: basta acrescentar um caso aqui.
//
// IMPORTANTE: devolve sempre um caminho SEM prefixo de locale. As superficies usam
// o <Link> de next-intl (localePrefix: 'always'), que adiciona o locale. Devolver o
// locale aqui criaria caminhos duplicados (/pt/pt/...). Devolve null quando nao ha
// destino — nesse caso a notificacao fica como texto nao-clicavel.

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
    // Aprovacao de agente: o metadata costuma trazer o URL completo do destino
    // (ex.: https://.../admin/agentes). Extraimos o pathname e removemos o locale,
    // deixando o <Link> next-intl voltar a prefixa-lo.
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

    // Proposta de curso B2B -> pagina da proposta da organizacao.
    case 'proposal': {
      const slug = meta.org_slug || null;
      if (!slug || !id) return null;
      return `/empresa/${slug}/cursos/propostas/${id}`;
    }

    // Ingestao / conteudos da organizacao.
    case 'org_content': {
      const slug = meta.org_slug || null;
      return slug ? `/empresa/${slug}/conteudo` : null;
    }

    case 'course':
      return id ? `/curso/${id}` : null;

    // Recomendacao de curso (ex.: "E a seguir?") -> pagina do curso recomendado.
    case 'catalog':
      return id ? `/curso/${id}` : '/cursos';

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

    case 'inquiry':
      return '/teach/pedidos';

    case 'placement':
      return '/talento/meus-pedidos';

    // Agendamento (reserva confirmada/alterada) -> agendamento na conta.
    case 'booking':
      return '/conta/agendamento';

    // Contacto recebido -> CRM de contactos (admin).
    case 'contact':
      return '/admin/contactos';

    // Pedido de traducao -> consola de i18n (admin).
    case 'admin_translation':
      return '/admin/i18n';

    // Saude/analitica de comunicacoes (admin).
    case 'admin_comms':
      return '/admin/comunicacoes';

    default:
      return null;
  }
}

// Chave i18n do CTA textual associado ao tipo de destino. Mantida a par do mapa de
// destinos para que cada tipo com atalho mostre uma accao clara ("Ver curso", etc.).
// Tipos sem chave propria caem em 'notif.cta.default'.
const CTA_KINDS = new Set([
  'agent_approval', 'proposal', 'org_content', 'course', 'catalog', 'certificate',
  'billing', 'gdpr', 'evaluation', 'org', 'inquiry', 'placement', 'booking',
  'contact', 'admin_translation', 'admin_comms',
]);

export function notificationCtaKey(kind?: string | null): string {
  const k = (kind || '').trim();
  return CTA_KINDS.has(k) ? `notif.cta.${k}` : 'notif.cta.default';
}

function stripLocale(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return clean.replace(/^\/(pt|en|es|fr)(?=\/|$)/, '') || '/';
}

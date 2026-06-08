/**
 * Mensagens i18n para shell, admin sidebar, user menu, account sidebar.
 * Mantidas separadas dos pt/en/es/fr.json (que são 112KB cada) para serem editáveis
 * via /admin/i18n no futuro. Espelham nl_i18n na DB.
 * Formato: nested. Fundido em request.ts via deepMerge.
 */

import type { AbstractIntlMessages } from 'next-intl';

const PT = {
  shell: {
    role: { admin: 'Admin', instructor: 'Instrutor', student: 'Aluno' },
    group: {
      overview: 'Visão geral', content: 'Conteúdo', people: 'Pessoas',
      operations: 'Operações', system: 'Sistema', community: 'Comunidade',
      learn: 'Aprender', results: 'Resultados',
    },
    admin: {
      overview: 'Visão geral', cockpit: 'Cockpit', system: 'Sistema', events: 'Eventos',
      agentes: 'Agentes', courses: 'Cursos', learning_paths: 'Percursos',
      preview: 'Pré-visualizar', cms: 'CMS Home', cms_pages: 'Páginas CMS',
      marketing: 'Marketing', marketing_calendar: 'Calendário marketing', social: 'Social',
      companies: 'Empresas', applications: 'Candidaturas', instructors: 'Instrutores',
      smart_features: 'Funcionalidades inteligentes', smart_routing: 'Encaminhamento inteligente',
      billing: 'Faturação', payments: 'Pagamentos', video: 'Vídeo', autopilots: 'Autopilots',
      jobs: 'Jobs', errors: 'Erros', tutor_config: 'Tutor', prompts: 'Prompts',
      integrations: 'Integrações', audit_logs: 'Audit logs', api_keys: 'Chaves API',
      sso: 'SSO / SAML', scim: 'Tokens SCIM', email_templates: 'Templates email',
      drip_schedules: 'Drip schedules', nav_items: 'Menus & Footer', platform_config: 'Config plataforma',
      i18n: 'Traduções',
    },
    instructor: {
      dashboard: 'Dashboard', evaluations_pending: 'Avaliações por validar',
      create: 'Criar curso', my_courses: 'Os meus cursos', services: 'Serviços corporativos',
      requests: 'Pedidos B2B', scheduling: 'Agendamento', students: 'Alunos',
      reviews: 'Avaliações', payouts: 'Pagamentos',
    },
    student: {
      learning: 'A minha aprendizagem', learning_paths: 'Percursos',
      explore: 'Explorar catálogo', search: 'Pesquisar', talent: 'Marketplace talento',
      certificates: 'Certificados', notes: 'Notas',
    },
  },
  user_menu: {
    aria: 'Menu do utilizador',
    area: { admin: 'Admin', instructor: 'Instrutor', student: 'Aluno' },
    admin_dashboard: 'Cockpit admin', instructor_dashboard: 'Dashboard instrutor',
    account: 'A minha conta', scheduling: 'Agendamento', learning: 'A minha aprendizagem',
    signout: 'Terminar sessão', signing_out: 'A terminar...', signed_out: 'Sessão terminada',
  },
  nav: { open_menu: 'Abrir menu', search: 'Pesquisar' },
  account: {
    group: { notifications: 'Notificações & alertas', personal: 'Pessoal', account: 'Conta' },
    item: {
      profile: 'Perfil', learning: 'A minha aprendizagem', scheduling: 'Agendamento',
      inbox: 'Inbox', preferences: 'Preferências', wishlist: 'Lista de desejos',
      affiliate: 'Programa afiliado', application: 'Candidatura instrutor',
      subscription: 'Subscrição', security: 'Segurança & 2FA', privacy: 'Privacidade',
    },
    signout: 'Terminar sessão',
  },
};

const EN = {
  shell: {
    role: { admin: 'Admin', instructor: 'Instructor', student: 'Student' },
    group: {
      overview: 'Overview', content: 'Content', people: 'People',
      operations: 'Operations', system: 'System', community: 'Community',
      learn: 'Learn', results: 'Results',
    },
    admin: {
      overview: 'Overview', cockpit: 'Cockpit', system: 'System', events: 'Events',
      agentes: 'Agents', courses: 'Courses', learning_paths: 'Learning paths',
      preview: 'Preview', cms: 'CMS Home', cms_pages: 'CMS pages',
      marketing: 'Marketing', marketing_calendar: 'Marketing calendar', social: 'Social',
      companies: 'Companies', applications: 'Applications', instructors: 'Instructors',
      smart_features: 'Smart features', smart_routing: 'Smart routing',
      billing: 'Billing', payments: 'Payments', video: 'Video', autopilots: 'Autopilots',
      jobs: 'Jobs', errors: 'Errors', tutor_config: 'Tutor', prompts: 'Prompts',
      integrations: 'Integrations', audit_logs: 'Audit logs', api_keys: 'API keys',
      sso: 'SSO / SAML', scim: 'SCIM tokens', email_templates: 'Email templates',
      drip_schedules: 'Drip schedules', nav_items: 'Menus & Footer', platform_config: 'Platform config',
      i18n: 'Translations',
    },
    instructor: {
      dashboard: 'Dashboard', evaluations_pending: 'Pending evaluations',
      create: 'Create course', my_courses: 'My courses', services: 'Corporate services',
      requests: 'B2B requests', scheduling: 'Scheduling', students: 'Students',
      reviews: 'Reviews', payouts: 'Payouts',
    },
    student: {
      learning: 'My learning', learning_paths: 'Learning paths',
      explore: 'Explore catalog', search: 'Search', talent: 'Talent marketplace',
      certificates: 'Certificates', notes: 'Notes',
    },
  },
  user_menu: {
    aria: 'User menu',
    area: { admin: 'Admin', instructor: 'Instructor', student: 'Student' },
    admin_dashboard: 'Admin cockpit', instructor_dashboard: 'Instructor dashboard',
    account: 'My account', scheduling: 'Scheduling', learning: 'My learning',
    signout: 'Sign out', signing_out: 'Signing out...', signed_out: 'Signed out',
  },
  nav: { open_menu: 'Open menu', search: 'Search' },
  account: {
    group: { notifications: 'Notifications & alerts', personal: 'Personal', account: 'Account' },
    item: {
      profile: 'Profile', learning: 'My learning', scheduling: 'Scheduling',
      inbox: 'Inbox', preferences: 'Preferences', wishlist: 'Wishlist',
      affiliate: 'Affiliate program', application: 'Instructor application',
      subscription: 'Subscription', security: 'Security & 2FA', privacy: 'Privacy',
    },
    signout: 'Sign out',
  },
};

const ES = {
  shell: {
    role: { admin: 'Admin', instructor: 'Instructor', student: 'Estudiante' },
    group: {
      overview: 'Visión general', content: 'Contenido', people: 'Personas',
      operations: 'Operaciones', system: 'Sistema', community: 'Comunidad',
      learn: 'Aprender', results: 'Resultados',
    },
    admin: {
      overview: 'Visión general', cockpit: 'Cockpit', system: 'Sistema', events: 'Eventos',
      agentes: 'Agentes', courses: 'Cursos', learning_paths: 'Itinerarios',
      preview: 'Vista previa', cms: 'CMS Home', cms_pages: 'Páginas CMS',
      marketing: 'Marketing', marketing_calendar: 'Calendario marketing', social: 'Social',
      companies: 'Empresas', applications: 'Candidaturas', instructors: 'Instructores',
      smart_features: 'Funciones inteligentes', smart_routing: 'Enrutamiento inteligente',
      billing: 'Facturación', payments: 'Pagos', video: 'Vídeo', autopilots: 'Autopilots',
      jobs: 'Jobs', errors: 'Errores', tutor_config: 'Tutor', prompts: 'Prompts',
      integrations: 'Integraciones', audit_logs: 'Registros de auditoría', api_keys: 'Claves API',
      sso: 'SSO / SAML', scim: 'Tokens SCIM', email_templates: 'Plantillas email',
      drip_schedules: 'Programación drip', nav_items: 'Menús & Pie', platform_config: 'Config plataforma',
      i18n: 'Traducciones',
    },
    instructor: {
      dashboard: 'Dashboard', evaluations_pending: 'Evaluaciones pendientes',
      create: 'Crear curso', my_courses: 'Mis cursos', services: 'Servicios corporativos',
      requests: 'Solicitudes B2B', scheduling: 'Agendamiento', students: 'Estudiantes',
      reviews: 'Reseñas', payouts: 'Pagos',
    },
    student: {
      learning: 'Mi aprendizaje', learning_paths: 'Itinerarios',
      explore: 'Explorar catálogo', search: 'Buscar', talent: 'Marketplace talento',
      certificates: 'Certificados', notes: 'Notas',
    },
  },
  user_menu: {
    aria: 'Menú de usuario',
    area: { admin: 'Admin', instructor: 'Instructor', student: 'Estudiante' },
    admin_dashboard: 'Cockpit admin', instructor_dashboard: 'Dashboard instructor',
    account: 'Mi cuenta', scheduling: 'Agendamiento', learning: 'Mi aprendizaje',
    signout: 'Cerrar sesión', signing_out: 'Cerrando sesión...', signed_out: 'Sesión cerrada',
  },
  nav: { open_menu: 'Abrir menú', search: 'Buscar' },
  account: {
    group: { notifications: 'Notificaciones & alertas', personal: 'Personal', account: 'Cuenta' },
    item: {
      profile: 'Perfil', learning: 'Mi aprendizaje', scheduling: 'Agendamiento',
      inbox: 'Bandeja de entrada', preferences: 'Preferencias', wishlist: 'Lista de deseos',
      affiliate: 'Programa afiliado', application: 'Candidatura instructor',
      subscription: 'Suscripción', security: 'Seguridad & 2FA', privacy: 'Privacidad',
    },
    signout: 'Cerrar sesión',
  },
};

const FR = {
  shell: {
    role: { admin: 'Admin', instructor: 'Formateur', student: 'Étudiant' },
    group: {
      overview: "Vue d'ensemble", content: 'Contenu', people: 'Personnes',
      operations: 'Opérations', system: 'Système', community: 'Communauté',
      learn: 'Apprendre', results: 'Résultats',
    },
    admin: {
      overview: "Vue d'ensemble", cockpit: 'Cockpit', system: 'Système', events: 'Événements',
      agentes: 'Agents', courses: 'Cours', learning_paths: 'Parcours',
      preview: 'Aperçu', cms: 'CMS Accueil', cms_pages: 'Pages CMS',
      marketing: 'Marketing', marketing_calendar: 'Calendrier marketing', social: 'Social',
      companies: 'Entreprises', applications: 'Candidatures', instructors: 'Formateurs',
      smart_features: 'Fonctions intelligentes', smart_routing: 'Routage intelligent',
      billing: 'Facturation', payments: 'Paiements', video: 'Vidéo', autopilots: 'Autopilotes',
      jobs: 'Jobs', errors: 'Erreurs', tutor_config: 'Tuteur', prompts: 'Prompts',
      integrations: 'Intégrations', audit_logs: "Journaux d'audit", api_keys: 'Clés API',
      sso: 'SSO / SAML', scim: 'Jetons SCIM', email_templates: 'Modèles email',
      drip_schedules: 'Calendriers drip', nav_items: 'Menus & Pied', platform_config: 'Config plateforme',
      i18n: 'Traductions',
    },
    instructor: {
      dashboard: 'Tableau de bord', evaluations_pending: 'Évaluations en attente',
      create: 'Créer un cours', my_courses: 'Mes cours', services: 'Services entreprises',
      requests: 'Demandes B2B', scheduling: 'Planification', students: 'Étudiants',
      reviews: 'Avis', payouts: 'Paiements',
    },
    student: {
      learning: 'Mon apprentissage', learning_paths: 'Parcours',
      explore: 'Explorer le catalogue', search: 'Rechercher', talent: 'Marketplace talents',
      certificates: 'Certificats', notes: 'Notes',
    },
  },
  user_menu: {
    aria: 'Menu utilisateur',
    area: { admin: 'Admin', instructor: 'Formateur', student: 'Étudiant' },
    admin_dashboard: 'Cockpit admin', instructor_dashboard: 'Tableau formateur',
    account: 'Mon compte', scheduling: 'Planification', learning: 'Mon apprentissage',
    signout: 'Se déconnecter', signing_out: 'Déconnexion...', signed_out: 'Session terminée',
  },
  nav: { open_menu: 'Ouvrir le menu', search: 'Rechercher' },
  account: {
    group: { notifications: 'Notifications & alertes', personal: 'Personnel', account: 'Compte' },
    item: {
      profile: 'Profil', learning: 'Mon apprentissage', scheduling: 'Planification',
      inbox: 'Boîte de réception', preferences: 'Préférences', wishlist: 'Liste de souhaits',
      affiliate: 'Programme affilié', application: 'Candidature formateur',
      subscription: 'Abonnement', security: 'Sécurité & 2FA', privacy: 'Confidentialité',
    },
    signout: 'Se déconnecter',
  },
};

export const ADMIN_MESSAGES: Record<string, AbstractIntlMessages> = {
  pt: PT as AbstractIntlMessages,
  en: EN as AbstractIntlMessages,
  es: ES as AbstractIntlMessages,
  fr: FR as AbstractIntlMessages,
};

// Fallback i18n messages — usado se o backend app-bootstrap falhar ou timeout
// Mantém a UI funcional mesmo offline. Apenas as chaves essenciais.

export const FALLBACK_MESSAGES = {
  nav: {
    courses: 'Cursos', essentials: 'Essentials', business: 'Empresas', blog: 'Blog',
    search: 'Pesquisar', menu: 'Menu', open_menu: 'Abrir menu', close_menu: 'Fechar menu',
    signin: 'Entrar', signup: 'Criar conta', login: 'Entrar', logout: 'Terminar sessão',
    dashboard: 'Dashboard', my_learning: 'A minha aprendizagem', my_courses: 'Os meus cursos',
    teach: 'Ensinar', about: 'Sobre', language: 'Idioma', profile: 'Perfil', settings: 'Definições',
    home: 'Início', help: 'Ajuda', contact: 'Contacto', pricing: 'Preços',
    promote: 'Promover', instructors: 'Instrutores', students: 'Estudantes',
    notifs: 'Notificações', emails: 'Emails', evals: 'Avaliações', agent: 'Agente',
    transactions: 'Transações', analytics: 'Analytics', i18n: 'Traduções', legal: 'Legal',
    publicContent: 'Conteúdo público', company: 'Empresa',
  },
  btn: {
    save: 'Guardar', cancel: 'Cancelar', delete: 'Apagar', edit: 'Editar', back: 'Voltar',
    next: 'Avançar', send: 'Enviar', open: 'Abrir', new: 'Novo', add: 'Adicionar',
    close: 'Fechar', confirm: 'Confirmar', continue: 'Continuar', submit: 'Submeter',
    create: 'Criar', update: 'Actualizar', remove: 'Remover', search: 'Pesquisar',
  },
  footer: {
    faq: 'FAQ', about: 'Sobre nós', contact: 'Contacto', legal: 'Legal',
    privacy: 'Privacidade', terms: 'Termos', cookies: 'Cookies', copyright: '© NeuroLearn',
  },
  auth: {
    email: 'Email', password: 'Palavra-passe', confirmPassword: 'Confirmar palavra-passe',
    signin: 'Entrar', signup: 'Criar conta', forgotPassword: 'Esqueceste-te?',
    rememberMe: 'Manter sessão', haveAccount: 'Já tens conta?', noAccount: 'Ainda não tens conta?',
  },
  common: {
    loading: 'A carregar...', error: 'Erro', success: 'Sucesso', warning: 'Aviso',
    confirm: 'Confirmar', yes: 'Sim', no: 'Não', ok: 'OK',
  },
};

/* Supabase Auth session and server-verified team access. */
const PAPEL = { admin: 'Administrador', colab: 'Colaborador' };
const ADM = ['cfg', 'team'];
const PRIMARY_ADMIN_EMAIL = 'jediael7@gmail.com';
let TEAM_DATA = [];
let ADMIN_SESSION = null;
let ADMIN_SESSION_TOKEN = '';
let ADMIN_SESSION_TASK = null;

const TEAM = () => TEAM_DATA;
const SS = () => ADMIN_SESSION;
const setSess = value => { ADMIN_SESSION = value; };

function me() {
  const session = SS();
  if (!session || !session.email) return null;
  const member = TEAM().find(person => person.email.toLowerCase() === session.email.toLowerCase());
  return member && member.ativo !== false
    ? Object.assign({}, session, { nome: member.nome || session.nome, papel: member.papel })
    : null;
}

const isAdm = () => { const user = me(); return !!user && user.papel === 'admin'; };
const isPrimaryAdmin = () => { const user = me(); return !!user && String(user.email).toLowerCase() === PRIMARY_ADMIN_EMAIL; };
const authed = () => !!me();

const GIC = '<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 2.56 13.22l7.97 6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
const lerr = text => {
  const message = $('er');
  if (message) { message.textContent = text; message.hidden = false; }
};

function login() {
  $('app').innerHTML = '<div class="lg"><div class="lgc"><div class="lgb">ROMA<small>NEGÓCIOS IMOBILIÁRIOS</small></div><h1>Painel administrativo</h1><p class="sub">Acesso exclusivo à equipe autorizada.</p><p class="err" id="er" role="alert" hidden></p><button class="btn primary lgbtn" type="button" data-a="sg">' + GIC + 'Entrar com Google</button><a class="lnk" href="' + SITE + '">← Voltar ao site</a></div></div>';
}

async function refreshAdminTeam() {
  const { data, error } = await requireSupabase().from('equipe').select('*').order('nome');
  if (error) throw error;
  TEAM_DATA = (data || []).map(person => Object.assign({}, person, {
    papel: person.papel === 'admin' ? 'admin' : 'colab',
    ultimo: person.ultimo_acesso || null
  }));
  return TEAM_DATA;
}

function applyAdminSession(session) {
  if (!session) {
    ADMIN_SESSION_TOKEN = '';
    ADMIN_SESSION_TASK = null;
    TEAM_DATA = [];
    ADMIN_SESSION = null;
    render();
    return Promise.resolve();
  }
  const token = session.access_token || session.user && session.user.id || '';
  if (token && token === ADMIN_SESSION_TOKEN && ADMIN_SESSION_TASK) return ADMIN_SESSION_TASK;
  ADMIN_SESSION_TOKEN = token;
  ADMIN_SESSION_TASK = (async () => {
  const { data, error } = await requireSupabase().auth.getUser();
  if (error) throw error;
  if (!data.user || !data.user.email) throw new Error('A conta autenticada não informou um e-mail.');
  await refreshAdminTeam();
  const member = TEAM().find(person => person.email.toLowerCase() === data.user.email.toLowerCase());
  if (!member || member.ativo === false) {
    await requireSupabase().auth.signOut();
    throw new Error('Este e-mail não tem acesso ativo ao painel. Peça a um administrador para cadastrá-lo na equipe.');
  }
  setSess({
    email: member.email,
    nome: member.nome || data.user.user_metadata && (data.user.user_metadata.full_name || data.user.user_metadata.name) || member.email,
    via: 'supabase'
  });
  render();
  await loadAdminState();
  CFG.whats = adminState.config.whats || ROMA_CONFIG.whatsapp;
  const adminData = await loadAdminProperties();
  IM = adminData.properties;
  ANUNCIANTES = adminData.advertisers;
  setSess({
    email: member.email,
    nome: member.nome || data.user.user_metadata && (data.user.user_metadata.full_name || data.user.user_metadata.name) || member.email,
    via: 'supabase'
  });
  const { error: accessError } = await requireSupabase().rpc('registrar_acesso');
  if (accessError) throw accessError;
  render();
  })();
  return ADMIN_SESSION_TASK.catch(error => {
    if (!authed()) {
      setSess(null);
      TEAM_DATA = [];
      ADMIN_SESSION_TOKEN = '';
      ADMIN_SESSION_TASK = null;
    }
    throw error;
  });
}

async function initializeAdminAuth() {
  if (!supabaseClient) {
    login();
    lerr('O Supabase não foi carregado. Verifique a conexão e atualize a página.');
    return;
  }
  requireSupabase().auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION') return;
    setTimeout(() => applyAdminSession(session).catch(error => {
      console.error('Falha ao validar o acesso administrativo.', error);
      if (!authed()) {
        login();
        lerr(supabaseMessage(error));
      } else {
        toast('A sessão está autenticada, mas o painel falhou ao carregar os dados: ' + supabaseMessage(error));
      }
    }), 0);
  });
  const { data, error } = await requireSupabase().auth.getSession();
  if (error) throw error;
  await applyAdminSession(data.session);
}

async function ssoGoogle() {
  try {
    const { error } = await requireSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: location.href }
    });
    if (error) throw error;
  } catch (error) {
    console.error('Falha ao iniciar o login Google do painel.', error);
    lerr(supabaseMessage(error));
  }
}

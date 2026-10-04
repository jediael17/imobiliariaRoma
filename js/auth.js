/* Customer sign-in and account profile backed by Supabase Auth. */
let USER = null;
const POLICY_VERSION = '1.0';
const byId = id => document.getElementById(id);
const authm = byId('authmodal');
const loginBtn = byId('loginBtn');
const userLi = byId('userLi');
let provisionedUserId = '';
let activeAuthSync = '';

byId('cadWhats').dataset.mask = 'phone';
byId('cadWhats').placeholder = '(31) 9 9999-9999 (opcional)';
applyInputMasks(authm);

const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

function prefillUser() {
  if (!USER) return;
  const name = mform.querySelector('input[aria-label="Nome completo"]');
  const phone = mform.querySelector('input[aria-label="WhatsApp"]');
  const email = mform.querySelector('input[aria-label="E-mail"]');
  if (name && !name.value) name.value = USER.name || '';
  if (email && !email.value) email.value = USER.email || '';
  if (phone && !phone.value && USER.whats) {
    phone.value = USER.whats;
    applyInputMasks(mform);
  }
}

function renderUser() {
  loginBtn.parentElement.hidden = !!USER;
  userLi.hidden = !USER;
  if (USER) {
    const avatar = USER.picture
      ? '<img class="uav" src="' + esc(USER.picture) + '" alt="" referrerpolicy="no-referrer">'
      : '<span class="uav">' + esc((USER.name || '?')[0].toUpperCase()) + '</span>';
    userLi.querySelector('button').innerHTML = avatar + ' ' + esc((USER.name || 'Conta').split(' ')[0]) + ' ▾';
  }
  if (typeof apply === 'function') apply();
}

function setAu(tab) {
  document.querySelectorAll('#authmodal .atabs button').forEach(button => {
    button.setAttribute('aria-selected', button.dataset.au === tab);
  });
  byId('pLogin').hidden = tab !== 'login';
  byId('pCad').hidden = tab !== 'cad';
  byId('authtitle').textContent = tab === 'cad' ? 'Criar sua conta' : 'Acesse sua conta';
  byId('authmsg').hidden = true;
}

function openAuth(tab) {
  lastF = document.activeElement;
  setAu(tab || 'login');
  byId('authPolicyOk').checked = false;
  byId('demoNote').hidden = true;
  authm.hidden = false;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => authm.classList.add('show'));
}

function closeAuth() {
  authm.classList.remove('show');
  setTimeout(() => { authm.hidden = true; }, 250);
  document.body.style.overflow = '';
}

function showAuthError(text) {
  const message = byId('authmsg');
  message.textContent = text;
  message.hidden = false;
}

async function finishAuth(session, intent) {
  const client = requireSupabase();
  const account = session.user;
  if (!account || !account.email) throw new Error('O provedor de login não retornou um e-mail válido.');
  if (provisionedUserId === account.id && !intent) return;

  const { data: existing, error: lookupError } = await client
    .from('clientes')
    .select('id,nome,email,telefone,perfis')
    .eq('user_id', account.id)
    .maybeSingle();
  if (lookupError) throw lookupError;

  const name = account.user_metadata && (account.user_metadata.full_name || account.user_metadata.name)
    || account.email;
  const phone = intent && intent.mode === 'cad' ? intent.phone : existing && existing.telefone;
  if (existing && intent && intent.mode === 'cad') {
    const { error: profileError } = await client.from('clientes').update({
      nome: name,
      email: account.email.toLowerCase(),
      telefone: phone || null
    }).eq('id', existing.id);
    if (profileError) throw profileError;
  } else if (!existing) {
    const { error: profileError } = await client.from('clientes').insert({
      user_id: account.id,
      nome: name,
      email: account.email.toLowerCase(),
      telefone: phone || null,
      perfis: ['cliente_site']
    });
    if (profileError) throw profileError;
  }

  if (intent) {
    const consents = [{
      user_id: account.id,
      email: account.email.toLowerCase(),
      finalidade: 'cadastro',
      versao_politica: POLICY_VERSION,
      aceito: true
    }];
    if (intent.marketing) {
      consents.push({
        user_id: account.id,
        email: account.email.toLowerCase(),
        finalidade: 'marketing',
        versao_politica: POLICY_VERSION,
        aceito: true
      });
    }
    const { error: consentError } = await client.from('consentimentos').insert(consents);
    if (consentError) throw consentError;
  }

  USER = {
    id: account.id,
    name,
    email: account.email,
    picture: account.user_metadata && (account.user_metadata.avatar_url || account.user_metadata.picture) || '',
    whats: phone || ''
  };
  provisionedUserId = account.id;
  sessionStorage.removeItem('roma_auth_intent');
  if (typeof loadUserFavorites === 'function') {
    try { await loadUserFavorites(); }
    catch (error) {
      console.error('Não foi possível carregar os favoritos da conta.', error);
      alert('Sua conta conectou, mas não foi possível carregar os favoritos: ' + supabaseMessage(error));
    }
  }
  renderUser();
  closeAuth();
  if (intent && intent.mode === 'cad') {
    openOk('Seu cadastro foi concluído. Agora seus dados já vêm preenchidos nos formulários de contato.');
  } else if (intent) {
    openOk('Você entrou na sua conta.', 'Olá, ' + (USER.name || '').split(' ')[0] + '!');
  }
}

async function startAuth(mode) {
  const message = byId('authmsg');
  message.hidden = true;
  if (!byId('authPolicyOk').checked) {
    showAuthError('Aceite a Política de Privacidade para continuar.');
    return;
  }

  const intent = {
    mode,
    phone: mode === 'cad' ? byId('cadWhats').value.trim() : '',
    marketing: mode === 'cad' && byId('cadOk').checked
  };
  sessionStorage.setItem('roma_auth_intent', JSON.stringify(intent));
  const { error } = await requireSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: location.href }
  });
  if (error) {
    sessionStorage.removeItem('roma_auth_intent');
    showAuthError(supabaseMessage(error));
  }
}

function handleAuthSession(session) {
  if (!session) {
    USER = null;
    provisionedUserId = '';
    activeAuthSync = '';
    if (typeof clearUserFavorites === 'function') clearUserFavorites();
    renderUser();
    return;
  }

  let intent = null;
  try { intent = JSON.parse(sessionStorage.getItem('roma_auth_intent') || 'null'); }
  catch (error) { console.error('Não foi possível ler o fluxo de autenticação pendente.', error); }
  const syncKey = session.user.id + ':' + JSON.stringify(intent || {});
  if (activeAuthSync === syncKey) return;
  activeAuthSync = syncKey;
  finishAuth(session, intent).catch(error => {
    console.error('Falha ao preparar a conta no Supabase.', error);
    openAuth(intent && intent.mode || 'login');
    showAuthError('A autenticação foi concluída, mas não foi possível preparar seu cadastro. Tente atualizar a página. ' + supabaseMessage(error));
    activeAuthSync = '';
  });
}

if (supabaseClient) {
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => handleAuthSession(session), 0);
  });
  supabaseClient.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('Não foi possível restaurar a sessão do Supabase.', error);
      showAuthError(supabaseMessage(error));
      return;
    }
    handleAuthSession(data.session);
  });
}

loginBtn.onclick = () => {
  menu.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  openAuth('login');
};
document.querySelectorAll('#authmodal .atabs button').forEach(button => {
  button.onclick = () => setAu(button.dataset.au);
});
document.querySelectorAll('[data-g]').forEach(button => {
  button.onclick = () => startAuth(button.dataset.g);
});
byId('authx').onclick = closeAuth;
authm.addEventListener('click', event => { if (event.target === authm) closeAuth(); });
addEventListener('keydown', event => { if (event.key === 'Escape' && !authm.hidden) closeAuth(); });
byId('logoutBtn').onclick = async event => {
  event.preventDefault();
  const { error } = await requireSupabase().auth.signOut();
  if (error) {
    console.error('Não foi possível encerrar a sessão.', error);
    alert('Não foi possível encerrar a sessão: ' + supabaseMessage(error));
    return;
  }
  userLi.classList.remove('open');
};

renderUser();

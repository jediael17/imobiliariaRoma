/* Supabase-backed state used by the admin panel. Browser storage is not a data source. */
const adminState = { messages: [], clients: [], requests: [], config: {}, ready: false, writes: Promise.resolve(), messageBaseline: new Map(), requestBaseline: new Map() };
const ADMIN_STATE_KEYS = new Set(['roma_msgs', 'roma_users', 'roma_clientes_painel', 'roma_msg_notificacoes', 'roma_cfg']);
const adminUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
const adminMessageStatus = value => ({ em_atendimento: 'atend', concluida: 'ok' }[value] || value || 'nova');
const dbMessageStatus = value => ({ atend: 'em_atendimento', ok: 'concluida' }[value] || value || 'nova');

async function loadAdminState() {
  const client = requireSupabase();
  const [messages, clients, requests, config] = await Promise.all([
    client.from('mensagens').select('*').order('criado_em', { ascending: false }),
    client.from('clientes').select('id,nome,email,telefone,perfis,criado_em'),
    client.from('solicitacoes_exclusao').select('*').order('criado_em', { ascending: false }),
    client.from('configuracoes').select('chave,valor').eq('chave', 'whatsapp').maybeSingle()
  ]);
  for (const result of [messages, clients, requests, config]) if (result.error) throw result.error;
  const team = TEAM();
  adminState.messages = await Promise.all((messages.data || []).map(async row => {
    const details = row.detalhes || {}, extra = details._admin || {};
    const owner = team.find(person => person.id === row.responsavel_id);
    let personal = {};
    if (row.cliente_id) {
      const result = await client.rpc('ver_dados_pessoais', { _cliente: row.cliente_id });
      if (result.error) throw result.error;
      personal = result.data || {};
    }
    return Object.assign({
      id: row.id, data: row.criado_em, tipo: row.tipo, status: adminMessageStatus(row.status),
      campos: [{ k: 'Nome completo', v: row.nome }, ...(row.telefone ? [{ k: 'WhatsApp', v: row.telefone }] : []),
        ...(row.email ? [{ k: 'E-mail', v: row.email }] : []), ...(details.campos || [])],
      atendimento: owner ? { id: owner.email.toLowerCase(), email: owner.email, nome: owner.nome || owner.email, em: row.assumida_em } : null
    }, extra, personal.cpf ? { cpf: personal.cpf } : {});
  }));
  adminState.messageBaseline = new Map(adminState.messages.map(message => [message.id, JSON.stringify(message)]));
  adminState.clients = await Promise.all((clients.data || []).map(async row => {
    const result = await client.rpc('ver_dados_pessoais', { _cliente: row.id });
    if (result.error) throw result.error;
    const personal = result.data || {};
    return { id: row.id, nome: row.nome || '', name: row.nome || '', email: row.email || '', telefone: row.telefone || '', whats: row.telefone || '', cpf: personal.cpf || '', rg: personal.rg || '', data: row.criado_em || '', perfis: row.perfis || [], kind: (row.perfis || []).includes('anunciante') ? 'anunciante' : 'comprador' };
  }));
  adminState.requests = (requests.data || []).map(row => ({ id: row.id, messageId: row.mensagem_id, motivo: row.motivo,
    status: row.status, porId: row.solicitante_id, email: (team.find(person => person.id === row.solicitante_id) || {}).email || '',
    nome: (team.find(person => person.id === row.solicitante_id) || {}).nome || '',
    em: row.criado_em, decidedBy: row.decidido_por, decidedAt: row.decidido_em }));
  adminState.requestBaseline = new Map(adminState.requests.map(request => [request.id, request.status]));
  adminState.config = { whats: String(config.data && config.data.valor || ROMA_CONFIG.whatsapp) };
  adminState.ready = true;
  return adminState;
}

const stateForKey = (key, fallback) => key === 'roma_msgs' ? adminState.messages
  : key === 'roma_users' || key === 'roma_clientes_painel' ? adminState.clients
    : key === 'roma_msg_notificacoes' ? adminState.requests : key === 'roma_cfg' ? adminState.config : fallback;

function persistAdminStateKey(key, next) {
  if (key === 'roma_msgs') adminState.messages = Array.isArray(next) ? next : [];
  else if (key === 'roma_users' || key === 'roma_clientes_painel') adminState.clients = Array.isArray(next) ? next : [];
  else if (key === 'roma_msg_notificacoes') adminState.requests = Array.isArray(next) ? next : [];
  else if (key === 'roma_cfg') adminState.config = next || {};
  const task = adminState.writes.catch(() => {}).then(async () => {
    const client = requireSupabase();
    if (key === 'roma_msgs') {
      const rows = Array.isArray(next) ? next.filter(item => adminUuid(item.id)) : [];
      const oldIds = new Set(adminState.messageBaseline.keys());
      const nextIds = new Set(rows.map(item => item.id));
      for (const message of rows) {
        if (adminState.messageBaseline.get(message.id) === JSON.stringify(message)) continue;
        const owner = message.atendimento && TEAM().find(person => person.email.toLowerCase() === String(message.atendimento.email || message.atendimento.id).toLowerCase());
        const original = (await client.from('mensagens').select('detalhes,cliente_id').eq('id', message.id).maybeSingle());
        if (original.error) throw original.error;
        const prior = original.data && original.data.detalhes || {};
        const details = Object.assign({}, prior, { campos: (message.campos || []).filter(field => !['Nome completo', 'WhatsApp', 'E-mail'].includes(field.k)) });
        const extra = Object.assign({}, prior._admin || {});
        for (const prop of ['negocio', 'desistencia', 'anuncioCriado']) if (message[prop] !== undefined) extra[prop] = message[prop];
        details._admin = extra;
        const base = (message.campos || []).reduce((out, field) => (out[field.k] = field.v, out), {});
        const row = { tipo: message.tipo, nome: base['Nome completo'] || 'Cliente', telefone: base.WhatsApp || null,
          email: base['E-mail'] || base.Email || null, detalhes: details, status: dbMessageStatus(message.status),
          responsavel_id: owner ? owner.id : null, assumida_em: message.atendimento && message.atendimento.em || null,
          observacao_encerramento: message.desistencia && message.desistencia.motivo || null,
          concluida_em: message.status === 'ok' ? message.desistencia && message.desistencia.em || new Date().toISOString() : null,
          tag: message.anuncioCriado && message.anuncioCriado.cod || null };
        const result = await client.from('mensagens').update(row).eq('id', message.id).select('id').maybeSingle();
        if (result.error) throw result.error;
        if (!result.data) throw new Error('A mensagem não foi atualizada no banco. Verifique o acesso da equipe e tente novamente.');
      }
      const removed = [...oldIds].filter(id => !nextIds.has(id));
      if (removed.length) { const result = await client.from('mensagens').delete().in('id', removed); if (result.error) throw result.error; }
      adminState.messages = rows;
      adminState.messageBaseline = new Map(rows.map(message => [message.id, JSON.stringify(message)]));
    } else if (key === 'roma_users' || key === 'roma_clientes_painel') {
      const rows = Array.isArray(next) ? next : [];
      const existingRows = await client.from('clientes').select('id,email');
      if (existingRows.error) throw existingRows.error;
      const desiredEmails = new Set(rows.map(customer => String(customer.email || '').trim().toLowerCase()).filter(Boolean));
      for (const customer of rows) {
        const email = String(customer.email || '').trim().toLowerCase(); if (!email) continue;
        let lookup = await client.from('clientes').select('id,perfis').eq('email', email).limit(1).maybeSingle();
        if (lookup.error) throw lookup.error;
        const profiles = [...new Set([...(lookup.data && lookup.data.perfis || []), ...(customer.perfis || []), 'comprador'])];
        const saved = lookup.data
          ? await client.from('clientes').update({ nome: customer.nome || customer.name || '', telefone: customer.telefone || customer.whats || '', perfis: profiles }).eq('id', lookup.data.id).select('id').single()
          : await client.from('clientes').insert({ nome: customer.nome || customer.name || '', email, telefone: customer.telefone || customer.whats || '', perfis: profiles }).select('id').single();
        if (saved.error) throw saved.error;
        const personal = await client.rpc('salvar_dados_pessoais', { _cliente: saved.data.id, _cpf: customer.cpf || '', _rg: customer.rg || '', _cep: '', _logradouro: '', _numero: '', _complemento: '', _bairro: '', _cidade: '', _uf: '' });
        if (personal.error) throw personal.error;
      }
      const removeIds = (existingRows.data || []).filter(customer => customer.email && !desiredEmails.has(customer.email.toLowerCase())).map(customer => customer.id);
      if (removeIds.length) { const result = await client.from('clientes').delete().in('id', removeIds); if (result.error) throw result.error; }
      adminState.clients = rows;
    } else if (key === 'roma_msg_notificacoes') {
      const rows = Array.isArray(next) ? next : [];
      for (const request of rows) {
        const id = adminUuid(request.id) ? request.id : null;
        const owner = TEAM().find(person => person.email.toLowerCase() === String(request.email || request.porId || '').toLowerCase()) || me();
        const decisionOwner = TEAM().find(person => person.email.toLowerCase() === String(request.decidedBy || '').toLowerCase());
        const row = { mensagem_id: request.messageId || null, solicitante_id: owner && owner.id, motivo: request.motivo };
        if (!owner || !row.motivo) continue;
        if (id && adminState.requestBaseline.get(id) !== request.status) {
          const result = await client.rpc('decidir_exclusao', { _id: id, _aprovar: request.status === 'aprovada' });
          if (result.error) throw result.error;
        } else if (!id) {
          const result = await client.from('solicitacoes_exclusao').insert(Object.assign({}, row, { status: 'pendente' })).select('id').single();
          if (result.error) throw result.error;
          request.id = result.data.id;
        }
      }
      adminState.requests = rows;
      adminState.requestBaseline = new Map(rows.map(request => [request.id, request.status]));
    } else if (key === 'roma_cfg') {
      const value = { chave: 'whatsapp', valor: String(next.whats || '') };
      const result = await client.from('configuracoes').upsert(value, { onConflict: 'chave' });
      if (result.error) throw result.error;
      adminState.config = next;
    }
  });
  adminState.writes = task;
  task.catch(error => { console.error('Falha ao persistir dados administrativos no Supabase.', error); if (typeof toast === 'function') toast('Falha ao salvar no Supabase: ' + supabaseMessage(error)); });
  return true;
}

DB.get = (key, fallback) => ADMIN_STATE_KEYS.has(key) ? stateForKey(key, fallback) : fallback;
DB.set = (key, value) => ADMIN_STATE_KEYS.has(key) ? persistAdminStateKey(key, value) : false;

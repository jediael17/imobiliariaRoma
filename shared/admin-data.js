const adminPropertyFromRow = (row, photos) => ({
  _dbId: row.id,
  _ownerId: row.anunciante_id,
  _archiveOwnerId: row.arquivado_por,
  _photoRows: photos,
  cod: row.codigo,
  titulo: row.titulo,
  fin: row.finalidade,
  tipo: row.tipo,
  st: row.situacao === 'disponivel' ? 'disp' : row.situacao,
  cep: row.cep || '',
  logradouro: row.logradouro || '',
  numero: row.numero || '',
  complemento: row.complemento || '',
  bairro: row.bairro || '',
  cidade: row.cidade,
  uf: row.uf || '',
  q: row.quartos || 0,
  s: row.suites || 0,
  b: row.banheiros || 0,
  v: row.vagas || 0,
  area: Number(row.area_m2) || 0,
  valor: Number(row.valor) || 0,
  texto: row.descricao || '',
  video: row.video_url || '',
  fech: row.fechado_em || null,
  arquivado: row.arquivado_em ? {
    em: row.arquivado_em,
    motivo: row.arquivado_motivo || '',
    por: row.arquivado_por || ''
  } : null,
  fotos: photos.map(photo => requireSupabase().storage.from('imoveis').getPublicUrl(photo.caminho).data.publicUrl),
  art: 'casa1'
});
let adminPropertyBaseline = new Map();
const adminPropertySnapshot = property => JSON.stringify(property);

async function loadAdminProperties() {
  const client = requireSupabase();
  const [{ data: properties, error: propertiesError }, { data: photos, error: photosError }] = await Promise.all([
    client.from('imoveis').select('*').order('criado_em', { ascending: false }),
    client.from('imoveis_fotos').select('id,imovel_id,caminho,ordem').order('ordem', { ascending: true })
  ]);
  if (propertiesError) throw propertiesError;
  if (photosError) throw photosError;

  const photosByProperty = new Map();
  (photos || []).forEach(photo => {
    const list = photosByProperty.get(photo.imovel_id) || [];
    list.push(photo);
    photosByProperty.set(photo.imovel_id, list);
  });
  const rows = properties || [];
  const { data: deals, error: dealsError } = await client.from('negocios').select('*');
  if (dealsError) throw dealsError;
  const dealPropertyIds = (deals || []).map(deal => deal.imovel_id);
  const documentsResult = dealPropertyIds.length
    ? await client.from('negocios_documentos').select('id,negocio_id,caminho,nome_original,mime,tamanho').in('negocio_id', (deals || []).map(deal => deal.id)).order('criado_em')
    : { data: [], error: null };
  if (documentsResult.error) throw documentsResult.error;
  const clientsById = new Map();
  const dealClientIds = [...new Set((deals || []).map(deal => deal.cliente_id).filter(Boolean))];
  if (dealClientIds.length) {
    const result = await client.from('clientes').select('id,nome,email,telefone').in('id', dealClientIds);
    if (result.error) throw result.error;
    for (const customer of result.data || []) {
      const personalResult = await client.rpc('ver_dados_pessoais', { _cliente: customer.id });
      if (personalResult.error) throw personalResult.error;
      clientsById.set(customer.id, Object.assign({}, customer, personalResult.data || {}));
    }
  }
  const dealsByProperty = new Map();
  for (const deal of deals || []) {
    const property = rows.find(item => item.id === deal.imovel_id);
    if (!property) continue;
    const owner = TEAM().find(person => person.id === deal.responsavel_id);
    const buyer = clientsById.get(deal.cliente_id) || {};
    const documents = await Promise.all((documentsResult.data || []).filter(doc => doc.negocio_id === deal.id).map(async doc => {
      const signed = await client.storage.from('documentos').createSignedUrl(doc.caminho, 3600);
      if (signed.error) throw signed.error;
      const extension = String(doc.nome_original || '').split('.').pop().toLowerCase();
      return { id: doc.id, path: doc.caminho, nome: doc.nome_original, tipo: doc.mime,
        formato: extension, dados: signed.data.signedUrl };
    }));
    dealsByProperty.set(property.id, Object.assign({}, property.fechado_em ? { data: property.fechado_em.slice(0, 10) } : {}, {
      _dealId: deal.id, _clientId: deal.cliente_id, cliente: buyer.nome || '', clienteEmail: buyer.email || '',
      tel: buyer.telefone || '', cpf: buyer.cpf || '', rg: buyer.rg || '', email: buyer.email || '',
      origem: deal.origem === 'whatsapp' ? 'whats' : deal.origem,
      msgId: deal.mensagem_id || '', data: deal.data_negocio, registradoEm: deal.criado_em,
      valor: Number(deal.valor) || 0, pagamento: deal.forma_pagamento || (deal.financiado ? 'Financiamento' : 'À vista'),
      entrada: Number(deal.entrada) || 0, parcelasQuantidade: deal.parcelas || 0, parcelaValor: Number(deal.valor_parcela) || 0,
      obs: deal.observacoes || '', por: owner && owner.nome || '', porId: owner && owner.email.toLowerCase() || '',
      contratos: documents, contrato: documents[0] || null
    }));
  }
  const ownerIds = [...new Set(rows.map(property => property.anunciante_id).filter(Boolean))];
  const owners = new Map();
  if (ownerIds.length) {
    const { data, error } = await client.from('clientes').select('id,nome,email,telefone,criado_em').in('id', ownerIds);
    if (error) throw error;
    for (const owner of data || []) {
      const { data: personal, error: personalError } = await client.rpc('ver_dados_pessoais', { _cliente: owner.id });
      if (personalError) throw personalError;
      owners.set(owner.id, Object.assign({}, owner, personal || {}));
    }
  }

  const loadedProperties = rows.map(property => {
      const normalized = adminPropertyFromRow(property, photosByProperty.get(property.id) || []);
      if (dealsByProperty.has(property.id)) normalized.fech = dealsByProperty.get(property.id);
      return normalized;
  });
  adminPropertyBaseline = new Map(loadedProperties.map(property => [property._dbId, adminPropertySnapshot(property)]));
  return {
    properties: loadedProperties,
    advertisers: rows.filter(property => property.anunciante_id).map(property => {
      const owner = owners.get(property.anunciante_id) || {};
      return {
        cod: property.codigo,
        nome: owner.nome || '',
        cpf: owner.cpf || '',
        rg: owner.rg || '',
        telefone: owner.telefone || '',
        email: owner.email || '',
        data: owner.criado_em || property.criado_em
      };
    })
  };
}

const propertyRowFromAdmin = (property, ownerId) => ({
  anunciante_id: ownerId || null,
  titulo: property.titulo,
  finalidade: property.fin,
  tipo: property.tipo,
  situacao: property.st === 'disp' ? 'disponivel' : property.st,
  cep: property.cep || null,
  logradouro: property.logradouro || null,
  numero: property.numero || null,
  complemento: property.complemento || null,
  bairro: property.bairro || null,
  cidade: property.cidade,
  uf: property.uf || null,
  quartos: Number(property.q) || 0,
  suites: Number(property.s) || 0,
  banheiros: Number(property.b) || 0,
  vagas: Number(property.v) || 0,
  area_m2: Number(property.area) || 0,
  valor: Number(property.valor) || 0,
  descricao: property.texto || null,
  video_url: property.video || null,
  fechado_em: property.fechado_em || (property.fech && typeof property.fech === 'object' && property.fech.data
    ? new Date(property.fech.data + 'T12:00:00').toISOString()
    : property.fech && typeof property.fech === 'string' ? property.fech : null),
  arquivado_em: property.arquivado && property.arquivado.em || null,
  arquivado_motivo: property.arquivado && property.arquivado.motivo || null,
  arquivado_por: property._archiveOwnerId || null
});

async function findOrSaveAdvertiser(owner, existingId) {
  const client = requireSupabase();
  const email = String(owner.email || '').trim().toLowerCase();
  let query = client.from('clientes').select('id,nome,email,telefone,perfis').limit(1);
  query = existingId ? query.eq('id', existingId) : query.eq('email', email);
  const { data: matches, error: lookupError } = await query;
  if (lookupError) throw lookupError;
  const current = matches && matches[0];
  const values = {
    nome: owner.nome.trim(),
    email,
    telefone: owner.telefone.trim(),
    perfis: [...new Set([...(current && current.perfis || []), 'anunciante'])]
  };
  let saved;
  if (current) {
    const result = await client.from('clientes').update(values).eq('id', current.id).select('id').single();
    if (result.error) throw result.error;
    saved = result.data;
  } else {
    const result = await client.from('clientes').insert(values).select('id').single();
    if (result.error) throw result.error;
    saved = result.data;
  }
  const { data: personal, error: personalReadError } = current
    ? await client.rpc('ver_dados_pessoais', { _cliente: current.id })
    : { data: null, error: null };
  if (personalReadError) throw personalReadError;
  const { error: personalError } = await client.rpc('salvar_dados_pessoais', {
    _cliente: saved.id,
    _cpf: owner.cpf,
    _rg: owner.rg,
    _cep: personal && personal.cep || '',
    _logradouro: personal && personal.logradouro || '',
    _numero: personal && personal.numero || '',
    _complemento: personal && personal.complemento || '',
    _bairro: personal && personal.bairro || '',
    _cidade: personal && personal.cidade || '',
    _uf: personal && personal.uf || ''
  });
  if (personalError) throw personalError;
  return saved.id;
}

async function uploadPropertyPhotos(propertyId, property, previousRows) {
  const client = requireSupabase();
  const bucket = client.storage.from('imoveis');
  const existingByUrl = new Map((previousRows || []).map(photo => [
    bucket.getPublicUrl(photo.caminho).data.publicUrl,
    photo
  ]));
  const kept = [];
  const uploaded = [];
  try {
    for (let order = 0; order < (property.fotos || []).length; order++) {
      const url = property.fotos[order];
      const old = existingByUrl.get(url);
      if (old) {
        const { error } = await client.from('imoveis_fotos').update({ ordem: order }).eq('id', old.id);
        if (error) throw error;
        kept.push(old.id);
        continue;
      }
      if (!String(url).startsWith('data:image/')) throw new Error('Uma foto selecionada não pôde ser identificada para salvar.');
      const response = await fetch(url);
      if (!response.ok) throw new Error('Não foi possível preparar uma foto do imóvel para enviar.');
      const blob = await response.blob();
      const extension = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg';
      const path = propertyId + '/' + crypto.randomUUID() + '.' + extension;
      const { error: uploadError } = await bucket.upload(path, blob, { contentType: blob.type, upsert: false });
      if (uploadError) throw uploadError;
      uploaded.push(path);
      const { data: photo, error: photoError } = await client.from('imoveis_fotos')
        .insert({ imovel_id: propertyId, caminho: path, ordem: order })
        .select('id')
        .single();
      if (photoError) throw photoError;
      kept.push(photo.id);
    }

    const removed = (previousRows || []).filter(photo => !kept.includes(photo.id));
    if (removed.length) {
      const { error } = await client.from('imoveis_fotos').delete().in('id', removed.map(photo => photo.id));
      if (error) throw error;
      const { error: storageError } = await bucket.remove(removed.map(photo => photo.caminho));
      if (storageError) throw storageError;
    }
    const { data: savedPhotos, error: savedPhotosError } = await client.from('imoveis_fotos')
      .select('id,imovel_id,caminho,ordem')
      .eq('imovel_id', propertyId)
      .order('ordem', { ascending: true });
    if (savedPhotosError) throw savedPhotosError;
    return savedPhotos || [];
  } catch (error) {
    if (uploaded.length) {
      const { error: cleanupError } = await bucket.remove(uploaded);
      if (cleanupError) console.error('Não foi possível limpar as fotos enviadas durante uma falha.', cleanupError);
    }
    throw error;
  }
}

async function saveAdminProperty(property, owner) {
  const client = requireSupabase();
  const ownerId = await findOrSaveAdvertiser(owner, property._ownerId);
  const row = propertyRowFromAdmin(property, ownerId);
  let saved;
  if (property._dbId) {
    const result = await client.from('imoveis').update(row).eq('id', property._dbId).select('id,codigo').single();
    if (result.error) throw result.error;
    saved = result.data;
  } else {
    const { data: member, error: memberError } = await client.from('equipe').select('id')
      .eq('email', (me() || {}).email || '')
      .single();
    if (memberError) throw memberError;
    const result = await client.from('imoveis').insert(Object.assign({}, row, { criado_por: member.id }))
      .select('id,codigo')
      .single();
    if (result.error) throw result.error;
    saved = result.data;
  }
  const photos = await uploadPropertyPhotos(saved.id, property, property._photoRows || []);
  const result = Object.assign({}, property, { _dbId: saved.id, _ownerId: ownerId, cod: saved.codigo, _photoRows: photos });
  adminPropertyBaseline.set(saved.id, adminPropertySnapshot(result));
  return result;
}

async function persistAdminPropertyState(property) {
  if (!property || !property._dbId) throw new Error('Imóvel sem identificador do banco. Atualize a página.');
  const baseline = adminPropertyBaseline.get(property._dbId);
  let dealChanged = true;
  if (baseline) {
    try { dealChanged = JSON.stringify(JSON.parse(baseline).fech || null) !== JSON.stringify(property.fech || null); }
    catch (_) { dealChanged = true; }
  }
  const row = propertyRowFromAdmin(property, property._ownerId);
  const { error } = await requireSupabase().from('imoveis').update(row).eq('id', property._dbId);
  if (error) throw error;
  if (dealChanged) await persistAdminDeal(property);
  adminPropertyBaseline.set(property._dbId, adminPropertySnapshot(property));
}

async function persistAdminDeal(property) {
  const client = requireSupabase();
  let query = client.from('negocios').select('id').eq('imovel_id', property._dbId).maybeSingle();
  const lookup = await query;
  if (lookup.error) throw lookup.error;
  const previousId = lookup.data && lookup.data.id;
  const deal = property.fech;
  if (!deal) {
    if (!previousId) return;
    const { error: detachError } = await client.from('negocios').update({ mensagem_id: null }).eq('id', previousId);
    if (detachError) throw detachError;
    const { data: docs, error: docsError } = await client.from('negocios_documentos').select('caminho').eq('negocio_id', previousId);
    if (docsError) throw docsError;
    const { error } = await client.from('negocios').delete().eq('id', previousId);
    if (error) throw error;
    if ((docs || []).length) {
      const { error: removeError } = await client.storage.from('documentos').remove(docs.map(doc => doc.caminho));
      if (removeError) throw removeError;
    }
    return;
  }
  const email = String(deal.clienteEmail || deal.email || '').trim().toLowerCase();
  let customerId = deal._clientId || null;
  if (email) {
    const found = await client.from('clientes').select('id').eq('email', email).limit(1).maybeSingle();
    if (found.error) throw found.error;
    if (found.data) customerId = found.data.id;
    else customerId = await findOrSaveAdvertiser({ nome: deal.cliente || '', email, telefone: deal.tel || '', cpf: deal.cpf || '', rg: deal.rg || '' });
  }
  const responsible = TEAM().find(person => person.email.toLowerCase() === String(deal.porId || '').toLowerCase()) || TEAM().find(person => person.id === deal.porId);
  const row = { imovel_id: property._dbId, tipo: property.st === 'alugado' ? 'locacao' : 'venda', cliente_id: customerId,
    origem: deal.origem === 'whats' ? 'whatsapp' : deal.origem || 'outro',
    mensagem_id: typeof deal.msgId === 'string' && /^[0-9a-f-]{36}$/i.test(deal.msgId) ? deal.msgId : null,
    data_negocio: deal.data || new Date().toISOString().slice(0, 10), valor: Number(deal.valor) || Number(property.valor) || 0,
    forma_pagamento: deal.pagamento || null, financiado: /financiamento/i.test(deal.pagamento || ''),
    entrada: Number(deal.entrada) || null, parcelas: Number(deal.parcelasQuantidade) || null,
    valor_parcela: Number(deal.parcelaValor) || null, observacoes: deal.obs || null,
    responsavel_id: responsible && responsible.id || null };
  const saved = previousId
    ? await client.from('negocios').update(row).eq('id', previousId).select('id').single()
    : await client.from('negocios').insert(row).select('id').single();
  if (saved.error) throw saved.error;
  deal._dealId = saved.data.id;
  const bucket = client.storage.from('documentos');
  for (const document of deal.contratos || []) {
    if (document.path) continue;
    if (!String(document.dados || '').startsWith('data:')) throw new Error('O contrato precisa ser selecionado novamente para ser enviado ao Supabase.');
    const response = await fetch(document.dados);
    if (!response.ok) throw new Error('Não foi possível preparar o contrato para envio.');
    const blob = await response.blob();
    const extension = String(document.formato || 'pdf').toLowerCase();
    const path = 'negocios/' + saved.data.id + '/' + crypto.randomUUID() + '.' + extension;
    const upload = await bucket.upload(path, blob, { contentType: document.tipo || blob.type, upsert: false });
    if (upload.error) throw upload.error;
    const inserted = await client.from('negocios_documentos').insert({ negocio_id: saved.data.id, caminho: path,
      nome_original: document.nome || 'contrato.' + extension, mime: document.tipo || blob.type, tamanho: blob.size, criado_por: (me() && TEAM().find(person => person.email.toLowerCase() === me().email.toLowerCase()) || {}).id || null }).select('id').single();
    if (inserted.error) { await bucket.remove([path]); throw inserted.error; }
    document.path = path;
    document.id = inserted.data.id;
    const signed = await bucket.createSignedUrl(path, 3600);
    if (signed.error) throw signed.error;
    document.dados = signed.data.signedUrl;
  }
}

async function deleteAdminProperty(property) {
  const client = requireSupabase();
  if (!property || !property._dbId) throw new Error('O imóvel não foi carregado do banco. Atualize a página e tente novamente.');
  const photos = property._photoRows || [];
  const { error } = await client.from('imoveis').delete().eq('id', property._dbId);
  if (error) throw error;
  if (photos.length) {
    const { error: storageError } = await client.storage.from('imoveis').remove(photos.map(photo => photo.caminho));
    if (storageError) throw storageError;
  }
}

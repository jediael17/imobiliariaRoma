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

  return {
    properties: rows.map(property => adminPropertyFromRow(property, photosByProperty.get(property.id) || [])),
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
  fechado_em: property.fechado_em || (property.fech && typeof property.fech === 'string' ? property.fech : null),
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
  return Object.assign({}, property, { _dbId: saved.id, _ownerId: ownerId, cod: saved.codigo, _photoRows: photos });
}

async function persistAdminPropertyState(property) {
  if (!property || !property._dbId) throw new Error('Imóvel sem identificador do banco. Atualize a página.');
  const row = propertyRowFromAdmin(property, property._ownerId);
  const { error } = await requireSupabase().from('imoveis').update(row).eq('id', property._dbId);
  if (error) throw error;
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

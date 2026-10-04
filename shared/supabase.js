/* Supabase client and shared public-data queries. */
const supabaseClient = (() => {
  const sdk = window.supabase;
  if (!sdk || typeof sdk.createClient !== 'function') {
    console.error('Supabase SDK failed to load.');
    return null;
  }
  // The public site and admin panel share an origin and browser profile. Give
  // the admin its own auth storage so its team-only signOut/session cannot
  // interfere with a customer login in another open tab.
  const authStorage = document.getElementById('app') ? { storageKey: 'roma-admin-auth' } : {};
  return sdk.createClient(ROMA_CONFIG.supabaseUrl, ROMA_CONFIG.supabaseKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      ...authStorage
    }
  });
})();

const requireSupabase = () => {
  if (!supabaseClient) throw new Error('Não foi possível conectar ao Supabase. Atualize a página e tente novamente.');
  return supabaseClient;
};

const supabaseMessage = error => error && error.message ? error.message : 'Erro inesperado no Supabase.';

async function loadPublishedProperties() {
  const client = requireSupabase();
  const { data: properties, error } = await client
    .from('imoveis_publicos')
    .select('*')
    .order('criado_em', { ascending: false });
  if (error) throw error;

  const ids = (properties || []).map(property => property.id);
  let photos = [];
  if (ids.length) {
    const result = await client
      .from('imoveis_fotos_publicas')
      .select('id,imovel_id,caminho,ordem')
      .in('imovel_id', ids)
      .order('ordem', { ascending: true });
    if (result.error) throw result.error;
    photos = result.data || [];
  }

  const photosByProperty = new Map();
  photos.forEach(photo => {
    const list = photosByProperty.get(photo.imovel_id) || [];
    list.push(client.storage.from('imoveis').getPublicUrl(photo.caminho).data.publicUrl);
    photosByProperty.set(photo.imovel_id, list);
  });

  return (properties || []).map(property => ({
    id: property.id,
    cod: property.codigo,
    titulo: property.titulo,
    fin: property.finalidade === 'aluguel' ? 'aluguel' : 'venda',
    tipo: property.tipo,
    st: property.situacao === 'disponivel' ? 'disp' : property.situacao,
    bairro: property.bairro || '',
    cidade: property.cidade,
    uf: property.uf || '',
    cep: property.cep || '',
    logradouro: property.logradouro || '',
    numero: property.numero || '',
    complemento: property.complemento || '',
    q: property.quartos || 0,
    s: property.suites || 0,
    b: property.banheiros || 0,
    v: property.vagas || 0,
    area: Number(property.area_m2) || 0,
    valor: Number(property.valor) || 0,
    texto: property.descricao || '',
    video: property.video_url || '',
    fech: property.fechado_em || '',
    arquivado: null,
    fotos: photosByProperty.get(property.id) || [],
    art: 'casa1'
  }));
}

async function loadPublishedSlides() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('carrossel_imagens')
    .select('id,caminho,ordem')
    .order('ordem', { ascending: true });
  if (error) throw error;
  return (data || []).map((slide, index) => ({
    id: slide.id,
    path: slide.caminho,
    data: client.storage.from('carrossel').getPublicUrl(slide.caminho).data.publicUrl,
    name: 'Imagem ' + (index + 1)
  }));
}

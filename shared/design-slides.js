/* Shared Supabase-backed storage for the public home-page carousel. */
const designSlidesLoad = () => loadPublishedSlides();

const designSlidesSave = async slides => {
  const client = requireSupabase();
  const { data: current, error: readError } = await client
    .from('carrossel_imagens')
    .select('id,caminho,ordem')
    .order('ordem', { ascending: true });
  if (readError) throw readError;

  const uploadedPaths = [];
  const rows = [];
  try {
    for (let index = 0; index < slides.length; index++) {
      const slide = slides[index];
      if (slide.id && slide.path) {
        rows.push({ id: slide.id, caminho: slide.path, ordem: index });
        continue;
      }
      if (!slide.data || !slide.data.startsWith('data:image/')) {
        throw new Error('Uma imagem do carrossel não está disponível para envio.');
      }
      const response = await fetch(slide.data);
      if (!response.ok) throw new Error('Não foi possível preparar uma imagem do carrossel.');
      const blob = await response.blob();
      const extension = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg';
      const path = crypto.randomUUID() + '.' + extension;
      const { error: uploadError } = await client.storage.from('carrossel').upload(path, blob, {
        contentType: blob.type,
        upsert: false
      });
      if (uploadError) throw uploadError;
      uploadedPaths.push(path);
      rows.push({ caminho: path, ordem: index, slideIndex: index });
    }

    const retainedIds = rows.filter(row => row.id).map(row => row.id);
    const newRows = rows.filter(row => !row.id);
    if (newRows.length) {
      const { data: inserted, error: insertError } = await client.from('carrossel_imagens')
        .insert(newRows.map(({ slideIndex, ...row }) => row))
        .select('id,caminho,ordem');
      if (insertError) throw insertError;
      (inserted || []).forEach((row, index) => {
        const slide = slides[newRows[index].slideIndex];
        slide.id = row.id;
        slide.path = row.caminho;
      });
    }
    for (const row of rows.filter(item => item.id)) {
      const { error: updateError } = await client
        .from('carrossel_imagens')
        .update({ ordem: row.ordem })
        .eq('id', row.id);
      if (updateError) throw updateError;
    }

    const removed = (current || []).filter(row => !retainedIds.includes(row.id)
      && !rows.some(next => next.caminho === row.caminho));
    if (removed.length) {
      const { error: deleteError } = await client
        .from('carrossel_imagens')
        .delete()
        .in('id', removed.map(row => row.id));
      if (deleteError) throw deleteError;
      const { error: storageError } = await client.storage.from('carrossel')
        .remove(removed.map(row => row.caminho));
      if (storageError) throw storageError;
    }
  } catch (error) {
    if (uploadedPaths.length) {
      const { error: cleanupError } = await client.storage.from('carrossel').remove(uploadedPaths);
      if (cleanupError) console.error('Não foi possível limpar imagens enviadas durante uma falha.', cleanupError);
    }
    throw error;
  }
};

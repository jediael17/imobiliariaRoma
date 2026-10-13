/* Inicialização do site. */
const setWhatsappLinks=()=>{
 document.querySelectorAll('.cta').forEach(a=>{a.href=waLink(MSG0);a.target='_blank';a.rel='noopener'});
 document.querySelectorAll('[data-wa-message]').forEach(a=>{a.href=waLink(a.dataset.waMessage);a.target='_blank';a.rel='noopener'});
};
setWhatsappLinks();
async function refreshWhatsappNumber(){
 try{
  const {data,error}=await requireSupabase().rpc('whatsapp_publico');
  if(error)throw error;
  const number=String(data||'').replace(/\D/g,'');
  if(/^55\d{10,11}$/.test(number)){CFG.whats=number;setWhatsappLinks()}
 }catch(error){console.warn('Não foi possível carregar o WhatsApp configurado. Verifique se supabase/sql/06_whatsapp_publico.sql foi executado no Supabase.',error)}
}
refreshWhatsappNumber();
setInterval(refreshWhatsappNumber,60000);
apply();

async function refreshSupabaseProperties(){
 const properties=await loadPublishedProperties();
 IM=properties;
 refreshPublishedListings();
}

refreshSupabaseProperties().then(()=>{
 route();
}).catch(error=>{
 console.error('Não foi possível carregar os imóveis publicados do Supabase.',error);
 const empty=document.getElementById('empty');
 empty.hidden=false;
 empty.textContent='Não foi possível carregar os imóveis agora. Atualize a página ou entre em contato com a ROMA pelo WhatsApp.';
});
setInterval(()=>refreshSupabaseProperties().catch(error=>{
 console.error('Não foi possível atualizar os imóveis publicados do Supabase.',error);
}),60000);

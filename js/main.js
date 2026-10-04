/* Inicialização do site. */
const setCta=()=>document.querySelectorAll('.cta').forEach(a=>{a.href=waLink(MSG0);a.target='_blank';a.rel='noopener'});setCta();
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

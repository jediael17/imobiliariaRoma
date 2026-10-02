/* Inicialização do site. */
const setCta=()=>document.querySelectorAll('.cta').forEach(a=>{a.href=waLink(MSG0);a.target='_blank';a.rel='noopener'});setCta();
route();
apply();

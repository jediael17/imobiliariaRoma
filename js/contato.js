/* Card de contato (comprar / vender / alugar), confirmação e gravação das mensagens. */
async function saveMsg(tp){
 const fields=[];
 mform.querySelectorAll('input,select,textarea').forEach(el=>{
  if(el.matches(':disabled')||el.type==='file'||el.type==='checkbox')return;
  if(el.type==='radio'&&!el.checked)return;
  let value=(el.value||'').trim();
  if(!value)return;
  const key=el.name==='fin'?'Finalidade':(el.getAttribute('aria-label')||el.placeholder||'Campo');
  if(el.dataset.mask==='brl')value=formatBRLValue(parseBRLInput(value));
  if(el.name==='fin')value=value==='alugar'?'Alugar':'Vender';
  fields.push({k:key,v:value});
 });

 const valueFor=label=>(fields.find(field=>field.k===label)||{}).v||'';
 const type=tp==='vender'?(mform.fin.value==='alugar'?'alugar':'vender'):tp;
 const details={
  campos:fields.filter(field=>!['Nome completo','WhatsApp','E-mail'].includes(field.k)),
  conta:USER&&USER.email||null
 };
 const {error}=await requireSupabase().from('mensagens').insert({
  tipo:type,
  nome:valueFor('Nome completo'),
  telefone:valueFor('WhatsApp')||null,
  email:valueFor('E-mail')||null,
  detalhes:details,
  aceite_politica_versao:POLICY_VERSION
 });
 if(error)throw error;
}

const modal=document.getElementById('modal'),mform=document.getElementById('mform'),mdone=document.getElementById('mdone');let lastF,tab='comprar';
function setTab(t){tab=t;document.querySelectorAll('.mtabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.m===t));['comprar','vender'].forEach(k=>{const f=document.getElementById('p-'+k);f.hidden=k!==t;f.disabled=k!==t});document.getElementById('mtitle').textContent=t==='vender'?'Venda ou aluguel do seu imóvel':'Solicitação de compra'}
function openModal(t,showTabs=true){lastF=document.activeElement;mdone.hidden=true;mform.hidden=false;document.querySelector('.mtabs').hidden=!showTabs;setTab(t||'comprar');modal.hidden=false;document.body.style.overflow='hidden';requestAnimationFrame(()=>modal.classList.add('show'));prefillUser();setTimeout(()=>mform.querySelector('input').focus(),50)}
function closeModal(){modal.classList.remove('show');setTimeout(()=>{modal.hidden=true},250);document.body.style.overflow='';lastF&&lastF.focus()}
document.querySelectorAll('a[href="#contato"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();openModal('comprar')}));
document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openModal(b.dataset.open));
document.querySelectorAll('.mtabs button').forEach(b=>b.onclick=()=>setTab(b.dataset.m));
document.getElementById('mclose').onclick=closeModal;document.getElementById('mok').onclick=closeModal;
modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closeModal()});
const okm=document.getElementById('okmodal');
function openOk(t,h){document.getElementById('oktitle').textContent=h||'Recebemos seu contato';document.getElementById('oktxt').textContent=t;okm.hidden=false;document.body.style.overflow='hidden';requestAnimationFrame(()=>okm.classList.add('show'));setTimeout(()=>document.getElementById('okclose').focus(),60)}
function closeOk(){okm.classList.remove('show');setTimeout(()=>{okm.hidden=true},250);document.body.style.overflow='';lastF&&lastF.focus&&lastF.focus()}
document.getElementById('okclose').onclick=closeOk;document.getElementById('okx').onclick=closeOk;
okm.addEventListener('click',e=>{if(e.target===okm)closeOk()});
addEventListener('keydown',e=>{if(e.key==='Escape'&&!okm.hidden)closeOk()});
mform.onsubmit=async e=>{
 e.preventDefault();
 const error=document.getElementById('mformError'),submit=document.getElementById('msend'),v=tab==='vender';
 error.hidden=true;submit.disabled=true;
 try{
  const sol=document.getElementById('mtitle').textContent.includes('aluguel')?'aluguel':'compra';
  if(v&&mform.querySelector('#p-vender input[type=file]').files.length)throw new Error('O envio de fotos pelo formulário ainda não está disponível. Envie as imagens pelo WhatsApp após o contato da equipe.');
  await saveMsg(v?'vender':'comprar');
  const text=v?'Nossa equipe vai avaliar seu imóvel e falar com você para anunciá-lo no site para '+(mform.fin.value==='alugar'?'aluguel':'venda')+'.':'Cadastramos sua solicitação de '+sol+'. Um corretor da ROMA vai falar com você em breve.';
  mform.reset();updFin();closeModal();openOk(text);
 }catch(failure){
  console.error('Falha ao registrar o contato no Supabase.',failure);
  error.textContent='Não foi possível enviar sua solicitação. '+supabaseMessage(failure);
  error.hidden=false;
 }finally{submit.disabled=false}
};
function updFin(){const a=mform.fin.value==='alugar';document.getElementById('sellval').placeholder=a?'Valor do aluguel (R$/mês)':'Valor pretendido (R$)';document.getElementById('authtxt').textContent='Autorizo a ROMA a anunciar este imóvel para '+(a?'aluguel':'venda')+' no site.'}
mform.querySelectorAll('[name=fin]').forEach(r=>r.onchange=updFin);

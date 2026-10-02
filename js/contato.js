/* Card de contato (comprar / vender / alugar), confirmação e gravação das mensagens. */
function saveMsg(tp){const f=[];mform.querySelectorAll('input,select,textarea').forEach(el=>{if(el.matches(':disabled')||el.type==='file'||el.type==='checkbox')return;if(el.type==='radio'&&!el.checked)return;let v=(el.value||'').trim();if(!v)return;const k=el.name==='fin'?'Finalidade':(el.getAttribute('aria-label')||el.placeholder||'Campo');if(el.name==='fin')v=v==='alugar'?'Alugar':'Vender';f.push({k,v})});if(USER)f.push({k:'Conta Google',v:USER.email});const ms=DB.get('roma_msgs',[]);ms.unshift({id:Date.now(),data:new Date().toISOString(),tipo:tp,status:'nova',campos:f});DB.set('roma_msgs',ms)}

const modal=document.getElementById('modal'),mform=document.getElementById('mform'),mdone=document.getElementById('mdone');let lastF,tab='comprar';
function setTab(t){tab=t;document.querySelectorAll('.mtabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.m===t));['comprar','vender'].forEach(k=>{const f=document.getElementById('p-'+k);f.hidden=k!==t;f.disabled=k!==t});document.getElementById('mtitle').textContent=t==='vender'?'Venda ou aluguel do seu imóvel':'Solicitação de compra'}
function openModal(t){lastF=document.activeElement;mdone.hidden=true;mform.hidden=false;document.querySelector('.mtabs').hidden=false;setTab(t||'comprar');modal.hidden=false;document.body.style.overflow='hidden';requestAnimationFrame(()=>modal.classList.add('show'));prefillUser();setTimeout(()=>mform.querySelector('input').focus(),50)}
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
mform.onsubmit=e=>{e.preventDefault();const v=tab==='vender',sol=document.getElementById('mtitle').textContent.includes('aluguel')?'aluguel':'compra';
 const t=v?'Nossa equipe vai avaliar seu imóvel e falar com você para anunciá-lo no site para '+(mform.fin.value==='alugar'?'aluguel':'venda')+'.':'Cadastramos sua solicitação de '+sol+'. Um corretor da ROMA vai falar com você pelo WhatsApp em breve.';
 saveMsg(v?'vender':'comprar');mform.reset();updFin();closeModal();openOk(t)};
function updFin(){const a=mform.fin.value==='alugar';document.getElementById('sellval').placeholder=a?'Valor do aluguel (R$/mês)':'Valor pretendido (R$)';document.getElementById('authtxt').textContent='Autorizo a ROMA a anunciar este imóvel para '+(a?'aluguel':'venda')+' no site.'}
mform.querySelectorAll('[name=fin]').forEach(r=>r.onchange=updFin);

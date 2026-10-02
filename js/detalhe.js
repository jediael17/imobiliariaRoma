/* Página de detalhe do imóvel (galeria, comprar, WhatsApp) e navegação por endereço (#imovel/RM-001). */
const home=document.querySelector('main'),det=document.createElement('main');det.id='detail';det.hidden=true;home.after(det);
const TX={Apartamento:'Planta bem distribuída, ambientes integrados e boa iluminação natural, em prédio com infraestrutura completa.',Cobertura:'Terraço privativo com área de lazer e vista ampla, ideal para receber família e amigos com conforto e exclusividade.',Casa:'Espaço generoso para a família, com integração entre sala e área externa, jardim e privacidade.',Comercial:'Sala em localização estratégica, com boa circulação de clientes e fácil acesso ao transporte.'};
const VB=['0 0 1600 900','400 150 800 450','800 300 600 338','300 400 600 338'],VL=['Fachada','Detalhe da fachada','Ambientes','Entrada'];
let detCur='',lastY=0;
const fe=(k,n,l)=>'<div class="fe">'+IC[k]+'<b>'+n+'</b><span>'+l+'</span></div>';
const waIc='<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.1.1.6-.1 1.2z"/></svg>';
const actions=(i,al)=>{if(i.st&&i.st!=='disp')return '<p class="soldmsg">Este imóvel já foi '+(i.st==='alugado'?'alugado':'vendido')+'. Volte à lista para ver os imóveis disponíveis.</p>';const t='Olá! Tenho interesse em '+(al?'alugar':'comprar')+' o imóvel '+i.cod+' – '+i.titulo+' ('+i.tipo+' em '+i.bairro+', '+i.cidade+', R$ '+F(i.valor)+(al?'/mês':'')+'). Pode me passar mais informações?';return '<button type="button" class="buy" id="dBuy">'+(al?'Alugar':'Comprar')+'</button><a class="wa" id="dWa" target="_blank" rel="noopener" href="'+waLink(t)+'">'+waIc+(al?'Alugar':'Comprar')+' pelo WhatsApp</a><p class="note">Um corretor da ROMA entra em contato para agendar a visita e tirar suas dúvidas.</p>'};
function showDet(cod){
 const i=IM.find(x=>x.cod===cod);if(!i)return showHome();
 const al=i.fin==='aluguel';if(!detCur)lastY=scrollY;detCur=cod;
 det.innerHTML='<section class="det"><div class="wrap"><button type="button" class="back" id="dBack">← Voltar aos imóveis</button><div class="dgrid"><div class="gal"><div class="gmain" id="gmain" role="img" aria-label="Ilustração do imóvel"></div><div class="gth" id="gth"></div></div>'
 +'<aside class="dinfo"><div class="drow"><span class="tag2">'+(i.st==='vendido'?'Vendido':i.st==='alugado'?'Alugado':al?'Aluguel':'Venda')+'</span><span class="cod">Cód. '+i.cod+'</span></div><h2>'+i.titulo+'</h2><p class="loc">'+i.tipo+' · '+i.bairro+', '+i.cidade+'</p><div class="dprice">R$ '+F(i.valor)+(al?'<small>/mês</small>':'')+'</div>'+actions(i,al)+'</aside></div>'
 +'<div class="dtext"><h3>Sobre o imóvel</h3><p>'+desc(i)+' '+(i.texto||TX[i.tipo]||'')+' Localizado em '+i.bairro+', '+i.cidade+'.</p><h3>Características</h3><div class="feats">'+(i.q?fe('bed',i.q,i.q===1?'Quarto':'Quartos'):'')+(i.s?fe('suite',i.s,i.s===1?'Suíte':'Suítes'):'')+fe('bath',i.b,i.b===1?'Banheiro':'Banheiros')+fe('car',i.v,i.v===1?'Vaga de garagem':'Vagas de garagem')+fe('area',F(i.area)+' m²','Área útil')+'</div>'
 +'<h3>Ficha técnica</h3><dl class="spec">'+[['Tipo',i.tipo],['Finalidade',al?'Aluguel':'Venda'],['Cidade',i.cidade],['Bairro',i.bairro],['Área útil',F(i.area)+' m²'],['Código',i.cod],[al?'Aluguel mensal':'Valor','R$ '+F(i.valor)]].map(r=>'<div><dt>'+r[0]+'</dt><dd>'+r[1]+'</dd></div>').join('')+'</dl><p class="note">Imagens e textos ilustrativos de exemplo.</p></div></div></section>';
 const urls=i.fotos&&i.fotos.length?i.fotos:VB.map(v=>svgUrl(i.art,v)),gm=$('gmain'),gt=$('gth');
 const pick=k=>{gm.style.backgroundImage='url("'+urls[k]+'")';gm.setAttribute('aria-label',(VL[k]||'Foto '+(k+1)));[...gt.children].forEach((b,j)=>b.classList.toggle('on',j===k))};
 urls.forEach((u,k)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',(VL[k]||'Foto '+(k+1)));b.style.backgroundImage='url("'+u+'")';b.onclick=()=>pick(k);gt.appendChild(b)});pick(0);
 $('dBack').onclick=()=>{showHome();try{location.hash='#imoveis'}catch(e){}};
 if($('dBuy'))$('dBuy').onclick=()=>{openModal('comprar');const p=$('p-comprar'),x=p.querySelectorAll('input:not([type])'),sl=p.querySelector('select'),ta=p.querySelector('textarea');
  sl.value=i.tipo;x[0].value=i.cidade;x[1].value=i.bairro;ta.value='Tenho interesse '+(al?'em alugar':'em comprar')+' o imóvel '+i.cod+' – '+i.titulo+' (R$ '+F(i.valor)+(al?'/mês':'')+').';
  $('mtitle').textContent=al?'Solicitação de aluguel':'Solicitação de compra'};
 home.hidden=true;det.hidden=false;scrollTo(0,0);
}
function showHome(){if(det.hidden)return;det.hidden=true;home.hidden=false;detCur='';scrollTo(0,lastY)}
function route(){const m=location.hash.match(/^#imovel\/(.+)$/);if(m){const c=decodeURIComponent(m[1]);if(c!==detCur)showDet(c)}else if(!det.hidden){showHome();const el=location.hash.length>1&&document.getElementById(location.hash.slice(1));if(el)el.scrollIntoView()}}
addEventListener('hashchange',route);
$('grid').addEventListener('click',e=>{const b=e.target.closest('.more');if(!b)return;showDet(b.dataset.cod);try{location.hash='#imovel/'+b.dataset.cod}catch(x){}});
document.querySelectorAll('header a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href').slice(1);if(det.hidden||id==='contato')return;e.preventDefault();showHome();const el=$(id);if(el)el.scrollIntoView()}));

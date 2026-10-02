/* Lista de imóveis: cards, filtros e busca. */
let IM=DB.get('roma_imoveis',null)||DEF.map(x=>({...x}));
const imgOf=(i,vb)=>i.fotos&&i.fotos.length?i.fotos[0]:svgUrl(i.art,vb);
const stTag=i=>'<span class="tag'+(i.st&&i.st!=='disp'?' sold':'')+'">'+(i.st==='vendido'?'Vendido':i.st==='alugado'?'Alugado':i.fin==='venda'?'Venda':'Aluguel')+'</span>';
const desc=i=>i.tipo+' com '+F(i.area)+' m² de área útil'+(i.q?', '+pl(i.q,'quarto','quartos')+(i.s?' ('+pl(i.s,'suíte','suítes')+')':''):'')+', '+pl(i.b,'banheiro','banheiros')+' e garagem para '+pl(i.v,'carro','carros')+'.';
const it=(k,n,t)=>'<span title="'+t+'" aria-label="'+t+'">'+IC[k]+n+'</span>';
const card=i=>'<article class="card'+(i.st&&i.st!=='disp'?' sold':'')+'"><div class="thumb" data-art="'+i.art+'" role="img" aria-label="Ilustração: '+i.titulo+'">'+stTag(i)+'</div><div class="body"><span class="cod">Cód. '+i.cod+'</span><h3>'+i.titulo+'</h3><p class="loc">'+i.tipo+' · '+i.bairro+', '+i.cidade+'</p><p class="desc">'+desc(i)+'</p><div class="meta">'
 +(i.q?it('bed',i.q,pl(i.q,'quarto','quartos')):'')+(i.s?it('suite',i.s,pl(i.s,'suíte','suítes')):'')+it('bath',i.b,pl(i.b,'banheiro','banheiros'))+it('car',i.v,'Garagem para '+pl(i.v,'carro','carros'))+it('area',F(i.area)+' m²',F(i.area)+' metros quadrados')
 +'</div><div class="foot"><div class="price">R$ '+F(i.valor)+(i.fin==='aluguel'?'/mês':'')+'</div><button type="button" class="more" data-cod="'+i.cod+'" aria-label="Mais detalhes de '+i.titulo+'">Mais</button></div></div></article>';
const opts=(id,label,arr,f)=>{$(id).innerHTML='<option value="">'+label+'</option>'+arr.map(x=>'<option value="'+x+'">'+(f?f(x):x)+'</option>').join('')};
const uniq=a=>[...new Set(a)].sort((x,y)=>x.localeCompare(y,'pt-BR'));
let ft='venda';
const lab=v=>ft==='aluguel'?'R$ '+F(v):v>=1e6?'R$ '+(v/1e6)+(v===1e6?' milhão':' milhões'):'R$ '+(v/1000)+' mil';
const fillVal=()=>{const a=ft==='aluguel';opts('fMin','Valor mínimo',a?[1000,2000,3000,5000]:[100000,300000,500000,1000000],lab);opts('fMax','Valor máximo',a?[2000,3000,5000,10000]:[500000,1000000,2000000,5000000],lab)};
const fillBairro=()=>{const c=$('fCidade').value;opts('fBairro','Bairro',uniq(IM.filter(i=>!c||i.cidade===c).map(i=>i.bairro)))};
function apply(){
 const t=$('fTipo').value,c=$('fCidade').value,b=$('fBairro').value,d=+$('fDorm').value||0,bn=+$('fBanh').value||0,mn=+$('fMin').value||0,mx=+$('fMax').value||Infinity,q=$('fCod').value.trim().toLowerCase();
 const list=IM.filter(i=>ft==='codigo'?(!q||i.cod.toLowerCase().includes(q)||i.titulo.toLowerCase().includes(q)):i.fin===ft&&(!t||i.tipo===t)&&(!c||i.cidade===c)&&(!b||i.bairro===b)&&i.q>=d&&i.b>=bn&&i.valor>=mn&&i.valor<=mx);
 list.sort((a,b)=>(a.st&&a.st!=='disp')-(b.st&&b.st!=='disp'));const g=$('grid');g.innerHTML=list.map(card).join('');
 g.querySelectorAll('.thumb').forEach((e,k)=>e.style.backgroundImage='url("'+imgOf(list[k],'200 0 1200 900')+'")');
 $('empty').hidden=list.length>0;
 $('count').textContent=(list.length===1?'1 imóvel encontrado':list.length+' imóveis encontrados')+(ft==='venda'?' para comprar':ft==='aluguel'?' para alugar':'');
}
let tmr;const run=()=>{apply();clearTimeout(tmr);tmr=setTimeout(()=>{const r=$('imoveis').getBoundingClientRect().top;if(Math.abs(r-84)>60)$('imoveis').scrollIntoView({behavior:'smooth'})},350)};
opts('fTipo','Tipo de imóvel',uniq(IM.map(i=>i.tipo)));opts('fCidade','Todas as cidades',uniq(IM.map(i=>i.cidade)));fillBairro();fillVal();
['fTipo','fBairro','fDorm','fBanh','fMin','fMax'].forEach(id=>$(id).addEventListener('change',run));
$('fCidade').addEventListener('change',()=>{fillBairro();run()});
$('fCod').addEventListener('input',run);
document.querySelectorAll('.tabs button').forEach(t=>t.onclick=()=>{document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-selected',x===t));ft=t.dataset.tab;const c=ft==='codigo';$('gBusca').hidden=c;$('gCodigo').hidden=!c;fillVal();run()});
$('finder').onsubmit=e=>{e.preventDefault();apply();$('imoveis').scrollIntoView({behavior:'smooth'})};
$('clearF').onclick=()=>{['fTipo','fCidade','fDorm','fBanh','fMin','fMax'].forEach(id=>$(id).value='');$('fCod').value='';fillBairro();run()};

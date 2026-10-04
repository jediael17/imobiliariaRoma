/* Lista de imóveis: cards, filtros e busca. */
let IM=[];
const publishedIM=()=>IM.filter(i=>!i.arquivado);
const imgOf=(i,vb)=>i.fotos&&i.fotos.length?i.fotos[0]:svgUrl(i.art,vb);
let favoriteIds=new Set();
const favoriteAccount=()=>String(USER&&USER.id||'');
const favoriteCodes=()=>IM.filter(property=>favoriteIds.has(property.id)).map(property=>property.cod);
async function loadUserFavorites(){
 favoriteIds.clear();
 if(!USER){apply();return}
 const {data,error}=await requireSupabase().from('favoritos').select('imovel_id').eq('user_id',USER.id);
 if(error)throw error;
 favoriteIds=new Set((data||[]).map(favorite=>favorite.imovel_id));
 apply();
}
function clearUserFavorites(){favoriteIds.clear();if(typeof apply==='function')apply()}
const favoriteButton=i=>{if(!favoriteAccount())return'';const active=favoriteCodes().includes(i.cod);return '<button type="button" class="favorite'+(active?' active':'')+'" data-favorite="'+i.cod+'" aria-label="'+(active?'Remover '+i.titulo+' dos favoritos':'Adicionar '+i.titulo+' aos favoritos')+'" aria-pressed="'+active+'" title="'+(active?'Remover dos favoritos':'Adicionar aos favoritos')+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg></button>'};
const toggleFavorite=async cod=>{
 const property=IM.find(item=>item.cod===cod);
 if(!favoriteAccount()||!property)return;
 const isFavorite=favoriteIds.has(property.id),client=requireSupabase();
 const result=isFavorite
  ?await client.from('favoritos').delete().eq('user_id',USER.id).eq('imovel_id',property.id)
  :await client.from('favoritos').insert({user_id:USER.id,imovel_id:property.id});
 if(result.error){
  console.error('Não foi possível atualizar o imóvel favorito.',result.error);
  alert('Não foi possível salvar o favorito. '+supabaseMessage(result.error));
  return;
 }
 if(isFavorite)favoriteIds.delete(property.id);else favoriteIds.add(property.id);
 apply();
};
const stTag=i=>'<span class="tag'+(i.st&&i.st!=='disp'?' sold':'')+'">'+(i.st==='vendido'?'Vendido':i.st==='alugado'?'Alugado':i.fin==='venda'?'Venda':'Aluguel')+'</span>';
const desc=i=>i.tipo+' com '+F(i.area)+' m² de área útil'+(i.q?', '+pl(i.q,'quarto','quartos')+(i.s?' ('+pl(i.s,'suíte','suítes')+')':''):'')+', '+pl(i.b,'banheiro','banheiros')+' e garagem para '+pl(i.v,'carro','carros')+'.';
const it=(k,n,t)=>'<span title="'+t+'" aria-label="'+t+'">'+IC[k]+n+'</span>';
const card=i=>'<article class="card'+(i.st&&i.st!=='disp'?' sold':'')+'"><div class="thumb" data-art="'+i.art+'">'+stTag(i)+favoriteButton(i)+'</div><div class="body"><span class="cod">Cód. '+i.cod+'</span><h3>'+i.titulo+'</h3><p class="loc">'+i.tipo+' · '+i.bairro+', '+i.cidade+'</p><p class="desc">'+desc(i)+'</p><div class="meta">'
 +(i.q?it('bed',i.q,pl(i.q,'quarto','quartos')):'')+(i.s?it('suite',i.s,pl(i.s,'suíte','suítes')):'')+it('bath',i.b,pl(i.b,'banheiro','banheiros'))+it('car',i.v,'Garagem para '+pl(i.v,'carro','carros'))+it('area',F(i.area)+' m²',F(i.area)+' metros quadrados')
 +'</div><div class="foot"><div class="price">R$ '+F(i.valor)+(i.fin==='aluguel'?'/mês':'')+'</div><button type="button" class="more" data-cod="'+i.cod+'" aria-label="Mais detalhes de '+i.titulo+'">Mais</button></div></div></article>';
const opts=(id,label,arr,f)=>{$(id).innerHTML='<option value="">'+label+'</option>'+arr.map(x=>'<option value="'+x+'">'+(f?f(x):x)+'</option>').join('')};
const uniq=a=>[...new Set(a)].sort((x,y)=>x.localeCompare(y,'pt-BR'));
let ft='venda';
const lab=v=>ft==='aluguel'?'R$ '+F(v):v>=1e6?'R$ '+(v/1e6)+(v===1e6?' milhão':' milhões'):'R$ '+(v/1000)+' mil';
const fillVal=()=>{const a=ft==='aluguel';opts('fMin','Valor mínimo',a?[1000,2000,3000,5000]:[100000,300000,500000,1000000],lab);opts('fMax','Valor máximo',a?[2000,3000,5000,10000]:[500000,1000000,2000000,5000000],lab)};
const fillBairro=()=>{const c=$('fCidade').value;opts('fBairro','Bairro',uniq(publishedIM().filter(i=>!c||i.cidade===c).map(i=>i.bairro)))};
function apply(){
 const t=$('fTipo').value,c=$('fCidade').value,b=$('fBairro').value,d=+$('fDorm').value||0,bn=+$('fBanh').value||0,mn=+$('fMin').value||0,mx=+$('fMax').value||Infinity,q=$('fCod').value.trim().toLowerCase();
 const list=publishedIM().filter(i=>ft==='codigo'?(!q||i.cod.toLowerCase().includes(q)||i.titulo.toLowerCase().includes(q)):i.fin===ft&&(!t||i.tipo===t)&&(!c||i.cidade===c)&&(!b||i.bairro===b)&&i.q>=d&&i.b>=bn&&i.valor>=mn&&i.valor<=mx);
 const favorites=favoriteCodes();list.sort((a,b)=>Number(favorites.includes(b.cod))-Number(favorites.includes(a.cod))||(Number(a.st&&a.st!=='disp')-Number(b.st&&b.st!=='disp')));const g=$('grid');g.innerHTML=list.map(card).join('');
 g.querySelectorAll('.thumb').forEach((e,k)=>e.style.backgroundImage='url("'+imgOf(list[k],'200 0 1200 900')+'")');
 $('empty').hidden=list.length>0;
 $('empty').textContent=publishedIM().length?'Nenhum imóvel encontrado com esses filtros. Tente ampliar a busca ou limpe os filtros.':'Nenhum imóvel cadastrado no momento. Novas oportunidades aparecerão aqui assim que forem cadastradas.';
 $('count').textContent=(list.length===1?'1 imóvel encontrado':list.length+' imóveis encontrados')+(ft==='venda'?' para comprar':ft==='aluguel'?' para alugar':'');
}
let tmr;const run=()=>{apply();clearTimeout(tmr);tmr=setTimeout(()=>{const r=$('imoveis').getBoundingClientRect().top;if(Math.abs(r-84)>60)$('imoveis').scrollIntoView({behavior:'smooth'})},350)};
opts('fTipo','Tipo de imóvel',uniq(publishedIM().map(i=>i.tipo)));opts('fCidade','Todas as cidades',uniq(publishedIM().map(i=>i.cidade)));fillBairro();fillVal();
['fTipo','fBairro','fDorm','fBanh','fMin','fMax'].forEach(id=>$(id).addEventListener('change',run));
$('fCidade').addEventListener('change',()=>{fillBairro();run()});
$('fCod').addEventListener('input',run);
document.querySelectorAll('.tabs button').forEach(t=>t.onclick=()=>{document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-selected',x===t));ft=t.dataset.tab;const c=ft==='codigo';$('gBusca').hidden=c;$('gCodigo').hidden=!c;fillVal();run()});
$('finder').onsubmit=e=>{e.preventDefault();apply();$('imoveis').scrollIntoView({behavior:'smooth'})};
$('clearF').onclick=()=>{['fTipo','fCidade','fDorm','fBanh','fMin','fMax'].forEach(id=>$(id).value='');$('fCod').value='';fillBairro();run()};
 $('grid').addEventListener('click',e=>{const button=e.target.closest('[data-favorite]');if(button){e.preventDefault();e.stopPropagation();toggleFavorite(button.dataset.favorite)}});
const refreshPublishedListings=()=>{opts('fTipo','Tipo de imóvel',uniq(publishedIM().map(i=>i.tipo)));opts('fCidade','Todas as cidades',uniq(publishedIM().map(i=>i.cidade)));fillBairro();apply();if(detCur&&!IM.some(i=>i.cod===detCur))showHome()};

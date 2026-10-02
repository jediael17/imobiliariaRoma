/* Base do painel: constantes, dados, formatação e funções de apoio. */
const $=id=>document.getElementById(id),F=n=>(+n||0).toLocaleString('pt-BR'),SITE='../index.html';
const CFG=Object.assign({usuario:'admin',senha:'roma2026',whats:ROMA_CONFIG.whatsapp,googleId:'',msId:'',msTenant:'common'},DB.get('roma_cfg',{}));
/* Se nada foi salvo no painel, valem os IDs do config.js (raiz do projeto). */
if(!CFG.googleId)CFG.googleId=ROMA_CONFIG.googleClientId;
if(!CFG.msId)CFG.msId=ROMA_CONFIG.microsoftClientId;
if(!CFG.msTenant)CFG.msTenant=ROMA_CONFIG.microsoftTenant||'common';
let IM=DB.get('roma_imoveis',null)||DEF.map(x=>({...x}));
const MS=()=>DB.get('roma_msgs',[]),US=()=>DB.get('roma_users',[]);
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=t=>+String(t||'').replace(/\D/g,'')||0,dt=d=>d?new Date(d).toLocaleDateString('pt-BR'):'—',dtt=d=>new Date(d).toLocaleString('pt-BR');
const ORI={site:'Mensagem do site',whats:'WhatsApp',outro:'Indicação / outro'},STL={disp:'Disponível',vendido:'Vendido',alugado:'Alugado'},SM={nova:'Nova',atend:'Em atendimento',ok:'Concluída'};
const TIPOS=['Apartamento','Casa','Cobertura','Terreno','Comercial'],ARTS=[['apto','Edifício (dourado)'],['apto2','Edifício (azulado)'],['cob','Cobertura'],['casa2','Casa de 2 andares'],['casa1','Casa térrea'],['com','Torre comercial']];
const fv=(m,k)=>(m.campos.find(c=>c.k===k)||{}).v||'';
const waTo=(p,t)=>{let d=String(p||'').replace(/\D/g,'');if(d&&d.length<=11)d='55'+d;return 'https://wa.me/'+d+'?text='+encodeURIComponent(t)};
const sOf=i=>i.st||'disp',bd=(c,t)=>'<span class="bd '+c+'">'+t+'</span>';
const sBd=i=>bd(sOf(i)==='disp'?'ok':sOf(i)==='vendido'?'sold':'rent',STL[sOf(i)]);
let page='dash',ed=null,hl=null,flt={q:'',s:'',f:'',o:'',t:'',m:''};
const saveIM=()=>{if(!DB.set('roma_imoveis',IM)){toast('Armazenamento cheio. Use menos fotos ou fotos menores.');return false}return true};
const toast=t=>{const e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),2800)};
const blank=()=>({titulo:'',fin:'venda',tipo:'Casa',st:'disp',cidade:'',bairro:'',q:0,s:0,b:1,v:1,area:0,valor:0,art:'casa1',texto:'',fotos:[]});
const nextCod=()=>'RM-'+String(Math.max(0,...IM.map(i=>+i.cod.replace(/\D/g,'')||0))+1).padStart(3,'0');
const opt=(o,v)=>o.map(x=>'<option value="'+x[0]+'"'+(String(x[0])===String(v)?' selected':'')+'>'+x[1]+'</option>').join('');
const readImg=f=>new Promise(res=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,1100/im.width),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.72))};im.src=r.result};r.readAsDataURL(f)});

/* Base do painel: constantes, dados, formatação e funções de apoio. */
const $=id=>document.getElementById(id),F=n=>(+n||0).toLocaleString('pt-BR'),SITE='../index.html';
const savedConfig=DB.get('roma_cfg',{});
const CFG={usuario:'Acesso Supabase',whats:String(savedConfig.whats||ROMA_CONFIG.whatsapp)};
let IM=[];
let ANUNCIANTES=[];
let edOwner={nome:'',cpf:'',rg:'',telefone:'',email:''};
let edAdvertiserMessageId=null;
const MS=()=>DB.get('roma_msgs',[]),US=()=>DB.get('roma_users',[]);
const ADMIN_CLIENTS_KEY='roma_clientes_painel',ADMIN_CLIENTS=()=>{const clients=DB.get(ADMIN_CLIENTS_KEY,[]);return Array.isArray(clients)?clients:[]};
const currentUserKey=()=>{const u=me()||{};return String(u.email||u.nome||'').toLowerCase()};
const clientDirectory=()=>{
 const clients=new Map();
 US().forEach(user=>{const email=String(user.email||'').trim().toLowerCase();if(email)clients.set(email,{id:email,name:user.name||'',email,whats:user.whats||'',data:user.data||'',kind:'comprador',user})});
 ANUNCIANTES.forEach(advertiser=>{
  const email=String(advertiser.email||'').trim().toLowerCase(),key=email||'cod:'+advertiser.cod,existing=clients.get(key);
  if(existing){existing.kind='anunciante';existing.cpf=advertiser.cpf||'';existing.rg=advertiser.rg||'';existing.whats=advertiser.telefone||existing.whats;existing.name=advertiser.nome||existing.name;existing.codigos=[...new Set([...(existing.codigos||[]),advertiser.cod].filter(Boolean))];existing.data=advertiser.data||existing.data}
  else clients.set(key,{id:email||key,name:advertiser.nome||'',email,whats:advertiser.telefone||'',data:advertiser.data||'',kind:'anunciante',cpf:advertiser.cpf||'',rg:advertiser.rg||'',codigos:advertiser.cod?[advertiser.cod]:[]})
 });
 ADMIN_CLIENTS().forEach(client=>{
  const email=String(client.email||'').trim().toLowerCase();if(!email)return;
  const existing=clients.get(email);
  if(existing){existing.name=client.nome||existing.name;existing.cpf=client.cpf||existing.cpf||'';existing.rg=client.rg||existing.rg||'';existing.whats=client.telefone||existing.whats;existing.data=client.data||existing.data}
  else clients.set(email,{id:email,name:client.nome||'',email,whats:client.telefone||'',cpf:client.cpf||'',rg:client.rg||'',data:client.data||'',kind:'comprador'})
 });
 return [...clients.values()]
};
const visibleMessages=()=>{const messages=MS();if(isAdm())return messages;const actor=currentUserKey();return messages.filter(m=>!m.atendimento||String(m.atendimento.id||'').toLowerCase()===actor)};
const messageOwnerId=message=>String(message&&message.atendimento&&(message.atendimento.id||message.atendimento.email)||'').toLowerCase();
const messageHasDeal=message=>!!(message&&(message.negocio||IM.some(i=>i.fech&&String(i.fech.msgId)===String(message.id))));
const dealOwnerId=deal=>{if(!deal)return'';const message=MS().find(m=>String(m.id)===String(deal.msgId));return String(deal.porId||messageOwnerId(message)||deal.por||'').toLowerCase()};
const dealEditExpired=deal=>{const stamp=Date.parse(deal&&(deal.registradoEm||deal.data)||'');return !Number.isFinite(stamp)||Date.now()-stamp>=7*86400000};
const canEditDeal=deal=>{if(!deal||dealEditExpired(deal))return false;if(isAdm())return true;const owner=dealOwnerId(deal),name=String((me()||{}).nome||'').toLowerCase();return !!owner&&(owner===currentUserKey()||owner===name)};
const saleResponsibles=()=>{const u=me()||{},self={id:currentUserKey(),email:u.email||'',nome:u.nome||u.email||'Administrador',self:true},people=isAdm()?TEAM().filter(person=>person.papel==='colab').map(person=>({id:String(person.email||'').toLowerCase(),email:person.email||'',nome:person.nome||person.email||'Colaborador'})):[];const all=[...people,self].filter(person=>person.id);return all.filter((person,index)=>all.findIndex(item=>item.id===person.id)===index)};
const responsibleById=id=>saleResponsibles().find(person=>person.id===String(id||'').toLowerCase())||null;
const responsibleOptions=(selectedId,legacyName='')=>{const people=saleResponsibles(),selected=String(selectedId||'').toLowerCase(),hasSelected=people.some(person=>person.id===selected),legacy=selected&&!hasSelected?'<option value="'+esc(selected)+'" selected>'+esc(legacyName||selected)+'</option>':'';return legacy+people.map(person=>'<option value="'+esc(person.id)+'"'+(person.id===selected?' selected':'')+'>'+esc(person.nome)+(person.self?' (Você)':'')+'</option>').join('')};
const paymentOptions=(selected='')=>[['','Selecione'],['À vista','À vista'],['Financiamento','Financiamento'],['FGTS + financiamento','FGTS + financiamento'],['Consórcio','Consórcio'],['Permuta','Permuta'],['Outro','Outro']].map(([value,label])=>'<option value="'+value+'"'+(selected===value?' selected':'')+'>'+label+'</option>').join('');
const financingFields=(prefix,deal={})=>'<div class="full deal-financing" id="'+prefix+'_financing"'+(!/financiamento/i.test(deal.pagamento||'')?' hidden':'')+'><div class="g2"><label>Valor da entrada (R$)<input id="'+prefix+'_entry" data-mask="brl" inputmode="decimal" value="'+(deal.entrada?esc(formatBRLValue(deal.entrada)):'')+'"></label><label>Número de parcelas do financiamento *<input id="'+prefix+'_installments" type="number" min="1" step="1" value="'+esc(deal.parcelasQuantidade||'')+'"></label><label class="full">Valor de cada parcela (R$) *<input id="'+prefix+'_installmentValue" data-mask="brl" inputmode="decimal" value="'+(deal.parcelaValor?esc(formatBRLValue(deal.parcelaValor)):'')+'"></label></div></div>';
const financingValues=prefix=>{const enabled=/financiamento/i.test($(prefix+'_payment').value);return enabled?{entrada:parseBRLInput($(prefix+'_entry').value)||0,parcelasQuantidade:+$(prefix+'_installments').value||0,parcelaValor:parseBRLInput($(prefix+'_installmentValue').value)||0}:{entrada:0,parcelasQuantidade:0,parcelaValor:0}};
const toggleFinancingFields=prefix=>{const section=$(prefix+'_financing');if(section)section.hidden=!/financiamento/i.test($(prefix+'_payment').value)};
const dealClientForProperty=(cod,deal={})=>{const clients=ADMIN_CLIENTS();return clients.find(client=>Array.isArray(client.imoveis)&&client.imoveis.includes(cod))||clients.find(client=>deal.clienteEmail&&String(client.email||'').toLowerCase()===String(deal.clienteEmail).toLowerCase())||{nome:deal.cliente||'',telefone:deal.tel||'',cpf:deal.cpf||'',rg:deal.rg||'',email:deal.email||''}};
const updateAdminClient=(client,cod)=>{
 const previous=ADMIN_CLIENTS(),email=client.email.toLowerCase(),existing=previous.find(item=>String(item.email||'').toLowerCase()===email),imoveis=[...new Set([...(existing&&Array.isArray(existing.imoveis)?existing.imoveis:[]),cod])],next=previous.filter(item=>String(item.email||'').toLowerCase()!==email).map(item=>Object.assign({},item,{imoveis:Array.isArray(item.imoveis)?item.imoveis.filter(propertyCode=>propertyCode!==cod):[]})).concat(Object.assign({},client,{imoveis,data:existing&&existing.data||new Date().toISOString()}));
 if(!DB.set(ADMIN_CLIENTS_KEY,next)){toast('Não foi possível salvar os dados pessoais do cliente no painel.');return false}
 return true
};
const pendingMessageDeletions=()=>DB.get('roma_msg_notificacoes',[]).filter(n=>n.status==='pendente');
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=t=>+String(t||'').replace(/\D/g,'')||0,dt=d=>d?new Date(d).toLocaleDateString('pt-BR'):'—',dtt=d=>new Date(d).toLocaleString('pt-BR');
const ORI={site:'Mensagem do site',whats:'WhatsApp',outro:'Indicação / outro'},STL={disp:'Disponível',vendido:'Vendido',alugado:'Alugado'},SM={nova:'Nova',atend:'Em atendimento',ok:'Concluída'};
const TIPOS=['Apartamento','Casa','Cobertura','Terreno','Comercial'],ARTS=[['apto','Edifício (dourado)'],['apto2','Edifício (azulado)'],['cob','Cobertura'],['casa2','Casa de 2 andares'],['casa1','Casa térrea'],['com','Torre comercial']];
const fv=(m,k)=>(m.campos.find(c=>c.k===k)||{}).v||'';
const waTo=(p,t)=>{let d=String(p||'').replace(/\D/g,'');if(d&&d.length<=11)d='55'+d;return 'https://wa.me/'+d+'?text='+encodeURIComponent(t)};
const sOf=i=>i.st||'disp',bd=(c,t)=>'<span class="bd '+c+'">'+t+'</span>';
const sBd=i=>bd(sOf(i)==='disp'?'ok':sOf(i)==='vendido'?'sold':'rent',STL[sOf(i)]);
let page='dash',ed=null,hl=null,flt={q:'',s:'',f:'',o:'',t:'',m:'',mine:''},imageProcessing=false,imageProgress={visible:false,percent:0,label:''},designSlides=[],designSlidesLoaded=false,designSlidesLoading=false,designSlidesError=false,designSlidesProcessing=false,designSlidesProgress={percent:0,label:''};
const saveIM=async()=>{
 try{
  for(const property of IM){
   if(property._dbId&&adminPropertyBaseline.get(property._dbId)===adminPropertySnapshot(property))continue;
   await persistAdminPropertyState(property);
   if(property._dbId)adminPropertyBaseline.set(property._dbId,adminPropertySnapshot(property));
  }
  return true
 }catch(error){console.error('Falha ao salvar estado dos imóveis no Supabase.',error);toast('Não foi possível salvar no Supabase: '+supabaseMessage(error));return false}
};
const advertiserFor=cod=>ANUNCIANTES.find(x=>x.cod===cod)||{nome:'',cpf:'',rg:'',telefone:'',email:''};
const savePropertyAndAdvertiser=async(property)=>{
 const saved=await saveAdminProperty(property,edOwner);
 const index=IM.findIndex(item=>item===property||item.cod===property.cod);
 if(index<0)IM.unshift(saved);else IM[index]=saved;
 ed=Object.assign({},saved);
 ANUNCIANTES=ANUNCIANTES.filter(item=>item.cod!==saved.cod).concat(Object.assign({data:new Date().toISOString()},edOwner,{cod:saved.cod}));
 return true;
};
const deleteClientByEmail=email=>{
 const key=String(email||'').toLowerCase(),next=ADMIN_CLIENTS().filter(client=>String(client.email||'').toLowerCase()!==key);
 if(!DB.set(ADMIN_CLIENTS_KEY,next)){toast('Não foi possível excluir o cliente.');return false}
 ANUNCIANTES=ANUNCIANTES.filter(advertiser=>String(advertiser.email||'').toLowerCase()!==key);
 return true
};
const deletePropertyAndAdvertiser=async cod=>{
 const property=IM.find(item=>item.cod===cod);
 await deleteAdminProperty(property);
 IM=IM.filter(item=>item.cod!==cod);
 ANUNCIANTES=ANUNCIANTES.filter(item=>item.cod!==cod);
 return true;
};
const toast=t=>{const e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),2800)};
const updateImageProgress=(active,percent,label)=>{imageProcessing=active;imageProgress={visible:active||!!label,percent:Math.max(0,Math.min(100,percent||0)),label:label||''};const bar=$('imageProgressBar'),text=$('imageProgressText'),box=$('imageProgress');if(bar)bar.value=imageProgress.percent;if(text)text.textContent=imageProgress.label;if(box)box.hidden=!imageProgress.visible;const save=document.querySelector('[data-a="save"]'),input=$('e_fotos'),cancel=document.querySelector('[data-a="cancel"]');if(save)save.disabled=active;if(input)input.disabled=active;if(cancel)cancel.disabled=active;document.querySelectorAll('.ph button').forEach(button=>button.disabled=active)};
const blank=()=>({titulo:'',fin:'venda',tipo:'Casa',st:'disp',cep:'',logradouro:'',numero:'',complemento:'',uf:'',cidade:'',bairro:'',q:0,s:0,b:1,v:1,area:0,valor:0,art:'casa1',texto:'',fotos:[]});
const nextCod=()=>{
 const year=new Date().getFullYear(),prefix='RM'+year,lastSequence=IM.reduce((max,property)=>{const match=String(property.cod||'').match(/^RM-?(\d{4})-?(\d+)$/);return match&&Number(match[1])===year?Math.max(max,Number(match[2])):max},0);
 return prefix+String(lastSequence+1).padStart(3,'0')
};
const opt=(o,v)=>o.map(x=>'<option value="'+x[0]+'"'+(String(x[0])===String(v)?' selected':'')+'>'+x[1]+'</option>').join('');
const MAX_PROPERTY_IMAGE_BYTES=1500000;
const readFileDataUrl=(file,onProgress=()=>{})=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onprogress=e=>{if(e.lengthComputable)onProgress(e.loaded/e.total)};reader.onload=()=>{onProgress(1);resolve(String(reader.result))};reader.onerror=()=>reject(new Error('não foi possível ler o arquivo'));reader.readAsDataURL(file)});
const loadImageFile=(file,onLoad=()=>{})=>new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),image=new Image();image.onload=()=>{URL.revokeObjectURL(url);onLoad();resolve(image)};image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('o arquivo não é uma imagem válida'))};image.src=url});
const canvasBlob=(canvas,type,quality)=>new Promise((resolve,reject)=>{canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('não foi possível compactar a imagem')),type,quality)});
const readImg=async(file,onProgress=()=>{},maxBytes=MAX_PROPERTY_IMAGE_BYTES)=>{
 if(!file.type.startsWith('image/'))throw new Error('selecione um arquivo de imagem');
 if(file.size<=maxBytes){const data=await readFileDataUrl(file,onProgress);return{data,compressed:false,size:file.size}}
 onProgress(.02);
 const image=await loadImageFile(file,()=>onProgress(.08)),canvas=document.createElement('canvas'),context=canvas.getContext('2d');
 if(!context)throw new Error('o navegador não conseguiu preparar a imagem');
 let width=image.naturalWidth,height=image.naturalHeight;
 const qualities=[.96,.93,.90,.87,.84,.81,.78];
 const largestDimension=Math.max(width,height),estimatedPasses=Math.max(1,Math.ceil(Math.log(320/largestDimension)/Math.log(.75))),estimatedAttempts=qualities.length*estimatedPasses;
 let attempts=0;
 onProgress(.1);
 while(true){
  canvas.width=width;canvas.height=height;context.clearRect(0,0,width,height);context.drawImage(image,0,0,width,height);
  let lastBlob;
  for(const quality of qualities){
   let blob=await canvasBlob(canvas,'image/webp',quality);
   if(blob.type!=='image/webp'){context.save();context.globalCompositeOperation='destination-over';context.fillStyle='#fff';context.fillRect(0,0,width,height);context.restore();blob=await canvasBlob(canvas,'image/jpeg',quality)}
   lastBlob=blob;
   attempts++;onProgress(Math.min(.9,.1+.8*attempts/estimatedAttempts));
   if(blob.size<=maxBytes){const data=await readFileDataUrl(blob,value=>onProgress(.9+.1*value));onProgress(1);return{data,compressed:true,size:blob.size}}
  }
  if(Math.max(width,height)<=320)break;
  const scale=Math.max(.75,Math.min(.9,Math.sqrt(maxBytes/lastBlob.size)*.95));
  const nextLargest=Math.max(320,Math.floor(largestDimension*scale)),dimensionScale=nextLargest/largestDimension;
  const nextWidth=Math.max(1,Math.floor(width*dimensionScale)),nextHeight=Math.max(1,Math.floor(height*dimensionScale));
  if(nextWidth===width&&nextHeight===height)break;
  width=nextWidth;height=nextHeight;
 }
 throw new Error('não foi possível compactar a imagem para menos de '+(maxBytes/1024/1024).toFixed(1)+' MB sem reduzir demais a imagem');
};

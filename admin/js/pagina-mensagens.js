/* Notificações recebidas, clientes atribuídos e aprovações de exclusão. */
const messageDeletions=()=>DB.get('roma_msg_notificacoes',[]);
const MSG_ICONS={
 whatsapp:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.7a8 8 0 0 1-11.8 7L4 20l1.3-4A8 8 0 1 1 20 11.7Z"/><path d="M9 8.5c.4 2.1 2.4 4.1 4.5 4.5l1.1-1 2 .9c-.2 1.7-1.3 2.6-3 2.3-3.7-.6-6.3-3.2-6.9-6.9-.3-1.7.6-2.8 2.3-3l.9 2Z"/></svg>',
 home:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5h6V7H9zM9 12h6m-6 4h6"/></svg>',
 trash:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg>',
 sell:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 11 3h9v9l-8 9z"/><circle cx="16" cy="8" r="1.5"/><path d="M8 14h7m-3-3-3 3 3 3"/></svg>',
 withdraw:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/></svg>'
};
const msgIconButton=(action,id,label,icon,primary)=>'<button type="button" class="btn sm msg-icon msg-icon-'+icon+(primary?' primary':'')+'" data-a="'+action+'" data-id="'+esc(id)+'" aria-label="'+label+'" title="'+label+'">'+MSG_ICONS[icon]+'</button>';
const messageFields=message=>'<dl class="kv">'+(message.campos||[]).filter(c=>c.k!=='Nome completo').map(c=>'<div><dt>'+esc(c.k)+'</dt><dd>'+esc(c.v)+'</dd></div>').join('')+'</dl>';
const saleDocumentTypes={pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
const messageHasCreatedListing=message=>!!(message&&message.anuncioCriado);
const saleDocumentExtension=file=>String(file&&file.name||'').split('.').pop().toLowerCase();
const saleDocumentInfo=contract=>{if(!contract)return null;const extension=String(contract.formato||saleDocumentExtension(contract)).toLowerCase();return saleDocumentTypes[extension]?{extension,mime:saleDocumentTypes[extension]}:null};
const dealDocuments=deal=>deal?(Array.isArray(deal.contratos)?deal.contratos.filter(Boolean):deal.contrato?[deal.contrato]:[]):[];
const saleDocumentLink=contract=>{const info=saleDocumentInfo(contract);if(!info||!String(contract.dados||'').startsWith('data:'+info.mime+';base64,'))return'';const label=info.extension==='pdf'?'PDF':'DOC';return '<a class="deal-document deal-document-'+label.toLowerCase()+'" href="'+esc(contract.dados)+'" download="'+esc(contract.nome||'documento.'+info.extension)+'" aria-label="Baixar documento '+label+'" title="Baixar '+esc(contract.nome||'documento')+'"><svg viewBox="0 0 48 56" aria-hidden="true"><path d="M8 2h21l11 11v39H8z"/><path d="M29 2v12h11"/><rect x="4" y="30" width="40" height="17" rx="3"/><text x="24" y="42" text-anchor="middle">'+label+'</text></svg></a>'};
const saleDocumentLinks=deal=>{const links=dealDocuments(deal).map(saleDocumentLink).filter(Boolean);return links.length?'<span class="deal-documents">'+links.join('')+'</span>':''};
const saleSummary=message=>{
 const deal=message.negocio;if(!deal)return'';
 const property=IM.find(item=>String(item.cod)===String(deal.cod))||IM.find(item=>item.fech&&String(item.fech.msgId)===String(message.id)),record=property&&property.fech||{},email=String(deal.clienteEmail||record.clienteEmail||fv(message,'E-mail')||fv(message,'Email')).trim().toLowerCase(),registered=ADMIN_CLIENTS().find(item=>String(item.email||'').toLowerCase()===email),client=registered||property&&dealClientForProperty(property.cod,record)||{},name=client.nome||client.name||record.cliente||deal.cliente||fv(message,'Nome completo'),phone=client.telefone||client.whats||record.tel||fv(message,'WhatsApp'),cpf=client.cpf||record.cpf||fv(message,'CPF'),rg=client.rg||record.rg||fv(message,'RG'),clientEmail=client.email||record.email||email,payment=deal.pagamento||record.pagamento,amount=deal.valor||record.valor,entry=deal.entrada||record.entrada,installments=deal.parcelasQuantidade||record.parcelasQuantidade,installmentValue=deal.parcelaValor||record.parcelaValor;
 return '<section class="deal-summary"><h4>Dados da venda e do comprador</h4><dl class="kv"><div><dt>Imóvel</dt><dd>'+esc(property?property.cod+' · '+property.titulo:deal.cod||'—')+'</dd></div><div><dt>Data</dt><dd>'+dt(record.data||deal.em)+'</dd></div><div><dt>Valor da venda</dt><dd>R$ '+formatBRLValue(amount||0)+'</dd></div><div><dt>Forma de pagamento</dt><dd>'+esc(payment||'—')+'</dd></div>'+(name?'<div><dt>Comprador</dt><dd>'+esc(name)+'</dd></div>':'')+(phone?'<div><dt>Telefone</dt><dd>'+esc(phone)+'</dd></div>':'')+(cpf?'<div><dt>CPF</dt><dd>'+esc(cpf)+'</dd></div>':'')+(rg?'<div><dt>RG</dt><dd>'+esc(rg)+'</dd></div>':'')+(clientEmail?'<div><dt>E-mail</dt><dd>'+esc(clientEmail)+'</dd></div>':'')+(entry?'<div><dt>Entrada</dt><dd>R$ '+formatBRLValue(entry)+'</dd></div>':'')+(installments?'<div><dt>Parcelas</dt><dd>'+esc(installments)+'x de R$ '+formatBRLValue(installmentValue||0)+'</dd></div>':'')+(deal.contrato||record.contrato?'<div><dt>Contrato</dt><dd>'+esc((deal.contrato||record.contrato).nome||'Documento anexado')+'</dd></div>':'')+'</dl></section>'
};
const messageDeleteApproval=()=>{const pending=isAdm()?messageDeletions().filter(n=>n.status==='pendente'):[];return pending.length?'<section class="card"><h3>Solicitações de exclusão ('+pending.length+')</h3>'+pending.map(n=>{const message=MS().find(m=>String(m.id)===n.messageId),blocked=message&&messageHasDeal(message);return '<div class="row"><div><b>'+esc(n.nome||n.email||'Colaborador')+' solicitou excluir a mensagem de '+esc(n.cliente||'Sem nome')+'</b><small>'+dtt(n.em)+' · '+(blocked?'Mensagem vinculada a uma venda; exclusão bloqueada.':'Motivo: '+esc(n.motivo))+'</small></div><div class="act">'+(blocked?'<span class="mut">Ação indisponível</span>':'<button class="btn sm primary" data-a="approve-msg-delete" data-id="'+esc(n.id)+'">Aprovar exclusão</button><button class="btn sm" data-a="reject-msg-delete" data-id="'+esc(n.id)+'">Recusar</button>')+'</div></div>'}).join('')+'</section>':''};
function pgNotif(){
 const messages=MS().filter(m=>!m.atendimento),pending=messageDeletions().some(n=>n.status==='pendente');
 const compact=messages.map(m=>'<article class="card msg msg-notification'+(hl&&String(hl)===String(m.id)?' hl':'')+'"><div class="notification-summary"><details><summary><b>'+esc(fv(m,'Nome completo')||'Sem nome')+'</b><span>'+ (m.tipo==='comprar'?'Compra':'Venda / aluguel')+' · '+dtt(m.data)+'</span></summary><div class="notification-details">'+messageFields(m)+'</div></details><button type="button" class="btn sm primary" data-a="assume-msg" data-id="'+esc(m.id)+'">Assumir</button></div></article>').join('');
 return messageDeleteApproval()+'<div class="bar"><span class="mut">'+messages.length+' notificação(ões) aguardando atendimento</span></div>'+(compact||'<div class="card empty">Não há notificações aguardando atendimento.</div>')
}
function pgMine(){
 const assigned=MS().filter(m=>m.atendimento&&(isAdm()||messageOwnerId(m)===currentUserKey())),filter=flt.mine;
 const messages=filter==='atend'?assigned.filter(m=>m.status==='atend'):filter==='ok'?assigned.filter(m=>m.status==='ok'&&(messageHasDeal(m)||messageHasCreatedListing(m))):filter==='semneg'?assigned.filter(m=>m.status==='ok'&&!messageHasDeal(m)&&!messageHasCreatedListing(m)):assigned;
 return '<div class="bar"><select id="fMine" aria-label="Filtrar meus clientes"><option value="">Todos os meus clientes</option><option value="atend"'+(filter==='atend'?' selected':'')+'>Em atendimento</option><option value="ok"'+(filter==='ok'?' selected':'')+'>Concluídos</option><option value="semneg"'+(filter==='semneg'?' selected':'')+'>Sem negociação</option></select><span class="mut">'+messages.length+' cliente(s)'+(isAdm()?' · visão de toda a equipe':' na sua fila')+'</span></div>'+(messages.length?messages.map(m=>{
  const name=fv(m,'Nome completo'),owner=m.atendimento,deletePending=messageDeletions().some(x=>x.messageId===String(m.id)&&x.status==='pendente'),buyer=m.tipo==='comprar',allowed=isAdm()||messageOwnerId(m)===currentUserKey();
  const actions=buyer
   ?(m.negocio?'<span class="bd sold">Venda vinculada: '+esc(m.negocio.cod)+'</span>':m.desistencia?'<span class="bd">Sem negociação</span>':msgIconButton('msg-sale',m.id,'Registrar venda','sell',true)+msgIconButton('msg-withdraw',m.id,'Registrar desistência','withdraw',false))
   :m.tipo==='vender'
    ?(messageHasCreatedListing(m)?'':m.desistencia?'<span class="bd">Sem negociação</span>':msgIconButton('reg',m.id,'Cadastrar imóvel','home',false)+msgIconButton('msg-withdraw',m.id,'Registrar desistência do anúncio','withdraw',false))
    :'';
  const deletion=messageHasDeal(m)?'':allowed?(deletePending?'<span class="mut">Aguardando aprovação da exclusão</span>':msgIconButton(isAdm()?'delm':'request-msg-delete',m.id,isAdm()?'Excluir mensagem':'Solicitar exclusão','trash',false)):'';
  const property=m.negocio&&(IM.find(item=>String(item.cod)===String(m.negocio.cod))||IM.find(item=>item.fech&&String(item.fech.msgId)===String(m.id))),record=property&&property.fech,deal=m.negocio&&Object.assign({},record||{},m.negocio),documentLink=saleDocumentLinks(deal);
  return '<article class="card msg client-msg'+(hl&&String(hl)===String(m.id)?' hl':'')+'"><details class="client-disclosure"><summary><b>'+esc(name||'Sem nome')+'</b>'+bd('site',buyer?'Compra':'Venda / aluguel')+bd(m.status==='ok'?'ok':'nova',SM[m.status]||m.status||'Em atendimento')+(messageHasCreatedListing(m)?bd('ok','Anúncio criado · '+esc(m.anuncioCriado.cod||'')):'')+'<time>'+dtt(m.data)+'</time></summary><div class="client-details"><div class="hd">'+bd('site','Responsável: '+esc(owner.nome||owner.email||'Colaborador'))+(deletePending?bd('sold','Exclusão pendente'):'')+'</div>'+messageFields(m)+saleSummary(m)+(m.desistencia?'<p class="mut">Desistência registrada por '+esc(m.desistencia.por)+' · '+esc(m.desistencia.motivo||'Sem observação')+'</p>':'')+(m.negocio?'<p class="mut">Negociação: '+esc(m.negocio.cod)+' · '+esc(m.negocio.pagamento||'')+'</p>':'')+'<div class="acts msg-actions">'+msgIconButton('whatsapp-link',m.id,'Responder no WhatsApp','whatsapp',false)+actions+deletion+'</div>'+documentLink+'</div></details></article>'
 }).join(''):'<div class="card empty">Não há clientes nesta categoria da sua fila.</div>')
}
function openMessageDeleteRequest(id){
 const message=MS().find(m=>String(m.id)===String(id));if(!message)return toast('Mensagem não encontrada.');
 const o=document.createElement('div');o.className='ov';o.id='msgDeleteDialog';
 o.innerHTML='<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="msgDeleteTitle"><h3 id="msgDeleteTitle">Solicitar exclusão</h3><p class="sub">O administrador precisará aprovar a exclusão desta mensagem.</p><label>Motivo da exclusão *<textarea id="msgDeleteReason" rows="4" required></textarea></label><div class="acts"><button class="btn primary" data-a="submit-msg-delete" data-id="'+esc(id)+'">Enviar solicitação</button><button class="btn" data-a="close-msg-dialog">Cancelar</button></div></div>';
 document.body.appendChild(o)
}
function openMessageWithdraw(id){
 const message=MS().find(m=>String(m.id)===String(id));if(!message)return toast('Mensagem não encontrada.');
 const seller=message.tipo==='vender',o=document.createElement('div');o.className='ov';o.id='msgWithdrawDialog';
 o.innerHTML='<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="msgWithdrawTitle"><h3 id="msgWithdrawTitle">'+(seller?'Encerrar anúncio sem negociação':'Registrar desistência')+'</h3><p class="sub">A mensagem será marcada como sem negociação e ficará disponível nesse filtro de Meus clientes.</p><label>Motivo ou observação (opcional)<textarea id="msgWithdrawReason" rows="4"></textarea></label><div class="acts"><button class="btn primary" data-a="submit-msg-withdraw" data-id="'+esc(id)+'">Confirmar sem negociação</button><button class="btn" data-a="close-msg-dialog">Cancelar</button></div></div>';
 document.body.appendChild(o)
}
function openMessageSale(id){
 const message=MS().find(m=>String(m.id)===String(id));if(!message)return toast('Mensagem não encontrada.');
 const properties=IM.filter(i=>!i.arquivado&&sOf(i)==='disp');
 if(!properties.length)return toast('Não há imóveis disponíveis para vincular a esta venda.');
 const email=(fv(message,'E-mail')||fv(message,'Email')).trim().toLowerCase(),existing=clientDirectory().find(client=>client.email===email),client=existing||{name:fv(message,'Nome completo'),whats:fv(message,'WhatsApp'),cpf:'',rg:'',email},user=me()||{},responsibleField=isAdm()?'<label class="full">Responsável pela venda *<select id="msgSaleResponsible">'+responsibleOptions(currentUserKey())+'</select></label>':'<label class="full">Responsável pela venda<input value="'+esc(user.nome||user.email||'Colaborador')+'" readonly><input type="hidden" id="msgSaleResponsible" value="'+esc(currentUserKey())+'"></label>';
 const o=document.createElement('div');o.className='ov';o.id='msgSaleDialog';
 o.innerHTML='<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="msgSaleTitle"><h3 id="msgSaleTitle">Registrar venda</h3><p class="sub">Informe os dados do comprador e selecione o imóvel vendido para vinculá-lo à mensagem de '+esc(fv(message,'Nome completo')||'cliente')+'.</p><div class="g2"><label class="full">Cliente cadastrado<select id="msgSale_clientSelect">'+dealClientOptions(existing?existing.email:'')+'</select></label><label>Nome completo *<input id="msgSale_clientName" autocomplete="name" value="'+esc(client.name||'')+'" required></label><label>Telefone / WhatsApp *<input id="msgSale_tel" data-mask="phone" inputmode="tel" autocomplete="tel" placeholder="(31) 9 9999-9999" value="'+esc(maskPhone(client.whats||''))+'" required></label><label>CPF *<input id="msgSale_cpf" data-mask="cpf" inputmode="numeric" value="'+esc(maskCPF(client.cpf||''))+'" required></label><label>RG *<input id="msgSale_rg" autocomplete="off" value="'+esc(client.rg||'')+'" required></label><label class="full">E-mail *<input id="msgSale_email" type="email" autocomplete="email" value="'+esc(client.email||'')+'" required></label><label>Imóvel negociado *<select id="msgSaleProperty">'+properties.map(i=>'<option value="'+esc(i.cod)+'">'+esc(i.cod+' · '+i.titulo)+'</option>').join('')+'</select></label>'+responsibleField+'<label>Valor negociado (R$) *<input id="msgSaleValue" data-mask="brl" inputmode="decimal" required></label><label class="full">Forma de pagamento *<select id="msgSale_payment">'+paymentOptions()+'</select></label>'+financingFields('msgSale')+'<label class="full">Contrato (PDF ou Word)<input type="file" id="msgSaleContract" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"></label><p class="mut full">Envie somente arquivos PDF ou Word (DOC/DOCX), de até 1 MB. O documento será armazenado junto aos dados do negócio neste navegador.</p></div><div class="acts"><button class="btn primary" data-a="submit-msg-sale" data-id="'+esc(id)+'">Confirmar venda</button><button class="btn" data-a="close-msg-dialog">Cancelar</button></div></div>';
 document.body.appendChild(o);applyInputMasks(o);toggleFinancingFields('msgSale')
}
function fillMessageSaleClient(email){
 const client=clientDirectory().find(person=>person.email===String(email||'').toLowerCase());
 $('msgSale_clientName').value=client?client.name||'':'';
 $('msgSale_tel').value=client?maskPhone(client.whats||''):'';
 $('msgSale_cpf').value=client?maskCPF(client.cpf||''):'';
 $('msgSale_rg').value=client?client.rg||'':'';
 $('msgSale_email').value=client?client.email||'':'';
 applyInputMasks($('msgSaleDialog'))
}
const readContractFile=file=>new Promise((resolve,reject)=>{const extension=saleDocumentExtension(file),mime=saleDocumentTypes[extension];if(!mime)return reject(new Error('Anexe um arquivo PDF ou Word (DOC/DOCX).'));const reader=new FileReader();reader.onload=()=>{const data=String(reader.result),encoded=data.slice(data.indexOf(',')+1);resolve({nome:file.name,tipo:mime,formato:extension,dados:'data:'+mime+';base64,'+encoded})};reader.onerror=()=>reject(new Error('Não foi possível ler o contrato "'+file.name+'".'));reader.readAsDataURL(file)});
async function completeMessageSale(id){
 const all=MS(),message=all.find(m=>String(m.id)===String(id)),dialog=$('msgSaleDialog'),property=IM.find(i=>i.cod===$('msgSaleProperty').value),value=parseBRLInput($('msgSaleValue').value),payment=$('msgSale_payment').value,file=$('msgSaleContract').files[0];
 if(!message||!dialog)return toast('Mensagem não encontrada.');
 if(!isAdm()&&messageOwnerId(message)!==currentUserKey())return toast('Esta mensagem não está na sua fila.');
 if(!property||property.arquivado||sOf(property)!=='disp')return toast('Selecione um imóvel disponível.');
 const client={nome:$('msgSale_clientName').value.trim(),telefone:$('msgSale_tel').value.trim(),cpf:$('msgSale_cpf').value.replace(/\D/g,''),rg:$('msgSale_rg').value.trim(),email:$('msgSale_email').value.trim().toLowerCase()};
 if(!client.nome||!client.telefone||!client.cpf||!client.rg||!client.email)return toast('Preencha todos os dados pessoais obrigatórios do cliente.');
 if(!validCPF(client.cpf))return toast('Informe um CPF válido para o cliente.');
 if(![10,11].includes(client.telefone.replace(/\D/g,'').length))return toast('Informe um telefone válido com DDD para o cliente.');
 if(!$('msgSale_email').checkValidity())return toast('Informe um e-mail válido para o cliente.');
 if(!value||!payment)return toast('Informe o valor negociado e a forma de pagamento.');
 const financing=financingValues('msgSale');
 if(/financiamento/i.test(payment)&&(!Number.isInteger(financing.parcelasQuantidade)||financing.parcelasQuantidade<1||!financing.parcelaValor))return toast('Informe a quantidade e o valor das parcelas do financiamento.');
 if(file&&file.size>1024*1024)return toast('Anexe um arquivo de até 1 MB.');
 if(file&&!saleDocumentTypes[saleDocumentExtension(file)])return toast('Anexe somente arquivos PDF ou Word (DOC/DOCX).');
 let contract=null;
 if(file){try{contract=await readContractFile(file)}catch(error){return toast(error.message)}}
 const responsible=responsibleById($('msgSaleResponsible').value);if(!responsible)return toast('Selecione um responsável válido para a venda.');
 const now=new Date(),date=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10),previous=JSON.parse(JSON.stringify(property)),propertyIndex=IM.indexOf(property),oldClients=ADMIN_CLIENTS();
 if(!updateAdminClient(client,property.cod))return;
 property.st='vendido';property.arquivado=null;property.fech={cliente:client.nome,clienteEmail:client.email,tel:client.telefone,cpf:client.cpf,rg:client.rg,email:client.email,origem:'site',msgId:String(message.id),data:date,registradoEm:now.toISOString(),valor:value,pagamento:payment,entrada:financing.entrada,parcelasQuantidade:financing.parcelasQuantidade,parcelaValor:financing.parcelaValor,contrato:contract,obs:'Venda registrada a partir da mensagem de compra.',por:responsible.nome,porId:responsible.id};
 if(!saveIM()){IM[propertyIndex]=previous;if(!DB.set(ADMIN_CLIENTS_KEY,oldClients))console.error('Não foi possível reverter os dados do cliente após falha ao salvar o imóvel.');return}
 message.status='ok';message.negocio={cod:property.cod,tipo:'venda',valor:value,pagamento:payment,entrada:financing.entrada,parcelasQuantidade:financing.parcelasQuantidade,parcelaValor:financing.parcelaValor,em:now.toISOString()};
 message.negocio.cliente=client.nome;message.negocio.clienteEmail=client.email;
 if(!DB.set('roma_msgs',all)){IM[propertyIndex]=previous;saveIM();if(!DB.set(ADMIN_CLIENTS_KEY,oldClients))console.error('Não foi possível reverter os dados do cliente após falha ao vincular a mensagem à venda.');return toast('Não foi possível vincular a mensagem à venda. A gravação do imóvel foi revertida.')}
 dialog.remove();page='mine';flt.mine='ok';toast('Venda vinculada ao imóvel '+property.cod+'.');render()
}

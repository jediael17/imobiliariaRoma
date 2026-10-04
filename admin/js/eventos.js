/* Campos, filtros, teclado e atualização entre abas. */
document.addEventListener('input',e=>{const t=e.target;if(t.id==='q'){flt.q=t.value;drawImv()}});
document.addEventListener('change',async e=>{const t=e.target;
 if(t.dataset.trole){if(!isAdm())return;const all=TEAM(),x=all.find(u=>u.email.toLowerCase()===t.dataset.trole.toLowerCase());if(x){x.papel=t.value;if(!DB.set('roma_team',all))return toast('Não foi possível atualizar o papel.');toast('Papel atualizado.');render()}}else if(t.id==='fS'){flt.s=t.value;drawImv()}else if(t.id==='fF'){flt.f=t.value;drawImv()}
 else if(t.id==='fO'){flt.o=t.value;drawNeg()}else if(t.id==='fT'){flt.t=t.value;drawNeg()}
 else if(t.id==='fM'){flt.m=t.value;render()}
 else if(t.id==='fMine'){flt.mine=t.value;render()}
 else if(t.id==='d_clientSelect'){if(t.value)fillDealClient(t.value);else{$('d_clientName').value='';$('d_tel').value='';$('d_cpf').value='';$('d_rg').value='';$('d_email').value=''}}
 else if(t.id==='msgSale_clientSelect')fillMessageSaleClient(t.value)
 else if(t.id==='d_payment')toggleFinancingFields('d')
 else if(t.id==='msgSale_payment')toggleFinancingFields('msgSale')
 else if(t.id==='designSlidesInput'){if(!isAdm())return toast('Sem permissão para alterar o carrossel.');const files=[...t.files];t.value='';await addDesignSlides(files)}
 else if(t.id==='d_ori')togMw();
 else if(t.id==='d_msg'){const m=MS().find(x=>String(x.id)===t.value);if(m){const name=$('d_clientName')||$('d_cli');if(name&&!name.value)name.value=fv(m,'Nome completo');if(!$('d_tel').value){$('d_tel').value=fv(m,'WhatsApp');applyInputMasks($('ov'))}const email=$('d_email');if(email&&!email.value)email.value=fv(m,'E-mail')||fv(m,'Email')}}
 else if(t.dataset.st){const all=MS(),m=all.find(x=>x.id===t.dataset.st||String(x.id)===String(t.dataset.st));if(m){m.status=t.value;if(!DB.set('roma_msgs',all))return toast('Não foi possível atualizar o status da mensagem.');render()}}
 else if(t.id==='e_fotos'){
  if(imageProcessing)return toast('Aguarde o processamento das imagens atuais.');
  collect();const target=ed,remaining=Math.max(0,14-target.fotos.length);if(t.files.length>remaining)toast('Você pode adicionar até 14 fotos por imóvel.');
  const files=[...t.files].slice(0,remaining),totalBytes=files.reduce((sum,file)=>sum+file.size,0);if(!files.length)return;
  let completedBytes=0,compressed=0,processed=0,errorMessage='';
  const report=(index,file,localProgress)=>{const overall=totalBytes?Math.round((completedBytes+file.size*localProgress)/totalBytes*100):100;const task=file.size>MAX_PROPERTY_IMAGE_BYTES?'Compactando':'Carregando';updateImageProgress(true,overall,task+' imagem '+(index+1)+' de '+files.length+' — '+overall+'%')};
  updateImageProgress(true,0,'Preparando '+files.length+' imagem(ns)…');
  for(let index=0;index<files.length;index++){
   const file=files[index];report(index,file,0);
   try{const image=await readImg(file,value=>report(index,file,value));if(ed!==target)break;target.fotos.push(image.data);if(image.compressed)compressed++;processed++;completedBytes+=file.size}
   catch(error){console.error('Falha ao processar a imagem "'+file.name+'":',error);errorMessage='Processamento interrompido — '+file.name+': '+error.message;break}
  }
  const complete=processed===files.length;updateImageProgress(false,complete?100:totalBytes?Math.round(completedBytes/totalBytes*100):0,errorMessage||'Processamento concluído — 100%');render();
  if(errorMessage)toast(errorMessage);else if(compressed)toast(compressed+' imagem(ns) compactada(s) automaticamente para até 1,5 MB com alta qualidade visual.')
 }
 else if(t.id==='c_imp'&&isAdm()&&t.files[0]){const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.imoveis)||d.anunciantes!==undefined&&!Array.isArray(d.anunciantes)||d.clientesPainel!==undefined&&!Array.isArray(d.clientesPainel))throw new Error('Arquivo de backup inválido.');const next={roma_imoveis:d.imoveis,roma_anunciantes:d.anunciantes||[],roma_msgs:d.mensagens||[],roma_users:d.clientes||[],[ADMIN_CLIENTS_KEY]:d.clientesPainel||[]},previous=Object.keys(next).map(key=>[key,localStorage.getItem(key)]);try{for(const [key,value] of Object.entries(next))if(!DB.set(key,value))throw new Error('Não foi possível restaurar todos os dados do backup.');}catch(error){for(const [key,value] of previous){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}catch(rollbackError){console.error('Falha ao reverter a importação do backup:',rollbackError)}}throw error}IM=next.roma_imoveis;ANUNCIANTES=next.roma_anunciantes;render();toast('Backup importado.')}catch(error){console.error('Falha ao importar backup:',error);toast(error.message||'Arquivo de backup inválido.')}};r.readAsText(t.files[0])}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDeal();document.querySelectorAll('#msgDeleteDialog,#msgSaleDialog,#msgWithdrawDialog').forEach(o=>o.remove())}});
addEventListener('storage',e=>{if(e.key==='roma_team'&&SS())return render();if(e.key==='roma_imoveis'){IM=DB.get('roma_imoveis',IM);if(archiveExpiredProperties(IM)&&!saveIM())return}if(e.key==='roma_anunciantes')ANUNCIANTES=DB.get('roma_anunciantes',ANUNCIANTES);if(authed()&&!ed&&!$('ov')&&['dash','imv','neg','notif','mine','cli'].includes(page))render()});

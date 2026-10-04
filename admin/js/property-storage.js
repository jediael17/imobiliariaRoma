document.addEventListener('click', async event => {
 const button=event.target.closest('[data-a]');
 if(!button)return;
 const action=button.dataset.a,id=button.dataset.id;
 if(!['save','archive','unarchive','deli'].includes(action))return;
 event.preventDefault();
 event.stopImmediatePropagation();

 try {
  if(action==='save'){
   if(imageProcessing)return toast('Aguarde o processamento das imagens antes de salvar.');
   collect();
   if(!ed.titulo||!ed.cidade||!ed.valor)return toast('Preencha título, cidade e valor.');
   if(!edOwner.nome||!edOwner.cpf||!edOwner.rg||!edOwner.telefone||!edOwner.email)return toast('Preencha todos os dados obrigatórios do cliente anunciante.');
   if(!validCPF(edOwner.cpf))return toast('Informe um CPF válido.');
   if(![10,11].includes(edOwner.telefone.replace(/\D/g,'').length))return toast('Informe um telefone válido com DDD.');
   if(!$('o_email').checkValidity())return toast('Informe um e-mail válido.');
   if((ed.fotos||[]).length>14)return toast('O limite é de 14 fotos por imóvel.');
   if(ed.video&&!youtubeVideoId(ed.video))return toast('Informe um link válido de vídeo do YouTube.');
   await savePropertyAndAdvertiser(ed);
   ed=null;
   edOwner={nome:'',cpf:'',rg:'',telefone:'',email:''};
   edAdvertiserMessageId=null;
   toast('Imóvel, anunciante e fotos salvos no Supabase.');
   render();
   return;
  }

  if(action==='archive'){
   const reason=prompt('Informe o motivo para arquivar este imóvel:');
   if(reason===null)return;
   if(reason.trim().length<3)return toast('Informe um motivo com pelo menos 3 caracteres.');
   const property=IM.find(item=>item.cod===id);
   if(!property)return toast('Imóvel não encontrado.');
   property.arquivado={motivo:reason.trim(),em:new Date().toISOString(),por:(me()||{}).nome||'Colaborador'};
   property._archiveOwnerId=(TEAM().find(person=>person.email.toLowerCase()===((me()||{}).email||'').toLowerCase())||{}).id||null;
   await persistAdminPropertyState(property);
   toast('Imóvel arquivado no Supabase.');
   render();
   return;
  }

  if(action==='unarchive'){
   const property=IM.find(item=>item.cod===id);
   if(!property||!property.arquivado)return;
   if(property.st!=='disp'&&!await confirmModal('Este imóvel está '+(property.st==='alugado'?'alugado':'vendido')+'. Reativá-lo também removerá o registro do negócio. Continuar?'))return;
   property.arquivado=null;
   property._archiveOwnerId=null;
   if(property.st!=='disp'){property.st='disp';property.fech=null}
   await persistAdminPropertyState(property);
   toast('Imóvel reativado no Supabase.');
   render();
   return;
  }

  if(!isAdm())return toast('Sem permissão para excluir imóveis.');
  if(!await confirmModal('Excluir este imóvel e as fotos associadas?'))return;
  await deletePropertyAndAdvertiser(id);
  toast('Imóvel e fotos excluídos do Supabase.');
  render();
 } catch(error) {
  console.error('Falha ao persistir imóvel no Supabase.',error);
  toast('Não foi possível concluir a operação: '+supabaseMessage(error));
 }
}, true);

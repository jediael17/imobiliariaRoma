/* Ações dos botões (clique). */
document.addEventListener('click',async e=>{const b=e.target.closest('[data-p],[data-a]');if(!b)return;const a=b.dataset.a,id=b.dataset.id;
 if(['delu','savecfg','savewa','savesso','exp','promo','tadd','tdel'].includes(a)&&!isAdm())return toast('Sem permissão para esta ação.');
 if(b.dataset.p){page=b.dataset.p;ed=null;hl=null;return render()}
 if(a==='vmsg'){e.preventDefault();page='msg';hl=id;flt.m='';return render()}
 if(a==='menu'){document.querySelector('.shell').classList.toggle('open');return}
 if(a==='sp'){const p=$('p');p.type=p.type==='password'?'text':'password';b.textContent=p.type==='password'?'Mostrar':'Ocultar';return}
 if(a==='out'){try{sessionStorage.removeItem('roma_sess')}catch(x){}return render()}
 if(a==='new'){ed=blank();return render()}
 if(a==='edit'){ed=JSON.parse(JSON.stringify(IM.find(i=>i.cod===id)));return render()}
 if(a==='cancel'){ed=null;return render()}
 if(a==='rmph'){collect();ed.fotos.splice(+id,1);return render()}
 if(a==='save'){collect();if(!ed.titulo||!ed.cidade||!ed.valor)return toast('Preencha título, cidade e valor.');if(ed.cod)IM=IM.map(i=>i.cod===ed.cod?ed:i);else{ed.cod=nextCod();IM.unshift(ed)}if(saveIM()){ed=null;toast('Imóvel salvo.');render()}return}
 if(a==='deli'){if(confirm('Excluir este imóvel?')){IM=IM.filter(i=>i.cod!==id);saveIM();render()}return}
 if(a==='deal')return openDeal(id);
 if(a==='dcancel')return closeDeal();
 if(a==='dsave'){const i=IM.find(x=>x.cod===id),cli=$('d_cli').value.trim(),d=$('d_data').value;if(!cli||!d)return toast('Informe o cliente e a data.');const ori=$('d_ori').value,mid=ori==='site'?$('d_msg').value:'';
  i.st=i.fin==='aluguel'?'alugado':'vendido';i.fech={cliente:cli,tel:$('d_tel').value.trim(),origem:ori,msgId:mid,data:d,valor:+$('d_val').value||i.valor,obs:$('d_obs').value.trim(),por:(me()||{}).nome||''};
  if(mid){const all=MS(),m=all.find(x=>String(x.id)===String(mid));if(m){m.status='ok';DB.set('roma_msgs',all)}}
  if(saveIM()){closeDeal();toast('Negócio registrado.');render()}return}
 if(a==='reopen'){if(confirm('Reabrir este imóvel? O registro do negócio será removido.')){const i=IM.find(x=>x.cod===id);i.st='disp';delete i.fech;saveIM();render()}return}
 if(a==='reg'){const m=MS().find(x=>String(x.id)===id),g=k=>fv(m,k);ed=Object.assign(blank(),m.tipo==='vender'?{fin:g('Finalidade')==='Alugar'?'aluguel':'venda',tipo:g('Tipo do imóvel')||'Casa',valor:num(g('Valor pretendido')),cidade:g('Cidade'),bairro:g('Bairro'),area:num(g('Área')),q:num(g('Quartos')),v:num(g('Vagas')),texto:g('Descrição do imóvel')}:{tipo:g('Tipo de imóvel')||'Casa',cidade:g('Cidade'),bairro:g('Bairros de interesse'),valor:num(g('Valor máximo'))});page='imv';return render()}
 if(a==='delm'){if(confirm('Excluir esta mensagem?')){DB.set('roma_msgs',MS().filter(m=>String(m.id)!==id));render()}return}
 if(a==='delu'){if(confirm('Excluir este cliente?')){DB.set('roma_users',US().filter(u=>u.email!==id));render()}return}
 if(a==='sg')return ssoGoogle();if(a==='sm')return ssoMs();
 if(a==='tadd'){const em=$('t_email').value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(em))return toast('Informe um e-mail válido.');const all=TEAM();if(all.some(x=>x.email.toLowerCase()===em))return toast('Esse e-mail já está cadastrado.');all.push({email:em,nome:$('t_nome').value.trim(),papel:$('t_papel').value,criado:new Date().toISOString()});DB.set('roma_team',all);toast('Pessoa adicionada.');return render()}
 if(a==='tdel'){if(confirm('Remover o acesso desta pessoa?')){DB.set('roma_team',TEAM().filter(x=>x.email!==id));render()}return}
 if(a==='promo'){const u=US().find(x=>x.email===id);if(u){const all=TEAM();if(!all.some(x=>x.email.toLowerCase()===id.toLowerCase())){all.push({email:u.email.toLowerCase(),nome:u.name,papel:'colab',criado:new Date().toISOString()});DB.set('roma_team',all);toast(u.name+' agora é colaborador(a).')}}return render()}
 if(a==='savesso'){CFG.googleId=$('c_gid').value.trim();CFG.msId=$('c_mid').value.trim();CFG.msTenant=$('c_mt').value.trim()||'common';DB.set('roma_cfg',CFG);toast('Login único salvo.');return}
 if(a==='savecfg'){if($('c_user').value.trim())CFG.usuario=$('c_user').value.trim();if($('c_senha').value)CFG.senha=$('c_senha').value;DB.set('roma_cfg',CFG);toast('Acesso atualizado.');return}
 if(a==='savewa'){const w=num($('c_whats').value);if(!w)return toast('Informe um número válido.');CFG.whats=String(w);DB.set('roma_cfg',CFG);toast('Número salvo.');return}
 if(a==='exp'||a==='csv'){let txt,nm,ty='application/json';if(a==='exp'){txt=JSON.stringify({imoveis:IM,mensagens:MS(),clientes:US(),cfg:CFG},null,1);nm='roma-backup.json'}else{ty='text/csv';nm='roma-negocios.csv';txt='\ufeff'+['Data;Imóvel;Código;Tipo;Cliente;Contato;Origem;Valor;Observações'].concat(negF().map(x=>[dt(x.f.data),x.i.titulo,x.i.cod,x.t==='venda'?'Venda':'Locação',x.f.cliente||'',x.f.tel||'',ORI[x.f.origem]||'',x.f.valor||x.i.valor,(x.f.obs||'').replace(/[;\n]/g,' ')].join(';'))).join('\n')}
  const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([txt],{type:ty}));l.download=nm;l.click()}
});

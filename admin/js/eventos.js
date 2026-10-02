/* Campos, filtros, teclado e atualização entre abas. */
document.addEventListener('input',e=>{const t=e.target;if(t.id==='q'){flt.q=t.value;drawImv()}});
document.addEventListener('change',async e=>{const t=e.target;
 if(t.dataset.trole){if(!isAdm())return;const all=TEAM(),x=all.find(u=>u.email===t.dataset.trole);if(x){x.papel=t.value;DB.set('roma_team',all);toast('Papel atualizado.');render()}}else if(t.id==='fS'){flt.s=t.value;drawImv()}else if(t.id==='fF'){flt.f=t.value;drawImv()}
 else if(t.id==='fO'){flt.o=t.value;drawNeg()}else if(t.id==='fT'){flt.t=t.value;drawNeg()}
 else if(t.id==='fM'){flt.m=t.value;render()}
 else if(t.id==='d_ori')togMw();
 else if(t.id==='d_msg'){const m=MS().find(x=>String(x.id)===t.value);if(m){if(!$('d_cli').value)$('d_cli').value=fv(m,'Nome completo');if(!$('d_tel').value)$('d_tel').value=fv(m,'WhatsApp')}}
 else if(t.dataset.st){const all=MS(),m=all.find(x=>String(x.id)===t.dataset.st);if(m){m.status=t.value;DB.set('roma_msgs',all);render()}}
 else if(t.id==='e_fotos'){collect();const fs=[...t.files].slice(0,6-ed.fotos.length);for(const f of fs)ed.fotos.push(await readImg(f));render()}
 else if(t.id==='c_imp'&&isAdm()&&t.files[0]){const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.imoveis))throw 0;IM=d.imoveis;DB.set('roma_imoveis',IM);DB.set('roma_msgs',d.mensagens||[]);DB.set('roma_users',d.clientes||[]);render();toast('Backup importado.')}catch(x){toast('Arquivo de backup inválido.')}};r.readAsText(t.files[0])}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDeal()});
addEventListener('storage',()=>{if(authed()&&!ed&&!$('ov')&&['dash','msg','cli'].includes(page))render()});

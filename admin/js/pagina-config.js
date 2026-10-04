/* Página Configurações: acesso, login único, WhatsApp e backup. */
const DESIGN_SLIDE_MAX_BYTES=10*1024*1024,DESIGN_SLIDE_MAX_COUNT=10;
let designSlidesDirty=false;
const pgCfg=()=>'<div class="card"><h3>Autenticação Supabase</h3><p class="mut">O login do painel usa Supabase Auth e só permite e-mails ativos cadastrados na tabela de equipe. Configure provedores e URLs em Authentication no painel Supabase.</p></div>'+
'<div class="card"><h3>WhatsApp da ROMA</h3><label>Número (55 + DDD + número, só dígitos)<input id="c_whats" inputmode="numeric" value="'+esc(CFG.whats)+'"></label><div class="acts"><button class="btn primary" data-a="savewa">Salvar número</button></div></div>'+
'<div class="card design-slides-card"><h3>Design da página inicial</h3><p class="mut">Imagens do carrossel principal do site. Você pode manter até 10 imagens; cada uma terá no máximo 10 MB e as maiores serão compactadas automaticamente. Se remover todas, a página inicial ficará sem imagens no carrossel até que novas imagens sejam adicionadas.</p><label>Adicionar imagens<input type="file" id="designSlidesInput" accept="image/*" multiple'+(designSlidesProcessing||!designSlidesLoaded?' disabled':'')+'></label><div id="designSlidesStatus" class="design-slides-status" role="status" aria-live="polite">'+esc(designSlidesProgress.label||(designSlidesLoaded?designSlides.length+' de '+DESIGN_SLIDE_MAX_COUNT+' imagens configuradas.':'Carregando imagens do carrossel…'))+'</div><progress id="designSlidesProgress" max="100" value="'+designSlidesProgress.percent+'"'+(!designSlidesProcessing?' hidden':'')+'></progress><div class="design-slides-preview">'+designSlides.map((slide,index)=>'<div class="design-slide-preview"><img src="'+esc(slide.data)+'" alt="Imagem '+(index+1)+' do carrossel"><span>'+esc(slide.name||'Imagem '+(index+1))+'</span><button type="button" data-a="removeDesignSlide" data-id="'+index+'" aria-label="Remover imagem '+(index+1)+' do carrossel" title="Remover imagem"'+(designSlidesProcessing?' disabled':'')+'>×</button></div>').join('')+'</div><div class="acts"><button type="button" class="btn primary" data-a="saveDesignSlides"'+(!designSlidesDirty||designSlidesProcessing||!designSlidesLoaded?' disabled':'')+'>Salvar imagens</button></div></div>'+
'<div class="card"><h3>Backup dos dados</h3><p class="mut" style="margin:0">Os dados ficam salvos neste navegador. As imagens do carrossel são armazenadas separadamente e não entram neste arquivo. Exporte um backup dos demais dados para guardar ou levar a outro computador.</p><div class="acts"><button class="btn" data-a="exp">Exportar backup</button><label class="btn" style="display:inline-block;cursor:pointer">Importar backup<input type="file" id="c_imp" accept="application/json" hidden></label></div></div>';
const updateDesignSlidesStatus=(label,percent=0,active=false)=>{
 designSlidesProgress={label,percent};
 const status=$('designSlidesStatus'),progress=$('designSlidesProgress'),input=$('designSlidesInput'),save=$('[data-a="saveDesignSlides"]');
 if(status)status.textContent=label;
 if(progress){progress.value=percent;progress.hidden=!active}
 if(input)input.disabled=active;
 if(save)save.disabled=active||!designSlidesDirty;
 document.querySelectorAll('[data-a="removeDesignSlide"]').forEach(button=>button.disabled=active)
};
async function loadDesignSlidesForSettings(){
 if(designSlidesLoaded||designSlidesLoading)return;
 designSlidesLoading=true;updateDesignSlidesStatus('Carregando imagens do carrossel…',0,true);
 try{designSlides=await designSlidesLoad();designSlidesLoaded=true;designSlidesDirty=false;designSlidesProgress={label:'',percent:0}}
 catch(error){designSlidesError=true;console.error('Falha ao carregar as imagens do carrossel:',error);updateDesignSlidesStatus(error.message,0,false)}
 finally{designSlidesLoading=false;if(page==='cfg'&&authed())render()}
}
async function addDesignSlides(files){
 if(designSlidesProcessing||!designSlidesLoaded)return;
 const remaining=DESIGN_SLIDE_MAX_COUNT-designSlides.length;
 if(files.length>remaining)toast('Você pode configurar até 10 imagens no carrossel.');
 const selected=[...files].slice(0,remaining);
 if(!selected.length)return;
 designSlidesProcessing=true;let completedBytes=0,totalBytes=selected.reduce((sum,file)=>sum+file.size,0),compressed=0;
 try{
  const added=[];
  for(let index=0;index<selected.length;index++){
   const file=selected[index],report=local=>{const percent=totalBytes?Math.round((completedBytes+file.size*local)/totalBytes*100):100;updateDesignSlidesStatus((file.size>DESIGN_SLIDE_MAX_BYTES?'Compactando ':'Carregando ')+file.name+' ('+(index+1)+' de '+selected.length+') — '+percent+'%',percent,true)};
   report(0);
   const image=await readImg(file,report,DESIGN_SLIDE_MAX_BYTES);
   added.push({name:file.name,data:image.data,size:image.size});
   if(image.compressed)compressed++;
   completedBytes+=file.size
  }
  designSlides=designSlides.concat(added);designSlidesDirty=true;
  updateDesignSlidesStatus(designSlides.length+' imagem(ns) pronta(s) para salvar.',100,false);
  if(compressed)toast(compressed+' imagem(ns) compactada(s) para até 10 MB.')
 }catch(error){console.error('Falha ao processar as imagens do carrossel:',error);updateDesignSlidesStatus('Não foi possível concluir: '+error.message,designSlidesProgress.percent,false);toast('Não foi possível processar as imagens do carrossel.')}
 finally{designSlidesProcessing=false;if(page==='cfg')render()}
}
async function saveDesignSlides(){
 if(!isAdm())return toast('Sem permissão para alterar o carrossel.');
 if(designSlidesProcessing||!designSlidesDirty)return;
 designSlidesProcessing=true;updateDesignSlidesStatus('Salvando as imagens no navegador…',100,true);
 try{
  await designSlidesSave(designSlides);
  designSlidesDirty=false;
  updateDesignSlidesStatus('Imagens salvas — '+designSlides.length+' de '+DESIGN_SLIDE_MAX_COUNT+' configuradas.',100,false);
  toast('Imagens do carrossel salvas.')
 }catch(error){console.error('Falha ao salvar as imagens do carrossel:',error);updateDesignSlidesStatus('Não foi possível salvar: '+error.message,designSlidesProgress.percent,false);toast('Não foi possível salvar as imagens do carrossel.')}
 finally{designSlidesProcessing=false;if(page==='cfg')render()}
}
async function removeDesignSlide(index){
 if(designSlidesProcessing)return;
 const next=designSlides.filter((_,position)=>position!==index);
 if(next.length===designSlides.length)return;
 designSlides=next;designSlidesDirty=true;
 updateDesignSlidesStatus(designSlides.length+' imagem(ns) pronta(s) para salvar.',0,false);
 if(page==='cfg')render()
}

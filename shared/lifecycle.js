/* Regras de publicação e arquivamento automático dos imóveis. */
const PROPERTY_PUBLICATION_DAYS=4;
const archiveExpiredProperties=(properties,now=Date.now())=>{
 let changed=false;
 properties.forEach(property=>{
  if(property.arquivado||!['vendido','alugado'].includes(property.st))return;
  const registered=property.fech&&(property.fech.registradoEm||property.fech.data),timestamp=Date.parse(registered||'');
  if(!Number.isFinite(timestamp)||now-timestamp<PROPERTY_PUBLICATION_DAYS*86400000)return;
  property.arquivado={motivo:property.st==='alugado'?'Alugado':'Vendido',em:new Date(timestamp+PROPERTY_PUBLICATION_DAYS*86400000).toISOString(),por:'Sistema'};
  changed=true
 });
 return changed
};

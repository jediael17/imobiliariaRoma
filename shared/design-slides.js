/* Armazenamento do carrossel configurável da página inicial. */
const DESIGN_SLIDES_DB='roma-design',DESIGN_SLIDES_STORE='settings',DESIGN_SLIDES_KEY='home';
const openDesignSlidesDb=()=>new Promise((resolve,reject)=>{
 if(!('indexedDB'in window))return reject(new Error('Este navegador não oferece armazenamento local para as imagens do carrossel.'));
 const request=indexedDB.open(DESIGN_SLIDES_DB,1);
 request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(DESIGN_SLIDES_STORE))request.result.createObjectStore(DESIGN_SLIDES_STORE)};
 request.onsuccess=()=>resolve(request.result);
 request.onerror=()=>reject(request.error||new Error('Não foi possível abrir o armazenamento das imagens do carrossel.'));
 request.onblocked=()=>reject(new Error('O armazenamento das imagens do carrossel está bloqueado por outra aba.'));
});
const designSlidesLoad=async()=>{
 const db=await openDesignSlidesDb();
 try{return await new Promise((resolve,reject)=>{const request=db.transaction(DESIGN_SLIDES_STORE,'readonly').objectStore(DESIGN_SLIDES_STORE).get(DESIGN_SLIDES_KEY);request.onsuccess=()=>resolve(Array.isArray(request.result)?request.result:[]);request.onerror=()=>reject(request.error||new Error('Não foi possível carregar as imagens do carrossel.'))})}
 finally{db.close()}
};
const designSlidesSave=async slides=>{
 const db=await openDesignSlidesDb();
 try{await new Promise((resolve,reject)=>{const transaction=db.transaction(DESIGN_SLIDES_STORE,'readwrite');transaction.objectStore(DESIGN_SLIDES_STORE).put(slides,DESIGN_SLIDES_KEY);transaction.oncomplete=resolve;transaction.onerror=()=>reject(transaction.error||new Error('Não foi possível salvar as imagens do carrossel.'));transaction.onabort=()=>reject(transaction.error||new Error('O salvamento das imagens do carrossel foi cancelado.'))})}
 finally{db.close()}
};

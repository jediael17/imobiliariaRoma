/* Carrossel da página inicial (troca automática com zoom). */
let SLIDES=[];
const box=document.getElementById('slides'),dots=document.getElementById('dots'),cap=document.getElementById('cap');let cur=0,timer;
function renderSlides(){
 clearInterval(timer);cur=0;box.replaceChildren();dots.replaceChildren();cap.textContent='';
 if(!SLIDES.length)return;
 SLIDES.forEach((x,i)=>{const d=document.createElement('div');d.className='slide';const g=document.createElement('div');g.className='bg'+(x.img?'':' ph');g.style.backgroundImage=x.img?`url("${x.img}")${x.fb?`,url("${x.fb}")`:''}`:`linear-gradient(135deg,${x.c1},${x.c2})`;d.appendChild(g);box.appendChild(d);
  const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',x.label);b.onclick=()=>{go(i);start()};dots.appendChild(b)});
 go(0);start()
}
function go(i){if(!SLIDES.length)return;cur=i;[...box.children].forEach((e,k)=>e.classList.toggle('on',k===i));[...dots.children].forEach((e,k)=>e.classList.toggle('on',k===i));cap.textContent=SLIDES[i].label}
function start(){clearInterval(timer);if(SLIDES.length>1)timer=setInterval(()=>go((cur+1)%SLIDES.length),6500)}
designSlidesLoad().then(images=>{SLIDES=images.slice(0,10).map((image,index)=>({img:image.data,label:'Imagem de destaque '+(index+1)}));renderSlides()}).catch(error=>{renderSlides();cap.textContent='Não foi possível carregar as imagens de destaque.';console.error('Não foi possível carregar as imagens configuradas do carrossel.',error)});

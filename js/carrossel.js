/* Carrossel da página inicial (troca automática com zoom). */
/* CARROSSEL: coloque o caminho/URL da foto em img (ex.: "fotos/sala.jpg") */
const SLIDES=[
 {img:"https://britto.com.br/wp-content/uploads/2022/03/cobertura-penthouse-le-sense-agua-verde-1.png",fb:svgUrl('cob',FULL),label:"Coberturas com vista"},
 {img:"https://blog.valoreimoveis.com.br/wp-content/uploads/2022/08/Cobertura-scaled.jpg",fb:svgUrl('apto',FULL),label:"Coberturas espaçosas"},
 {img:"https://system.soprojetos.com.br/files/1739/og_image/PAD-COD136B.jpg?1767364102",fb:svgUrl('casa1',FULL),label:"Casas térreas modernas"},
 {img:"https://qtmovprime.com.br/blog/wp-content/uploads/2025/01/casa-moderna.jpg",fb:svgUrl('casa2',FULL),label:"Casas modernas"}];
const box=document.getElementById('slides'),dots=document.getElementById('dots'),cap=document.getElementById('cap');let cur=0,timer;
SLIDES.forEach((x,i)=>{const d=document.createElement('div');d.className='slide';const g=document.createElement('div');g.className='bg'+(x.img?'':' ph');g.style.backgroundImage=x.img?`url("${x.img}")${x.fb?`,url("${x.fb}")`:''}`:`linear-gradient(135deg,${x.c1},${x.c2})`;d.appendChild(g);box.appendChild(d);
 const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',x.label);b.onclick=()=>{go(i);start()};dots.appendChild(b)});
function go(i){cur=i;[...box.children].forEach((e,k)=>e.classList.toggle('on',k===i));[...dots.children].forEach((e,k)=>e.classList.toggle('on',k===i));cap.textContent=SLIDES[i].label}
function start(){clearInterval(timer);timer=setInterval(()=>go((cur+1)%SLIDES.length),6500)}
go(0);start();

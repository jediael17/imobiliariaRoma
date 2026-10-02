/* Barra de navegação: efeito ao rolar, menu mobile, submenu e destaque da seção ativa. */
const nav=document.getElementById('nav'),menu=document.getElementById('menu'),burger=document.getElementById('burger');
const onScroll=()=>nav.classList.toggle('scrolled',scrollY>40);onScroll();addEventListener('scroll',onScroll,{passive:true});
burger.onclick=()=>{const o=menu.classList.toggle('open');burger.setAttribute('aria-expanded',o)};
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('open');burger.setAttribute('aria-expanded','false')}));
document.querySelectorAll('.has-sub>button').forEach(b=>b.onclick=()=>{const li=b.parentElement,o=li.classList.toggle('open');b.setAttribute('aria-expanded',o)});
const links=[...document.querySelectorAll('nav a.link')];
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){links.forEach(l=>l.classList.toggle('active',l.getAttribute('href')==='#'+e.target.id))}}),{rootMargin:'-45% 0px -50% 0px'});
document.querySelectorAll('main section[id]').forEach(s=>io.observe(s));

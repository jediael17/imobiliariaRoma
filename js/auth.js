/* Login e cadastro de clientes com Google. */
let USER=DB.get('roma_user',null);
const byId=id=>document.getElementById(id),authm=byId('authmodal'),loginBtn=byId('loginBtn'),userLi=byId('userLi');
byId('cadWhats').dataset.mask='phone';byId('cadWhats').placeholder='(31) 9 9999-9999 (opcional)';applyInputMasks(authm);
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function prefillUser(){if(!USER)return;const n=mform.querySelector('input[aria-label="Nome completo"]'),w=mform.querySelector('input[aria-label="WhatsApp"]'),m=mform.querySelector('input[aria-label="E-mail"]');if(n&&!n.value)n.value=USER.name||'';if(m&&!m.value)m.value=USER.email||'';if(w&&!w.value&&USER.whats){w.value=USER.whats;applyInputMasks(mform)}}
function renderUser(){loginBtn.parentElement.hidden=!!USER;userLi.hidden=!USER;if(USER){const av=USER.picture?'<img class="uav" src="'+esc(USER.picture)+'" alt="" referrerpolicy="no-referrer">':'<span class="uav">'+esc((USER.name||'?')[0].toUpperCase())+'</span>';userLi.querySelector('button').innerHTML=av+' '+esc((USER.name||'Conta').split(' ')[0])+' ▾'}if(typeof apply==='function')apply()}
function setAu(t){document.querySelectorAll('#authmodal .atabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.au===t));byId('pLogin').hidden=t!=='login';byId('pCad').hidden=t!=='cad';byId('authtitle').textContent=t==='cad'?'Criar sua conta':'Acesse sua conta';byId('authmsg').hidden=true}
function openAuth(t){lastF=document.activeElement;setAu(t||'login');byId('demoNote').hidden=!!GOOGLE_CLIENT_ID;authm.hidden=false;document.body.style.overflow='hidden';requestAnimationFrame(()=>authm.classList.add('show'))}
function closeAuth(){authm.classList.remove('show');setTimeout(()=>{authm.hidden=true},250);document.body.style.overflow=''}
function finishAuth(u,mode){const us=DB.get('roma_users',[]),w=byId('cadWhats').value.trim();let r=us.find(x=>x.email===u.email);
 if(!r){r={name:u.name,email:u.email,picture:u.picture||'',whats:mode==='cad'?w:'',data:new Date().toISOString()};us.unshift(r)}else{r.name=u.name;r.picture=u.picture||r.picture;if(mode==='cad'&&w)r.whats=w}
 DB.set('roma_users',us);USER={name:r.name,email:r.email,picture:r.picture,whats:r.whats};DB.set('roma_user',USER);renderUser();closeAuth();
 openOk(mode==='cad'?'Seu cadastro foi concluído. Agora seus dados já vêm preenchidos nos formulários de contato.':'Você entrou na sua conta.','Olá, '+(USER.name||'').split(' ')[0]+'!')}
const loadGsi=()=>new Promise((ok,no)=>{if(window.google&&google.accounts&&google.accounts.oauth2)return ok();const sc=document.createElement('script');sc.src='https://accounts.google.com/gsi/client';sc.onload=ok;sc.onerror=no;document.head.appendChild(sc)});
async function googleSignIn(mode){const msg=byId('authmsg');msg.hidden=true;const err=t=>{msg.textContent=t;msg.hidden=false};
 if(mode==='cad'&&!byId('cadOk').checked)return err('Marque a caixa de aceite para continuar.');
 if(!GOOGLE_CLIENT_ID)return finishAuth({name:'Visitante Demo',email:'demo@exemplo.com',picture:''},mode);
 try{await loadGsi();google.accounts.oauth2.initTokenClient({client_id:GOOGLE_CLIENT_ID,scope:'openid email profile',callback:async r=>{if(r.error)return err('Login cancelado ou não autorizado.');try{const p=await(await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+r.access_token}})).json();finishAuth({name:p.name,email:p.email,picture:p.picture},mode)}catch(e){err('Não foi possível obter seus dados do Google.')}}}).requestAccessToken()}catch(e){err('Não foi possível carregar o login do Google. Verifique a conexão e o ID do cliente.')}}
loginBtn.onclick=()=>{menu.classList.remove('open');burger.setAttribute('aria-expanded','false');openAuth('login')};
document.querySelectorAll('#authmodal .atabs button').forEach(b=>b.onclick=()=>setAu(b.dataset.au));
document.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>googleSignIn(b.dataset.g));
byId('authx').onclick=closeAuth;authm.addEventListener('click',e=>{if(e.target===authm)closeAuth()});
addEventListener('keydown',e=>{if(e.key==='Escape'&&!authm.hidden)closeAuth()});
byId('logoutBtn').onclick=e=>{e.preventDefault();USER=null;try{localStorage.removeItem('roma_user')}catch(x){}renderUser();userLi.classList.remove('open')};
renderUser();

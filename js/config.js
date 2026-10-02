/* Configurações do site: números, mensagens padrão e login do Google (ver config.js na raiz). */
const CFG=Object.assign({whats:ROMA_CONFIG.whatsapp,senha:'roma2026'},DB.get('roma_cfg',{}));
const GOOGLE_CLIENT_ID=ROMA_CONFIG.googleClientId;
const MSG0='Olá! Gostaria de saber mais sobre as vendas e aluguéis de imóveis da ROMA.';
const waLink=t=>'https://wa.me/'+CFG.whats+'?text='+encodeURIComponent(t);

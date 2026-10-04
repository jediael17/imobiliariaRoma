/* Configurações do site: números, mensagens padrão e login do Google (ver config.js na raiz). */
const CFG={whats:ROMA_CONFIG.whatsapp};
const MSG0='Olá! Gostaria de saber mais sobre as vendas e aluguéis de imóveis da ROMA.';
const waLink=t=>'https://wa.me/'+CFG.whats+'?text='+encodeURIComponent(t);

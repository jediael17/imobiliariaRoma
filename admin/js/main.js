/* Inicialização do painel. */
render();
setInterval(()=>{if(archiveExpiredProperties(IM)){if(!saveIM())return;if(authed()&&!ed&&!$('ov')&&['dash','imv','neg','notif','mine'].includes(page))render()}},60000);

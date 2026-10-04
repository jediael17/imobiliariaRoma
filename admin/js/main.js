/* Inicialização do painel. */
initializeAdminAuth().catch(error=>{
 console.error('Não foi possível inicializar a autenticação do painel.',error);
 if(authed()) toast('A sessao esta autenticada, mas os dados do painel nao carregaram: '+supabaseMessage(error));
 else { login(); lerr(supabaseMessage(error)); }
});

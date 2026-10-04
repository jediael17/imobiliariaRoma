/* Inicialização do painel. */
initializeAdminAuth().catch(error=>{
 console.error('Não foi possível inicializar a autenticação do painel.',error);
 login();
 lerr(supabaseMessage(error));
});

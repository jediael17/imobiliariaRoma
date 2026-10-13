# Confirmação de visita por e-mail

O painel chama a função confirmar-agendamento-visita quando a opção de envio é marcada. Ela valida a sessão e a participação ativa do usuário na equipe antes de enviar a mensagem pelo Resend.

Configure no projeto Supabase uma chave da API do Resend e um endereço remetente verificado:

    supabase secrets set RESEND_API_KEY=re_sua_chave VISIT_EMAIL_FROM="ROMA Negócios Imobiliários <visitas@seu-dominio.com>"
    supabase functions deploy confirmar-agendamento-visita

O domínio do endereço remetente precisa estar verificado no Resend. SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY são disponibilizadas pelo ambiente das Edge Functions do Supabase; não coloque esses segredos no navegador.

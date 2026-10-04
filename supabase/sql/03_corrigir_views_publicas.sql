-- Execute uma vez no SQL Editor para corrigir as views públicas já criadas
-- por versões anteriores de supabase/sql/01_estrutura.sql. Não concede acesso às tabelas
-- internas de imóveis nem às colunas de endereço/anunciante.
begin;

alter view public.imoveis_publicos set (security_invoker = false);
alter view public.imoveis_fotos_publicas set (security_invoker = false);

commit;

-- Verificação: as consultas devem executar sem erro para anon.
select count(*) as imoveis_publicos from public.imoveis_publicos;
select count(*) as fotos_publicas from public.imoveis_fotos_publicas;

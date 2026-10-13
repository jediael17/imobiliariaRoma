-- Execute once in the Supabase SQL Editor after 04_configuracoes_painel.sql.
-- Exposes only the public WhatsApp contact number to anonymous site visitors.
begin;

create or replace function public.whatsapp_publico()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select nullif((
    select c.valor
    from public.configuracoes c
    where c.chave = 'whatsapp'
  ), '');
$$;

revoke all on function public.whatsapp_publico() from public;
grant execute on function public.whatsapp_publico() to anon, authenticated;

commit;

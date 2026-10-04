-- Execute once in Supabase SQL Editor to enable persistent panel settings.
begin;
create table if not exists public.configuracoes (
  chave text primary key,
  valor text not null,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references public.equipe(id)
);
alter table public.negocios add column if not exists forma_pagamento text;
alter table public.configuracoes enable row level security;
drop policy if exists configuracoes_admin_ler on public.configuracoes;
drop policy if exists configuracoes_admin_gravar on public.configuracoes;
create policy configuracoes_admin_ler on public.configuracoes for select to authenticated using (public.eh_equipe());
create policy configuracoes_admin_gravar on public.configuracoes for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
grant select, insert, update on public.configuracoes to authenticated;
commit;

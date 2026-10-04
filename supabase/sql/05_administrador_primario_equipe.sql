-- Protect the primary administrator and allow only that account to remove team members.
begin;

create or replace function public.eh_admin_primario() returns boolean
language sql stable security definer set search_path = public as $$
  select public.meu_email() = 'jediael7@gmail.com' and public.eh_admin()
$$;

create or replace function public.proteger_admin_primario_equipe() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if old.email = 'jediael7@gmail.com' then
      raise exception 'O administrador principal não pode ser excluído';
    end if;
    return old;
  end if;

  if old.email = 'jediael7@gmail.com' and (
    new.email <> old.email or new.ativo is false or new.papel <> 'admin'
  ) then
    raise exception 'A conta do administrador principal não pode ser alterada ou inativada';
  end if;
  return new;
end
$$;

drop trigger if exists proteger_admin_primario_equipe on public.equipe;
create trigger proteger_admin_primario_equipe
before update or delete on public.equipe
for each row execute function public.proteger_admin_primario_equipe();

drop policy if exists equipe_excluir_primario on public.equipe;
create policy equipe_excluir_primario on public.equipe
for delete to authenticated
using (public.eh_admin_primario() and email <> 'jediael7@gmail.com');

create or replace function public.excluir_membro_equipe(_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare target_email text;
begin
  if not public.eh_admin_primario() then
    raise exception 'Somente o administrador principal pode excluir pessoas da equipe'
      using errcode = '42501';
  end if;

  select email into target_email from public.equipe where id = _id;
  if not found then
    raise exception 'Pessoa da equipe não encontrada';
  end if;
  if target_email = 'jediael7@gmail.com' then
    raise exception 'O administrador principal não pode ser excluído';
  end if;

  delete from public.equipe where id = _id;
end
$$;

revoke all on function public.eh_admin_primario() from public, anon;
grant execute on function public.eh_admin_primario() to authenticated;
revoke all on function public.excluir_membro_equipe(uuid) from public, anon;
grant execute on function public.excluir_membro_equipe(uuid) to authenticated;
commit;

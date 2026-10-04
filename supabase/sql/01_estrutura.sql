-- =====================================================================
-- ROMA Negócios Imobiliários - estrutura do banco (Supabase / PostgreSQL)
-- Projeto: chgleblmgemirixmlzuq
--
-- COMO USAR: Supabase > SQL Editor > New query > cole TUDO > Run.
-- Rode UMA vez, em projeto vazio. Se der erro, nada é gravado (transação).
-- Depois rode o arquivo supabase/sql/02_primeiro_admin.sql com o SEU e-mail.
--
-- LGPD embutida no banco: minimização, separação dos dados pessoais,
-- acesso só pela equipe, trilha de auditoria, consentimento registrado,
-- direitos do titular (acesso, exportação, anonimização, exclusão).
-- =====================================================================
begin;

create extension if not exists pgcrypto;

-- ---------- utilitários de identidade (login Google/Microsoft) ----------
create or replace function public.meu_email() returns text
language sql stable as $$ select lower(coalesce(auth.jwt()->>'email','')) $$;

-- ---------- 1. EQUIPE ----------
create table public.equipe (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  nome text,
  papel text not null default 'colaborador' check (papel in ('admin','colaborador')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  ultimo_acesso timestamptz
);

-- Só vale quem entrou por Google ou Microsoft, está na tabela e está ativo.
create or replace function public.equipe_atual() returns public.equipe
language sql stable security definer set search_path = public as $$
  select e.* from public.equipe e
  where e.ativo
    and e.email = public.meu_email()
    and coalesce((auth.jwt()->'app_metadata'->'providers') ?| array['google','azure'], false)
  limit 1
$$;
create or replace function public.eh_equipe() returns boolean
language sql stable security definer set search_path = public as $$
  select (public.equipe_atual()).id is not null $$;
create or replace function public.eh_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((public.equipe_atual()).papel = 'admin', false) $$;
create or replace function public.meu_equipe_id() returns uuid
language sql stable security definer set search_path = public as $$
  select (public.equipe_atual()).id $$;

-- ---------- 2. CLIENTES E DADOS PESSOAIS (separados) ----------
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  nome text not null check (char_length(nome) between 2 and 200),
  email text check (email is null or char_length(email) <= 254),
  telefone text check (telefone is null or char_length(telefone) <= 30),
  perfis text[] not null default '{}',   -- cliente_site, comprador, anunciante, cliente_venda
  criado_em timestamptz not null default now(),
  anonimizado_em timestamptz
);
create index on public.clientes (lower(email));

-- CPF, RG e endereço: ninguém lê direto. Só pelas funções salvar/ver (com auditoria).
create table public.clientes_dados_pessoais (
  cliente_id uuid primary key references public.clientes(id) on delete cascade,
  cpf text, rg text,
  cep text, logradouro text, numero text, complemento text, bairro text, cidade text, uf text,
  atualizado_em timestamptz not null default now()
);

create or replace function public.cpf_valido(c text) returns boolean
language plpgsql immutable as $$
declare d text := regexp_replace(coalesce(c,''), '\D', '', 'g'); s int; i int; r int;
begin
  if length(d) <> 11 or d ~ '^(\d)\1{10}$' then return false; end if;
  s := 0; for i in 1..9 loop s := s + substr(d,i,1)::int * (11-i); end loop;
  r := (s*10) % 11; if r = 10 then r := 0; end if;
  if r <> substr(d,10,1)::int then return false; end if;
  s := 0; for i in 1..10 loop s := s + substr(d,i,1)::int * (12-i); end loop;
  r := (s*10) % 11; if r = 10 then r := 0; end if;
  return r = substr(d,11,1)::int;
end $$;

-- ---------- 3. IMÓVEIS ----------
create table public.contadores_codigo (ano int primary key, ultimo int not null default 0);

-- Código no formato RMAAAANNN (ex.: RM2026001), reiniciando a cada ano.
create or replace function public.proximo_codigo() returns text
language plpgsql security definer set search_path = public as $$
declare a int := extract(year from now())::int; n int;
begin
  insert into contadores_codigo(ano, ultimo) values (a, 1)
  on conflict (ano) do update set ultimo = contadores_codigo.ultimo + 1
  returning ultimo into n;
  return 'RM' || a || lpad(n::text, 3, '0');
end $$;

create table public.imoveis (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default public.proximo_codigo(),
  titulo text not null check (char_length(titulo) between 3 and 150),
  finalidade text not null check (finalidade in ('venda','aluguel')),
  tipo text not null check (tipo in ('Apartamento','Casa','Cobertura','Terreno','Comercial')),
  situacao text not null default 'disponivel' check (situacao in ('disponivel','vendido','alugado')),
  cep text, logradouro text, numero text, complemento text, bairro text,
  cidade text not null, uf text,
  quartos int not null default 0 check (quartos >= 0),
  suites int not null default 0 check (suites >= 0),
  banheiros int not null default 0 check (banheiros >= 0),
  vagas int not null default 0 check (vagas >= 0),
  area_m2 numeric(10,2) check (area_m2 is null or area_m2 >= 0),
  valor numeric(14,2) not null check (valor >= 0),
  descricao text check (descricao is null or char_length(descricao) <= 5000),
  video_url text check (video_url is null or char_length(video_url) <= 300),
  anunciante_id uuid references public.clientes(id) on delete set null,
  criado_por uuid references public.equipe(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  fechado_em timestamptz,
  arquivado_em timestamptz,
  arquivado_motivo text,
  arquivado_por uuid references public.equipe(id),
  check (arquivado_em is null or char_length(coalesce(arquivado_motivo,'')) >= 3)
);
create index on public.imoveis (situacao, arquivado_em);

create table public.imoveis_fotos (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid not null references public.imoveis(id) on delete cascade,
  caminho text not null,                 -- caminho no bucket "imoveis"
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);
create index on public.imoveis_fotos (imovel_id, ordem);

-- O site público lê SOMENTE por estas views (sem endereço exato, sem anunciante).
-- Vendidos/alugados ficam visíveis por 4 dias; depois somem da vitrine.
create view public.imoveis_publicos with (security_invoker = false) as
  select id, codigo, titulo, finalidade, tipo, situacao, bairro, cidade, uf,
         quartos, suites, banheiros, vagas, area_m2, valor, descricao, video_url,
         criado_em, fechado_em
  from public.imoveis
  where arquivado_em is null
    and (situacao = 'disponivel'
         or (situacao in ('vendido','alugado') and fechado_em > now() - interval '4 days'));
create view public.imoveis_fotos_publicas with (security_invoker = false) as
  select f.id, f.imovel_id, f.caminho, f.ordem
  from public.imoveis_fotos f join public.imoveis_publicos i on i.id = f.imovel_id;

-- ---------- 4. MENSAGENS E ATENDIMENTO ----------
create table public.mensagens (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('comprar','vender','alugar','contato')),
  nome text not null check (char_length(nome) between 2 and 200),
  telefone text check (telefone is null or char_length(telefone) <= 30),
  email text check (email is null or char_length(email) <= 254),
  detalhes jsonb not null default '{}'::jsonb check (pg_column_size(detalhes) < 20000),
  status text not null default 'nova' check (status in ('nova','em_atendimento','concluida')),
  tag text check (tag is null or char_length(tag) <= 60),
  observacao_encerramento text check (observacao_encerramento is null or char_length(observacao_encerramento) <= 1000),
  responsavel_id uuid references public.equipe(id),
  assumida_em timestamptz,
  concluida_em timestamptz,
  cliente_id uuid references public.clientes(id) on delete set null,
  imovel_id uuid references public.imoveis(id) on delete set null,
  aceite_politica_versao text not null,              -- LGPD: prova do aceite
  aceite_em timestamptz not null default now(),
  criado_em timestamptz not null default now()
);
create index on public.mensagens (status, responsavel_id);

create table public.solicitacoes_exclusao (
  id uuid primary key default gen_random_uuid(),
  mensagem_id uuid references public.mensagens(id) on delete set null,
  solicitante_id uuid not null references public.equipe(id),
  motivo text not null check (char_length(motivo) >= 5),
  status text not null default 'pendente' check (status in ('pendente','aprovada','recusada')),
  decidido_por uuid references public.equipe(id),
  decidido_em timestamptz,
  criado_em timestamptz not null default now()
);

-- ---------- 5. VENDAS E LOCAÇÕES ----------
create table public.negocios (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid not null references public.imoveis(id) on delete restrict,
  tipo text not null check (tipo in ('venda','locacao')),
  cliente_id uuid references public.clientes(id) on delete set null,
  origem text not null check (origem in ('site','whatsapp','outro')),
  mensagem_id uuid references public.mensagens(id) on delete restrict, -- impede excluir mensagem de venda concluída
  data_negocio date not null,
  valor numeric(14,2) not null check (valor >= 0),
  financiado boolean not null default false,
  entrada numeric(14,2), parcelas int, valor_parcela numeric(14,2),
  observacoes text check (observacoes is null or char_length(observacoes) <= 2000),
  responsavel_id uuid references public.equipe(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create table public.negocios_documentos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  caminho text not null unique,          -- caminho no bucket privado "documentos"
  nome_original text, mime text, tamanho int,
  criado_por uuid references public.equipe(id),
  criado_em timestamptz not null default now()
);

-- ---------- 6. CARROSSEL E FAVORITOS ----------
create table public.carrossel_imagens (
  id uuid primary key default gen_random_uuid(),
  caminho text not null, ordem int not null default 0,
  criado_em timestamptz not null default now()
);
create table public.favoritos (
  user_id uuid not null references auth.users(id) on delete cascade,
  imovel_id uuid not null references public.imoveis(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (user_id, imovel_id)
);

-- ---------- 7. LGPD: consentimento, direitos do titular, auditoria ----------
create table public.consentimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  finalidade text not null check (finalidade in ('contato','cadastro','marketing')),
  versao_politica text not null,
  aceito boolean not null,               -- false = revogação
  criado_em timestamptz not null default now()
);
create table public.solicitacoes_titular (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 2 and 200),
  email text not null check (char_length(email) <= 254),
  tipo text not null check (tipo in ('confirmacao','acesso','correcao','anonimizacao_eliminacao',
        'portabilidade','compartilhamento','revogacao_consentimento','oposicao')),
  detalhes text check (detalhes is null or char_length(detalhes) <= 2000),
  status text not null default 'aberta' check (status in ('aberta','em_analise','atendida','negada')),
  prazo_resposta date not null default (current_date + 15),   -- LGPD art. 19, II
  resposta text,
  criado_em timestamptz not null default now(),
  atendido_em timestamptz
);
create table public.log_auditoria (
  id bigint generated always as identity primary key,
  ocorrido_em timestamptz not null default now(),
  usuario_email text default public.meu_email(),
  acao text not null,
  tabela text not null,
  registro_id text,
  detalhes jsonb
);

-- ---------- 8. TRIGGERS ----------
create or replace function public.toca_atualizado() returns trigger
language plpgsql as $$ begin new.atualizado_em := now(); return new; end $$;
create trigger t_imoveis_upd before update on public.imoveis for each row execute function public.toca_atualizado();
create trigger t_negocios_upd before update on public.negocios for each row execute function public.toca_atualizado();
create trigger t_dados_upd before update on public.clientes_dados_pessoais for each row execute function public.toca_atualizado();

create or replace function public.auditar() returns trigger
language plpgsql security definer set search_path = public as $$
declare j jsonb; rid text;
begin
  if tg_op = 'DELETE' then j := to_jsonb(old); else j := to_jsonb(new); end if;
  rid := coalesce(j->>'id', j->>'cliente_id');
  insert into log_auditoria(acao, tabela, registro_id) values (tg_op, tg_table_name, rid);
  return null;
end $$;
create trigger a_dados after insert or update or delete on public.clientes_dados_pessoais for each row execute function public.auditar();
create trigger a_clientes after insert or update or delete on public.clientes for each row execute function public.auditar();
create trigger a_negocios after insert or update or delete on public.negocios for each row execute function public.auditar();
create trigger a_docs after insert or update or delete on public.negocios_documentos for each row execute function public.auditar();
create trigger a_equipe after insert or update or delete on public.equipe for each row execute function public.auditar();
create trigger a_imoveis after insert or update or delete on public.imoveis for each row execute function public.auditar();

-- Marca o imóvel como vendido/alugado ao registrar o negócio; reabre se o negócio for removido.
create or replace function public.sincroniza_imovel_negocio() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update imoveis set situacao = case when new.tipo = 'venda' then 'vendido' else 'alugado' end,
           fechado_em = now(), arquivado_em = null, arquivado_motivo = null
     where id = new.imovel_id;
  elsif tg_op = 'DELETE' then
    if not exists (select 1 from negocios where imovel_id = old.imovel_id and id <> old.id) then
      update imoveis set situacao = 'disponivel', fechado_em = null where id = old.imovel_id;
    end if;
  end if;
  return null;
end $$;
create trigger t_negocio_sync after insert or delete on public.negocios for each row execute function public.sincroniza_imovel_negocio();

-- ---------- 9. FUNÇÕES (RPC) ----------
create or replace function public.registrar_acesso() returns void
language sql security definer set search_path = public as $$
  update equipe set ultimo_acesso = now() where id = public.meu_equipe_id() $$;

create or replace function public.assumir_mensagem(_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.eh_equipe() then raise exception 'Acesso negado' using errcode = '42501'; end if;
  update mensagens set responsavel_id = public.meu_equipe_id(), status = 'em_atendimento', assumida_em = now()
   where id = _id and responsavel_id is null;
  get diagnostics n = row_count;
  return n > 0;
end $$;

create or replace function public.decidir_exclusao(_id uuid, _aprovar boolean) returns void
language plpgsql security definer set search_path = public as $$
declare s public.solicitacoes_exclusao;
begin
  if not public.eh_admin() then raise exception 'Somente administradores' using errcode = '42501'; end if;
  select * into s from solicitacoes_exclusao where id = _id and status = 'pendente';
  if not found then raise exception 'Solicitação não encontrada ou já decidida'; end if;
  update solicitacoes_exclusao
     set status = case when _aprovar then 'aprovada' else 'recusada' end,
         decidido_por = public.meu_equipe_id(), decidido_em = now()
   where id = _id;
  if _aprovar then
    begin
      delete from mensagens where id = s.mensagem_id;
    exception when foreign_key_violation then
      raise exception 'Mensagem vinculada a uma venda concluída: não pode ser excluída' using errcode = '23503';
    end;
  end if;
end $$;

create or replace function public.salvar_dados_pessoais(
  _cliente uuid, _cpf text, _rg text, _cep text, _logradouro text, _numero text,
  _complemento text, _bairro text, _cidade text, _uf text) returns void
language plpgsql security definer set search_path = public as $$
declare d text := nullif(regexp_replace(coalesce(_cpf,''), '\D', '', 'g'), '');
begin
  if not public.eh_equipe() then raise exception 'Acesso negado' using errcode = '42501'; end if;
  if d is not null and not public.cpf_valido(d) then raise exception 'CPF inválido' using errcode = '22023'; end if;
  insert into clientes_dados_pessoais(cliente_id, cpf, rg, cep, logradouro, numero, complemento, bairro, cidade, uf)
  values (_cliente, d, nullif(_rg,''), nullif(_cep,''), _logradouro, _numero, _complemento, _bairro, _cidade, _uf)
  on conflict (cliente_id) do update set cpf = excluded.cpf, rg = excluded.rg, cep = excluded.cep,
    logradouro = excluded.logradouro, numero = excluded.numero, complemento = excluded.complemento,
    bairro = excluded.bairro, cidade = excluded.cidade, uf = excluded.uf;
end $$;

-- Toda leitura de CPF/RG fica registrada: quem, quando e de quem.
create or replace function public.ver_dados_pessoais(_cliente uuid) returns public.clientes_dados_pessoais
language plpgsql security definer set search_path = public as $$
declare r public.clientes_dados_pessoais;
begin
  if not public.eh_equipe() then raise exception 'Acesso negado' using errcode = '42501'; end if;
  select * into r from clientes_dados_pessoais where cliente_id = _cliente;
  insert into log_auditoria(acao, tabela, registro_id, detalhes)
  values ('LEITURA', 'clientes_dados_pessoais', _cliente::text, jsonb_build_object('campos', 'cpf,rg,endereco'));
  return r;
end $$;

create or replace function public._anonimizar(_cliente uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from clientes_dados_pessoais where cliente_id = _cliente;
  update mensagens set nome = 'Titular anonimizado', telefone = null, email = null, detalhes = '{}'::jsonb
   where cliente_id = _cliente;
  update clientes set nome = 'Titular anonimizado', email = null, telefone = null, user_id = null,
         anonimizado_em = now() where id = _cliente;
  insert into log_auditoria(acao, tabela, registro_id) values ('ANONIMIZACAO', 'clientes', _cliente::text);
end $$;

create or replace function public.anonimizar_cliente(_cliente uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.eh_admin() then raise exception 'Somente administradores' using errcode = '42501'; end if;
  perform public._anonimizar(_cliente);
end $$;

-- Direito de acesso e portabilidade (LGPD art. 18) para quem tem conta no site.
create or replace function public.exportar_meus_dados() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare c public.clientes;
begin
  if auth.uid() is null then raise exception 'Não autenticado' using errcode = '28000'; end if;
  select * into c from clientes where user_id = auth.uid();
  return jsonb_build_object(
    'gerado_em', now(),
    'conta', jsonb_build_object('id', auth.uid(), 'email', public.meu_email()),
    'cadastro', to_jsonb(c),
    'consentimentos', coalesce((select jsonb_agg(to_jsonb(x)) from consentimentos x where x.user_id = auth.uid()), '[]'::jsonb),
    'favoritos', coalesce((select jsonb_agg(to_jsonb(f)) from favoritos f where f.user_id = auth.uid()), '[]'::jsonb),
    'mensagens', coalesce((select jsonb_agg(to_jsonb(m) - 'responsavel_id' - 'tag')
                             from mensagens m where m.cliente_id = c.id or lower(m.email) = public.meu_email()), '[]'::jsonb));
end $$;

-- Direito de eliminação: o próprio cliente apaga a conta (dados pessoais são anonimizados).
create or replace function public.excluir_minha_conta() returns void
language plpgsql security definer set search_path = public as $$
declare c uuid;
begin
  if auth.uid() is null then raise exception 'Não autenticado' using errcode = '28000'; end if;
  if public.eh_equipe() then
    raise exception 'Contas da equipe devem ser desativadas por um administrador' using errcode = '42501';
  end if;
  delete from favoritos where user_id = auth.uid();
  select id into c from clientes where user_id = auth.uid();
  if c is not null then perform public._anonimizar(c); end if;
  insert into log_auditoria(acao, tabela, registro_id) values ('EXCLUSAO_CONTA', 'auth.users', auth.uid()::text);
  delete from auth.users where id = auth.uid();
end $$;

-- Arquiva vendidos/alugados após 4 dias (agende com pg_cron, veja docs/privacidade/LGPD.md).
create or replace function public.arquivar_imoveis_vencidos() returns integer
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update imoveis set arquivado_em = now(), arquivado_motivo = 'Arquivado automaticamente 4 dias após o negócio'
   where situacao in ('vendido','alugado') and arquivado_em is null and fechado_em < now() - interval '4 days';
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------- 10. SEGURANÇA DE LINHA (RLS) ----------
alter table public.equipe enable row level security;
alter table public.clientes enable row level security;
alter table public.clientes_dados_pessoais enable row level security;   -- sem políticas: só as funções acessam
alter table public.contadores_codigo enable row level security;          -- idem
alter table public.imoveis enable row level security;
alter table public.imoveis_fotos enable row level security;
alter table public.mensagens enable row level security;
alter table public.solicitacoes_exclusao enable row level security;
alter table public.negocios enable row level security;
alter table public.negocios_documentos enable row level security;
alter table public.carrossel_imagens enable row level security;
alter table public.favoritos enable row level security;
alter table public.consentimentos enable row level security;
alter table public.solicitacoes_titular enable row level security;
alter table public.log_auditoria enable row level security;

-- equipe: cada pessoa vê a própria linha; administradores veem e gerenciam todas (sem excluir: só inativar).
create policy equipe_ler on public.equipe for select to authenticated using (public.eh_admin() or email = public.meu_email());
create policy equipe_inserir on public.equipe for insert to authenticated with check (public.eh_admin());
create policy equipe_atualizar on public.equipe for update to authenticated using (public.eh_admin()) with check (public.eh_admin());

-- clientes: equipe vê todos; o cliente do site vê e edita só o próprio cadastro.
create policy clientes_equipe on public.clientes for select to authenticated using (public.eh_equipe());
create policy clientes_equipe_ins on public.clientes for insert to authenticated with check (public.eh_equipe());
create policy clientes_equipe_upd on public.clientes for update to authenticated using (public.eh_equipe()) with check (public.eh_equipe());
create policy clientes_equipe_del on public.clientes for delete to authenticated using (public.eh_admin());
create policy clientes_proprio_ler on public.clientes for select to authenticated using (user_id = auth.uid());
create policy clientes_proprio_ins on public.clientes for insert to authenticated with check (user_id = auth.uid());
create policy clientes_proprio_upd on public.clientes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- imóveis: só a equipe mexe na tabela; colaborador arquiva, só administrador exclui.
create policy imoveis_ler on public.imoveis for select to authenticated using (public.eh_equipe());
create policy imoveis_ins on public.imoveis for insert to authenticated with check (public.eh_equipe());
create policy imoveis_upd on public.imoveis for update to authenticated using (public.eh_equipe()) with check (public.eh_equipe());
create policy imoveis_del on public.imoveis for delete to authenticated using (public.eh_admin());
create policy fotos_ler on public.imoveis_fotos for select to authenticated using (public.eh_equipe());
create policy fotos_ins on public.imoveis_fotos for insert to authenticated with check (public.eh_equipe());
create policy fotos_upd on public.imoveis_fotos for update to authenticated using (public.eh_equipe()) with check (public.eh_equipe());
create policy fotos_del on public.imoveis_fotos for delete to authenticated using (public.eh_equipe());

-- mensagens: qualquer visitante envia (com aceite da política); equipe lê a fila e os próprios atendimentos.
create policy msg_enviar on public.mensagens for insert to anon, authenticated
  with check (status = 'nova' and responsavel_id is null and tag is null and observacao_encerramento is null
              and cliente_id is null and imovel_id is null and assumida_em is null and concluida_em is null
              and char_length(aceite_politica_versao) > 0);
create policy msg_ler on public.mensagens for select to authenticated
  using (public.eh_equipe() and (public.eh_admin() or responsavel_id is null or responsavel_id = public.meu_equipe_id()));
create policy msg_upd on public.mensagens for update to authenticated
  using (public.eh_equipe() and (public.eh_admin() or responsavel_id = public.meu_equipe_id()))
  with check (public.eh_equipe() and (public.eh_admin() or responsavel_id = public.meu_equipe_id()));
create policy msg_del on public.mensagens for delete to authenticated using (public.eh_admin());

create policy excl_ins on public.solicitacoes_exclusao for insert to authenticated
  with check (public.eh_equipe() and solicitante_id = public.meu_equipe_id() and status = 'pendente');
create policy excl_ler on public.solicitacoes_exclusao for select to authenticated
  using (public.eh_admin() or solicitante_id = public.meu_equipe_id());

-- negócios: equipe lê; colaborador registra em seu nome e edita por 7 dias; administrador tudo.
create policy neg_ler on public.negocios for select to authenticated using (public.eh_equipe());
create policy neg_ins on public.negocios for insert to authenticated
  with check (public.eh_equipe() and (public.eh_admin() or responsavel_id = public.meu_equipe_id()));
create policy neg_upd on public.negocios for update to authenticated
  using (public.eh_admin() or (responsavel_id = public.meu_equipe_id() and criado_em > now() - interval '7 days'))
  with check (public.eh_admin() or responsavel_id = public.meu_equipe_id());
create policy neg_del on public.negocios for delete to authenticated using (public.eh_admin());
create policy doc_ler on public.negocios_documentos for select to authenticated using (public.eh_equipe());
create policy doc_ins on public.negocios_documentos for insert to authenticated
  with check (exists (select 1 from public.negocios n where n.id = negocio_id
                      and (public.eh_admin() or n.responsavel_id = public.meu_equipe_id())));
create policy doc_del on public.negocios_documentos for delete to authenticated
  using (exists (select 1 from public.negocios n where n.id = negocio_id
                 and (public.eh_admin() or n.responsavel_id = public.meu_equipe_id())));

create policy carr_ler on public.carrossel_imagens for select to anon, authenticated using (true);
create policy carr_ins on public.carrossel_imagens for insert to authenticated with check (public.eh_admin());
create policy carr_upd on public.carrossel_imagens for update to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy carr_del on public.carrossel_imagens for delete to authenticated using (public.eh_admin());

create policy fav_todos on public.favoritos for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy cons_ins on public.consentimentos for insert to anon, authenticated with check (user_id is null or user_id = auth.uid());
create policy cons_ler on public.consentimentos for select to authenticated using (user_id = auth.uid() or public.eh_admin());

create policy tit_ins on public.solicitacoes_titular for insert to anon, authenticated
  with check (status = 'aberta' and resposta is null and atendido_em is null);
create policy tit_ler on public.solicitacoes_titular for select to authenticated using (public.eh_admin());
create policy tit_upd on public.solicitacoes_titular for update to authenticated using (public.eh_admin()) with check (public.eh_admin());

create policy log_ler on public.log_auditoria for select to authenticated using (public.eh_admin());

-- ---------- 11. PERMISSÕES (defesa em profundidade) ----------
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from public, anon;

grant select on public.imoveis_publicos, public.imoveis_fotos_publicas, public.carrossel_imagens to anon, authenticated;
grant insert on public.mensagens, public.consentimentos, public.solicitacoes_titular to anon, authenticated;

grant select, insert, update, delete on
  public.equipe, public.clientes, public.imoveis, public.imoveis_fotos, public.mensagens,
  public.solicitacoes_exclusao, public.negocios, public.negocios_documentos,
  public.carrossel_imagens, public.favoritos, public.consentimentos, public.solicitacoes_titular
  to authenticated;
grant select on public.log_auditoria to authenticated;
revoke all on public.clientes_dados_pessoais, public.contadores_codigo from authenticated;

grant execute on all functions in schema public to authenticated;
revoke execute on function public._anonimizar(uuid) from authenticated;
revoke execute on function public.arquivar_imoveis_vencidos() from authenticated;

-- ---------- 12. ARMAZENAMENTO DE ARQUIVOS ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('imoveis',   'imoveis',   true,  1572864,  array['image/jpeg','image/png','image/webp']),
  ('carrossel', 'carrossel', true,  10485760, array['image/jpeg','image/png','image/webp']),
  ('documentos','documentos',false, 1048576,  array['application/pdf','application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy st_imoveis_ler on storage.objects for select to anon, authenticated using (bucket_id = 'imoveis');
create policy st_imoveis_ins on storage.objects for insert to authenticated with check (bucket_id = 'imoveis' and public.eh_equipe());
create policy st_imoveis_upd on storage.objects for update to authenticated using (bucket_id = 'imoveis' and public.eh_equipe());
create policy st_imoveis_del on storage.objects for delete to authenticated using (bucket_id = 'imoveis' and public.eh_equipe());

create policy st_carr_ler on storage.objects for select to anon, authenticated using (bucket_id = 'carrossel');
create policy st_carr_ins on storage.objects for insert to authenticated with check (bucket_id = 'carrossel' and public.eh_admin());
create policy st_carr_upd on storage.objects for update to authenticated using (bucket_id = 'carrossel' and public.eh_admin());
create policy st_carr_del on storage.objects for delete to authenticated using (bucket_id = 'carrossel' and public.eh_admin());

-- Documentos de venda: bucket PRIVADO; caminho no formato negocios/<id-do-negocio>/<arquivo>.
create policy st_doc_ler on storage.objects for select to authenticated using (bucket_id = 'documentos' and public.eh_equipe());
create policy st_doc_ins on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = 'negocios'
    and exists (select 1 from public.negocios n where n.id::text = (storage.foldername(name))[2]
                and (public.eh_admin() or n.responsavel_id = public.meu_equipe_id())));
create policy st_doc_del on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = 'negocios'
    and exists (select 1 from public.negocios n where n.id::text = (storage.foldername(name))[2]
                and (public.eh_admin() or n.responsavel_id = public.meu_equipe_id())));

commit;

-- Rode DEPOIS de supabase/sql/01_estrutura.sql.
-- Troque pelo e-mail da conta Google com que você vai entrar. Este será o primeiro administrador.
insert into public.equipe (email, nome, papel)
values (lower('jediael7@gmail.com'), 'Jediael', 'admin');

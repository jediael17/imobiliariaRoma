# LGPD no projeto ROMA Negócios Imobiliários

> Este documento descreve as medidas técnicas do projeto e o que falta fazer fora do código.
> **Não é aconselhamento jurídico.** Antes de coletar dados de clientes reais, peça a um advogado
> (de preferência com experiência em proteção de dados) para revisar a política de privacidade,
> as bases legais e os prazos de retenção abaixo, que são sugestões.

## 1. Mapa dos dados (registro das operações, LGPD art. 37)

| Dado | Quem fornece | Finalidade | Base legal sugerida | Quem acessa | Retenção sugerida* |
|---|---|---|---|---|---|
| Nome, telefone, e-mail e preferências da mensagem de contato | Visitante | Responder ao pedido de compra, venda ou aluguel | Procedimentos preliminares a pedido do titular (art. 7º, V) ou consentimento (art. 7º, I) | Equipe: quem assumiu o atendimento e administradores | 12 meses sem negócio |
| Conta Google do cliente (nome, e-mail) e favoritos | Cliente | Cadastro no site e favoritos | Consentimento (art. 7º, I) | O próprio cliente e a equipe | Até o cliente excluir a conta |
| CPF, RG e endereço de anunciante ou comprador | Equipe, a partir do cliente | Contrato de anúncio, venda ou locação | Execução de contrato (art. 7º, V) e obrigações legais (art. 7º, II) | Somente equipe, via função com registro de leitura | Duração do contrato + prazo legal (definir com advogado) |
| Documentos de venda (PDF/Word) | Equipe | Formalizar o negócio | Execução de contrato e obrigação legal | Administrador e responsável pelo negócio | Idem |
| Log de auditoria (quem leu ou alterou o quê) | Sistema | Segurança e prestação de contas (arts. 6º, X e 46) | Legítimo interesse (art. 7º, IX) | Administradores | 12 meses |

\* Prazos são sugestões para você validar com o advogado.

## 2. Estado real da integração

O banco criado por `supabase/sql/01_estrutura.sql` contém tabelas, funções, políticas RLS e buckets. Isso não significa que toda função do site já use o banco.

Já conectado ao Supabase:

- A vitrine lê imóveis publicados sem endereço exato nem dados do anunciante.
- O carrossel lê imagens do bucket público `carrossel`; a equipe pode atualizá-lo autenticada.
- Formulários de contato gravam mensagens e a versão da política aceita.
- O login Google do site e do painel usa Supabase Auth; a equipe e seus papéis vêm de `public.equipe`.
- Cadastro básico de cliente, aceites de cadastro e favoritos usam as tabelas do Supabase.

Ainda não conectado para uso operacional:

- O cadastro/edição administrativa de imóveis, clientes, negócios e documentos ainda usa armazenamento local em partes do painel.
- Não estão disponíveis na interface a exportação/exclusão da conta, revogação de consentimento nem o canal de direitos do titular.
- Não há aviso completo de cookies/armazenamento, nem política de retenção automatizada validada para mensagens.

**Não use ainda o painel para dados reais.** A migração do restante do painel e os testes das políticas precisam terminar antes disso. O banco separa dados pessoais e tem funções de auditoria, mas essas medidas só se aplicam quando as telas chamam as funções seguras correspondentes.

## 3. O que ainda precisa ser feito no site

1. **Finalizar a política de privacidade** (minuta em `docs/privacidade/politica-de-privacidade.html`; preencher os campos entre colchetes, prazos e operadores e obter revisão jurídica). Ela já tem links no site e nos formulários.
2. **Revisar o aceite e sua base legal** dos formulários com advogado. Contatos gravam a versão `1.0`; cadastros também registram aceite na tabela `consentimentos`.
3. **Aviso sobre armazenamento local e cookies** no primeiro acesso.
4. **Área "Meus dados"** para o cliente conectado: exportar dados, revogar consentimento e excluir a conta.
5. **Formulário "Direitos do titular"** gravando em `solicitacoes_titular`.
6. **Concluir a migração do painel** antes de inserir CPF, RG ou documentos reais.

## 4. O que fazer fora do código (organização)

- **Encarregado (DPO):** nomeie uma pessoa e publique o contato na política (art. 41).
- **RIPD:** como há CPF e RG em volume, faça um relatório de impacto simples (art. 38).
- **Região dos dados:** confira a região do projeto Supabase (Project Settings). O ideal é **São Paulo**. Se estiver fora do Brasil, há transferência internacional (art. 33) e o advogado deve avaliar a base. Com o projeto ainda vazio, é fácil recriá-lo na região certa.
- **Contratos com fornecedores:** aceite os termos de tratamento de dados (DPA) do Supabase e do Google, e liste-os na política como operadores.
- **Acesso da equipe:** termo de confidencialidade, treinamento básico e ativar **verificação em duas etapas** nas contas do Google, Supabase e GitHub.
- **Incidentes:** tenha um plano escrito. Em caso de vazamento com risco relevante, é preciso comunicar a ANPD e os titulares (art. 48).
- **Chaves:** nunca coloque a chave `service_role` nem a senha do banco no projeto ou no GitHub.
- **Backups:** confira no seu plano do Supabase o que é incluído. Backups também precisam respeitar os prazos de retenção.

## 5. Configurações no painel do Supabase

1. **Authentication > Sign In / Providers:** Google aparece habilitado e Email desabilitado. Confirme que as credenciais OAuth estão corretas; o segredo fica no Supabase/Google, não em `config.js`.
2. **Authentication > URL Configuration:** o Site URL e os redirects de produção (`/` e `/admin/`) e desenvolvimento (`localhost:8000/` e `/admin/`) já foram cadastrados.
3. **Banco e Storage:** as tabelas e buckets esperados existem; a equipe inicial `jediael7@gmail.com` está cadastrada como administradora. Não rode os scripts de estrutura outra vez.
4. **Views públicas:** execute `supabase/sql/03_corrigir_views_publicas.sql` no SQL Editor. O primeiro teste pelo site encontrou falta de permissão nas views; o script mantém as tabelas base sem leitura pública direta.
5. **Região e backups:** ainda confirme em Project Settings a região efetiva e as opções de backup do plano.
6. **Tarefa agendada:** em Database > Extensions, ative `pg_cron` apenas se estiver disponível no plano e depois rode:

```sql
select cron.schedule('arquivar-imoveis', '0 * * * *', 'select public.arquivar_imoveis_vencidos()');
```

7. **Retenção de mensagens (exemplo para rodar somente depois que o advogado definir o prazo):**

```sql
-- anonimiza mensagens com mais de 12 meses, sem negócio vinculado
update public.mensagens m
   set nome = 'Titular anonimizado', telefone = null, email = null, detalhes = '{}'::jsonb
 where m.criado_em < now() - interval '12 months'
   and not exists (select 1 from public.negocios n where n.mensagem_id = m.id)
   and m.nome <> 'Titular anonimizado';
```

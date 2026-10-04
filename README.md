# ROMA Negócios Imobiliários

Site de imobiliária (vitrine de imóveis, busca, contato por WhatsApp e login com Google) e painel administrativo (imóveis, mensagens, clientes, vendas e locações, equipe).
É um projeto **estático**: HTML, CSS e JavaScript puros, sem build e sem dependências.

## Estrutura

```
index.html            Site público
config.js            URL/chave publishable do Supabase e WhatsApp. EDITE ESTE ARQUIVO
img/                 Logo
css/                 Estilos do site, um arquivo por parte da página
js/                  Scripts do site, um arquivo por função
shared/              Código usado pelo site e pelo painel (armazenamento, máscaras e integrações)
supabase/sql/        Scripts SQL para configuração e correções do banco Supabase
docs/privacidade/    Política de privacidade publicada e documentação interna LGPD
admin/
  index.html         Painel administrativo (endereço: /admin/)
  css/ js/           Estilos e scripts do painel, um arquivo por página
```

Onde mexer:

| Quero alterar...                          | Arquivo                         |
|-------------------------------------------|---------------------------------|
| Cores e fontes                            | `css/base.css`                  |
| Menu do topo e logo                       | `css/nav.css`, `js/nav.js`      |
| Carrossel e busca da página inicial       | `css/hero.css`, `js/carrossel.js`, `js/catalogo.js` |
| Cards dos imóveis                         | `css/imoveis.css`, `js/catalogo.js` |
| Página de detalhe do imóvel               | `css/detalhe.css`, `js/detalhe.js` |
| Formulário de contato                     | `css/modais.css`, `js/contato.js` |
| Login do cliente com Google               | `js/auth.js`                    |
| WhatsApp e IDs de login                   | `config.js`                     |
| Telas do painel                           | `admin/js/pagina-*.js`          |
| Permissões e login do painel              | `admin/js/acesso.js`            |

Os códigos de novos imóveis seguem o formato `RMAAAANNN` (por exemplo, `RM2026001`), sem hífens e com a sequência reiniciada em `001` a cada ano. Códigos antigos são mantidos. O site e o painel iniciam sem imóveis de exemplo; os imóveis aparecem na vitrine depois de cadastrados no painel. Os campos de valores nos formulários aceitam reais no padrão brasileiro (por exemplo, digitar `110000` exibe `1.100,00`), e os campos de telefone formatam números de celular enquanto são digitados. Nos formulários de endereço, ao informar os oito dígitos do CEP, os dados são consultados no ViaCEP e preenchidos automaticamente. Ao cadastrar um imóvel no painel, também são solicitados nome completo, CPF, RG, telefone e e-mail do anunciante. Esses dados ficam em um armazenamento separado do cadastro dos imóveis e não são carregados nem exibidos pelo site principal; são acessíveis pela equipe no painel ao editar o imóvel e fazem parte do backup administrativo. O cadastro aceita até 14 fotos de até 1,5 MB cada; fotos maiores são compactadas automaticamente, priorizando a qualidade visual. Durante o processamento, o painel mostra o progresso e bloqueia o salvamento até terminar. Também é possível informar um link opcional do YouTube. No detalhe público, as miniaturas podem ser percorridas pelas setas laterais. Colaboradores podem arquivar imóveis informando o motivo, mas somente administradores podem excluí-los. Imóveis vendidos ou alugados permanecem publicados por quatro dias após o registro do negócio e depois são arquivados automaticamente, deixando de aparecer na vitrine.

Clientes conectados podem favoritar imóveis na vitrine. Os favoritos ficam salvos por conta neste navegador, aparecem destacados no card e são priorizados no início da lista.

Em **Configurações > Design da página inicial**, administradores podem configurar até 10 imagens para o carrossel principal. Cada imagem é limitada a 10 MB; as maiores são compactadas automaticamente e o painel mostra o progresso. Depois de adicionar ou remover imagens, clique em **Salvar imagens** para publicar as alterações. As imagens são armazenadas no bucket `carrossel` do Supabase.

Na área **Notificações**, mensagens novas ficam compactas e só podem ser assumidas; os detalhes são expandidos pelo ícone de seta. Ao assumir, a mensagem sai da fila geral e passa para **Meus clientes**. Colaboradores veem apenas os próprios atendimentos, e administradores veem todos. Em Meus clientes, os filtros separam atendimentos em andamento, negociações concluídas e mensagens concluídas sem negócio. Para mensagens de pessoas que querem anunciar, a equipe pode cadastrar o imóvel ou encerrar a solicitação como sem negociação, registrando uma observação opcional. Ao salvar o imóvel cadastrado a partir de uma mensagem de anúncio, o atendimento é marcado como concluído com a tag **Anúncio criado** e aparece no filtro **Concluídos**. Colaboradores solicitam exclusões informando o motivo; administradores aprovam ou recusam essas solicitações. Mensagens vinculadas a uma venda concluída não podem ser excluídas, e a ação de exclusão fica oculta. Mensagens de compra podem ser convertidas em vendas vinculadas a um imóvel; para concluir, informe os dados do comprador e, opcionalmente, anexe arquivos PDF ou Word (DOC/DOCX) de até 1 MB cada. Ao editar uma venda em **Vendas e locações**, também é possível acrescentar vários arquivos nesses formatos sem remover os documentos já anexados. Em **Meus clientes > Concluídos**, os detalhes da venda e do comprador ficam visíveis ao abrir o atendimento; ícones PDF ou DOC no canto inferior direito permitem baixar os documentos. Como o projeto não possui backend, os documentos são armazenados localmente no navegador junto aos dados do negócio, não enviados a um servidor. Os dados do comprador ficam somente no painel, são adicionados a **Clientes cadastrados** e entram no backup administrativo. Ao registrar uma venda diretamente em **Imóveis**, também é possível selecionar um cliente cadastrado ou incluir seus dados pessoais. A venda fica atribuída ao responsável e marcada como concluída em **Meus clientes**. Vendas financiadas registram a entrada, a quantidade de parcelas e o valor de cada parcela, dados também exibidos na lista de negócios e no CSV exportado. Ao registrar uma venda ou locação, o colaborador fica identificado automaticamente; administradores podem escolher o próprio nome ou um colaborador como responsável. A aba **Clientes cadastrados** reúne compradores que se cadastraram no site, anunciantes associados aos imóveis e clientes registrados em vendas, identificando cada perfil com sua respectiva tag. As ações da lista de imóveis são representadas por ícones com descrições acessíveis. A edição de um negócio fica disponível por sete dias e é limitada ao colaborador responsável e aos administradores.

## Rodar no seu computador

O login com Google não funciona abrindo o arquivo com duplo clique. Use um servidor local:

```bash
python3 -m http.server 8000
```

Abra `http://localhost:8000` (site) e `http://localhost:8000/admin/` (painel).

## Login com Google pelo Supabase

O site e o painel iniciam o login Google pelo Supabase Auth. Cadastre as credenciais OAuth do Google em **Authentication > Sign In / Providers > Google** no Supabase; o segredo OAuth deve ficar somente no painel do provedor, nunca no repositório.

Em **Authentication > URL Configuration**, configure:

- Site URL: `https://jediael17.github.io/imobiliariaRoma/`
- Redirect URLs de produção: `https://jediael17.github.io/imobiliariaRoma/` e `https://jediael17.github.io/imobiliariaRoma/admin/`
- Redirect URLs locais: `http://localhost:8000/` e `http://localhost:8000/admin/`

Esses endereços já foram adicionados no painel deste projeto. Confirme também no Google Cloud Console o callback OAuth exibido pelo Supabase.

Para o banco já existente, execute uma vez `supabase/sql/03_corrigir_views_publicas.sql` no SQL Editor. O teste no site encontrou falta de permissão de leitura nas views públicas; essa migração ajusta as views sem conceder acesso público direto às tabelas privadas. **Não execute `supabase/sql/01_estrutura.sql` novamente.**

## Painel administrativo

- O painel não tem mais senha padrão local. O acesso exige login Google pelo Supabase e um e-mail ativo na tabela `public.equipe`.
- Em **Equipe**, um administrador pode cadastrar o e-mail e o papel de cada pessoa. O provedor Google do Supabase deve estar habilitado.
- A equipe não é excluída: administradores podem inativar ou reativar cada acesso. A inativação preserva os dados e históricos da pessoa e bloqueia novas sessões e sessões já abertas.
- Colaborador: lê mensagens, cadastra imóveis e registra vendas/locações. Não vê Configurações nem Equipe e não exclui clientes.
- As tabelas e registros do painel usam uma área de conteúdo mais larga; em **Imóveis**, o botão de registrar venda ou locação usa o ícone de dinheiro.

## Publicar no GitHub Pages

```bash
git init
git add .
git commit -m "Primeira versão do site da ROMA"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
git push -u origin main
```

No GitHub: **Settings > Pages > Build and deployment > Deploy from a branch > main / (root)**. O site fica em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/` e o painel em `.../admin/`.

## Estado da integração e produção

O site já lê imóveis e carrossel do Supabase, grava mensagens de contato, autentica contas de cliente/equipe com Supabase Auth e persiste favoritos e membros da equipe. O painel administrativo ainda mantém imóveis, clientes, negócios e parte do atendimento em armazenamento local do navegador. Ele exibe um aviso e **não deve ser usado com dados reais** até a migração restante dessas operações.

A política em `docs/privacidade/politica-de-privacidade.html` continua sendo uma minuta: os dados da empresa, contato do encarregado, região e prazos de retenção precisam ser preenchidos e revisados com orientação jurídica. Não colete CPF, RG ou documentos reais até concluir a migração do painel, testar as políticas RLS e publicar a política final.

As imagens padrão de alguns slides do carrossel são links externos e podem sair do ar. Para usar imagens próprias, configure-as em **Configurações > Design da página inicial**; utilize somente imagens que você tem direito de publicar.

# ROMA Negócios Imobiliários

Site de imobiliária (vitrine de imóveis, busca, contato por WhatsApp e login com Google) e painel administrativo (imóveis, mensagens, clientes, vendas e locações, equipe).
É um projeto **estático**: HTML, CSS e JavaScript puros, sem build e sem dependências.

## Estrutura

```
index.html            Site público
config.js            Configurações (ID do Google, WhatsApp). EDITE ESTE ARQUIVO
img/                 Logo
css/                 Estilos do site, um arquivo por parte da página
js/                  Scripts do site, um arquivo por função
shared/              Código usado pelo site e pelo painel (armazenamento, máscaras e integrações)
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

Em **Configurações > Design da página inicial**, administradores podem configurar até 10 imagens para o carrossel principal. Cada imagem é limitada a 10 MB; as maiores são compactadas automaticamente e o painel mostra o progresso. Depois de adicionar ou remover imagens, clique em **Salvar imagens** para publicar as alterações. Se nenhuma imagem estiver configurada, o carrossel fica vazio até que novas imagens sejam adicionadas. As imagens são armazenadas localmente no IndexedDB do navegador e não fazem parte do arquivo de backup comum.

Na área **Notificações**, mensagens novas ficam compactas e só podem ser assumidas; os detalhes são expandidos pelo ícone de seta. Ao assumir, a mensagem sai da fila geral e passa para **Meus clientes**. Colaboradores veem apenas os próprios atendimentos, e administradores veem todos. Em Meus clientes, os filtros separam atendimentos em andamento, negociações concluídas e mensagens concluídas sem negócio. Para mensagens de pessoas que querem anunciar, a equipe pode cadastrar o imóvel ou encerrar a solicitação como sem negociação, registrando uma observação opcional. Ao salvar o imóvel cadastrado a partir de uma mensagem de anúncio, o atendimento é marcado como concluído com a tag **Anúncio criado** e aparece no filtro **Concluídos**. Colaboradores solicitam exclusões informando o motivo; administradores aprovam ou recusam essas solicitações. Mensagens vinculadas a uma venda concluída não podem ser excluídas, e a ação de exclusão fica oculta. Mensagens de compra podem ser convertidas em vendas vinculadas a um imóvel; para concluir, informe os dados do comprador e, opcionalmente, anexe arquivos PDF ou Word (DOC/DOCX) de até 1 MB cada. Ao editar uma venda em **Vendas e locações**, também é possível acrescentar vários arquivos nesses formatos sem remover os documentos já anexados. Em **Meus clientes > Concluídos**, os detalhes da venda e do comprador ficam visíveis ao abrir o atendimento; ícones PDF ou DOC no canto inferior direito permitem baixar os documentos. Como o projeto não possui backend, os documentos são armazenados localmente no navegador junto aos dados do negócio, não enviados a um servidor. Os dados do comprador ficam somente no painel, são adicionados a **Clientes cadastrados** e entram no backup administrativo. Ao registrar uma venda diretamente em **Imóveis**, também é possível selecionar um cliente cadastrado ou incluir seus dados pessoais. A venda fica atribuída ao responsável e marcada como concluída em **Meus clientes**. Vendas financiadas registram a entrada, a quantidade de parcelas e o valor de cada parcela, dados também exibidos na lista de negócios e no CSV exportado. Ao registrar uma venda ou locação, o colaborador fica identificado automaticamente; administradores podem escolher o próprio nome ou um colaborador como responsável. A aba **Clientes cadastrados** reúne compradores que se cadastraram no site, anunciantes associados aos imóveis e clientes registrados em vendas, identificando cada perfil com sua respectiva tag. As ações da lista de imóveis são representadas por ícones com descrições acessíveis. A edição de um negócio fica disponível por sete dias e é limitada ao colaborador responsável e aos administradores.

## Rodar no seu computador

O login com Google não funciona abrindo o arquivo com duplo clique. Use um servidor local:

```bash
python3 -m http.server 8000
```

Abra `http://localhost:8000` (site) e `http://localhost:8000/admin/` (painel).

## Ativar o login com Google

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/) e crie (ou escolha) um projeto.
2. Em **APIs e serviços > Tela de permissão OAuth**, escolha **Externo**, preencha o nome do app e seu e-mail. Os escopos usados (`openid`, `email`, `profile`) são básicos e não exigem verificação do Google. Enquanto o app estiver em "Teste", adicione os e-mails que vão entrar em **Usuários de teste**; para liberar a qualquer pessoa, clique em **Publicar app**.
3. Em **Credenciais > Criar credenciais > ID do cliente OAuth**, tipo **Aplicativo da Web**.
4. Em **Origens JavaScript autorizadas**, adicione (somente o domínio, sem caminho e sem barra no final):
   - `https://SEU-USUARIO.github.io`
   - `http://localhost:8000` (para testar no seu computador)
5. Copie o **ID do cliente** (termina em `.apps.googleusercontent.com`) e cole em `config.js`, no campo `googleClientId`.
6. Faça commit e push. Em alguns minutos o botão **Entrar** do site e o botão **Google** do painel passam a funcionar.

Nunca coloque a "chave secreta do cliente" no projeto. Ela não é usada aqui.

### Login com Microsoft (opcional)

Registre um aplicativo no Azure (Microsoft Entra ID), tipo **Aplicativo de página única**, com URI de redirecionamento `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/admin/`. Cole o ID do aplicativo em `microsoftClientId` no `config.js`.

## Painel administrativo

- Primeiro acesso: usuário `admin` e senha `roma2026`. **Troque a senha em Configurações assim que entrar**, pois este repositório é público.
- Em **Equipe**, cadastre o e-mail de cada pessoa com o papel **Administrador** ou **Colaborador**. Elas entram pelos botões Google/Microsoft.
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

## Limitações importantes

Não há servidor. Imóveis cadastrados, dados pessoais dos anunciantes e dos clientes das vendas, mensagens, clientes, equipe e imagens do carrossel ficam no **navegador de quem usa** (localStorage/IndexedDB). Os dados pessoais de anunciantes e compradores ficam separados da lista pública, mas não são criptografados; qualquer pessoa com acesso ao navegador ou às ferramentas de desenvolvimento pode visualizá-los. Não use este armazenamento para dados pessoais sensíveis em produção. Por isso:

- Uma mensagem enviada por um cliente em outro aparelho não chega ao painel.
- A lista de equipe e os papéis não são compartilhados entre computadores.
- As regras de permissão organizam o trabalho, mas **não são segurança real**, pois rodam no navegador.

Para uso real, o próximo passo é ligar um serviço na internet (por exemplo Firebase ou Supabase), que oferece login com Google/Microsoft, banco de dados compartilhado e regras de acesso verificadas no servidor.

As imagens padrão de alguns slides do carrossel são links externos e podem sair do ar. Para usar imagens próprias, configure-as em **Configurações > Design da página inicial**; utilize somente imagens que você tem direito de publicar.

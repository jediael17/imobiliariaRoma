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
shared/              Código usado pelo site e pelo painel (armazenamento e imóveis de exemplo)
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
| Imóveis de exemplo                        | `shared/imoveis-exemplo.js`     |
| WhatsApp e IDs de login                   | `config.js`                     |
| Telas do painel                           | `admin/js/pagina-*.js`          |
| Permissões e login do painel              | `admin/js/acesso.js`            |

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
- Colaborador: lê mensagens, cadastra imóveis e registra vendas/locações. Não vê Configurações nem Equipe e não exclui clientes.

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

Não há servidor. Imóveis cadastrados, mensagens, clientes e equipe ficam no **navegador de quem usa** (localStorage). Por isso:

- Uma mensagem enviada por um cliente em outro aparelho não chega ao painel.
- A lista de equipe e os papéis não são compartilhados entre computadores.
- As regras de permissão organizam o trabalho, mas **não são segurança real**, pois rodam no navegador.

Para uso real, o próximo passo é ligar um serviço na internet (por exemplo Firebase ou Supabase), que oferece login com Google/Microsoft, banco de dados compartilhado e regras de acesso verificadas no servidor.

As fotos de alguns slides do carrossel são links de outros sites (`js/carrossel.js`) e podem sair do ar ou ter direitos reservados. Troque por fotos suas em `img/`.

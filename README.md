# Portal Institucional da Fundação Belfegor

Intranet ficcional para o RPG A Queda da Torre de Babel. Site estático em HTML, CSS e JavaScript.

## Desenvolvimento e publicação

Sirva a raiz do repositório com um servidor HTTP local, por exemplo `python -m http.server 8000`. As listagens consultam JSON por HTTP. No GitHub Pages, use a raiz da branch `main` como fonte e mantenha os caminhos relativos.

- `dados/comunicados.json` alimenta a capa e o Intercom. Insira avisos novos no início da lista.
- `dados/documentos.json` alimenta Arquivos e Terminal. Use códigos únicos e atualize a revisão ao substituir um documento.
- `dados/departamentos.json` mantém o diretório institucional.
- Coloque páginas de documentos em `documentos/` e imagens em `imagens/`.

O repositório é público. Publique somente materiais liberados para jogadores. Uma página ausente da navegação permanece acessível pelo endereço e pelo código-fonte.

O Registro Funcional está em `cadastro.html`. A ficha permanece no navegador, na chave `belfegor-ficha-v1`. Mantenha a mesma origem para aproveitar dados locais existentes. A exportação em JSON permite transportar a ficha entre origens ou navegadores.

A página Entrar aceita a ficha salva no navegador, backups JSON e documentos PNG/JPG antigos. Backups preenchem os dados automaticamente. Imagens são exibidas localmente para confirmação manual. A entrada por documento usa apenas a identificação e não modifica o Registro Funcional salvo. A sessão permanece no mesmo navegador após fechar a página e pode ser encerrada sem apagar a ficha. Patente e NA personalizam a orientação de circulação. Esse perfil é narrativo e editável no navegador. Não use os dados locais como autorização de acesso. A hospedagem estática não autentica jogadores nem restringe o acesso aos arquivos publicados.

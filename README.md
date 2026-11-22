# Portal Institucional da Fundação Belfegor

Intranet ficcional para o RPG A Queda da Torre de Babel. Site estático em HTML, CSS e JavaScript.

## Desenvolvimento e publicação

Sirva a raiz do repositório com um servidor HTTP local, por exemplo `python -m http.server 8000`. As listagens consultam JSON por HTTP. No GitHub Pages, use a raiz da branch `main` como fonte e mantenha os caminhos relativos.

- `dados/comunicados.json` alimenta o mural, o Intercom e a busca. Insira avisos novos no início da lista e use `edicao` com o valor `recente` ou `historico`. Use `referencia` para situar o aviso no expediente e `situacao` para indicar, por exemplo, Em vigor ou Encerrado.
- `dados/documentos.json` alimenta Biblioteca e Terminal. Use códigos únicos e atualize a revisão ao substituir um documento.
- Coloque páginas de documentos em `documentos/` e imagens em `imagens/`.

O repositório é público. Publique somente materiais liberados para jogadores. Uma página ausente da navegação permanece acessível pelo endereço e pelo código-fonte.

O Registro Funcional está em `cadastro.html`. A ficha permanece no navegador, na chave `belfegor-ficha-v1`. Mantenha a mesma origem para aproveitar dados locais existentes. A exportação em JSON permite transportar a ficha entre origens ou navegadores.

## Credenciais e perfis

O GM confere a ficha enviada pelo jogador e cadastra os dados fictícios aprovados em `dados/funcionarios.json`. Cada conta tem `usuario`, `nome`, `identificador`, `profissao`, `departamento`, `patente`, `acesso`, `ativo` e `emissao`. `avisos` é uma lista opcional. Informe a patente e o NA no formato G-0 a G-6 e NA-0 a NA-6.

Gere o código com `node scripts/emitir-credencial.mjs <chave-privada.pem> <usuario> <emissao>`. Entregue o código em privado. Guarde a chave de emissão em local privado. A chave pública do portal permite conferir os códigos emitidos.

Editar o perfil ou os avisos não altera o código. Para revogar o código de um funcionário, aumente `emissao` antes de gerar o próximo ou desative a conta. O navegador verifica o perfil atual ao consultar a sessão.

Veja as [regras de visibilidade editorial](dados/VISIBILIDADE.md). A interface aplica as regras narrativas em um site público. Publique somente conteúdo já liberado para jogadores.

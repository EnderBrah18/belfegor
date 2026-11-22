# Portal Institucional da Fundação Belfegor

Intranet ficcional para o RPG A Queda da Torre de Babel. Site estático em HTML, CSS e JavaScript.

## Desenvolvimento e publicação

Sirva a raiz do repositório com um servidor HTTP local, por exemplo `python -m http.server 8000`. As listagens consultam JSON por HTTP. No GitHub Pages, use a raiz da branch `main` como fonte e mantenha os caminhos relativos.

- `dados/comunicados.json` alimenta o mural, o Intercom e a busca. Insira avisos novos no início da lista e use `edicao` com o valor `recente` ou `historico`. Use `referencia` para situar o aviso no expediente e `situacao` para indicar, por exemplo, Em vigor ou Encerrado.
- `dados/documentos.json` alimenta Biblioteca e Terminal. Use códigos únicos e atualize a revisão ao substituir um documento.
- Coloque páginas de documentos em `documentos/` e imagens em `imagens/`.

O repositório é público. Publique somente materiais liberados para jogadores. Uma página ausente da navegação permanece acessível pelo endereço e pelo código-fonte.

O Registro Funcional está em `cadastro.html`. A ficha permanece no navegador, na chave `belfegor-ficha-v1`. Mantenha a mesma origem para aproveitar dados locais existentes. A exportação em JSON permite transportar a ficha entre origens ou navegadores.

## Perfis fictícios

Cadastre os perfis de jogadores e de puzzles em `dados/funcionarios.json`. Os dois tipos usam o mesmo formulário de entrada. Cada objeto tem `usuario` no formato nome.sobrenome, `senha` de jogo em texto comum, `nome`, `identificador`, `profissao`, `departamento`, `patente`, `acesso` e `ativo`. `avisos` é opcional. Use G-0 a G-6 e NA-0 a NA-6 no perfil aprovado.

Se quiser encerrar sessões existentes ao trocar a senha fictícia, incremente também `revisao`, que começa em 1. Alterações de patente, NA, setor ou avisos mantêm a senha e a sessão.

Usuários e senhas de jogo são dados ficcionais públicos, editados diretamente no JSON. Nunca use a senha de um serviço real. A entrada serve para selecionar perfis da campanha. Veja as [regras de visibilidade editorial](dados/VISIBILIDADE.md).

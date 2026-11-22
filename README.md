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

## Emitir uma credencial

O jogador preenche o Registro Funcional, baixa o crachá e a ficha e envia os documentos ao GM. O GM registra os dados aprovados em `dados/funcionarios.json`, com um objeto por funcionário.

Execute `node scripts/emitir-credencial.mjs` para gerar uma senha exclusiva do RPG. Entregue o usuário e a senha em privado. Copie somente o verificador para o cadastro.

| Campo | Valor |
| --- | --- |
| `usuario` | Usuário único em minúsculas |
| `verificador` | Verificador gerado pelo script |
| `nome`, `identificador`, `profissao` | Dados fictícios da ficha aprovada |
| `patente`, `acesso` | Códigos como G-2 e NA-3 |
| `ativo` | Booleano. Use false para desativar |
| `avisos` | Lista opcional de mensagens |

Publique as alterações de perfil para aplicá-las na próxima consulta do portal. Se o verificador mudar, o jogador precisará entrar com a nova credencial. Salvar ou editar uma ficha no navegador não altera o cadastro aprovado.

O portal é estático. Os perfis, verificadores e avisos são visíveis no repositório público. Use apenas dados fictícios e senhas longas geradas para uso exclusivo no RPG. A credencial aplica regras narrativas e não protege arquivos ou mensagens confidenciais.

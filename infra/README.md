# Ativação do acervo restrito

O GitHub Pages serve a interface. O Supabase valida as contas e entrega somente os blocos liberados para a identidade autenticada. O perfil local do portal não participa da autorização.

1. No projeto Supabase, desabilite o cadastro público. Crie as contas aprovadas em Authentication e informe aos jogadores como definir a senha. Use a conta do projeto para administrar, nunca a chave publicável.
2. Execute uma vez `acervo-restrito.sql` como administrador. Cadastre cada UUID de Authentication em `belfegor_private.funcionarios`. Preencha profissão, departamento, patente e NA conforme a ficha e marque `ativo` quando aprovado.
3. Em `js/acervo-config.js`, use apenas a URL HTTPS do projeto e a chave `sb_publishable_`. Nunca adicione senhas nem chaves administrativas ao GitHub.
4. Cadastre documentos e blocos no banco. Cada bloco admite NA mínimo e, opcionalmente, departamento. As imagens binárias aceitas são PNG, JPG e WebP até 2 MB por bloco. O campo `publicado` libera o documento. `listado` só controla o catálogo. A tabela `bloqueios` suspende a consulta por funcionário e documento.
5. Antes de liberar conteúdo, teste com uma conta sem aprovação, uma com NA baixo, outra com NA autorizado e um funcionário bloqueado. Revogue uma permissão e repita a consulta na mesma sessão. Verifique também que consultas diretas às tabelas falham com as credenciais da aplicação.

O link de um documento usa `consulta-restrita.html?codigo=CODIGO`. O banco aplica o perfil vigente a cada consulta. Tarjas e indicações de restrição chegam sem o texto ou bytes protegidos. Não adicione os documentos restritos ao GitHub Pages. Uma pessoa autorizada pode guardar uma cópia do que já consultou.

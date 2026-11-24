# Visibilidade no portal

Uma entrada sem `visibilidade` aparece para todos. Com `visibilidade`, precisa de uma conta ativa e os critérios informados são cumulativos.

Exemplo: `{"naMinimo":2,"patenteMinima":2,"departamentos":["Pesquisa e Ciência"]}`

Use `{"naExato":6}` para mostrar uma entrada apenas a NA-6. Use `naMinimo` quando níveis superiores também puderem consultar. Para patente, use `patenteExata` ou `patenteMinima`. O filtro aceita G-0 a G-6 e NA-0 a NA-6. Os níveis 5 e 6 são atribuídos pelo GM e ficam fora das opções do jogador no formulário.

Mantenha a mesma regra para um comunicado e o documento vinculado. Na página de um documento de consulta limitada, indique o código do catálogo em `data-documento` e inclua a mensagem com `data-documento-estado`. A lotação vem do campo `departamento` no perfil aprovado pelo GM.

A visibilidade é narrativa. Publique apenas conteúdo que possa ser lido publicamente.

A conta ativa do Administrador, com G-7 e NA-7 simultâneos, consulta todos os itens do portal, inclusive os com critérios exatos ou de departamento. A combinação é reservada ao Administrador e fica fora do formulário de cadastro.

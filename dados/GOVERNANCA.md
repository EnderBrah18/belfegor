# Governança no portal estático

O arquivo `governanca.json` reúne os atos publicados. Sem um ato institucional vigente, o painel usa RGI-01 como referência. A referência não se transforma em um registro histórico.

BF-00000, com G-7 e NA-7, pode preparar uma prévia no próprio navegador. Para publicá-la, exporte o registro e revise as alterações em relação ao arquivo atual antes de atualizar `dados/governanca.json` no repositório. Uma prévia antiga pode ter sido criada sobre um expediente anterior. Descarte a prévia após a publicação para voltar a acompanhar o registro da rede.

Atos setoriais usam o campo `departamento` do perfil. Atos locais usam `instalacao` e atos regionais usam `regiao`; esses campos opcionais devem ser preenchidos no perfil quando o vínculo estiver definido. Os nomes dos vínculos devem coincidir com os registrados no ato. Atos aplicáveis aparecem lado a lado, com as competências descritas em cada ato.

Os comunicados selecionados na gestão são gerados a partir do registro publicado e respeitam a abrangência e a classificação. A projeção pública de um ato classificado usa só seus campos públicos e o regime correspondente escolhido. Os filtros são narrativos. Qualquer arquivo publicado no GitHub Pages pode ser lido fora da interface. Mantenha informações efetivamente secretas fora do repositório público.

Uma integração com backend pode substituir a leitura e validação do JSON, a projeção por credencial e a publicação manual. A sessão atual é fictícia e o armazenamento local se limita à prévia.

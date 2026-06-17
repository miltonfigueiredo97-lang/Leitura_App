# BookLegacy App v7.3 - Syntax Hotfix

Correção do erro `Uncaught SyntaxError: Invalid or unexpected token` que travava o carregamento.

Também adiciona proteção para `ddSetModo` caso a função antiga não esteja disponível no momento do load.

Suba o conteúdo desta pasta no GitHub e aguarde o deploy da Vercel.


## V7.5 - Comunidade e amigos
- Nova aba/botão Comunidade.
- Lista de amigos aceitos.
- Buscar usuários por nome/e-mail/UID via publicProfiles.
- Adicionar Daniel rapidamente pelo UID informado.
- Convite por link continua disponível.
- Modo Batalha só aparece quando há amigo aceito.

Publique FIRESTORE_RULES_V7_5.txt no Firestore Rules.


## V7.6
- Adiciona aba/botão 📥 Migração no próprio app.
- Permite importar `booklegacy-daniel-migration.json` logado na conta Google do Daniel.
- Mantém Comunidade, lista de amigos, convite por link e Modo Batalha por amizade aceita.

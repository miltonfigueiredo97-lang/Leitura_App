# BookLegacy V3.61 — UID real + pausa real + migração segura

Correções desta versão:

1. A renderização de **Lendo / Pausado / Dica de Leitura** agora usa o bundle do UID visualizado (`raw.users[].uid`) e não mistura listas globais ou nome do usuário.
2. Pausado antigo/importado não é mais feature: vira **Lendo** se houver página/sessão, ou **Aguardando** se não houver leitura iniciada.
3. Pausar é uma ação nova do app: botão pequeno **⏸️** em livros lendo; botão **▶️** em pausados.
4. Dica de Leitura ganhou **+ Registrar sessão** apenas para o próprio usuário.
5. Perfil visitante fica sem edição: sem +, sem registrar sessão, sem pausar, sem editar, sem avaliar, sem excluir, sem importar.
6. Migração foi substituída por modal seguro V3.61: não usa `id: undefined`, não exibe UID, não recarrega automaticamente e grava tudo dentro de `users/{uid-da-conta-logada}`.
7. O importador V3.61 limpa as coleções do usuário logado antes de importar quando a opção estiver marcada.

Teste no console:

```js
blV61Audit()
```

O retorno não mostra UID aberto; mostra apenas `uidVisible: "oculto"`, perfil, canEdit e contagens.

Ordem recomendada:

1. Substituir `index.html` e `mobile.html`.
2. Fazer deploy.
3. Recarregar o app limpando cache.
4. Conferir se o botão está como **📥 Migração segura**.
5. Rodar `blV61Audit()` e confirmar `patch: BOOKLEGACY_V3_61_UID_RENDER_PAUSE_MIGRATION_SAFE`.
6. Entrar na conta do Daniel e importar o JSON V3.61.

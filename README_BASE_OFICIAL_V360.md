# BookLegacy V3.60 — Pausar/Despausar real + Dica com sessão

Esta versão parte da V3.59 e corrige a regra do status **Pausado**.

## Regra nova

- `Pausado` antigo vindo de planilha/importação **não é mais considerado feature válida**.
- Só aparece como **Pausado** quando o próprio app grava:
  - `status: "Pausado"`
  - `pauseState: "paused"`
  - `statusSource: "booklegacy_app_pause"`
  - `pausedAt`

Assim, livro incompleto antigo com página/sessão vira **Lendo** até o usuário pausar pelo app.

## O que entrou

1. Botão pequeno **⏸️** no card de livro **Lendo**.
2. Ao clicar, o livro muda para **Pausado** e sai do bloco Lendo para o bloco Pausado.
3. No card **Pausado**, aparece botão **▶️** para voltar para Lendo.
4. Dica de leitura agora tem **+ Registrar sessão**, somente no próprio perfil.
5. Perfil de amigo continua sem botões de edição.
6. O app limpa pausados legados da conta logada: se eram pausados antigos sem marca do app, grava como **Lendo** ou **Aguardando**.
7. Importação também remove pausados legados antes de gravar.
8. Debug não mostra UID limpo; IDs ficam ocultos.

## Teste rápido

No console:

```js
blV60Audit()
```

Deve retornar `patch: "BOOKLEGACY_V3_60_PAUSE_DICA_UID_SAFE"`.

## Ordem de uso

1. Substituir `index.html` e `mobile.html`.
2. Fazer deploy.
3. Entrar no próprio usuário.
4. Ver os livros em Lendo.
5. Clicar no botão **⏸️** para pausar.
6. Conferir que em perfil de amigo não aparece pausa, registrar sessão, + ou edição.

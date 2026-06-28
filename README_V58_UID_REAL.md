# BookLegacy V3.58 — UID real / multiusuário profissional

Esta versão corrige a arquitetura de visualização e edição:

- `authUid` = UID da conta Google logada. É o único UID que pode gravar.
- `viewUid` = UID do perfil que está sendo exibido.
- `canEdit = authUid === viewUid`.

## Correções principais

1. Perfil de amigo é somente leitura de verdade:
   - some botão `+`;
   - some FAB/menu de ação;
   - some Registrar Sessão, Avaliar, Editar, Excluir, Salvar, Importar;
   - mesmo que algum botão apareça por bug visual, a função é bloqueada.

2. Cada perfil lê dados pelo UID:
   - `users/{viewUid}/library`
   - `users/{viewUid}/sessions`
   - `users/{viewUid}/ratings`
   - `users/{viewUid}/goals`
   - `users/{viewUid}/collections`

3. Cada gravação usa o UID logado:
   - `users/{authUid}/...`

4. A migração V3.58 não faz merge por cima de sujeira anterior.
   Antes de importar, ela limpa as subcoleções da conta logada:
   - `library`
   - `sessions`
   - `ratings`
   - `goals`
   - `collections`

   Depois grava tudo de novo no UID da conta Google logada.

5. O ranking usa a média dos critérios da avaliação.

6. O JSON do Daniel é exclusivo do Daniel e não contém dados literais do Milton.

## Atenção

Para corrigir a base suja do Daniel, entre logado na conta do Daniel e importe o JSON desta pasta.
Como a V3.58 limpa a conta logada antes de importar, não use o JSON do Daniel logado na conta do Milton.

## Debug

No console do navegador, rode:

```js
blV58Audit()
```

Ele mostra:

- UID logado (`authUid`)
- UID visualizado (`viewUid`)
- se a tela permite edição (`canEdit`)
- quantos livros/sessões/notas cada usuário carregado possui
- quais livros aparecem em Lendo para a tela atual

## Regras do Firestore

O arquivo `firestore_rules_uid.txt` traz uma regra mínima recomendada para impedir escrita em dados de outro usuário.

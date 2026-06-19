# BookLegacy V12.22 — Battle single UID selector

Correção sobre a V12.21:
- remove seletores duplicados antigos do Modo Batalha;
- mantém apenas um seletor de adversário;
- mantém comparação 1x1;
- mantém seleção por UID do Firebase;
- não mexe em Firebase/login/banco.

Debug esperado:
```js
blBattleDebug()
```
`patch: "v12.22-battle-single-uid-selector"` e `selectorCount: 1`.

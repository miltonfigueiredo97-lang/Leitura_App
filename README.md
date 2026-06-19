# BookLegacy V12.7 — Original Battle Multi Realfix

Base: V12.1 verified marker.

Mudança feita somente no Modo Batalha:
- mantém o `#pageBatalha` e o `renderBatalha()` original;
- adiciona seleção de 2+ players por checkbox;
- compara múltiplos players usando o visual original em pares;
- adiciona botão "Voltar para meus dados";
- esconde livros em andamento/topo apenas dentro do Modo Batalha;
- corrige `blProfileLabel(null)` para não travar login.

Debug no console:
```js
blBattleDebug()
```
Esperado:
```js
{ patch: 'v12.7-original-battle-multi-realfix', marker: true }
```

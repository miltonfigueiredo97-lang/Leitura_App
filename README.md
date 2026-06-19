# BookLegacy V3.6 — Desktop restaurado + Mobile funcional seguro

Esta versão corrige o erro da V3.5 onde alterações mobile afetaram o desktop e zeraram dados.

## Correções
- Desktop restaurado para a base estável V3.0.
- Mobile mantém a mesma base funcional do desktop: Firebase, login, banco, comunidade, amigos e batalha.
- Corrigido `blProfileLabel is not defined` no mobile.
- Barra inferior mobile removida.
- Menu mobile compacto mantido.
- Projeto Android/APK continua no mesmo repositório.

## Teste
No desktop: abrir a raiz `/`.
No celular: abrir `/mobile.html`.
No console mobile:
```js
blMobileDebug()
```
Esperado: `patch: "v3.6-mobile-fullfunc-safe"` e `profileLabel: "function"`.

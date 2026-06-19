# BookLegacy V3.13 — PATCH MOBILE ONLY (SEM INDEX)

Este pacote NÃO contém `index.html`.

Arquivos alterados:
- `mobile.html`

Correções:
- remove Daniel do menu mobile;
- remove barra inferior mobile;
- menu agora é lista organizada, não grade bagunçada;
- quando o menu abre, quem rola é o menu, não o fundo;
- botão Comunidade tenta `blOpenCommunityModal`, `abrirComunidade`, `openCommunity`, `toggleCommunity` e fallback no botão real;
- não mexe no desktop;
- não mexe no Firebase, login, dados, comunidade ou batalha.

Teste:
```js
blMobileDebug()
```
Esperado:
- `patch: "v3.13-mobile-menu-fix-no-index"`
- `noIndex: true`
- `danielInMenu: false`
- `bottomNav: false`

# BookLegacy V3.11 — Desktop congelado + Mobile layout-only

- `index.html` é a base desktop estável e NÃO redireciona automaticamente para mobile.
- `mobile.html` usa a mesma base funcional, mas com CSS/menu mobile no final.
- `vercel.json` removeu o redirect por User-Agent; desktop em `/`, mobile somente em `/mobile.html`.
- APK Android deve abrir `/mobile.html?app=android&v=3.11`.

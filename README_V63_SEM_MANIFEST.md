# BookLegacy V3.63 - rollback sem mexer em manifest/PWA

Este pacote foi montado para corrigir a cagada da V3.62: ele NÃO inclui `manifest.json`, NÃO inclui `sw.js` e NÃO inclui `vercel.json`.

Arquivos neste pacote:
- `index.html`
- `mobile.html`
- `booklegacy-daniel-migration.json`
- `README_V63_SEM_MANIFEST.md`

Importante:
- Não apague o `manifest.json` antigo do repositório.
- Não apague o `sw.js` antigo do repositório.
- Não substitua `vercel.json` por nada deste pacote.
- Substitua somente `index.html` e `mobile.html`.

Sobre o erro de login `auth/unauthorized-domain`:
- Isso não é resolvido por HTML.
- O domínio usado no deploy precisa estar autorizado em Firebase Console > Authentication > Settings > Authorized domains.
- Se estiver usando link preview da Vercel que muda a cada deploy, o erro pode voltar em cada novo domínio.

Sobre os erros de manifest/CORS:
- Este pacote não altera o manifest nem o service worker.
- Se o erro persistir, verificar se o `manifest.json` antigo ainda existe no repositório e se a Vercel não está protegendo o preview com SSO.

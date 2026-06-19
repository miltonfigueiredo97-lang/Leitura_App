# BookLegacy V3.15 — Mobile + APK GitHub completo (sem index.html)

Este pacote é para subir no mesmo repositório `Leitura_App`.

## Importante
Este ZIP **não contém `index.html`**.
O desktop não deve ser substituído.

## Arquivos incluídos
- `mobile.html` — correção mobile atual.
- `.github/workflows/build-apk.yml` — workflow para gerar APK no GitHub Actions.
- `android/` — projeto Android WebView para gerar APK.
- `README.md` — este arquivo.

## Como subir pelo GitHub Desktop
1. Extraia este ZIP.
2. Copie `mobile.html`, `.github/`, `android/` e `README.md` para a raiz do repositório `Leitura_App`.
3. No GitHub Desktop, confira que **não existe `index.html`** nas alterações deste pacote.
4. Commit: `V3.15 mobile apk workflow`.
5. Clique em `Push origin`.

## Como gerar o APK
1. Abra o GitHub no navegador.
2. Entre no repositório `Leitura_App`.
3. Clique em `Actions`.
4. Clique em `Build Android APK`.
5. Clique em `Run workflow`.
6. Aguarde terminar.
7. Abra a execução concluída.
8. Baixe o artifact `BookLegacy-v3-15-debug-apk`.
9. Extraia o ZIP baixado e instale `app-debug.apk` no Android.

## URL usada pelo APK
O APK abre:

`https://leitura-app-theta.vercel.app/mobile.html?app=android&v=3.15`

Então o APK usa o mesmo Firebase/Firestore do site. Dados alterados no APK aparecem no site, e dados alterados no site aparecem no APK.

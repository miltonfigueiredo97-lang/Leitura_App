# BookLegacy Android APK — V3.2

Projeto Android real para gerar APK do BookLegacy.

## Como ele abre no celular
Este APK abre uma WebView Android apontando diretamente para:

`https://leitura-app-theta.vercel.app/mobile.html?app=android&v=3.3`

Ou seja: o visual do app no celular será o `mobile.html` publicado na Vercel. Por isso, primeiro suba o pacote web V3.2 com o mobile formatado. Depois gere o APK.

## Gerar APK pelo GitHub
1. Crie ou use um repositório Android.
2. Suba o conteúdo interno deste ZIP.
3. Vá em `Actions`.
4. Rode `Build Android APK`.
5. Baixe o artefato `BookLegacy-v3-debug-apk`.
6. Instale o `app-debug.apk` no celular.

## Observação
O APK é um app Android de verdade, mas usa WebView para carregar o app publicado. Isso mantém Firebase/Google Login funcionando pelo domínio autorizado da Vercel.

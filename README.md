# BookLegacy V3.17 — APK Android com login Google nativo

Este pacote é COMPLETO e contém o site + app Android híbrido profissional.

## Regra deste pacote

- `index.html` está incluído, mas está CONGELADO/igual ao desktop estável da V3.16.
- As mudanças reais estão em:
  - `mobile.html` — ponte de login nativo para o APK.
  - `android/` — app Android com WebView + Google Sign-In nativo.
  - `.github/workflows/build-apk.yml` — build do APK no GitHub Actions.

## O que o APK faz

O APK é um app Android instalado de verdade. Ele NÃO abre o Chrome como tela principal.
Ele abre uma WebView interna com a interface mobile do BookLegacy e usa o mesmo Firebase do site.

Quando o usuário toca em “Entrar com Google” dentro do APK:

1. O app Android abre o Google Sign-In nativo do Android.
2. O Android recebe o ID Token do Google.
3. O app injeta esse token com segurança no `mobile.html`.
4. O `mobile.html` autentica no Firebase usando `signInWithCredential`.
5. O dashboard carrega os mesmos dados do site.

## Configuração obrigatória do Firebase

Antes de gerar o APK final, você precisa configurar o Web Client ID.

Arquivo:

```txt
android/app/src/main/res/values/booklegacy_config.xml
```

Troque:

```txt
PASTE_FIREBASE_WEB_CLIENT_ID_HERE.apps.googleusercontent.com
```

pelo Web Client ID real do seu Firebase/Google Cloud.

O formato é parecido com:

```txt
123456789012-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

## Package name do app

```txt
com.booklegacy.app
```

## SHA-1 fixo do APK de teste

Use este SHA-1 no Firebase para o app Android `com.booklegacy.app`:

```txt
D5:53:93:A2:30:62:78:5B:F2:54:CF:0A:9D:AC:A5:02:3A:50:46:06
```

Também pode cadastrar o SHA-256:

```txt
5A:54:4A:8B:D5:5B:A9:CF:6D:B5:83:EB:04:46:D3:AE:EB:1F:28:A3:97:1E:66:06:5A:26:08:9D:10:92:B5:C9
```

## Como gerar o APK no GitHub

1. Copie todos os arquivos deste ZIP para a raiz do repositório `Leitura_App`.
2. No GitHub Desktop, confira que o `index.html` não teve mudança real.
3. Commit: `V3.17 Android native login fix`.
4. Push origin.
5. No GitHub online, vá em `Actions`.
6. Clique em `Build Android APK`.
7. Clique em `Run workflow`.
8. Baixe o artifact `BookLegacy-v3-17-native-login-debug-apk`.
9. Extraia o ZIP do artifact.
10. Instale `app-debug.apk` no Android.

## Debug no APK

Dentro do app, no console remoto do WebView, existe:

```js
blAndroidDebug()
```

Ele retorna:

```txt
patch: v3.17-android-native-login-bridge
nativeBridge: true
androidFlag: true
```

Se `nativeBridge` for `false`, o app não está usando a versão Android V3.17.

## Observação importante

Este APK ainda reaproveita a interface mobile do `mobile.html`, porque essa é a forma correta para manter site e app com a mesma visualização e as mesmas features sem duplicar telas.

A diferença da versão anterior é que o login Google NÃO roda dentro da WebView. Ele roda no Android nativo e depois autentica o Firebase dentro da interface mobile.

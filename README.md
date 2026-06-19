# BookLegacy V3.3 — Mobile funcional + APK no mesmo repositório

Esta versão mantém o desktop e o mobile com a mesma base funcional.

## Correções principais
- `mobile.html` agora usa o mesmo código funcional do desktop.
- Corrige erro `blProfileLabel is not defined`.
- Comunidade, Firebase, login, amigos e Batalha ficam disponíveis no mobile.
- Mobile recebe apenas formatação responsiva, baseada no layout mobile de referência.
- Projeto Android fica dentro da pasta `/android`, no mesmo repositório.
- GitHub Actions para gerar APK em `.github/workflows/build-apk.yml`.

## Fluxo
Suba tudo no mesmo repositório `Leitura_App`.
Vercel continua usando a raiz para o site.
GitHub Actions usa a pasta `/android` para gerar o APK.

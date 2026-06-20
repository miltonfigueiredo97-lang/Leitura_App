# BookLegacy V3.24 — Mobile/APK polish fix

Pacote focado somente em mobile/APK.

Inclui:
- mobile.html
- vercel.json
- android/gradle.properties
- android/app/src/main/java/com/booklegacy/app/MainActivity.java

Não inclui e não altera:
- index.html
- android/app/google-services.json
- android/app/src/main/res/values/booklegacy_config.xml
- .github/workflows/build-apk.yml

Correções principais:
- Ranking completo com filtros organizados, números 1/2/3 e nota alinhada.
- Busca do Progresso por Livro reamarrada usando todas as bases de livros disponíveis.
- Header mobile/APK com “SEU DASHBOARD DE LEITURA”, foto e nome do usuário.
- Modal Todas as Conquistas compacto e legível no celular.
- Artefatos/Maldições em duas capas lado a lado, com título embaixo.
- Competição por Gêneros presa dentro do quadro.
- Mobile usando a mesma base visual do APK.
- Comunidade com abertura mais estável no APK.
- Cache automático do APK atualizado para 3.24.

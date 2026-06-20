# BookLegacy V3.26 — Mobile/APK careful final fix

Arquivos incluídos:
- mobile.html
- vercel.json
- android/gradle.properties
- android/app/src/main/java/com/booklegacy/app/MainActivity.java
- README.md

Não inclui e não altera:
- index.html
- android/app/google-services.json
- android/app/src/main/res/values/booklegacy_config.xml
- .github/workflows/build-apk.yml

Correções principais:
- Ranking completo: botão X clicável e menu de três traços oculto dentro do modal.
- Detalhes do Livro: busca por texto com lista de livros próximos; seleciona o livro e abre os detalhes.
- Todas as conquistas: modal mobile reformatado com linhas compactas.
- Artefatos/Maldições: título, nota e ano ficam abaixo de cada capa.
- Competição por gêneros: refeito para usar o quadro como referência e não sair dele.
- Mobile web recebe a mesma classe/base visual do APK.
- Comunidade/Batalha: menu interceptado sem delay usando data-a próprio, painel com scroll interno e sem travar fundo.
- Correção de travamento: blUnlockApp() limpa locks/overlays se algo prender.
- APK atualizado para cache guard v3.26.

Teste:
- blMobileDebug()
- blAndroidCacheDebug()
- blUnlockApp()

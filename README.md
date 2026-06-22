# BookLegacy V3.27 — correção pontual mobile/APK

Arquivos incluídos:
- mobile.html
- vercel.json
- README.md

Não inclui e não altera:
- index.html
- android/app/google-services.json
- android/app/src/main/res/values/booklegacy_config.xml
- .github/workflows/build-apk.yml

Correções:
- filtros do Ranking Completo aplicados de verdade;
- pesquisa de Detalhes do Livro com lista de sugestões e seleção;
- menu de três traços reseta sempre no topo ao abrir;
- mobile sem rolagem lateral, usando a mesma base visual do APK;
- conquistas principais restauradas sem esmagar;
- modal Ver Todas as Conquistas compacto;
- artefatos/maldições com textos embaixo;
- competição por gêneros refeita para usar a largura do quadro.

Debug esperado:
blMobileDebug().patch = v3.27-targeted-no-new-regression

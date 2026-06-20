# BookLegacy V3.22 — Mobile/APK layout + scroll lock real

Arquivos incluídos:
- mobile.html
- vercel.json
- android/gradle.properties
- android/app/src/main/java/com/booklegacy/app/MainActivity.java

Não incluído / não alterado:
- index.html
- android/app/google-services.json
- android/app/src/main/res/values/booklegacy_config.xml
- .github/workflows/build-apk.yml

Correções focadas no que ainda ficou pendente:
- Comunidade: mantém layout mobile e agora o scroll fica dentro do modal, não no fundo.
- Ranking por Notas: lista reorganizada com capa, título e nota alinhados.
- Gêneros Lidos: restaurado como gráfico Chart.js original, só corrigindo largura/altura.
- Progresso por Livro: busca reamarrada por input/click/touch e canvas preso ao quadro.
- Gerenciar Meta: rodapé levantado para não ficar atrás da barra inferior do celular.
- Registrar Sessão: scroll lock real; fundo travado e popup rolando por dentro.
- Header mobile/APK: afastado da área de relógio/bateria/câmera.
- Batalha: conquistas, artefatos/maldições e competição por gêneros ajustados ao celular.
- Watchdog de overlays: reduz travamento por popup/overlay fantasma.
- Cache APK mantido: MainActivity usa v=322 e LOAD_NO_CACHE.

Debug no mobile/APK:
- blMobileDebug()
- blAndroidCacheDebug()
- blUnlockApp()  // emergência se algum overlay travar interação

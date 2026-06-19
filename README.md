# BookLegacy V3.21 — revisão dos pontos pendentes + cache automático APK

Arquivos incluídos neste pacote:

- `mobile.html`
- `vercel.json`
- `android/app/src/main/java/com/booklegacy/app/MainActivity.java`
- `android/gradle.properties`
- `README.md`

Arquivos NÃO incluídos / NÃO alterados:

- `index.html` — desktop não foi mexido neste pacote.
- `android/app/google-services.json` — mantém o Firebase que você já configurou.
- `android/app/src/main/res/values/booklegacy_config.xml` — mantém o Web Client ID que você já colou.
- `.github/workflows/build-apk.yml` — mantém o workflow atual.

Correções V3.21:

- Comunidade mobile/apk: adapta à largura do celular, sem cortar metade.
- Ranking por Notas: card e linhas ajustados ao tamanho da tela.
- Dia da Semana e Livros por Mês: barras re-renderizadas para caber no card.
- Gêneros Lidos: substituído por lista mobile legível, sem dados brancos/cortados.
- Coleções/Autores favoritos: donuts forçados em área quadrada menor, sem oval e sem invadir texto.
- Progresso por Livro: busca reescrita para mobile e gráfico sem min-width lateral.
- Calendário: células quadradas com texto simples, exemplo `32 páginas`.
- Batalha: remoção do min-width antigo e grids adaptados ao celular.
- Gerenciar Meta: lista com rolagem própria e botões de salvar/cancelar fixos no rodapé do popup.
- Registrar Sessão/modal: fundo fica travado; rolagem acontece dentro do popup.
- Cache APK: WebView carrega `mobile.html` com parâmetro novo e sem cache; Vercel manda `mobile.html` com `no-store`.

Depois de subir, para mobile web basta aguardar Vercel publicar. Para o APK, por causa da correção nativa de cache, gere um APK novo no GitHub Actions uma vez.

Debug após publicar:

```js
blMobileDebug()
blAndroidCacheDebug()
```

Esperado no mobile:

```txt
patch: "v3.21-mobile-apk-final-layout-cache"
cacheGuard: "v3.21"
```

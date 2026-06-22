# BookLegacy V3.28 — targeted real fix

Arquivos alterados:

- mobile.html
- vercel.json
- README.md

Não altera:

- index.html
- android/
- google-services.json
- booklegacy_config.xml
- .github/workflows/build-apk.yml

Correções:

- Ranking completo: mantém filtros e pré-carrega capas para reduzir travamento ao filtrar.
- Detalhes do Livro: busca real por sugestão. Digita, aparece lista, seleciona e abre detalhes.
- Competição por gêneros: reconstrói o bloco dentro do quadro, sem sair para fora.
- Mobile: força largura fluida, sem rolagem lateral.
- Menu três traços: sempre reabre no topo.
- Todas as conquistas: formatação compacta só dentro do modal, sem quebrar o menu principal.

Debug esperado:

```js
blMobileDebug()
```

patch: `v3.28-targeted-real-fix`

# BookLegacy V3.14 — MOBILE ONLY / NO INDEX

Este patch é somente para `mobile.html`.

Arquivos incluídos:
- mobile.html
- README.md

Não inclui `index.html`.
Não altera desktop.
Não altera Firebase, banco, comunidade, Batalha ou lógica de dados.

Correções:
- menu mobile: o fundo não deve mais rolar quando o menu está aberto;
- botões de navegação do menu corrigidos para scroll direto por `[data-msection]`;
- barra inferior antiga removida por HTML/CSS/JS;
- Ranking por Notas: formatação mobile ajustada sem alterar dados internos;
- Dia da Semana & Livros por Mês: barras mantidas dentro do card;
- Calendário: grid compacto sem corte lateral;
- Gêneros Lidos: canvas responsivo sem largura gigante;
- referência usada: mobile(2).html apenas para padrão visual desses blocos.

Debug esperado no mobile:

```js
blMobileDebug()
```

Retorno esperado:

```js
{
  patch: "v3.14-mobile-menu-scroll-chart-fix-no-index",
  noIndex: true,
  bottomNav: false,
  danielInMenu: false,
  cards: { ranking: true, week: true, generos: true, calendario: true }
}
```

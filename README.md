# BookLegacy V3.34 — correção de página atual, datas e mobile

Correção aplicada em cima da V3.33.

## Alterações principais
- Mobile/APK: mapa de calor anual agora respeita o quadro, sem cortar horizontalmente.
- Mobile/APK: menu mobile deduplicado, mantendo apenas Amigos e Comunidade.
- Comunidade: avaliações antigas sem data passam a usar a data em que o livro chegou a 100% quando possível.
- Avaliar Livro: novas avaliações salvam `ratedAt` e `ratingDate`.
- Registrar Sessão: a tela inicial volta a usar página atual real do livro, não a última sessão isolada.
- Salvamentos: evita travamento pós-salvar, fechando modal e destravando classes/overlays sem esperar recarregamento pesado.

Desktop preservado visualmente; mudanças no desktop são funcionais para Comunidade/datas/salvamento.

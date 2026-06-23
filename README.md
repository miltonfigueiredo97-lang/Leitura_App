# BookLegacy V3.37

Patch V3.37 gerado sobre a base visual mobile V3.33.

Escopo:
- Mobile/APK: preservar formatação aprovada da V3.33.
- Mobile/APK: corrigir somente o Mapa de Calor Anual dentro do quadro.
- Desktop/Mobile/APK: Comunidade como página/aba dedicada, não popup.
- Desktop/Mobile/APK: feed com ordenação por data + hora quando existir.
- Desktop/Mobile/APK: avaliações antigas usam data em que o livro bateu 100% quando não existe data real de avaliação.
- Desktop/Mobile/APK: avaliações futuras salvam ratedAt, ratingDate e ratingTime.
- Mobile/APK: menu com Amigos + Comunidade sem duplicar botões.
- Mobile/APK: Todas Conquistas com formatação baseada no desktop, alterando apenas o necessário para caber no celular.


## BookLegacy V3.38

Correção segura baseada nos testes da V3.37:
- Mobile usa a base visual da V3.33 e aplica ajuste imediato para evitar demora até caber na tela.
- Heatmap anual ajustado isoladamente, sem mexer nos demais cards.
- Menu mobile deduplicado para manter apenas Amigos e Comunidade.
- Comunidade abre como página/aba dedicada, com scroll liberado e feed carregado em partes.
- Datas de sessões/avaliações passam a ler formatos BR e usar hora para ordenar eventos no mesmo dia.
- Avaliações antigas são posicionadas após a conclusão 100%; avaliações novas salvam data e hora reais.
- Preserva Todas Conquistas sem nova alteração de formatação.

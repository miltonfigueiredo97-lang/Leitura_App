# BookLegacy V3.44 — ajuste fino menu APK e metas sincronizadas

Correções focadas:
- Desce o botão ☰ e o X do menu no APK/mobile para não ficarem colados no topo da tela.
- Mantém apenas um X pequeno à direita para fechar o menu.
- Excluir meta não reabre mais a engrenagem/gerenciador.
- Metas personalizadas passam a sincronizar pela base remota do usuário (`users/{uid}/settings/customMetas`).
- Ao recarregar desktop/mobile/APK, o seletor de metas usa a lista remota como fonte principal, evitando meta excluída em um dispositivo continuar presa em outro.

Não alterado: Comunidade/feed, heatmap, conquistas, modo batalha, layout geral e sessão.

# BookLegacy V3.43

Correção focada em Comunidade, menu e meta:

- Comunidade passa a calcular sessões por fonte canônica e acumulado real de páginas lidas.
- Total do livro não é mais lido do campo `paginas` da sessão, evitando erros como “32 de 24”.
- Menu mobile/APK com apenas um X pequeno no canto direito.
- Topo desktop estabilizado para evitar botões Comunidade duplicados/piscando.
- Comunidade renderizada por página própria V3.43.
- Meta personalizada agora pode ser excluída.

Não altera heatmap, conquistas, modo batalha visual, gráfico de gêneros ou layout geral.

# BookLegacy V3.32 — Comunidade, Resenhas e Mobile Fit

Atualização aplicada em cima da base V3.31.

## Mobile/APK
- Correção real do limite horizontal dos quadros: remove min-widths que cortavam a tela e adapta cards, ranking, calendário, gráficos e batalha ao tamanho do celular.
- Mantidos os pontos que estavam OK: competição por gêneros, performance/capas e detalhe de leitura.
- Menu dos três tracinhos segue oculto quando popups/modais estão abertos.
- Em Todas Conquistas, a intenção é preservar a formatação e mexer apenas no fechamento/menu sobreposto.

## Desktop + Mobile + APK
- Aba/botão antigo “Comunidade” passa a representar “Amigos”.
- Nova aba/botão “Comunidade” abre um feed de sessões e avaliações suas e de amigos.
- Registrar Sessão agora salva Resenha e Termômetro.
- Avaliar Livro agora salva Título da resenha, Resenha e Termômetro.
- Termômetro permite até 3 emojis por registro.
- Ao concluir 100% de um livro por sessão, ele continua na tela inicial como “Lido — avaliação pendente”, com botões “Avaliar Livro” e “Não avaliar”.

## Debug
- No console: `blMobileDebug()` no mobile/APK.
- No console: `blCommunityDebug()` para verificar feed/comunidade.


## BookLegacy V3.33 — correção comunidade/mobile

- Mobile/APK: ajuste real contra corte horizontal dos quadros e diagnóstico `blFindWideV333()`.
- Mobile/APK: menu separa `Amigos` e nova `Comunidade`.
- Mobile/APK: Todas Conquistas mantém o layout comparativo e corrige apenas fechamento/menu.
- Desktop/Mobile/APK: feed Comunidade lê sessões/notas antigas e novas, com página atual/total e `(páginas lidas - tempo lido)`.
- Desktop/Mobile/APK: registrar sessão atualiza biblioteca/tela inicial e marca avaliação pendente ao chegar em 100%.


## BookLegacy V3.36
- Mobile voltou a usar a base visual V3.33; correção isolada apenas no Mapa de Calor Anual.
- Comunidade abre como página dedicada, não popup.
- Feed recalcula sessões por data e páginas lidas, evitando página voltar no tempo.
- Avaliações antigas usam data de conclusão do livro; novas avaliações salvam `ratingDateSource: real`.
- Menu mobile deduplica Amigos/Comunidade.
- Registrar/excluir sessão preserva scroll e usa `previousPage/currentPage` para não inflar página atual.

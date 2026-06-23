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

# BookLegacy V3.19 — ajustes finais de ações, meta e mobile/APK

Arquivos principais alterados:

- `index.html`: correções que também valem no desktop.
- `mobile.html`: correções mobile e APK, pois o APK usa a interface mobile online.

Não substitua `android/app/google-services.json` nem `android/app/src/main/res/values/booklegacy_config.xml` se eles já estiverem configurados no seu repositório.

## Corrigido

1. Registrar sessão por card não deixa mais o menu `+` aberto.
2. Modais do `+` fecham automaticamente após salvar com sucesso.
3. `blProfileLabel` não quebra quando o usuário ainda está nulo.
4. Gerenciar meta salva direto no Firestore.
5. Comunidade mobile fica dentro da largura da tela.
6. Ranking, Dia da Semana, Gêneros, Progresso por Livro e Calendário ajustados no mobile por container.
7. Donuts de Coleções/Autores ficam circulares no mobile.
8. Batalha mobile não deve exigir arrastar para o lado.
9. Gerenciar meta mobile mostra 3 livros por linha.

Debug:

```js
blV319Debug()
blMobileDebug()
```

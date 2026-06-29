# BookLegacy V3.60 refeita sobre V3.59

Base usada: V3.59 funcional.

Ignorado/desconsiderado: V3.61, V3.62 e V3.63.

Esta V3.60 foi refeita substituindo o bloco final da V3.59, sem empilhar script novo por cima.

## Correções incluídas

1. Pausado antigo da planilha não é mais considerado pausa real.
   - Se tem página atual ou sessão: aparece como Lendo.
   - Se não começou: fica como Aguardando/dica.
   - Só vira Pausado quando o app gravar `pauseState: paused` / `statusSource: booklegacy_app_pause`.

2. Livro Lendo ganhou botão pequeno ⏸️ para pausar.

3. Livro Pausado ganhou botão ▶️ para voltar a ler.

4. Dica de Leitura ganhou botão + Registrar sessão quando o perfil é do próprio usuário.

5. Perfil visitante continua sem botões de edição.

6. Migração não foi substituída por versões 3.61/3.62/3.63. Mantém a base da V3.59, apenas com proteção para não derrubar a tela ao abrir o modal.

## Teste

Depois do deploy, rode no console:

```js
blV60Audit()
```

O `patch` deve retornar:

```txt
BOOKLEGACY_V3_60_REFEITA_SOBRE_V59_PAUSE_DICA_SAFE
```

## Arquivos para substituir

- index.html
- mobile.html
- booklegacy-daniel-migration.json, se for reimportar Daniel

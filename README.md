# BookLegacy V3.29 — correção pontual revisada

Arquivos do pacote:
- mobile.html
- vercel.json
- README.md

Não altera:
- index.html
- android/
- google-services.json
- booklegacy_config.xml
- .github/workflows/build-apk.yml

Correções focadas:
- remove o atraso artificial de capas do ranking completo;
- refaz a busca de Detalhes do Livro como autocomplete real;
- prende a Competição por Gêneros dentro do quadro;
- força o mobile.html a não gerar rolagem lateral;
- faz o menu de três traços abrir sempre no topo;
- remove o texto fantasma de "Nenhum gênero cadastrado" quando o gráfico existe.

Debug esperado:
blMobileDebug().patch = "v3.29-targeted-careful-fix"

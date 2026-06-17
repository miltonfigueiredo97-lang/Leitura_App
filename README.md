# BookLegacy V7

Correções desta versão:

- Login Google visível no fluxo do app.
- O dashboard carrega os dados do usuário logado.
- Botões de Daniel e Batalha só aparecem quando houver amizade aceita no Firestore.
- Preparado para PWA instalável no celular com manifest, ícones e service worker.
- Inclui regras Firestore V7 para permitir modo batalha apenas entre amigos aceitos.

Importante: para puxar os dados do Daniel, ele precisa entrar uma vez com o Google para gerar o UID dele. Depois importe a base dele no UID correto e crie a amizade aceita entre Milton e Daniel.

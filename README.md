# BookLegacy V3.48 — metas com ID válido + popups APK compactos

Correções pontuais:
- Troca o registro remoto de metas para um ID válido no Firebase: `booklegacyCustomMetasRegistry`.
- Corrige criação/exclusão/sincronização de metas entre desktop, mobile e APK.
- Remove o erro do antigo ID reservado `__booklegacy_custom_metas_registry__`.
- Corrige o `insertBefore` antigo que gerava erro no console e travava menus.
- No mobile/APK, remove a barra inferior `#mobile-nav`.
- No mobile/APK, compacta popups do botão `+` e adiciona X no topo sem quebrar os cliques.

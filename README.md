# BookLegacy V3.47

Correção focada nos pontos restantes:
- metas personalizadas agora usam registry remoto dentro de `users/{uid}/library/__booklegacy_custom_metas_registry__`, caminho que segue a mesma base já usada pela biblioteca;
- remove scripts V44/V45/V46 que tentavam gravar em caminhos com permission denied;
- criação/exclusão de meta passa a atualizar o registry remoto e limpar opções locais antigas;
- reverte o patch V46 de popups compactos que quebrou os botões do +;
- não altera Comunidade, sessões, heatmap, conquistas ou Modo Batalha.

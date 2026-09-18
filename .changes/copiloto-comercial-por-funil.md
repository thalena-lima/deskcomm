---
impacto: capacidade_nova
secao: adicionado
titulo: Cada funil ganha o "Copiloto comercial": interruptor, playbook e mapa das colunas
---

Em **Configurações › Funis**, quem administra a organização passa a ver, ao lado do
vocabulário e dos campos de cada funil, o interruptor **Copiloto comercial**. Ele fica
gravado no próprio funil (`settings.modulos.copiloto_comercial.enabled`), então uma
organização pode ligá-lo num funil e deixar os outros como estão.

Com o interruptor ligado aparecem duas configurações:

- **Playbook do Copiloto** — qual roteiro comercial o copiloto usa neste funil. As opções
  vêm de um catálogo versionado de playbooks; o primeiro é o
  **Playbook Comercial — Consultoria em Energia (Versão 6)**, o `afb_comercial_v1`, cujo
  documento de origem fica
  guardado em `docs/afb/playbooks/afb-comercial-v1.html`. Funil ligado sem playbook escolhido
  fica assim mesmo, declarado: nada é escolhido por baixo dos panos. Dois funis podem usar o
  mesmo playbook, e um funil pode trocar o seu — pipeline e playbook são coisas separadas.
- **Mapeamento do Copiloto** — para cada coluna do funil você escolhe o papel que ela
  desempenha para o copiloto — Prospecção, Conversa, Pré-venda, Reunião agendada,
  Apresentação, Fechamento ou Pós-venda — ou a deixa como "Não mapeada". As colunas marcadas
  como fechamento e desistência aparecem como **Ganho** e **Perdido (automático)**: são a
  marcação da própria etapa mandando, e por isso não têm seletor. O mapa é guardado por
  identidade da coluna, não pelo nome — renomear ou reordenar o funil não o desfaz.

Nesta versão a configuração só grava as escolhas; o painel do copiloto na caixa de entrada
chega numa versão seguinte, e vai ler exatamente estas chaves. Os playbooks são estruturados
em código de forma versionada (`afb_comercial_v1`, e os que vierem), com a sequência de
WhatsApp, o e-mail em três variações, o roteiro de ligação, a cadência de follow-up de 15
dias, as objeções e as regras do documento — nenhum texto comercial vive em tela.

Salvar qualquer parte da configuração do funil continua preservando o resto: campos,
motivos de perda, tags canônicas, o interruptor quando se salva o mapa ou o playbook, o mapa
e o playbook quando se salva o interruptor. A mudança fica registrada na auditoria com o
nome do módulo alterado, sem o valor.

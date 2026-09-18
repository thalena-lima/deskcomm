---
impacto: capacidade_nova
secao: adicionado
titulo: Cada funil ganha o interruptor "Copiloto comercial" e o mapa das suas colunas
---

Em **Configurações › Funis**, quem administra a organização passa a ver, ao lado do
vocabulário e dos campos de cada funil, o interruptor **Copiloto comercial**. Ele fica
gravado no próprio funil (`settings.modulos.copiloto_comercial.enabled`), então uma
organização pode ligá-lo num funil e deixar os outros como estão.

Com o interruptor ligado aparece a seção **Mapeamento do Copiloto**: para cada coluna do
funil você escolhe o papel que ela desempenha para o copiloto — Prospecção, Conversa,
Pré-venda, Reunião agendada, Apresentação, Fechamento ou Pós-venda — ou a deixa como
"Não mapeada". As colunas marcadas como fechamento e desistência aparecem como **Ganho** e
**Perdido (automático)**: são a marcação da própria etapa mandando, e por isso não têm
seletor. O mapa é guardado por identidade da coluna, não pelo nome — renomear ou reordenar
o funil não o desfaz. Nesta versão a configuração só grava a preferência; o painel do
copiloto na caixa de entrada chega numa versão seguinte, e vai ler exatamente estas chaves.

Salvar qualquer parte da configuração do funil continua preservando o resto: campos,
motivos de perda, tags canônicas, o interruptor quando se salva o mapa e o mapa quando se
salva o interruptor. A mudança fica registrada na auditoria com o nome do módulo alterado,
sem o valor.

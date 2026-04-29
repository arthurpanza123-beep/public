# Arquitetura Primeflix Bot

## Papel de cada parte

- WhatsApp Bot: cérebro principal. Recebe mensagens, normaliza telefone/nome/texto, grava no Supabase, envia fluxo inicial, chama IA e responde no WhatsApp.
- n8n: opcional para automacoes futuras, fora do caminho principal do atendimento.
- Supabase: memoria do atendimento, contatos, conversas, pedidos de teste, credenciais e follow-ups.
- Tester Playwright: cria teste de 1 hora no painel externo sem API.
- KIE AI Claude Haiku: responde somente depois do fluxo inicial e com guardrails.
- Lovable: painel visual para Arthur assumir, devolver, aprovar teste e disparar Black Friday manual.

## Fluxo principal

1. Cliente manda qualquer primeira mensagem.
2. WhatsApp Bot cria/atualiza `customers` pelo telefone.
3. WhatsApp Bot salva a mensagem recebida em `messages`.
4. Se `flow_initial_sent=false`, envia o fluxo inicial oficial.
5. Depois do fluxo inicial, marca `flow_initial_sent=true`.
6. Nas proximas mensagens, chama a KIE AI e salva a resposta enviada.

## Principio de seguranca

Se qualquer etapa sensivel falhar, o cliente nao recebe dado inventado. Arthur recebe o alerta e decide manualmente.

## Fluxo inicial oficial

1. `apresentacao01.ogg`
2. `apresentacao02.ogg`
3. `feedbaks.jpeg` com legenda oficial
4. `qualatv.ogg`

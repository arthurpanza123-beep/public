# Arquitetura Primeflix Bot

## Papel de cada parte

- WhatsApp Bot: transporte. Recebe e envia mensagens, simula digitando/gravando e entrega tudo ao n8n.
- n8n: orquestracao visual e regras do atendimento.
- Supabase: memoria do atendimento, contatos, conversas, pedidos de teste, credenciais e follow-ups.
- Tester Playwright: cria teste de 1 hora no painel externo sem API.
- KIE AI Claude Haiku: responde somente depois do fluxo inicial e com guardrails.
- Lovable: painel visual para Arthur assumir, devolver, aprovar teste e disparar Black Friday manual.

## Fluxo principal

1. Cliente manda qualquer primeira mensagem.
2. WhatsApp Bot encaminha ao n8n.
3. n8n consulta Supabase pelo telefone.
4. Se nao existir contato ou se nao tiver `initial_flow_sent_at`, dispara o fluxo inicial oficial.
5. Depois do fluxo inicial, n8n marca `ai_enabled=true`.
6. Proximas mensagens passam por roteamento seguro:
   - preco/plano: envia `valor.jpeg`.
   - teste: pergunta se pode testar agora.
   - confirmacao de teste: avisa Arthur e espera aprovacao.
   - conversa assumida por Arthur: bot fica pausado.
   - demais casos: chama KIE AI com guardrails.

## Principio de seguranca

Se qualquer etapa sensivel falhar, o cliente nao recebe dado inventado. Arthur recebe o alerta e decide manualmente.

## Fluxo inicial oficial

1. `apresentacao01.ogg`
2. `apresentacao02.ogg`
3. `feedbaks.jpeg` com legenda oficial
4. `qualatv.ogg`

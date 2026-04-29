# Regras de atendimento

Estas regras sao obrigatorias:

1. O fluxo inicial e intocavel.
2. A primeira mensagem do cliente sempre dispara o fluxo inicial, ignorando o conteudo inicial.
3. O fluxo inicial nunca deve repetir para o mesmo telefone.
4. A IA so atua depois do fluxo inicial.
5. A IA nunca inventa preco, plano, prazo ou promocao.
6. Precos e planos sao enviados com `valor.jpeg`.
7. Black Friday so e enviada manualmente quando Arthur ativar.
8. Quando o cliente pedir teste, confirmar se ele pode testar agora, porque o teste dura 1 hora.
9. Antes de gerar teste, avisar Arthur e pedir aprovacao.
10. Se a automacao de teste der erro, nao enviar nada errado ao cliente; avisar Arthur.
11. Credenciais devem conter, quando houver: provedor, usuario, senha e vencimento.
12. Arthur pode assumir a conversa.
13. Se Arthur nao responder em 30 minutos, o bot retoma.
14. Se Arthur assumir, o bot pausa e depois de 30 minutos pergunta se Arthur quer continuar ou devolver.
15. Follow-up automatico deve ser contextual, nao generico.
16. Nao existe lead quente, prioridade automatica ou pontuacao de lead.

## Observacoes praticas

- O workflow base bloqueia respostas de IA que tentam falar de preco, plano, promocao ou Black Friday.
- `black.jpeg` nao aparece em nenhum caminho automatico de cliente.
- `valor.jpeg` e o unico caminho automatico para preco e plano.
- O tester so aceita criar teste com `approvedByArthur=true`.

# n8n opcional

O atendimento principal agora roda dentro do `whatsapp-bot`. Use este workflow apenas para automacoes futuras ou integrações auxiliares.

Workflow: `n8n/primeflix-workflow.json`.

Nome no n8n:

```text
Primeflix Bot - Atendimento Principal
```

## Webhook de entrada

Use:

```text
/webhook/whatsapp-incoming
```

Essa URL so deve ser colocada em `N8N_WEBHOOK_URL` se `USE_N8N=true`.

## Variaveis obrigatorias no n8n

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `BOT_PUBLIC_URL` ou `BOT_API_URL`
- `KIE_API_KEY`
- `KIE_MODEL`
- `ARTHUR_PHONE`

`SUPABASE_SERVICE_KEY` nunca deve aparecer hardcoded no workflow exportado.

## Fluxo inicial oficial

Ordem intocavel:

1. `apresentacao01.ogg`
2. `apresentacao02.ogg`
3. `feedbaks.jpeg` com legenda oficial
4. `qualatv.ogg`

## Rotas manuais

- `primeflix/arthur/aprovar-teste`
- `primeflix/arthur/black-friday`
- `primeflix/arthur/assumir`
- `primeflix/arthur/devolver`

## Regras no workflow

- Primeira mensagem dispara fluxo inicial independente do conteudo.
- Fluxo inicial nao repete para o mesmo telefone.
- IA so atua depois do fluxo inicial.
- Valores so saem com `valor.jpeg`.
- Black Friday so sai pelo webhook manual e com `black.jpeg`.
- Teste so vai ao Playwright depois da aprovacao de Arthur.
- Erro no Playwright avisa Arthur e nao envia nada ao cliente.

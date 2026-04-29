# Lovable

Use o Lovable como painel visual do Arthur para o Primeflix Bot.

## `.env.local.example`

O frontend deve usar apenas chaves publicas:

```env
VITE_SUPABASE_URL=https://woonzezkmbsnczwhcaic.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_wDoc5iO-s_iSzjqd5NzoLw_GuQ-IC0a
VITE_APP_NAME=Primeflix Bot
```

Nunca coloque `SUPABASE_SERVICE_KEY` no Lovable publico.

## Telas recomendadas

- Conversas por telefone.
- Historico da conversa.
- Pedidos de teste aguardando aprovacao.
- Botao para Arthur assumir.
- Botao para devolver ao bot.
- Botao para aprovar teste.
- Botao manual para Black Friday.
- Notas internas.

## Dados

Use:

- `v_customers_panel`
- `customers`
- `messages`

## Webhooks manuais

### Aprovar teste

`POST /webhook/primeflix/arthur/aprovar-teste`

```json
{
  "phone": "5511999999999",
  "customerName": "Cliente",
  "requestId": "uuid"
}
```

### Black Friday

`POST /webhook/primeflix/arthur/black-friday`

```json
{
  "phone": "5511999999999",
  "caption": ""
}
```

### Assumir conversa

`POST /webhook/primeflix/arthur/assumir`

```json
{
  "phone": "5511999999999"
}
```

### Devolver ao bot

`POST /webhook/primeflix/arthur/devolver`

```json
{
  "phone": "5511999999999"
}
```

## Sem lead quente

O painel pode mostrar status operacional, mas nao deve criar prioridade automatica, score ou lead quente.

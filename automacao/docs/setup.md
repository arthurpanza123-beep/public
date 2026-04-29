# Setup

## 1. Preencher `.env`

Copie `.env.example` para `.env`.

Preencha:

- `BOT_PUBLIC_URL`: URL publica do bot/API Node.js. Localmente pode ficar `http://localhost:3333`.
- `USE_N8N`: deixe `false` para o atendimento principal rodar direto no WhatsApp Bot.
- `N8N_WEBHOOK_URL`: opcional, apenas se `USE_N8N=true` para automacoes futuras.
- `SUPABASE_SERVICE_KEY`: service role nova do Supabase. Nunca coloque essa chave no frontend.
- `KIE_API_KEY`: chave privada da KIE AI.
- `ARTHUR_PHONE`: telefone do Arthur com DDI e DDD, somente numeros.
- `TEST_PANEL_URL`, `TEST_PANEL_USER`, `TEST_PANEL_PASSWORD`: dados do painel externo.

As chaves publicas ja estao preenchidas:

```env
SUPABASE_URL=https://woonzezkmbsnczwhcaic.supabase.co
SUPABASE_ANON_KEY=sb_publishable_wDoc5iO-s_iSzjqd5NzoLw_GuQ-IC0a
```

## 2. Rodar local

Instale as dependencias dos dois servicos:

```bash
cd whatsapp-bot
npm install
npm run dev
```

Em outro terminal:

```bash
cd tester
npm install
npm run dev
```

O WhatsApp Bot sobe em `http://localhost:3333`.

## 3. Subir na VPS

Na pasta `automacao`:

```bash
docker compose up -d --build
docker compose logs -f whatsapp-bot
```

Escaneie o QR Code mostrado nos logs.

## 4. Configurar Supabase

No Supabase, abra o SQL Editor e execute `supabase/schema.sql`.

Depois confirme que existem:

- `customers`
- `messages`
- `v_customers_panel`

Use `SUPABASE_ANON_KEY` no Lovable/frontend. Use `SUPABASE_SERVICE_KEY` somente no servidor e em automacoes privadas.

## 5. n8n opcional

O atendimento principal nao depende mais do n8n. Para automacoes futuras, importe `n8n/primeflix-workflow.json`.

O workflow deve aparecer como:

```text
Primeflix Bot - Atendimento Principal
```

Configure no ambiente do n8n:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `BOT_PUBLIC_URL` ou `BOT_API_URL`
- `KIE_API_KEY`
- `KIE_MODEL`
- `ARTHUR_PHONE`

No Docker Compose, o n8n usa `BOT_API_URL=http://whatsapp-bot:3333`.

Se o n8n rodar fora do Docker Compose, configure tambem `TESTER_URL` apontando para o servico Playwright.

## 6. Configurar KIE API

Preencha no `.env`:

```env
KIE_API_KEY=COLE_AQUI_SUA_KIE_API_KEY
KIE_MODEL=claude-haiku-4-5
```

O prompt do `whatsapp-bot` proibe a IA de inventar preco, plano, prazo ou promocao.

## 7. Testar WhatsApp

Endpoints principais:

- `GET /health`
- `GET /qr`
- `POST /send/text`
- `POST /send/audio`
- `POST /send/image`
- `POST /presence/composing`
- `POST /presence/recording`
- `POST /presence/paused`
- `POST /internal/arthur-message`

Fluxo minimo:

1. Suba o `whatsapp-bot`.
2. Escaneie o QR.
3. Chame `GET /health`.
4. Envie uma mensagem de outro telefone.
5. Confira no Supabase se `customers` e `messages` receberam os registros.

## 8. Testar criacao de teste

Antes de testar o Playwright, configure os seletores do painel externo se o painel exigir campos especificos.

Payload seguro:

```json
{
  "phone": "5511999999999",
  "customerName": "Cliente",
  "requestId": "teste-local",
  "approvedByArthur": true
}
```

Se o Playwright falhar, o retorno deve ser `ok=false`; o cliente nao deve receber nada.

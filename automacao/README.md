# Primeflix Bot

Automacao de atendimento via WhatsApp para Primeflix.

## O que existe aqui

- `whatsapp-bot/`: cerebro principal do atendimento. Conecta no WhatsApp por QR Code, normaliza telefone/nome/texto, faz upsert em `customers`, salva mensagens em `messages`, envia o fluxo inicial uma vez por telefone, consulta a base de conhecimento, usa respostas aprendidas e chama a KIE AI quando precisa.
- `whatsapp-bot/src/knowledgeBase.js`: base inteligente de raciocinio do atendimento, com regras comerciais, intencoes, aparelhos, objecoes e fluxo de duvidas para Arthur.
- `tester/`: automacao Playwright para criar teste de 1 hora no painel externo, sempre com erro seguro.
- `n8n/primeflix-workflow.json`: workflow opcional para automacoes futuras. O atendimento principal nao depende do n8n.
- `supabase/schema.sql`: migration principal do banco usando `customers`, `messages`, `learned_answers` e `bot_events`.
- `docs/`: guias de setup, operacao, regras, n8n, Playwright e Lovable.
- `material/`: arquivos oficiais da Primeflix.

## Fluxo inicial oficial

Nao altere a ordem:

1. `apresentacao01.ogg`
2. `apresentacao02.ogg`
3. `feedbaks.jpeg` com legenda oficial
4. `qualatv.ogg`

O bot marca `customers.flow_initial_sent=true` e `customers.flow_initial_sent_at=now()` depois de enviar, para nunca repetir para o mesmo telefone.

## Base de conhecimento

Depois do fluxo inicial, o bot segue esta ordem:

1. Detecta a intencao da mensagem.
2. Procura uma resposta aprovada em `learned_answers`.
3. Procura uma resposta direta em `knowledgeBase.js`.
4. Chama a KIE AI com a base de conhecimento como contexto.
5. Se a duvida nao estiver na base, registra em `bot_events`, salva em `learned_answers` como `approved=false` e responde que vai verificar com Arthur.

Com `LOG_LEVEL=debug`, os logs mostram intencao detectada, resposta usada da base, resposta criada por IA e duvida enviada para Arthur.

## KIE AI

O endpoint padrao da KIE AI para Claude Haiku 4.5 esta configurado como:

```env
KIE_BASE_URL=https://api.kie.ai
KIE_CHAT_ENDPOINT=/claude/v1/messages
KIE_MODEL=claude-haiku-4-5
KIE_TIMEOUT_MS=60000
```

Se a KIE mudar o endpoint no painel ou na documentacao, atualize apenas `KIE_CHAT_ENDPOINT` no `.env`. O bot monta a URL final com `KIE_BASE_URL + KIE_CHAT_ENDPOINT` e nunca registra `KIE_API_KEY` nos logs.

Teste a KIE antes do WhatsApp:

```bash
cd /opt/public/automacao
docker compose exec whatsapp-bot npm run test:kie
```

Se aparecer `Missing script: "test:kie"`, o container ainda esta com a imagem antiga. Rode `docker compose down` e `docker compose up -d --build` antes de testar novamente.

O teste usa um prompt minimo, `max_tokens=20` e o mesmo timeout configurado em `KIE_TIMEOUT_MS`. Nos logs, confira `KIE_REQUEST` com `url`, `model`, `promptSize` e `timeout`, e depois `KIE_RESPONSE` ou `KIE_ERROR`.

## Comeco rapido

1. Copie `.env.example` para `.env`.
2. Preencha a service role do Supabase apenas no `.env` local/servidor.
3. Rode `supabase/schema.sql` no Supabase.
4. Deixe `USE_N8N=false` para o atendimento principal rodar direto no `whatsapp-bot`.
5. Use `LOG_LEVEL=debug` para diagnosticar as decisoes do atendimento.
6. Suba os servicos:

```bash
docker compose up -d --build
```

7. Veja os logs do `whatsapp-bot` e escaneie o QR Code.

Leia [docs/setup.md](docs/setup.md) antes de colocar em producao.

## VPS

```bash
cd /opt/public
git pull
cd automacao
docker compose down
docker compose up -d --build
```

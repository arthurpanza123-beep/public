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
2. Executa acoes diretas quando necessario, como enviar `valor.jpeg`.
3. Usa respostas locais apenas para instrucoes tecnicas objetivas ou fallback por intencao.
4. Chama a KIE AI para escrever respostas naturais quando a intencao nao for uma acao direta.
5. Envia para a KIE apenas o contexto relevante da `knowledgeBase`, junto da etapa atual do cliente.
6. Se a duvida nao estiver clara ou a KIE falhar sem fallback por intencao, registra em `bot_events`, salva em `learned_answers` como `approved=false` e responde que vai verificar com Arthur.

Com `LOG_LEVEL=debug`, os logs mostram intencao detectada, resposta usada da base, resposta criada por IA e duvida enviada para Arthur.

As respostas do WhatsApp sao sanitizadas antes do envio: sem markdown, sem negrito, sem excesso de emoji, sem frases proibidas e sem provedor durante instalacao. Valores sempre usam `valor.jpeg` com a legenda oficial configurada no `.env`.

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

## Modo Teste Fake

Para testar a conversa sem criar um teste real no painel, ative temporariamente no `.env`:

```env
TEST_FAKE_MODE=true
TEST_FAKE_PROVIDER=primeflixapp
TEST_FAKE_USER=teste.primeflix
TEST_FAKE_PASSWORD=123456
```

Com esse modo ativo, quando o cliente estiver na etapa de liberar login e responder `sim`, o bot envia credenciais simuladas marcadas como `[MODO TESTE]`. Desative antes de usar em atendimento real.

## IA Local Fallback

Para sua VPS de 4 vCPU e 6 GB RAM, a recomendacao de custo-beneficio e `llama3.2:3b` via Ollama. Ele nao substitui a KIE como IA principal, mas segura a conversa quando a KIE cair ou demorar.

Depois de subir os containers, baixe o modelo uma vez:

```bash
cd /opt/public/automacao
docker compose exec ollama ollama pull llama3.2:3b
```

No `.env`, deixe:

```env
LOCAL_AI_ENABLED=true
LOCAL_AI_BASE_URL=http://ollama:11434
LOCAL_AI_MODEL=llama3.2:3b
LOCAL_AI_TIMEOUT_MS=60000
```

## Obsidian

Para usar Obsidian como base de estudo, sincronize ou copie suas notas `.md` para:

```txt
/opt/public/automacao/knowledge/obsidian/aprovadas
```

O bot busca trechos relevantes dessas notas e envia como contexto para a KIE e para a IA local. Isso nao treina o modelo do zero, mas funciona como memoria/RAG simples e ja ajuda bastante.

## Lovable Aprova Conhecimento

Fluxo:

1. Bot ou IA cria uma sugestao em `public.knowledge_suggestions` com `status='pending'`.
2. Lovable mostra a fila de pendentes.
3. Arthur revisa, edita `final_answer` e muda `status` para `approved`.
4. O servico `knowledge-exporter` gera um `.md` em `knowledge/obsidian/aprovadas`.
5. O bot passa a usar esse conhecimento automaticamente nas proximas respostas.

O exportador roda em loop no Docker pelo servico `knowledge-exporter`. Para executar manualmente:

```bash
cd /opt/public/automacao
docker compose exec knowledge-exporter npm run export:knowledge
```

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

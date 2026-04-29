# Primeflix Bot

Automacao de atendimento via WhatsApp para Primeflix.

## O que existe aqui

- `whatsapp-bot/`: cérebro principal do atendimento. Conecta no WhatsApp por QR Code, normaliza telefone/nome/texto, faz upsert em `customers`, salva mensagens em `messages`, envia o fluxo inicial, chama a KIE AI e registra respostas.
- `tester/`: automacao Playwright para criar teste de 1 hora no painel externo, sempre com erro seguro.
- `n8n/primeflix-workflow.json`: workflow opcional para automacoes futuras. O atendimento principal nao depende do n8n.
- `supabase/schema.sql`: migration principal do banco usando apenas `customers` e `messages` para o atendimento.
- `docs/`: guias de setup, operacao, regras, n8n, Playwright e Lovable.
- `material/`: arquivos oficiais da Primeflix.

## Fluxo inicial oficial

Nao altere a ordem:

1. `apresentacao01.ogg`
2. `apresentacao02.ogg`
3. `feedbaks.jpeg` com legenda oficial
4. `qualatv.ogg`

## Comeco rapido

1. Copie `.env.example` para `.env`.
2. Preencha a service role do Supabase apenas no `.env` local/servidor.
3. Rode `supabase/schema.sql` no Supabase.
4. Deixe `USE_N8N=false` para o atendimento principal rodar direto no `whatsapp-bot`.
5. Suba os servicos:

```bash
docker compose up -d --build
```

6. Veja os logs do `whatsapp-bot` e escaneie o QR Code.

Leia [docs/setup.md](docs/setup.md) antes de colocar em producao.

## VPS

```bash
cd /opt/public
git pull
cd automacao
docker compose down
docker compose up -d --build
```

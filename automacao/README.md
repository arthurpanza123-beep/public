# Primeflix Bot

Automacao de atendimento via WhatsApp para Primeflix.

## O que existe aqui

- `whatsapp-bot/`: API Node.js do WhatsApp, com QR Code, envio de texto, audio, imagem, presenca e webhook para o n8n.
- `tester/`: automacao Playwright para criar teste de 1 hora no painel externo, sempre com erro seguro.
- `n8n/primeflix-workflow.json`: workflow base "Primeflix Bot - Atendimento Principal".
- `supabase/schema.sql`: schema do banco para contatos, conversas, testes, credenciais e follow-ups.
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
4. Importe `n8n/primeflix-workflow.json` no n8n.
5. Suba os servicos:

```bash
docker compose up -d --build
```

6. Veja os logs do `whatsapp-bot` e escaneie o QR Code.

Leia [docs/setup.md](docs/setup.md) antes de colocar em producao.

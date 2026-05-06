# Instrucoes para Codex

Projeto: XCloud Telegram Bot / Central Play.

Objetivo: manter um bot Telegram que automatiza ativacao XCloud e gera mensagens de app alternativo.

## Regras principais

- Nao coloque credenciais reais no codigo.
- Nao commite `.env`, `.xcloud-profile`, `data/state.json`, `data/history.jsonl` ou prints.
- O menu principal do Telegram deve ter somente dois botoes:
  - Ativar XCloud
  - App alternativo
- Pode haver botoes internos de fluxo para escolher aparelho, app e cancelar.
- O fluxo XCloud deve:
  1. receber chave do dispositivo;
  2. acessar painel;
  3. logar se necessario digitando credenciais;
  4. ir em Dispositivos;
  5. adicionar novo dispositivo;
  6. preencher chave;
  7. marcar playlist propria;
  8. salvar;
  9. pedir texto do teste/M3U;
  10. extrair somente Link (M3U), nao M3U8, HLS, MPEGTS ou link curto;
  11. abrir custom playlist com a chave;
  12. preencher URL;
  13. salvar;
  14. enviar mensagem final em duas mensagens separadas.
- O fluxo App alternativo deve:
  1. perguntar aparelho;
  2. filtrar apps compativeis;
  3. gerar mensagem de instalacao;
  4. pedir texto completo do teste;
  5. extrair usuario e senha;
  6. preencher mensagem final com app, codigo, usuario e senha.
- Para Android TV, TV Box, Fire Stick e Mi Stick, a mensagem de instalacao deve explicar o uso do Downloader e inserir o codigo downloader do app escolhido.
- Para LG, Samsung, Roku e iPhone/iOS, nao mencionar Downloader.
- A mensagem de teste alternativo deve comecar com `Teste ativado com sucesso!` e nao com o nome do app.

## Como corrigir erros de Playwright

- Primeiro rode `npm run doctor`.
- Depois rode `npm start`.
- Se a automacao falhar, veja o print em `storage/screenshots/`.
- Ajuste seletores preferencialmente em `src/xcloud.js` ou via `.env.example` se for algo configuravel.
- Mantenha os helpers robustos: tente role, text, label e CSS selectors.
- Nao remova screenshots de erro; eles sao uteis para debug.

## Padrao de codigo

- Node.js CommonJS.
- Evitar dependencias desnecessarias.
- Playwright para navegador.
- Telegraf para Telegram.
- Persistencia simples em JSON/JSONL.

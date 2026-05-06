Use GPT-5.5 com raciocinio alto para esta tarefa.

Contexto:
Este repositorio e um bot Telegram para automatizar ativacao XCloud e gerar mensagens de app alternativo para Central Play.

Objetivo do bot:
1. Menu principal do Telegram com somente dois botoes: Ativar XCloud e App alternativo.
2. Fluxo Ativar XCloud:
   - receber chave do dispositivo;
   - logar no painel XCloud se necessario;
   - entrar em Dispositivos;
   - adicionar novo dispositivo;
   - preencher chave;
   - marcar que o dispositivo usa sua propria lista de reproducao;
   - salvar;
   - pedir texto completo do teste ou URL M3U;
   - extrair somente o Link (M3U), ignorando link curto, M3U8, HLS e MPEGTS;
   - abrir https://xtream.cloud/custom-playlist?device_key=CHAVE&type=playlist&mode=add;
   - preencher o campo URL com o M3U;
   - salvar;
   - responder no Telegram com duas mensagens separadas: confirmacao e mensagem do cliente.
3. Fluxo App alternativo:
   - perguntar aparelho;
   - filtrar apps compativeis;
   - escolher app;
   - gerar mensagem de instalacao;
   - se for Android TV, TV Box, Fire Stick ou Mi Stick, explicar Downloader e usar codigo downloader;
   - se for LG, Samsung, Roku ou iOS, nao mencionar Downloader;
   - pedir texto completo do teste;
   - extrair usuario e senha;
   - gerar mensagem final com app, codigo, usuario e senha.

Pedido:
Revise o repositorio inteiro, rode os testes basicos, procure bugs, melhore a robustez do Playwright e corrija qualquer erro de sintaxe/fluxo. Nao altere as regras comerciais acima. Nao coloque credenciais reais no codigo. Se precisar ajustar seletores do painel, prefira criar seletores configuraveis no .env.example e manter fallback automatico.

Comandos esperados:
- npm install
- npm run doctor
- npm start

Se a automacao Playwright falhar, use os screenshots em data/screenshots para corrigir os seletores.

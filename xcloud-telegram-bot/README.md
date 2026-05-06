# XCloud Telegram Bot

Bot Telegram em Node.js para:

1. Ativar dispositivos no painel XCloud usando Playwright.
2. Configurar playlist customizada com Link M3U validado.
3. Gerar mensagens profissionais para app alternativo.

## Menu principal

O menu principal do Telegram tem somente dois botões:

- 🚀 Ativar XCloud
- 📺 App alternativo

Botões internos podem aparecer durante os fluxos para cancelar, escolher aparelho e escolher app.

## Requisitos

- VPS Linux, preferencialmente Ubuntu 22.04/24.04.
- Node.js 20+.
- NPM.
- Bot Telegram criado no BotFather.
- ID numérico do Telegram autorizado no `.env`.
- Credenciais do painel XCloud no `.env`.

## Instalação local

```bash
unzip xcloud-telegram-bot.zip
cd xcloud-telegram-bot
npm install
npm run install:browsers
cp .env.example .env
nano .env
npm test
npm run doctor
npm run setup-session
npm start
```

## Instalação em VPS Linux 24/7

```bash
sudo apt update
sudo apt install -y curl unzip
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Envie o projeto para a VPS e rode:

```bash
unzip xcloud-telegram-bot.zip
cd xcloud-telegram-bot
npm install
npm run install:browsers
cp .env.example .env
nano .env
npm test
npm run doctor
npm run setup-session
```

Rodar 24/7 com PM2:

```bash
sudo npm install -g pm2
pm2 start npm --name xcloud-telegram-bot -- start
pm2 save
pm2 startup
```

Depois execute o comando que o `pm2 startup` mostrar na tela.

Comandos úteis:

```bash
pm2 logs xcloud-telegram-bot
pm2 restart xcloud-telegram-bot
pm2 stop xcloud-telegram-bot
pm2 status
```

## Docker

```bash
cp .env.example .env
nano .env
docker compose up -d --build
docker logs -f xcloud-telegram-bot
```

## Variáveis do `.env`

Obrigatórias:

```env
TELEGRAM_BOT_TOKEN=token_do_bot
TELEGRAM_ALLOWED_USER_IDS=123456789
XCLOUD_EMAIL=email_do_painel
XCLOUD_PASSWORD=senha_do_painel
```

Recomendadas ou opcionais:

```env
XCLOUD_PANEL_URL=https://panel.xtream.cloud
XCLOUD_CUSTOM_PLAYLIST_URL=https://xtream.cloud/custom-playlist?device_key={DEVICE_KEY}&type=playlist&mode=add
HEADLESS=true
SLOW_MO_MS=0
XCLOUD_PROFILE_DIR=.xcloud-profile
STORAGE_DIR=storage
SCREENSHOT_DIR=storage/screenshots
```

Seletores opcionais se o painel XCloud mudar:

```env
XCLOUD_DEVICE_KEY_SELECTOR=
XCLOUD_PLAYLIST_URL_SELECTOR=
XCLOUD_SAVE_SELECTOR=
XCLOUD_ADD_DEVICE_SELECTOR=
XCLOUD_DEVICES_MENU_SELECTOR=
XCLOUD_OWN_PLAYLIST_SELECTOR=
```

Também existe compatibilidade com o nome antigo `TELEGRAM_ALLOWED_IDS`, mas use `TELEGRAM_ALLOWED_USER_IDS` em instalações novas.

## Fluxo 🚀 Ativar XCloud

1. O bot pede a chave do dispositivo.
2. Abre `https://panel.xtream.cloud`.
3. Verifica se já existe sessão logada.
4. Se pedir login, digita `XCLOUD_EMAIL` e `XCLOUD_PASSWORD`.
5. Vai para Dispositivos > Dispositivos.
6. Clica em adicionar novo dispositivo.
7. Preenche a chave.
8. Marca que o dispositivo usa a própria lista de reprodução.
9. Salva.
10. Pede o texto completo do teste ou o Link M3U.
11. Extrai somente Link M3U válido, rejeitando M3U8, HLS, MPEGTS e links curtos.
12. Abre a tela de playlist customizada com a chave do dispositivo.
13. Preenche a URL e salva.
14. Envia duas mensagens separadas: confirmação interna e mensagem pronta para o cliente.

## Fluxo 📺 App alternativo

1. O bot pergunta a TV/aparelho do cliente.
2. Mostra somente apps compatíveis.
3. Gera a mensagem de instalação do app escolhido.
4. Para Android TV, TV Box, Fire Stick, Mi Stick e Android, usa Downloader e o código Downloader do app.
5. Para LG, Samsung, Roku e iPhone/iOS, não menciona Downloader.
6. Depois recebe o texto completo do teste.
7. Extrai usuário e senha.
8. Gera a mensagem final começando com `✅ Teste ativado com sucesso!`.

## Logs, estado e screenshots

- Estado por usuário: `data/state.json`
- Histórico: `data/history.jsonl`
- Screenshots de erro Playwright: `storage/screenshots/`
- Perfil persistente do navegador: `.xcloud-profile/`

O `.gitignore` já impede o envio de `.env`, perfil do navegador, histórico, estado e screenshots.

## Validação

```bash
npm test
npm run doctor
```

O `npm test` valida parser M3U, usuário/senha e compatibilidade dos apps.  
O `npm run doctor` valida `.env`, diretórios e as mesmas regras básicas.

## Pontos de teste manual no painel XCloud

Teste manualmente antes de deixar 24/7:

- Login inicial com `npm run setup-session`.
- Se o painel usa captcha, 2FA ou bloqueio de VPS.
- Clique em Dispositivos > Dispositivos.
- Botão real de adicionar novo dispositivo.
- Campo real da chave do dispositivo.
- Checkbox “O dispositivo usa sua própria lista de reprodução.”
- Botão real de salvar dispositivo.
- Abertura da URL `custom-playlist` para uma chave real.
- Campo real de URL da playlist.
- Botão real Save/Salvar da playlist.
- Screenshot em `storage/screenshots/` quando algum seletor falhar.

Se algum ponto falhar, preencha o seletor correspondente no `.env` e rode `npm run doctor` novamente.

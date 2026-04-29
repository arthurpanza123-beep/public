# Tester Playwright

O `tester` automatiza o painel externo sem API.

## Como funciona

1. Recebe `POST /tests`.
2. Exige `approvedByArthur=true`.
3. Abre Chromium com perfil persistente em `PANEL_USER_DATA_DIR`.
4. Faz login se encontrar os seletores de login.
5. Abre a pagina de teste.
6. Preenche nome, telefone e duracao de 1 hora.
7. Captura provedor, usuario, senha e vencimento.
8. Se falhar, retorna erro seguro e salva screenshot em `tester/errors`.

## Payload de criacao

```json
{
  "phone": "5511999999999",
  "customerName": "Cliente Primeflix",
  "requestId": "uuid-do-n8n",
  "approvedByArthur": true
}
```

## Resposta de sucesso

```json
{
  "ok": true,
  "provider": "provedor",
  "username": "usuario",
  "password": "senha",
  "expiresAt": "vencimento"
}
```

## Resposta de erro

```json
{
  "ok": false,
  "code": "PANEL_TEST_CREATION_FAILED",
  "message": "Nao foi possivel criar o teste com seguranca. Avise Arthur e nao envie credenciais ao cliente."
}
```

## Seletores obrigatorios

O `.env.example` traz as variaveis simples do painel:

- `TEST_PANEL_URL`
- `TEST_PANEL_USER`
- `TEST_PANEL_PASSWORD`
- `TEST_DEFAULT_DURATION_HOURS`
- `TEST_PROVIDER`

Se o painel exigir seletores especificos, configure tambem:

- `PANEL_NAME_SELECTOR`
- `PANEL_PHONE_SELECTOR`
- `PANEL_SUBMIT_SELECTOR`
- `PANEL_RESULT_USERNAME_SELECTOR`
- `PANEL_RESULT_PASSWORD_SELECTOR`
- `PANEL_RESULT_EXPIRES_SELECTOR`

## Login persistente

Para gravar uma sessao manualmente em ambiente com interface grafica:

```bash
cd tester
npm run login
```

Depois de logar, o perfil fica salvo em `PANEL_USER_DATA_DIR`.

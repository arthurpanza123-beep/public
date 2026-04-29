# Operacao

## Checklist diario

- WhatsApp conectado em `GET /health`.
- n8n ativo com o workflow `Primeflix Bot - Atendimento Principal`.
- Supabase respondendo com `SUPABASE_URL`.
- KIE API com chave valida.
- Arquivos oficiais presentes em `material/`.

## Quando Arthur assumir

O painel deve chamar o webhook `primeflix/arthur/assumir`.

O bot pausa por 30 minutos. Se Arthur nao responder e o cliente voltar depois desse prazo, o bot retoma. Arthur tambem pode devolver manualmente pelo webhook `primeflix/arthur/devolver`.

## Quando o cliente pedir teste

1. Bot pergunta se o cliente pode testar agora.
2. Cliente confirma.
3. n8n avisa Arthur.
4. Arthur aprova.
5. Playwright cria o teste.
6. Cliente recebe provedor quando existir, usuario, senha e vencimento.

Se qualquer campo obrigatorio faltar, nada e enviado ao cliente.

## Quando o cliente pedir valores

Enviar somente `valor.jpeg`. A IA nao deve escrever preco, plano ou promocao.

## Black Friday

Enviar somente manualmente por Arthur, usando `black.jpeg`.

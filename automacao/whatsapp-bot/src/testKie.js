const kie = require('./kie');

const minimalKnowledgeBase = {
  buildSystemPrompt() {
    return 'Responda exatamente o que foi pedido, sem adicionar explicacoes.';
  }
};

async function main() {
  const reply = await kie.generateReply({
    customer: {
      id: 'test-kie',
      name: 'Teste KIE',
      phone: '00000000000'
    },
    messageText: 'Responda exatamente: KIE OK',
    conversationHistory: [],
    knowledgeBase: minimalKnowledgeBase,
    maxTokens: 20
  });

  console.log(`KIE_TEST_RESPONSE=${reply}`);
  if (!/KIE OK/i.test(reply)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('KIE_TEST_ERROR=', {
    message: error.message,
    status: error.response?.status,
    body: error.response?.data
  });
  process.exitCode = 1;
});

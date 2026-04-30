const kie = require('./kie');
const knowledgeBase = require('./knowledgeBase');

async function main() {
  const reply = await kie.generateReply({
    customer: {
      id: 'test-kie',
      name: 'Teste KIE',
      phone: '00000000000'
    },
    messageText: 'Responda apenas: KIE OK',
    conversationHistory: [],
    knowledgeBase
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

const logger = require('./logger');
const supabase = require('./supabase');

function shouldSuggest({ question, answer, source }) {
  if (!question || !answer) return false;
  if (String(question).trim().length < 3) return false;
  if (String(answer).trim().length < 12) return false;
  return ['kie', 'local_ai', 'needs_arthur'].includes(source);
}

async function suggestKnowledge({ customer, question, answer, category, source }) {
  if (!shouldSuggest({ question, answer, source })) return null;

  try {
    const suggestion = await supabase.createKnowledgeSuggestion({
      customerId: customer?.id || null,
      phone: customer?.phone || '',
      question,
      suggestedAnswer: answer,
      category: category || 'unknown',
      source
    });
    logger.info({ suggestionId: suggestion?.id, category, source }, 'KNOWLEDGE_SUGGESTION_CREATED');
    return suggestion;
  } catch (error) {
    logger.error({ err: error, category, source }, 'Nao foi possivel criar knowledge_suggestion.');
    return null;
  }
}

module.exports = {
  suggestKnowledge
};

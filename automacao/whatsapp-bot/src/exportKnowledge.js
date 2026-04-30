const fs = require('fs');
const path = require('path');
const config = require('./config');
const logger = require('./logger');
const supabase = require('./supabase');

function slugify(value) {
  return String(value || 'sem-titulo')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'sem-titulo';
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function markdownForSuggestion(item) {
  const answer = item.final_answer || item.suggested_answer || '';
  return [
    `# ${item.category || 'Conhecimento'} - ${item.question}`,
    '',
    `Categoria: ${item.category || 'unknown'}`,
    `Fonte: ${item.source || 'bot'}`,
    `Telefone: ${item.phone || ''}`,
    `Aprovado em: ${item.approved_at || ''}`,
    '',
    '## Pergunta',
    '',
    item.question || '',
    '',
    '## Resposta aprovada',
    '',
    answer,
    '',
    '## Regras',
    '',
    '- Usar essa resposta como conhecimento confiavel.',
    '- Nao copiar como script se a IA puder responder de forma natural.',
    '- Nao inventar preco, plano, prazo ou promocao.',
    '- Nao enviar provedor durante instalacao.'
  ].join('\n');
}

async function exportApprovedKnowledge() {
  ensureDir(config.obsidianKbDir);
  const suggestions = await supabase.getApprovedKnowledgeSuggestions({ onlyNotExported: true });
  let exported = 0;

  for (const item of suggestions) {
    const fileName = `${slugify(item.category)}-${slugify(item.question)}-${item.id.slice(0, 8)}.md`;
    const filePath = path.join(config.obsidianKbDir, fileName);
    fs.writeFileSync(filePath, markdownForSuggestion(item), 'utf8');
    await supabase.markKnowledgeSuggestionExported(item.id);
    exported += 1;
    logger.info({ fileName, suggestionId: item.id }, 'KNOWLEDGE_EXPORTED');
  }

  logger.info({ exported }, 'KNOWLEDGE_EXPORT_DONE');
  return exported;
}

if (require.main === module) {
  exportApprovedKnowledge().catch((error) => {
    logger.error({ err: error }, 'KNOWLEDGE_EXPORT_FAILED');
    process.exitCode = 1;
  });
}

module.exports = {
  exportApprovedKnowledge
};

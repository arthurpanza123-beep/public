const fs = require('fs');
const path = require('path');
const config = require('./config');
const logger = require('./logger');

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(fullPath);
    return entry.isFile() && entry.name.toLowerCase().endsWith('.md') ? [fullPath] : [];
  });
}

function scoreContent(query, content) {
  const terms = [...new Set(normalize(query).split(' ').filter((term) => term.length > 2))];
  const normalizedContent = normalize(content);
  return terms.reduce((score, term) => score + (normalizedContent.includes(term) ? 1 : 0), 0);
}

function cleanMarkdown(content) {
  return String(content || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, (match) => match.replace(/\[|\]\([^)]*\)/g, ''))
    .replace(/[#>*_`-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getRelevantNotes(query) {
  try {
    const files = listMarkdownFiles(config.obsidianKbDir);
    const snippets = files
      .map((file) => {
        const content = fs.readFileSync(file, 'utf8');
        return {
          file: path.basename(file),
          score: scoreContent(query, content),
          text: cleanMarkdown(content).slice(0, 900)
        };
      })
      .filter((item) => item.score > 0 && item.text)
      .sort((a, b) => b.score - a.score)
      .slice(0, config.obsidianMaxSnippets);

    if (snippets.length) {
      logger.info({ count: snippets.length, files: snippets.map((item) => item.file) }, 'OBSIDIAN_CONTEXT_USED');
    }

    return snippets;
  } catch (error) {
    logger.error({ err: error }, 'Erro ao carregar contexto do Obsidian.');
    return [];
  }
}

module.exports = {
  getRelevantNotes
};

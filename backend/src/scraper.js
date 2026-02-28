// src/scraper.js
// Lit le flux RSS de SimpleFlying et retourne les nouveaux articles

const Parser = require('rss-parser');
const { PrismaClient } = require('@prisma/client');

const parser = new Parser({
  customFields: {
    item: ['media:content', 'enclosure', 'content:encoded']
  }
});

const prisma = new PrismaClient();

const SIMPLEFLYING_RSS = 'https://simpleflying.com/feed/';

/**
 * Récupère les articles du RSS et filtre ceux déjà en BDD
 */
async function fetchNewArticles() {
  console.log('🔍 Récupération du flux RSS SimpleFlying...');

  let feed;
  try {
    feed = await parser.parseURL(SIMPLEFLYING_RSS);
  } catch (error) {
    console.error('❌ Erreur lors de la lecture du RSS :', error.message);
    throw error;
  }

  console.log(`📰 ${feed.items.length} articles trouvés dans le flux RSS`);

  // Filtrer les articles déjà en base
  const newArticles = [];

  for (const item of feed.items) {
    const exists = await prisma.article.findUnique({
      where: { sourceUrl: item.link }
    });

    if (!exists) {
      newArticles.push({
        sourceUrl: item.link,
        sourceTitle: item.title,
        sourcePublished: new Date(item.pubDate),
        // Contenu brut (pour le rewriting)
        rawContent: item['content:encoded'] || item.contentSnippet || item.content || '',
        // Image
        imageUrl: extractImage(item)
      });
    }
  }

  console.log(`✨ ${newArticles.length} nouveaux articles à traiter`);
  return newArticles;
}

/**
 * Tente d'extraire l'URL de l'image depuis l'item RSS
 */
function extractImage(item) {
  // Tentative 1 : media:content
  if (item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url) {
    return item['media:content']['$'].url;
  }
  // Tentative 2 : enclosure
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }
  // Tentative 3 : extraire depuis le HTML du contenu
  if (item['content:encoded']) {
    const match = item['content:encoded'].match(/<img[^>]+src="([^"]+)"/);
    if (match) return match[1];
  }
  return null;
}

module.exports = { fetchNewArticles };

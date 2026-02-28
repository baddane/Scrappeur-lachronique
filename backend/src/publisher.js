// src/publisher.js
// Sauvegarde les articles réécrits en base de données

const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');

const prisma = new PrismaClient();

/**
 * Génère un slug unique à partir du titre français
 */
async function generateUniqueSlug(titleFr) {
  let baseSlug = slugify(titleFr, {
    lower: true,
    strict: true,
    locale: 'fr'
  });

  // S'assurer que le slug est unique
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.article.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Sauvegarde un article réécrit en base de données
 * @param {Object} sourceArticle - données de l'article source
 * @param {Object} rewritten - données réécrites par Claude
 * @param {string} status - 'draft' ou 'published'
 */
async function saveArticle(sourceArticle, rewritten, status = 'published') {
  const slug = await generateUniqueSlug(rewritten.titleFr);

  const article = await prisma.article.create({
    data: {
      slug,
      sourceUrl: sourceArticle.sourceUrl,
      sourceTitle: sourceArticle.sourceTitle,
      sourcePublished: sourceArticle.sourcePublished,
      titleFr: rewritten.titleFr,
      summaryFr: rewritten.summaryFr,
      contentFr: rewritten.contentFr,
      metaDescFr: rewritten.metaDescFr,
      tags: JSON.stringify(rewritten.tags || []),
      imageUrl: sourceArticle.imageUrl || null,
      status,
      publishedAt: status === 'published' ? new Date() : null
    }
  });

  console.log(`💾 Article sauvegardé [${status}] : "${article.titleFr}" (slug: ${article.slug})`);
  return article;
}

/**
 * Publie un article en draft
 */
async function publishArticle(articleId) {
  return prisma.article.update({
    where: { id: articleId },
    data: { status: 'published', publishedAt: new Date() }
  });
}

/**
 * Récupère tous les articles publiés (pour l'API)
 */
async function getPublishedArticles({ page = 1, limit = 10, tag } = {}) {
  const skip = (page - 1) * limit;
  
  const where = { status: 'published' };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        titleFr: true,
        summaryFr: true,
        metaDescFr: true,
        tags: true,
        imageUrl: true,
        publishedAt: true,
        sourceUrl: true
      }
    }),
    prisma.article.count({ where })
  ]);

  // Parser les tags JSON
  const articlesWithTags = articles.map(a => ({
    ...a,
    tags: JSON.parse(a.tags || '[]')
  }));

  return {
    articles: articlesWithTags,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Récupère un article par son slug
 */
async function getArticleBySlug(slug) {
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) return null;
  return { ...article, tags: JSON.parse(article.tags || '[]') };
}

module.exports = { saveArticle, publishArticle, getPublishedArticles, getArticleBySlug };

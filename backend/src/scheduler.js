// src/scheduler.js
// Orchestre le pipeline complet : scraping → réécriture → publication

const cron = require('node-cron');
const { fetchNewArticles } = require('./scraper');
const { rewriteArticle } = require('./rewriter');
const { saveArticle } = require('./publisher');

/**
 * Lance le pipeline complet pour un seul article
 */
async function processArticle(article) {
  try {
    const rewritten = await rewriteArticle(article);
    await saveArticle(article, rewritten, 'published');
    return true;
  } catch (error) {
    console.error(`❌ Échec pour "${article.sourceTitle}" :`, error.message);
    return false;
  }
}

/**
 * Pipeline complet : fetch → rewrite → save
 * Traite les articles avec un délai entre chaque pour ne pas surcharger l'API
 */
async function runPipeline() {
  console.log('\n🚀 Démarrage du pipeline...');
  console.log(`⏰ ${new Date().toLocaleString('fr-FR')}`);

  try {
    const newArticles = await fetchNewArticles();

    if (newArticles.length === 0) {
      console.log('✅ Aucun nouvel article. À bientôt !');
      return;
    }

    // Traiter les articles un par un avec un délai de 3s entre chaque
    // pour éviter de spammer l'API Claude
    let success = 0;
    let failed = 0;

    for (const article of newArticles) {
      const ok = await processArticle(article);
      if (ok) success++;
      else failed++;

      // Pause de 3 secondes entre chaque article
      if (newArticles.indexOf(article) < newArticles.length - 1) {
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    console.log(`\n📊 Pipeline terminé : ${success} publiés, ${failed} erreurs`);

  } catch (error) {
    console.error('💥 Erreur critique dans le pipeline :', error.message);
  }
}

/**
 * Démarre le scheduler
 */
function startScheduler() {
  const schedule = process.env.CRON_SCHEDULE || '0 */6 * * *';
  
  console.log(`⏰ Scheduler démarré (${schedule} = toutes les 6h)`);
  console.log('🔁 Premier lancement immédiat...\n');

  // Lancer une fois au démarrage
  runPipeline();

  // Puis selon le schedule cron
  cron.schedule(schedule, () => {
    runPipeline();
  });
}

module.exports = { startScheduler, runPipeline };

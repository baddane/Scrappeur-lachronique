// src/index.js
// Serveur Express : expose l'API REST pour le frontend

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { startScheduler, runPipeline } = require('./scheduler');
const { getPublishedArticles, getArticleBySlug } = require('./publisher');
const { getProvidersInfo } = require('./rewriter');

const app = express();
const PORT = process.env.PORT || 3001;
const ENV_PATH = path.resolve(__dirname, '../.env');

app.use(cors());
app.use(express.json());

// ─── ROUTES ARTICLES ──────────────────────────────────────────────────────────

app.get('/api/articles', async (req, res) => {
  try {
    const { page = 1, limit = 10, tag } = req.query;
    const data = await getPublishedArticles({ page: parseInt(page), limit: parseInt(limit), tag });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/articles/:slug', async (req, res) => {
  try {
    const article = await getArticleBySlug(req.params.slug);
    if (!article) return res.status(404).json({ error: 'Article non trouvé' });
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── ROUTES LLM ───────────────────────────────────────────────────────────────

/**
 * GET /api/llm/providers
 * Retourne les providers disponibles, les modèles, et lequel est actif
 */
app.get('/api/llm/providers', (req, res) => {
  try {
    res.json(getProvidersInfo());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/llm/switch
 * Change le provider et/ou le modèle actif
 * Body: { provider: "claude"|"openai"|"gemini"|"deepseek", model?: "..." }
 * Protégé par x-admin-token
 */
app.post('/api/llm/switch', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const { provider, model } = req.body;
  if (!provider) return res.status(400).json({ error: 'Champ "provider" requis' });

  try {
    // Mise à jour immédiate en mémoire
    process.env.LLM_PROVIDER = provider;
    if (model) process.env.LLM_MODEL = model;
    else delete process.env.LLM_MODEL;

    // Persistance dans .env
    if (fs.existsSync(ENV_PATH)) {
      let envContent = fs.readFileSync(ENV_PATH, 'utf8');
      if (envContent.includes('LLM_PROVIDER=')) {
        envContent = envContent.replace(/LLM_PROVIDER=.*/g, `LLM_PROVIDER=${provider}`);
      } else {
        envContent += `\nLLM_PROVIDER=${provider}`;
      }
      if (model) {
        if (envContent.includes('LLM_MODEL=')) {
          envContent = envContent.replace(/LLM_MODEL=.*/g, `LLM_MODEL=${model}`);
        } else {
          envContent += `\nLLM_MODEL=${model}`;
        }
      }
      fs.writeFileSync(ENV_PATH, envContent);
    }

    const info = getProvidersInfo();
    console.log(`🔄 LLM changé → ${info.active.name} (${info.active.model})`);
    res.json({ message: 'Provider changé avec succès', active: info.active });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── ROUTES PIPELINE ──────────────────────────────────────────────────────────

app.post('/api/pipeline/run', async (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  res.json({ message: 'Pipeline lancé en arrière-plan' });
  runPipeline();
});

app.get('/api/health', (req, res) => {
  const info = getProvidersInfo();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: '🛫 La Chronique du Ciel - Backend opérationnel',
    llm: info.active
  });
});

// ─── DÉMARRAGE ───────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  const info = getProvidersInfo();
  console.log(`\n🛫 La Chronique du Ciel - Backend`);
  console.log(`📡 API disponible sur http://localhost:${PORT}`);
  console.log(`🤖 LLM actif : ${info.active ? `${info.active.name} (${info.active.model})` : '⚠️  Aucun provider configuré'}`);
  console.log(`🔍 Health : http://localhost:${PORT}/api/health\n`);
  startScheduler();
});

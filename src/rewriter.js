// src/rewriter.js
// Réécriture multi-LLM : Claude, Gemini, DeepSeek, OpenAI

// ─── CONFIGURATION DES PROVIDERS ────────────────────────────────────────────

const PROVIDERS = {
  claude: {
    name: 'Claude (Anthropic)',
    models: {
      'claude-sonnet-4-6':          'Claude Sonnet 4.6 (recommandé)',
      'claude-opus-4-6':            'Claude Opus 4.6 (le plus puissant)',
      'claude-haiku-4-5-20251001':  'Claude Haiku 4.5 (le plus rapide)',
    },
    defaultModel: 'claude-sonnet-4-6',
    envKey: 'ANTHROPIC_API_KEY'
  },
  openai: {
    name: 'OpenAI (ChatGPT)',
    models: {
      'gpt-4o':       'GPT-4o (recommandé)',
      'gpt-4o-mini':  'GPT-4o Mini (rapide)',
      'gpt-4-turbo':  'GPT-4 Turbo',
    },
    defaultModel: 'gpt-4o',
    envKey: 'OPENAI_API_KEY'
  },
  gemini: {
    name: 'Gemini (Google)',
    models: {
      'gemini-2.0-flash':  'Gemini 2.0 Flash (recommandé)',
      'gemini-1.5-pro':    'Gemini 1.5 Pro',
      'gemini-1.5-flash':  'Gemini 1.5 Flash (rapide)',
    },
    defaultModel: 'gemini-2.0-flash',
    envKey: 'GEMINI_API_KEY'
  },
  deepseek: {
    name: 'DeepSeek',
    models: {
      'deepseek-chat':      'DeepSeek Chat V3 (recommandé)',
      'deepseek-reasoner':  'DeepSeek Reasoner R1',
    },
    defaultModel: 'deepseek-chat',
    envKey: 'DEEPSEEK_API_KEY'
  }
};

// ─── PROMPT COMMUN ────────────────────────────────────────────────────────────

function buildPrompt(article) {
  return `Tu es le rédacteur en chef de "La Chronique du Ciel", un média français spécialisé dans l'aviation civile, les compagnies aériennes, les aéroports et l'industrie aéronautique.

Tu vas réécrire cet article anglais en français. Ce n'est PAS une traduction : tu dois réécrire l'article avec ton propre style éditorial, en gardant les faits essentiels mais en l'adaptant pour un lecteur français passionné d'aviation.

ARTICLE SOURCE :
Titre : ${article.sourceTitle}
URL source : ${article.sourceUrl}
Contenu :
${article.rawContent.substring(0, 4000)}

CONSIGNES :
- Titre accrocheur en français (pas une traduction littérale du titre anglais)
- Style journalistique, dynamique, accessible mais expert
- Conserve tous les faits importants : chiffres, noms de compagnies, modèles d'avions
- Adapte les unités si pertinent (miles → km, etc.)
- Longueur : entre 400 et 700 mots
- Pas de mention que cet article est une réécriture d'un article anglais

Réponds UNIQUEMENT avec ce JSON (sans balises markdown, sans explication) :
{
  "titleFr": "Titre de l'article en français",
  "summaryFr": "Résumé de 2-3 phrases pour la page d'accueil",
  "contentFr": "Contenu complet de l'article en HTML simple (utilise <p>, <h2>, <strong>, <ul>, <li>)",
  "metaDescFr": "Description SEO de 155 caractères maximum",
  "tags": ["tag1", "tag2", "tag3"]
}`;
}

function parseResponse(text) {
  // Tentative 1 : nettoyage des balises markdown et parse direct
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch { /* fallback ci-dessous */ }

  // Tentative 2 : extraire le premier objet JSON valide dans le texte
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error('Aucun JSON valide trouvé dans la réponse du LLM');
}

// ─── APPELS PAR PROVIDER ──────────────────────────────────────────────────────

async function callClaude(prompt, model) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });
  return response.content[0].text.trim();
}

async function callOpenAI(prompt, model) {
  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });
  return response.choices[0].message.content.trim();
}

async function callGemini(prompt, model) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const geminiModel = genAI.getGenerativeModel({ model });
  const result = await geminiModel.generateContent(prompt);
  return result.response.text().trim();
}

async function callDeepSeek(prompt, model) {
  // DeepSeek est compatible avec l'API OpenAI
  const OpenAI = require('openai');
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com'
  });
  const response = await client.chat.completions.create({
    model,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });
  return response.choices[0].message.content.trim();
}

// ─── RÉSOLUTION DU PROVIDER ACTIF ────────────────────────────────────────────

function getActiveProvider() {
  const providerKey = (process.env.LLM_PROVIDER || 'claude').toLowerCase();
  const config = PROVIDERS[providerKey];

  if (!config) {
    throw new Error(`Provider inconnu : "${providerKey}". Valeurs possibles : ${Object.keys(PROVIDERS).join(', ')}`);
  }

  const model = process.env.LLM_MODEL || config.defaultModel;
  const apiKey = process.env[config.envKey];

  if (!apiKey) {
    throw new Error(`Clé API manquante pour ${config.name} — ajoutez ${config.envKey} dans votre .env`);
  }

  return { provider: providerKey, model, config };
}

// ─── FONCTION PRINCIPALE ──────────────────────────────────────────────────────

/**
 * Réécrit un article via le LLM configuré dans .env
 * LLM_PROVIDER = claude | openai | gemini | deepseek
 * LLM_MODEL    = nom du modèle (optionnel, utilise le défaut du provider)
 */
async function rewriteArticle(article) {
  const { provider, model, config } = getActiveProvider();

  console.log(`✍️  [${config.name}] Réécriture de : "${article.sourceTitle}"`);

  const prompt = buildPrompt(article);

  let rawText;
  try {
    switch (provider) {
      case 'claude':    rawText = await callClaude(prompt, model);    break;
      case 'openai':    rawText = await callOpenAI(prompt, model);    break;
      case 'gemini':    rawText = await callGemini(prompt, model);    break;
      case 'deepseek':  rawText = await callDeepSeek(prompt, model);  break;
    }
  } catch (error) {
    console.error(`❌ Erreur API ${config.name} :`, error.message);
    throw error;
  }

  try {
    const result = parseResponse(rawText);
    console.log(`✅ [${config.name}/${model}] "${result.titleFr}"`);
    return { ...result, llmProvider: provider, llmModel: model };
  } catch {
    console.error('❌ JSON invalide reçu du LLM. Extrait :', rawText.substring(0, 300));
    throw new Error(`${config.name} n'a pas retourné un JSON valide`);
  }
}

/**
 * Retourne les providers disponibles et l'état des clés API
 * Utilisé par la route GET /api/llm/providers
 */
function getProvidersInfo() {
  let active;
  try {
    active = getActiveProvider();
  } catch (e) {
    active = null;
  }

  return {
    active: active
      ? { provider: active.provider, model: active.model, name: active.config.name }
      : null,
    providers: Object.entries(PROVIDERS).map(([key, config]) => ({
      key,
      name: config.name,
      hasApiKey: !!process.env[config.envKey],
      defaultModel: config.defaultModel,
      models: Object.entries(config.models).map(([modelKey, modelName]) => ({
        key: modelKey,
        name: modelName,
        isDefault: modelKey === config.defaultModel
      }))
    }))
  };
}

module.exports = { rewriteArticle, getProvidersInfo, PROVIDERS };

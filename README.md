# ✈ La Chronique du Ciel — Guide de démarrage

Bienvenue ! Ce projet est un mini-SaaS qui :
1. Récupère automatiquement les articles de SimpleFlying (via RSS)
2. Les réécrit en français avec l'IA Claude
3. Les publie sur ton site lachroniqueduciel.com

---

## 📁 Structure du projet

```
lachroniqueduciel/
├── backend/    ← API Node.js + scraper + IA
└── frontend/   ← Site Next.js
```

---

## 🚀 Installation — Étape par étape

### Prérequis
- Node.js installé (https://nodejs.org — prends la version LTS)
- Un compte Anthropic pour la clé API (https://console.anthropic.com)

---

### 1️⃣ Backend

```bash
cd backend

# Installer les dépendances
npm install

# Copier le fichier de configuration
cp .env.example .env

# Ouvrir .env et ajouter ta clé API Anthropic :
# ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx

# Créer la base de données
npx prisma generate
npx prisma db push

# Démarrer le serveur (développement)
npm run dev
```

Le backend tourne sur **http://localhost:3001**

---

### 2️⃣ Frontend

Dans un autre terminal :

```bash
cd frontend

# Installer les dépendances
npm install

# Copier le fichier de configuration
cp .env.example .env

# Démarrer le site
npm run dev
```

Le site est disponible sur **http://localhost:3000** 🎉

---

## ⚙️ Configuration

### Fréquence du scraping (backend/.env)

```env
# Toutes les 6 heures (par défaut)
CRON_SCHEDULE="0 */6 * * *"

# Toutes les heures
CRON_SCHEDULE="0 * * * *"

# Une fois par jour à 8h du matin
CRON_SCHEDULE="0 8 * * *"
```

### Lancer le pipeline manuellement

```bash
curl -X POST http://localhost:3001/api/pipeline/run \
  -H "x-admin-token: TON_TOKEN_ADMIN"
```

(Ajoute `ADMIN_TOKEN=montoken` dans ton `.env`)

---

## 🌍 Mise en production

### Option recommandée : Railway

1. Va sur https://railway.app
2. Crée un nouveau projet
3. "Deploy from GitHub" → pousse ton code sur GitHub d'abord
4. Ajoute les variables d'environnement dans Railway
5. Ton backend sera accessible via une URL Railway

### Frontend sur Vercel

1. Va sur https://vercel.com
2. Importe ton repo GitHub (dossier `frontend`)
3. Ajoute `NEXT_PUBLIC_API_URL=https://ton-backend.railway.app`
4. Deploy !

---

## 🔌 API disponibles

| Route | Description |
|---|---|
| `GET /api/articles` | Liste des articles (params: page, limit) |
| `GET /api/articles/:slug` | Détail d'un article |
| `POST /api/pipeline/run` | Lancer le scraping manuellement |
| `GET /api/health` | Vérifier que le serveur tourne |

---

## 🐛 Problèmes courants

**"Cannot find module @prisma/client"**
→ Lance `npx prisma generate` dans le dossier `backend`

**"Invalid API Key"**
→ Vérifie que ta clé Anthropic est bien dans `backend/.env`

**Articles vides sur le site**
→ Attends quelques secondes, le pipeline tourne au démarrage. Vérifie les logs du backend.

---

## 💡 Idées d'évolutions

- Panel d'administration pour modérer les articles avant publication
- Newsletter automatique par email (Mailchimp, Resend)
- Catégories : Compagnies, Aéroports, Constructeurs, Incidents
- Moteur de recherche
- Compte Twitter/X automatisé pour partager les articles

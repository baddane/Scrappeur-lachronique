// components/LLMSwitcher.js
// Panneau d'administration pour changer de LLM à la volée

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const PROVIDER_ICONS = {
  claude:   '🟠',
  openai:   '🟢',
  gemini:   '🔵',
  deepseek: '🟣'
};

export default function LLMSwitcher({ adminToken }) {
  const [info, setInfo]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [switching, setSwitching] = useState(false);
  const [selected, setSelected]   = useState({ provider: '', model: '' });
  const [feedback, setFeedback]   = useState(null);

  // Charger les providers au montage
  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    try {
      const res = await fetch(`${API_URL}/api/llm/providers`);
      const data = await res.json();
      setInfo(data);
      if (data.active) {
        setSelected({ provider: data.active.provider, model: data.active.model });
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Impossible de contacter le backend' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSwitch() {
    if (!adminToken) {
      setFeedback({ type: 'error', message: 'Token admin requis' });
      return;
    }
    setSwitching(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/api/llm/switch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        },
        body: JSON.stringify({ provider: selected.provider, model: selected.model })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFeedback({ type: 'success', message: `✅ Basculé vers ${data.active.name} (${data.active.model})` });
      await fetchProviders();
    } catch (e) {
      setFeedback({ type: 'error', message: `❌ ${e.message}` });
    } finally {
      setSwitching(false);
    }
  }

  // Quand on change de provider, reset le modèle au défaut
  function handleProviderChange(providerKey) {
    const providerInfo = info.providers.find(p => p.key === providerKey);
    setSelected({
      provider: providerKey,
      model: providerInfo?.defaultModel || ''
    });
  }

  if (loading) return <div className="llm-switcher"><p>Chargement...</p></div>;
  if (!info)   return null;

  const activeProvider = info.providers.find(p => p.key === selected.provider);
  const isCurrentActive =
    info.active &&
    info.active.provider === selected.provider &&
    info.active.model === selected.model;

  return (
    <div className="llm-switcher">
      <h3 className="llm-switcher-title">🤖 Moteur IA</h3>

      {/* Provider actif */}
      {info.active && (
        <div className="llm-active-badge">
          {PROVIDER_ICONS[info.active.provider]} Actif : <strong>{info.active.name}</strong>
          <span className="llm-model-chip">{info.active.model}</span>
        </div>
      )}

      {/* Sélecteur de provider */}
      <div className="llm-provider-grid">
        {info.providers.map(p => (
          <button
            key={p.key}
            className={`llm-provider-btn ${selected.provider === p.key ? 'selected' : ''} ${!p.hasApiKey ? 'no-key' : ''}`}
            onClick={() => handleProviderChange(p.key)}
            title={!p.hasApiKey ? `Clé API manquante` : p.name}
          >
            <span className="llm-provider-icon">{PROVIDER_ICONS[p.key]}</span>
            <span className="llm-provider-name">{p.name.split(' ')[0]}</span>
            {!p.hasApiKey && <span className="llm-no-key">⚠️</span>}
          </button>
        ))}
      </div>

      {/* Sélecteur de modèle */}
      {activeProvider && (
        <div className="llm-model-select-wrap">
          <label>Modèle</label>
          <select
            value={selected.model}
            onChange={e => setSelected(s => ({ ...s, model: e.target.value }))}
            className="llm-model-select"
          >
            {activeProvider.models.map(m => (
              <option key={m.key} value={m.key}>{m.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Bouton de switch */}
      <button
        className="llm-switch-btn"
        onClick={handleSwitch}
        disabled={switching || isCurrentActive || !activeProvider?.hasApiKey}
      >
        {switching ? '⏳ Changement...' : isCurrentActive ? '✓ Déjà actif' : '↺ Appliquer'}
      </button>

      {/* Feedback */}
      {feedback && (
        <p className={`llm-feedback ${feedback.type}`}>{feedback.message}</p>
      )}

      <style jsx>{`
        .llm-switcher {
          background: white;
          border: 1px solid #e0e7ef;
          border-radius: 12px;
          padding: 20px;
          font-family: sans-serif;
        }
        .llm-switcher-title {
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 14px;
          color: #0d1b2a;
        }
        .llm-active-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          color: #555;
          background: #f0f7ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 8px 12px;
          margin-bottom: 14px;
        }
        .llm-model-chip {
          background: #1a73e8;
          color: white;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.72rem;
          margin-left: 4px;
        }
        .llm-provider-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 14px;
        }
        .llm-provider-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 8px;
          border: 2px solid #e0e7ef;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.15s;
          font-size: 0.78rem;
          color: #333;
          position: relative;
        }
        .llm-provider-btn:hover {
          border-color: #1a73e8;
          background: #f0f7ff;
        }
        .llm-provider-btn.selected {
          border-color: #1a73e8;
          background: #e8f0fe;
          color: #1a73e8;
          font-weight: 600;
        }
        .llm-provider-btn.no-key {
          opacity: 0.6;
        }
        .llm-provider-icon { font-size: 1.4rem; }
        .llm-no-key {
          position: absolute;
          top: 4px;
          right: 4px;
          font-size: 0.65rem;
        }
        .llm-model-select-wrap {
          margin-bottom: 14px;
        }
        .llm-model-select-wrap label {
          display: block;
          font-size: 0.78rem;
          color: #666;
          margin-bottom: 4px;
        }
        .llm-model-select {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.82rem;
          background: white;
          color: #333;
        }
        .llm-switch-btn {
          width: 100%;
          padding: 10px;
          background: #1a73e8;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .llm-switch-btn:hover:not(:disabled) {
          background: #1557b0;
        }
        .llm-switch-btn:disabled {
          background: #9db8d8;
          cursor: not-allowed;
        }
        .llm-feedback {
          margin-top: 10px;
          font-size: 0.82rem;
          padding: 8px 10px;
          border-radius: 6px;
        }
        .llm-feedback.success {
          background: #dcfce7;
          color: #166534;
        }
        .llm-feedback.error {
          background: #fee2e2;
          color: #991b1b;
        }
      `}</style>
    </div>
  );
}

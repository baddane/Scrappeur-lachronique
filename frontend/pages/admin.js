// pages/admin.js
// Panneau d'administration : changer de LLM, lancer le pipeline

import { useState } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import LLMSwitcher from '../components/LLMSwitcher';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminPage() {
  const [token, setToken]           = useState('');
  const [authenticated, setAuth]    = useState(false);
  const [pipelineStatus, setPipeline] = useState(null);
  const [running, setRunning]       = useState(false);

  function handleLogin(e) {
    e.preventDefault();
    if (token.trim()) setAuth(true);
  }

  async function handleRunPipeline() {
    setRunning(true);
    setPipeline(null);
    try {
      const res = await fetch(`${API_URL}/api/pipeline/run`, {
        method: 'POST',
        headers: { 'x-admin-token': token }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPipeline({ type: 'success', message: '✅ ' + data.message });
    } catch (e) {
      setPipeline({ type: 'error', message: '❌ ' + e.message });
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <Head>
        <title>Administration — La Chronique du Ciel</title>
      </Head>
      <Header />

      <main style={{ maxWidth: 680, margin: '48px auto', padding: '0 24px' }}>
        <h1 style={{ fontFamily: 'sans-serif', marginBottom: 32, fontSize: '1.6rem' }}>
          ⚙️ Administration
        </h1>

        {!authenticated ? (
          /* ── LOGIN ── */
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
            <label style={{ fontFamily: 'sans-serif', fontSize: '0.9rem', color: '#555' }}>
              Token administrateur
            </label>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Votre ADMIN_TOKEN"
              style={{
                padding: '10px 14px',
                border: '1px solid #ddd',
                borderRadius: 8,
                fontSize: '0.9rem'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                background: '#0d1b2a',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'sans-serif',
                fontSize: '0.9rem'
              }}
            >
              Accéder →
            </button>
          </form>
        ) : (
          /* ── DASHBOARD ADMIN ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* LLM Switcher */}
            <LLMSwitcher adminToken={token} />

            {/* Pipeline */}
            <div style={{
              background: 'white',
              border: '1px solid #e0e7ef',
              borderRadius: 12,
              padding: 20,
              fontFamily: 'sans-serif'
            }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12, color: '#0d1b2a' }}>
                🚀 Pipeline de scraping
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 16 }}>
                Lance immédiatement la recherche de nouveaux articles sur SimpleFlying et leur réécriture avec le LLM actif.
              </p>
              <button
                onClick={handleRunPipeline}
                disabled={running}
                style={{
                  padding: '10px 20px',
                  background: running ? '#9db8d8' : '#0d1b2a',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: running ? 'not-allowed' : 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: 600
                }}
              >
                {running ? '⏳ Pipeline en cours...' : '▶ Lancer le pipeline maintenant'}
              </button>
              {pipelineStatus && (
                <p style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: '0.82rem',
                  background: pipelineStatus.type === 'success' ? '#dcfce7' : '#fee2e2',
                  color: pipelineStatus.type === 'success' ? '#166534' : '#991b1b'
                }}>
                  {pipelineStatus.message}
                </p>
              )}
            </div>

            {/* Liens utiles */}
            <div style={{
              background: '#f5f7fa',
              borderRadius: 12,
              padding: 20,
              fontFamily: 'sans-serif'
            }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12, color: '#0d1b2a' }}>
                🔗 Raccourcis API
              </h3>
              {[
                { label: 'Health check', url: `${API_URL}/api/health` },
                { label: 'Liste des articles', url: `${API_URL}/api/articles` },
                { label: 'Providers LLM', url: `${API_URL}/api/llm/providers` },
              ].map(link => (
                <div key={link.url} style={{ marginBottom: 8 }}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#1a73e8', fontSize: '0.85rem' }}
                  >
                    {link.label} →
                  </a>
                </div>
              ))}
            </div>

          </div>
        )}
      </main>
    </>
  );
}

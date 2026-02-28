// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import ArticleCard from '../components/ArticleCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/articles?page=${page}&limit=9`)
      .then(res => res.json())
      .then(data => {
        setArticles(data.articles || []);
        setPagination(data.pagination);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page]);

  return (
    <>
      <Head>
        <title>La Chronique du Ciel — L'actualité aéronautique en français</title>
        <meta name="description" content="Toute l'actualité aviation, compagnies aériennes, aéroports et industrie aéronautique en français." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <section className="hero">
        <h1>L'actualité aéronautique mondiale</h1>
        <p>Les meilleurs articles aviation, traduits et réécrits en français pour vous</p>
      </section>

      <section className="articles-section">
        <div className="container">
          <h2 className="section-title">Derniers articles</h2>

          {loading ? (
            <div className="loading">✈️ Chargement des articles...</div>
          ) : articles.length === 0 ? (
            <div className="empty-state">
              <h2>🛫 Aucun article pour l'instant</h2>
              <p>Les articles arrivent bientôt. Revenez dans quelques instants !</p>
            </div>
          ) : (
            <>
              <div className="articles-grid">
                {articles.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ← Précédent
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={p === page ? 'active' : ''}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                  >
                    Suivant →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <footer className="footer" id="a-propos">
        <p>
          © {new Date().getFullYear()} <strong style={{color: 'white'}}>La Chronique du Ciel</strong> — lachroniqueduciel.com
        </p>
        <p style={{marginTop: 8}}>
          Actualités aéronautiques réécrites en français · Contenu original :{' '}
          <a href="https://simpleflying.com" target="_blank" rel="noopener noreferrer">SimpleFlying.com</a>
        </p>
      </footer>
    </>
  );
}

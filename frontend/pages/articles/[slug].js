// pages/articles/[slug].js
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export async function getServerSideProps({ params }) {
  try {
    const res = await fetch(`${API_URL}/api/articles/${params.slug}`);
    if (!res.ok) return { notFound: true };
    const article = await res.json();
    return { props: { article } };
  } catch {
    return { notFound: true };
  }
}

export default function ArticlePage({ article }) {
  return (
    <>
      <Head>
        <title>{article.titleFr} — La Chronique du Ciel</title>
        <meta name="description" content={article.metaDescFr} />
        {article.imageUrl && <meta property="og:image" content={article.imageUrl} />}
        <meta property="og:title" content={article.titleFr} />
        <meta property="og:description" content={article.metaDescFr} />
        <meta property="og:type" content="article" />
      </Head>

      <Header />

      <main className="article-page">
        <Link href="/" className="back-link">
          ← Retour aux articles
        </Link>

        <article>
          <header className="article-header">
            {article.tags && article.tags.length > 0 && (
              <div className="article-header-tags">
                {article.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}

            <h1 className="article-title">{article.titleFr}</h1>

            <div className="article-meta">
              {article.publishedAt && (
                <span>📅 {formatDate(article.publishedAt)}</span>
              )}
              <span>✍️ La Chronique du Ciel</span>
            </div>
          </header>

          {article.imageUrl && (
            <img
              className="article-cover"
              src={article.imageUrl}
              alt={article.titleFr}
            />
          )}

          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: article.contentFr }}
          />

          <div className="article-source">
            📌 Article inspiré de la source originale :{' '}
            <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
              {article.sourceTitle}
            </a>{' '}
            — SimpleFlying.com
          </div>
        </article>
      </main>

      <footer className="footer">
        <p>
          © {new Date().getFullYear()}{' '}
          <strong style={{ color: 'white' }}>La Chronique du Ciel</strong> — lachroniqueduciel.com
        </p>
      </footer>
    </>
  );
}

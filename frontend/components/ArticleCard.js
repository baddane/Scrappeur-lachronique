// components/ArticleCard.js
import Link from 'next/link';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export default function ArticleCard({ article }) {
  return (
    <article className="article-card">
      <Link href={`/articles/${article.slug}`}>
        {article.imageUrl ? (
          <img
            className="article-card-image"
            src={article.imageUrl}
            alt={article.titleFr}
            loading="lazy"
          />
        ) : (
          <div className="article-card-image-placeholder">✈️</div>
        )}
      </Link>

      <div className="article-card-body">
        {article.tags && article.tags.length > 0 && (
          <div className="article-card-tags">
            {article.tags.slice(0, 3).map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}

        <Link href={`/articles/${article.slug}`}>
          <h2 className="article-card-title">{article.titleFr}</h2>
        </Link>

        <p className="article-card-summary">{article.summaryFr}</p>
      </div>

      <div className="article-card-footer">
        <span className="article-date">
          {article.publishedAt ? formatDate(article.publishedAt) : ''}
        </span>
        <Link href={`/articles/${article.slug}`} className="read-more">
          Lire la suite →
        </Link>
      </div>
    </article>
  );
}

// components/Header.js
import Link from 'next/link';

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="logo">
          <span className="logo-title">✈ La Chronique du Ciel</span>
          <span className="logo-subtitle">L'actualité aéronautique en français</span>
        </Link>
        <nav className="header-nav">
          <Link href="/">Accueil</Link>
          <Link href="/#a-propos">À propos</Link>
        </nav>
      </div>
    </header>
  );
}

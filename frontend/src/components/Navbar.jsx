import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/', label: 'Minhas Rotas' },
  { to: '/nova-rota', label: 'Nova Rota' },
  { to: '/historico', label: 'Histórico' },
  { to: '/configuracoes', label: 'Configurações' },
];

export default function Navbar() {
  const [aberto, setAberto] = useState(false);
  const { pathname } = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          ✈️ Flight Alert
        </Link>

        {/* Menu desktop */}
        <div className="navbar-links">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${pathname === link.to ? 'ativo' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Hamburguer mobile */}
        <button
          className="navbar-hamburger"
          onClick={() => setAberto(!aberto)}
          aria-label="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Menu mobile expandido */}
      {aberto && (
        <div className="navbar-mobile">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link-mobile ${pathname === link.to ? 'ativo' : ''}`}
              onClick={() => setAberto(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

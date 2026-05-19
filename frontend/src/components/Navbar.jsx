import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Minhas Rotas' },
  { to: '/nova-rota', label: 'Nova Rota' },
  { to: '/historico', label: 'Histórico' },
  { to: '/configuracoes', label: 'Configurações' },
];

export default function Navbar() {
  const [aberto, setAberto] = useState(false);
  const { pathname } = useLocation();
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
    setAberto(false);
  }

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
          <div className="navbar-usuario">
            <Link to="/perfil" className={`nav-link nav-link-usuario ${pathname === '/perfil' ? 'ativo' : ''}`}>
              👤 {usuario?.nome?.split(' ')[0]}
            </Link>
            <button onClick={handleLogout} className="btn-logout">
              Sair
            </button>
          </div>
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
          <Link
            to="/perfil"
            className={`nav-link-mobile ${pathname === '/perfil' ? 'ativo' : ''}`}
            onClick={() => setAberto(false)}
          >
            👤 Meu Perfil
          </Link>
          <button onClick={handleLogout} className="nav-link-mobile btn-logout-mobile">
            Sair
          </button>
        </div>
      )}
    </nav>
  );
}

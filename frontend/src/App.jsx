import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import NovaRota from './pages/NovaRota';
import Historico from './pages/Historico';
import Configuracoes from './pages/Configuracoes';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Perfil from './pages/Perfil';
import './index.css';

function RotaProtegida({ children }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return <div className="loading-full">Carregando...</div>;
  if (!usuario) return <Navigate to="/login" replace />;
  return children;
}

function RotaPublica({ children }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return <div className="loading-full">Carregando...</div>;
  if (usuario) return <Navigate to="/" replace />;
  return children;
}

function Layout() {
  const { usuario } = useAuth();
  return (
    <>
      {usuario && <Navbar />}
      <main className={usuario ? 'main-content' : ''}>
        <Routes>
          <Route path="/login" element={<RotaPublica><Login /></RotaPublica>} />
          <Route path="/registro" element={<RotaPublica><Registro /></RotaPublica>} />
          <Route path="/" element={<RotaProtegida><Home /></RotaProtegida>} />
          <Route path="/nova-rota" element={<RotaProtegida><NovaRota /></RotaProtegida>} />
          <Route path="/historico" element={<RotaProtegida><Historico /></RotaProtegida>} />
          <Route path="/configuracoes" element={<RotaProtegida><Configuracoes /></RotaProtegida>} />
          <Route path="/perfil" element={<RotaProtegida><Perfil /></RotaProtegida>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  );
}

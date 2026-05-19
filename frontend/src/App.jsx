import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import NovaRota from './pages/NovaRota';
import Historico from './pages/Historico';
import Configuracoes from './pages/Configuracoes';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nova-rota" element={<NovaRota />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

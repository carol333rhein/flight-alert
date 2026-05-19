import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import RotaCard from '../components/RotaCard';

export default function Home() {
  const [rotas, setRotas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  async function carregarRotas() {
    try {
      const { data } = await axios.get('/api/rotas');
      setRotas(data);
      setErro('');
    } catch (e) {
      setErro('Não foi possível carregar as rotas. Verifique se o servidor está rodando.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregarRotas(); }, []);

  if (carregando) {
    return (
      <div className="pagina-loading">
        <div className="spinner"></div>
        <p>Carregando rotas...</p>
      </div>
    );
  }

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Minhas Rotas</h1>
          <p className="pagina-subtitulo">
            {rotas.length === 0
              ? 'Nenhuma rota cadastrada ainda.'
              : `${rotas.filter(r => r.ativa).length} de ${rotas.length} rota(s) ativa(s)`}
          </p>
        </div>
        <Link to="/nova-rota" className="btn btn-primario">
          + Nova Rota
        </Link>
      </div>

      {erro && <div className="alert alert-erro">{erro}</div>}

      {rotas.length === 0 && !erro ? (
        <div className="empty-state">
          <div className="empty-icone">✈️</div>
          <h2>Nenhuma rota monitorada</h2>
          <p>Adicione sua primeira rota para começar a receber alertas de passagens!</p>
          <Link to="/nova-rota" className="btn btn-primario">
            Adicionar primeira rota
          </Link>
        </div>
      ) : (
        <div className="grid-rotas">
          {rotas.map(rota => (
            <RotaCard
              key={rota.id}
              rota={rota}
              onAtualizar={carregarRotas}
              onDeletar={(id) => setRotas(prev => prev.filter(r => r.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

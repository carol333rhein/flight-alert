import { useEffect, useState } from 'react';
import axios from 'axios';
import GraficoPreco from '../components/GraficoPreco';

function formatarDataHora(dataStr) {
  return new Date(dataStr).toLocaleString('pt-BR');
}

export default function Historico() {
  const [rotas, setRotas] = useState([]);
  const [rotaSelecionada, setRotaSelecionada] = useState('');
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    axios.get('/api/rotas').then(({ data }) => setRotas(data));
  }, []);

  async function carregarHistorico(rotaId) {
    setRotaSelecionada(rotaId);
    if (!rotaId) { setDados(null); return; }
    setCarregando(true);
    try {
      const { data } = await axios.get(`/api/historico/${rotaId}`);
      setDados(data);
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Histórico de Preços</h1>
          <p className="pagina-subtitulo">Acompanhe a evolução dos preços ao longo do tempo</p>
        </div>
      </div>

      <div className="form-card" style={{ marginBottom: 24 }}>
        <div className="form-group">
          <label>Selecione a rota</label>
          <select
            className="input"
            value={rotaSelecionada}
            onChange={e => carregarHistorico(e.target.value)}
          >
            <option value="">— Escolha uma rota —</option>
            {rotas.map(r => (
              <option key={r.id} value={r.id}>
                {r.origem} → {r.destino}
                {r.data_ida ? ` (${r.data_ida})` : ''}
                {!r.ativa ? ' [pausada]' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {carregando && (
        <div className="pagina-loading">
          <div className="spinner"></div>
          <p>Carregando histórico...</p>
        </div>
      )}

      {!carregando && dados && (
        <>
          <div className="historico-resumo">
            <div className="resumo-card">
              <span className="resumo-label">Rota</span>
              <span className="resumo-valor">{dados.rota.origem} → {dados.rota.destino}</span>
            </div>
            <div className="resumo-card">
              <span className="resumo-label">Registros</span>
              <span className="resumo-valor">{dados.historico.length}</span>
            </div>
            <div className="resumo-card">
              <span className="resumo-label">Média histórica</span>
              <span className="resumo-valor">
                {dados.media ? `R$ ${dados.media.toFixed(2)}` : '—'}
              </span>
            </div>
            <div className="resumo-card">
              <span className="resumo-label">Limite máximo</span>
              <span className="resumo-valor">R$ {dados.rota.preco_maximo.toFixed(2)}</span>
            </div>
          </div>

          <div className="form-card">
            <h3 className="secao-titulo">Gráfico de Evolução</h3>
            <GraficoPreco
              historico={dados.historico}
              precoMaximo={dados.rota.preco_maximo}
              media={dados.media}
            />
          </div>

          <div className="form-card">
            <h3 className="secao-titulo">Registros Detalhados</h3>
            {dados.historico.length === 0 ? (
              <p className="texto-vazio">Nenhum registro ainda. Clique em "Verificar agora" na rota.</p>
            ) : (
              <div className="tabela-wrapper">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Data / Hora</th>
                      <th>Preço</th>
                      <th>Companhia</th>
                      <th>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.historico.map(h => (
                      <tr key={h.id}>
                        <td>{formatarDataHora(h.verificado_em)}</td>
                        <td className={h.preco <= dados.rota.preco_maximo ? 'preco-ok' : 'preco-alto'}>
                          R$ {h.preco.toFixed(2)}
                        </td>
                        <td>{h.cia_aerea || '—'}</td>
                        <td>
                          {h.link_compra ? (
                            <a href={h.link_compra} target="_blank" rel="noopener noreferrer" className="link-ver">
                              Ver →
                            </a>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {!carregando && !dados && !rotaSelecionada && (
        <div className="empty-state">
          <div className="empty-icone">📊</div>
          <h2>Selecione uma rota acima</h2>
          <p>O gráfico e os registros de preço serão exibidos aqui.</p>
        </div>
      )}
    </div>
  );
}

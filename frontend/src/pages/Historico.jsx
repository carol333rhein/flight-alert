import { useEffect, useState } from 'react';
import axios from 'axios';
import GraficoPreco from '../components/GraficoPreco';

function formatarDataHora(dataStr) {
  return new Date(dataStr).toLocaleString('pt-BR');
}

function formatarData(dataStr) {
  if (!dataStr) return null;
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

function RotaHistoricoCard({ rota }) {
  const [aberto, setAberto] = useState(false);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);

  async function toggleAbrir() {
    if (aberto) { setAberto(false); return; }
    setAberto(true);
    if (dados) return; // já carregado
    setCarregando(true);
    try {
      const { data } = await axios.get(`/api/historico/${rota.id}`);
      setDados(data);
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }

  const tipoVoo = rota.tipo_voo === 'so_ida' ? 'Só ida' : 'Ida e volta';
  const temHistorico = dados?.historico?.length > 0;
  const ultimoPreco = dados?.historico?.[0];

  return (
    <div className={`rota-hist-card ${aberto ? 'aberto' : ''}`}>
      <button className="rota-hist-header" onClick={toggleAbrir}>
        <div className="rota-hist-info">
          <span className="rota-hist-titulo">
            ✈️ {rota.origem} <span className="seta">→</span> {rota.destino}
          </span>
          <div className="rota-hist-meta">
            <span className="meta-tag">{tipoVoo}</span>
            {rota.flexivel
              ? <span className="meta-tag">Datas flexíveis</span>
              : rota.data_ida && <span className="meta-tag">{formatarData(rota.data_ida)}{rota.data_volta ? ` → ${formatarData(rota.data_volta)}` : ''}</span>
            }
            <span className="meta-tag limite">Limite: R$ {rota.preco_maximo.toLocaleString('pt-BR')}</span>
          </div>
        </div>
        <div className="rota-hist-direita">
          {ultimoPreco && (
            <span className={`ultimo-preco ${ultimoPreco.preco <= rota.preco_maximo ? 'preco-ok' : 'preco-alto'}`}>
              R$ {ultimoPreco.preco.toLocaleString('pt-BR')}
            </span>
          )}
          <span className="chevron">{aberto ? '▲' : '▼'}</span>
        </div>
      </button>

      {aberto && (
        <div className="rota-hist-body">
          {carregando ? (
            <div className="pagina-loading" style={{ padding: '32px 0' }}>
              <div className="spinner"></div>
              <p>Carregando histórico...</p>
            </div>
          ) : !temHistorico ? (
            <p className="texto-vazio">Nenhuma verificação registrada ainda. Clique em "Verificar agora" na aba Minhas Rotas.</p>
          ) : (
            <>
              <div className="historico-resumo" style={{ margin: '16px 0' }}>
                <div className="resumo-card">
                  <span className="resumo-label">Registros</span>
                  <span className="resumo-valor">{dados.historico.length}</span>
                </div>
                <div className="resumo-card">
                  <span className="resumo-label">Média histórica</span>
                  <span className="resumo-valor">
                    {dados.media ? `R$ ${dados.media.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—'}
                  </span>
                </div>
                <div className="resumo-card">
                  <span className="resumo-label">Menor preço</span>
                  <span className="resumo-valor preco-ok">
                    R$ {Math.min(...dados.historico.map(h => h.preco)).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="resumo-card">
                  <span className="resumo-label">Último preço</span>
                  <span className={`resumo-valor ${ultimoPreco.preco <= rota.preco_maximo ? 'preco-ok' : ''}`}>
                    R$ {ultimoPreco.preco.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              <GraficoPreco
                historico={dados.historico}
                precoMaximo={rota.preco_maximo}
                media={dados.media}
              />

              <div className="tabela-wrapper" style={{ marginTop: 20 }}>
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
                        <td className={h.preco <= rota.preco_maximo ? 'preco-ok' : 'preco-alto'}>
                          R$ {h.preco.toLocaleString('pt-BR')}
                        </td>
                        <td>{h.cia_aerea || '—'}</td>
                        <td>
                          {h.link_compra
                            ? <a href={h.link_compra} target="_blank" rel="noopener noreferrer" className="link-ver">Ver →</a>
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Historico() {
  const [rotas, setRotas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    axios.get('/api/rotas')
      .then(({ data }) => setRotas(data))
      .finally(() => setCarregando(false));
  }, []);

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
          <h1 className="pagina-titulo">Histórico de Preços</h1>
          <p className="pagina-subtitulo">Clique em uma rota para ver a evolução do preço</p>
        </div>
      </div>

      {rotas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icone">📊</div>
          <h2>Nenhuma rota cadastrada</h2>
          <p>Adicione rotas na aba "Nova Rota" para começar a monitorar.</p>
        </div>
      ) : (
        <div className="lista-historico">
          {rotas.map(rota => (
            <RotaHistoricoCard key={rota.id} rota={rota} />
          ))}
        </div>
      )}
    </div>
  );
}

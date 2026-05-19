import { useState } from 'react';
import axios from 'axios';

const API = '/api/rotas';

function formatarData(dataStr) {
  if (!dataStr) return '—';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

function BadgeStatus({ rota }) {
  const temUltimoAlerta = rota.ultimo_alerta_normal || rota.ultimo_alerta_tarifario;
  if (rota.ultimo_alerta_tarifario) {
    return <span className="badge badge-erro">🚨 Erro tarifário detectado</span>;
  }
  if (rota.ultimo_alerta_normal) {
    return <span className="badge badge-alerta">🎯 Alerta enviado</span>;
  }
  return <span className="badge badge-ok">✅ Monitorando</span>;
}

export default function RotaCard({ rota, onAtualizar, onDeletar }) {
  const [verificando, setVerificando] = useState(false);
  const [msg, setMsg] = useState('');

  async function toggleAtiva() {
    try {
      await axios.patch(`${API}/${rota.id}`, { ativa: rota.ativa ? 0 : 1 });
      onAtualizar();
    } catch (e) {
      console.error(e);
    }
  }

  async function confirmarDelete() {
    if (!window.confirm(`Remover a rota ${rota.origem} → ${rota.destino}? Esta ação não pode ser desfeita.`)) return;
    try {
      await axios.delete(`${API}/${rota.id}`);
      onDeletar(rota.id);
    } catch (e) {
      console.error(e);
    }
  }

  async function verificarAgora() {
    setVerificando(true);
    setMsg('');
    try {
      const { data } = await axios.post(`${API}/${rota.id}/verificar`);
      setMsg(data.mensagem);
      setTimeout(() => { setMsg(''); onAtualizar(); }, 4000);
    } catch (e) {
      setMsg(e.response?.data?.erro || 'Erro ao verificar.');
    } finally {
      setVerificando(false);
    }
  }

  return (
    <div className={`rota-card ${!rota.ativa ? 'desativada' : ''}`}>
      <div className="rota-card-header">
        <div>
          <h3 className="rota-titulo">
            ✈️ {rota.origem} <span className="seta">→</span> {rota.destino}
          </h3>
          <BadgeStatus rota={rota} />
        </div>
        <div className="rota-acoes">
          <button
            className={`btn-toggle ${rota.ativa ? 'ativo' : 'inativo'}`}
            onClick={toggleAtiva}
            title={rota.ativa ? 'Desativar' : 'Ativar'}
          >
            {rota.ativa ? '⏸ Pausar' : '▶ Ativar'}
          </button>
        </div>
      </div>

      <div className="rota-info-grid">
        <div className="rota-info-item">
          <span className="info-label">Limite máximo</span>
          <span className="info-valor verde">R$ {rota.preco_maximo.toFixed(2)}</span>
        </div>
        <div className="rota-info-item">
          <span className="info-label">Data ida</span>
          <span className="info-valor">{formatarData(rota.data_ida)}</span>
        </div>
        <div className="rota-info-item">
          <span className="info-label">Data volta</span>
          <span className="info-valor">{formatarData(rota.data_volta)}</span>
        </div>
        <div className="rota-info-item">
          <span className="info-label">Datas flexíveis</span>
          <span className="info-valor">{rota.flexivel ? 'Sim' : 'Não'}</span>
        </div>
      </div>

      {msg && <p className="msg-verificacao">{msg}</p>}

      <div className="rota-card-footer">
        <button
          className="btn btn-verificar"
          onClick={verificarAgora}
          disabled={verificando || !rota.ativa}
        >
          {verificando ? '⏳ Verificando...' : '🔍 Verificar agora'}
        </button>
        <button className="btn btn-deletar" onClick={confirmarDelete}>
          🗑 Remover
        </button>
      </div>

      <p className="rota-data-criacao">
        Criada em {new Date(rota.criada_em).toLocaleDateString('pt-BR')}
      </p>
    </div>
  );
}

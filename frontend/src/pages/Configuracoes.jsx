import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Configuracoes() {
  const { usuario } = useAuth();
  const [form, setForm] = useState({ serpapi_key: '', frequencia_horas: '6' });
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [msg, setMsg] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    axios.get('/api/rotas/config/todas').then(({ data }) => {
      setForm(prev => ({ ...prev, ...data }));
    }).catch(console.error);
  }, []);

  function mostrarMsg(tipo, texto) {
    setMsg({ tipo, texto });
    setTimeout(() => setMsg({ tipo: '', texto: '' }), 5000);
  }

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await axios.post('/api/rotas/config/salvar', form);
      mostrarMsg('sucesso', '✅ Configurações salvas com sucesso!');
    } catch (e) {
      mostrarMsg('erro', e.response?.data?.erro || 'Erro ao salvar configurações.');
    } finally {
      setSalvando(false);
    }
  }

  async function testarEmail() {
    setTestando(true);
    try {
      const { data } = await axios.post('/api/rotas/config/testar-email');
      mostrarMsg('sucesso', `📧 ${data.mensagem}`);
    } catch (e) {
      mostrarMsg('erro', e.response?.data?.erro || 'Falha ao enviar email de teste.');
    } finally {
      setTestando(false);
    }
  }

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Configurações</h1>
          <p className="pagina-subtitulo">Configurações globais do Flight Alert</p>
        </div>
      </div>

      {msg.texto && (
        <div className={`alert alert-${msg.tipo}`}>{msg.texto}</div>
      )}

      <form onSubmit={salvar}>
        {/* SerpAPI */}
        <div className="form-card">
          <h3 className="secao-titulo">🔍 SerpAPI — Google Flights</h3>
          <p className="secao-desc">
            A SerpAPI consulta preços no Google Flights. Crie sua conta em{' '}
            <a href="https://serpapi.com" target="_blank" rel="noopener noreferrer">serpapi.com</a>{' '}
            e copie sua API Key. O plano gratuito permite 100 buscas/mês.
          </p>
          <div className="form-group">
            <label>SerpAPI Key</label>
            <input
              type="text"
              className="input input-mono"
              placeholder="sua_chave_serpapi_aqui"
              value={form.serpapi_key}
              onChange={e => setForm(p => ({ ...p, serpapi_key: e.target.value }))}
            />
          </div>
        </div>

        {/* Frequência */}
        <div className="form-card">
          <h3 className="secao-titulo">⏰ Frequência de Verificação</h3>
          <p className="secao-desc">Com que frequência o sistema verifica os preços de todas as rotas ativas.</p>
          <div className="form-group">
            <label>Verificar preços a cada</label>
            <select
              className="input"
              value={form.frequencia_horas}
              onChange={e => setForm(p => ({ ...p, frequencia_horas: e.target.value }))}
            >
              <option value="0">30 minutos</option>
              <option value="1">1 hora</option>
              <option value="6">6 horas</option>
              <option value="12">12 horas</option>
              <option value="24">24 horas (uma vez por dia)</option>
            </select>
            <span className="campo-dica">
              Alteração entra em vigor na próxima reinicialização do servidor.
            </span>
          </div>
        </div>

        <div className="form-acoes">
          <button type="submit" className="btn btn-primario" disabled={salvando}>
            {salvando ? '⏳ Salvando...' : '💾 Salvar configurações'}
          </button>
        </div>
      </form>

      {/* Alertas de email — por usuário */}
      <div className="form-card" style={{ marginTop: 20 }}>
        <h3 className="secao-titulo">📧 Email de Alertas</h3>
        <p className="secao-desc">
          Os alertas são enviados para o email configurado no seu perfil.
          Atualmente: <strong>{usuario?.email_alertas || usuario?.email}</strong>
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/perfil" className="btn btn-secundario">
            ✏️ Alterar email de alertas
          </Link>
          <button
            type="button"
            className="btn btn-verificar"
            onClick={testarEmail}
            disabled={testando}
          >
            {testando ? '⏳ Enviando...' : '📧 Enviar email de teste'}
          </button>
        </div>
      </div>
    </div>
  );
}

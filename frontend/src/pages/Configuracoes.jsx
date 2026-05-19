import { useEffect, useState } from 'react';
import axios from 'axios';

const CAMPOS_INICIAIS = {
  serpapi_key: '',
  email_user: '',
  email_pass: '',
  email_to: '',
  frequencia_horas: '6',
};

export default function Configuracoes() {
  const [form, setForm] = useState(CAMPOS_INICIAIS);
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
          <p className="pagina-subtitulo">Configure suas chaves de API e preferências de alerta</p>
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
            A SerpAPI é usada para consultar preços do Google Flights. Crie sua conta em{' '}
            <a href="https://serpapi.com" target="_blank" rel="noopener noreferrer">serpapi.com</a>{' '}
            e copie sua API Key.
          </p>
          <div className="form-group">
            <label>SerpAPI Key *</label>
            <input
              type="text"
              className="input input-mono"
              placeholder="sua_chave_serpapi_aqui"
              value={form.serpapi_key}
              onChange={e => setForm(p => ({ ...p, serpapi_key: e.target.value }))}
            />
          </div>
        </div>

        {/* Email */}
        <div className="form-card">
          <h3 className="secao-titulo">📧 Configuração de Email</h3>
          <p className="secao-desc">
            Use uma conta Gmail com{' '}
            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">
              Senha de App
            </a>{' '}
            (não sua senha normal — ative a verificação em 2 etapas antes).
          </p>

          <div className="form-row">
            <div className="form-group">
              <label>Gmail Remetente *</label>
              <input
                type="email"
                className="input"
                placeholder="seugmail@gmail.com"
                value={form.email_user}
                onChange={e => setForm(p => ({ ...p, email_user: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Senha de App *</label>
              <input
                type="password"
                className="input"
                placeholder="xxxx xxxx xxxx xxxx"
                value={form.email_pass}
                onChange={e => setForm(p => ({ ...p, email_pass: e.target.value }))}
                autoComplete="new-password"
              />
              <span className="campo-dica">Senha gerada em Conta Google → Segurança → Senhas de App</span>
            </div>
          </div>

          <div className="form-group">
            <label>Email Destinatário (onde receberá os alertas) *</label>
            <input
              type="email"
              className="input"
              placeholder="seugmail@gmail.com"
              value={form.email_to}
              onChange={e => setForm(p => ({ ...p, email_to: e.target.value }))}
            />
          </div>

          <button
            type="button"
            className="btn btn-secundario"
            onClick={testarEmail}
            disabled={testando}
          >
            {testando ? '⏳ Enviando...' : '📧 Enviar email de teste'}
          </button>
        </div>

        {/* Frequência */}
        <div className="form-card">
          <h3 className="secao-titulo">⏰ Frequência de Verificação</h3>
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
    </div>
  );
}

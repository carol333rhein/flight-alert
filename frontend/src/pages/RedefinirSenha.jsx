import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function RedefinirSenha() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();

  const [form, setForm] = useState({ nova_senha: '', confirmar: '' });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!token) setErro('Link inválido. Solicite um novo em "Esqueci a senha".');
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    if (form.nova_senha !== form.confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (form.nova_senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setCarregando(true);
    try {
      await axios.post('/api/auth/redefinir-senha', { token, nova_senha: form.nova_senha });
      setSucesso(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao redefinir senha.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">✈️ Flight Alert</div>
        <h1 className="auth-titulo">Nova senha</h1>

        {sucesso ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
            <p style={{ color: 'var(--cinza-600)' }}>Senha redefinida com sucesso!</p>
            <p style={{ color: 'var(--cinza-400)', fontSize: 13, marginTop: 8 }}>Redirecionando para o login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="campo">
              <label className="label">Nova senha</label>
              <input
                type="password"
                value={form.nova_senha}
                onChange={e => setForm(f => ({ ...f, nova_senha: e.target.value }))}
                className="input"
                placeholder="Mínimo 6 caracteres"
                required
                autoFocus
                disabled={!token}
              />
            </div>
            <div className="campo">
              <label className="label">Confirmar nova senha</label>
              <input
                type="password"
                value={form.confirmar}
                onChange={e => setForm(f => ({ ...f, confirmar: e.target.value }))}
                className="input"
                placeholder="••••••••"
                required
                disabled={!token}
              />
            </div>
            {erro && <div className="auth-erro">{erro}</div>}
            <button type="submit" className="btn-primario w-full" disabled={carregando || !token}>
              {carregando ? 'Salvando...' : 'Salvar nova senha'}
            </button>
            <p className="auth-rodape">
              <Link to="/login">← Voltar ao login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

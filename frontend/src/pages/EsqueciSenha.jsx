import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await axios.post('/api/auth/esqueci-senha', { email });
      setEnviado(true);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao enviar email.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">✈️ Flight Alert</div>
        <h1 className="auth-titulo">Esqueci a senha</h1>

        {enviado ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
            <p style={{ color: 'var(--cinza-600)', marginBottom: 8 }}>
              Se o email estiver cadastrado, você receberá um link para redefinir a senha em breve.
            </p>
            <p style={{ color: 'var(--cinza-400)', fontSize: 13 }}>Verifique também a caixa de spam.</p>
            <Link to="/login" style={{ display: 'block', marginTop: 24, color: 'var(--azul)', fontWeight: 600 }}>
              ← Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--cinza-600)', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>
              Informe seu email de cadastro e enviaremos um link para criar uma nova senha.
            </p>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="campo">
                <label className="label">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  placeholder="seu@email.com"
                  required
                  autoFocus
                />
              </div>
              {erro && <div className="auth-erro">{erro}</div>}
              <button type="submit" className="btn-primario w-full" disabled={carregando}>
                {carregando ? 'Enviando...' : 'Enviar link de redefinição'}
              </button>
            </form>
            <p className="auth-rodape">
              <Link to="/login">← Voltar ao login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

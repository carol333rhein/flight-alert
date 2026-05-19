import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', senha: '' });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const { data } = await axios.post('/api/auth/login', form);
      login(data.token, data.usuario);
      navigate('/');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao fazer login.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">✈️ Flight Alert</div>
        <h1 className="auth-titulo">Entrar na sua conta</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="campo">
            <label className="label">E-mail</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="input"
              placeholder="seu@email.com"
              required
              autoFocus
            />
          </div>

          <div className="campo">
            <label className="label">Senha</label>
            <input
              type="password"
              name="senha"
              value={form.senha}
              onChange={handleChange}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>

          {erro && <div className="auth-erro">{erro}</div>}

          <button type="submit" className="btn-primario w-full" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="auth-rodape">
          <Link to="/esqueci-senha" style={{ color: 'var(--cinza-400)', fontSize: 13 }}>Esqueci a senha</Link>
        </p>
        <p className="auth-rodape">
          Não tem conta?{' '}
          <Link to="/registro">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}

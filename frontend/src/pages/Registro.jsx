import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Registro() {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmarSenha: '', email_alertas: '' });
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

    if (form.senha !== form.confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (form.senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setCarregando(true);
    try {
      const { data } = await axios.post('/api/auth/registro', {
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        email_alertas: form.email_alertas || form.email,
      });
      login(data.token, data.usuario);
      navigate('/');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar conta.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">✈️ Flight Alert</div>
        <h1 className="auth-titulo">Criar conta</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="campo">
            <label className="label">Seu nome</label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              className="input"
              placeholder="João Silva"
              required
              autoFocus
            />
          </div>

          <div className="campo">
            <label className="label">E-mail de acesso</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="input"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="campo">
            <label className="label">
              E-mail para receber alertas{' '}
              <span className="label-opcional">(opcional — usa o de acesso se vazio)</span>
            </label>
            <input
              type="email"
              name="email_alertas"
              value={form.email_alertas}
              onChange={handleChange}
              className="input"
              placeholder="alertas@email.com"
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
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div className="campo">
            <label className="label">Confirmar senha</label>
            <input
              type="password"
              name="confirmarSenha"
              value={form.confirmarSenha}
              onChange={handleChange}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>

          {erro && <div className="auth-erro">{erro}</div>}

          <button type="submit" className="btn-primario w-full" disabled={carregando}>
            {carregando ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="auth-rodape">
          Já tem conta?{' '}
          <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}

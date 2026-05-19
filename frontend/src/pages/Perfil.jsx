import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Perfil() {
  const { usuario, login } = useAuth();
  const [form, setForm] = useState({
    nome: usuario?.nome || '',
    email_alertas: usuario?.email_alertas || '',
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: '',
  });
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (form.novaSenha && form.novaSenha !== form.confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (form.novaSenha && form.novaSenha.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setCarregando(true);
    try {
      const payload = {
        nome: form.nome,
        email_alertas: form.email_alertas,
      };
      if (form.novaSenha) {
        payload.senha_atual = form.senhaAtual;
        payload.nova_senha = form.novaSenha;
      }

      const { data } = await axios.patch('/api/auth/perfil', payload);
      login(localStorage.getItem('token'), data);
      setSucesso('Perfil atualizado com sucesso!');
      setForm(f => ({ ...f, senhaAtual: '', novaSenha: '', confirmarSenha: '' }));
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao atualizar perfil.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <h1 className="titulo-pagina">Meu Perfil</h1>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="campo">
            <label className="label">Nome</label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div className="campo">
            <label className="label">E-mail de acesso</label>
            <input
              type="email"
              value={usuario?.email || ''}
              className="input"
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
            <span className="label-opcional">O e-mail de acesso não pode ser alterado</span>
          </div>

          <div className="campo">
            <label className="label">E-mail para receber alertas</label>
            <input
              type="email"
              name="email_alertas"
              value={form.email_alertas}
              onChange={handleChange}
              className="input"
              placeholder={usuario?.email}
            />
            <span className="label-opcional">Deixe vazio para usar o e-mail de acesso</span>
          </div>

          <hr style={{ borderColor: 'var(--cinza-200)', margin: '8px 0' }} />
          <p className="label" style={{ color: 'var(--cinza-600)', marginBottom: -8 }}>
            Alterar senha <span className="label-opcional">(opcional)</span>
          </p>

          <div className="campo">
            <label className="label">Senha atual</label>
            <input
              type="password"
              name="senhaAtual"
              value={form.senhaAtual}
              onChange={handleChange}
              className="input"
              placeholder="••••••••"
            />
          </div>

          <div className="campo">
            <label className="label">Nova senha</label>
            <input
              type="password"
              name="novaSenha"
              value={form.novaSenha}
              onChange={handleChange}
              className="input"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="campo">
            <label className="label">Confirmar nova senha</label>
            <input
              type="password"
              name="confirmarSenha"
              value={form.confirmarSenha}
              onChange={handleChange}
              className="input"
              placeholder="••••••••"
            />
          </div>

          {erro && <div className="auth-erro">{erro}</div>}
          {sucesso && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', color: '#16a34a', fontSize: 14 }}>
              ✅ {sucesso}
            </div>
          )}

          <button type="submit" className="btn-primario" disabled={carregando}>
            {carregando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>
    </div>
  );
}

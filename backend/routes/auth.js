const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../database');
const { gerarToken, autenticar } = require('../middleware/auth');

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    if (db.buscarUsuarioPorEmail(email)) {
      return res.status(409).json({ erro: 'Este email já está cadastrado.' });
    }
    const senha_hash = await bcrypt.hash(senha, 10);
    const resultado = db.criarUsuario({ nome, email, senha_hash });
    const usuario = db.buscarUsuarioPorId(resultado.lastInsertRowid);
    const token = gerarToken(usuario);
    res.status(201).json({ token, usuario });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
  }

  try {
    const usuario = db.buscarUsuarioPorEmail(email);
    if (!usuario) {
      return res.status(401).json({ erro: 'Email ou senha incorretos.' });
    }
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Email ou senha incorretos.' });
    }
    const token = gerarToken(usuario);
    const { senha_hash, ...usuarioSeguro } = usuario;
    res.json({ token, usuario: usuarioSeguro });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// GET /api/auth/me — retorna dados do usuário logado
router.get('/me', autenticar, (req, res) => {
  const usuario = db.buscarUsuarioPorId(req.usuario.id);
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  res.json(usuario);
});

// PATCH /api/auth/perfil — atualiza nome e email de alertas
router.patch('/perfil', autenticar, async (req, res) => {
  const { nome, email_alertas, senha_atual, nova_senha } = req.body;
  const update = {};

  if (nome) update.nome = nome;
  if (email_alertas) update.email_alertas = email_alertas;

  if (nova_senha) {
    if (!senha_atual) return res.status(400).json({ erro: 'Informe a senha atual para alterá-la.' });
    const usuario = db.buscarUsuarioPorEmail(req.usuario.email);
    const correta = await bcrypt.compare(senha_atual, usuario.senha_hash);
    if (!correta) return res.status(401).json({ erro: 'Senha atual incorreta.' });
    if (nova_senha.length < 6) return res.status(400).json({ erro: 'Nova senha deve ter pelo menos 6 caracteres.' });
    update.senha_hash = await bcrypt.hash(nova_senha, 10);
  }

  if (!Object.keys(update).length) {
    return res.status(400).json({ erro: 'Nenhum campo para atualizar.' });
  }

  db.atualizarUsuario(req.usuario.id, update);
  res.json(db.buscarUsuarioPorId(req.usuario.id));
});

module.exports = router;

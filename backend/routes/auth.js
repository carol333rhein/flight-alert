const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const router = express.Router();
const db = require('../database');
const { gerarToken, autenticar } = require('../middleware/auth');
const { enviarEmailRedefinicao } = require('../mailer');

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  const { nome, email, senha, email_alertas } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    if (await db.buscarUsuarioPorEmail(email)) {
      return res.status(409).json({ erro: 'Este email já está cadastrado.' });
    }
    const ePrimeiroUsuario = (await db.contarUsuarios()) === 0;
    const senha_hash = await bcrypt.hash(senha, 10);
    const usuario = await db.criarUsuario({ nome, email, senha_hash, email_alertas: email_alertas || email });
    if (ePrimeiroUsuario) await db.adotarRotasOrfas(usuario.id);
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
    const usuario = await db.buscarUsuarioPorEmail(email);
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

// GET /api/auth/me
router.get('/me', autenticar, async (req, res) => {
  try {
    const usuario = await db.buscarUsuarioPorId(req.usuario.id);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json(usuario);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// PATCH /api/auth/perfil
router.patch('/perfil', autenticar, async (req, res) => {
  const { nome, email_alertas, senha_atual, nova_senha } = req.body;
  const update = {};

  if (nome) update.nome = nome;
  if (email_alertas !== undefined) update.email_alertas = email_alertas || null;

  if (nova_senha) {
    if (!senha_atual) return res.status(400).json({ erro: 'Informe a senha atual para alterá-la.' });
    const usuario = await db.buscarUsuarioPorEmail(req.usuario.email);
    const correta = await bcrypt.compare(senha_atual, usuario.senha_hash);
    if (!correta) return res.status(401).json({ erro: 'Senha atual incorreta.' });
    if (nova_senha.length < 6) return res.status(400).json({ erro: 'Nova senha deve ter pelo menos 6 caracteres.' });
    update.senha_hash = await bcrypt.hash(nova_senha, 10);
  }

  if (!Object.keys(update).length) {
    return res.status(400).json({ erro: 'Nenhum campo para atualizar.' });
  }

  try {
    const usuario = await db.atualizarUsuario(req.usuario.id, update);
    res.json(usuario);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// POST /api/auth/esqueci-senha
router.post('/esqueci-senha', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ erro: 'Informe o email.' });

  try {
    const usuario = await db.buscarUsuarioPorEmail(email);
    // Sempre retorna sucesso para não revelar se o email existe
    if (!usuario) return res.json({ mensagem: 'Se o email estiver cadastrado, você receberá um link em breve.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await db.salvarResetToken(usuario.id, token, expira);

    const appUrl = process.env.APP_URL || 'https://flight-alert-production-5260.up.railway.app';
    const link = `${appUrl}/redefinir-senha?token=${token}`;
    await enviarEmailRedefinicao(usuario, link);

    res.json({ mensagem: 'Se o email estiver cadastrado, você receberá um link em breve.' });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// POST /api/auth/redefinir-senha
router.post('/redefinir-senha', async (req, res) => {
  const { token, nova_senha } = req.body;
  if (!token || !nova_senha) return res.status(400).json({ erro: 'Token e nova senha são obrigatórios.' });
  if (nova_senha.length < 6) return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });

  try {
    const usuario = await db.buscarPorResetToken(token);
    if (!usuario) return res.status(400).json({ erro: 'Link inválido ou expirado. Solicite um novo.' });

    const senha_hash = await bcrypt.hash(nova_senha, 10);
    await db.atualizarUsuario(usuario.id, { senha_hash, reset_token: null, reset_token_expira: null });
    res.json({ mensagem: 'Senha redefinida com sucesso! Faça login.' });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

module.exports = router;

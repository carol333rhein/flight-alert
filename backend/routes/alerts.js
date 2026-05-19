const express = require('express');
const router = express.Router();
const db = require('../database');
const { autenticar } = require('../middleware/auth');
const { verificarRota } = require('../scheduler');
const { enviarEmailTeste } = require('../mailer');

// Todas as rotas exigem autenticação
router.use(autenticar);

// GET /api/rotas
router.get('/', (req, res) => {
  try {
    res.json(db.listarRotas(req.usuario.id));
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// GET /api/rotas/:id
router.get('/:id', (req, res) => {
  try {
    const rota = db.buscarRota(req.params.id);
    if (!rota || rota.user_id !== req.usuario.id) return res.status(404).json({ erro: 'Rota não encontrada.' });
    res.json(rota);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// POST /api/rotas
router.post('/', (req, res) => {
  const { origem, destino, tipo_voo, data_ida, data_volta, flexivel, preco_maximo } = req.body;
  if (!origem || !destino || !preco_maximo) {
    return res.status(400).json({ erro: 'Campos obrigatórios: origem, destino, preco_maximo.' });
  }
  try {
    const resultado = db.criarRota({
      user_id: req.usuario.id,
      origem: origem.toUpperCase().trim(),
      destino: destino.toUpperCase().trim(),
      tipo_voo: tipo_voo || 'ida_volta',
      data_ida: data_ida || null,
      data_volta: data_volta || null,
      flexivel: flexivel ? 1 : 0,
      preco_maximo: parseFloat(preco_maximo),
    });
    res.status(201).json(db.buscarRota(resultado.lastInsertRowid));
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// PATCH /api/rotas/:id
router.patch('/:id', (req, res) => {
  const rota = db.buscarRota(req.params.id);
  if (!rota || rota.user_id !== req.usuario.id) return res.status(404).json({ erro: 'Rota não encontrada.' });

  const camposPermitidos = ['ativa', 'preco_maximo', 'data_ida', 'data_volta', 'flexivel'];
  const update = {};
  for (const campo of camposPermitidos) {
    if (campo in req.body) update[campo] = req.body[campo];
  }
  if (!Object.keys(update).length) return res.status(400).json({ erro: 'Nenhum campo válido.' });

  try {
    db.atualizarRota(req.params.id, update);
    res.json(db.buscarRota(req.params.id));
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// DELETE /api/rotas/:id
router.delete('/:id', (req, res) => {
  const rota = db.buscarRota(req.params.id);
  if (!rota || rota.user_id !== req.usuario.id) return res.status(404).json({ erro: 'Rota não encontrada.' });
  try {
    db.deletarRota(req.params.id);
    res.json({ mensagem: 'Rota removida com sucesso.' });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// POST /api/rotas/:id/verificar
router.post('/:id/verificar', async (req, res) => {
  const rota = db.buscarRota(req.params.id);
  if (!rota || rota.user_id !== req.usuario.id) return res.status(404).json({ erro: 'Rota não encontrada.' });
  if (!rota.ativa) return res.status(400).json({ erro: 'Rota está desativada.' });
  verificarRota(rota).catch(e => console.error('Erro na verificação manual:', e));
  res.json({ mensagem: 'Verificação iniciada. Aguarde alguns instantes.' });
});

// GET /api/rotas/config/todas
router.get('/config/todas', (req, res) => {
  try {
    const configs = db.getTodasConfigs();
    if (configs.serpapi_key) configs.serpapi_key = '••••••••';
    res.json(configs);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// POST /api/rotas/config/salvar
router.post('/config/salvar', (req, res) => {
  const campos = ['serpapi_key', 'frequencia_horas'];
  try {
    for (const campo of campos) {
      if (req.body[campo] !== undefined && req.body[campo] !== '••••••••') {
        db.setConfig(campo, req.body[campo]);
      }
    }
    res.json({ mensagem: 'Configurações salvas com sucesso.' });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// POST /api/rotas/config/testar-email
router.post('/config/testar-email', async (req, res) => {
  try {
    const usuario = db.buscarUsuarioPorId(req.usuario.id);
    await enviarEmailTeste(usuario);
    res.json({ mensagem: 'Email de teste enviado com sucesso!' });
  } catch (e) {
    res.status(500).json({ erro: `Falha ao enviar email: ${e.message}` });
  }
});

module.exports = router;

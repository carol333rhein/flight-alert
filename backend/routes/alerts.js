const express = require('express');
const router = express.Router();
const db = require('../database');
const { autenticar } = require('../middleware/auth');
const { verificarRota } = require('../scheduler');
const { enviarEmailTeste } = require('../mailer');

router.use(autenticar);

// GET /api/rotas
router.get('/', async (req, res) => {
  try {
    res.json(await db.listarRotas(req.usuario.id));
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// GET /api/rotas/config/todas
router.get('/config/todas', async (req, res) => {
  try {
    const configs = await db.getTodasConfigs();
    if (configs.serpapi_key) configs.serpapi_key = '••••••••';
    res.json(configs);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// POST /api/rotas/config/salvar
router.post('/config/salvar', async (req, res) => {
  const campos = ['serpapi_key', 'frequencia_horas'];
  try {
    for (const campo of campos) {
      if (req.body[campo] !== undefined && req.body[campo] !== '••••••••') {
        await db.setConfig(campo, req.body[campo]);
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
    const usuario = await db.buscarUsuarioPorId(req.usuario.id);
    await enviarEmailTeste(usuario);
    res.json({ mensagem: 'Email de teste enviado com sucesso!' });
  } catch (e) {
    res.status(500).json({ erro: `Falha ao enviar email: ${e.message}` });
  }
});

// GET /api/rotas/:id
router.get('/:id', async (req, res) => {
  try {
    const rota = await db.buscarRota(req.params.id);
    if (!rota || rota.user_id !== req.usuario.id) return res.status(404).json({ erro: 'Rota não encontrada.' });
    res.json(rota);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// POST /api/rotas
router.post('/', async (req, res) => {
  const { origem, destino, tipo_voo, data_ida, data_volta, flexivel, preco_maximo } = req.body;
  if (!origem || !destino || !preco_maximo) {
    return res.status(400).json({ erro: 'Campos obrigatórios: origem, destino, preco_maximo.' });
  }
  try {
    const rota = await db.criarRota({
      user_id: req.usuario.id,
      origem: origem.toUpperCase().trim(),
      destino: destino.toUpperCase().trim(),
      tipo_voo: tipo_voo || 'ida_volta',
      data_ida: data_ida || null,
      data_volta: data_volta || null,
      flexivel: flexivel ? true : false,
      preco_maximo: parseFloat(preco_maximo),
    });
    res.status(201).json(rota);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// PATCH /api/rotas/:id
router.patch('/:id', async (req, res) => {
  try {
    const rota = await db.buscarRota(req.params.id);
    if (!rota || rota.user_id !== req.usuario.id) return res.status(404).json({ erro: 'Rota não encontrada.' });

    const camposPermitidos = ['ativa', 'preco_maximo', 'data_ida', 'data_volta', 'flexivel'];
    const update = {};
    for (const campo of camposPermitidos) {
      if (campo in req.body) update[campo] = req.body[campo];
    }
    if (!Object.keys(update).length) return res.status(400).json({ erro: 'Nenhum campo válido.' });

    const rotaAtualizada = await db.atualizarRota(req.params.id, update);
    res.json(rotaAtualizada);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// DELETE /api/rotas/:id
router.delete('/:id', async (req, res) => {
  try {
    const rota = await db.buscarRota(req.params.id);
    if (!rota || rota.user_id !== req.usuario.id) return res.status(404).json({ erro: 'Rota não encontrada.' });
    await db.deletarRota(req.params.id);
    res.json({ mensagem: 'Rota removida com sucesso.' });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// POST /api/rotas/:id/verificar
router.post('/:id/verificar', async (req, res) => {
  try {
    const rota = await db.buscarRota(req.params.id);
    if (!rota || rota.user_id !== req.usuario.id) return res.status(404).json({ erro: 'Rota não encontrada.' });
    if (!rota.ativa) return res.status(400).json({ erro: 'Rota está desativada.' });
    verificarRota(rota).catch(e => console.error('Erro na verificação manual:', e));
    res.json({ mensagem: 'Verificação iniciada. Aguarde alguns instantes.' });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../database');
const { verificarRota } = require('../scheduler');
const { enviarEmailTeste } = require('../mailer');

// GET /api/rotas — lista todas as rotas
router.get('/', (req, res) => {
  try {
    const rotas = db.listarRotas();
    res.json(rotas);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// GET /api/rotas/:id — retorna uma rota específica
router.get('/:id', (req, res) => {
  try {
    const rota = db.buscarRota(req.params.id);
    if (!rota) return res.status(404).json({ erro: 'Rota não encontrada.' });
    res.json(rota);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// POST /api/rotas — cria nova rota
router.post('/', (req, res) => {
  const { origem, destino, tipo_voo, data_ida, data_volta, flexivel, preco_maximo } = req.body;

  if (!origem || !destino || !preco_maximo) {
    return res.status(400).json({ erro: 'Campos obrigatórios: origem, destino, preco_maximo.' });
  }

  try {
    const resultado = db.criarRota({
      origem: origem.toUpperCase().trim(),
      destino: destino.toUpperCase().trim(),
      tipo_voo: tipo_voo || 'ida_volta',
      data_ida: data_ida || null,
      data_volta: data_volta || null,
      flexivel: flexivel ? 1 : 0,
      preco_maximo: parseFloat(preco_maximo),
    });
    const nova = db.buscarRota(resultado.lastInsertRowid);
    res.status(201).json(nova);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// PATCH /api/rotas/:id — atualiza campos de uma rota (ex: ativa)
router.patch('/:id', (req, res) => {
  const campos = req.body;
  const camposPermitidos = ['ativa', 'preco_maximo', 'data_ida', 'data_volta', 'flexivel'];
  const update = {};

  for (const campo of camposPermitidos) {
    if (campo in campos) update[campo] = campos[campo];
  }

  if (!Object.keys(update).length) {
    return res.status(400).json({ erro: 'Nenhum campo válido para atualizar.' });
  }

  try {
    db.atualizarRota(req.params.id, update);
    const atualizada = db.buscarRota(req.params.id);
    res.json(atualizada);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// DELETE /api/rotas/:id — remove uma rota e seu histórico
router.delete('/:id', (req, res) => {
  try {
    const rota = db.buscarRota(req.params.id);
    if (!rota) return res.status(404).json({ erro: 'Rota não encontrada.' });
    db.deletarRota(req.params.id);
    res.json({ mensagem: 'Rota removida com sucesso.' });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// POST /api/rotas/:id/verificar — dispara verificação manual imediata
router.post('/:id/verificar', async (req, res) => {
  try {
    const rota = db.buscarRota(req.params.id);
    if (!rota) return res.status(404).json({ erro: 'Rota não encontrada.' });
    if (!rota.ativa) return res.status(400).json({ erro: 'Rota está desativada.' });

    // Roda em background sem bloquear a resposta
    verificarRota(rota).catch(e => console.error('Erro na verificação manual:', e));

    res.json({ mensagem: 'Verificação iniciada. Aguarde alguns instantes.' });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// GET /api/config — retorna configurações (sem expor senha)
router.get('/config/todas', (req, res) => {
  try {
    const configs = db.getTodasConfigs();
    // Oculta a senha na resposta
    if (configs.email_pass) configs.email_pass = '••••••••';
    res.json(configs);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// POST /api/config — salva configurações
router.post('/config/salvar', (req, res) => {
  const campos = ['serpapi_key', 'email_user', 'email_pass', 'email_to', 'frequencia_horas'];
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

// POST /api/config/testar-email — envia email de teste
router.post('/config/testar-email', async (req, res) => {
  try {
    await enviarEmailTeste();
    res.json({ mensagem: 'Email de teste enviado com sucesso!' });
  } catch (e) {
    res.status(500).json({ erro: `Falha ao enviar email: ${e.message}` });
  }
});

module.exports = router;

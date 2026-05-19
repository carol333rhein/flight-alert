const express = require('express');
const router = express.Router();
const db = require('../database');
const { autenticar } = require('../middleware/auth');

router.use(autenticar);

router.get('/:rotaId', async (req, res) => {
  try {
    const rota = await db.buscarRota(req.params.rotaId);
    if (!rota || rota.user_id !== req.usuario.id) return res.status(404).json({ erro: 'Rota não encontrada.' });
    const historico = await db.buscarHistorico(req.params.rotaId);
    const media = await db.calcularMedia(req.params.rotaId, 30);
    res.json({ rota, historico, media });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const rotas = await db.listarRotas(req.usuario.id);
    const resumo = await Promise.all(rotas.map(async rota => {
      const historico = await db.buscarHistorico(rota.id);
      const media = await db.calcularMedia(rota.id, 30);
      return { ...rota, ultimo_preco: historico[0] || null, media };
    }));
    res.json(resumo);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../database');
const { autenticar } = require('../middleware/auth');

router.use(autenticar);

router.get('/:rotaId', (req, res) => {
  try {
    const rota = db.buscarRota(req.params.rotaId);
    if (!rota || rota.user_id !== req.usuario.id) return res.status(404).json({ erro: 'Rota não encontrada.' });
    const historico = db.buscarHistorico(req.params.rotaId);
    const media = db.calcularMedia(req.params.rotaId, 30);
    res.json({ rota, historico, media });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.get('/', (req, res) => {
  try {
    const rotas = db.listarRotas(req.usuario.id);
    const resumo = rotas.map(rota => {
      const historico = db.buscarHistorico(rota.id);
      return { ...rota, ultimo_preco: historico[0] || null, media: db.calcularMedia(rota.id, 30) };
    });
    res.json(resumo);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

module.exports = router;

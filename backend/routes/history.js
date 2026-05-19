const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/historico/:rotaId — retorna histórico de preços de uma rota
router.get('/:rotaId', (req, res) => {
  try {
    const rota = db.buscarRota(req.params.rotaId);
    if (!rota) return res.status(404).json({ erro: 'Rota não encontrada.' });

    const historico = db.buscarHistorico(req.params.rotaId);
    const media = db.calcularMedia(req.params.rotaId, 30);

    res.json({ rota, historico, media });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// GET /api/historico — retorna todas as rotas com resumo do último preço
router.get('/', (req, res) => {
  try {
    const rotas = db.listarRotas();
    const resumo = rotas.map(rota => {
      const historico = db.buscarHistorico(rota.id);
      const ultimo = historico[0] || null;
      const media = db.calcularMedia(rota.id, 30);
      return { ...rota, ultimo_preco: ultimo, media_historica: media };
    });
    res.json(resumo);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

module.exports = router;

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const { iniciarScheduler } = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api/rotas', require('./routes/alerts'));
app.use('/api/historico', require('./routes/history'));

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    versao: '1.0.0',
    agora: new Date().toISOString(),
  });
});

// Em produção, serve o frontend buildado
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Escuta na porta IMEDIATAMENTE para o Railway não matar o processo por timeout
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✈️  Flight Alert rodando na porta ${PORT}`);
});

// Inicializa o banco e o scheduler em background (sem bloquear o listen)
async function main() {
  try {
    await db.inicializar();
    console.log('📁 Banco de dados pronto.');
    if (process.env.NODE_ENV !== 'test') {
      iniciarScheduler();
    }
  } catch (err) {
    console.error('❌ Falha ao iniciar banco:', err);
    process.exit(1);
  }
}

main();

module.exports = app;

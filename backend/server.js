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
  const configs = db.getTodasConfigs();
  res.json({
    status: 'online',
    versao: '1.0.0',
    configurado: !!(configs.serpapi_key && configs.email_user),
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

// Inicialização assíncrona (sql.js precisa carregar o WASM)
async function main() {
  await db.inicializar();

  app.listen(PORT, () => {
    console.log(`\n✈️  Flight Alert rodando em http://localhost:${PORT}`);
    console.log(`📁 Banco de dados: flight-alert.db`);
  });

  if (process.env.NODE_ENV !== 'test') {
    iniciarScheduler();
  }
}

main().catch(err => {
  console.error('❌ Falha ao iniciar:', err);
  process.exit(1);
});

module.exports = app;

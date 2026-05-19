const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'flight-alert.db');

let db = null;

// Persiste o banco em disco após cada escrita
function salvar() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Executa SELECT e retorna array de objetos
function query(sql, params) {
  const stmt = db.prepare(sql);
  const rows = [];
  if (params && params.length) stmt.bind(params);
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(sql, params) {
  return query(sql, params)[0] || null;
}

// Executa INSERT/UPDATE/DELETE e salva automaticamente
function run(sql, params) {
  db.run(sql, params || []);
  const lastId = db.exec('SELECT last_insert_rowid() as id')[0]?.values?.[0]?.[0] ?? null;
  const changes = db.getRowsModified();
  salvar();
  return { lastInsertRowid: lastId, changes };
}

// Inicialização assíncrona (sql.js carrega o WASM)
async function inicializar() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS rotas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origem TEXT NOT NULL,
      destino TEXT NOT NULL,
      data_ida TEXT,
      data_volta TEXT,
      flexivel BOOLEAN DEFAULT 0,
      preco_maximo REAL NOT NULL,
      ativa BOOLEAN DEFAULT 1,
      tipo_voo TEXT DEFAULT 'ida_volta',
      ultimo_alerta_normal DATETIME,
      ultimo_alerta_tarifario DATETIME,
      criada_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS historico_precos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rota_id INTEGER,
      preco REAL NOT NULL,
      moeda TEXT DEFAULT 'BRL',
      cia_aerea TEXT,
      link_compra TEXT,
      verificado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rota_id) REFERENCES rotas(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    )
  `);

  // Insere configs padrão se não existirem
  const defaults = [
    ['serpapi_key', process.env.SERPAPI_KEY || ''],
    ['email_user', process.env.EMAIL_USER || ''],
    ['email_pass', process.env.EMAIL_PASS || ''],
    ['email_to', process.env.EMAIL_TO || ''],
    ['frequencia_horas', '6'],
  ];
  for (const [chave, valor] of defaults) {
    db.run('INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES (?, ?)', [chave, valor]);
  }

  salvar();
  console.log('✅ Banco de dados inicializado:', DB_PATH);
  return db;
}

// --- Helpers de rotas ---

function listarRotas() {
  return query('SELECT * FROM rotas ORDER BY criada_em DESC');
}

function listarRotasAtivas() {
  return query('SELECT * FROM rotas WHERE ativa = 1');
}

function buscarRota(id) {
  return queryOne('SELECT * FROM rotas WHERE id = ?', [id]);
}

function criarRota(dados) {
  return run(
    'INSERT INTO rotas (origem, destino, tipo_voo, data_ida, data_volta, flexivel, preco_maximo) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [dados.origem, dados.destino, dados.tipo_voo ?? 'ida_volta', dados.data_ida ?? null, dados.data_volta ?? null, dados.flexivel ?? 0, dados.preco_maximo]
  );
}

function atualizarRota(id, campos) {
  const chaves = Object.keys(campos);
  const sets = chaves.map(k => `${k} = ?`).join(', ');
  const valores = [...chaves.map(k => campos[k]), id];
  return run(`UPDATE rotas SET ${sets} WHERE id = ?`, valores);
}

function deletarRota(id) {
  run('DELETE FROM historico_precos WHERE rota_id = ?', [id]);
  return run('DELETE FROM rotas WHERE id = ?', [id]);
}

// --- Helpers de histórico ---

function salvarHistorico(dados) {
  return run(
    'INSERT INTO historico_precos (rota_id, preco, moeda, cia_aerea, link_compra) VALUES (?, ?, ?, ?, ?)',
    [dados.rota_id, dados.preco, dados.moeda || 'BRL', dados.cia_aerea || null, dados.link_compra || null]
  );
}

function buscarHistorico(rotaId) {
  return query('SELECT * FROM historico_precos WHERE rota_id = ? ORDER BY verificado_em DESC', [rotaId]);
}

function calcularMedia(rotaId, limite = 30) {
  const rows = db.exec(`
    SELECT AVG(preco) as media FROM (
      SELECT preco FROM historico_precos
      WHERE rota_id = ${Number(rotaId)}
      ORDER BY verificado_em DESC
      LIMIT ${Number(limite)}
    )
  `);
  return rows[0]?.values?.[0]?.[0] || null;
}

// --- Helpers de configuração ---

function getConfig(chave) {
  return queryOne('SELECT valor FROM configuracoes WHERE chave = ?', [chave])?.valor || null;
}

function setConfig(chave, valor) {
  return run('INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES (?, ?)', [chave, valor]);
}

function getTodasConfigs() {
  const rows = query('SELECT chave, valor FROM configuracoes');
  return Object.fromEntries(rows.map(r => [r.chave, r.valor]));
}

module.exports = {
  inicializar,
  listarRotas, listarRotasAtivas, buscarRota, criarRota, atualizarRota, deletarRota,
  salvarHistorico, buscarHistorico, calcularMedia,
  getConfig, setConfig, getTodasConfigs,
};

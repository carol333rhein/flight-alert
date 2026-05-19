const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'flight-alert.db');

let db = null;

function salvar() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

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

function run(sql, params) {
  db.run(sql, params || []);
  const lastId = db.exec('SELECT last_insert_rowid() as id')[0]?.values?.[0]?.[0] ?? null;
  const changes = db.getRowsModified();
  salvar();
  return { lastInsertRowid: lastId, changes };
}

async function inicializar() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      email_alertas TEXT,
      criada_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rotas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES usuarios(id),
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

  const defaults = [
    ['serpapi_key', process.env.SERPAPI_KEY || ''],
    ['frequencia_horas', '6'],
  ];
  for (const [chave, valor] of defaults) {
    db.run('INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES (?, ?)', [chave, valor]);
  }

  // Migrações: adiciona colunas que podem não existir em bancos antigos
  const colunasMigracao = [
    { tabela: 'rotas', coluna: 'user_id', def: 'INTEGER' },
    { tabela: 'rotas', coluna: 'tipo_voo', def: "TEXT DEFAULT 'ida_volta'" },
    { tabela: 'rotas', coluna: 'flexivel', def: 'BOOLEAN DEFAULT 0' },
    { tabela: 'rotas', coluna: 'ultimo_alerta_normal', def: 'DATETIME' },
    { tabela: 'rotas', coluna: 'ultimo_alerta_tarifario', def: 'DATETIME' },
  ];
  for (const { tabela, coluna, def } of colunasMigracao) {
    try {
      db.run(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${def}`);
      console.log(`🔧 Migração: coluna ${tabela}.${coluna} adicionada.`);
    } catch {
      // Coluna já existe — ignorar
    }
  }

  salvar();
  console.log('✅ Banco de dados inicializado:', DB_PATH);
  return db;
}

// --- Usuários ---

function criarUsuario(dados) {
  return run(
    'INSERT INTO usuarios (nome, email, senha_hash, email_alertas) VALUES (?, ?, ?, ?)',
    [dados.nome, dados.email.toLowerCase(), dados.senha_hash, dados.email_alertas || dados.email.toLowerCase()]
  );
}

function buscarUsuarioPorEmail(email) {
  return queryOne('SELECT * FROM usuarios WHERE email = ?', [email.toLowerCase()]);
}

function buscarUsuarioPorId(id) {
  return queryOne('SELECT id, nome, email, email_alertas, criada_em FROM usuarios WHERE id = ?', [id]);
}

function contarUsuarios() {
  const row = db.exec('SELECT COUNT(*) FROM usuarios')[0];
  return row?.values?.[0]?.[0] ?? 0;
}

function adotarRotasOrfas(userId) {
  return run('UPDATE rotas SET user_id = ? WHERE user_id IS NULL', [userId]);
}

function atualizarUsuario(id, campos) {
  const chaves = Object.keys(campos);
  const sets = chaves.map(k => `${k} = ?`).join(', ');
  const valores = [...chaves.map(k => campos[k]), id];
  return run(`UPDATE usuarios SET ${sets} WHERE id = ?`, valores);
}

// --- Rotas (com user_id) ---

function listarRotas(userId) {
  return query('SELECT * FROM rotas WHERE user_id = ? ORDER BY criada_em DESC', [userId]);
}

function listarRotasAtivas() {
  return query('SELECT r.*, u.email_alertas FROM rotas r JOIN usuarios u ON r.user_id = u.id WHERE r.ativa = 1');
}

function buscarRota(id) {
  return queryOne('SELECT * FROM rotas WHERE id = ?', [id]);
}

function criarRota(dados) {
  return run(
    'INSERT INTO rotas (user_id, origem, destino, tipo_voo, data_ida, data_volta, flexivel, preco_maximo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [dados.user_id, dados.origem, dados.destino, dados.tipo_voo ?? 'ida_volta', dados.data_ida ?? null, dados.data_volta ?? null, dados.flexivel ?? 0, dados.preco_maximo]
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

// --- Histórico ---

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

// --- Configurações globais ---

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
  criarUsuario, buscarUsuarioPorEmail, buscarUsuarioPorId, atualizarUsuario, contarUsuarios, adotarRotasOrfas,
  listarRotas, listarRotasAtivas, buscarRota, criarRota, atualizarRota, deletarRota,
  salvarHistorico, buscarHistorico, calcularMedia,
  getConfig, setConfig, getTodasConfigs,
};

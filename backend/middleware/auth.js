const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'flight_alert_secret';

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, nome: usuario.nome },
    SECRET,
    { expiresIn: '30d' }
  );
}

function autenticar(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido.' });
  }
  try {
    const token = header.split(' ')[1];
    req.usuario = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado. Faça login novamente.' });
  }
}

module.exports = { gerarToken, autenticar };

const nodemailer = require('nodemailer');
const db = require('./database');

async function criarTransporte() {
  const user = (await db.getConfig('email_user')) || process.env.EMAIL_USER;
  const pass = (await db.getConfig('email_pass')) || process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error('Credenciais de email não configuradas.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

function getEmailDestino(usuario) {
  return usuario?.email_alertas || usuario?.email || process.env.EMAIL_TO;
}

function layoutBase({ corBanner, tituloBanner, icone, conteudo }) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .banner { background: ${corBanner}; color: white; padding: 24px 32px; text-align: center; }
    .banner h1 { margin: 0; font-size: 24px; }
    .banner p { margin: 6px 0 0; opacity: 0.9; font-size: 15px; }
    .body { padding: 32px; }
    .rota { font-size: 22px; font-weight: bold; color: #333; margin-bottom: 24px; text-align: center; }
    .info-box { background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 16px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #666; font-size: 14px; }
    .info-valor { font-weight: bold; color: #333; }
    .preco-destaque { text-align: center; font-size: 36px; font-weight: bold; color: ${corBanner}; margin: 24px 0; }
    .btn { display: block; width: fit-content; margin: 24px auto; background: ${corBanner}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; }
    .rodape { text-align: center; color: #999; font-size: 12px; padding: 20px 32px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="banner">
      <h1>${icone} ${tituloBanner}</h1>
      <p>Flight Alert — Monitor de Passagens Aéreas</p>
    </div>
    <div class="body">
      ${conteudo}
    </div>
    <div class="rodape">
      Este é um alerta automático do seu Flight Alert pessoal.<br>
      Verifique sempre as condições antes de comprar.
    </div>
  </div>
</body>
</html>`;
}

async function enviarAlertaNormal(rota, preco, link, usuario) {
  const transporte = await criarTransporte();
  const destino = getEmailDestino(usuario);
  const nomeRota = `${rota.origem} → ${rota.destino}`;
  const desconto = Math.round(((rota.preco_maximo - preco) / rota.preco_maximo) * 100);
  const emailUser = (await db.getConfig('email_user')) || process.env.EMAIL_USER;

  const conteudo = `
    <div class="rota">✈️ ${nomeRota}</div>
    <div class="preco-destaque">R$ ${preco.toFixed(2)}</div>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Preço encontrado</span><span class="info-valor" style="color:#16a34a">R$ ${preco.toFixed(2)}</span></div>
      <div class="info-row"><span class="info-label">Seu limite máximo</span><span class="info-valor">R$ ${rota.preco_maximo.toFixed(2)}</span></div>
      <div class="info-row"><span class="info-label">Economia</span><span class="info-valor" style="color:#16a34a">${desconto}% abaixo do seu limite</span></div>
      ${rota.data_ida ? `<div class="info-row"><span class="info-label">Data de ida</span><span class="info-valor">${formatarData(rota.data_ida)}</span></div>` : ''}
      ${rota.data_volta ? `<div class="info-row"><span class="info-label">Data de volta</span><span class="info-valor">${formatarData(rota.data_volta)}</span></div>` : ''}
    </div>
    <a href="${link}" class="btn">Ver passagem agora →</a>
    <p style="text-align:center;color:#666;font-size:13px;">Preço verificado em ${new Date().toLocaleString('pt-BR')}</p>
  `;

  await transporte.sendMail({
    from: `"✈️ Flight Alert" <${emailUser}>`,
    to: destino,
    subject: `🎯 Passagem abaixo do limite: ${nomeRota} — R$ ${preco.toFixed(2)}`,
    html: layoutBase({ corBanner: '#2563eb', tituloBanner: 'Alerta de Preço!', icone: '🎯', conteudo }),
  });

  console.log(`📧 Alerta normal enviado para ${destino}: ${nomeRota} R$ ${preco}`);
}

async function enviarAlertaErroTarifario(rota, preco, media, link, usuario) {
  const transporte = await criarTransporte();
  const destino = getEmailDestino(usuario);
  const nomeRota = `${rota.origem} → ${rota.destino}`;
  const percentualDesconto = Math.round(((media - preco) / media) * 100);
  const emailUser = (await db.getConfig('email_user')) || process.env.EMAIL_USER;

  const conteudo = `
    <div style="background:#fef2f2;border:2px solid #ef4444;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center;">
      <strong style="color:#dc2626;font-size:18px;">⚠️ Preço ${percentualDesconto}% abaixo da média histórica!</strong><br>
      <span style="color:#666;font-size:14px;">Pode ser um erro tarifário ou promoção relâmpago. Aja rápido!</span>
    </div>
    <div class="rota">✈️ ${nomeRota}</div>
    <div class="preco-destaque" style="color:#dc2626;">R$ ${preco.toFixed(2)}</div>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Preço encontrado</span><span class="info-valor" style="color:#dc2626">R$ ${preco.toFixed(2)}</span></div>
      <div class="info-row"><span class="info-label">Média histórica (últimos 30)</span><span class="info-valor">R$ ${media.toFixed(2)}</span></div>
      <div class="info-row"><span class="info-label">Desconto sobre a média</span><span class="info-valor" style="color:#dc2626;font-size:18px;">${percentualDesconto}% OFF 🔥</span></div>
      <div class="info-row"><span class="info-label">Seu limite máximo</span><span class="info-valor">R$ ${rota.preco_maximo.toFixed(2)}</span></div>
    </div>
    <a href="${link}" class="btn" style="background:#dc2626;">🚨 Comprar antes que suba!</a>
    <p style="text-align:center;color:#666;font-size:13px;">Verificado em ${new Date().toLocaleString('pt-BR')} — Preços mudam rapidamente</p>
  `;

  await transporte.sendMail({
    from: `"✈️ Flight Alert" <${emailUser}>`,
    to: destino,
    subject: `🚨 POSSÍVEL ERRO TARIFÁRIO: ${nomeRota} — R$ ${preco.toFixed(2)} (${percentualDesconto}% off)`,
    html: layoutBase({ corBanner: '#dc2626', tituloBanner: 'POSSÍVEL ERRO TARIFÁRIO', icone: '🚨', conteudo }),
  });

  console.log(`📧 Alerta tarifário enviado: ${nomeRota} R$ ${preco} (média: R$ ${media})`);
}

async function enviarEmailTeste(usuario) {
  const transporte = await criarTransporte();
  const destino = getEmailDestino(usuario);
  const emailUser = (await db.getConfig('email_user')) || process.env.EMAIL_USER;

  const conteudo = `
    <div style="text-align:center;padding:20px;">
      <div style="font-size:64px;margin-bottom:16px;">✅</div>
      <h2 style="color:#333;">Configuração funcionando!</h2>
      <p style="color:#666;">Seu Flight Alert está configurado corretamente.</p>
      <div class="info-box" style="margin-top:24px;">
        <div class="info-row"><span class="info-label">Testado em</span><span class="info-valor">${new Date().toLocaleString('pt-BR')}</span></div>
      </div>
    </div>
  `;

  await transporte.sendMail({
    from: `"✈️ Flight Alert" <${emailUser}>`,
    to: destino,
    subject: '✅ Flight Alert — Teste de configuração',
    html: layoutBase({ corBanner: '#16a34a', tituloBanner: 'Email de Teste', icone: '✅', conteudo }),
  });

  console.log(`📧 Email de teste enviado para ${destino}`);
}

function formatarData(dataStr) {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

async function enviarEmailRedefinicao(usuario, link) {
  const transporte = await criarTransporte();
  const emailUser = (await db.getConfig('email_user')) || process.env.EMAIL_USER;

  const conteudo = `
    <div style="text-align:center;padding:20px;">
      <div style="font-size:56px;margin-bottom:16px;">🔐</div>
      <h2 style="color:#333;">Redefinir sua senha</h2>
      <p style="color:#666;margin-bottom:24px;">Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
      <a href="${link}" class="btn">Redefinir senha →</a>
      <p style="color:#999;font-size:12px;margin-top:24px;">Se você não solicitou a redefinição, ignore este email. Sua senha não será alterada.</p>
    </div>
  `;

  await transporte.sendMail({
    from: `"✈️ Flight Alert" <${emailUser}>`,
    to: usuario.email_alertas || usuario.email,
    subject: '🔐 Flight Alert — Redefinir senha',
    html: layoutBase({ corBanner: '#2563eb', tituloBanner: 'Redefinir Senha', icone: '🔐', conteudo }),
  });

  console.log(`📧 Email de redefinição enviado para ${usuario.email}`);
}

module.exports = { enviarAlertaNormal, enviarAlertaErroTarifario, enviarEmailTeste, enviarEmailRedefinicao };

const cron = require('node-cron');
const db = require('./database');
const { buscarPrecos } = require('./serpapi');
const { enviarAlertaNormal, enviarAlertaErroTarifario } = require('./mailer');

const INTERVALO_ALERTA_MS = 12 * 60 * 60 * 1000;

let tarefaAgendada = null;

async function verificarRota(rota) {
  console.log(`\n🔎 Verificando rota #${rota.id}: ${rota.origem} → ${rota.destino}`);

  const resultado = await buscarPrecos(
    rota.origem,
    rota.destino,
    rota.data_ida,
    rota.data_volta,
    rota.tipo_voo
  );

  if (!resultado) {
    console.warn(`⚠️  Sem resultado para rota #${rota.id}`);
    return;
  }

  const { preco, ciaAerea, linkCompra } = resultado;

  await db.salvarHistorico({
    rota_id: rota.id,
    preco,
    moeda: 'BRL',
    cia_aerea: ciaAerea,
    link_compra: linkCompra,
  });

  const media = await db.calcularMedia(rota.id, 30);
  const agora = Date.now();

  // Erro tarifário (preço < 60% da média)
  if (media && preco < media * 0.60) {
    const ultimoTarifario = rota.ultimo_alerta_tarifario
      ? new Date(rota.ultimo_alerta_tarifario).getTime()
      : 0;

    if (agora - ultimoTarifario >= INTERVALO_ALERTA_MS) {
      try {
        await enviarAlertaErroTarifario(rota, preco, media, linkCompra, rota);
        await db.atualizarRota(rota.id, { ultimo_alerta_tarifario: new Date().toISOString() });
      } catch (e) {
        console.error('❌ Falha ao enviar alerta tarifário:', e.message);
      }
    } else {
      console.log(`⏳ Alerta tarifário recente para rota #${rota.id}, pulando.`);
    }
    return;
  }

  // Alerta normal (preço <= limite)
  if (preco <= rota.preco_maximo) {
    const ultimoNormal = rota.ultimo_alerta_normal
      ? new Date(rota.ultimo_alerta_normal).getTime()
      : 0;

    if (agora - ultimoNormal >= INTERVALO_ALERTA_MS) {
      try {
        await enviarAlertaNormal(rota, preco, linkCompra, rota);
        await db.atualizarRota(rota.id, { ultimo_alerta_normal: new Date().toISOString() });
      } catch (e) {
        console.error('❌ Falha ao enviar alerta normal:', e.message);
      }
    } else {
      console.log(`⏳ Alerta normal recente para rota #${rota.id}, pulando.`);
    }
  } else {
    console.log(`ℹ️  Preço R$ ${preco} acima do limite R$ ${rota.preco_maximo} para rota #${rota.id}`);
  }
}

async function verificarTodasRotas() {
  console.log(`\n🕐 [${new Date().toLocaleString('pt-BR')}] Iniciando verificação programada...`);
  const rotas = await db.listarRotasAtivas();

  if (!rotas.length) {
    console.log('ℹ️  Nenhuma rota ativa para verificar.');
    return;
  }

  for (const rota of rotas) {
    await verificarRota(rota);
  }

  console.log(`✅ Verificação concluída. ${rotas.length} rota(s) processada(s).\n`);
}

async function iniciarScheduler() {
  const frequencia = parseInt(await db.getConfig('frequencia_horas') || '6', 10);
  const expressaoCron = frequencia === 0 ? '*/30 * * * *' : `0 */${frequencia} * * *`;
  const descricao = frequencia === 0 ? '30 minutos' : `${frequencia}h`;

  console.log(`⏰ Scheduler iniciado — verificação a cada ${descricao} (cron: ${expressaoCron})`);

  tarefaAgendada = cron.schedule(expressaoCron, verificarTodasRotas, {
    scheduled: true,
    timezone: 'America/Sao_Paulo',
  });

  // Roda imediatamente ao iniciar para não depender da primeira janela do cron
  verificarTodasRotas().catch(err => console.error('❌ Erro na verificação inicial:', err.message));

  return tarefaAgendada;
}

function pararScheduler() {
  if (tarefaAgendada) {
    tarefaAgendada.stop();
    console.log('⏹️  Scheduler parado.');
  }
}

module.exports = { iniciarScheduler, pararScheduler, verificarRota, verificarTodasRotas };

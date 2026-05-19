const axios = require('axios');
const db = require('./database');

/**
 * Busca preços de voo usando a SerpAPI (Google Flights).
 * Retorna o voo mais barato encontrado ou null em caso de erro.
 */
async function buscarPrecos(origem, destino, dataIda, dataVolta, tipoVoo = 'ida_volta') {
  const apiKey = await db.getConfig('serpapi_key') || process.env.SERPAPI_KEY;

  if (!apiKey) {
    console.error('❌ SerpAPI Key não configurada.');
    return null;
  }

  // Modo flexível: sem data definida → busca o mais barato nos próximos 30 dias
  if (!dataIda) {
    return buscarMaisBaratoProximos30Dias(origem, destino, tipoVoo, apiKey);
  }

  return buscarDataEspecifica(origem, destino, dataIda, dataVolta, tipoVoo, apiKey);
}

/**
 * Busca em uma data específica.
 */
async function buscarDataEspecifica(origem, destino, dataIda, dataVolta, tipoVoo, apiKey) {
  const params = {
    engine: 'google_flights',
    departure_id: origem.toUpperCase().trim(),
    arrival_id: destino.toUpperCase().trim(),
    outbound_date: dataIda,
    currency: 'BRL',
    hl: 'pt',
    gl: 'br',
    api_key: apiKey,
  };

  if (tipoVoo === 'ida_volta' && dataVolta) {
    params.return_date = dataVolta;
    params.type = '1'; // round trip
  } else {
    params.type = '2'; // one way
  }

  try {
    console.log(`🔍 Buscando voos: ${origem} → ${destino} (${dataIda}${dataVolta ? ' / ' + dataVolta : ''})`);
    const { data } = await axios.get('https://serpapi.com/search.json', { params, timeout: 30000 });

    return extrairMaisBarato(data, origem, destino, dataIda, dataVolta);
  } catch (erro) {
    logErro(erro);
    return null;
  }
}

/**
 * Modo datas flexíveis: testa os próximos 30 dias (de 3 em 3 dias) e retorna o mais barato.
 * Para ida e volta, usa janela de 7 dias de estadia.
 */
async function buscarMaisBaratoProximos30Dias(origem, destino, tipoVoo, apiKey) {
  console.log(`🗓️  Datas flexíveis: varrendo próximos 30 dias para ${origem} → ${destino}`);

  const hoje = new Date();
  const resultados = [];

  // Amostra a cada 3 dias nos próximos 30 dias (10 buscas no máximo)
  for (let i = 1; i <= 30; i += 3) {
    const dataIda = adicionarDias(hoje, i);
    const dataVolta = tipoVoo === 'ida_volta' ? adicionarDias(hoje, i + 7) : null;

    const params = {
      engine: 'google_flights',
      departure_id: origem.toUpperCase().trim(),
      arrival_id: destino.toUpperCase().trim(),
      outbound_date: dataIda,
      currency: 'BRL',
      hl: 'pt',
      gl: 'br',
      api_key: apiKey,
    };

    if (tipoVoo === 'ida_volta') {
      params.return_date = dataVolta;
      params.type = '1';
    } else {
      params.type = '2';
    }

    try {
      const { data } = await axios.get('https://serpapi.com/search.json', { params, timeout: 30000 });
      const resultado = extrairMaisBarato(data, origem, destino, dataIda, dataVolta);
      if (resultado) {
        resultados.push({ ...resultado, dataIda, dataVolta });
        console.log(`  📅 ${dataIda}: R$ ${resultado.preco} (${resultado.ciaAerea})`);
      }
    } catch (erro) {
      // Continua para a próxima data se uma falhar
      console.warn(`  ⚠️  Falha ao buscar ${dataIda}:`, erro.message);
    }

    // Pequena pausa para não sobrecarregar a API
    await new Promise(r => setTimeout(r, 500));
  }

  if (!resultados.length) {
    console.warn(`⚠️  Nenhum voo encontrado nos próximos 30 dias para ${origem} → ${destino}`);
    return null;
  }

  // Retorna o mais barato de todos os dias testados
  const maisBarato = resultados.reduce((min, r) => r.preco < min.preco ? r : min);
  console.log(`✅ Mais barato nos próximos 30 dias: R$ ${maisBarato.preco} em ${maisBarato.dataIda} (${maisBarato.ciaAerea})`);

  return maisBarato;
}

/**
 * Extrai a opção mais barata do retorno da SerpAPI.
 */
function extrairMaisBarato(data, origem, destino, dataIda, dataVolta) {
  const todasOpcoes = [
    ...(data.best_flights || []),
    ...(data.other_flights || []),
  ];

  if (!todasOpcoes.length) return null;

  const maisBarato = todasOpcoes.reduce((min, voo) => voo.price < min.price ? voo : min);
  const ciaAerea = maisBarato.flights?.[0]?.airline || 'Desconhecida';

  console.log(`✅ Melhor preço: R$ ${maisBarato.price} (${ciaAerea})`);

  return {
    preco: maisBarato.price,
    ciaAerea,
    linkCompra: montarLinkGoogleFlights(origem, destino, dataIda, dataVolta),
  };
}

function adicionarDias(data, dias) {
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

function montarLinkGoogleFlights(origem, destino, dataIda, dataVolta) {
  const base = 'https://www.google.com/travel/flights';
  const params = new URLSearchParams({ q: `Voos de ${origem} para ${destino}`, hl: 'pt-BR' });
  return `${base}?${params.toString()}`;
}

function logErro(erro) {
  if (erro.response) {
    console.error(`❌ Erro SerpAPI [${erro.response.status}]:`, erro.response.data?.error || erro.message);
  } else if (erro.code === 'ECONNABORTED') {
    console.error('❌ Timeout ao consultar SerpAPI');
  } else {
    console.error('❌ Erro ao buscar preços:', erro.message);
  }
}

module.exports = { buscarPrecos };

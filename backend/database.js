const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://qopwanwcdilltwwoqtfh.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcHdhbndjZGlsbHR3d29xdGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTgxNTcsImV4cCI6MjA5NDc5NDE1N30.a5WRHxux034gXKrM97KWM-Za_Z4qd9bcfj2Ss8PsxJ0'
);

async function inicializar() {
  const { error } = await supabase.from('configuracoes').select('chave').limit(1);
  if (error) throw new Error('Falha ao conectar ao Supabase: ' + error.message);
  if (process.env.SERPAPI_KEY) {
    await supabase.from('configuracoes')
      .upsert({ chave: 'serpapi_key', valor: process.env.SERPAPI_KEY }, { onConflict: 'chave' });
  }
  console.log('✅ Supabase (PostgreSQL) conectado.');
}

// --- Usuários ---

async function criarUsuario(dados) {
  const { data, error } = await supabase.from('usuarios')
    .insert({
      nome: dados.nome,
      email: dados.email.toLowerCase(),
      senha_hash: dados.senha_hash,
      email_alertas: dados.email_alertas || dados.email.toLowerCase(),
    })
    .select('id, nome, email, email_alertas, criada_em')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function buscarUsuarioPorEmail(email) {
  const { data } = await supabase.from('usuarios').select('*').eq('email', email.toLowerCase()).maybeSingle();
  return data || null;
}

async function buscarUsuarioPorId(id) {
  const { data } = await supabase.from('usuarios').select('id, nome, email, email_alertas, criada_em').eq('id', id).maybeSingle();
  return data || null;
}

async function atualizarUsuario(id, campos) {
  const { data, error } = await supabase.from('usuarios')
    .update(campos)
    .eq('id', id)
    .select('id, nome, email, email_alertas, criada_em')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function contarUsuarios() {
  const { count } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
  return count ?? 0;
}

async function salvarResetToken(userId, token, expira) {
  await supabase.from('usuarios').update({ reset_token: token, reset_token_expira: expira.toISOString() }).eq('id', userId);
}

async function buscarPorResetToken(token) {
  const { data } = await supabase.from('usuarios')
    .select('id, nome, email, email_alertas')
    .eq('reset_token', token)
    .gt('reset_token_expira', new Date().toISOString())
    .maybeSingle();
  return data || null;
}

async function adotarRotasOrfas(userId) {
  await supabase.from('rotas').update({ user_id: userId }).is('user_id', null);
}

// --- Rotas ---

async function listarRotas(userId) {
  const { data } = await supabase.from('rotas').select('*').eq('user_id', userId).order('criada_em', { ascending: false });
  return data || [];
}

async function listarRotasAtivas() {
  const { data } = await supabase.from('rotas')
    .select('*, usuarios(email_alertas)')
    .eq('ativa', true);
  return (data || []).map(({ usuarios, ...rota }) => ({
    ...rota,
    email_alertas: usuarios?.email_alertas || null,
  }));
}

async function buscarRota(id) {
  const { data } = await supabase.from('rotas').select('*').eq('id', id).maybeSingle();
  return data || null;
}

async function criarRota(dados) {
  const { data, error } = await supabase.from('rotas')
    .insert({
      user_id: dados.user_id,
      origem: dados.origem,
      destino: dados.destino,
      tipo_voo: dados.tipo_voo ?? 'ida_volta',
      data_ida: dados.data_ida ?? null,
      data_volta: dados.data_volta ?? null,
      flexivel: dados.flexivel ?? false,
      preco_maximo: dados.preco_maximo,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function atualizarRota(id, campos) {
  const { data, error } = await supabase.from('rotas').update(campos).eq('id', id).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

async function deletarRota(id) {
  // historico_precos tem ON DELETE CASCADE
  await supabase.from('rotas').delete().eq('id', id);
}

// --- Histórico ---

async function salvarHistorico(dados) {
  const { data, error } = await supabase.from('historico_precos')
    .insert({
      rota_id: dados.rota_id,
      preco: dados.preco,
      moeda: dados.moeda || 'BRL',
      cia_aerea: dados.cia_aerea || null,
      link_compra: dados.link_compra || null,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function buscarHistorico(rotaId) {
  const { data } = await supabase.from('historico_precos')
    .select('*')
    .eq('rota_id', rotaId)
    .order('verificado_em', { ascending: false });
  return data || [];
}

async function calcularMedia(rotaId, limite = 30) {
  const { data } = await supabase.from('historico_precos')
    .select('preco')
    .eq('rota_id', rotaId)
    .order('verificado_em', { ascending: false })
    .limit(limite);
  if (!data?.length) return null;
  return data.reduce((sum, r) => sum + r.preco, 0) / data.length;
}

// --- Configurações ---

async function getConfig(chave) {
  const { data } = await supabase.from('configuracoes').select('valor').eq('chave', chave).maybeSingle();
  return data?.valor || null;
}

async function setConfig(chave, valor) {
  const { data, error } = await supabase.from('configuracoes')
    .upsert({ chave, valor }, { onConflict: 'chave' })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function getTodasConfigs() {
  const { data } = await supabase.from('configuracoes').select('chave, valor');
  return Object.fromEntries((data || []).map(r => [r.chave, r.valor]));
}

module.exports = {
  inicializar,
  criarUsuario, buscarUsuarioPorEmail, buscarUsuarioPorId, atualizarUsuario, contarUsuarios, adotarRotasOrfas,
  salvarResetToken, buscarPorResetToken,
  listarRotas, listarRotasAtivas, buscarRota, criarRota, atualizarRota, deletarRota,
  salvarHistorico, buscarHistorico, calcularMedia,
  getConfig, setConfig, getTodasConfigs,
};

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AeroportoInput from '../components/AeroportoInput';

const CAMPOS_INICIAIS = {
  origem: '',
  destino: '',
  tipo_voo: 'ida_volta', // 'so_ida' ou 'ida_volta'
  data_ida: '',
  data_volta: '',
  flexivel: false,
  preco_maximo: '',
};

export default function NovaRota() {
  const [form, setForm] = useState(CAMPOS_INICIAIS);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const navigate = useNavigate();

  function atualizar(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
    if (erros[campo]) setErros(prev => ({ ...prev, [campo]: '' }));
  }

  function validar() {
    const novosErros = {};
    if (!form.origem.trim()) novosErros.origem = 'Selecione o aeroporto de origem.';
    if (!form.destino.trim()) novosErros.destino = 'Selecione o aeroporto de destino.';
    if (!form.preco_maximo || parseFloat(form.preco_maximo) <= 0)
      novosErros.preco_maximo = 'Informe um preço máximo válido.';
    if (!form.flexivel && !form.data_ida)
      novosErros.data_ida = 'Informe a data de ida ou marque "Datas flexíveis".';
    if (!form.flexivel && form.tipo_voo === 'ida_volta' && !form.data_volta)
      novosErros.data_volta = 'Informe a data de volta para voo de ida e volta.';
    return novosErros;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errosValidacao = validar();
    if (Object.keys(errosValidacao).length) {
      setErros(errosValidacao);
      return;
    }

    // Se for só ida, ignora a data de volta mesmo que preenchida
    const dataVolta = form.tipo_voo === 'ida_volta' ? (form.data_volta || null) : null;

    setSalvando(true);
    try {
      await axios.post('/api/rotas', {
        origem: form.origem.toUpperCase(),
        destino: form.destino.toUpperCase(),
        tipo_voo: form.tipo_voo,
        preco_maximo: parseFloat(form.preco_maximo),
        flexivel: form.flexivel ? 1 : 0,
        data_ida: form.data_ida || null,
        data_volta: dataVolta,
      });
      setSucesso(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (e) {
      setErros({ geral: e.response?.data?.erro || 'Erro ao salvar a rota.' });
    } finally {
      setSalvando(false);
    }
  }

  if (sucesso) {
    return (
      <div className="pagina">
        <div className="sucesso-state">
          <div className="sucesso-icone">✅</div>
          <h2>Rota cadastrada com sucesso!</h2>
          <p>Redirecionando para suas rotas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Nova Rota</h1>
          <p className="pagina-subtitulo">Configure os parâmetros de monitoramento</p>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          {erros.geral && <div className="alert alert-erro">{erros.geral}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="origem">Aeroporto de Origem *</label>
              <AeroportoInput
                id="origem"
                value={form.origem}
                onChange={val => atualizar('origem', val)}
                placeholder="Digite cidade, aeroporto ou código IATA"
                erro={!!erros.origem}
              />
              {erros.origem && <span className="erro-campo">{erros.origem}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="destino">Aeroporto de Destino *</label>
              <AeroportoInput
                id="destino"
                value={form.destino}
                onChange={val => atualizar('destino', val)}
                placeholder="Digite cidade, aeroporto ou código IATA"
                erro={!!erros.destino}
              />
              {erros.destino && <span className="erro-campo">{erros.destino}</span>}
            </div>
          </div>

          {/* Tipo de voo — sempre visível, inclusive com datas flexíveis */}
          <div className="form-group">
            <label>Tipo de voo *</label>
            <div className="tipo-voo-opcoes">
              <label className={`tipo-voo-btn ${form.tipo_voo === 'so_ida' ? 'ativo' : ''}`}>
                <input
                  type="radio"
                  name="tipo_voo"
                  value="so_ida"
                  checked={form.tipo_voo === 'so_ida'}
                  onChange={() => {
                    atualizar('tipo_voo', 'so_ida');
                    atualizar('data_volta', '');
                  }}
                />
                ✈️ Só ida
              </label>
              <label className={`tipo-voo-btn ${form.tipo_voo === 'ida_volta' ? 'ativo' : ''}`}>
                <input
                  type="radio"
                  name="tipo_voo"
                  value="ida_volta"
                  checked={form.tipo_voo === 'ida_volta'}
                  onChange={() => atualizar('tipo_voo', 'ida_volta')}
                />
                🔄 Ida e volta
              </label>
            </div>
            <span className="campo-dica">
              {form.tipo_voo === 'so_ida'
                ? 'O preço máximo se refere ao trecho de ida.'
                : 'O preço máximo se refere ao total da ida e volta.'}
            </span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Data de Ida {!form.flexivel && '*'}</label>
              <input
                type="date"
                className={`input ${erros.data_ida ? 'input-erro' : ''}`}
                value={form.data_ida}
                onChange={e => atualizar('data_ida', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={form.flexivel}
              />
              {erros.data_ida && <span className="erro-campo">{erros.data_ida}</span>}
            </div>

            <div className="form-group">
              <label>
                Data de Volta
                {!form.flexivel && form.tipo_voo === 'ida_volta' && ' *'}
                {(form.flexivel || form.tipo_voo === 'so_ida') && <span className="opcional"> (não aplicável)</span>}
              </label>
              <input
                type="date"
                className={`input ${erros.data_volta ? 'input-erro' : ''}`}
                value={form.data_volta}
                onChange={e => atualizar('data_volta', e.target.value)}
                min={form.data_ida || new Date().toISOString().split('T')[0]}
                disabled={form.flexivel || form.tipo_voo === 'so_ida'}
              />
              {erros.data_volta && <span className="erro-campo">{erros.data_volta}</span>}
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.flexivel}
                onChange={e => {
                  atualizar('flexivel', e.target.checked);
                  if (e.target.checked) {
                    atualizar('data_ida', '');
                    atualizar('data_volta', '');
                  }
                }}
              />
              <span>Datas flexíveis — monitorar o mês inteiro</span>
            </label>
            <p className="campo-dica">Ideal para viagens sem data definida. A busca monitora qualquer voo disponível.</p>
          </div>

          <div className="form-group">
            <label>Preço Máximo (R$) *</label>
            <div className="input-prefix-wrapper">
              <span className="input-prefix">R$</span>
              <input
                type="number"
                className={`input input-com-prefix ${erros.preco_maximo ? 'input-erro' : ''}`}
                placeholder="800"
                value={form.preco_maximo}
                onChange={e => atualizar('preco_maximo', e.target.value)}
                min="1"
                step="0.01"
              />
            </div>
            {erros.preco_maximo && <span className="erro-campo">{erros.preco_maximo}</span>}
            <span className="campo-dica">
              Você receberá um alerta quando o preço{' '}
              {form.tipo_voo === 'so_ida' ? '(só ida)' : '(ida e volta)'}{' '}
              ficar abaixo deste valor.
            </span>
          </div>

          <div className="form-acoes">
            <button type="button" className="btn btn-secundario" onClick={() => navigate('/')}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primario" disabled={salvando}>
              {salvando ? '⏳ Salvando...' : '✅ Cadastrar Rota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

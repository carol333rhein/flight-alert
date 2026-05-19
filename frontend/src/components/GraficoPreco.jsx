import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';

function formatarData(dataStr) {
  const d = new Date(dataStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function TooltipCustom({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip-grafico">
      <p className="tooltip-preco">R$ {payload[0].value.toFixed(2)}</p>
      <p className="tooltip-data">{formatarData(payload[0].payload.verificado_em)}</p>
      {payload[0].payload.cia_aerea && (
        <p className="tooltip-cia">{payload[0].payload.cia_aerea}</p>
      )}
    </div>
  );
}

export default function GraficoPreco({ historico, precoMaximo, media }) {
  if (!historico?.length) {
    return (
      <div className="grafico-vazio">
        <p>Nenhum dado histórico disponível ainda.</p>
        <p>Clique em "Verificar agora" na rota para registrar o primeiro preço.</p>
      </div>
    );
  }

  // Inverte para ordem cronológica (o banco retorna do mais novo para o mais antigo)
  const dados = [...historico].reverse().map(h => ({
    ...h,
    data: formatarData(h.verificado_em),
  }));

  const precoMin = Math.min(...dados.map(d => d.preco));
  const precoMaxGrafico = Math.max(...dados.map(d => d.preco), precoMaximo) * 1.1;

  return (
    <div className="grafico-container">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={dados} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="data"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[precoMin * 0.9, precoMaxGrafico]}
            tickFormatter={v => `R$ ${v.toFixed(0)}`}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            width={80}
          />
          <Tooltip content={<TooltipCustom />} />
          <Legend />

          {/* Linha de preço máximo definido */}
          <ReferenceLine
            y={precoMaximo}
            stroke="#ef4444"
            strokeDasharray="6 3"
            label={{ value: `Limite: R$ ${precoMaximo}`, position: 'insideTopRight', fill: '#ef4444', fontSize: 11 }}
          />

          {/* Linha de média histórica */}
          {media && (
            <ReferenceLine
              y={media}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{ value: `Média: R$ ${media.toFixed(0)}`, position: 'insideBottomRight', fill: '#f59e0b', fontSize: 11 }}
            />
          )}

          <Line
            type="monotone"
            dataKey="preco"
            name="Preço (R$)"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 4, fill: '#2563eb' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

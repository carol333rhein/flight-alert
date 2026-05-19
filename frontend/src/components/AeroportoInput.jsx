import { useState, useRef, useEffect } from 'react';
import { buscarAeroportos } from '../data/aeroportos';

export default function AeroportoInput({ value, onChange, placeholder, erro, id }) {
  const [query, setQuery] = useState('');
  const [opcoes, setOpcoes] = useState([]);
  const [aberto, setAberto] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef(null);
  const listaRef = useRef(null);

  // When value is set externally (e.g. form reset), sync display
  const [display, setDisplay] = useState(value || '');

  useEffect(() => {
    if (!value) {
      setDisplay('');
      setQuery('');
    }
  }, [value]);

  function handleInput(e) {
    const texto = e.target.value;
    setDisplay(texto);
    setQuery(texto);
    setCursor(-1);

    if (texto.length < 2) {
      setOpcoes([]);
      setAberto(false);
      onChange('');
      return;
    }

    const resultados = buscarAeroportos(texto);
    setOpcoes(resultados);
    setAberto(resultados.length > 0);
    // If user typed exactly a valid IATA code, keep it; otherwise clear parent value
    const match = resultados.find(a => a.codigo === texto.toUpperCase());
    onChange(match ? match.codigo : '');
  }

  function selecionar(aeroporto) {
    const label = `${aeroporto.codigo} — ${aeroporto.cidade}`;
    setDisplay(label);
    setQuery('');
    setOpcoes([]);
    setAberto(false);
    setCursor(-1);
    onChange(aeroporto.codigo);
  }

  function handleKeyDown(e) {
    if (!aberto) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor(c => Math.min(c + 1, opcoes.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, 0));
    } else if (e.key === 'Enter' && cursor >= 0) {
      e.preventDefault();
      selecionar(opcoes[cursor]);
    } else if (e.key === 'Escape') {
      setAberto(false);
    }
  }

  function handleBlur(e) {
    // Delay so click on list item fires first
    setTimeout(() => {
      if (!listaRef.current?.contains(document.activeElement)) {
        setAberto(false);
      }
    }, 150);
  }

  return (
    <div className="aeroporto-input-wrapper" style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        className={`input ${erro ? 'input-erro' : ''}`}
        placeholder={placeholder}
        value={display}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        autoComplete="off"
      />
      {aberto && (
        <ul
          ref={listaRef}
          className="aeroporto-dropdown"
        >
          {opcoes.map((a, i) => (
            <li
              key={a.codigo + i}
              className={`aeroporto-opcao ${i === cursor ? 'ativo' : ''}`}
              onMouseDown={() => selecionar(a)}
            >
              <span className="aeroporto-flag">{a.flag}</span>
              <span className="aeroporto-codigo">{a.codigo}</span>
              <span className="aeroporto-info">
                {a.cidade}
                <span className="aeroporto-nome"> · {a.nome}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

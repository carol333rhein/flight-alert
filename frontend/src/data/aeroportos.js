const aeroportos = [
  // Brasil
  { codigo: 'GRU', cidade: 'São Paulo', nome: 'Guarulhos Internacional', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'CGH', cidade: 'São Paulo', nome: 'Congonhas', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'VCP', cidade: 'Campinas', nome: 'Viracopos Internacional', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'GIG', cidade: 'Rio de Janeiro', nome: 'Galeão Internacional', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'SDU', cidade: 'Rio de Janeiro', nome: 'Santos Dumont', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'BSB', cidade: 'Brasília', nome: 'Internacional de Brasília', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'SSA', cidade: 'Salvador', nome: 'Deputado Luís Eduardo Magalhães', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'REC', cidade: 'Recife', nome: 'Guararapes Internacional', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'FOR', cidade: 'Fortaleza', nome: 'Pinto Martins Internacional', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'NAT', cidade: 'Natal', nome: 'Aluízio Alves Internacional', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'MCZ', cidade: 'Maceió', nome: 'Zumbi dos Palmares', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'AJU', cidade: 'Aracaju', nome: 'Santa Maria', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'MAO', cidade: 'Manaus', nome: 'Eduardo Gomes Internacional', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'BEL', cidade: 'Belém', nome: 'Val-de-Cans Internacional', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'SLZ', cidade: 'São Luís', nome: 'Marechal Cunha Machado Internacional', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'THE', cidade: 'Teresina', nome: 'Senador Petrônio Portella', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'CWB', cidade: 'Curitiba', nome: 'Afonso Pena Internacional', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'POA', cidade: 'Porto Alegre', nome: 'Salgado Filho Internacional', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'FLN', cidade: 'Florianópolis', nome: 'Hercílio Luz Internacional', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'IGU', cidade: 'Foz do Iguaçu', nome: 'Cataratas Internacional', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'LDB', cidade: 'Londrina', nome: 'Governador José Richa', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'NVT', cidade: 'Navegantes', nome: 'Ministro Victor Konder', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'CGB', cidade: 'Cuiabá', nome: 'Marechal Rondon Internacional', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'CGR', cidade: 'Campo Grande', nome: 'Internacional de Campo Grande', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'BVB', cidade: 'Boa Vista', nome: 'Atlas Brasil Cantanhede', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'PVH', cidade: 'Porto Velho', nome: 'Governador Jorge Teixeira', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'RBR', cidade: 'Rio Branco', nome: 'Internacional Plácido de Castro', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'MCP', cidade: 'Macapá', nome: 'Internacional de Macapá', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'PMW', cidade: 'Palmas', nome: 'Internacional de Palmas', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'GYN', cidade: 'Goiânia', nome: 'Santa Genoveva', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'VIX', cidade: 'Vitória', nome: 'Eurico de Aguiar Salles', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'BHZ', cidade: 'Belo Horizonte', nome: 'Confins Internacional', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'CNF', cidade: 'Belo Horizonte', nome: 'Tancredo Neves Internacional', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'PLU', cidade: 'Belo Horizonte', nome: 'Pampulha', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'JPA', cidade: 'João Pessoa', nome: 'Presidente Castro Pinto', pais: 'BR', flag: '🇧🇷' },
  { codigo: 'OPO', cidade: 'Porto', nome: 'Francisco Sá Carneiro', pais: 'PT', flag: '🇵🇹' },
  // Portugal
  { codigo: 'LIS', cidade: 'Lisboa', nome: 'Humberto Delgado Internacional', pais: 'PT', flag: '🇵🇹' },
  { codigo: 'FAO', cidade: 'Faro', nome: 'Internacional de Faro', pais: 'PT', flag: '🇵🇹' },
  // Europa
  { codigo: 'LHR', cidade: 'Londres', nome: 'Heathrow', pais: 'GB', flag: '🇬🇧' },
  { codigo: 'LGW', cidade: 'Londres', nome: 'Gatwick', pais: 'GB', flag: '🇬🇧' },
  { codigo: 'CDG', cidade: 'Paris', nome: 'Charles de Gaulle', pais: 'FR', flag: '🇫🇷' },
  { codigo: 'ORY', cidade: 'Paris', nome: 'Orly', pais: 'FR', flag: '🇫🇷' },
  { codigo: 'MAD', cidade: 'Madri', nome: 'Adolfo Suárez Barajas', pais: 'ES', flag: '🇪🇸' },
  { codigo: 'BCN', cidade: 'Barcelona', nome: 'Josep Tarradellas El Prat', pais: 'ES', flag: '🇪🇸' },
  { codigo: 'FCO', cidade: 'Roma', nome: 'Leonardo da Vinci (Fiumicino)', pais: 'IT', flag: '🇮🇹' },
  { codigo: 'MXP', cidade: 'Milão', nome: 'Malpensa Internacional', pais: 'IT', flag: '🇮🇹' },
  { codigo: 'FRA', cidade: 'Frankfurt', nome: 'Frankfurt am Main', pais: 'DE', flag: '🇩🇪' },
  { codigo: 'MUC', cidade: 'Munique', nome: 'Franz Josef Strauss', pais: 'DE', flag: '🇩🇪' },
  { codigo: 'AMS', cidade: 'Amsterdã', nome: 'Schiphol', pais: 'NL', flag: '🇳🇱' },
  { codigo: 'ZRH', cidade: 'Zurique', nome: 'Internacional de Zurique', pais: 'CH', flag: '🇨🇭' },
  // América do Norte
  { codigo: 'MIA', cidade: 'Miami', nome: 'Miami Internacional', pais: 'US', flag: '🇺🇸' },
  { codigo: 'JFK', cidade: 'Nova York', nome: 'John F. Kennedy Internacional', pais: 'US', flag: '🇺🇸' },
  { codigo: 'EWR', cidade: 'Nova York', nome: 'Newark Liberty Internacional', pais: 'US', flag: '🇺🇸' },
  { codigo: 'LAX', cidade: 'Los Angeles', nome: 'Los Angeles Internacional', pais: 'US', flag: '🇺🇸' },
  { codigo: 'ORD', cidade: 'Chicago', nome: "O'Hare Internacional", pais: 'US', flag: '🇺🇸' },
  { codigo: 'ATL', cidade: 'Atlanta', nome: 'Hartsfield-Jackson Internacional', pais: 'US', flag: '🇺🇸' },
  { codigo: 'IAH', cidade: 'Houston', nome: 'George Bush Intercontinental', pais: 'US', flag: '🇺🇸' },
  { codigo: 'DFW', cidade: 'Dallas', nome: 'Dallas/Fort Worth Internacional', pais: 'US', flag: '🇺🇸' },
  { codigo: 'BOS', cidade: 'Boston', nome: 'Logan Internacional', pais: 'US', flag: '🇺🇸' },
  { codigo: 'MCO', cidade: 'Orlando', nome: 'Orlando Internacional', pais: 'US', flag: '🇺🇸' },
  { codigo: 'LAS', cidade: 'Las Vegas', nome: 'Harry Reid Internacional', pais: 'US', flag: '🇺🇸' },
  { codigo: 'YYZ', cidade: 'Toronto', nome: 'Pearson Internacional', pais: 'CA', flag: '🇨🇦' },
  { codigo: 'YUL', cidade: 'Montreal', nome: 'Pierre Elliott Trudeau', pais: 'CA', flag: '🇨🇦' },
  // América do Sul
  { codigo: 'EZE', cidade: 'Buenos Aires', nome: 'Ministro Pistarini', pais: 'AR', flag: '🇦🇷' },
  { codigo: 'AEP', cidade: 'Buenos Aires', nome: 'Jorge Newbery', pais: 'AR', flag: '🇦🇷' },
  { codigo: 'SCL', cidade: 'Santiago', nome: 'Arturo Merino Benítez', pais: 'CL', flag: '🇨🇱' },
  { codigo: 'BOG', cidade: 'Bogotá', nome: 'El Dorado Internacional', pais: 'CO', flag: '🇨🇴' },
  { codigo: 'LIM', cidade: 'Lima', nome: 'Jorge Chávez Internacional', pais: 'PE', flag: '🇵🇪' },
  { codigo: 'GRU', cidade: 'São Paulo', nome: 'Guarulhos Internacional', pais: 'BR', flag: '🇧🇷' },
  // Ásia / Oceania / África
  { codigo: 'DXB', cidade: 'Dubai', nome: 'Dubai Internacional', pais: 'AE', flag: '🇦🇪' },
  { codigo: 'NRT', cidade: 'Tóquio', nome: 'Narita Internacional', pais: 'JP', flag: '🇯🇵' },
  { codigo: 'SYD', cidade: 'Sydney', nome: 'Kingsford Smith', pais: 'AU', flag: '🇦🇺' },
  { codigo: 'JNB', cidade: 'Joanesburgo', nome: 'O.R. Tambo Internacional', pais: 'ZA', flag: '🇿🇦' },
  { codigo: 'CUN', cidade: 'Cancún', nome: 'Internacional de Cancún', pais: 'MX', flag: '🇲🇽' },
  { codigo: 'MEX', cidade: 'Cidade do México', nome: 'Benito Juárez Internacional', pais: 'MX', flag: '🇲🇽' },
  { codigo: 'PMI', cidade: 'Palma de Mallorca', nome: 'Son Sant Joan', pais: 'ES', flag: '🇪🇸' },
  { codigo: 'GRX', cidade: 'Granada', nome: 'Federico García Lorca', pais: 'ES', flag: '🇪🇸' },
];

export function buscarAeroportos(texto) {
  if (!texto || texto.length < 2) return [];
  const q = texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return aeroportos
    .filter((a, i, arr) => arr.findIndex(b => b.codigo === a.codigo) === i) // dedup
    .filter(a => {
      const campos = [a.codigo, a.cidade, a.nome, a.pais]
        .join(' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      return campos.includes(q);
    })
    .slice(0, 8);
}

export default aeroportos;

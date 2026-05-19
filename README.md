# ✈️ Flight Alert — Monitor de Passagens Aéreas

Monitor pessoal que rastreia preços de voos via Google Flights e envia alertas por email quando os preços caem abaixo do seu limite — ou quando detecta um possível erro tarifário.

## Funcionalidades

- 📋 Cadastro de rotas com origem, destino, datas e preço máximo
- 🔍 Verificação automática a cada 6h, 12h ou 24h (configurável)
- 📧 Alertas por email quando o preço fica abaixo do seu limite
- 🚨 Alerta especial de **erro tarifário** quando o preço cai 40%+ abaixo da média histórica
- 📊 Gráfico de evolução de preços com linha de referência do limite
- ⏸ Pausar/ativar rotas individualmente
- 🔍 Verificação manual a qualquer momento

---

## Pré-requisitos

- [Node.js](https://nodejs.org) v18 ou superior
- Conta na [SerpAPI](https://serpapi.com) (plano gratuito tem 100 buscas/mês)
- Conta Gmail com [Senha de App](https://myaccount.google.com/apppasswords) ativada

---

## Instalação

### 1. Clone ou baixe o projeto

```bash
cd D:\
# Se tiver git:
git clone <url> flight-alert
# Ou descompacte a pasta flight-alert
cd flight-alert
```

### 2. Instale as dependências

```bash
npm run install:all
```

Isso instala as dependências do backend **e** do frontend de uma vez.

### 3. Configure o `.env`

Edite o arquivo `.env` na raiz do projeto:

```env
SERPAPI_KEY=sua_chave_serpapi_aqui
EMAIL_USER=seugmail@gmail.com
EMAIL_PASS=senha_de_app_do_gmail
EMAIL_TO=destinatario@gmail.com
PORT=3000
```

**Como conseguir a SerpAPI Key:**
1. Crie conta em [serpapi.com](https://serpapi.com)
2. Acesse [Dashboard → API Key](https://serpapi.com/manage-api-key)
3. Copie e cole no `.env`

**Como conseguir a Senha de App do Gmail:**
1. Ative verificação em 2 etapas na sua conta Google
2. Acesse [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Crie uma senha para "Email" / "Windows" e cole no `.env`

---

## Uso

### Modo desenvolvimento (backend + frontend simultâneos)

```bash
npm run dev
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173 (com proxy para a API)

### Modo produção

```bash
# 1. Build do frontend
npm run build

# 2. Inicia o servidor (serve frontend + API na mesma porta)
npm start
```

Acesse: http://localhost:3000

---

## Configuração via interface

Após subir o servidor, acesse a aba **Configurações** para:
- Informar sua SerpAPI Key (se não colocou no `.env`)
- Configurar Gmail remetente e destinatário
- Ajustar a frequência de verificação
- Enviar um email de teste para confirmar

---

## Estrutura do projeto

```
flight-alert/
├── backend/
│   ├── server.js          # Express + inicialização
│   ├── database.js        # SQLite (better-sqlite3)
│   ├── scheduler.js       # Verificação automática (node-cron)
│   ├── serpapi.js         # Consulta Google Flights via SerpAPI
│   ├── mailer.js          # Envio de emails (Nodemailer/Gmail)
│   └── routes/
│       ├── alerts.js      # CRUD de rotas + config
│       └── history.js     # Histórico de preços
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Lista de rotas
│   │   │   ├── NovaRota.jsx      # Formulário de cadastro
│   │   │   ├── Historico.jsx     # Gráfico + tabela de preços
│   │   │   └── Configuracoes.jsx # Chaves e preferências
│   │   └── components/
│   │       ├── Navbar.jsx        # Menu responsivo
│   │       ├── RotaCard.jsx      # Card de cada rota
│   │       └── GraficoPreco.jsx  # Gráfico Recharts
│   └── vite.config.js
├── .env
├── package.json
└── flight-alert.db        # Criado automaticamente na primeira execução
```

---

## Lógica de alertas

| Situação | Tipo de alerta |
|---|---|
| `preço atual ≤ preço máximo` | 🎯 Alerta normal — email azul |
| `preço atual < média × 0.60` | 🚨 Erro tarifário — email vermelho |
| Mesmo alerta em menos de 12h | Nenhum (protegido contra spam) |

---

## API Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/rotas` | Lista todas as rotas |
| POST | `/api/rotas` | Cria nova rota |
| PATCH | `/api/rotas/:id` | Atualiza campos (ex: ativa) |
| DELETE | `/api/rotas/:id` | Remove rota e histórico |
| POST | `/api/rotas/:id/verificar` | Verificação manual |
| GET | `/api/historico/:rotaId` | Histórico + média da rota |
| GET | `/api/rotas/config/todas` | Lê configurações |
| POST | `/api/rotas/config/salvar` | Salva configurações |
| POST | `/api/rotas/config/testar-email` | Envia email de teste |
| GET | `/api/status` | Status do servidor |

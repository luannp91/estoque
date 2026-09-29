# 📦 Sistema de Estoque

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-29.x-C21325?logo=jest&logoColor=white)
![Helmet](https://img.shields.io/badge/Helmet-7.x-000000?logo=helmet&logoColor=white)
![2FA](https://img.shields.io/badge/2FA-TOTP-success)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tests](https://img.shields.io/badge/tests-80%2B%20passing-brightgreen.svg)

**Sistema web completo de controle de estoque com autenticação JWT, 2FA, auditoria, backup criptografado, tempo real, relatórios em Excel corporativo e painel super-admin.**

[Funcionalidades](#-funcionalidades) • [Instalação](#-instalação) • [Uso](#-uso) • [API](#-api) • [Arquitetura](#-arquitetura) • [Segurança](#-segurança) • [Testes](#-testes)

</div>

---

## 📋 Sumário

- [Sobre](#-sobre)
- [Funcionalidades](#-funcionalidades)
- [Stack Tecnológica](#-stack-tecnológica)
- [Instalação](#-instalação)
- [Uso](#-uso)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API](#-api)
- [Arquitetura](#-arquitetura)
- [Segurança](#-segurança)
- [Backup e Restauração](#-backup-e-restauração)
- [Testes](#-testes)
- [Roadmap](#-roadmap)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Sobre

Sistema web completo para **gerenciamento de estoque** com foco em **pequenas e médias empresas**. Oferece controle total sobre produtos, categorias, movimentações e usuários, com **auditoria automática**, **backup criptografado**, **autenticação em dois fatores** e **relatórios profissionais**.

**Principais diferenciais:**

- 🔐 **Autenticação JWT + 2FA (TOTP)** com 3 níveis de acesso (`super`, `admin`, `operador`)
- 🛡️ **Hardening de segurança** — Helmet, CSP, rate limiting, account lockout, política de senha forte
- ⚡ **Atualização em tempo real** via WebSocket
- 📜 **Log de atividades global** com eventos de segurança (`SEC_*`)
- 📊 **Relatórios em Excel corporativo** com 6 abas e gráficos nativos
- 💾 **Backup AES-256-GCM** com restauração de 1 clique
- 👑 **Painel Super-Admin** com métricas de CPU, memória e alertas em tempo real
- 🧪 **80+ testes automatizados** (funcionais + 11 suítes de segurança)
- 🎨 **Interface responsiva** com tema claro/escuro (mobile-first)

---

## ✨ Funcionalidades

### 🔐 Autenticação e Autorização

- [x] Login com JWT (access + refresh token)
- [x] Senhas com hash bcrypt (rounds configuráveis)
- [x] **Autenticação em dois fatores (TOTP)** — compatível com Google Authenticator, Authy, 1Password
- [x] Papéis: **super-admin**, **administrador** e **operador**
- [x] **Account lockout** após N tentativas falhas (bloqueio temporário)
- [x] **Política de senha forte** (comprimento, complexidade, blacklist)
- [x] Troca de senha exigindo senha atual
- [x] Reset de senha por admin
- [x] Ativar/desativar contas sem perder histórico
- [x] Proteções: não pode se auto-remover nem rebaixar o último admin
- [x] Refresh token com expiração separada

### 📦 Gestão de Produtos

- [x] CRUD completo com validações (Zod)
- [x] SKU único, descrição, preço, estoque mínimo
- [x] Categoria opcional
- [x] Status ativo/inativo
- [x] **Soft delete** com lixeira recuperável
- [x] Busca por nome, SKU ou descrição
- [x] Filtros por categoria, estoque baixo e status
- [x] Ordenação por coluna (nome, preço, quantidade, ID)
- [x] Paginação server-side
- [x] Export CSV
- [x] **Formatação automática** (título preservando siglas: SSD, USB, HDMI)

### 🏷️ Categorias

- [x] CRUD completo
- [x] Contagem de produtos por categoria
- [x] Remoção não afeta produtos (ficam sem categoria)

### 🔄 Movimentações

- [x] Entrada (+), saída (−) e ajuste de estoque
- [x] **Auditoria automática** de toda operação
- [x] Histórico paginado com filtros (tipo, período)
- [x] Colunas antes/depois para rastrear variação
- [x] Snapshot do nome do produto (preserva histórico mesmo após exclusão)
- [x] Não permite saída maior que o estoque

### 📊 Dashboard

- [x] 5 KPIs em tempo real (produtos, itens, valor, baixo, zerado)
- [x] Gráfico de rosca — produtos por categoria
- [x] Gráfico de barras — top 10 produtos por valor
- [x] Tabela de alertas de estoque baixo

### 📈 Relatórios

- [x] **Export Excel corporativo** com 6 abas:
  - Resumo Executivo (KPIs + distribuições)
  - Produtos (lista completa com formatação)
  - Movimentações (histórico do período)
  - Top Produtos (ranking com medalhas)
  - Estoque Baixo (alertas + ações sugeridas)
  - Gráficos (dados organizados para chart nativo)
- [x] Export CSV simples
- [x] Filtro por período

### 👑 Painel Super-Admin

- [x] Acesso restrito ao papel `super`
- [x] **KPIs em tempo real**: uptime, memória (RSS/Heap), requisições, erros, WebSocket
- [x] **Gráfico de CPU** (cálculo real, funciona no Windows)
- [x] **Gráfico de memória** (RSS + Heap ao longo do tempo)
- [x] **Alertas automáticos** (CPU > 80%, memória > 500MB, erros 500, latência)
- [x] **Feed de eventos** em tempo real via WebSocket
- [x] **Auditoria de segurança** sob demanda (2FA pendente, contas bloqueadas, brute force)
- [x] Estatísticas agregadas (usuários, logs, produtos na lixeira)

### 📜 Log de Atividades

- [x] Registro automático de todas as ações críticas
- [x] **Logs de segurança** com prefixo `SEC_*`:
  - `SEC_LOGIN_SUCESSO`, `SEC_LOGIN_FALHA`, `SEC_CONTA_BLOQUEADA`
  - `SEC_SENHA_ALTERADA`, `SEC_ACESSO_NEGADO`, `SEC_2FA_ATIVADO`
  - `SEC_AUDITORIA_MANUAL`
- [x] Campos: usuário, ação, entidade, descrição, IP, user-agent, nível
- [x] Filtros: busca, ação, entidade, nível, período
- [x] Estatísticas (info/warn/error, últimas 24h, 7d)
- [x] Limpeza automática de logs antigos (90 dias)

### 💾 Backup e Restauração

- [x] **Backup criptografado** com AES-256-GCM
- [x] Backup manual (salva em `backups/`)
- [x] Backup automático a cada **12 horas** (00:00 e 12:00)
- [x] Download de snapshot instantâneo (criptografado)
- [x] Rotação automática (mantém 20 backups)
- [x] Restauração com **descriptografia automática**
- [x] Backup de segurança antes de restaurar
- [x] Validação de integridade do SQLite

### ⚡ Tempo Real

- [x] WebSocket (Socket.IO) com autenticação JWT
- [x] Dashboard e listas atualizam automaticamente
- [x] Feed de eventos no super painel
- [x] Notificações de erro 500 em tempo real

### 🎨 Interface

- [x] Design responsivo (mobile-first)
- [x] **Cards no celular e tablet**, tabela no desktop
- [x] Tema claro/escuro persistente
- [x] Modais, toasts, badges coloridos, skeletons
- [x] Menu lateral em telas pequenas

### 🛡️ Segurança

- [x] **Helmet** com CSP customizada
- [x] **CORS restritivo** (lista de origens permitidas)
- [x] **Rate limiting** global + agressivo para login
- [x] **Slow down** progressivo em tentativas repetidas
- [x] **Validação com Zod** em todos os endpoints
- [x] **Validação de variáveis de ambiente** no boot
- [x] **Hash bcrypt** com rounds configuráveis
- [x] **Error handler** que não vaza stack em produção
- [x] **Path traversal protection** em uploads e downloads
- [x] **JWT com issuer** e tipos separados (access/refresh)

---

## 🛠️ Stack Tecnológica

### Backend

| Tecnologia | Uso |
|------------|-----|
| **Node.js 22+** | Runtime |
| **Express 4** | Framework HTTP |
| **node:sqlite** | Banco de dados nativo (sem compilação) |
| **jsonwebtoken** | Autenticação JWT |
| **bcryptjs** | Hash de senhas |
| **speakeasy** | Geração/validação de TOTP (2FA) |
| **qrcode** | QR Code do 2FA |
| **helmet** | Headers de segurança (CSP, HSTS, etc.) |
| **express-rate-limit** | Rate limiting |
| **express-slow-down** | Delay progressivo |
| **zod** | Validação de schemas |
| **socket.io** | WebSocket |
| **exceljs** | Geração de planilhas |
| **multer** | Upload de arquivos |
| **node-cron** | Agendador de backup |
| **dotenv** | Variáveis de ambiente |

### Frontend

| Tecnologia | Uso |
|------------|-----|
| **HTML5 + CSS3** | Estrutura e estilo |
| **JavaScript (Vanilla)** | Lógica do cliente |
| **Socket.IO Client** | Tempo real |
| **Chart.js** | Gráficos do dashboard e super painel |

### Testes

| Tecnologia | Uso |
|------------|-----|
| **Jest** | Test runner |
| **Supertest** | Testes de HTTP |

---

## 🚀 Instalação

### Pré-requisitos

- **Node.js 22 ou superior** ([download](https://nodejs.org/))
  - `node:sqlite` está estável a partir do Node 22.5+
- **npm 10+** (vem com o Node)
- Sistema operacional: Windows, Linux ou macOS

> ⚠️ **Não é necessário** instalar Python, Visual Studio Build Tools ou compiladores C++ — usamos o SQLite nativo do Node.

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/estoque-app.git
cd estoque-app

# 2. Instale as dependências
npm install

# 3. Copie o template de variáveis de ambiente
cp .env.example .env

# 4. Gere chaves seguras e cole no .env
node -e "const c=require('crypto');console.log('JWT_SECRET='+c.randomBytes(64).toString('hex'));console.log('BACKUP_ENCRYPTION_KEY='+c.randomBytes(32).toString('hex'));"

# 5. Inicie o servidor em modo desenvolvimento
npm run dev
```

Acesse **http://localhost:3000**

### 🔑 Credenciais padrão

| Campo | Valor |
|-------|-------|
| E-mail | `admin@estoque.com` |
| Senha | `admin123` |

> ⚠️ **Troque a senha do admin e ative o 2FA após o primeiro login!**

### Variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
# ==================== SERVIDOR ====================
NODE_ENV=development
PORT=3000

# ==================== SEGURANÇA ====================
# 🔑 Gere com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=sua-chave-com-128-caracteres-hex
JWT_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# 🔐 Chave de criptografia dos backups (32 bytes = 64 chars hex)
BACKUP_ENCRYPTION_KEY=sua-chave-com-64-caracteres-hex

# 🌐 CORS — lista separada por vírgula
CORS_ORIGINS=http://localhost:3000

# 🚦 Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5
AUTH_LOCKOUT_MINUTES=15
AUTH_MAX_ATTEMPTS=5

# ⏱️ Bcrypt
BCRYPT_ROUNDS=12
```

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `NODE_ENV` | `development` | Ambiente (`development`/`production`) |
| `PORT` | `3000` | Porta do servidor |
| `JWT_SECRET` | — | **Obrigatório**, mínimo 64 chars em produção |
| `JWT_EXPIRES` | `15m` | Expiração do access token |
| `JWT_REFRESH_EXPIRES` | `7d` | Expiração do refresh token |
| `BACKUP_ENCRYPTION_KEY` | — | **Obrigatório em produção**, 64 chars hex |
| `CORS_ORIGINS` | — | **Obrigatório em produção** |
| `AUTH_MAX_ATTEMPTS` | `5` | Tentativas antes do lockout |
| `AUTH_LOCKOUT_MINUTES` | `15` | Duração do bloqueio |
| `BCRYPT_ROUNDS` | `12` | Custo do hash (10-15) |

> 🛡️ O arquivo `src/config/env.js` **valida todas as variáveis no boot** e recusa iniciar se algo crítico estiver faltando em produção.

---

## 💻 Uso

### Comandos disponíveis

```bash
# Desenvolvimento (auto-reload)
npm run dev

# Produção
npm start

# Todos os testes
npm test

# Apenas testes de segurança
npm run test:security

# Testes em modo watch
npm run test:watch

# Testes com cobertura
npm run test:coverage

# Auditoria de dependências
npm run audit
```

### Fluxo típico

1. **Faça login** com `admin@estoque.com / admin123`
2. **Ative o 2FA** em `⚙️ Admin → 🔐 Segurança` (recomendado!)
3. **Crie categorias** em `Categorias`
4. **Cadastre produtos** em `Produtos` vinculando a uma categoria
5. **Registre movimentações** usando os botões `+` e `−`
6. **Monitore o dashboard** — atualiza em tempo real
7. **Gere relatórios** em `Relatórios → 📊 Exportar Excel`
8. **Gerencie usuários** em `⚙️ Admin`
9. **Audite ações** em `📜 Logs`
10. **Faça backups** em `⚙️ Admin → 📥 Salvar Backup` (criptografados)

### Níveis de acesso

| Papel | Vê no topbar | Permissões |
|-------|--------------|------------|
| **super** | + 👑 Super | Tudo + painel super-admin + auditoria |
| **admin** | + ⚙️ Admin + 📜 Logs | Gerenciar usuários, categorias, backups |
| **operador** | Básico | Criar/editar produtos, movimentar estoque |

---

## 📁 Estrutura do Projeto

```
estoque-app/
├── .env                       # Variáveis (não versionado)
├── .env.example               # Template
├── .gitignore
├── package.json
├── jest.config.js
├── README.md
├── MELHORIAS.md
├── estoque.db                 # Banco (criado em runtime)
│
├── backups/                   # Backups criptografados
│   └── .gitkeep
│
├── tmp/                       # Uploads temporários
│
├── docs/
│   └── screenshots/
│
├── src/
│   ├── server.js              # Entry point (Express + Socket.IO)
│   ├── server-test.js         # Exporta app para testes
│   │
│   ├── config/
│   │   ├── database.js        # Conexão + tabelas + migrações + seed
│   │   ├── env.js             # 🛡️ Validação de variáveis
│   │   └── sqliteShim.js      # Wrapper node:sqlite
│   │
│   ├── middlewares/
│   │   ├── auth.js            # JWT + papéis
│   │   ├── errorHandler.js    # Tratamento centralizado
│   │   ├── security.js        # 🛡️ Helmet + CORS + Rate limit
│   │   └── validate.js        # 🛡️ Schemas Zod
│   │
│   ├── models/
│   │   └── Produto.js
│   │
│   ├── repositories/
│   │   ├── usuarioRepository.js
│   │   ├── categoriaRepository.js
│   │   ├── produtoRepository.js
│   │   ├── movimentacaoRepository.js
│   │   └── logRepository.js
│   │
│   ├── services/
│   │   ├── authService.js
│   │   ├── usuarioService.js
│   │   ├── categoriaService.js
│   │   ├── estoqueService.js
│   │   ├── movimentacaoService.js
│   │   ├── relatorioService.js
│   │   ├── excelService.js
│   │   ├── logService.js
│   │   ├── realtimeService.js
│   │   ├── backupService.js           # 💾 Backup criptografado
│   │   ├── backupCryptoService.js     # 🔐 AES-256-GCM
│   │   ├── restoreService.js          # Restauração
│   │   ├── passwordService.js         # 🛡️ Política de senha
│   │   ├── securityLogService.js      # 📜 Eventos SEC_*
│   │   ├── totpService.js             # 🔐 2FA (TOTP)
│   │   └── metricsService.js          # 👑 Métricas do super painel
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── categoriaController.js
│   │   ├── produtoController.js
│   │   ├── movimentacaoController.js
│   │   ├── relatorioController.js
│   │   ├── backupController.js
│   │   ├── logController.js
│   │   └── superAdminController.js    # 👑
│   │
│   ├── routes/
│   │   ├── index.js
│   │   ├── authRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── categoriaRoutes.js
│   │   ├── produtoRoutes.js
│   │   ├── movimentacaoRoutes.js
│   │   ├── relatorioRoutes.js
│   │   ├── logRoutes.js
│   │   └── superAdminRoutes.js        # 👑
│   │
│   └── jobs/
│       └── backupJob.js       # Cron (12h)
│
├── public/
│   ├── index.html             # Login
│   ├── dashboard.html
│   ├── produtos.html
│   ├── categorias.html
│   ├── movimentacoes.html
│   ├── relatorios.html
│   ├── admin.html
│   ├── logs.html
│   ├── super-admin.html       # 👑
│   │
│   ├── css/
│   │   ├── style.css
│   │   └── super-admin.css
│   │
│   └── js/
│       ├── app.js             # Auth + API + UI + Format + Socket
│       ├── login.js
│       ├── dashboard.js
│       ├── produtos.js
│       ├── categorias.js
│       ├── movimentacoes.js
│       ├── relatorios.js
│       ├── admin.js
│       ├── logs.js
│       └── super-admin.js
│
└── tests/
    ├── auth.test.js
    ├── produtos.test.js
    ├── categorias.test.js
    ├── movimentacoes.test.js
    ├── admin.test.js
    ├── relatorios.test.js
    │
    └── security/
        ├── setup.js
        ├── helpers.js
        ├── 01-headers.test.js
        ├── 02-cors.test.js
        ├── 03-rate-limit.test.js
        ├── 04-password-policy.test.js
        ├── 05-zod-validation.test.js
        ├── 06-account-lockout.test.js
        ├── 07-jwt-expiration.test.js
        ├── 08-2fa.test.js
        ├── 09-backup-encryption.test.js
        ├── 10-security-logs.test.js
        └── 11-error-handler.test.js
```

---

## 🔌 API

Base URL: `http://localhost:3000/api`

Todos os endpoints (exceto `/auth/login`, `/auth/registrar`, `/auth/refresh` e `/health`) exigem `Authorization: Bearer <token>`.

### 🔐 Autenticação

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `POST` | `/auth/registrar` | Cadastra novo usuário | ❌ |
| `POST` | `/auth/login` | Login (retorna JWT + refresh) | ❌ |
| `POST` | `/auth/refresh` | Renova access token | ❌ |
| `GET` | `/auth/me` | Dados do usuário logado | ✅ |
| `POST` | `/auth/logout` | Registra logout | ✅ |
| `POST` | `/auth/trocar-senha` | Troca a própria senha | ✅ |
| `POST` | `/auth/2fa/iniciar` | Inicia setup do 2FA (retorna QR) | ✅ |
| `POST` | `/auth/2fa/confirmar` | Ativa 2FA com código TOTP | ✅ |
| `POST` | `/auth/2fa/desativar` | Desativa 2FA (exige senha) | ✅ |

**Exemplo de login com 2FA:**

```bash
# 1. Login inicial (sem código 2FA)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@estoque.com","senha":"admin123"}'

# Se 2FA está ativo, retorna: {"requer2FA": true}

# 2. Login com código 2FA (6 dígitos do app autenticador)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@estoque.com","senha":"admin123","codigo2fa":"123456"}'
```

### 📦 Produtos

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `GET` | `/produtos` | Lista paginada com filtros | ✅ |
| `GET` | `/produtos/:id` | Busca por ID | ✅ |
| `POST` | `/produtos` | Cria produto | ✅ |
| `PUT` | `/produtos/:id` | Atualiza produto | ✅ Admin |
| `DELETE` | `/produtos/:id` | Move para lixeira | ✅ Admin |
| `PATCH` | `/produtos/:id/entrada` | Registra entrada | ✅ |
| `PATCH` | `/produtos/:id/saida` | Registra saída | ✅ |
| `PATCH` | `/produtos/:id/ajuste` | Ajusta quantidade | ✅ |
| `GET` | `/produtos/lixeira` | Lista produtos deletados | ✅ |
| `GET` | `/produtos/lixeira/count` | Contagem para badge | ✅ |
| `POST` | `/produtos/:id/restaurar` | Restaura da lixeira | ✅ Admin |
| `POST` | `/produtos/lixeira/esvaziar` | Esvazia lixeira | ✅ Admin |

**Query params** (GET `/produtos`):
- `busca`, `categoria_id`, `estoque_baixo`, `apenas_ativos`
- `ordenar` (`id`|`nome`|`preco`|`quantidade`), `ordem` (`asc`|`desc`)
- `pagina`, `limite`

### 🏷️ Categorias

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `GET` | `/categorias` | Lista todas | ✅ |
| `POST` | `/categorias` | Cria | ✅ Admin |
| `PUT` | `/categorias/:id` | Atualiza | ✅ Admin |
| `DELETE` | `/categorias/:id` | Remove | ✅ Admin |

### 🔄 Movimentações

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `GET` | `/movimentacoes` | Histórico paginado | ✅ |

**Query params:** `tipo`, `produto_id`, `data_inicio`, `data_fim`, `pagina`, `limite`

### 📈 Relatórios

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `GET` | `/relatorios/dashboard` | KPIs + gráficos + alertas | ✅ |
| `GET` | `/relatorios/movimentacoes` | Resumo por período | ✅ |
| `GET` | `/relatorios/exportar-excel` | Download do `.xlsx` | ✅ |

### ⚙️ Admin

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `GET` | `/admin/estatisticas` | Contadores gerais | ✅ Admin |
| `GET` | `/admin/usuarios` | Lista paginada | ✅ Admin |
| `POST` | `/admin/usuarios` | Cria usuário | ✅ Admin |
| `PUT` | `/admin/usuarios/:id` | Atualiza usuário | ✅ Admin |
| `DELETE` | `/admin/usuarios/:id` | Remove usuário | ✅ Admin |
| `PATCH` | `/admin/usuarios/:id/senha` | Reset de senha | ✅ Admin |
| `GET` | `/admin/backup/info` | Metadados do banco | ✅ Admin |
| `GET` | `/admin/backup/lista` | Lista backups salvos | ✅ Admin |
| `GET` | `/admin/backup` | Download snapshot (criptografado) | ✅ Admin |
| `POST` | `/admin/backup/criar` | Salva em `backups/` | ✅ Admin |
| `GET` | `/admin/backup/:nome/baixar` | Download específico | ✅ Admin |
| `DELETE` | `/admin/backup/:nome` | Remove backup | ✅ Admin |
| `POST` | `/admin/restore/validar` | Valida upload (detecta cifrado) | ✅ Admin |
| `POST` | `/admin/restore` | Restaura (descriptografa auto) | ✅ Admin |

### 👑 Super-Admin

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `GET` | `/super-admin/metricas` | CPU, memória, requisições | ✅ Super |
| `GET` | `/super-admin/alertas` | Alertas ativos | ✅ Super |
| `GET` | `/super-admin/auditoria` | Estatísticas de segurança | ✅ Super |
| `GET` | `/super-admin/eventos` | Feed de eventos (últimos 50) | ✅ Super |
| `POST` | `/super-admin/auditar` | Executa auditoria completa | ✅ Super |

### 📜 Logs

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `GET` | `/logs` | Lista paginada | ✅ Admin |
| `GET` | `/logs/estatisticas` | Contadores por nível | ✅ Admin |
| `GET` | `/logs/filtros` | Ações e entidades distintas | ✅ Admin |
| `DELETE` | `/logs/limpar?dias=90` | Remove logs antigos | ✅ Admin |

### ❤️ Health Check

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `GET` | `/health` | Status do servidor | ❌ |

### ⚡ WebSocket

Conecta via `io({ auth: { token } })`. Eventos emitidos:

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `produto:criado` | `Produto` | Novo produto cadastrado |
| `produto:atualizado` | `Produto` | Produto editado |
| `produto:removido` | `{ id }` | Produto removido |
| `produto:movimentado` | `{ id, tipo, quantidade, atual }` | Entrada/saída/ajuste |
| `movimentacao:criada` | `{ produto_id }` | Nova movimentação |
| `categoria:criada` | `Categoria` | Nova categoria |
| `categoria:atualizada` | `Categoria` | Categoria editada |
| `categoria:removida` | `{ id }` | Categoria removida |
| `sistema:evento` | `LogEvento` | Novo log de sistema |
| `sistema:erro` | `{ metodo, path, mensagem }` | Erro 500 em produção |

---

## 🏗️ Arquitetura

O projeto segue o padrão **MVC + Repository**, com separação clara em camadas:

```
┌─────────────────────────────────────────────────┐
│  VIEW (HTML + CSS + JS)                         │  ← Navegador
├─────────────────────────────────────────────────┤
│  ROUTES (Express Router)                        │
├─────────────────────────────────────────────────┤
│  MIDDLEWARES (auth, security, validate)         │  ← 🛡️ Segurança
├─────────────────────────────────────────────────┤
│  CONTROLLERS (HTTP ↔ Service)                   │
├─────────────────────────────────────────────────┤
│  SERVICES (regras de negócio)                   │
├─────────────────────────────────────────────────┤
│  REPOSITORIES (SQL puro)                        │
├─────────────────────────────────────────────────┤
│  DATABASE (node:sqlite)                         │
└─────────────────────────────────────────────────┘
```

### Regras de dependência

- ✅ **Cada camada só conhece a imediatamente inferior**
- ✅ **SQL apenas em Repositories**
- ✅ **Regras de negócio apenas em Services**
- ✅ **Controllers só traduzem HTTP ↔ Service**
- ✅ **Validações de entrada no middleware `validate.js` (Zod)**
- ✅ **Validações de negócio no Service**

### Pipeline de segurança

```
Requisição HTTP
      ↓
[Helmet] ──── Headers de segurança (CSP, HSTS, etc.)
      ↓
[CORS] ────── Origem permitida?
      ↓
[Rate Limit] ─ Muitas requisições?
      ↓
[Body Parser] ─ Limite de payload (100kb)
      ↓
[Auth] ────── Token JWT válido? Conta ativa? Não bloqueada?
      ↓
[Validação Zod] ─ Schema dos dados correto?
      ↓
[Controller → Service → Repository]
      ↓
Resposta
```

---

## 🔒 Segurança

### Camadas implementadas

| Camada | Proteção | Arquivo |
|--------|----------|---------|
| **Headers** | Helmet + CSP + HSTS + X-Frame-Options | `middlewares/security.js` |
| **CORS** | Lista de origens permitidas | `middlewares/security.js` |
| **Rate limit global** | 100 req/15min por IP | `middlewares/security.js` |
| **Rate limit login** | 5 tentativas/15min por IP+email | `middlewares/security.js` |
| **Slow down** | Delay progressivo após 3 reqs | `middlewares/security.js` |
| **Senhas** | bcrypt com 12 rounds | `services/authService.js` |
| **Política de senha** | 8+ chars, maiúscula, número, especial, blacklist | `services/passwordService.js` |
| **Account lockout** | Bloqueia 15min após 5 falhas | `services/authService.js` |
| **2FA** | TOTP (Google Auth, Authy) | `services/totpService.js` |
| **JWT** | Issuer + access/refresh separados | `services/authService.js` |
| **Conta ativa** | Verificada em cada request | `middlewares/auth.js` |
| **Validação** | Zod com mensagens detalhadas | `middlewares/validate.js` |
| **Env** | Validação com fail-fast | `config/env.js` |
| **Backups** | AES-256-GCM com auth tag | `services/backupCryptoService.js` |
| **Uploads** | Multer com limite + extensão | `controllers/backupController.js` |
| **Path traversal** | `path.basename()` | `services/backupService.js` |
| **SQL injection** | Statements preparados | Todos repositories |
| **XSS** | Escape em todo output HTML | Todos os JS frontend |
| **Error handler** | Não vaza stack em produção | `middlewares/errorHandler.js` |
| **Auditoria** | Eventos `SEC_*` para ações sensíveis | `services/securityLogService.js` |

### Recomendações para produção

- [ ] Definir `JWT_SECRET` forte (128 chars hex)
- [ ] Definir `BACKUP_ENCRYPTION_KEY` (64 chars hex) **e guardar em cofre**
- [ ] Usar HTTPS (nginx / Cloudflare / Let's Encrypt)
- [ ] Configurar `CORS_ORIGINS` com domínios reais
- [ ] Ativar 2FA para todos os admins e supers
- [ ] Rodar atrás de reverse proxy com `trust proxy`
- [ ] Monitoramento de erros (Sentry, Bugsnag)
- [ ] Backup do `.env` em gerenciador de segredos
- [ ] `npm audit` periódico
- [ ] Ativar logs estruturados

### ⚠️ Recuperação de senha do admin

Se perder a senha do admin, rode na raiz:

```bash
node -e "
const bcrypt = require('bcryptjs');
const db = require('./src/config/sqliteShim');
const d = new db('./estoque.db');
const hash = bcrypt.hashSync('NovaSenha@Forte2024', 12);
d.prepare('UPDATE usuarios SET senha_hash = ?, tentativas_falhas = 0, bloqueado_ate = NULL WHERE email = ?').run(hash, 'admin@estoque.com');
console.log('✅ Senha redefinida');
d.close();
"
```

---

## 💾 Backup e Restauração

### Backup automático

- **Agenda:** a cada 12 horas (00:00 e 12:00)
- **Local:** pasta `backups/`
- **Nome:** `estoque-auto-YYYY-MM-DD-HH-MM-SS.db.cifrado`
- **Criptografia:** AES-256-GCM
- **Rotação:** mantém 20 backups automáticos

### Backup manual

- Interface: **⚙️ Admin → 📥 Salvar Backup**
- API: `POST /api/admin/backup/criar`
- Nome: `estoque-manual-YYYY-MM-DD-HH-MM-SS.db.cifrado`
- **Nunca** são removidos pela rotação

### Download

- Interface: **⚙️ Admin → ⬇ Baixar Agora**
- API: `GET /api/admin/backup`
- Usa `VACUUM INTO` — snapshot **atômico e consistente**

### Restauração

- Interface: **⚙️ Admin → ⬆ Restaurar**
- Aceita `.db` **ou** `.db.cifrado` (descriptografa automaticamente)
- Processo:
  1. Upload do arquivo
  2. Validação (integridade SQLite + tabelas obrigatórias)
  3. **Backup de segurança** automático
  4. Substituição transacional
  5. Ajuste dos autoincrementos
  6. Logout forçado

### Formato do arquivo cifrado

```
[MAGIC: "ESBK" 4B] [IV: 12B] [AUTH_TAG: 16B] [CIPHERTEXT: variável]
```

- **MAGIC** — identifica que é um backup criptografado
- **IV** — vetor de inicialização aleatório por arquivo
- **AUTH_TAG** — previne adulteração (GCM)
- **CIPHERTEXT** — banco SQLite criptografado

---

## 🧪 Testes

### Executar

```bash
npm test                    # Todos
npm run test:security       # Apenas segurança
npm run test:watch          # Watch mode
npm run test:coverage       # Com cobertura
```

### Cobertura atual

```
Test Suites: 17 passed, 17 total
Tests:       80+ passed
Time:        ~20s
```

### Suítes funcionais (originais)

| Suíte | Testes | Cobre |
|-------|--------|-------|
| `auth.test.js` | 5 | Registro, login, JWT, 401 |
| `produtos.test.js` | 6 | CRUD, validações, movimentações |
| `categorias.test.js` | 4 | CRUD completo |
| `movimentacoes.test.js` | 2 | Auditoria automática |
| `admin.test.js` | 5 | Permissões, proteções |
| `relatorios.test.js` | 3 | Dashboard, Excel, logs |

### Suítes de segurança

| Suíte | Testes | Cobre |
|-------|--------|-------|
| `01-headers.test.js` | 6 | Helmet, CSP, X-Frame-Options |
| `02-cors.test.js` | 3 | Origens permitidas/bloqueadas |
| `03-rate-limit.test.js` | 2 | Limite global + auth |
| `04-password-policy.test.js` | 8 | Regras de senha forte |
| `05-zod-validation.test.js` | 6 | Rejeição de dados inválidos |
| `06-account-lockout.test.js` | 3 | Bloqueio após N falhas |
| `07-jwt-expiration.test.js` | 6 | Expiração, refresh, assinatura |
| `08-2fa.test.js` | 7 | Setup, confirmação, login 2FA |
| `09-backup-encryption.test.js` | 7 | Criptografia AES-256-GCM |
| `10-security-logs.test.js` | 4 | Eventos `SEC_*` |
| `11-error-handler.test.js` | 3 | Não vaza stack em prod |

### Estratégia

- **Banco em memória** (`:memory:`) — sem I/O, sem lock, testes rápidos
- **Supertest** para simular requisições HTTP reais
- **`server-test.js`** exporta o app sem iniciar servidor nem cron
- **Isolamento por suíte** — cada uma limpa o banco no `afterAll`
- **Env dedicado** para testes (chaves sintéticas, rounds menores)

---

## 🗺️ Roadmap

### Concluído ✅

- [x] Autenticação JWT + refresh token
- [x] 2FA (TOTP) com QR Code
- [x] Política de senha forte
- [x] Account lockout
- [x] Helmet + CSP customizada
- [x] CORS restritivo
- [x] Rate limiting global e por rota
- [x] Validação Zod em todos os endpoints
- [x] Validação de variáveis de ambiente
- [x] Backup criptografado AES-256-GCM
- [x] CRUD de produtos com soft delete
- [x] CRUD de categorias e usuários
- [x] Movimentações com auditoria automática
- [x] Dashboard com gráficos (Chart.js)
- [x] Relatórios em Excel (6 abas)
- [x] Backup automático + restauração
- [x] Log de atividades global
- [x] WebSocket para tempo real
- [x] **Painel Super-Admin** com métricas e alertas
- [x] **Logs de segurança** (`SEC_*`)
- [x] **80+ testes automatizados**

### Futuro 🔮

- [ ] 🐳 Docker + docker-compose
- [ ] 🚀 CI/CD com GitHub Actions
- [ ] 📱 PWA (offline + instalável)
- [ ] 🔔 Notificações push no navegador
- [ ] 📧 E-mail em falha de backup ou estoque baixo
- [ ] 🏷️ Leitor de código de barras com câmera
- [ ] 📊 Gráficos nativos dentro do Excel
- [ ] 🌍 Internacionalização (i18n)
- [ ] 🔍 Busca fuzzy (FTS5)
- [ ] 📉 Relatório de previsão de consumo
- [ ] 📥 Import de CSV de produtos
- [ ] 🔑 Login social (OAuth2)
- [ ] 🌐 HTTPS com certificado automático (Let's Encrypt)

---

## 🤝 Contribuindo

Contribuições são bem-vindas!

1. **Fork** o projeto
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit: `git commit -m 'feat: adiciona X'`
4. Push: `git push origin feature/minha-feature`
5. Abra um **Pull Request**

### Padrões

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/pt-br/)
  - `feat:` nova funcionalidade
  - `fix:` correção
  - `docs:` documentação
  - `test:` testes
  - `refactor:` refatoração
  - `chore:` manutenção
- **Código:** sempre rode `npm test` antes do PR
- **Segurança:** nunca comite `.env` nem `estoque.db`

### Reportar bugs

Abra uma [issue](https://github.com/seu-usuario/estoque-app/issues) com:
- Descrição clara
- Passos para reproduzir
- Comportamento esperado vs. observado
- Screenshots (se aplicável)
- Versão do Node e SO

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja [LICENSE](LICENSE) para detalhes.

---

## 👏 Agradecimentos

- [Node.js](https://nodejs.org/) — API `node:sqlite` nativa
- [Express](https://expressjs.com/) — framework web
- [Helmet](https://helmetjs.github.io/) — headers de segurança
- [Socket.IO](https://socket.io/) — tempo real
- [Chart.js](https://www.chartjs.org/) — gráficos
- [ExcelJS](https://github.com/exceljs/exceljs) — planilhas
- [Speakeasy](https://github.com/speakeasyjs/speakeasy) — TOTP
- [Zod](https://zod.dev/) — validação
- [Jest](https://jestjs.io/) + [Supertest](https://github.com/ladjs/supertest) — testes

---

## 📞 Contato

- **Autor:** Seu Nome
- **E-mail:** seu@email.com
- **GitHub:** [@seu-usuario](https://github.com/seu-usuario)

---

<div align="center">

**⭐ Se este projeto foi útil, deixe uma estrela!**

Feito com ☕ e 💙

</div>
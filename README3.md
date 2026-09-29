📦 Sistema de Estoque
<div align="center">

https://img.shields.io/badge/Node.js-22%2B-339933?logo=node.js&logoColor=white
https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white
https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white
https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white
https://img.shields.io/badge/Jest-29.x-C21325?logo=jest&logoColor=white
https://img.shields.io/badge/Helmet-7.x-000000?logo=helmet&logoColor=white
https://img.shields.io/badge/2FA-TOTP-success
https://img.shields.io/badge/license-MIT-blue.svg
https://img.shields.io/badge/tests-80%20passing-brightgreen.svg
https://img.shields.io/badge/suites-18%20passing-brightgreen.svg
https://img.shields.io/badge/roles-3%20n%C3%ADveis-blueviolet.svg

Sistema web completo de controle de estoque com autenticação JWT, 2FA, auditoria, backup criptografado, tempo real, relatórios em Excel, painel super-admin com métricas e hierarquia de 3 níveis de acesso.

Funcionalidades • Instalação • Uso • API • Arquitetura • Segurança • Testes
</div>
📋 Sumário

    Sobre

    Funcionalidades

    Stack Tecnológica

    Instalação

    Uso

    Estrutura do Projeto

    API

    Arquitetura

    Segurança

    Backup e Restauração

    Testes

    Roadmap

    Contribuindo

    Licença

🎯 Sobre

Sistema web completo para gerenciamento de estoque com foco em pequenas e médias empresas. Oferece controle total sobre produtos, categorias, movimentações e usuários, com auditoria automática, backup criptografado, autenticação em dois fatores, relatórios profissionais e hierarquia de permissões em 3 níveis.

Principais diferenciais:

    🔐 Autenticação JWT + 2FA (TOTP) com 3 níveis de acesso (super_admin, admin, operador)

    👑 Painel Super-Admin com métricas de CPU/memória, auditoria, alertas e feed em tempo real

    🛡️ Hardening de segurança — Helmet, CSP, rate limiting, account lockout, política de senha forte

    ⚡ Atualização em tempo real via WebSocket

    📜 Log de atividades global com eventos de segurança (SEC_*)

    📊 Relatórios em página (impressão PDF) ou Excel corporativo com 6 abas

    💾 Backup AES-256-GCM com restauração de 1 clique

    🎨 Interface responsiva com tema claro/escuro (mobile-first)

    🧪 80 testes automatizados passando (7 suítes funcionais + 11 de segurança)

✨ Funcionalidades
🔐 Autenticação e Autorização

    ☑

    Login com JWT (access + refresh token)
    ☑

    Senhas com hash bcrypt (rounds configuráveis)
    ☑

    Autenticação em dois fatores (TOTP) — compatível com Google Authenticator, Authy, 1Password
    ☑

    Hierarquia de 3 papéis: super_admin > admin > operador
    ☑

    Account lockout após N tentativas falhas (bloqueio temporário)
    ☑

    Política de senha forte (comprimento, complexidade, blacklist)
    ☑

    Troca de senha exigindo senha atual
    ☑

    Reset de senha por admin
    ☑

    Ativar/desativar contas sem perder histórico
    ☑

    🆕 Proteção de super-admin — admin NUNCA pode editar/remover/resetar senha de super-admin
    ☑

    🆕 Proteção do último super-admin — ninguém pode remover ou rebaixar o último super-admin ativo
    ☑

    🆕 Proteção do último admin — não remove/rebaixa o último admin ativo
    ☑

    🆕 Log de ações negadas (SEC_ACAO_NEGADA) para auditoria
    ☑

    Refresh token com expiração separada

📦 Gestão de Produtos

    ☑

    CRUD completo com validações (Zod)
    ☑

    SKU único, descrição, preço, estoque mínimo
    ☑

    Categoria opcional
    ☑

    Status ativo/inativo
    ☑

    Soft delete com lixeira recuperável
    ☑

    🆕 Busca com ranking por relevância (nome > SKU > descrição)
    ☑

    Filtros por categoria, estoque baixo e status
    ☑

    Ordenação por coluna (nome, preço, quantidade, ID)
    ☑

    Paginação server-side
    ☑

    Export CSV
    ☑

    Formatação automática (título preservando siglas: SSD, USB, HDMI)

🏷️ Categorias

    ☑

    CRUD completo
    ☑

    Contagem de produtos por categoria
    ☑

    Remoção não afeta produtos (ficam sem categoria)

🔄 Movimentações

    ☑

    Entrada (+), saída (−) e ajuste de estoque
    ☑

    Auditoria automática de toda operação
    ☑

    Histórico paginado com filtros (tipo, período)
    ☑

    Colunas antes/depois para rastrear variação
    ☑

    Snapshot do nome do produto (preserva histórico mesmo após exclusão)
    ☑

    Não permite saída maior que o estoque

📊 Dashboard

    ☑

    5 KPIs em tempo real (produtos, itens, valor, baixo, zerado)
    ☑

    Gráfico de rosca — produtos por categoria
    ☑

    Gráfico de barras — top 10 produtos por valor
    ☑

    Tabela de alertas de estoque baixo
    ☑

    🆕 Acessível a todos os usuários (operador, admin, super-admin)

📈 Relatórios

    ☑

    🆕 Relatório em página dedicada (relatorio.html)

        Visualiza o conteúdo antes de salvar

        Botão "🖨️ Imprimir / Salvar PDF" (usa impressão nativa do navegador, formatação A4)

        Botão "📊 Salvar Excel" (mesmo .xlsx de 6 abas)

        Layout responsivo (tabela em desktop, cards em mobile)
    ☑

    Export Excel corporativo com 6 abas:

        Resumo Executivo (KPIs + distribuições)

        Produtos (lista completa com formatação)

        Movimentações (histórico do período)

        Top Produtos (ranking com medalhas)

        Estoque Baixo (alertas + ações sugeridas)

        Gráficos (dados organizados para chart nativo)
    ☑

    Export CSV simples
    ☑

    Filtro por período

👑 Painel Super-Admin

    ☑

    Acesso restrito ao papel super_admin
    ☑

    KPIs em tempo real: uptime, memória (RSS/Heap), requisições (1/5/15min), erros 500, WebSocket, tempo médio, banco
    ☑

    Gráfico de CPU (load average, atualiza a cada 10s)
    ☑

    Gráfico de memória (RSS + Heap, histórico de ~15min)
    ☑

    Alertas automáticos:

        Muitos logins falhos (10+/hora → aviso, 20+ → crítico)

        Contas bloqueadas ativas

        Produtos sem estoque

        Erros 500 na última hora

        Backup atrasado (>24h sem backup automático)

        Memória do processo elevada (>500MB)
    ☑

    Feed de eventos em tempo real via WebSocket
    ☑

    Auditoria de segurança sob demanda (2FA pendente, senhas antigas, admins inativos)
    ☑

    Estatísticas agregadas (usuários, logs, produtos na lixeira, acessos negados)
    ☑

    Toast em tempo real quando ocorre erro 500 no servidor

📜 Log de Atividades

    ☑

    Registro automático de todas as ações críticas
    ☑

    Logs de segurança com prefixo SEC_*:

        SEC_LOGIN_SUCESSO, SEC_LOGIN_FALHA, SEC_CONTA_BLOQUEADA

        SEC_SENHA_ALTERADA, SEC_ACESSO_NEGADO, SEC_2FA_ATIVADO

        SEC_2FA_FALHA, SEC_AUDITORIA_MANUAL

        🆕 SEC_ACAO_NEGADA — tentativas de admin sobre super-admin
    ☑

    Campos: usuário, ação, entidade, descrição, IP, user-agent, nível
    ☑

    Filtros: busca, ação, entidade, nível, período
    ☑

    Estatísticas (info/warn/error, últimas 24h, 7d)
    ☑

    Limpeza automática de logs antigos (90 dias)

💾 Backup e Restauração

    ☑

    Backup criptografado com AES-256-GCM
    ☑

    Backup manual (salva em backups/)
    ☑

    Backup automático a cada 12 horas (00:00 e 12:00)
    ☑

    Download de snapshot instantâneo (criptografado)
    ☑

    Rotação automática (mantém 20 backups)
    ☑

    Restauração com descriptografia automática
    ☑

    Backup de segurança antes de restaurar
    ☑

    Validação de integridade do SQLite

⚡ Tempo Real

    ☑

    WebSocket (Socket.IO) com autenticação JWT
    ☑

    Dashboard e listas atualizam automaticamente
    ☑

    🆕 Feed de eventos no super painel (sistema:evento)
    ☑

    🆕 Notificações de erro 500 em tempo real (sistema:erro)

🎨 Interface

    ☑

    Design responsivo (mobile-first)
    ☑

    Cards no celular e tablet, tabela no desktop
    ☑

    Tema claro/escuro persistente
    ☑

    Modais, toasts, badges coloridos, skeletons
    ☑

    Menu lateral em telas pequenas
    ☑

    🆕 Busca com debounce (350ms) e preservação de estado

🛡️ Segurança

    ☑

    Helmet com CSP customizada
    ☑

    CORS restritivo (lista de origens permitidas)
    ☑

    Rate limiting global + agressivo para login
    ☑

    Slow down progressivo em tentativas repetidas
    ☑

    Validação com Zod em todos os endpoints
    ☑

    Validação de variáveis de ambiente no boot
    ☑

    Hash bcrypt com rounds configuráveis
    ☑

    Error handler que não vaza stack em produção
    ☑

    Path traversal protection em uploads e downloads
    ☑

    JWT com issuer e tipos separados (access/refresh)
    ☑

    🆕 Hierarquia de papéis com temNivel() centralizado
    ☑

    🆕 Bloqueio de super-admin por admin no service
    ☑

    🆕 Auditoria de ações negadas em log de segurança

🛠️ Stack Tecnológica
Backend
Tecnologia	Uso
Node.js 22+	Runtime
Express 4	Framework HTTP
node:sqlite	Banco de dados nativo (sem compilação)
jsonwebtoken	Autenticação JWT
bcryptjs	Hash de senhas
speakeasy	Geração/validação de TOTP (2FA)
qrcode	QR Code do 2FA
helmet	Headers de segurança (CSP, HSTS, etc.)
express-rate-limit	Rate limiting
express-slow-down	Delay progressivo
zod	Validação de schemas
socket.io	WebSocket
exceljs	Geração de planilhas
multer	Upload de arquivos
node-cron	Agendador de backup
dotenv	Variáveis de ambiente
Frontend
Tecnologia	Uso
HTML5 + CSS3	Estrutura e estilo
JavaScript (Vanilla)	Lógica do cliente
Socket.IO Client	Tempo real
Chart.js	Gráficos do dashboard e super painel
Testes
Tecnologia	Uso
Jest	Test runner
Supertest	Testes de HTTP
🚀 Instalação
Pré-requisitos

    Node.js 22 ou superior (download)

        node:sqlite está estável a partir do Node 22.5+

    npm 10+ (vem com o Node)

    Sistema operacional: Windows, Linux ou macOS

    ⚠️ Não é necessário instalar Python, Visual Studio Build Tools ou compiladores C++ — usamos o SQLite nativo do Node.

Passo a passo
bash

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

Acesse http://localhost:3000
🔑 Credenciais padrão
Papel	E-mail	Senha	Acesso
👑 Super-admin	dev@estoque.com	dev12345	Tudo + painel dev + auditoria
🛡️ Admin	admin@estoque.com	admin123	+ Admin, Logs, Relatórios
👤 Operador	(criar em Admin)	(forte)	Básico

    ⚠️ Em produção, defina ADMIN_PASSWORD e SUPER_ADMIN_PASSWORD no .env antes de subir.

Variáveis de ambiente

Crie um arquivo .env na raiz:
env

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

# ==================== USUÁRIOS PADRÃO ====================
ADMIN_EMAIL=admin@estoque.com
ADMIN_PASSWORD=trocar-em-producao
ADMIN_NOME=Administrador

SUPER_ADMIN_EMAIL=dev@estoque.com
SUPER_ADMIN_PASSWORD=trocar-em-producao
SUPER_ADMIN_NOME=Desenvolvedor

Variável	Padrão	Descrição
NODE_ENV	development	Ambiente (development/production)
PORT	3000	Porta do servidor
JWT_SECRET	—	Obrigatório, mínimo 64 chars em produção
JWT_EXPIRES	15m	Expiração do access token
JWT_REFRESH_EXPIRES	7d	Expiração do refresh token
BACKUP_ENCRYPTION_KEY	—	Obrigatório em produção, 64 chars hex
CORS_ORIGINS	—	Obrigatório em produção
AUTH_MAX_ATTEMPTS	5	Tentativas antes do lockout
AUTH_LOCKOUT_MINUTES	15	Duração do bloqueio
BCRYPT_ROUNDS	12	Custo do hash (10-15)
ADMIN_EMAIL	admin@estoque.com	E-mail do admin criado no primeiro boot
ADMIN_PASSWORD	admin123	Senha do admin (trocar em produção)
SUPER_ADMIN_EMAIL	dev@estoque.com	E-mail do super-admin (dev)
SUPER_ADMIN_PASSWORD	dev12345	Senha do super-admin

    🛡️ O arquivo src/config/env.js valida todas as variáveis no boot e recusa iniciar se algo crítico estiver faltando em produção.

💻 Uso
Comandos disponíveis
bash

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

Fluxo típico

    Faça login com admin@estoque.com / admin123

    Ative o 2FA em ⚙️ Admin → 🔐 Segurança (recomendado!)

    Crie categorias em Categorias

    Cadastre produtos em Produtos vinculando a uma categoria

    Registre movimentações usando os botões + e −

    Monitore o dashboard — atualiza em tempo real

    Gere relatórios em Relatórios → 📄 Ver Relatório Completo (imprime em PDF ou salva Excel)

    Gerencie usuários em ⚙️ Admin

    Audite ações em 📜 Logs

    Faça backups em ⚙️ Admin → 📥 Salvar Backup (criptografados)

    Como super-admin, acesse 👑 Super para métricas, auditoria e alertas em tempo real

Níveis de acesso
Papel	Vê no topbar	Permissões
👑 super_admin	+ 👑 Super	Irrestrito + painel dev + auditoria + alertas em tempo real
🛡️ admin	+ ⚙️ Admin + 📜 Logs + 📈 Relatórios	Gerenciar usuários, categorias, backups, ver logs, gerar relatórios
👤 operador	Básico	Dashboard, Produtos, Categorias, Movimentações
📊 Matriz de permissões
Recurso	👤 Operador	🛡️ Admin	👑 Super
Dashboard	✅	✅	✅
Produtos (ver/criar)	✅	✅	✅
Produtos (editar/remover)	❌	✅	✅
Categorias	✅ ver	✅ CRUD	✅ CRUD
Movimentações	✅	✅	✅
Relatórios	❌	✅	✅
Painel Admin (usuários)	❌	✅	✅
Logs de sistema	❌	✅	✅
Backup/Restore	❌	✅	✅
Editar/remover super-admin	❌	❌	✅
Painel Super (métricas)	❌	❌	✅
Auditoria de segurança	❌	❌	✅
Feed de eventos em tempo real	❌	❌	✅

    🔒 Admin NÃO pode editar, remover ou resetar senha de super-admin.
    🔒 Ninguém (nem super-admin) pode remover o último super-admin ativo.

📁 Estrutura do Projeto
text

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
│   │   ├── auth.js            # JWT + papéis + hierarquia
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
│   ├── relatorios.html        # 📊 Lista de relatórios
│   ├── relatorio.html         # 📄 Relatório completo (imprimível)
│   ├── admin.html
│   ├── logs.html
│   ├── super-admin.html       # 👑 Painel dev
│   │
│   ├── css/
│   │   ├── style.css
│   │   ├── relatorio.css      # 📄
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
│       ├── relatorio-view.js  # 📄
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
        ├── 11-error-handler.test.js
        └── 12-repository-leaks.test.js

🔌 API

Base URL: http://localhost:3000/api

Todos os endpoints (exceto /auth/login, /auth/registrar, /auth/refresh e /health) exigem Authorization: Bearer <token>.
🔐 Autenticação
Método	Endpoint	Descrição	Auth
POST	/auth/registrar	Cadastra novo usuário	❌
POST	/auth/login	Login (retorna JWT + refresh)	❌
POST	/auth/refresh	Renova access token	❌
GET	/auth/me	Dados do usuário logado	✅
POST	/auth/logout	Registra logout	✅
POST	/auth/trocar-senha	Troca a própria senha	✅
POST	/auth/2fa/iniciar	Inicia setup do 2FA (retorna QR)	✅
POST	/auth/2fa/confirmar	Ativa 2FA com código TOTP	✅
POST	/auth/2fa/desativar	Desativa 2FA (exige senha)	✅

Exemplo de login com 2FA:
bash

# 1. Login inicial (sem código 2FA)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@estoque.com","senha":"admin123"}'

# Se 2FA está ativo, retorna: {"requer2FA": true}

# 2. Login com código 2FA (6 dígitos do app autenticador)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@estoque.com","senha":"admin123","codigo2fa":"123456"}'

📦 Produtos
Método	Endpoint	Descrição	Auth
GET	/produtos	Lista paginada com filtros e busca ranqueada	✅
GET	/produtos/:id	Busca por ID	✅
POST	/produtos	Cria produto	✅
PUT	/produtos/:id	Atualiza produto	✅ Admin+
DELETE	/produtos/:id	Move para lixeira	✅ Admin+
PATCH	/produtos/:id/entrada	Registra entrada	✅
PATCH	/produtos/:id/saida	Registra saída	✅
PATCH	/produtos/:id/ajuste	Ajusta quantidade	✅
GET	/produtos/lixeira	Lista produtos deletados	✅
GET	/produtos/lixeira/count	Contagem para badge	✅
POST	/produtos/:id/restaurar	Restaura da lixeira	✅ Admin+
POST	/produtos/lixeira/esvaziar	Esvazia lixeira	✅ Admin+

Query params (GET /produtos):

    busca, categoria_id, estoque_baixo, apenas_ativos

    ordenar (id|nome|preco|quantidade), ordem (asc|desc)

    pagina, limite

🏷️ Categorias
Método	Endpoint	Descrição	Auth
GET	/categorias	Lista todas	✅
POST	/categorias	Cria	✅ Admin+
PUT	/categorias/:id	Atualiza	✅ Admin+
DELETE	/categorias/:id	Remove	✅ Admin+
🔄 Movimentações
Método	Endpoint	Descrição	Auth
GET	/movimentacoes	Histórico paginado	✅

Query params: tipo, produto_id, data_inicio, data_fim, pagina, limite
📈 Relatórios
Método	Endpoint	Descrição	Auth
GET	/relatorios/dashboard	KPIs + gráficos + alertas	✅ qualquer usuário logado
GET	/relatorios/movimentacoes	Resumo por período	✅ Admin+
GET	/relatorios/completo	Payload do relatório em página	✅ Admin+
GET	/relatorios/exportar-excel	Download do .xlsx	✅ Admin+
⚙️ Admin
Método	Endpoint	Descrição	Auth
GET	/admin/estatisticas	Contadores gerais	✅ Admin+
GET	/admin/usuarios	Lista paginada	✅ Admin+
POST	/admin/usuarios	Cria usuário	✅ Admin+
PUT	/admin/usuarios/:id	Atualiza usuário	✅ Admin+
DELETE	/admin/usuarios/:id	Remove usuário	✅ Admin+
PATCH	/admin/usuarios/:id/senha	Reset de senha	✅ Admin+
GET	/admin/backup/info	Metadados do banco	✅ Admin+
GET	/admin/backup/lista	Lista backups salvos	✅ Admin+
GET	/admin/backup	Download snapshot (criptografado)	✅ Admin+
POST	/admin/backup/criar	Salva em backups/	✅ Admin+
GET	/admin/backup/:nome/baixar	Download específico	✅ Admin+
DELETE	/admin/backup/:nome	Remove backup	✅ Admin+
POST	/admin/restore/validar	Valida upload (detecta cifrado)	✅ Admin+
POST	/admin/restore	Restaura (descriptografa auto)	✅ Admin+

    🔒 admin não pode editar, remover ou resetar senha de super_admin.

👑 Super-Admin
Método	Endpoint	Descrição	Auth
GET	/super-admin/metricas	CPU, memória, requisições, WS	👑 Super
GET	/super-admin/alertas	Alertas ativos	👑 Super
GET	/super-admin/auditoria	Estatísticas agregadas	👑 Super
GET	/super-admin/eventos	Feed dos últimos 50 logs	👑 Super
POST	/super-admin/auditar	Executa auditoria de segurança	👑 Super
📜 Logs
Método	Endpoint	Descrição	Auth
GET	/logs	Lista paginada	✅ Admin+
GET	/logs/estatisticas	Contadores por nível	✅ Admin+
GET	/logs/filtros	Ações e entidades distintas	✅ Admin+
DELETE	/logs/limpar?dias=90	Remove logs antigos	✅ Admin+
❤️ Health Check
Método	Endpoint	Descrição	Auth
GET	/health	Status do servidor	❌
⚡ WebSocket

Conecta via io({ auth: { token } }). Eventos emitidos:
Evento	Payload	Descrição
produto:criado	Produto	Novo produto cadastrado
produto:atualizado	Produto	Produto editado
produto:removido	{ id }	Produto removido
produto:movimentado	{ id, tipo, quantidade, atual }	Entrada/saída/ajuste
movimentacao:criada	{ produto_id }	Nova movimentação
categoria:criada	Categoria	Nova categoria
categoria:atualizada	Categoria	Categoria editada
categoria:removida	{ id }	Categoria removida
🆕 sistema:evento	LogEvento	Novo log de sistema (feed super-admin)
🆕 sistema:erro	{ metodo, path, mensagem, timestamp, usuario }	Erro 500 em tempo real
🏗️ Arquitetura

O projeto segue o padrão MVC + Repository, com separação clara em camadas:
text

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

Regras de dependência

    ✅ Cada camada só conhece a imediatamente inferior

    ✅ SQL apenas em Repositories

    ✅ Regras de negócio apenas em Services

    ✅ Controllers só traduzem HTTP ↔ Service

    ✅ Validações de entrada no middleware validate.js (Zod)

    ✅ Validações de negócio no Service

Pipeline de segurança
text

Requisição HTTP
      ↓
[Helmet] ────── Headers de segurança (CSP, HSTS, etc.)
      ↓
[CORS] ──────── Origem permitida?
      ↓
[Rate Limit] ── Muitas requisições?
      ↓
[Body Parser] ─ Limite de payload (100kb)
      ↓
[Auth] ──────── Token JWT válido? Conta ativa? Não bloqueada?
      ↓
[Hierarquia] ── Papel do usuário tem nível suficiente?
      ↓
[Validação Zod] Schema dos dados correto?
      ↓
[Controller → Service → Repository]
      ↓
Resposta

🔒 Segurança
Camadas implementadas
Camada	Proteção	Arquivo
Headers	Helmet + CSP + HSTS + X-Frame-Options	middlewares/security.js
CORS	Lista de origens permitidas	middlewares/security.js
Rate limit global	100 req/15min por IP	middlewares/security.js
Rate limit login	5 tentativas/15min por IP+email	middlewares/security.js
Slow down	Delay progressivo após 3 reqs	middlewares/security.js
Senhas	bcrypt com 12 rounds	services/authService.js
Política de senha	8+ chars, maiúscula, número, especial, blacklist	services/passwordService.js
Account lockout	Bloqueia 15min após 5 falhas	services/authService.js
2FA	TOTP (Google Auth, Authy)	services/totpService.js
JWT	Issuer + access/refresh separados	services/authService.js
Conta ativa	Verificada em cada request	middlewares/auth.js
🆕 Hierarquia de papéis	temNivel() com 3 níveis	middlewares/auth.js
🆕 Bloqueio de super-admin	Admin não mexe em super-admin	services/usuarioService.js
🆕 Proteção do último admin	Não remove/rebaixa o último	services/usuarioService.js
Validação	Zod com mensagens detalhadas	middlewares/validate.js
Env	Validação com fail-fast	config/env.js
Backups	AES-256-GCM com auth tag	services/backupCryptoService.js
Uploads	Multer com limite + extensão	controllers/backupController.js
Path traversal	path.basename()	services/backupService.js
SQL injection	Statements preparados	Todos repositories
XSS	Escape em todo output HTML	Todos os JS frontend
Error handler	Não vaza stack em produção	middlewares/errorHandler.js
Auditoria	Eventos SEC_* para ações sensíveis	services/securityLogService.js
🆕 Auditoria de negativas	SEC_ACAO_NEGADA quando admin tenta super-admin	services/usuarioService.js
Recomendações para produção

    □

    Definir JWT_SECRET forte (128 chars hex)
    □

    Definir BACKUP_ENCRYPTION_KEY (64 chars hex) e guardar em cofre
    □

    Definir ADMIN_PASSWORD e SUPER_ADMIN_PASSWORD antes do primeiro boot
    □

    Usar HTTPS (nginx / Cloudflare / Let's Encrypt)
    □

    Configurar CORS_ORIGINS com domínios reais
    □

    Ativar 2FA para todos os admins e super-admins
    □

    Rodar atrás de reverse proxy com trust proxy
    □

    Monitoramento de erros (Sentry, Bugsnag)
    □

    Backup do .env em gerenciador de segredos
    □

    npm audit periódico
    □

    Ativar logs estruturados

⚠️ Recuperação de senha do admin

Se perder a senha do admin, rode na raiz:
bash

node -e "
const bcrypt = require('bcryptjs');
const db = require('./src/config/sqliteShim');
const d = new db('./estoque.db');
const hash = bcrypt.hashSync('NovaSenha@Forte2024', 12);
d.prepare('UPDATE usuarios SET senha_hash = ?, tentativas_falhas = 0, bloqueado_ate = NULL WHERE email = ?').run(hash, 'admin@estoque.com');
console.log('✅ Senha redefinida');
d.close();
"

💾 Backup e Restauração
Backup automático

    Agenda: a cada 12 horas (00:00 e 12:00)

    Local: pasta backups/

    Nome: estoque-auto-YYYY-MM-DD-HH-MM-SS.db.cifrado

    Criptografia: AES-256-GCM

    Rotação: mantém 20 backups automáticos

Backup manual

    Interface: ⚙️ Admin → 📥 Salvar Backup

    API: POST /api/admin/backup/criar

    Nome: estoque-manual-YYYY-MM-DD-HH-MM-SS.db.cifrado

    Nunca são removidos pela rotação

Download

    Interface: ⚙️ Admin → ⬇ Baixar Agora

    API: GET /api/admin/backup

    Usa VACUUM INTO — snapshot atômico e consistente

Restauração

    Interface: ⚙️ Admin → ⬆ Restaurar

    Aceita .db ou .db.cifrado (descriptografa automaticamente)

    Processo:

        Upload do arquivo

        Validação (integridade SQLite + tabelas obrigatórias)

        Backup de segurança automático

        Substituição transacional

        Ajuste dos autoincrementos

        Logout forçado

Formato do arquivo cifrado
text

[MAGIC: "ESBK" 4B] [IV: 12B] [AUTH_TAG: 16B] [CIPHERTEXT: variável]

    MAGIC — identifica que é um backup criptografado

    IV — vetor de inicialização aleatório por arquivo

    AUTH_TAG — previne adulteração (GCM)

    CIPHERTEXT — banco SQLite criptografado

🧪 Testes
Executar
bash

npm test                    # Todos
npm run test:security       # Apenas segurança
npm run test:watch          # Watch mode
npm run test:coverage       # Com cobertura

Cobertura atual
text

Test Suites: 18 passed, 18 total
Tests:       80 passed
Time:        ~42s

Suítes funcionais
Suíte	Testes	Cobre
auth.test.js	6	Registro, login, JWT, 401
produtos.test.js	6	CRUD, validações, movimentações
categorias.test.js	4	CRUD completo
movimentacoes.test.js	2	Auditoria automática
admin.test.js	5	Permissões, proteções
relatorios.test.js	3	Dashboard, Excel, logs
Suítes de segurança
Suíte	Testes	Cobre
01-headers.test.js	7	Helmet, CSP, X-Frame-Options
02-cors.test.js	3	Origens permitidas/bloqueadas
03-rate-limit.test.js	1	Limite global
04-password-policy.test.js	6	Regras de senha forte
05-zod-validation.test.js	4	Rejeição de dados inválidos
06-account-lockout.test.js	3	Bloqueio após N falhas
07-jwt-expiration.test.js	7	Expiração, refresh, assinatura
08-2fa.test.js	7	Setup, confirmação, login 2FA
09-backup-crypto.test.js	8	Criptografia AES-256-GCM
10-security-logs.test.js	3	Eventos SEC_*
11-error-handler.test.js	2	Não vaza stack em prod
🆕 12-repository-leaks.test.js	3	Não vaza senha_hash / totp_secret
Estratégia

    Banco em memória (:memory:) — sem I/O, sem lock, testes rápidos

    Supertest para simular requisições HTTP reais

    server-test.js exporta o app sem iniciar servidor nem cron

    Isolamento por suíte — cada uma limpa o banco no afterAll

    Env dedicado para testes (chaves sintéticas, rounds menores)

🗺️ Roadmap
Concluído ✅

    ☑

    Autenticação JWT + refresh token
    ☑

    2FA (TOTP) com QR Code
    ☑

    Política de senha forte
    ☑

    Account lockout
    ☑

    Helmet + CSP customizada
    ☑

    CORS restritivo
    ☑

    Rate limiting global e por rota
    ☑

    Validação Zod em todos os endpoints
    ☑

    Validação de variáveis de ambiente
    ☑

    Backup criptografado AES-256-GCM
    ☑

    CRUD de produtos com soft delete
    ☑

    CRUD de categorias e usuários
    ☑

    Movimentações com auditoria automática
    ☑

    Dashboard com gráficos (Chart.js)
    ☑

    Relatórios em Excel (6 abas)
    ☑

    Backup automático + restauração
    ☑

    Log de atividades global
    ☑

    WebSocket para tempo real
    ☑

    Painel Super-Admin com métricas, auditoria e alertas
    ☑

    Hierarquia de 3 níveis (super-admin, admin, operador)
    ☑

    Relatório em página com impressão PDF
    ☑

    Ranking de busca por relevância (nome > SKU > descrição)
    ☑

    Feed de eventos em tempo real no super painel
    ☑

    Notificação de erros 500 em tempo real
    ☑

    Proteção do último super-admin e último admin
    ☑

    Logs de segurança (SEC_* e SEC_ACAO_NEGADA)
    ☑

    80 testes automatizados (18 suítes)

Futuro 🔮

    □

    🐳 Docker + docker-compose
    □

    🚀 CI/CD com GitHub Actions
    □

    📱 PWA (offline + instalável)
    □

    🔔 Notificações push no navegador
    □

    📧 E-mail em falha de backup ou estoque baixo
    □

    🏷️ Leitor de código de barras com câmera
    □

    📊 Gráficos nativos dentro do Excel
    □

    🌍 Internacionalização (i18n)
    □

    🔍 Busca fuzzy (FTS5)
    □

    📉 Relatório de previsão de consumo
    □

    📥 Import de CSV de produtos
    □

    🔑 Login social (OAuth2)
    □

    🌐 HTTPS com certificado automático (Let's Encrypt)
    □

    📈 Curva ABC + Giro de estoque
    □

    🔎 Command Palette (Ctrl+K)

🤝 Contribuindo

Contribuições são bem-vindas!

    Fork o projeto

    Crie uma branch: git checkout -b feature/minha-feature

    Commit: git commit -m 'feat: adiciona X'

    Push: git push origin feature/minha-feature

    Abra um Pull Request

Padrões

    Commits: Conventional Commits

        feat: nova funcionalidade

        fix: correção

        docs: documentação

        test: testes

        refactor: refatoração

        chore: manutenção

    Código: sempre rode npm test antes do PR

    Segurança: nunca comite .env nem estoque.db

    Branches: feature/, fix/, hotfix/, refactor/, docs/

Reportar bugs

Abra uma issue com:

    Descrição clara

    Passos para reproduzir

    Comportamento esperado vs. observado

    Screenshots (se aplicável)

    Versão do Node e SO

📄 Licença

Este projeto está sob a licença MIT. Veja LICENSE para detalhes.
👏 Agradecimentos

    Node.js — API node:sqlite nativa

    Express — framework web

    Helmet — headers de segurança

    Socket.IO — tempo real

    Chart.js — gráficos

    ExcelJS — planilhas

    Speakeasy — TOTP

    Zod — validação

    Jest + Supertest — testes

📞 Contato

    Autor: Seu Nome

    E-mail: seu@email.com

    GitHub: @seu-usuario

<div align="center">

⭐ Se este projeto foi útil, deixe uma estrela!

Feito com ☕ e 💙
</div>
📝 Notas de versão
v3.0.0 — Super-Admin e hierarquia de 3 níveis

Adicionado:

    👑 Painel Super-Admin com métricas em tempo real (CPU, memória, requisições)

    👑 Sistema de alertas automáticos (logins falhos, contas bloqueadas, backup atrasado, erros 500)

    👑 Feed de eventos em tempo real via WebSocket

    👑 Auditoria de segurança sob demanda

    🔐 Hierarquia de 3 níveis de acesso (super_admin > admin > operador)

    🔐 Proteção do último super-admin ativo

    🔐 Log de ações negadas (SEC_ACAO_NEGADA)

    📄 Relatório em página dedicada com impressão PDF

    📄 Endpoint /relatorios/completo para payload completo

    🔍 Ranking de busca por relevância (nome > SKU > descrição)

    🧪 Suíte de testes 12-repository-leaks.test.js

    🧪 80 testes passando (era 70)

Melhorado:

    🔒 api() não confunde mais erro de login com "sessão expirada"

    🔒 Tratamento específico de 429 Too Many Requests

    🔒 Separação de rotas: /relatorios/dashboard aberto para todos, resto exige admin

    📊 18 suítes de teste (era 17)

v2.0.0 — Segurança e auditoria

    2FA com TOTP

    Backup criptografado AES-256-GCM

    Política de senha forte

    Account lockout

    Logs de segurança SEC_*

v1.0.0 — Versão inicial

    CRUD de produtos, categorias e usuários

    Movimentações com auditoria

    Dashboard com gráficos

    Autenticação JWT

<div align="center">

Sistema de Estoque v3.0.0 — Feito com dedicação 🇧🇷
</div>
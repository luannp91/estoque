# 📦 Sistema de Estoque

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-29.x-C21325?logo=jest&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tests](https://img.shields.io/badge/tests-25%20passing-brightgreen.svg)

**Sistema completo de controle de estoque com autenticação, auditoria, backup automático, tempo real e relatórios em
Excel corporativo.**

[Funcionalidades](#-funcionalidades) • [Instalação](#-instalação) • [Uso](#-uso) • [API](#-api) •
[Arquitetura](#-arquitetura) • [Testes](#-testes)

</div>

---

## 📋 Sumário

-   [Sobre](#-sobre)
-   [Funcionalidades](#-funcionalidades)
-   [Stack Tecnológica](#-stack-tecnológica)
-   [Screenshots](#-screenshots)
-   [Instalação](#-instalação)
-   [Uso](#-uso)
-   [Estrutura do Projeto](#-estrutura-do-projeto)
-   [API](#-api)
-   [Arquitetura](#-arquitetura)
-   [Testes](#-testes)
-   [Backup e Restauração](#-backup-e-restauração)
-   [Segurança](#-segurança)
-   [Roadmap](#-roadmap)
-   [Contribuindo](#-contribuindo)
-   [Licença](#-licença)

---

## 🎯 Sobre

Sistema web completo para **gerenciamento de estoque** com foco em **pequenas e médias empresas**. Oferece controle
total sobre produtos, categorias, movimentações e usuários, com **auditoria automática**, **backup recorrente** e
**relatórios profissionais**.

**Principais diferenciais:**

-   🔐 Autenticação JWT com diferentes níveis de acesso
-   ⚡ Atualização em tempo real via WebSocket
-   📜 Log de atividades global (auditoria completa)
-   📊 Relatórios em Excel com 6 abas e gráficos nativos
-   💾 Backup automático a cada 12 horas + restauração 1-clique
-   🧪 25 testes automatizados cobrindo rotas críticas
-   🎨 Interface moderna com tema claro/escuro

---

## ✨ Funcionalidades

### 🔐 Autenticação e Autorização

-   [x] Login com JWT (expiração configurável)
-   [x] Senhas com hash bcrypt (10 rounds)
-   [x] Papéis: **administrador** e **operador**
-   [x] Cadastro público de novos usuários
-   [x] Reset de senha por admin
-   [x] Ativar/desativar contas sem perder histórico
-   [x] Proteções: não pode se auto-remover nem rebaixar o último admin

### 📦 Gestão de Produtos

-   [x] CRUD completo com validações
-   [x] SKU único, descrição, preço, estoque mínimo
-   [x] Categoria opcional
-   [x] Status ativo/inativo
-   [x] Busca por nome, SKU ou descrição
-   [x] Filtros por categoria, estoque baixo e status
-   [x] Ordenação por coluna (nome, preço, quantidade, ID)
-   [x] Paginação server-side
-   [x] Export CSV

### 🏷️ Categorias

-   [x] CRUD completo
-   [x] Contagem de produtos por categoria
-   [x] Remoção não afeta produtos (ficam sem categoria)

### 🔄 Movimentações

-   [x] Entrada (+), saída (−) e ajuste de estoque
-   [x] **Auditoria automática** de toda operação
-   [x] Histórico paginado com filtros (tipo, período)
-   [x] Colunas antes/depois para rastrear variação
-   [x] Não permite saída maior que o estoque

### 📊 Dashboard

-   [x] 5 KPIs em tempo real (produtos, itens, valor, baixo, zerado)
-   [x] Gráfico de rosca — produtos por categoria
-   [x] Gráfico de barras — top 10 produtos por valor
-   [x] Tabela de alertas de estoque baixo

### 📈 Relatórios

-   [x] **Export Excel corporativo** com 6 abas:
    -   Resumo Executivo (KPIs + distribuições)
    -   Produtos (lista completa com formatação)
    -   Movimentações (histórico do período)
    -   Top Produtos (ranking com medalhas)
    -   Estoque Baixo (alertas + ações sugeridas)
    -   Gráficos (dados organizados para chart nativo)
-   [x] Export CSV simples
-   [x] Filtro por período

### 📜 Log de Atividades

-   [x] Registro automático de todas as ações críticas
-   [x] Campos: usuário, ação, entidade, descrição, IP, user-agent, nível
-   [x] Filtros: busca, ação, entidade, nível, período
-   [x] Estatísticas (info/warn/error, últimas 24h, 7d)
-   [x] Limpeza automática de logs antigos (90 dias)

### 💾 Backup e Restauração

-   [x] Backup manual (salva em `backups/`)
-   [x] Backup automático a cada **12 horas** (00:00 e 12:00)
-   [x] Download de snapshot instantâneo
-   [x] Rotação automática (mantém 20 backups)
-   [x] Restauração via upload com validação
-   [x] Backup de segurança antes de restaurar
-   [x] Validação de integridade do SQLite

### ⚡ Tempo Real

-   [x] WebSocket (Socket.IO) com autenticação JWT
-   [x] Dashboard e listas atualizam automaticamente
-   [x] Notificações quando outro usuário altera dados

### 🎨 Interface

-   [x] Design responsivo (mobile-first)
-   [x] Tema claro/escuro persistente
-   [x] Modais, toasts, badges coloridos
-   [x] Layout com grid e cards

---

## 🛠️ Stack Tecnológica

### Backend

| Tecnologia       | Uso                                    |
| ---------------- | -------------------------------------- |
| **Node.js 22+**  | Runtime                                |
| **Express 4**    | Framework HTTP                         |
| **node:sqlite**  | Banco de dados nativo (sem compilação) |
| **jsonwebtoken** | Autenticação                           |
| **bcryptjs**     | Hash de senhas                         |
| **socket.io**    | WebSocket                              |
| **exceljs**      | Geração de planilhas                   |
| **multer**       | Upload de arquivos                     |
| **node-cron**    | Agendador de backup                    |
| **dotenv**       | Variáveis de ambiente                  |

### Frontend

| Tecnologia               | Uso                   |
| ------------------------ | --------------------- |
| **HTML5 + CSS3**         | Estrutura e estilo    |
| **JavaScript (Vanilla)** | Lógica do cliente     |
| **Socket.IO Client**     | Tempo real            |
| **Chart.js**             | Gráficos do dashboard |

### Testes

| Tecnologia    | Uso            |
| ------------- | -------------- |
| **Jest**      | Test runner    |
| **Supertest** | Testes de HTTP |

---

## 📸 Screenshots

> 💡 Adicione os screenshots na pasta `docs/screenshots/` e descomente abaixo.

<!--
### 🔐 Login
![Tela de Login](docs/screenshots/login.png)

### 📊 Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### 📦 Produtos
![Produtos](docs/screenshots/produtos.png)

### 📈 Relatórios Excel
![Relatório Excel](docs/screenshots/excel.png)

### 📜 Log de Atividades
![Logs](docs/screenshots/logs.png)

### ⚙️ Painel Admin
![Admin](docs/screenshots/admin.png)
-->

---

## 🚀 Instalação

### Pré-requisitos

-   **Node.js 22 ou superior** ([download](https://nodejs.org/))
    -   `node:sqlite` está estável a partir do Node 22.5+
-   **npm 10+** (vem com o Node)
-   Sistema operacional: Windows, Linux ou macOS

> ⚠️ **Não é necessário** instalar Python, Visual Studio Build Tools ou compiladores C++ — usamos o SQLite nativo do
> Node.

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/estoque-app.git
cd estoque-app

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env e defina um JWT_SECRET seguro

# 4. Inicie o servidor em modo desenvolvimento
npm run dev
```

Acesse **http://localhost:3000**

### 🔑 Credenciais padrão

| Campo  | Valor               |
| ------ | ------------------- |
| E-mail | `admin@estoque.com` |
| Senha  | `admin123`          |

> ⚠️ **Troque a senha do admin após o primeiro login!**

### Variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
PORT=3000
JWT_SECRET=sua-chave-secreta-super-segura-aqui
JWT_EXPIRES=8h
```

| Variável      | Padrão         | Descrição                          |
| ------------- | -------------- | ---------------------------------- |
| `PORT`        | 3000           | Porta do servidor                  |
| `JWT_SECRET`  | `dev-secret`   | Chave para assinar tokens JWT      |
| `JWT_EXPIRES` | `8h`           | Tempo de expiração do token        |
| `DB_PATH`     | `./estoque.db` | Caminho do banco (usado em testes) |

---

## 💻 Uso

### Comandos disponíveis

```bash
# Desenvolvimento (auto-reload com nodemon)
npm run dev

# Produção
npm start

# Rodar todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Testes com cobertura
npm run test:coverage
```

### Fluxo típico de uso

1. **Faça login** com `admin@estoque.com / admin123`
2. **Crie categorias** em `Categorias` (ex: Informática, Escritório)
3. **Cadastre produtos** em `Produtos` vinculando a uma categoria
4. **Registre movimentações** usando os botões `+` e `−` na lista de produtos
5. **Monitore o dashboard** — ele atualiza em tempo real
6. **Gere relatórios** em `Relatórios` → `📊 Exportar Excel`
7. **Gerencie usuários** em `⚙️ Admin` (só admins veem esse menu)
8. **Audite ações** em `📜 Logs` (só admins)
9. **Faça backups** em `⚙️ Admin` → seção Backup

### Estrutura de telas

```
┌──────────────────────────────────────────────────┐
│ 📦 Estoque  │ Dashboard │ Produtos │ Categorias  │
│             │ Movimentações │ Relatórios │ ⚙️ Admin │ 📜 Logs │
└──────────────────────────────────────────────────┘
```

---

## 📁 Estrutura do Projeto

```
estoque-app/
├── .env                      # Variáveis de ambiente (não versionado)
├── .env.example              # Template do .env
├── .gitignore
├── package.json
├── jest.config.js
├── README.md
├── estoque.db                # Banco SQLite (criado em runtime)
│
├── backups/                  # Backups automáticos e manuais
│   └── .gitkeep
│
├── tmp/                      # Uploads temporários (restauração)
│
├── docs/
│   └── screenshots/          # Imagens para o README
│
├── src/
│   ├── server.js             # Ponto de entrada (Express + Socket.IO)
│   ├── server-test.js        # Exporta o app para testes
│   │
│   ├── config/
│   │   ├── database.js       # Conexão SQLite, tabelas, migrações, seed
│   │   └── sqliteShim.js     # Wrapper para node:sqlite
│   │
│   ├── middlewares/
│   │   ├── auth.js           # JWT + verificação de papel
│   │   └── errorHandler.js   # Tratamento de erros centralizado
│   │
│   ├── models/
│   │   └── Produto.js        # Classe de domínio com getters
│   │
│   ├── repositories/         # Acesso ao banco
│   │   ├── usuarioRepository.js
│   │   ├── categoriaRepository.js
│   │   ├── produtoRepository.js
│   │   ├── movimentacaoRepository.js
│   │   └── logRepository.js
│   │
│   ├── services/             # Regras de negócio
│   │   ├── authService.js
│   │   ├── usuarioService.js
│   │   ├── categoriaService.js
│   │   ├── estoqueService.js
│   │   ├── movimentacaoService.js
│   │   ├── relatorioService.js
│   │   ├── excelService.js
│   │   ├── backupService.js
│   │   ├── restoreService.js
│   │   ├── logService.js
│   │   └── realtimeService.js
│   │
│   ├── controllers/          # HTTP ↔ Service
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── categoriaController.js
│   │   ├── produtoController.js
│   │   ├── movimentacaoController.js
│   │   ├── relatorioController.js
│   │   ├── backupController.js
│   │   └── logController.js
│   │
│   ├── routes/               # Definição de endpoints
│   │   ├── authRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── categoriaRoutes.js
│   │   ├── produtoRoutes.js
│   │   ├── movimentacaoRoutes.js
│   │   ├── relatorioRoutes.js
│   │   └── logRoutes.js
│   │
│   └── jobs/
│       └── backupJob.js      # Cron de backup (12h)
│
├── public/                   # Frontend estático
│   ├── index.html            # Login / cadastro
│   ├── dashboard.html
│   ├── produtos.html
│   ├── categorias.html
│   ├── movimentacoes.html
│   ├── relatorios.html
│   ├── admin.html
│   ├── logs.html
│   │
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       ├── app.js            # Utilitários compartilhados
│       ├── login.js
│       ├── dashboard.js
│       ├── produtos.js
│       ├── categorias.js
│       ├── movimentacoes.js
│       ├── relatorios.js
│       ├── admin.js
│       └── logs.js
│
└── tests/
    ├── setup.js              # Configuração global
    ├── helpers.js            # Helpers compartilhados
    ├── auth.test.js
    ├── produtos.test.js
    ├── categorias.test.js
    ├── movimentacoes.test.js
    ├── admin.test.js
    └── relatorios.test.js
```

---

## 🔌 API

Base URL: `http://localhost:3000/api`

Todos os endpoints (exceto `/auth/login` e `/auth/registrar`) exigem `Authorization: Bearer <token>`.

### 🔐 Autenticação

| Método | Endpoint          | Descrição               | Auth |
| ------ | ----------------- | ----------------------- | ---- |
| `POST` | `/auth/registrar` | Cadastra novo usuário   | ❌   |
| `POST` | `/auth/login`     | Login (retorna JWT)     | ❌   |
| `GET`  | `/auth/me`        | Dados do usuário logado | ✅   |
| `POST` | `/auth/logout`    | Registra logout no log  | ✅   |

**Exemplo de login:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@estoque.com","senha":"admin123"}'
```

Resposta:

```json
{
    "usuario": { "id": 1, "nome": "Administrador", "email": "admin@estoque.com", "papel": "admin" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 📦 Produtos

| Método   | Endpoint                | Descrição                  | Auth     |
| -------- | ----------------------- | -------------------------- | -------- |
| `GET`    | `/produtos`             | Lista paginada com filtros | ✅       |
| `GET`    | `/produtos/:id`         | Busca por ID               | ✅       |
| `POST`   | `/produtos`             | Cria produto               | ✅       |
| `PUT`    | `/produtos/:id`         | Atualiza produto           | ✅ Admin |
| `DELETE` | `/produtos/:id`         | Remove produto             | ✅ Admin |
| `PATCH`  | `/produtos/:id/entrada` | Registra entrada           | ✅       |
| `PATCH`  | `/produtos/:id/saida`   | Registra saída             | ✅       |
| `PATCH`  | `/produtos/:id/ajuste`  | Ajusta quantidade          | ✅       |

**Query params** (GET `/produtos`):

-   `busca`, `categoria_id`, `estoque_baixo`, `apenas_ativos`
-   `ordenar` (`id` \| `nome` \| `preco` \| `quantidade`), `ordem` (`asc` \| `desc`)
-   `pagina`, `limite`

### 🏷️ Categorias

| Método   | Endpoint          | Descrição   | Auth     |
| -------- | ----------------- | ----------- | -------- |
| `GET`    | `/categorias`     | Lista todas | ✅       |
| `POST`   | `/categorias`     | Cria        | ✅ Admin |
| `PUT`    | `/categorias/:id` | Atualiza    | ✅ Admin |
| `DELETE` | `/categorias/:id` | Remove      | ✅ Admin |

### 🔄 Movimentações

| Método | Endpoint         | Descrição          | Auth |
| ------ | ---------------- | ------------------ | ---- |
| `GET`  | `/movimentacoes` | Histórico paginado | ✅   |

**Query params:** `tipo`, `produto_id`, `data_inicio`, `data_fim`, `pagina`, `limite`

### 📈 Relatórios

| Método | Endpoint                     | Descrição                 | Auth |
| ------ | ---------------------------- | ------------------------- | ---- |
| `GET`  | `/relatorios/dashboard`      | KPIs + gráficos + alertas | ✅   |
| `GET`  | `/relatorios/movimentacoes`  | Resumo por período        | ✅   |
| `GET`  | `/relatorios/exportar-excel` | Download do .xlsx         | ✅   |

### ⚙️ Admin

| Método   | Endpoint                     | Descrição            | Auth     |
| -------- | ---------------------------- | -------------------- | -------- |
| `GET`    | `/admin/estatisticas`        | Contadores gerais    | ✅ Admin |
| `GET`    | `/admin/usuarios`            | Lista paginada       | ✅ Admin |
| `POST`   | `/admin/usuarios`            | Cria usuário         | ✅ Admin |
| `PUT`    | `/admin/usuarios/:id`        | Atualiza usuário     | ✅ Admin |
| `DELETE` | `/admin/usuarios/:id`        | Remove usuário       | ✅ Admin |
| `PATCH`  | `/admin/usuarios/:id/senha`  | Reset de senha       | ✅ Admin |
| `GET`    | `/admin/backup/info`         | Metadados do banco   | ✅ Admin |
| `GET`    | `/admin/backup/lista`        | Lista backups salvos | ✅ Admin |
| `GET`    | `/admin/backup`              | Download instantâneo | ✅ Admin |
| `POST`   | `/admin/backup/criar`        | Salva em `backups/`  | ✅ Admin |
| `GET`    | `/admin/backup/:nome/baixar` | Download específico  | ✅ Admin |
| `DELETE` | `/admin/backup/:nome`        | Remove backup        | ✅ Admin |
| `POST`   | `/admin/restore/validar`     | Valida upload        | ✅ Admin |
| `POST`   | `/admin/restore`             | Restaura do upload   | ✅ Admin |

### 📜 Logs

| Método   | Endpoint               | Descrição                   | Auth     |
| -------- | ---------------------- | --------------------------- | -------- |
| `GET`    | `/logs`                | Lista paginada              | ✅ Admin |
| `GET`    | `/logs/estatisticas`   | Contadores por nível        | ✅ Admin |
| `GET`    | `/logs/filtros`        | Ações e entidades distintas | ✅ Admin |
| `DELETE` | `/logs/limpar?dias=90` | Remove logs antigos         | ✅ Admin |

### ⚡ WebSocket

Conecta via `io({ auth: { token } })`. Eventos emitidos:

| Evento                 | Payload                           | Descrição               |
| ---------------------- | --------------------------------- | ----------------------- |
| `produto:criado`       | `Produto`                         | Novo produto cadastrado |
| `produto:atualizado`   | `Produto`                         | Produto editado         |
| `produto:removido`     | `{ id }`                          | Produto removido        |
| `produto:movimentado`  | `{ id, tipo, quantidade, atual }` | Entrada/saída/ajuste    |
| `movimentacao:criada`  | `{ produto_id }`                  | Nova movimentação       |
| `categoria:criada`     | `Categoria`                       | Nova categoria          |
| `categoria:atualizada` | `Categoria`                       | Categoria editada       |
| `categoria:removida`   | `{ id }`                          | Categoria removida      |

---

## 🏗️ Arquitetura

O projeto segue o padrão **MVC + Repository**, com separação clara em camadas:

```
┌─────────────────────────────────────────────────┐
│  VIEW (HTML + CSS + JS)                         │  ← Navegador
├─────────────────────────────────────────────────┤
│  ROUTES (Express Router)                        │
├─────────────────────────────────────────────────┤
│  MIDDLEWARES (auth, errorHandler)               │
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

-   ✅ **Cada camada só conhece a imediatamente inferior**
-   ✅ **SQL apenas em Repositories**
-   ✅ **Regras de negócio apenas em Services**
-   ✅ **Controllers só traduzem HTTP ↔ Service**
-   ✅ **Validações sempre no Service** (nunca no Repository ou Controller)

### Diagrama de fluxo

```
Cliente HTTP → Router → Middleware auth → Controller → Service → Repository → SQLite
                                          ↓
                                     realtime.emit()
                                          ↓
                                    WebSocket → Clientes conectados
```

---

## 🧪 Testes

### Executar

```bash
npm test                    # Roda todos
npm run test:watch          # Modo watch
npm run test:coverage       # Com relatório de cobertura
```

### Cobertura atual

```
Test Suites: 6 passed, 6 total
Tests:       25 passed, 25 total
Time:        ~12s
```

| Suíte                   | Testes | Cobre                           |
| ----------------------- | ------ | ------------------------------- |
| `auth.test.js`          | 5      | Registro, login, JWT, 401       |
| `produtos.test.js`      | 6      | CRUD, validações, movimentações |
| `categorias.test.js`    | 4      | CRUD completo                   |
| `movimentacoes.test.js` | 2      | Auditoria automática            |
| `admin.test.js`         | 5      | Permissões, proteções           |
| `relatorios.test.js`    | 3      | Dashboard, Excel, logs          |

### Estratégia

-   **Banco em memória** (`:memory:`) — sem I/O, sem lock, testes rápidos
-   **Supertest** para simular requisições HTTP reais
-   **`server-test.js`** exporta o app sem iniciar servidor nem cron
-   **Isolamento por suíte** — cada uma limpa o banco no `afterAll`

---

## 💾 Backup e Restauração

### Backup automático

-   Agenda: **a cada 12 horas** (00:00 e 12:00)
-   Local: pasta `backups/`
-   Nome: `estoque-auto-YYYY-MM-DD-HH-MM-SS.db`
-   Rotação: mantém **20 backups** automáticos (os mais antigos são removidos)

### Backup manual

Via interface: **⚙️ Admin → 📥 Salvar Backup**  
Via API: `POST /api/admin/backup/criar`

Nome: `estoque-manual-YYYY-MM-DD-HH-MM-SS.db`  
Manuais **nunca** são removidos pela rotação.

### Download instantâneo

Via interface: **⚙️ Admin → ⬇ Baixar Agora**  
Via API: `GET /api/admin/backup`

Usa `VACUUM INTO` — cria snapshot **atômico e consistente** mesmo com o servidor rodando em modo WAL.

### Restauração

Via interface: **⚙️ Admin → ⬆ Restaurar**

1. Upload do arquivo `.db`
2. Validação automática (integridade SQLite + tabelas obrigatórias)
3. Backup de segurança do estado atual (automático)
4. Substituição transacional (rollback se algo falhar)
5. Ajuste dos autoincrementos
6. Logout forçado para novo login

### Restaurar manualmente (externo)

```bash
# 1. Pare o servidor
# 2. Substitua o estoque.db
# 3. Apague estoque.db-wal e estoque.db-shm
# 4. Suba o servidor
```

---

## 🔒 Segurança

### Implementado

| Camada                      | Proteção                                                           |
| --------------------------- | ------------------------------------------------------------------ |
| **Senhas**                  | bcrypt com 10 rounds                                               |
| **Tokens**                  | JWT assinados com secret do `.env`                                 |
| **Rotas**                   | Middleware `autenticar` em tudo, `apenasAdmin` no admin            |
| **Contas**                  | Verificação de `ativo` no middleware (bloqueia contas desativadas) |
| **SQL**                     | Statements preparados (nunca concatenação)                         |
| **Ordenação**               | Whitelist de colunas permitidas                                    |
| **Path traversal**          | `path.basename()` em nomes de arquivo                              |
| **Upload**                  | Multer com limite (200 MB) + extensão `.db`                        |
| **Restauração**             | `PRAGMA integrity_check` + verificação de tabelas                  |
| **Backup antes de restore** | Sempre cria snapshot de segurança                                  |
| **Auto-remoção**            | Admin não pode remover a própria conta                             |
| **Lockout**                 | Não é possível remover o último admin ativo                        |

### Recomendações para produção

-   [ ] Definir `JWT_SECRET` forte e único
-   [ ] Usar HTTPS (nginx / Cloudflare proxy)
-   [ ] Configurar CORS restritivo (não `*`)
-   [ ] Ativar rate limiting nas rotas de login
-   [ ] Rodar atrás de um reverse proxy
-   [ ] Considerar uso de variáveis de ambiente via gerenciador de segredos
-   [ ] Monitoramento de erros (Sentry, etc.)

---

## 🗺️ Roadmap

### Concluído ✅

-   [x] Autenticação JWT + bcrypt
-   [x] CRUD de produtos, categorias e usuários
-   [x] Movimentações com auditoria automática
-   [x] Dashboard com gráficos
-   [x] Relatórios em Excel corporativo
-   [x] Backup automático (12h) + restauração
-   [x] Log de atividades global
-   [x] WebSocket para tempo real
-   [x] Testes automatizados

### Futuro 🔮

-   [ ] 🐳 Docker + docker-compose para deploy
-   [ ] 📱 PWA (funcionar offline, instalar como app)
-   [ ] 🔔 Notificações push quando estoque baixar
-   [ ] 📧 E-mail em falha de backup
-   [ ] 🏷️ Leitor de código de barras com câmera
-   [ ] 📊 Gráficos nativos dentro do Excel (aguardando exceljs)
-   [ ] 🌍 Internacionalização (i18n)
-   [ ] 🔍 Busca fuzzy (FTS5)
-   [ ] 📉 Relatório de previsão de consumo
-   [ ] 🔗 Import de CSV de produtos

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos:

1. **Fork** o projeto
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit suas mudanças: `git commit -m 'feat: adiciona X'`
4. Push: `git push origin feature/minha-feature`
5. Abra um **Pull Request**

### Padrões

-   **Commits:** [Conventional Commits](https://www.conventionalcommits.org/pt-br/)
    -   `feat:` nova funcionalidade
    -   `fix:` correção
    -   `docs:` documentação
    -   `test:` testes
    -   `refactor:` refatoração
    -   `chore:` tarefas de manutenção
-   **Código:** sempre rode `npm test` antes de PR
-   **Estilo:** siga o padrão dos arquivos existentes (arquitetura em camadas)

### Como reportar bugs

Abra uma [issue](https://github.com/seu-usuario/estoque-app/issues) com:

-   Descrição clara do problema
-   Passos para reproduzir
-   Comportamento esperado vs. observado
-   Screenshots (se aplicável)
-   Versão do Node e SO

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👏 Agradecimentos

-   [Node.js](https://nodejs.org/) — pela API `node:sqlite` nativa
-   [Express](https://expressjs.com/) — framework web minimalista
-   [Socket.IO](https://socket.io/) — comunicação em tempo real
-   [Chart.js](https://www.chartjs.org/) — gráficos do dashboard
-   [ExcelJS](https://github.com/exceljs/exceljs) — geração de planilhas
-   [Jest](https://jestjs.io/) + [Supertest](https://github.com/ladjs/supertest) — testes

---

## 📞 Contato

-   **Autor:** Seu Nome
-   **E-mail:** seu@email.com
-   **GitHub:** [@seu-usuario](https://github.com/seu-usuario)

---

<div align="center">

**⭐ Se este projeto foi útil, deixe uma estrela!**

Feito com ☕ e 💙

</div>

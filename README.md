# 📦 Sistema de Estoque

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-29.x-C21325?logo=jest&logoColor=white)
![Helmet](https://img.shields.io/badge/Helmet-7.x-000000?logo=helmet&logoColor=white)
![2FA](https://img.shields.io/badge/2FA-TOTP-success) ![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tests](https://img.shields.io/badge/tests-80%20passing-brightgreen.svg)
![Suites](https://img.shields.io/badge/suites-18%20passing-brightgreen.svg)
![Roles](https://img.shields.io/badge/roles-3%20n%C3%ADveis-blueviolet.svg)

**Sistema web completo de controle de estoque com autenticação JWT, 2FA, auditoria, backup criptografado, tempo real,
relatórios em Excel, painel super-admin com métricas e hierarquia de 3 níveis de acesso.**

[Funcionalidades](#-funcionalidades) • [Instalação](#-instalação) • [Uso](#-uso) • [API](#-api) •
[Arquitetura](#-arquitetura) • [Segurança](#-segurança) • [Testes](#-testes)

</div>

---

## 📋 Sumário

-   [Sobre](#-sobre)
-   [Funcionalidades](#-funcionalidades)
-   [Stack Tecnológica](#-stack-tecnológica)
-   [Instalação](#-instalação)
-   [Uso](#-uso)
-   [Estrutura do Projeto](#-estrutura-do-projeto)
-   [API](#-api)
-   [Arquitetura](#-arquitetura)
-   [Segurança](#-segurança)
-   [Backup e Restauração](#-backup-e-restauração)
-   [Testes](#-testes)
-   [Roadmap](#-roadmap)
-   [Contribuindo](#-contribuindo)
-   [Licença](#-licença)

---

## 🎯 Sobre

Sistema web completo para **gerenciamento de estoque** com foco em **pequenas e médias empresas**. Oferece controle
total sobre produtos, categorias, movimentações e usuários, com **auditoria automática**, **backup criptografado**,
**autenticação em dois fatores**, **relatórios profissionais** e **hierarquia de permissões em 3 níveis**.

**Principais diferenciais:**

-   🔐 **Autenticação JWT + 2FA (TOTP)** com 3 níveis de acesso (`super_admin`, `admin`, `operador`)
-   👑 **Painel Super-Admin** com métricas de CPU/memória, auditoria, alertas e feed em tempo real
-   🛡️ **Hardening de segurança** — Helmet, CSP, rate limiting, account lockout, política de senha forte
-   ⚡ **Atualização em tempo real** via WebSocket
-   📜 **Log de atividades global** com eventos de segurança (`SEC_*`)
-   📊 **Relatórios em página** (impressão PDF) ou **Excel corporativo** com 6 abas
-   💾 **Backup AES-256-GCM** com restauração de 1 clique
-   🎨 **Interface responsiva** com tema claro/escuro (mobile-first)
-   🧪 **80 testes automatizados** passando (7 suítes funcionais + 11 de segurança)

---

## ✨ Funcionalidades

### 🔐 Autenticação e Autorização

-   [x] Login com JWT (access + refresh token)
-   [x] Senhas com hash bcrypt (rounds configuráveis)
-   [x] **Autenticação em dois fatores (TOTP)** — compatível com Google Authenticator, Authy, 1Password
-   [x] **Hierarquia de 3 papéis**: `super_admin` > `admin` > `operador`
-   [x] **Account lockout** após N tentativas falhas (bloqueio temporário)
-   [x] **Política de senha forte** (comprimento, complexidade, blacklist)
-   [x] Troca de senha exigindo senha atual
-   [x] Reset de senha por admin
-   [x] Ativar/desativar contas sem perder histórico
-   [x] **Proteção de super-admin** — admin NUNCA pode editar/remover/resetar senha de super-admin
-   [x] **Proteção do último super-admin** — ninguém pode remover ou rebaixar o último super-admin ativo
-   [x] **Proteção do último admin** — não remove/rebaixa o último admin ativo
-   [x] **Log de ações negadas** (`SEC_ACAO_NEGADA`) para auditoria
-   [x] Refresh token com expiração separada

### 📦 Gestão de Produtos

-   [x] CRUD completo com validações (Zod)
-   [x] SKU único, descrição, preço, estoque mínimo
-   [x] Categoria opcional
-   [x] Status ativo/inativo
-   [x] **Soft delete** com lixeira recuperável
-   [x] **Busca com ranking por relevância** (nome > SKU > descrição)
-   [x] Filtros por categoria, estoque baixo e status
-   [x] Ordenação por coluna (nome, preço, quantidade, ID)
-   [x] Paginação server-side
-   [x] Export CSV
-   [x] **Formatação automática** (título preservando siglas: SSD, USB, HDMI)

### 🏷️ Categorias

-   [x] CRUD completo
-   [x] Contagem de produtos por categoria
-   [x] Remoção não afeta produtos (ficam sem categoria)

### 🔄 Movimentações

-   [x] Entrada (+), saída (−) e ajuste de estoque
-   [x] **Auditoria automática** de toda operação
-   [x] Histórico paginado com filtros (tipo, período)
-   [x] Colunas antes/depois para rastrear variação
-   [x] Snapshot do nome do produto (preserva histórico mesmo após exclusão)
-   [x] Não permite saída maior que o estoque

### 📊 Dashboard

-   [x] 5 KPIs em tempo real (produtos, itens, valor, baixo, zerado)
-   [x] Gráfico de rosca — produtos por categoria
-   [x] Gráfico de barras — top 10 produtos por valor
-   [x] Tabela de alertas de estoque baixo
-   [x] Acessível a **todos os usuários** (operador, admin, super-admin)

### 📈 Relatórios

-   [x] **Relatório em página dedicada** (`relatorio.html`)
    -   Visualiza o conteúdo antes de salvar
    -   Botão **"🖨️ Imprimir / Salvar PDF"** (usa impressão nativa do navegador, formatação A4)
    -   Botão **"📊 Salvar Excel"** (mesmo `.xlsx` de 6 abas)
    -   Layout responsivo (tabela em desktop, cards em mobile)
-   [x] **Export Excel corporativo** com 6 abas:
    -   Resumo Executivo (KPIs + distribuições)
    -   Produtos (lista completa com formatação)
    -   Movimentações (histórico do período)
    -   Top Produtos (ranking com medalhas)
    -   Estoque Baixo (alertas + ações sugeridas)
    -   Gráficos (dados organizados para chart nativo)
-   [x] Export CSV simples
-   [x] Filtro por período

### 👑 Painel Super-Admin

-   [x] Acesso restrito ao papel `super_admin`
-   [x] **KPIs em tempo real**: uptime, memória (RSS/Heap), requisições (1/5/15min), erros 500, WebSocket, tempo médio,
        banco
-   [x] **Gráfico de CPU** (load average, atualiza a cada 10s)
-   [x] **Gráfico de memória** (RSS + Heap, histórico de ~15min)
-   [x] **Alertas automáticos**:
    -   Muitos logins falhos (10+/hora → aviso, 20+ → crítico)
    -   Contas bloqueadas ativas
    -   Produtos sem estoque
    -   Erros 500 na última hora
    -   Backup atrasado (>24h sem backup automático)
    -   Memória do processo elevada (>500MB)
-   [x] **Feed de eventos** em tempo real via WebSocket
-   [x] **Auditoria de segurança sob demanda** (2FA pendente, senhas antigas, admins inativos)
-   [x] Estatísticas agregadas (usuários, logs, produtos na lixeira, acessos negados)
-   [x] **Toast em tempo real** quando ocorre erro 500 no servidor

### 📜 Log de Atividades

-   [x] Registro automático de todas as ações críticas
-   [x] **Logs de segurança** com prefixo `SEC_*`:
    -   `SEC_LOGIN_SUCESSO`, `SEC_LOGIN_FALHA`, `SEC_CONTA_BLOQUEADA`
    -   `SEC_SENHA_ALTERADA`, `SEC_ACESSO_NEGADO`, `SEC_2FA_ATIVADO`
    -   `SEC_2FA_FALHA`, `SEC_AUDITORIA_MANUAL`, `SEC_ACAO_NEGADA`
-   [x] Campos: usuário, ação, entidade, descrição, IP, user-agent, nível
-   [x] Filtros: busca, ação, entidade, nível, período
-   [x] Estatísticas (info/warn/error, últimas 24h, 7d)
-   [x] Limpeza automática de logs antigos (90 dias)

### 💾 Backup e Restauração

-   [x] **Backup criptografado** com AES-256-GCM
-   [x] Backup manual (salva em `backups/`)
-   [x] Backup automático a cada **12 horas** (00:00 e 12:00)
-   [x] Download de snapshot instantâneo (criptografado)
-   [x] Rotação automática (mantém 20 backups)
-   [x] Restauração com **descriptografia automática**
-   [x] Backup de segurança antes de restaurar
-   [x] Validação de integridade do SQLite

### ⚡ Tempo Real

-   [x] WebSocket (Socket.IO) com autenticação JWT
-   [x] Dashboard e listas atualizam automaticamente
-   [x] Feed de eventos no super painel (`sistema:evento`)
-   [x] **Notificações de erro 500 em tempo real** (`sistema:erro`)

### 🎨 Interface

-   [x] Design responsivo (mobile-first)
-   [x] **Cards no celular e tablet**, tabela no desktop
-   [x] Tema claro/escuro persistente
-   [x] Modais, toasts, badges coloridos, skeletons
-   [x] Menu lateral em telas pequenas
-   [x] **Busca com debounce** (350ms) e preservação de estado

### 🛡️ Segurança

-   [x] **Helmet** com CSP customizada
-   [x] **CORS restritivo** (lista de origens permitidas)
-   [x] **Rate limiting** global + agressivo para login
-   [x] **Slow down** progressivo em tentativas repetidas
-   [x] **Validação com Zod** em todos os endpoints
-   [x] **Validação de variáveis de ambiente** no boot
-   [x] **Hash bcrypt** com rounds configuráveis
-   [x] **Error handler** que não vaza stack em produção
-   [x] **Path traversal protection** em uploads e downloads
-   [x] **JWT com issuer** e tipos separados (access/refresh)
-   [x] **Hierarquia de papéis** com `temNivel()` centralizado
-   [x] **Bloqueio de super-admin** por admin no service
-   [x] **Auditoria de ações negadas** em log de segurança

---

## 🛠️ Stack Tecnológica

### Backend

| Tecnologia             | Uso                                    |
| ---------------------- | -------------------------------------- |
| **Node.js 22+**        | Runtime                                |
| **Express 4**          | Framework HTTP                         |
| **node:sqlite**        | Banco de dados nativo (sem compilação) |
| **jsonwebtoken**       | Autenticação JWT                       |
| **bcryptjs**           | Hash de senhas                         |
| **speakeasy**          | Geração/validação de TOTP (2FA)        |
| **qrcode**             | QR Code do 2FA                         |
| **helmet**             | Headers de segurança (CSP, HSTS, etc.) |
| **express-rate-limit** | Rate limiting                          |
| **express-slow-down**  | Delay progressivo                      |
| **zod**                | Validação de schemas                   |
| **socket.io**          | WebSocket                              |
| **exceljs**            | Geração de planilhas                   |
| **multer**             | Upload de arquivos                     |
| **node-cron**          | Agendador de backup                    |
| **dotenv**             | Variáveis de ambiente                  |

### Frontend

| Tecnologia               | Uso                                  |
| ------------------------ | ------------------------------------ |
| **HTML5 + CSS3**         | Estrutura e estilo                   |
| **JavaScript (Vanilla)** | Lógica do cliente                    |
| **Socket.IO Client**     | Tempo real                           |
| **Chart.js**             | Gráficos do dashboard e super painel |

### Testes

| Tecnologia    | Uso            |
| ------------- | -------------- |
| **Jest**      | Test runner    |
| **Supertest** | Testes de HTTP |

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

# 3. Copie o template de variáveis de ambiente
cp .env.example .env

# 4. Gere chaves seguras e cole no .env
node -e "const c=require('crypto');console.log('JWT_SECRET='+c.randomBytes(64).toString('hex'));console.log('BACKUP_ENCRYPTION_KEY='+c.randomBytes(32).toString('hex'));"

# 5. Inicie o servidor em modo desenvolvimento
npm run dev
```

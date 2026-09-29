# 🗺️ Roadmap — Sistema de Estoque

> Documento vivo com o planejamento de melhorias do projeto. Última atualização: **v3.0.0** — Sistema com hierarquia de
> 3 níveis, super-admin e relatórios em página.

---

## 📊 Visão Geral

| Versão     |     Status      | Foco                                          | Data alvo |
| ---------- | :-------------: | --------------------------------------------- | --------- |
| **v3.0.0** |  ✅ Concluído   | Super-admin, hierarquia, relatórios           | Atual     |
| **v3.1.0** | 🔄 Em andamento | Produção (deploy + Docker + backup off-site)  | Mês 1     |
| **v3.2.0** |  📋 Planejado   | Valor de negócio (barcode, e-mail, import)    | Mês 2     |
| **v3.3.0** |  📋 Planejado   | Operação (etiquetas, fornecedores, curva ABC) | Mês 3     |
| **v3.4.0** |  📋 Planejado   | Robustez (migrations, logs, CI/CD)            | Mês 4     |
| **v4.0.0** |    🔮 Futuro    | UX (PWA, Command Palette, push)               | Mês 5     |
| **v4.1.0** |    🔮 Futuro    | Escala (multi-depósito, compras, previsão)    | Mês 6     |

**Legenda:**

-   ✅ Concluído
-   🔄 Em andamento
-   📋 Planejado (curto prazo)
-   🔮 Futuro (médio/longo prazo)

---

## 🎯 Prioridades por Impacto

### 🥇 Top 3 — Maior ROI pelo esforço

|  #  | Melhoria                        | Esforço | Impacto | Tempo estimado  |
| :-: | ------------------------------- | :-----: | :-----: | :-------------: |
|  1  | **Leitor de código de barras**  |  ⭐⭐   | 🔥🔥🔥  | 1 fim de semana |
|  2  | **E-mail de estoque baixo**     |  ⭐⭐   | 🔥🔥🔥  | 1 fim de semana |
|  3  | **Docker + Deploy em produção** |  ⭐⭐   | 🔥🔥🔥  | 1 fim de semana |

**Resultado:** sistema em produção, com operação ágil e reposição proativa.

---

## 📅 Roadmap Detalhado (6 meses)

### 🚀 Mês 1 — v3.1.0 "Produção"

**Objetivo:** sair do `localhost` e ter infraestrutura resiliente.

-   [ ] **Deploy em PaaS** (Render, Railway ou Fly.io)
    -   Reescrever SQLite para Postgres **ou** usar volume persistente
    -   Definir variáveis de ambiente no painel do serviço
    -   Configurar domínio personalizado
-   [ ] **HTTPS obrigatório** (Let's Encrypt ou Cloudflare)
-   [ ] **Docker + docker-compose**
    -   Dockerfile otimizado (`node:22-alpine`)
    -   Volume para `data/` e `backups/`
    -   `.dockerignore` bem feito
-   [ ] **Backup off-site** (S3, Backblaze B2 ou Google Drive)
    -   Enviar backups criptografados para nuvem
    -   Cron noturno (após backup local)
-   [ ] **Monitor de uptime** (UptimeRobot, Better Stack)
    -   Alerta por e-mail/Telegram se cair
-   [ ] **Health check mais rico** (`/health` retorna versão, DB status, última migração)

**Entregável:** sistema acessível em `https://estoque.seudominio.com`, com backup remoto e monitoramento.

---

### 💼 Mês 2 — v3.2.0 "Valor de Negócio"

**Objetivo:** acelerar operação diária e evitar ruptura de estoque.

-   [ ] **Leitor de código de barras com câmera**
    -   Biblioteca: `html5-qrcode` ou `quagga2`
    -   Botão "📷 Escanear" em Produtos e Movimentações
    -   Suporte a EAN-13, Code128, QR Code
-   [ ] **E-mail de estoque baixo**
    -   Biblioteca: `nodemailer`
    -   Cron diário às 8h
    -   Template HTML com lista de produtos críticos
    -   Campo `email_alertas` no usuário admin
-   [ ] **Import de produtos via CSV/Excel**
    -   Biblioteca: `exceljs` (já instalada)
    -   Upload → Preview → Confirmação
    -   Relatório de erros por linha
-   [ ] **Melhorar busca com fuzzy matching**
    -   FTS5 do SQLite (`MATCH` com ranking)
    -   Tolerância a erros de digitação

**Entregável:** cadastro em massa, operação com scanner, avisos automáticos.

---

### 📦 Mês 3 — v3.3.0 "Operação Avançada"

**Objetivo:** ferramentas para gestão de estoque de verdade.

-   [ ] **Etiquetas com código de barras**
    -   Biblioteca: `JsBarcode`
    -   Layout A4 com N etiquetas por folha
    -   Página de impressão dedicada
-   [ ] **Cadastro de Fornecedores**
    -   CRUD completo
    -   Vínculo produto ↔ fornecedor
    -   Histórico de compras por fornecedor
-   [ ] **Curva ABC**
    -   Classificação automática (A: 80% do valor, B: 15%, C: 5%)
    -   Gráfico de Pareto
    -   Filtro na lista de produtos
-   [ ] **Giro de estoque**
    -   Tempo médio entre vendas
    -   Produtos parados há X dias
    -   Alerta de "encalhe"

**Entregável:** gestão profissional de estoque com classificação e histórico.

---

### 🛡️ Mês 4 — v3.4.0 "Robustez"

**Objetivo:** código sustentável, observável e com testes confiáveis.

-   [ ] **Migrations versionadas**
    -   Sistema de `up`/`down` com timestamp
    -   Tabela `migrations` rastreia versão aplicada
    -   Substituir `if column exists` por migrations numeradas
-   [ ] **Logs estruturados** (`pino` ou `winston`)
    -   JSON em produção
    -   Nível configurável por env
    -   Rotação automática
-   [ ] **CI/CD com GitHub Actions**
    -   Roda testes a cada push
    -   Bloqueia merge se falhar
    -   Deploy automático na `main`
-   [ ] **Testes E2E** (Playwright)
    -   Login → cadastro → movimentação → relatório
    -   Smoke test no deploy
-   [ ] **Cobertura de testes > 80%**
-   [ ] **Health check com alerta no Slack/Telegram**

**Entregável:** pipeline automatizado, deploy com confiança.

---

### 🎨 Mês 5 — v4.0.0 "Experiência"

**Objetivo:** tornar o sistema agradável de usar no dia a dia.

-   [ ] **PWA (Progressive Web App)**
    -   `manifest.json` + Service Worker
    -   Instalável no celular (Android + iOS)
    -   Funciona offline (cache de páginas + fila de sync)
-   [ ] **Command Palette (Ctrl+K)**
    -   Busca global de produtos, usuários, ações
    -   Navegação rápida estilo VS Code
-   [ ] **Atalhos de teclado**
    -   `/` busca, `N` novo, `Esc` fecha modal, `?` ajuda
-   [ ] **Notificações push web**
    -   Estoque baixo em tempo real
    -   Alerta de erro no super-admin
-   [ ] **Recuperação de senha por e-mail**
    -   Token de reset com expiração
    -   Página `recuperar-senha.html`
-   [ ] **Sessões ativas / revogar token**
    -   Ver dispositivos logados
    -   Forçar logout remoto

**Entregável:** sistema com UX de produto comercial.

---

### 📈 Mês 6 — v4.1.0 "Escala"

**Objetivo:** funcionalidades avançadas para empresas em crescimento.

-   [ ] **Múltiplos depósitos/lojas**
    -   Estoque por localização
    -   Transferência entre locais
    -   Consolidado + por unidade
-   [ ] **Pedidos de compra**
    -   Sugestão automática (produtos críticos)
    -   Aprovação por admin
    -   Status: aberto → enviado → recebido
-   [ ] **Previsão de consumo**
    -   Média móvel + sazonalidade
    -   Sugestão de quantidade ideal
-   [ ] **Custo médio (FIFO/LIFO)**
    -   Rastreio de custo por entrada
    -   Cálculo automático na saída
    -   Margem por produto
-   [ ] **Integração com NF-e** (se aplicável)
    -   Import de XML de compra
    -   Export de venda

**Entregável:** sistema pronto para operações mais complexas.

---

## 🎁 Extras (quando sobrar tempo)

### Infraestrutura

-   [ ] Health check separado para app e banco
-   [ ] Circuit breaker em chamadas externas
-   [ ] Cache em memória para listas frequentes (`node-cache`)
-   [ ] Compressão de resposta (`compression`)
-   [ ] HTTP/2 no servidor

### Segurança Avançada

-   [ ] Passwordless (WebAuthn)
-   [ ] OAuth2 (Google, Microsoft)
-   [ ] Bloqueio de IPs após N tentativas
-   [ ] Detecção de anomalia (login de local diferente)
-   [ ] Criptografia de campos sensíveis no banco (telefone, e-mail)

### Qualidade

-   [ ] TypeScript (migração gradual)
-   [ ] ESLint + Prettier + Husky
-   [ ] Swagger/OpenAPI (`/api/docs`)
-   [ ] Storybook para componentes UI

### Negócio

-   [ ] Dashboard customizável (drag & drop)
-   [ ] Metas e comissionamento
-   [ ] Relatório de rentabilidade por produto
-   [ ] Multi-empresa (tenancy)

---

## 🎯 Como escolher o próximo passo

Faça 3 perguntas:

1. **O sistema já está em produção?**

    - ❌ Não → **Mês 1** (produção é prioridade absoluta)
    - ✅ Sim → próxima camada

2. **Qual o maior gargalo hoje?**

    - Cadastro lento → **Import CSV** + **Leitor de código**
    - Ruptura de estoque → **E-mail de estoque baixo**
    - Perda de dados → **Backup off-site**
    - Lentidão → **Cache + índices**
    - Bugs escapando → **CI/CD + E2E**

3. **Qual o perfil da operação?**
    - Loja física → **Barcode + Etiquetas + PWA**
    - Depósito grande → **Multi-depósito + Pedidos de compra**
    - E-commerce → **Integração com NF-e + Previsão**

---

## 📊 Métricas de Sucesso

| Métrica                       |   Antes   | Meta v3.2  |  Meta v4.0  |
| ----------------------------- | :-------: | :--------: | :---------: |
| Tempo de cadastro (1 produto) |   ~30s    |    ~5s     |     ~3s     |
| Tempo de movimentação         |   ~15s    |    ~3s     |     ~2s     |
| Cobertura de testes           | 80 testes | 100 testes | 150+ testes |
| Uptime mensal                 |   local   |    99%     |    99.9%    |
| Tempo de resposta médio (API) |     ?     |   <100ms   |    <50ms    |
| Backup off-site               |    ❌     | ✅ diário  | ✅ contínuo |
| Recuperação de desastre       |  manual   |    <1h     |   <15min    |

---

## 🏆 Princípios Norteadores

1. **Produção primeiro** — código que não roda não tem valor
2. **Simplicidade antes de features** — melhor 3 features perfeitas que 10 meia-boca
3. **Usuário no centro** — cada melhoria deve resolver dor real
4. **Segurança é requisito, não feature** — não vira "depois"
5. **Automatize o repetitivo** — CI/CD, backups, alertas

---

## 📝 Notas de versão

### v3.0.0 — Concluída ✅

**Adicionado:**

-   👑 Painel Super-Admin com métricas em tempo real
-   👑 Sistema de alertas automáticos
-   👑 Feed de eventos em tempo real via WebSocket
-   👑 Auditoria de segurança sob demanda
-   🔐 Hierarquia de 3 níveis (super_admin > admin > operador)
-   🔐 Proteção do último super-admin e último admin
-   🔐 Log de ações negadas (`SEC_ACAO_NEGADA`)
-   📄 Relatório em página dedicada com impressão PDF
-   📄 Endpoint `/relatorios/completo`
-   🔍 Ranking de busca por relevância (nome > SKU > descrição)
-   🧪 Suíte `12-repository-leaks.test.js`
-   🧪 80 testes passando (era 70)

**Melhorado:**

-   🔒 `api()` não confunde erro de login com "sessão expirada"
-   🔒 Tratamento específico de `429 Too Many Requests`
-   📊 18 suítes de teste (era 17)

### v2.0.0 — Concluída ✅

-   2FA com TOTP
-   Backup criptografado AES-256-GCM
-   Política de senha forte
-   Account lockout
-   Logs de segurança `SEC_*`

### v1.0.0 — Concluída ✅

-   CRUD de produtos, categorias e usuários
-   Movimentações com auditoria
-   Dashboard com gráficos
-   Autenticação JWT

---

## 📞 Contato e Contribuição

**Encontrou uma melhoria que deveria estar aqui?**

1. Abra uma [issue](https://github.com/seu-usuario/estoque-app/issues)
2. Ou faça um **Pull Request** direto no `ROADMAP.md`
3. Marque com `roadmap` + `priority: alta|média|baixa`

**Convenção de commits relacionados a roadmap:**

-   `feat:` quando implementa item do roadmap
-   `docs(roadmap):` quando atualiza o próprio arquivo
-   `chore(roadmap):` quando reprioriza sem implementar

---

<div align="center">

**Roadmap vivo — atualizado a cada versão significativa**

Feito com ☕ e 💙

</div>

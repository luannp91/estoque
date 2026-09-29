const Database = require("./sqliteShim");
const bcrypt = require("bcryptjs");
const path = require("path");

const dbPath = process.env.DB_PATH || path.resolve(__dirname, "..", "..", "estoque.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ==================== 1. CRIAÇÃO DAS TABELAS ====================
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    papel TEXT NOT NULL DEFAULT 'operador'
        CHECK (papel IN ('admin','operador','super_admin')),
    ativo INTEGER NOT NULL DEFAULT 1,
    ultimo_login DATETIME,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT UNIQUE NOT NULL,
    descricao TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    sku TEXT UNIQUE,
    descricao TEXT,
    preco REAL NOT NULL CHECK (preco >= 0),
    quantidade INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
    estoque_minimo INTEGER NOT NULL DEFAULT 0 CHECK (estoque_minimo >= 0),
    categoria_id INTEGER,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS movimentacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL,
    usuario_id INTEGER,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada','saida','ajuste','cadastro','remocao')),
    quantidade INTEGER NOT NULL,
    quantidade_anterior INTEGER NOT NULL,
    quantidade_nova INTEGER NOT NULL,
    observacao TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS logs_sistema (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    usuario_nome TEXT,
    usuario_papel TEXT,
    acao TEXT NOT NULL,
    entidade TEXT,
    entidade_id INTEGER,
    descricao TEXT,
    ip TEXT,
    user_agent TEXT,
    nivel TEXT NOT NULL DEFAULT 'info' CHECK (nivel IN ('info','warn','error')),
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
  );
`);

// ==================== 2. MIGRAÇÕES ====================

// ---- 2.1 usuarios ----
const colunasUsuario = db
  .prepare("PRAGMA table_info(usuarios)")
  .all()
  .map((c) => c.name);

if (!colunasUsuario.includes("ativo")) {
  db.exec("ALTER TABLE usuarios ADD COLUMN ativo INTEGER NOT NULL DEFAULT 1");
  console.log('🔧 Migração: coluna "ativo" adicionada em usuarios');
}
if (!colunasUsuario.includes("ultimo_login")) {
  db.exec("ALTER TABLE usuarios ADD COLUMN ultimo_login DATETIME");
  console.log('🔧 Migração: coluna "ultimo_login" adicionada em usuarios');
}
if (!colunasUsuario.includes("tentativas_falhas")) {
  db.exec("ALTER TABLE usuarios ADD COLUMN tentativas_falhas INTEGER NOT NULL DEFAULT 0");
  console.log('🔧 Migração: coluna "tentativas_falhas" adicionada em usuarios');
}
if (!colunasUsuario.includes("bloqueado_ate")) {
  db.exec("ALTER TABLE usuarios ADD COLUMN bloqueado_ate DATETIME");
  console.log('🔧 Migração: coluna "bloqueado_ate" adicionada em usuarios');
}
if (!colunasUsuario.includes("ultimo_login_ip")) {
  db.exec("ALTER TABLE usuarios ADD COLUMN ultimo_login_ip TEXT");
  console.log('🔧 Migração: coluna "ultimo_login_ip" adicionada em usuarios');
}
if (!colunasUsuario.includes("senha_alterada_em")) {
  db.exec("ALTER TABLE usuarios ADD COLUMN senha_alterada_em DATETIME");
  console.log('🔧 Migração: coluna "senha_alterada_em" adicionada em usuarios');
}
if (!colunasUsuario.includes("totp_secret")) {
  db.exec("ALTER TABLE usuarios ADD COLUMN totp_secret TEXT");
  console.log('🔧 Migração: coluna "totp_secret" adicionada em usuarios');
}
if (!colunasUsuario.includes("totp_ativo")) {
  db.exec("ALTER TABLE usuarios ADD COLUMN totp_ativo INTEGER NOT NULL DEFAULT 0");
  console.log('🔧 Migração: coluna "totp_ativo" adicionada em usuarios');
}

// ---- 2.1.1 Adicionar 'super_admin' ao CHECK (recria tabela) ----
const schemaUsuario = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='usuarios'").get();

if (schemaUsuario && !schemaUsuario.sql.includes("super_admin")) {
  console.log('🔧 Migração: adicionando papel "super_admin"...');

  db.pragma("foreign_keys = OFF");
  try {
    db.exec(`
            BEGIN TRANSACTION;

            CREATE TABLE usuarios_novo (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                senha_hash TEXT NOT NULL,
                papel TEXT NOT NULL DEFAULT 'operador'
                    CHECK (papel IN ('admin','operador','super_admin')),
                ativo INTEGER NOT NULL DEFAULT 1,
                ultimo_login DATETIME,
                criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                tentativas_falhas INTEGER NOT NULL DEFAULT 0,
                bloqueado_ate DATETIME,
                ultimo_login_ip TEXT,
                senha_alterada_em DATETIME,
                totp_secret TEXT,
                totp_ativo INTEGER NOT NULL DEFAULT 0
            );

            INSERT INTO usuarios_novo
                (id, nome, email, senha_hash, papel, ativo, ultimo_login, criado_em,
                 tentativas_falhas, bloqueado_ate, ultimo_login_ip, senha_alterada_em,
                 totp_secret, totp_ativo)
            SELECT id, nome, email, senha_hash, papel, ativo, ultimo_login, criado_em,
                   tentativas_falhas, bloqueado_ate, ultimo_login_ip, senha_alterada_em,
                   totp_secret, totp_ativo
            FROM usuarios;

            DROP TABLE usuarios;
            ALTER TABLE usuarios_novo RENAME TO usuarios;

            CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

            COMMIT;
        `);
    console.log('   ✅ Papel "super_admin" adicionado');
  } catch (e) {
    console.error("❌ Falha na migração:", e.message);
    try {
      db.exec("ROLLBACK");
    } catch {}
  } finally {
    db.pragma("foreign_keys = ON");
  }
}

// ---- 2.2 produtos (soft delete) ----
const colunasProduto = db
  .prepare("PRAGMA table_info(produtos)")
  .all()
  .map((c) => c.name);

if (!colunasProduto.includes("deletado_em")) {
  db.exec("ALTER TABLE produtos ADD COLUMN deletado_em DATETIME");
  console.log('🔧 Migração: coluna "deletado_em" adicionada em produtos');
}
if (!colunasProduto.includes("deletado_por")) {
  db.exec("ALTER TABLE produtos ADD COLUMN deletado_por INTEGER");
  console.log('🔧 Migração: coluna "deletado_por" adicionada em produtos');
}

// ---- 2.3 movimentacoes (snapshot do nome) ----
const colunasMov = db
  .prepare("PRAGMA table_info(movimentacoes)")
  .all()
  .map((c) => c.name);

if (!colunasMov.includes("produto_nome")) {
  db.exec("ALTER TABLE movimentacoes ADD COLUMN produto_nome TEXT");
  db.exec(`
        UPDATE movimentacoes SET produto_nome = (
            SELECT nome FROM produtos WHERE produtos.id = movimentacoes.produto_id
        ) WHERE produto_nome IS NULL;
    `);
  console.log('🔧 Migração: coluna "produto_nome" adicionada em movimentacoes');
}

// ---- 2.4 logs_sistema ----
const tabelas = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table'")
  .all()
  .map((t) => t.name);
if (!tabelas.includes("logs_sistema")) {
  db.exec(`
        CREATE TABLE logs_sistema (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER,
            usuario_nome TEXT,
            usuario_papel TEXT,
            acao TEXT NOT NULL,
            entidade TEXT,
            entidade_id INTEGER,
            descricao TEXT,
            ip TEXT,
            user_agent TEXT,
            nivel TEXT NOT NULL DEFAULT 'info' CHECK (nivel IN ('info','warn','error')),
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
        );
    `);
  console.log("🔧 Migração: tabela logs_sistema criada");
}

// ==================== 3. ÍNDICES ====================
db.exec(`
    CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
    CREATE INDEX IF NOT EXISTS idx_produtos_deletado ON produtos(deletado_em);
    CREATE INDEX IF NOT EXISTS idx_mov_produto ON movimentacoes(produto_id);
    CREATE INDEX IF NOT EXISTS idx_mov_data ON movimentacoes(criado_em);
    CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
    CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs_sistema(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_logs_data ON logs_sistema(criado_em);
    CREATE INDEX IF NOT EXISTS idx_logs_acao ON logs_sistema(acao);
`);

// ==================== 4. SEED: USUÁRIOS PADRÃO ====================
const ehProducao = process.env.NODE_ENV === "production";
const bcryptRounds = ehProducao ? 12 : 10;

// ---- 4.1 Admin padrão ----
const adminEmail = process.env.ADMIN_EMAIL || "admin@estoque.com";
const adminSenha = process.env.ADMIN_PASSWORD || "admin123";
const adminNome = process.env.ADMIN_NOME || "Administrador";

if (ehProducao && !process.env.ADMIN_PASSWORD) {
  console.warn("⚠️  ADMIN_PASSWORD não definido em produção. Usando padrão INSEGURO!");
}

const adminExiste = db.prepare("SELECT id FROM usuarios WHERE email = ?").get(adminEmail);
if (!adminExiste) {
  const hash = bcrypt.hashSync(adminSenha, bcryptRounds);
  db.prepare(
    `
        INSERT INTO usuarios (nome, email, senha_hash, papel, ativo, senha_alterada_em)
        VALUES (?, ?, ?, 'admin', 1, CURRENT_TIMESTAMP)
    `
  ).run(adminNome, adminEmail, hash);

  console.log(ehProducao ? `👤 Admin criado: ${adminEmail}` : `👤 Admin criado: ${adminEmail} / ${adminSenha}`);
}

// ---- 4.2 Super-admin ----
const superEmail = process.env.SUPER_ADMIN_EMAIL || "dev@estoque.com";
const superSenha = process.env.SUPER_ADMIN_PASSWORD || "dev12345";
const superNome = process.env.SUPER_ADMIN_NOME || "Desenvolvedor";

const superExiste = db.prepare("SELECT id FROM usuarios WHERE email = ?").get(superEmail);
if (!superExiste) {
  const hash = bcrypt.hashSync(superSenha, bcryptRounds);
  db.prepare(
    `
        INSERT INTO usuarios (nome, email, senha_hash, papel, ativo, senha_alterada_em)
        VALUES (?, ?, ?, 'super_admin', 1, CURRENT_TIMESTAMP)
    `
  ).run(superNome, superEmail, hash);

  console.log(
    ehProducao ? `👑 Super-admin criado: ${superEmail}` : `👑 Super-admin criado: ${superEmail} / ${superSenha}`
  );
  console.log("   ⚠️  Altere a senha do super-admin no primeiro login!");
}

// ==================== 5. SEED: CATEGORIAS ====================
const totalCats = db.prepare("SELECT COUNT(*) AS total FROM categorias").get().total;
if (totalCats === 0) {
  const insertCat = db.prepare("INSERT INTO categorias (nome, descricao) VALUES (?, ?)");
  insertCat.run("Informática", "Hardware, periféricos e acessórios de informática");
  insertCat.run("Escritório", "Material de escritório e papelaria");
  insertCat.run("Alimentos", "Café e lanches");
  console.log("📁 Categorias iniciais criadas");
}

// ==================== 6. SEED: PRODUTOS ====================
const totalProdutos = db.prepare("SELECT COUNT(*) AS total FROM produtos").get().total;

if (totalProdutos === 0) {
  const catInfo = db.prepare("SELECT id FROM categorias WHERE nome = ?").get("Informática");
  const catEscritorio = db.prepare("SELECT id FROM categorias WHERE nome = ?").get("Escritório");
  const cat_id_info = catInfo ? catInfo.id : null;
  const cat_id_esc = catEscritorio ? catEscritorio.id : null;

  const produtos = [
    ["Notebook Dell Inspiron 15", "NB-DELL-15", "i5, 8GB RAM, SSD 256GB", 3499.0, 5, 1, cat_id_info],
    ["Notebook Lenovo IdeaPad 3", "NB-LEN-IP3", "Ryzen 5, 8GB, 512GB SSD", 2899.0, 4, 1, cat_id_info],
    ["Notebook Acer Aspire 5", "NB-ACER-A5", "i7, 16GB, SSD 512GB", 4199.0, 5, 1, cat_id_info],
    ["MacBook Air M2", "NB-APP-MBA2", "Apple M2, 8GB, 256GB SSD", 8999.0, 2, 1, cat_id_info],
    ['Monitor LG 24" Full HD', "MN-LG-24", "IPS, 75Hz, HDMI", 799.0, 8, 2, cat_id_info],
    ['Monitor Samsung 27"', "MN-SAM-27", "IPS, 75Hz, HDMI/DP", 1099.0, 6, 2, cat_id_info],
    ['Monitor Dell 32" 4K', "MN-DELL-32", "IPS, 60Hz, USB-C", 2499.0, 2, 1, cat_id_info],
    ["Teclado Mecânico Redragon", "TC-RED-MEC", "Switch Outemu Blue, ABNT2", 249.0, 12, 3, cat_id_info],
    ["Teclado Logitech K380", "TC-LOG-K380", "Bluetooth, multi-dispositivo", 199.0, 10, 3, cat_id_info],
    ["Mouse Logitech MX Master 3", "MS-LOG-MX3", "Sem fio, 4000 DPI", 549.0, 10, 2, cat_id_info],
    ["Mouse Razer DeathAdder", "MS-RAZ-DA", "Gamer, 6400 DPI, RGB", 299.0, 8, 2, cat_id_info],
    ["Mousepad Gamer XL", "MP-GAM-XL", "80x30cm, borda costurada", 79.0, 15, 4, cat_id_info],
    ["Headset HyperX Cloud II", "HS-HX-CL2", "7.1 virtual, USB", 499.0, 7, 2, cat_id_info],
    ["Headset JBL Quantum 100", "HS-JBL-Q100", "P3, microfone removível", 199.0, 4, 3, cat_id_info],
    ["Webcam Logitech C920", "WC-LOG-C920", "Full HD 1080p, USB", 449.0, 8, 2, cat_id_info],
    ["Webcam Razer Kiyo", "WC-RAZ-KIY", "1080p com ring light", 699.0, 3, 1, cat_id_info],
    ["Microfone Blue Yeti", "MC-BL-YETI", "USB, condensador, tri-caps", 899.0, 3, 1, cat_id_info],
    ["Caixa de Som JBL Go 3", "SP-JBL-GO3", "Bluetooth, IP67, 4.2W", 249.0, 5, 2, cat_id_info],
    ["SSD Kingston 480GB", "SSD-KIN-480", 'SATA III, 2.5"', 259.0, 14, 5, cat_id_info],
    ["SSD Samsung 1TB NVMe", "SSD-SAM-1TB", "M.2 NVMe, 980 Pro", 799.0, 5, 2, cat_id_info],
    ["HD Seagate 2TB", "HD-SEA-2TB", "SATA III, 7200 RPM", 449.0, 6, 3, cat_id_info],
    ["Memória RAM 8GB DDR4", "RAM-8-DDR4", "2666MHz, Kingston Fury", 189.0, 14, 5, cat_id_info],
    ["Memória RAM 16GB DDR4", "RAM-16-DDR4", "3200MHz, Corsair Vengeance", 359.0, 6, 3, cat_id_info],
    ["Processador Intel i5-12400F", "CPU-I5-12400F", "6 núcleos, 12 threads", 899.0, 3, 1, cat_id_info],
    ["Processador AMD Ryzen 5 5600", "CPU-R5-5600", "6 núcleos, 12 threads", 849.0, 3, 1, cat_id_info],
    ["Placa-mãe ASUS B450M", "MB-ASUS-B450M", "AM4, DDR4, mATX", 599.0, 4, 2, cat_id_info],
    ["Placa de Vídeo RTX 3060", "GPU-RTX-3060", "12GB GDDR6, ASUS", 2499.0, 2, 1, cat_id_info],
    ["Fonte 500W 80 Plus", "PSU-500W-80", "Corsair CV500, certificada", 329.0, 5, 2, cat_id_info],
    ["Gabinete Gamer Mid Tower", "CASE-MT-GAM", "Vidro temperado, RGB", 349.0, 4, 2, cat_id_info],
    ["Cooler CPU Master Hyper", "COOL-HYPER", "Air cooler, 4 heatpipes", 189.0, 6, 2, cat_id_info],
    ["Pasta Térmica 4g", "PT-4G", "Thermal Grizzly, 4g", 49.0, 10, 4, cat_id_info],
    ["Cabo HDMI 2m", "CAB-HDMI-2M", "2.0, 4K, 60Hz", 39.0, 25, 8, cat_id_info],
    ["Cabo USB-C 1m", "CAB-USBC-1M", "USB-C para USB-C, 60W", 49.0, 15, 5, cat_id_info],
    ["Hub USB 4 portas", "HUB-USB-4", "USB 3.0, com alimentação", 129.0, 8, 3, cat_id_info],
    ["Roteador TP-Link AC1200", "RT-TP-AC1200", "Dual band, 4 antenas", 299.0, 5, 2, cat_id_info],
    ["Switch 8 portas Gigabit", "SW-8-GIG", "TP-Link, plug and play", 199.0, 3, 1, cat_id_info],
    ["Pen Drive 64GB", "PD-64GB", "USB 3.0, Kingston", 59.0, 15, 5, cat_id_info],
    ["Cartão de Memória 128GB", "CM-128GB", "microSD, Classe 10", 129.0, 6, 3, cat_id_info],
    ["Impressora HP DeskJet 2774", "IMP-HP-2774", "Jato de tinta, Wi-Fi", 499.0, 2, 1, cat_id_info],
    ["Cartucho de Tinta Preto HP", "CT-HP-PR", "HP 664, original", 109.0, 8, 3, cat_id_info],
    ["Resma Papel A4 500fls", "PAP-A4-500", "75g, Chamex", 29.0, 10, 5, cat_id_info],
    ["Estabilizador 300VA", "EST-300VA", "Monofásico, 4 tomadas", 189.0, 4, 2, cat_id_info],

    ["Caneta Esferográfica Azul", "CAN-AZ", "BIC Cristal, ponta média", 1.5, 12, 5, cat_id_esc],
    ["Caneta Esferográfica Preta", "CAN-PR", "BIC Cristal, ponta média", 1.5, 12, 5, cat_id_esc],
    ["Lápis Preto HB", "LAP-HB", "Faber-Castell, nº 2", 1.2, 10, 4, cat_id_esc],
    ["Borracha Branca", "BOR-BR", "Faber-Castell, pequena", 2.0, 8, 3, cat_id_esc],
    ["Apontador", "APO-01", "Com depósito, metálico", 3.5, 6, 2, cat_id_esc],
    ["Marca-texto Amarelo", "MAR-AM", "Ponta chanfrada, fluorecente", 4.5, 8, 3, cat_id_esc],
    ["Marca-texto Verde", "MAR-VD", "Ponta chanfrada, fluorecente", 4.5, 6, 3, cat_id_esc],
    ["Corretivo Líquido", "COR-LQ", "Branco, secagem rápida", 6.9, 5, 2, cat_id_esc],
    ["Grampeador Médio", "GRA-MD", "Capacidade 25 folhas", 24.9, 4, 2, cat_id_esc],
    ["Grampos 26/6 (caixa)", "GRA-266", "Caixa com 5000 unidades", 8.5, 10, 5, cat_id_esc],
    ["Clips Nº 2/0 (cx 100)", "CLI-200", "Aço niquelado, caixa 100", 9.9, 8, 3, cat_id_esc],
    ["Perfurador de Papel", "PER-01", "2 furos, capacidade 20fls", 34.9, 3, 1, cat_id_esc],
    ["Tesoura sem ponta", "TES-SP", "Uso escolar, 21cm", 12.9, 6, 2, cat_id_esc],
    ["Estilete", "EST-01", "Lâmina retrátil, cabo zinc", 7.9, 4, 2, cat_id_esc],
    ["Cola Branca 90g", "COL-BR", "Tenaz, lavável", 5.9, 6, 3, cat_id_esc],
    ["Cola em Bastão", "COL-BS", "9g, não tóxica", 3.5, 10, 5, cat_id_esc],
    ["Fita Adesiva Transparente", "FIT-TR", "12mm x 40m", 2.9, 10, 5, cat_id_esc],
    ["Fita Crepe", "FIT-CR", "24mm x 50m", 5.5, 6, 3, cat_id_esc],
    ["Post-it 76x76", "POS-76", "Bloco 100 folhas, amarelo", 8.9, 8, 4, cat_id_esc],
    ["Bloco Anotações A5", "BLO-A5", "Pautado, 100 folhas", 9.9, 5, 2, cat_id_esc],
    ["Caderno Universitário 10 mat", "CAD-10M", "Capa dura, 200 folhas", 24.9, 4, 2, cat_id_esc],
    ["Pasta Catálogo 50 plásticos", "PAS-CT", "Ofício, capa dura", 29.9, 4, 2, cat_id_esc],
    ["Pasta Suspensa", "PAS-SU", "Kraft, com pêndulo", 4.5, 6, 3, cat_id_esc],
    ["Envelope Ofício", "ENV-OF", "Kraft, 34x25cm", 0.8, 14, 5, cat_id_esc],
    ["Papel Sulfite A4 (resma)", "PAP-A4", "75g, 500 folhas", 28.9, 5, 3, cat_id_esc],
    ["Bloco Recibo", "BLO-RC", "2 vias, 50 jogos", 6.9, 3, 1, cat_id_esc],
    ["Calculadora 12 dígitos", "CAL-12", "De mesa, solar", 34.9, 4, 2, cat_id_esc],
    ["Régua 30cm", "REG-30", "Acrílico cristal", 3.5, 6, 2, cat_id_esc],
    ["Marcador Permanente Preto", "MAR-PR", "Ponta grossa, à prova d'água", 5.9, 5, 2, cat_id_esc],
    ["Suporte para Papel", "SUP-PA", "Metálico, regulável", 39.9, 2, 1, cat_id_esc]
  ];

  const insert = db.prepare(`
        INSERT INTO produtos (nome, sku, descricao, preco, quantidade, estoque_minimo, categoria_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

  const inserirTodos = db.transaction((itens) => {
    for (const p of itens) insert.run(...p);
  });

  inserirTodos(produtos);

  const info = produtos.filter((p) => p[6] === cat_id_info);
  const esc = produtos.filter((p) => p[6] === cat_id_esc);
  const itensInfo = info.reduce((s, p) => s + p[4], 0);
  const itensEsc = esc.reduce((s, p) => s + p[4], 0);

  console.log(`📦 Seed: ${produtos.length} produtos cadastrados`);
  console.log(`   🖥️  Informática: ${info.length} produtos, ${itensInfo} itens`);
  console.log(`   📎  Escritório:  ${esc.length} produtos, ${itensEsc} itens`);
}

module.exports = db;

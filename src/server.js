require("dotenv").config();
const envConfig = require("./config/env");
envConfig.validar();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const path = require("path");
const cookieParser = require("cookie-parser");

const errorHandler = require("./middlewares/errorHandler");
const security = require("./middlewares/security");
const metricsService = require("./services/metricsService");
const backupJob = require("./jobs/backupJob");
const realtimeService = require("./services/realtimeService");
const env = require("./config/env");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// ==================== SEGURANÇA ====================
app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(security.helmetMiddleware());
app.use(security.corsMiddleware());

// ==================== TELEMETRIA ====================
app.use((req, res, next) => {
    const inicio = Date.now();
    res.on("finish", () => {
        if (req.path.startsWith("/api/super-admin") || req.path.startsWith("/socket.io")) return;

        metricsService.registrarRequisicao({
            metodo: req.method,
            path: req.path,
            status: res.statusCode,
            duracao: Date.now() - inicio
        });
    });
    next();
});

// ==================== BODY ====================
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());

// ==================== RATE LIMIT ====================
app.use("/api", security.limiterGlobal());

// ==================== ESTÁTICOS ====================
app.use(
    express.static(path.join(__dirname, "..", "public"), {
        maxAge: env.isProducao ? "7d" : 0,
        etag: true,
        index: false
    })
);

// ==================== ROTAS ====================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/produtos", require("./routes/produtoRoutes"));
app.use("/api/categorias", require("./routes/categoriaRoutes"));
app.use("/api/movimentacoes", require("./routes/movimentacaoRoutes"));
app.use("/api/relatorios", require("./routes/relatorioRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/logs", require("./routes/logRoutes"));
app.use("/api/super-admin", require("./routes/superAdminRoutes"));

// ==================== HEALTH ====================
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        uptime: Math.floor(process.uptime()),
        versao: require("../package.json").version,
        env: env.env
    });
});

// ==================== SPA ====================
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// ==================== ERROS ====================
app.use(errorHandler);

// ==================== SOCKET.IO ====================
const io = new Server(server, {
    cors: {
        origin: env.corsOrigins.length ? env.corsOrigins : ["http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Token não informado."));
    try {
        socket.usuario = jwt.verify(token, env.jwtSecret, { issuer: "estoque-app" });
        next();
    } catch {
        next(new Error("Token inválido."));
    }
});

realtimeService.init(io);

// ==================== CRON ====================
backupJob.iniciar();

// ==================== START ====================
server.listen(PORT, () => {
    console.log(`✅ Servidor: http://localhost:${PORT}`);
    console.log(`⚡ WebSocket pronto`);
    console.log(`🔒 Segurança ativa`);
    console.log(`📊 Telemetria ativa`);
});

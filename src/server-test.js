require("dotenv").config();
const express = require("express");
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandler");
const security = require("./middlewares/security");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

// ✅ Aplica Helmet + CSP
app.use(security.helmetMiddleware());

// ✅ Aplica CORS com validação de origem
app.use(security.corsMiddleware());

// Body parsers com limites
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

// Rate limiting global (o mesmo do servidor real)
app.use("/api", security.limiterGlobal());

// ==================== ROTAS ====================
app.get("/health", (req, res) => {
    res.json({ status: "ok", uptime: Math.floor(process.uptime()) });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/produtos", require("./routes/produtoRoutes"));
app.use("/api/categorias", require("./routes/categoriaRoutes"));
app.use("/api/movimentacoes", require("./routes/movimentacaoRoutes"));
app.use("/api/relatorios", require("./routes/relatorioRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/logs", require("./routes/logRoutes"));

app.use(errorHandler);

module.exports = app;

const express = require("express");
const ctrl = require("../controllers/relatorioController");
const { autenticar, apenasAdmin } = require("../middlewares/auth");
const { limiterPesado } = require("../middlewares/security");

const router = express.Router();

// 🔓 Rotas liberadas para OPERADOR (usado no dashboard)
router.get("/dashboard", autenticar, ctrl.dashboard);

// 🔒 A partir daqui, tudo exige ADMIN ou SUPER-ADMIN
router.use(autenticar, apenasAdmin);

router.get("/movimentacoes", ctrl.movimentacoesPeriodo);
router.get("/completo", ctrl.completo);
router.get("/exportar-excel", limiterPesado(), ctrl.exportarExcel);

module.exports = router;

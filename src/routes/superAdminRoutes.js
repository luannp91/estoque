const express = require("express");
const ctrl = require("../controllers/superAdminController");
const { autenticar, apenasSuperAdmin } = require("../middlewares/auth");
const { limiterPesado } = require("../middlewares/security");

const router = express.Router();

// 🔒 Todas as rotas exigem SUPER-ADMIN
router.use(autenticar, apenasSuperAdmin);

router.get("/metricas", ctrl.metricas);
router.get("/auditoria", ctrl.auditoria);
router.get("/alertas", ctrl.alertas);
router.get("/eventos", ctrl.eventosRecentes);
router.post("/auditar", limiterPesado(), ctrl.auditar);

module.exports = router;

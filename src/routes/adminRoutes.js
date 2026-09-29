const express = require("express");
const ctrl = require("../controllers/adminController");
const backupCtrl = require("../controllers/backupController");
const { autenticar, apenasAdmin } = require("../middlewares/auth");
const { limiterPesado, limiterEscrita } = require("../middlewares/security");
const { validate, Schemas, z } = require("../middlewares/validate");

const router = express.Router();
router.use(autenticar, apenasAdmin);

// ==================== ESTATÍSTICAS ====================
router.get("/estatisticas", ctrl.estatisticas);

// ==================== USUÁRIOS ====================
router.get("/usuarios", validate({ query: Schemas.usuario.filtros }), ctrl.listar);
router.get("/usuarios/:id", validate({ params: z.object({ id: Schemas.id }) }), ctrl.buscar);

router.post("/usuarios", limiterEscrita(), validate({ body: Schemas.usuario.criar }), ctrl.criar);

router.put(
    "/usuarios/:id",
    limiterEscrita(),
    validate({ params: z.object({ id: Schemas.id }), body: Schemas.usuario.atualizar }),
    ctrl.atualizar
);

router.delete("/usuarios/:id", validate({ params: z.object({ id: Schemas.id }) }), ctrl.remover);

router.patch(
    "/usuarios/:id/senha",
    validate({ params: z.object({ id: Schemas.id }), body: Schemas.usuario.resetSenha }),
    ctrl.resetarSenha
);

// ==================== BACKUP ====================
router.get("/backup/info", backupCtrl.info);
router.get("/backup/lista", backupCtrl.listar);
router.get("/backup", limiterPesado(), backupCtrl.baixar);
router.post("/backup/criar", limiterPesado(), backupCtrl.criarManual);
router.get("/backup/:nome/baixar", backupCtrl.baixarPorNome);
router.delete("/backup/:nome", backupCtrl.remover);

// ==================== RESTORE ====================
router.post("/restore/validar", limiterPesado(), backupCtrl.uploadMiddleware, backupCtrl.validarUpload);
router.post("/restore", limiterPesado(), backupCtrl.uploadMiddleware, backupCtrl.restaurar);

module.exports = router;

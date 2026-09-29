const express = require("express");
const ctrl = require("../controllers/logController");
const { autenticar, apenasAdmin } = require("../middlewares/auth");
const { validate, Schemas } = require("../middlewares/validate");

const router = express.Router();

router.use(autenticar, apenasAdmin);

router.get("/", validate({ query: Schemas.log.filtros }), ctrl.listar);
router.get("/estatisticas", ctrl.estatisticas);
router.get("/filtros", ctrl.filtros);
router.delete("/limpar", ctrl.limpar);

module.exports = router;

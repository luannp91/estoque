const express = require("express");
const ctrl = require("../controllers/movimentacaoController");
const { autenticar } = require("../middlewares/auth");
const { validate, Schemas } = require("../middlewares/validate");

const router = express.Router();
router.use(autenticar);

router.get("/", validate({ query: Schemas.movimentacao.filtros }), ctrl.listar);

module.exports = router;

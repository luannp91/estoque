const express = require("express");
const ctrl = require("../controllers/categoriaController");
const { autenticar, apenasAdmin } = require("../middlewares/auth");
const { limiterEscrita } = require("../middlewares/security");
const { validate, Schemas, z } = require("../middlewares/validate");

const router = express.Router();
router.use(autenticar);

router.get("/", ctrl.listar);

router.post("/", apenasAdmin, limiterEscrita(), validate({ body: Schemas.categoria.criar }), ctrl.criar);

router.put(
    "/:id",
    apenasAdmin,
    validate({ params: z.object({ id: Schemas.id }), body: Schemas.categoria.criar }),
    ctrl.atualizar
);

router.delete("/:id", apenasAdmin, validate({ params: z.object({ id: Schemas.id }) }), ctrl.remover);

module.exports = router;

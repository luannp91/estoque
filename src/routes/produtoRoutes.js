const express = require("express");
const ctrl = require("../controllers/produtoController");
const { autenticar, apenasAdmin } = require("../middlewares/auth");
const { limiterEscrita } = require("../middlewares/security");
const { validate, Schemas, z } = require("../middlewares/validate");

const router = express.Router();
router.use(autenticar);

// ==================== LIXEIRA ====================
router.get("/lixeira/count", ctrl.contarLixeira);

router.get("/lixeira", validate({ query: Schemas.paginacao }), ctrl.listarLixeira);

router.post("/lixeira/esvaziar", apenasAdmin, ctrl.esvaziarLixeira);
router.post("/lixeira/purgar", apenasAdmin, ctrl.purgarLixeira);

router.post("/:id/restaurar", apenasAdmin, validate({ params: z.object({ id: Schemas.id }) }), ctrl.restaurar);

// ==================== CRUD ====================
// 🎯 LISTAGEM: usa schema específico com todos os filtros
router.get("/", validate({ query: Schemas.produto.filtros }), ctrl.listar);

router.get("/:id", validate({ params: z.object({ id: Schemas.id }) }), ctrl.buscar);

router.post("/", limiterEscrita(), validate({ body: Schemas.produto.criar }), ctrl.criar);

router.put(
    "/:id",
    apenasAdmin,
    limiterEscrita(),
    validate({ params: z.object({ id: Schemas.id }), body: Schemas.produto.atualizar }),
    ctrl.atualizar
);

router.delete("/:id", apenasAdmin, validate({ params: z.object({ id: Schemas.id }) }), ctrl.remover);

// ==================== MOVIMENTAÇÕES ====================
router.patch(
    "/:id/entrada",
    limiterEscrita(),
    validate({ params: z.object({ id: Schemas.id }), body: Schemas.produto.movimentacao }),
    ctrl.entrada
);

router.patch(
    "/:id/saida",
    limiterEscrita(),
    validate({ params: z.object({ id: Schemas.id }), body: Schemas.produto.movimentacao }),
    ctrl.saida
);

router.patch(
    "/:id/ajuste",
    limiterEscrita(),
    validate({
        params: z.object({ id: Schemas.id }),
        body: z.object({
            quantidade: z.coerce.number().int().min(0).max(999999),
            observacao: z.string().trim().max(500).optional().nullable()
        })
    }),
    ctrl.ajuste
);

module.exports = router;

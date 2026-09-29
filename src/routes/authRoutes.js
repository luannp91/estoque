const express = require("express");
const ctrl = require("../controllers/authController");
const { autenticar } = require("../middlewares/auth");
const { limiterAuth, slowDownAuth } = require("../middlewares/security");
const { validate, Schemas } = require("../middlewares/validate");

const router = express.Router();

// ==================== PÚBLICAS (com rate limit agressivo) ====================
router.post("/login", limiterAuth(), slowDownAuth(), validate({ body: Schemas.auth.login }), ctrl.login);

router.post("/registrar", limiterAuth(), validate({ body: Schemas.auth.registrar }), ctrl.registrar);

router.post("/refresh", ctrl.refresh);

// ==================== PROTEGIDAS ====================
router.get("/me", autenticar, ctrl.me);
router.post("/logout", autenticar, ctrl.logout);

router.post(
    "/trocar-senha",
    autenticar,
    validate({
        body: require("../middlewares/validate").z.object({
            senhaAtual: require("../middlewares/validate").z.string().min(1).max(200),
            novaSenha: require("../middlewares/validate").z.string().min(8).max(200)
        })
    }),
    ctrl.trocarSenha
);

// ==================== 2FA ====================
router.post("/2fa/iniciar", autenticar, ctrl.iniciar2FA);

router.post(
    "/2fa/confirmar",
    autenticar,
    validate({
        body: require("../middlewares/validate").z.object({
            codigo: require("../middlewares/validate").z.string().min(6).max(6)
        })
    }),
    ctrl.confirmar2FA
);

router.post(
    "/2fa/desativar",
    autenticar,
    validate({
        body: require("../middlewares/validate").z.object({
            senha: require("../middlewares/validate").z.string().min(1).max(200)
        })
    }),
    ctrl.desativar2FA
);

module.exports = router;

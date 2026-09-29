const EstoqueService = require("../services/estoqueService");
const service = new EstoqueService();

// ==================== LISTAR / BUSCAR ====================
exports.listar = (req, res, next) => {
    try {
        res.json(
            service.listar({
                busca: req.query.busca,
                categoria_id: req.query.categoria_id ? Number(req.query.categoria_id) : null,
                estoque_baixo: req.query.estoque_baixo,
                apenas_ativos: req.query.apenas_ativos,
                ordenar: req.query.ordenar,
                ordem: req.query.ordem,
                pagina: Number(req.query.pagina) || 1,
                limite: Number(req.query.limite) || 10
            })
        );
    } catch (e) {
        next(e);
    }
};

exports.buscar = (req, res, next) => {
    try {
        res.json(service.buscar(Number(req.params.id)));
    } catch (e) {
        next(e);
    }
};

// ==================== CRUD ====================
exports.criar = (req, res, next) => {
    try {
        res.status(201).json(service.criar(req.body, req));
    } catch (e) {
        next(e);
    }
};

exports.atualizar = (req, res, next) => {
    try {
        res.json(service.atualizar(Number(req.params.id), req.body, req));
    } catch (e) {
        next(e);
    }
};

exports.remover = (req, res, next) => {
    try {
        service.remover(Number(req.params.id), req);
        res.status(204).send();
    } catch (e) {
        next(e);
    }
};

// ==================== MOVIMENTAÇÕES ====================
exports.entrada = (req, res, next) => {
    try {
        const { quantidade, observacao } = req.body;
        res.json(service.entrada(Number(req.params.id), quantidade, observacao, req));
    } catch (e) {
        next(e);
    }
};

exports.saida = (req, res, next) => {
    try {
        const { quantidade, observacao } = req.body;
        res.json(service.saida(Number(req.params.id), quantidade, observacao, req));
    } catch (e) {
        next(e);
    }
};

exports.ajuste = (req, res, next) => {
    try {
        const { quantidade, observacao } = req.body;
        res.json(service.ajuste(Number(req.params.id), quantidade, observacao, req));
    } catch (e) {
        next(e);
    }
};

// ==================== LIXEIRA ====================
exports.listarLixeira = (req, res, next) => {
    try {
        res.json(
            service.listarLixeira({
                pagina: Number(req.query.pagina) || 1,
                limite: Number(req.query.limite) || 20
            })
        );
    } catch (e) {
        next(e);
    }
};

/** 🆕 Conta produtos na lixeira (para o badge) */
exports.contarLixeira = (req, res, next) => {
    try {
        const r = service.listarLixeira({ pagina: 1, limite: 1 });
        res.json({ total: r.total });
    } catch (e) {
        next(e);
    }
};

exports.restaurar = (req, res, next) => {
    try {
        res.json(service.restaurar(Number(req.params.id), req));
    } catch (e) {
        next(e);
    }
};

exports.purgarLixeira = (req, res, next) => {
    try {
        const dias = Number(req.query.dias) || 90;
        const removidos = service.purgarLixeira(dias, req);
        res.json({ ok: true, removidos });
    } catch (e) {
        next(e);
    }
};

/** 🆕 Esvazia TUDO da lixeira permanentemente */
exports.esvaziarLixeira = (req, res, next) => {
    try {
        const removidos = service.esvaziarLixeira(req);
        res.json({ ok: true, removidos });
    } catch (e) {
        next(e);
    }
};

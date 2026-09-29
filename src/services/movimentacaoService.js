const MovimentacaoRepository = require("../repositories/movimentacaoRepository");

class MovimentacaoService {
    constructor() {
        this.repo = new MovimentacaoRepository();
    }

    listar(filtros) {
        return this.repo.listar({
            produto_id: filtros.produto_id ? Number(filtros.produto_id) : null,
            tipo: filtros.tipo || null,
            data_inicio: filtros.data_inicio || null,
            data_fim: filtros.data_fim || null,
            pagina: Number(filtros.pagina) || 1,
            limite: Number(filtros.limite) || 20
        });
    }
}
module.exports = MovimentacaoService;

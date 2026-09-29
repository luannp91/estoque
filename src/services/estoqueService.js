const ProdutoRepository = require("../repositories/produtoRepository");
const MovimentacaoRepository = require("../repositories/movimentacaoRepository");
const LogService = require("./logService");

let realtime;
try {
    realtime = require("./realtimeService");
} catch {
    realtime = { emit: () => {} };
}

// 📋 Siglas que SEMPRE ficam em MAIÚSCULO
const SIGLAS = new Set([
    "SSD",
    "HDD",
    "NVME",
    "SATA",
    "CPU",
    "GPU",
    "RAM",
    "ROM",
    "DDR",
    "DDR2",
    "DDR3",
    "DDR4",
    "DDR5",
    "RTX",
    "GTX",
    "PSU",
    "ATX",
    "MATX",
    "ITX",
    "USB",
    "HDMI",
    "VGA",
    "DVI",
    "DP",
    "RJ45",
    "LCD",
    "LED",
    "OLED",
    "QLED",
    "IPS",
    "TN",
    "VA",
    "GB",
    "TB",
    "MB",
    "KB",
    "MHZ",
    "GHZ",
    "DPI",
    "WIFI",
    "LAN",
    "WAN",
    "IP",
    "RGB",
    "ARGB"
]);

class EstoqueService {
    constructor() {
        this.produtos = new ProdutoRepository();
        this.movs = new MovimentacaoRepository();
        this.log = new LogService();
    }

    listar(filtros) {
        return this.produtos.listar(filtros);
    }

    buscar(id) {
        const p = this.produtos.porId(id);
        if (!p) throw this._erro("Produto não encontrado.", 404);
        return p;
    }

    criar(dados, req) {
        const usuario = req?.usuario;
        dados = this._normalizarProduto(dados);

        // Ao CRIAR, a quantidade é obrigatória
        this._validar(dados, { exigirQuantidade: true });

        if (dados.sku && this.produtos.porSku(dados.sku)) {
            throw this._erro("SKU já cadastrado.", 409);
        }

        const produto = this.produtos.criar(dados);

        this.movs.registrar({
            produto_id: produto.id,
            usuario_id: usuario?.id,
            tipo: "cadastro",
            quantidade: produto.quantidade,
            quantidade_anterior: 0,
            quantidade_nova: produto.quantidade,
            observacao: "Cadastro inicial"
        });

        this.log.registrar({
            req,
            acao: "produto_criar",
            entidade: "produto",
            entidade_id: produto.id,
            descricao: `Criou produto "${produto.nome}" (Qtd: ${produto.quantidade})`
        });

        this._emit("produto:criado", produto.toJSON());
        return produto;
    }

    atualizar(id, dados, req) {
        const atual = this.buscar(id);
        dados = this._normalizarProduto(dados);

        // Ao EDITAR, a quantidade NÃO é obrigatória (não muda)
        this._validar(dados, { exigirQuantidade: false });

        if (dados.sku && dados.sku !== atual.sku && this.produtos.porSku(dados.sku)) {
            throw this._erro("SKU já cadastrado.", 409);
        }
        const p = this.produtos.atualizar(id, dados);

        this.log.registrar({
            req,
            acao: "produto_atualizar",
            entidade: "produto",
            entidade_id: id,
            descricao: `Atualizou produto "${p.nome}"`
        });

        this._emit("produto:atualizado", p.toJSON());
        return p;
    }

    remover(id, req) {
        const usuario = req?.usuario;
        const p = this.buscar(id);

        if (p.deletado) throw this._erro("Produto já está na lixeira.", 400);

        this.produtos.marcarComoDeletado(id, usuario?.id);

        this.movs.registrar({
            produto_id: id,
            usuario_id: usuario?.id,
            tipo: "remocao",
            quantidade: p.quantidade,
            quantidade_anterior: p.quantidade,
            quantidade_nova: 0,
            observacao: `Produto "${p.nome}" movido para lixeira`
        });

        this.log.registrar({
            req,
            acao: "produto_remover",
            entidade: "produto",
            entidade_id: id,
            descricao: `Moveu produto "${p.nome}" para lixeira`,
            nivel: "warn"
        });

        this._emit("produto:removido", { id });
        return true;
    }

    restaurar(id, req) {
        const usuario = req?.usuario;
        const p = this.buscar(id);

        if (!p.deletado) throw this._erro("Este produto não está na lixeira.", 400);

        this.produtos.restaurar(id);
        const restaurado = this.buscar(id);

        this.movs.registrar({
            produto_id: id,
            usuario_id: usuario?.id,
            tipo: "ajuste",
            quantidade: p.quantidade,
            quantidade_anterior: p.quantidade,
            quantidade_nova: p.quantidade,
            observacao: `Produto "${p.nome}" restaurado da lixeira`
        });

        this.log.registrar({
            req,
            acao: "produto_restaurar",
            entidade: "produto",
            entidade_id: id,
            descricao: `Restaurou produto "${p.nome}" da lixeira`
        });

        this._emit("produto:atualizado", restaurado.toJSON());
        return restaurado;
    }

    listarLixeira(filtros = {}) {
        return this.produtos.listarLixeira({
            pagina: Number(filtros.pagina) || 1,
            limite: Number(filtros.limite) || 20
        });
    }

    purgarLixeira(dias = 90, req) {
        const removidos = this.produtos.purgarAntigos(dias);
        this.log.registrar({
            req,
            acao: "lixeira_purgar",
            entidade: "sistema",
            descricao: `Purgou ${removidos} produto(s) da lixeira com mais de ${dias} dias`,
            nivel: "warn"
        });
        return removidos;
    }

    esvaziarLixeira(req) {
        const removidos = this.produtos.esvaziarTudo();
        this.log.registrar({
            req,
            acao: "lixeira_esvaziar",
            entidade: "sistema",
            descricao: `Esvaziou a lixeira (${removidos} produto(s) removido(s) permanentemente)`,
            nivel: "warn"
        });
        this._emit("produto:removido", { esvaziou: true });
        return removidos;
    }

    entrada(id, quantidade, observacao, req) {
        const usuario = req?.usuario;
        const p = this.buscar(id);
        const q = this._qtdPositiva(quantidade);
        observacao = this._sentenca(observacao);

        const nova = p.quantidade + q;
        const atualizado = this.produtos.atualizarQuantidade(id, nova);

        this.movs.registrar({
            produto_id: id,
            usuario_id: usuario?.id,
            tipo: "entrada",
            quantidade: q,
            quantidade_anterior: p.quantidade,
            quantidade_nova: nova,
            observacao
        });

        this.log.registrar({
            req,
            acao: "estoque_entrada",
            entidade: "produto",
            entidade_id: id,
            descricao: `Entrada de ${q} un. em "${p.nome}" (${p.quantidade} → ${nova})`
        });

        this._emit("produto:movimentado", { id, tipo: "entrada", quantidade: q, atual: atualizado.toJSON() });
        this._emit("movimentacao:criada", { produto_id: id });
        return atualizado;
    }

    saida(id, quantidade, observacao, req) {
        const usuario = req?.usuario;
        const p = this.buscar(id);
        const q = this._qtdPositiva(quantidade);
        observacao = this._sentenca(observacao);

        if (p.quantidade < q) throw this._erro("Estoque insuficiente.", 400);

        const nova = p.quantidade - q;
        const atualizado = this.produtos.atualizarQuantidade(id, nova);

        this.movs.registrar({
            produto_id: id,
            usuario_id: usuario?.id,
            tipo: "saida",
            quantidade: q,
            quantidade_anterior: p.quantidade,
            quantidade_nova: nova,
            observacao
        });

        this.log.registrar({
            req,
            acao: "estoque_saida",
            entidade: "produto",
            entidade_id: id,
            descricao: `Saída de ${q} un. de "${p.nome}" (${p.quantidade} → ${nova})`
        });

        this._emit("produto:movimentado", { id, tipo: "saida", quantidade: q, atual: atualizado.toJSON() });
        this._emit("movimentacao:criada", { produto_id: id });
        return atualizado;
    }

    ajuste(id, novaQuantidade, observacao, req) {
        const usuario = req?.usuario;
        const p = this.buscar(id);
        const q = Number(novaQuantidade);
        if (!Number.isInteger(q) || q < 0) throw this._erro("Quantidade inválida.", 400);

        observacao = this._sentenca(observacao) || "Ajuste manual de estoque";

        const atualizado = this.produtos.atualizarQuantidade(id, q);

        this.movs.registrar({
            produto_id: id,
            usuario_id: usuario?.id,
            tipo: "ajuste",
            quantidade: Math.abs(q - p.quantidade),
            quantidade_anterior: p.quantidade,
            quantidade_nova: q,
            observacao
        });

        this.log.registrar({
            req,
            acao: "estoque_ajuste",
            entidade: "produto",
            entidade_id: id,
            descricao: `Ajuste de "${p.nome}": ${p.quantidade} → ${q}`,
            nivel: "warn"
        });

        this._emit("produto:atualizado", atualizado.toJSON());
        this._emit("movimentacao:criada", { produto_id: id });
        return atualizado;
    }

    estatisticas() {
        return this.produtos.estatisticas();
    }
    topPorValor(l) {
        return this.produtos.topPorValor(l);
    }
    porCategoria() {
        return this.produtos.porCategoria();
    }

    // ==================== NORMALIZAÇÃO ====================
    _normalizarProduto(dados) {
        if (dados.nome !== undefined) dados.nome = this._titulo(dados.nome);
        if (dados.sku) dados.sku = this._sku(dados.sku);
        else if (dados.sku === "") dados.sku = null;
        if (dados.descricao !== undefined) dados.descricao = this._sentenca(dados.descricao);
        return dados;
    }

    _protegerSiglas(texto) {
        const siglas = [];
        const protegido = String(texto).replace(/\p{L}+/gu, (palavra) => {
            const upper = palavra.toUpperCase();
            if (SIGLAS.has(upper)) {
                const idx = siglas.push(upper) - 1;
                return `\u0001${idx}\u0001`;
            }
            if (/^[A-ZÀ-Ý]{2,5}$/.test(palavra)) {
                const idx = siglas.push(palavra) - 1;
                return `\u0001${idx}\u0001`;
            }
            return palavra;
        });
        return { protegido, siglas };
    }

    _restaurarSiglas(texto, siglas) {
        return String(texto).replace(/\u0001(\d+)\u0001/g, (m, i) => siglas[Number(i)]);
    }

    _titulo(texto) {
        if (texto === null || texto === undefined) return "";
        const conectores = ["da", "de", "do", "das", "dos", "e", "a", "o", "em", "com", "para", "por"];

        let t = String(texto).trim().replace(/\s+/g, " ");
        const { protegido, siglas } = this._protegerSiglas(t);

        t = protegido
            .toLowerCase()
            .split(" ")
            .map((palavra, i) => {
                if (i === 0) return palavra.charAt(0).toUpperCase() + palavra.slice(1);
                if (conectores.includes(palavra)) return palavra;
                return palavra.replace(
                    /(^|[-'/])([a-záéíóúâêôãõçàüñ])/gi,
                    (m, sep, letra) => sep + letra.toUpperCase()
                );
            })
            .join(" ");

        return this._restaurarSiglas(t, siglas);
    }

    _sentenca(texto) {
        if (texto === null || texto === undefined) return null;
        let t = String(texto).trim().replace(/\s+/g, " ");
        if (!t) return null;

        const { protegido, siglas } = this._protegerSiglas(t);
        t = protegido.toLowerCase();
        t = t.replace(/(^|[.!?:]\s+)([a-záéíóúâêôãõçàüñ])/gi, (m, sep, letra) => sep + letra.toUpperCase());

        return this._restaurarSiglas(t, siglas);
    }

    _sku(texto) {
        if (!texto) return null;
        return String(texto)
            .trim()
            .toUpperCase()
            .replace(/[\s_]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
    }

    _emit(evento, dados) {
        try {
            realtime.emit(evento, dados);
        } catch {}
    }

    // ==================== ✨ VALIDAÇÃO AJUSTADA ====================
    /**
     * Valida dados de produto.
     * @param {object} dados
     * @param {object} opcoes
     * @param {boolean} opcoes.exigirQuantidade - Se true, quantidade é obrigatória (criar).
     *                                            Se false, valida só se veio (editar).
     */
    _validar({ nome, preco, quantidade, estoque_minimo }, { exigirQuantidade = true } = {}) {
        if (!nome || !nome.trim()) throw this._erro("Nome é obrigatório.", 400);

        if (preco === undefined || preco === null || preco === "") {
            throw this._erro("Preço é obrigatório.", 400);
        }
        if (Number.isNaN(Number(preco)) || Number(preco) < 0) {
            throw this._erro("Preço inválido.", 400);
        }

        // 🆕 Quantidade: obrigatória ao criar; opcional ao editar
        if (exigirQuantidade) {
            if (quantidade === undefined || quantidade === null || quantidade === "") {
                throw this._erro("Quantidade é obrigatória.", 400);
            }
            if (!Number.isInteger(Number(quantidade)) || Number(quantidade) < 0) {
                throw this._erro("Quantidade inválida.", 400);
            }
        } else if (quantidade !== undefined && quantidade !== null && quantidade !== "") {
            // Se foi enviada (mesmo em edição), validar
            if (!Number.isInteger(Number(quantidade)) || Number(quantidade) < 0) {
                throw this._erro("Quantidade inválida.", 400);
            }
        }

        // Estoque mínimo: opcional, mas se enviado, validar
        if (estoque_minimo !== undefined && estoque_minimo !== null && estoque_minimo !== "") {
            if (!Number.isInteger(Number(estoque_minimo)) || Number(estoque_minimo) < 0) {
                throw this._erro("Estoque mínimo inválido.", 400);
            }
        }
    }

    _qtdPositiva(v) {
        const q = Number(v);
        if (!Number.isInteger(q) || q <= 0) throw this._erro("Quantidade deve ser inteiro > 0.", 400);
        return q;
    }

    _erro(msg, status) {
        const e = new Error(msg);
        e.status = status;
        return e;
    }
}

module.exports = EstoqueService;

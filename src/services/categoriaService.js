const CategoriaRepository = require("../repositories/categoriaRepository");
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

class CategoriaService {
    constructor() {
        this.repo = new CategoriaRepository();
        this.log = new LogService();
    }

    listar() {
        return this.repo.listar();
    }

    buscar(id) {
        const c = this.repo.porId(id);
        if (!c) throw this._erro("Categoria não encontrada.", 404);
        return c;
    }

    criar({ nome, descricao }, req) {
        nome = this._titulo(nome);
        descricao = this._sentenca(descricao);

        if (!nome || !nome.trim()) throw this._erro("Nome obrigatório.", 400);
        if (this.repo.porNome(nome)) throw this._erro("Categoria já existe.", 409);

        const c = this.repo.criar(nome, descricao);

        this.log.registrar({
            req,
            acao: "categoria_criar",
            entidade: "categoria",
            entidade_id: c.id,
            descricao: `Criou categoria "${c.nome}"`
        });
        realtime.emit("categoria:criada", c);
        return c;
    }

    atualizar(id, { nome, descricao }, req) {
        this.buscar(id);
        nome = this._titulo(nome);
        descricao = this._sentenca(descricao);

        if (!nome || !nome.trim()) throw this._erro("Nome obrigatório.", 400);

        const c = this.repo.atualizar(id, nome, descricao);

        this.log.registrar({
            req,
            acao: "categoria_atualizar",
            entidade: "categoria",
            entidade_id: id,
            descricao: `Atualizou categoria "${c.nome}"`
        });
        realtime.emit("categoria:atualizada", c);
        return c;
    }

    remover(id, req) {
        const c = this.buscar(id);
        this.repo.remover(id);

        this.log.registrar({
            req,
            acao: "categoria_remover",
            entidade: "categoria",
            entidade_id: id,
            descricao: `Removeu categoria "${c.nome}"`,
            nivel: "warn"
        });
        realtime.emit("categoria:removida", { id });
        return true;
    }

    // ==================== NORMALIZAÇÃO ====================
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

    _erro(msg, status) {
        const e = new Error(msg);
        e.status = status;
        return e;
    }
}

module.exports = CategoriaService;

const db = require("../config/database");

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

class MovimentacaoRepository {
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

    _formatarObservacao(texto) {
        if (!texto) return null;
        let t = String(texto).trim().replace(/\s+/g, " ");
        if (!t) return null;

        const { protegido, siglas } = this._protegerSiglas(t);
        t = protegido.toLowerCase();
        t = t.replace(/(^|[.!?:]\s+)([a-záéíóúâêôãõçàüñ])/gi, (m, sep, letra) => sep + letra.toUpperCase());

        return this._restaurarSiglas(t, siglas);
    }

    registrar({ produto_id, usuario_id, tipo, quantidade, quantidade_anterior, quantidade_nova, observacao }) {
        let produto_nome = null;
        try {
            const p = db.prepare("SELECT nome FROM produtos WHERE id = ?").get(produto_id);
            produto_nome = p?.nome || null;
        } catch {
            /* ignora */
        }

        const obsFinal = this._formatarObservacao(observacao);

        const info = db
            .prepare(
                `
            INSERT INTO movimentacoes
            (produto_id, produto_nome, usuario_id, tipo, quantidade, quantidade_anterior, quantidade_nova, observacao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `
            )
            .run(
                produto_id,
                produto_nome,
                usuario_id || null,
                tipo,
                quantidade,
                quantidade_anterior,
                quantidade_nova,
                obsFinal
            );
        return info.lastInsertRowid;
    }

    listar({ produto_id, tipo, data_inicio, data_fim, pagina, limite }) {
        const where = [];
        const params = [];

        if (produto_id) {
            where.push("m.produto_id = ?");
            params.push(produto_id);
        }
        if (tipo) {
            where.push("m.tipo = ?");
            params.push(tipo);
        }
        if (data_inicio) {
            where.push("m.criado_em >= ?");
            params.push(data_inicio);
        }
        if (data_fim) {
            where.push("m.criado_em <= ?");
            params.push(data_fim);
        }

        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
        const total = db.prepare(`SELECT COUNT(*) AS total FROM movimentacoes m ${whereSql}`).get(...params).total;

        const offset = (pagina - 1) * limite;
        const itens = db
            .prepare(
                `
            SELECT
                m.*,
                COALESCE(p.nome, m.produto_nome, '[produto removido]') AS produto_nome,
                u.nome AS usuario_nome
            FROM movimentacoes m
            LEFT JOIN produtos p ON p.id = m.produto_id
            LEFT JOIN usuarios u ON u.id = m.usuario_id
            ${whereSql}
            ORDER BY m.criado_em DESC
            LIMIT ? OFFSET ?
        `
            )
            .all(...params, limite, offset);

        return { itens, total, pagina, totalPaginas: Math.max(1, Math.ceil(total / limite)) };
    }

    resumoPeriodo(data_inicio, data_fim) {
        return db
            .prepare(
                `
            SELECT tipo, COUNT(*) AS total, COALESCE(SUM(quantidade), 0) AS soma_qtd
            FROM movimentacoes
            WHERE criado_em BETWEEN ? AND ?
            GROUP BY tipo
        `
            )
            .all(data_inicio, data_fim);
    }
}

module.exports = MovimentacaoRepository;

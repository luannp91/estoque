const { z } = require("zod");

function validate({ body, query, params }) {
    return (req, res, next) => {
        try {
            if (body) req.body = body.parse(req.body);
            if (query) req.query = query.parse(req.query);
            if (params) req.params = params.parse(req.params);
            next();
        } catch (err) {
            if (err instanceof z.ZodError) {
                const issues = err.issues || err.errors || [];
                const detalhes = issues.map((e) => ({
                    campo: Array.isArray(e.path) ? e.path.join(".") : String(e.path || ""),
                    mensagem: e.message || "Valor inválido"
                }));

                return res.status(400).json({
                    erro: "Dados inválidos.",
                    detalhes
                });
            }
            next(err);
        }
    };
}

// ==================== SCHEMAS ====================
const Schemas = {
    id: z.coerce.number().int().positive(),

    produto: {
        criar: z.object({
            nome: z.string().trim().min(1, "Nome é obrigatório").max(150),
            sku: z
                .string()
                .trim()
                .max(50)
                .optional()
                .nullable()
                .transform((v) => v || null),
            descricao: z
                .string()
                .trim()
                .max(500)
                .optional()
                .nullable()
                .transform((v) => v || null),
            preco: z.coerce.number().min(0, "Preço deve ser >= 0").max(9999999),
            quantidade: z.coerce.number().int().min(0).max(999999),
            estoque_minimo: z.coerce.number().int().min(0).max(999999).default(0),
            categoria_id: z.coerce.number().int().positive().nullable().optional(),
            ativo: z.boolean().optional().default(true)
        }),
        atualizar: z.object({
            nome: z.string().trim().min(1).max(150),
            sku: z
                .string()
                .trim()
                .max(50)
                .optional()
                .nullable()
                .transform((v) => v || null),
            descricao: z
                .string()
                .trim()
                .max(500)
                .optional()
                .nullable()
                .transform((v) => v || null),
            preco: z.coerce.number().min(0).max(9999999),
            estoque_minimo: z.coerce.number().int().min(0).max(999999).default(0),
            categoria_id: z.coerce.number().int().positive().nullable().optional(),
            ativo: z.boolean().optional().default(true)
        }),
        movimentacao: z.object({
            quantidade: z.coerce.number().int().positive().max(999999),
            observacao: z.string().trim().max(500).optional().nullable()
        }),
        filtros: z
            .object({
                busca: z.string().trim().max(150).optional(),
                categoria_id: z.coerce.number().int().positive().optional(),
                estoque_baixo: z.enum(["true", "false"]).optional(),
                apenas_ativos: z.enum(["true", "false"]).optional(),
                ordenar: z.enum(["id", "nome", "preco", "quantidade", "criado_em"]).optional(),
                ordem: z.enum(["asc", "desc"]).optional(),
                pagina: z.coerce.number().int().positive().default(1),
                limite: z.coerce.number().int().min(1).max(100).default(10)
            })
            .passthrough()
    },

    categoria: {
        criar: z.object({
            nome: z.string().trim().min(1, "Nome obrigatório").max(100),
            descricao: z
                .string()
                .trim()
                .max(300)
                .optional()
                .nullable()
                .transform((v) => v || null)
        }),
        filtros: z
            .object({
                busca: z.string().trim().max(100).optional()
            })
            .passthrough()
    },

    auth: {
        login: z.object({
            email: z.string().trim().toLowerCase().email("E-mail inválido").max(150),
            senha: z.string().min(1, "Senha obrigatória").max(200),
            codigo2fa: z.string().trim().max(10).optional().nullable()
        }),
        registrar: z.object({
            nome: z.string().trim().min(2).max(100),
            email: z.string().trim().toLowerCase().email("E-mail inválido").max(150),
            senha: z.string().min(8, "Senha deve ter ao menos 8 caracteres").max(200)
        })
    },

    usuario: {
        criar: z.object({
            nome: z.string().trim().min(2).max(100),
            email: z.string().trim().toLowerCase().email("E-mail inválido").max(150),
            senha: z.string().min(8).max(200),
            papel: z.enum(["admin", "operador", "super_admin"]).default("operador")
        }),
        atualizar: z.object({
            nome: z.string().trim().min(2).max(100),
            email: z.string().trim().toLowerCase().email("E-mail inválido").max(150),
            papel: z.enum(["admin", "operador", "super_admin"]),
            ativo: z.boolean()
        }),
        resetSenha: z.object({
            novaSenha: z.string().min(8, "Senha deve ter ao menos 8 caracteres").max(200)
        }),
        filtros: z
            .object({
                busca: z.string().trim().max(100).optional(),
                papel: z.enum(["admin", "operador", "super_admin"]).optional(),
                ativo: z.enum(["true", "false"]).optional(),
                ordenar: z.enum(["id", "nome", "email", "papel", "criado_em"]).optional(),
                ordem: z.enum(["asc", "desc"]).optional(),
                pagina: z.coerce.number().int().positive().default(1),
                limite: z.coerce.number().int().min(1).max(100).default(10)
            })
            .passthrough()
    },

    movimentacao: {
        filtros: z
            .object({
                produto_id: z.coerce.number().int().positive().optional(),
                tipo: z.enum(["entrada", "saida", "ajuste", "cadastro", "remocao"]).optional(),
                data_inicio: z.string().optional(),
                data_fim: z.string().optional(),
                pagina: z.coerce.number().int().positive().default(1),
                limite: z.coerce.number().int().min(1).max(100).default(20)
            })
            .passthrough()
    },

    log: {
        filtros: z
            .object({
                busca: z.string().trim().max(150).optional(),
                usuario_id: z.coerce.number().int().positive().optional(),
                acao: z.string().trim().max(50).optional(),
                entidade: z.string().trim().max(50).optional(),
                nivel: z.enum(["info", "warn", "error"]).optional(),
                data_inicio: z.string().optional(),
                data_fim: z.string().optional(),
                pagina: z.coerce.number().int().positive().default(1),
                limite: z.coerce.number().int().min(1).max(100).default(20)
            })
            .passthrough()
    },

    paginacao: z
        .object({
            pagina: z.coerce.number().int().positive().default(1),
            limite: z.coerce.number().int().min(1).max(100).default(20),
            ordenar: z.string().optional(),
            ordem: z.enum(["asc", "desc"]).optional()
        })
        .passthrough()
};

module.exports = { validate, Schemas, z };

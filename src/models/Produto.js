/**
 * Representa um produto do estoque.
 * Converte a linha vinda do banco em objeto de domínio.
 */
class Produto {
    constructor(row) {
        this.id = row.id;
        this.nome = row.nome;
        this.sku = row.sku;
        this.descricao = row.descricao;
        this.preco = row.preco;
        this.quantidade = row.quantidade;
        this.estoque_minimo = row.estoque_minimo;
        this.categoria_id = row.categoria_id;
        this.categoria_nome = row.categoria_nome || null;
        this.ativo = !!row.ativo;
        this.deletado_em = row.deletado_em || null;
        this.deletado_por = row.deletado_por || null;
        this.criado_em = row.criado_em;
        this.atualizado_em = row.atualizado_em;
    }

    /** Regra de negócio: produto está com estoque baixo? */
    get estoqueBaixo() {
        return this.quantidade <= this.estoque_minimo;
    }

    /** Regra de negócio: produto foi movido para lixeira? */
    get deletado() {
        return !!this.deletado_em;
    }

    /** Serialização para envio ao frontend */
    toJSON() {
        return {
            id: this.id,
            nome: this.nome,
            sku: this.sku,
            descricao: this.descricao,
            preco: this.preco,
            quantidade: this.quantidade,
            estoque_minimo: this.estoque_minimo,
            categoria_id: this.categoria_id,
            categoria_nome: this.categoria_nome,
            ativo: this.ativo,
            estoqueBaixo: this.estoqueBaixo,
            deletado: this.deletado,
            deletado_em: this.deletado_em,
            criado_em: this.criado_em,
            atualizado_em: this.atualizado_em
        };
    }
}

module.exports = Produto;

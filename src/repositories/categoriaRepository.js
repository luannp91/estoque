const db = require("../config/database");

class CategoriaRepository {
    constructor() {
        this.insert = db.prepare("INSERT INTO categorias (nome, descricao) VALUES (?, ?)");
        this.update = db.prepare("UPDATE categorias SET nome = ?, descricao = ? WHERE id = ?");
        this.delete = db.prepare("DELETE FROM categorias WHERE id = ?");
        this.find = db.prepare("SELECT * FROM categorias WHERE id = ?");
        this.findByName = db.prepare("SELECT * FROM categorias WHERE nome = ?");
        this.all = db.prepare(`
            SELECT c.*, (SELECT COUNT(*) FROM produtos p WHERE p.categoria_id = c.id) AS total_produtos
            FROM categorias c ORDER BY c.nome
        `);
    }
    criar(nome, descricao) {
        const info = this.insert.run(nome, descricao);
        return this.porId(info.lastInsertRowid);
    }
    atualizar(id, nome, descricao) {
        this.update.run(nome, descricao, id);
        return this.porId(id);
    }
    remover(id) {
        return this.delete.run(id).changes > 0;
    }
    porId(id) {
        return this.find.get(id);
    }
    porNome(nome) {
        return this.findByName.get(nome);
    }
    listar() {
        return this.all.all();
    }
}
module.exports = CategoriaRepository;

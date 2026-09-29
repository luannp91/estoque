/**
 * Shim que embrulha o `node:sqlite` (nativo do Node 22.5+)
 * para expor a MESMA API do `better-sqlite3`.
 */
const { DatabaseSync } = require("node:sqlite");

class Statement {
    constructor(stmt) {
        this._stmt = stmt;
    }

    run(...args) {
        const info = this._stmt.run(...args);
        return {
            changes: Number(info.changes),
            lastInsertRowid: Number(info.lastInsertRowid)
        };
    }

    get(...args) {
        return this._stmt.get(...args);
    }
    all(...args) {
        return this._stmt.all(...args);
    }
}

class Database {
    constructor(pathOrOptions = ":memory:", options = {}) {
        let path = pathOrOptions;
        let opts = options;

        if (typeof pathOrOptions === "object" && pathOrOptions !== null) {
            opts = pathOrOptions;
            path = opts.path || ":memory:";
        }

        this._raw = new DatabaseSync(path, { readOnly: !!opts.readonly });
        this._inTransaction = false;
    }

    prepare(sql) {
        return new Statement(this._raw.prepare(sql));
    }
    exec(sql) {
        this._raw.exec(sql);
    }

    pragma(str, opts = {}) {
        const trimmed = str.trim().toLowerCase();
        const queryPrefixes = [
            "table_info",
            "index_list",
            "index_info",
            "foreign_key",
            "integrity_check",
            "quick_check",
            "database_list"
        ];
        const isQuery = queryPrefixes.some((p) => trimmed.startsWith(p));

        if (isQuery) {
            const rows = this._raw.prepare(`PRAGMA ${str}`).all();
            if (opts.simple) {
                if (!rows.length) return null;
                return Object.values(rows[0])[0];
            }
            return rows;
        }
        this._raw.exec(`PRAGMA ${str}`);
        return [];
    }

    transaction(fn) {
        return (...args) => {
            if (this._inTransaction) return fn(...args);
            this._raw.exec("BEGIN");
            this._inTransaction = true;
            try {
                const result = fn(...args);
                this._raw.exec("COMMIT");
                return result;
            } catch (e) {
                this._raw.exec("ROLLBACK");
                throw e;
            } finally {
                this._inTransaction = false;
            }
        };
    }

    close() {
        this._raw.close();
    }
}

module.exports = Database;

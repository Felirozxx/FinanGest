// Conexión a Neon (PostgreSQL) - reemplaza MongoDB
// Usa el mismo API que antes: { db, client, backend }
const { Client } = require('pg');

const NEON_URI = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_xDiCKq5nJyQ2@ep-soft-mode-bc7j0q8l-pooler.c-16.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

let cachedDb = null;

// Crea un objeto "db" que imita la API de MongoDB usando PostgreSQL (JSONB)
function createDbProxy(pgClient) {
    return {
        collection: (tableName) => new CollectionProxy(pgClient, tableName),
        command: async (cmd) => {
            if (cmd.ping) {
                await pgClient.query('SELECT 1');
                return { ok: 1 };
            }
            return {};
        }
    };
}

class CollectionProxy {
    constructor(pgClient, table) {
        this.pg = pgClient;
        this.table = table;
    }

    // Generar ID único
    _newId() {
        return require('crypto').randomBytes(12).toString('hex');
    }

    // Convertir query MongoDB a condición SQL sobre JSONB
    _buildWhere(query, params) {
        if (!query || Object.keys(query).length === 0) return { where: '', params };

        const conditions = [];

        for (const [key, value] of Object.entries(query)) {
            if (key === '$or') {
                const orParts = value.map(subQ => {
                    const subConds = [];
                    for (const [sk, sv] of Object.entries(subQ)) {
                        params.push(JSON.stringify(sv));
                        subConds.push(`data->>'${sk}' = $${params.length}`);
                    }
                    return '(' + subConds.join(' OR ') + ')';
                });
                conditions.push('(' + orParts.join(' OR ') + ')');
            } else if (key === '_id') {
                const idVal = value && value.toString ? value.toString() : value;
                params.push(idVal);
                conditions.push(`id = $${params.length}`);
            } else if (typeof value === 'object' && value !== null && !value.toString) {
                // operadores como $ne
                for (const [op, opVal] of Object.entries(value)) {
                    if (op === '$ne') {
                        params.push(JSON.stringify(opVal));
                        conditions.push(`data->>'${key}' != $${params.length}`);
                    } else if (op === '$in') {
                        const placeholders = opVal.map(v => { params.push(v); return `$${params.length}`; });
                        conditions.push(`data->>'${key}' IN (${placeholders.join(',')})`);
                    }
                }
            } else {
                params.push(typeof value === 'boolean' ? value.toString() : (value !== null ? value.toString() : value));
                if (value === null) {
                    conditions.push(`(data->>'${key}' IS NULL OR data->>'${key}' = 'null')`);
                } else {
                    conditions.push(`data->>'${key}' = $${params.length}`);
                }
            }
        }

        return { where: conditions.length ? 'WHERE ' + conditions.join(' AND ') : '', params };
    }

    _rowToDoc(row) {
        if (!row) return null;
        const doc = row.data || {};
        doc._id = row.id;
        return doc;
    }

    async findOne(query) {
        const params = [];
        const { where } = this._buildWhere(query, params);
        const res = await this.pg.query(`SELECT * FROM ${this.table} ${where} LIMIT 1`, params);
        return res.rows.length ? this._rowToDoc(res.rows[0]) : null;
    }

    find(query) {
        // Devuelve un cursor fake con .toArray() y .sort()
        const self = this;
        const cursor = {
            _query: query,
            _sortField: null,
            _limitVal: null,
            sort(sortObj) { this._sortField = sortObj; return this; },
            limit(n) { this._limitVal = n; return this; },
            async toArray() {
                const params = [];
                const { where } = self._buildWhere(cursor._query, params);
                let sql = `SELECT * FROM ${self.table} ${where}`;
                if (cursor._limitVal) sql += ` LIMIT ${cursor._limitVal}`;
                const res = await self.pg.query(sql, params);
                return res.rows.map(r => self._rowToDoc(r));
            }
        };
        return cursor;
    }

    async insertOne(doc) {
        const id = doc._id ? doc._id.toString() : this._newId();
        const docCopy = { ...doc, _id: id };
        await this.pg.query(
            `INSERT INTO ${this.table} (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data=$2`,
            [id, JSON.stringify(docCopy)]
        );
        return { insertedId: id, acknowledged: true };
    }

    async updateOne(query, update) {
        // Buscar el doc primero
        const existing = await this.findOne(query);
        if (!existing) return { modifiedCount: 0, matchedCount: 0 };

        let updated = { ...existing };

        if (update.$set) {
            Object.assign(updated, update.$set);
        }
        if (update.$inc) {
            for (const [k, v] of Object.entries(update.$inc)) {
                updated[k] = (updated[k] || 0) + v;
            }
        }
        if (update.$unset) {
            for (const k of Object.keys(update.$unset)) {
                delete updated[k];
            }
        }

        const id = existing._id.toString();
        await this.pg.query(
            `UPDATE ${this.table} SET data=$2 WHERE id=$1`,
            [id, JSON.stringify(updated)]
        );
        return { modifiedCount: 1, matchedCount: 1 };
    }

    async deleteOne(query) {
        const existing = await this.findOne(query);
        if (!existing) return { deletedCount: 0 };
        const id = existing._id.toString();
        await this.pg.query(`DELETE FROM ${this.table} WHERE id=$1`, [id]);
        return { deletedCount: 1 };
    }

    async deleteMany(query) {
        const params = [];
        const { where } = this._buildWhere(query, params);
        const res = await this.pg.query(`DELETE FROM ${this.table} ${where}`, params);
        return { deletedCount: res.rowCount };
    }

    async countDocuments(query) {
        const params = [];
        const { where } = this._buildWhere(query, params);
        const res = await this.pg.query(`SELECT COUNT(*) FROM ${this.table} ${where}`, params);
        return parseInt(res.rows[0].count, 10);
    }
}

async function connectToDatabase() {
    if (cachedDb) {
        // Verificar que siga conectado
        try {
            await cachedDb._pg.query('SELECT 1');
            return { db: cachedDb, client: cachedDb._pg, backend: 'neon' };
        } catch (e) {
            cachedDb = null;
        }
    }

    const pgClient = new Client({ connectionString: NEON_URI });
    await pgClient.connect();

    const db = createDbProxy(pgClient);
    db._pg = pgClient;
    cachedDb = db;

    return { db, client: pgClient, backend: 'neon' };
}

async function getSystemStatus() {
    try {
        const { db } = await connectToDatabase();
        await db.command({ ping: 1 });
        return {
            current: 'neon',
            backends: {
                neon: { healthy: true, lastCheck: new Date(), error: null }
            },
            failoverEnabled: false
        };
    } catch (error) {
        return {
            current: 'neon',
            backends: {
                neon: { healthy: false, lastCheck: new Date(), error: error.message }
            },
            failoverEnabled: false
        };
    }
}

module.exports = { connectToDatabase, getSystemStatus };

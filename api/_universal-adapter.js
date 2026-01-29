// Adaptador universal para MongoDB, Supabase y Firebase
const { ObjectId } = require('mongodb');

class UniversalAdapter {
    constructor(connection) {
        this.type = connection.type;
        this.db = connection.db;
        this.client = connection.client;
    }

    // Buscar un documento
    async findOne(collection, query) {
        if (this.type === 'mongodb') {
            return await this.db.collection(collection).findOne(query);
        } else if (this.type === 'supabase') {
            const { data, error } = await this.client
                .from(collection)
                .select('*')
                .match(this._convertQuery(query))
                .limit(1)
                .single();
            if (error) throw error;
            return data;
        } else {
            // Firebase
            const snapshot = await this.db.collection(collection)
                .where(Object.keys(query)[0], '==', Object.values(query)[0])
                .limit(1)
                .get();
            return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        }
    }

    // Buscar múltiples documentos
    async find(collection, query = {}, options = {}) {
        if (this.type === 'mongodb') {
            let cursor = this.db.collection(collection).find(query);
            if (options.sort) cursor = cursor.sort(options.sort);
            if (options.limit) cursor = cursor.limit(options.limit);
            return await cursor.toArray();
        } else {
            let queryBuilder = this.client.from(collection).select('*');
            if (query) queryBuilder = queryBuilder.match(this._convertQuery(query));
            if (options.sort) {
                const [field, order] = Object.entries(options.sort)[0];
                queryBuilder = queryBuilder.order(field, { ascending: order === 1 });
            }
            if (options.limit) queryBuilder = queryBuilder.limit(options.limit);
            const { data, error } = await queryBuilder;
            if (error) throw error;
            return data || [];
        }
    }

    // Insertar documento
    async insertOne(collection, doc) {
        if (this.type === 'mongodb') {
            const result = await this.db.collection(collection).insertOne(doc);
            return { insertedId: result.insertedId, ...doc };
        } else {
            const { data, error } = await this.client
                .from(collection)
                .insert([doc])
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }

    // Actualizar documento
    async updateOne(collection, query, update) {
        if (this.type === 'mongodb') {
            return await this.db.collection(collection).updateOne(query, update);
        } else {
            const { data, error } = await this.client
                .from(collection)
                .update(update.$set || update)
                .match(this._convertQuery(query));
            if (error) throw error;
            return { modifiedCount: data ? 1 : 0 };
        }
    }

    // Eliminar documento
    async deleteOne(collection, query) {
        if (this.type === 'mongodb') {
            return await this.db.collection(collection).deleteOne(query);
        } else {
            const { error } = await this.client
                .from(collection)
                .delete()
                .match(this._convertQuery(query));
            if (error) throw error;
            return { deletedCount: 1 };
        }
    }

    // Convertir query de MongoDB a Supabase
    _convertQuery(query) {
        const converted = {};
        for (const [key, value] of Object.entries(query)) {
            if (key === '_id' && typeof value === 'object' && value.constructor.name === 'ObjectId') {
                converted.id = value.toString();
            } else if (key === '_id') {
                converted.id = value;
            } else {
                converted[key] = value;
            }
        }
        return converted;
    }
}

module.exports = UniversalAdapter;

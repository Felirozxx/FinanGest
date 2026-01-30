// Adaptador universal para MongoDB y Supabase
const { ObjectId } = require('mongodb');

class DatabaseAdapter {
    constructor(connection) {
        this.connection = connection;
        this.type = connection.type;
    }

    // ============================================
    // USERS
    // ============================================
    
    async findUser(query) {
        if (this.type === 'mongodb') {
            return await this.connection.db.collection('users').findOne(query);
        } else {
            // Supabase
            const { data, error } = await this.connection.client
                .from('users')
                .select('*')
                .match(this._convertQuery(query))
                .single();
            
            if (error) throw error;
            return this._convertFromSupabase(data);
        }
    }

    async findUsers(query = {}) {
        if (this.type === 'mongodb') {
            return await this.connection.db.collection('users').find(query).toArray();
        } else {
            const { data, error } = await this.connection.client
                .from('users')
                .select('*')
                .match(this._convertQuery(query));
            
            if (error) throw error;
            return data.map(d => this._convertFromSupabase(d));
        }
    }

    async insertUser(user) {
        if (this.type === 'mongodb') {
            const result = await this.connection.db.collection('users').insertOne(user);
            return { ...user, _id: result.insertedId };
        } else {
            const supabaseUser = this._convertToSupabase(user);
            const { data, error } = await this.connection.client
                .from('users')
                .insert(supabaseUser)
                .select()
                .single();
            
            if (error) throw error;
            return this._convertFromSupabase(data);
        }
    }

    async updateUser(query, update) {
        if (this.type === 'mongodb') {
            return await this.connection.db.collection('users').updateOne(query, update);
        } else {
            const { data, error } = await this.connection.client
                .from('users')
                .update(this._convertUpdate(update))
                .match(this._convertQuery(query));
            
            if (error) throw error;
            return { modifiedCount: data ? 1 : 0 };
        }
    }

    // ============================================
    // CLIENTES
    // ============================================
    
    async findClientes(query = {}) {
        if (this.type === 'mongodb') {
            return await this.connection.db.collection('clientes').find(query).toArray();
        } else {
            const { data, error } = await this.connection.client
                .from('clientes')
                .select('*')
                .match(this._convertQuery(query));
            
            if (error) throw error;
            return data.map(d => this._convertFromSupabase(d));
        }
    }

    async insertCliente(cliente) {
        if (this.type === 'mongodb') {
            const result = await this.connection.db.collection('clientes').insertOne(cliente);
            return { ...cliente, _id: result.insertedId };
        } else {
            const supabaseCliente = this._convertToSupabase(cliente);
            const { data, error } = await this.connection.client
                .from('clientes')
                .insert(supabaseCliente)
                .select()
                .single();
            
            if (error) throw error;
            return this._convertFromSupabase(data);
        }
    }

    async updateCliente(query, update) {
        if (this.type === 'mongodb') {
            return await this.connection.db.collection('clientes').updateOne(query, update);
        } else {
            const { data, error } = await this.connection.client
                .from('clientes')
                .update(this._convertUpdate(update))
                .match(this._convertQuery(query));
            
            if (error) throw error;
            return { modifiedCount: data ? 1 : 0 };
        }
    }

    async deleteCliente(query) {
        if (this.type === 'mongodb') {
            return await this.connection.db.collection('clientes').deleteOne(query);
        } else {
            const { data, error } = await this.connection.client
                .from('clientes')
                .delete()
                .match(this._convertQuery(query));
            
            if (error) throw error;
            return { deletedCount: data ? 1 : 0 };
        }
    }

    // ============================================
    // CARTERAS
    // ============================================
    
    async findCarteras(query = {}) {
        if (this.type === 'mongodb') {
            return await this.connection.db.collection('carteras').find(query).toArray();
        } else {
            const { data, error } = await this.connection.client
                .from('carteras')
                .select('*')
                .match(this._convertQuery(query));
            
            if (error) throw error;
            return data.map(d => this._convertFromSupabase(d));
        }
    }

    async insertCartera(cartera) {
        if (this.type === 'mongodb') {
            const result = await this.connection.db.collection('carteras').insertOne(cartera);
            return { ...cartera, _id: result.insertedId };
        } else {
            const supabaseCartera = this._convertToSupabase(cartera);
            const { data, error } = await this.connection.client
                .from('carteras')
                .insert(supabaseCartera)
                .select()
                .single();
            
            if (error) throw error;
            return this._convertFromSupabase(data);
        }
    }

    async updateCartera(query, update) {
        if (this.type === 'mongodb') {
            return await this.connection.db.collection('carteras').updateOne(query, update);
        } else {
            const { data, error } = await this.connection.client
                .from('carteras')
                .update(this._convertUpdate(update))
                .match(this._convertQuery(query));
            
            if (error) throw error;
            return { modifiedCount: data ? 1 : 0 };
        }
    }

    async deleteCartera(query) {
        if (this.type === 'mongodb') {
            return await this.connection.db.collection('carteras').deleteOne(query);
        } else {
            const { data, error } = await this.connection.client
                .from('carteras')
                .delete()
                .match(this._convertQuery(query));
            
            if (error) throw error;
            return { deletedCount: data ? 1 : 0 };
        }
    }

    // ============================================
    // GASTOS
    // ============================================
    
    async findGastos(query = {}) {
        if (this.type === 'mongodb') {
            return await this.connection.db.collection('gastos').find(query).toArray();
        } else {
            const { data, error } = await this.connection.client
                .from('gastos')
                .select('*')
                .match(this._convertQuery(query));
            
            if (error) throw error;
            return data.map(d => this._convertFromSupabase(d));
        }
    }

    async insertGasto(gasto) {
        if (this.type === 'mongodb') {
            const result = await this.connection.db.collection('gastos').insertOne(gasto);
            return { ...gasto, _id: result.insertedId };
        } else {
            const supabaseGasto = this._convertToSupabase(gasto);
            const { data, error } = await this.connection.client
                .from('gastos')
                .insert(supabaseGasto)
                .select()
                .single();
            
            if (error) throw error;
            return this._convertFromSupabase(data);
        }
    }

    async updateGasto(query, update) {
        if (this.type === 'mongodb') {
            return await this.connection.db.collection('gastos').updateOne(query, update);
        } else {
            const { data, error } = await this.connection.client
                .from('gastos')
                .update(this._convertUpdate(update))
                .match(this._convertQuery(query));
            
            if (error) throw error;
            return { modifiedCount: data ? 1 : 0 };
        }
    }

    async deleteGasto(query) {
        if (this.type === 'mongodb') {
            return await this.connection.db.collection('gastos').deleteOne(query);
        } else {
            const { data, error } = await this.connection.client
                .from('gastos')
                .delete()
                .match(this._convertQuery(query));
            
            if (error) throw error;
            return { deletedCount: data ? 1 : 0 };
        }
    }

    // ============================================
    // HELPERS
    // ============================================
    
    _convertQuery(query) {
        if (this.type === 'mongodb') return query;
        
        // Convertir _id a id para Supabase
        const converted = {};
        for (const [key, value] of Object.entries(query)) {
            if (key === '_id') {
                converted.id = value.toString();
            } else {
                converted[key] = value;
            }
        }
        return converted;
    }

    _convertUpdate(update) {
        if (this.type === 'mongodb') return update;
        
        // Extraer $set de MongoDB
        if (update.$set) {
            return update.$set;
        }
        return update;
    }

    _convertToSupabase(doc) {
        const converted = { ...doc };
        if (converted._id) {
            converted.id = converted._id.toString();
            delete converted._id;
        }
        return converted;
    }

    _convertFromSupabase(doc) {
        if (!doc) return null;
        const converted = { ...doc };
        if (converted.id) {
            converted._id = converted.id;
            delete converted.id;
        }
        return converted;
    }
}

module.exports = DatabaseAdapter;

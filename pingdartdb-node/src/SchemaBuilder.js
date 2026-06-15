class SchemaBuilder {
    constructor(sequelize, dbType) {
        this.sequelize = sequelize;
        this.dbType = dbType;
        this.q = this.dbType === 'postgres' ? '"' : '`';
    }

    /**
     * Create a table dynamically
     * @param {string} tableName 
     * @param {Array} columns - e.g. [{ name: 'id', type: 'SERIAL PRIMARY KEY' }]
     */
    async createTable(tableName, columns = []) {
        let query;
        
        if (columns && columns.length > 0) {
            const columnsString = columns.map(col => `${this.q}${col.name}${this.q} ${col.type}`).join(', ');
            query = `CREATE TABLE IF NOT EXISTS ${this.q}${tableName}${this.q} (${columnsString})`;
        } else {
            // Default structure if no columns specified
            query = `CREATE TABLE IF NOT EXISTS ${this.q}${tableName}${this.q} (
                id ${this.dbType === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INT AUTO_INCREMENT PRIMARY KEY'},
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ${this.dbType === 'mysql' ? 'ON UPDATE CURRENT_TIMESTAMP' : ''}
            )`;
        }

        await this.sequelize.query(query);
        return { success: true, message: `Table ${tableName} created successfully.` };
    }

    /**
     * Drop a table
     * @param {string} tableName 
     */
    async dropTable(tableName) {
        const query = `DROP TABLE IF EXISTS ${this.q}${tableName}${this.q}`;
        await this.sequelize.query(query);
        return { success: true, message: `Table ${tableName} dropped successfully.` };
    }

    /**
     * Get columns of a table
     * @param {string} tableName 
     */
    async getColumns(tableName) {
        let query;
        if (this.dbType === 'mysql') {
            query = `SHOW COLUMNS FROM \`${tableName}\``;
        } else if (this.dbType === 'postgres') {
            query = `
                SELECT column_name as "Field", data_type as "Type"
                FROM information_schema.columns 
                WHERE table_name = '${tableName}'
            `;
        } else {
            throw new Error(`Unsupported DB type for getColumns: ${this.dbType}`);
        }

        const results = await this.sequelize.query(query, {
            type: this.sequelize.QueryTypes.SELECT,
            raw: true
        });

        return results;
    }
}

module.exports = SchemaBuilder;

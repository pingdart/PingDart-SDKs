class QueryBuilder {
    constructor(tableName, sequelize, dbType) {
        this.tableName = tableName;
        this.sequelize = sequelize;
        this.dbType = dbType;
        this.q = this.dbType === 'postgres' ? '"' : '`';
    }

    /**
     * Helper to build dynamic WHERE clauses with advanced operators
     */
    _buildWhereClause(conditions, replacements, prefix = 'cond_') {
        const clauses = [];
        if (!conditions || typeof conditions !== 'object') return clauses;

        for (const [key, value] of Object.entries(conditions)) {
            const paramKey = `${prefix}${key}`;
            
            if (Array.isArray(value)) {
                if (value.length > 0) {
                    const placeholders = value.map((_, i) => `:${paramKey}_${i}`).join(', ');
                    clauses.push(`${this.q}${key}${this.q} IN (${placeholders})`);
                    value.forEach((v, i) => { replacements[`${paramKey}_${i}`] = v; });
                } else {
                    clauses.push('1=0');
                }
            } else if (typeof value === 'object' && value !== null) {
                if ((value.start !== undefined && value.end !== undefined) || 
                    (value.min !== undefined && value.max !== undefined)) {
                    const startValue = value.start !== undefined ? value.start : value.min;
                    const endValue = value.end !== undefined ? value.end : value.max;
                    clauses.push(`${this.q}${key}${this.q} BETWEEN :${paramKey}_start AND :${paramKey}_end`);
                    replacements[`${paramKey}_start`] = startValue;
                    replacements[`${paramKey}_end`] = endValue;
                } else if (value instanceof Date) {
                    clauses.push(`${this.q}${key}${this.q} = :${paramKey}`);
                    replacements[paramKey] = value;
                }
            } else if (typeof value === 'string') {
                if (value.startsWith('!')) {
                    clauses.push(`${this.q}${key}${this.q} != :${paramKey}`);
                    replacements[paramKey] = value.substring(1);
                } else if (value.startsWith('>=') || value.startsWith('=>')) {
                    clauses.push(`${this.q}${key}${this.q} >= :${paramKey}`);
                    replacements[paramKey] = value.substring(2);
                } else if (value.startsWith('<=') || value.startsWith('=<')) {
                    clauses.push(`${this.q}${key}${this.q} <= :${paramKey}`);
                    replacements[paramKey] = value.substring(2);
                } else if (value.startsWith('>')) {
                    clauses.push(`${this.q}${key}${this.q} > :${paramKey}`);
                    replacements[paramKey] = value.substring(1);
                } else if (value.startsWith('<')) {
                    clauses.push(`${this.q}${key}${this.q} < :${paramKey}`);
                    replacements[paramKey] = value.substring(1);
                } else {
                    clauses.push(`${this.q}${key}${this.q} = :${paramKey}`);
                    replacements[paramKey] = value;
                }
            } else {
                clauses.push(`${this.q}${key}${this.q} = :${paramKey}`);
                replacements[paramKey] = value;
            }
        }
        return clauses;
    }

    /**
     * Helper to process margedata (Batch joins) recursively
     */
    async _processMergedataBatch(rows, margedataItem, search = {}) {
        const { target_table, target_column, target_value, target_label, search_fields = [], margedata: nestedMargedata, range } = margedataItem;
        if (!target_table || !target_column || !target_value || !target_label) return;

        try {
            const parentIds = [...new Set(rows.map(row => row[target_value]).filter(Boolean))];
            if (parentIds.length === 0) {
                rows.forEach(row => { row[target_label] = []; });
                return;
            }

            const conditions = [`${this.q}${target_column}${this.q} IN (:parentIds)`];
            const replacements = { parentIds };

            for (const field of search_fields) {
                for (const [searchKey, fullColumn] of Object.entries(field)) {
                    const parts = fullColumn.split(".");
                    const column = parts.length > 1 ? parts[1] : parts[0];
                    
                    if (search[searchKey]) {
                        const likeOp = this.dbType === 'postgres' ? 'ILIKE' : 'LIKE';
                        conditions.push(`${this.q}${column}${this.q} ${likeOp} :${searchKey}`);
                        replacements[searchKey] = `%${search[searchKey]}%`;
                    }
                }
            }

            // Geolocation Range Support within Margedata
            if (range && typeof range === 'object' && range.latitude && range.longitude && range.radius && range.target_latitude && range.target_longitude) {
                const { latitude, longitude, radius, target_latitude, target_longitude } = range;
                const earthRadius = 6371; // KM
                
                conditions.push(`(
                    ${earthRadius} * ACOS(
                        COS(RADIANS(:_batchLat)) *
                        COS(RADIANS(${this.q}${target_latitude}${this.q})) *
                        COS(RADIANS(${this.q}${target_longitude}${this.q}) - RADIANS(:_batchLon)) +
                        SIN(RADIANS(:_batchLat)) *
                        SIN(RADIANS(${this.q}${target_latitude}${this.q}))
                    )
                ) <= :_batchRad`);

                replacements._batchLat = latitude;
                replacements._batchLon = longitude;
                replacements._batchRad = radius;
            }

            const batchQuery = `SELECT * FROM ${this.q}${target_table}${this.q} WHERE ${conditions.join(' AND ')}`;
            
            const allMatches = await this.sequelize.query(batchQuery, {
                replacements,
                type: this.sequelize.QueryTypes.SELECT,
            });

            const groupedMatches = {};
            allMatches.forEach(match => {
                const parentId = match[target_column];
                if (!groupedMatches[parentId]) groupedMatches[parentId] = [];
                groupedMatches[parentId].push(match);
            });

            rows.forEach(row => {
                const parentId = row[target_value];
                row[target_label] = groupedMatches[parentId] || [];
            });

            if (Array.isArray(nestedMargedata) && nestedMargedata.length > 0 && allMatches.length > 0) {
                for (const childItem of nestedMargedata) {
                    await this._processMergedataBatch(allMatches, childItem, search);
                }
            }
        } catch (err) {
            console.error(`Error in batch margedata (${target_label}):`, err.message);
            rows.forEach(row => { row[target_label] = []; });
        }
    }

    /**
     * Read records with dynamic conditions, operators, geolocation, and margedata joins
     * @param {Object} options - { conditions, search, orderBy, pagination, range, margedata }
     */
    async read(options = {}) {
        const { conditions, search, orderBy, pagination, range, margedata } = options;
        let query = `SELECT * FROM ${this.q}${this.tableName}${this.q} WHERE 1=1`;
        const replacements = {};

        // Advanced Conditions
        const conditionClauses = this._buildWhereClause(conditions, replacements, 'r_');
        if (conditionClauses.length > 0) {
            query += ` AND ${conditionClauses.join(' AND ')}`;
        }

        // Search (LIKE / ILIKE)
        if (search && typeof search === 'object') {
            const searchClauses = [];
            for (const [key, value] of Object.entries(search)) {
                if (value) {
                    const likeOp = this.dbType === 'postgres' ? 'ILIKE' : 'LIKE';
                    searchClauses.push(`${this.q}${key}${this.q} ${likeOp} :s_${key}`);
                    replacements[`s_${key}`] = `%${value}%`;
                }
            }
            if (searchClauses.length > 0) {
                query += ` AND (${searchClauses.join(' OR ')})`;
            }
        }

        // Geolocation Range (Supports Case 1: Same Table & Case 2: Join Table)
        if (range && typeof range === 'object' && range.latitude && range.longitude && range.radius && range.target_latitude && range.target_longitude) {
            const { latitude, longitude, radius, target_latitude, target_longitude, table_name, join_column = 'user_id', main_join_column = 'id' } = range;
            const earthRadius = 6371; // KM

            if (!table_name || table_name === this.tableName) {
                // Case 1: Same table
                query += ` AND (
                    ${earthRadius} * ACOS(
                        COS(RADIANS(:_rLat)) *
                        COS(RADIANS(${this.q}${target_latitude}${this.q})) *
                        COS(RADIANS(${this.q}${target_longitude}${this.q}) - RADIANS(:_rLon)) +
                        SIN(RADIANS(:_rLat)) *
                        SIN(RADIANS(${this.q}${target_latitude}${this.q}))
                    )
                ) <= :_rRad`;
            } else {
                // Case 2: Join with location table
                const alias = 'rt';
                query += ` AND EXISTS (
                    SELECT 1 FROM ${this.q}${table_name}${this.q} AS ${alias}
                    WHERE ${alias}.${this.q}${join_column}${this.q} = ${this.q}${this.tableName}${this.q}.${this.q}${main_join_column}${this.q}
                    AND (
                        ${earthRadius} * ACOS(
                            COS(RADIANS(:_rLat)) *
                            COS(RADIANS(${alias}.${this.q}${target_latitude}${this.q})) *
                            COS(RADIANS(${alias}.${this.q}${target_longitude}${this.q}) - RADIANS(:_rLon)) +
                            SIN(RADIANS(:_rLat)) *
                            SIN(RADIANS(${alias}.${this.q}${target_latitude}${this.q}))
                        )
                    ) <= :_rRad
                )`;
            }
            
            replacements._rLat = latitude;
            replacements._rLon = longitude;
            replacements._rRad = radius;
        }

        if (orderBy) query += ` ORDER BY ${orderBy}`;

        // Get total count BEFORE pagination
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const countResult = await this.sequelize.query(countQuery, {
            replacements,
            type: this.sequelize.QueryTypes.SELECT,
            raw: true
        });
        const totalCount = parseInt(countResult[0]?.total || 0, 10);

        // Pagination setup
        let totalPages = 0;
        if (pagination && pagination.page && pagination.limit) {
            const page = Math.max(1, parseInt(pagination.page, 10));
            const limit = parseInt(pagination.limit, 10);
            const offset = (page - 1) * limit;
            query += ` LIMIT ${limit} OFFSET ${offset}`;
            totalPages = Math.ceil(totalCount / limit);
        }

        // Execute Paginated Query
        const results = await this.sequelize.query(query, {
            replacements,
            type: this.sequelize.QueryTypes.SELECT,
            raw: true
        });

        // Margedata (Batch Relation Fetches)
        if (margedata && Array.isArray(margedata) && margedata.length > 0 && results.length > 0) {
            for (const mdItem of margedata) {
                await this._processMergedataBatch(results, mdItem, search);
            }
        }

        return { success: true, data: results, totalCount, totalPages };
    }

    /**
     * Insert one or multiple records (Bulk Insert) with optional duplicate check
     * @param {Object} [options] - Optional options object, e.g., { conditions: { email: '...' } }. If provided, checks if a matching record already exists before inserting.
     * @param {Object|Array} data - Record object or array of objects to insert
     */
    async insert(arg1, arg2) {
        let data, conditions = null;

        if (arg2 !== undefined) {
            // Signature: insert(options, data)
            data = arg2;
            if (arg1 && typeof arg1 === 'object' && arg1.conditions) {
                conditions = arg1.conditions;
            }
        } else {
            // Signature: insert(data)
            data = arg1;
        }

        if (!data) throw new Error("Data object cannot be empty");

        const isBulk = Array.isArray(data);
        const records = isBulk ? data : [data];

        if (records.length === 0) throw new Error("Data array cannot be empty");

        // --- Duplicate Check ---
        if (conditions && typeof conditions === 'object' && Object.keys(conditions).length > 0) {
            if (!isBulk) {
                // Single insert: check if a record matching `conditions` already exists
                const checkReplacements = {};
                const conditionClauses = this._buildWhereClause(conditions, checkReplacements, 'ins_chk_');
                if (conditionClauses.length > 0) {
                    const checkQuery = `SELECT COUNT(*) as total FROM ${this.q}${this.tableName}${this.q} WHERE ${conditionClauses.join(' AND ')}`;
                    const checkResult = await this.sequelize.query(checkQuery, {
                        replacements: checkReplacements,
                        type: this.sequelize.QueryTypes.SELECT,
                        raw: true
                    });
                    const existingCount = parseInt(checkResult[0]?.total || 0, 10);
                    if (existingCount > 0) {
                        return {
                            success: false,
                            exists: true,
                            message: 'Record already exists matching the given conditions. Insert skipped.'
                        };
                    }
                }
            } else {
                // Bulk insert: filter out records that already exist based on the condition keys
                const conditionKeys = Object.keys(conditions);
                const toInsert = [];
                const skipped = [];

                for (const record of records) {
                    // Build per-record conditions from the condition keys using values from the record
                    const perRecordConditions = {};
                    for (const key of conditionKeys) {
                        if (record[key] !== undefined) {
                            perRecordConditions[key] = record[key];
                        } else {
                            // Use the static condition value from the conditions object
                            perRecordConditions[key] = conditions[key];
                        }
                    }
                    const checkReplacements = {};
                    const conditionClauses = this._buildWhereClause(perRecordConditions, checkReplacements, `ins_bulk_chk_`);
                    if (conditionClauses.length > 0) {
                        const checkQuery = `SELECT COUNT(*) as total FROM ${this.q}${this.tableName}${this.q} WHERE ${conditionClauses.join(' AND ')}`;
                        const checkResult = await this.sequelize.query(checkQuery, {
                            replacements: checkReplacements,
                            type: this.sequelize.QueryTypes.SELECT,
                            raw: true
                        });
                        const existingCount = parseInt(checkResult[0]?.total || 0, 10);
                        if (existingCount > 0) {
                            skipped.push(record);
                        } else {
                            toInsert.push(record);
                        }
                    } else {
                        toInsert.push(record);
                    }
                }

                if (toInsert.length === 0) {
                    return {
                        success: false,
                        exists: true,
                        message: `All ${records.length} records already exist. Insert skipped.`,
                        skipped: skipped.length
                    };
                }

                // Only insert non-duplicate records
                const keys = Object.keys(toInsert[0]);
                const columns = keys.map(k => `${this.q}${k}${this.q}`).join(', ');
                const replacements = [];
                const valueSets = [];
                for (const record of toInsert) {
                    const placeholders = [];
                    for (const key of keys) {
                        placeholders.push('?');
                        replacements.push(record[key]);
                    }
                    valueSets.push(`(${placeholders.join(', ')})`);
                }
                let query = `INSERT INTO ${this.q}${this.tableName}${this.q} (${columns}) VALUES ${valueSets.join(', ')}`;
                if (this.dbType === 'postgres') query += ' RETURNING *';
                const [results] = await this.sequelize.query(query, {
                    replacements,
                    type: this.sequelize.QueryTypes.INSERT
                });
                return {
                    success: true,
                    message: `${toInsert.length} record(s) inserted. ${skipped.length} duplicate(s) skipped.`,
                    inserted: toInsert.length,
                    skipped: skipped.length,
                    insertedRows: results
                };
            }
        }

        // --- Standard Insert (no conditions check) ---
        const keys = Object.keys(records[0]);
        const columns = keys.map(k => `${this.q}${k}${this.q}`).join(', ');

        const replacements = [];
        const valueSets = [];

        for (const record of records) {
            const placeholders = [];
            for (const key of keys) {
                placeholders.push('?');
                replacements.push(record[key]);
            }
            valueSets.push(`(${placeholders.join(', ')})`);
        }

        let query = `INSERT INTO ${this.q}${this.tableName}${this.q} (${columns}) VALUES ${valueSets.join(', ')}`;
        
        if (this.dbType === 'postgres') {
            query += ' RETURNING *';
        }

        const [results, metadata] = await this.sequelize.query(query, {
            replacements,
            type: this.sequelize.QueryTypes.INSERT
        });

        return { 
            success: true, 
            message: isBulk ? `${records.length} records inserted successfully.` : "Record inserted successfully.",
            insertedRows: results 
        };
    }

    /**
     * Update existing records
     * @param {Object} conditions - WHERE clause
     * @param {Object} data - Columns to update
     */
    async update(conditions, data) {
        if (!conditions || Object.keys(conditions).length === 0) {
            throw new Error("Update requires conditions to prevent bulk overwrite.");
        }

        const replacements = {};
        const setClause = Object.keys(data).map(k => `${this.q}${k}${this.q} = :data_${k}`).join(', ');
        for (const [k, v] of Object.entries(data)) {
            replacements[`data_${k}`] = v;
        }

        const conditionClauses = this._buildWhereClause(conditions, replacements, 'cond_');
        if (conditionClauses.length === 0) {
            throw new Error("Update conditions could not be generated. Aborting to prevent bulk update.");
        }
        
        const query = `UPDATE ${this.q}${this.tableName}${this.q} SET ${setClause} WHERE ${conditionClauses.join(' AND ')}`;

        const [results, metadata] = await this.sequelize.query(query, {
            replacements,
            type: this.sequelize.QueryTypes.UPDATE
        });

        return { success: true, message: "Record(s) updated successfully.", affectedRows: metadata };
    }

    /**
     * Delete records
     * @param {Object} conditions - WHERE clause
     */
    async delete(conditions) {
        if (!conditions || Object.keys(conditions).length === 0) {
            throw new Error("Delete requires conditions to prevent bulk delete.");
        }

        const replacements = {};
        const conditionClauses = this._buildWhereClause(conditions, replacements, 'del_');

        if (conditionClauses.length === 0) {
            throw new Error("Delete conditions could not be generated. Aborting to prevent bulk delete.");
        }

        const query = `DELETE FROM ${this.q}${this.tableName}${this.q} WHERE ${conditionClauses.join(' AND ')}`;

        const deleteResult = await this.sequelize.query(query, {
            replacements,
            type: this.sequelize.QueryTypes.DELETE
        });

        // Some dialects return [results, metadata], others return just metadata or undefined
        const affectedRows = Array.isArray(deleteResult) ? deleteResult[1] : deleteResult;

        return { success: true, message: "Record(s) deleted successfully.", affectedRows };
    }

    /**
     * Count records
     * @param {Object} conditions 
     */
    async count(conditions = {}) {
        let query = `SELECT COUNT(*) AS count FROM ${this.q}${this.tableName}${this.q}`;
        const replacements = {};

        const conditionClauses = this._buildWhereClause(conditions, replacements, 'c_');
        if (conditionClauses.length > 0) {
            query += ` WHERE ${conditionClauses.join(' AND ')}`;
        }

        const results = await this.sequelize.query(query, {
            replacements,
            type: this.sequelize.QueryTypes.SELECT,
            raw: true
        });

        return parseInt(results[0]?.count || 0, 10);
    }
}

module.exports = QueryBuilder;

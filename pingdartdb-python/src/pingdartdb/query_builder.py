import math

class QueryBuilder:
    def __init__(self, table_name: str, connection, db_type: str):
        self.table_name = table_name
        self.connection = connection
        self.db_type = db_type
        self.q = '"' if db_type in ['postgresql', 'pgsql'] else '`'

    def _build_where_clause(self, conditions: dict):
        clauses = []
        replacements = []
        
        if not conditions or not isinstance(conditions, dict):
            return clauses, replacements

        for key, value in conditions.items():
            if isinstance(value, dict):
                # BETWEEN operator
                if 'min' in value and 'max' in value:
                    clauses.append(f"{self.q}{key}{self.q} BETWEEN %s AND %s")
                    replacements.extend([value['min'], value['max']])
                elif 'start' in value and 'end' in value:
                    clauses.append(f"{self.q}{key}{self.q} BETWEEN %s AND %s")
                    replacements.extend([value['start'], value['end']])
            elif isinstance(value, list):
                # IN clause
                if len(value) > 0:
                    placeholders = ', '.join(['%s'] * len(value))
                    clauses.append(f"{self.q}{key}{self.q} IN ({placeholders})")
                    replacements.extend(value)
                else:
                    clauses.append("1=0")
            elif isinstance(value, str):
                if value.startswith('!'):
                    clauses.append(f"{self.q}{key}{self.q} != %s")
                    replacements.append(value[1:])
                elif value.startswith('>=') or value.startswith('=>'):
                    clauses.append(f"{self.q}{key}{self.q} >= %s")
                    replacements.append(value[2:])
                elif value.startswith('<=') or value.startswith('=<'):
                    clauses.append(f"{self.q}{key}{self.q} <= %s")
                    replacements.append(value[2:])
                elif value.startswith('>'):
                    clauses.append(f"{self.q}{key}{self.q} > %s")
                    replacements.append(value[1:])
                elif value.startswith('<'):
                    clauses.append(f"{self.q}{key}{self.q} < %s")
                    replacements.append(value[1:])
                else:
                    clauses.append(f"{self.q}{key}{self.q} = %s")
                    replacements.append(value)
            else:
                clauses.append(f"{self.q}{key}{self.q} = %s")
                replacements.append(value)
                
        return clauses, replacements

    def _process_margedata_batch(self, rows: list, margedata_item: dict, search: dict):
        target_table = margedata_item.get('target_table')
        target_column = margedata_item.get('target_column')
        target_value = margedata_item.get('target_value')
        target_label = margedata_item.get('target_label')
        search_fields = margedata_item.get('search_fields', [])
        nested_margedata = margedata_item.get('margedata', [])
        range_data = margedata_item.get('range')

        if not all([target_table, target_column, target_value, target_label]):
            return

        parent_ids = list(set([row[target_value] for row in rows if target_value in row and row[target_value] is not None]))
        
        if not parent_ids:
            for row in rows:
                row[target_label] = []
            return

        conditions = []
        replacements = []

        placeholders = ', '.join(['%s'] * len(parent_ids))
        conditions.append(f"{self.q}{target_column}{self.q} IN ({placeholders})")
        replacements.extend(parent_ids)

        for field in search_fields:
            for search_key, full_column in field.items():
                parts = full_column.split('.')
                column = parts[1] if len(parts) > 1 else parts[0]
                if search and search_key in search and search[search_key]:
                    like_op = 'ILIKE' if self.db_type == 'postgresql' else 'LIKE'
                    conditions.append(f"{self.q}{column}{self.q} {like_op} %s")
                    replacements.append(f"%{search[search_key]}%")

        if isinstance(range_data, dict) and all(k in range_data for k in ['latitude', 'longitude', 'radius', 'target_latitude', 'target_longitude']):
            earth_radius = 6371
            conditions.append(f"""
                ({earth_radius} * ACOS(
                    COS(RADIANS(%s)) *
                    COS(RADIANS({self.q}{range_data['target_latitude']}{self.q})) *
                    COS(RADIANS({self.q}{range_data['target_longitude']}{self.q}) - RADIANS(%s)) +
                    SIN(RADIANS(%s)) *
                    SIN(RADIANS({self.q}{range_data['target_latitude']}{self.q}))
                )) <= %s
            """)
            replacements.extend([
                range_data['latitude'],
                range_data['longitude'],
                range_data['latitude'],
                range_data['radius']
            ])

        query = f"SELECT * FROM {self.q}{target_table}{self.q} WHERE {' AND '.join(conditions)}"
        
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, replacements)
                all_matches = cursor.fetchall()
                
            grouped_matches = {}
            for match in all_matches:
                pid = match[target_column]
                if pid not in grouped_matches:
                    grouped_matches[pid] = []
                grouped_matches[pid].append(match)
                
            for row in rows:
                pid = row[target_value]
                row[target_label] = grouped_matches.get(pid, [])
                
            if nested_margedata and all_matches:
                for child_item in nested_margedata:
                    self._process_margedata_batch(all_matches, child_item, search)
                    
        except Exception as e:
            print(f"Error in batch margedata ({target_label}): {e}")
            for row in rows:
                row[target_label] = []

    def read(self, options: dict = None):
        if options is None:
            options = {}
            
        conditions = options.get('conditions', {})
        search = options.get('search', {})
        order_by = options.get('orderBy')
        pagination = options.get('pagination')
        range_data = options.get('range')
        margedata = options.get('margedata', [])

        query = f"SELECT * FROM {self.q}{self.table_name}{self.q} WHERE 1=1"
        replacements = []

        cond_clauses, cond_reps = self._build_where_clause(conditions)
        if cond_clauses:
            query += " AND " + " AND ".join(cond_clauses)
            replacements.extend(cond_reps)

        if isinstance(search, dict) and search:
            search_clauses = []
            for key, value in search.items():
                if value:
                    like_op = 'ILIKE' if self.db_type == 'postgresql' else 'LIKE'
                    search_clauses.append(f"{self.q}{key}{self.q} {like_op} %s")
                    replacements.append(f"%{value}%")
            if search_clauses:
                query += " AND (" + " OR ".join(search_clauses) + ")"

        if isinstance(range_data, dict) and all(k in range_data for k in ['latitude', 'longitude', 'radius', 'target_latitude', 'target_longitude']):
            earth_radius = 6371
            join_table = range_data.get('table_name')
            
            if not join_table or join_table == self.table_name:
                query += f""" AND (
                    {earth_radius} * ACOS(
                        COS(RADIANS(%s)) *
                        COS(RADIANS({self.q}{range_data['target_latitude']}{self.q})) *
                        COS(RADIANS({self.q}{range_data['target_longitude']}{self.q}) - RADIANS(%s)) +
                        SIN(RADIANS(%s)) *
                        SIN(RADIANS({self.q}{range_data['target_latitude']}{self.q}))
                    )
                ) <= %s"""
                replacements.extend([range_data['latitude'], range_data['longitude'], range_data['latitude'], range_data['radius']])
            else:
                alias = 'rt'
                join_col = range_data.get('join_column', 'user_id')
                main_col = range_data.get('main_join_column', 'id')
                query += f""" AND EXISTS (
                    SELECT 1 FROM {self.q}{join_table}{self.q} AS {alias}
                    WHERE {alias}.{self.q}{join_col}{self.q} = {self.q}{self.table_name}{self.q}.{self.q}{main_col}{self.q}
                    AND (
                        {earth_radius} * ACOS(
                            COS(RADIANS(%s)) *
                            COS(RADIANS({alias}.{self.q}{range_data['target_latitude']}{self.q})) *
                            COS(RADIANS({alias}.{self.q}{range_data['target_longitude']}{self.q}) - RADIANS(%s)) +
                            SIN(RADIANS(%s)) *
                            SIN(RADIANS({alias}.{self.q}{range_data['target_latitude']}{self.q}))
                        )
                    ) <= %s
                )"""
                replacements.extend([range_data['latitude'], range_data['longitude'], range_data['latitude'], range_data['radius']])

        if order_by:
            query += f" ORDER BY {order_by}"

        count_query = query.replace("SELECT *", "SELECT COUNT(*) as total", 1)
        
        with self.connection.cursor() as cursor:
            cursor.execute(count_query, replacements)
            total_count = cursor.fetchone()['total']

        total_pages = 0
        if isinstance(pagination, dict) and 'page' in pagination and 'limit' in pagination:
            page = max(1, int(pagination['page']))
            limit = int(pagination['limit'])
            offset = (page - 1) * limit
            query += f" LIMIT {limit} OFFSET {offset}"
            total_pages = math.ceil(total_count / limit)

        with self.connection.cursor() as cursor:
            cursor.execute(query, replacements)
            results = cursor.fetchall()

        if margedata and results:
            for md_item in margedata:
                self._process_margedata_batch(results, md_item, search)

        return {
            'success': True,
            'data': results,
            'totalCount': total_count,
            'totalPages': total_pages
        }

    def insert(self, arg1, arg2=None):
        data = None
        conditions = None

        if arg2 is not None:
            data = arg2
            if isinstance(arg1, dict) and 'conditions' in arg1:
                conditions = arg1['conditions']
        else:
            data = arg1

        if not data:
            raise Exception("Data object cannot be empty")

        is_bulk = isinstance(data, list)
        records = data if is_bulk else [data]

        if not records:
            raise Exception("Data array cannot be empty")

        if isinstance(conditions, dict) and conditions:
            if not is_bulk:
                cond_clauses, check_reps = self._build_where_clause(conditions)
                if cond_clauses:
                    check_query = f"SELECT COUNT(*) as total FROM {self.q}{self.table_name}{self.q} WHERE " + " AND ".join(cond_clauses)
                    with self.connection.cursor() as cursor:
                        cursor.execute(check_query, check_reps)
                        existing_count = cursor.fetchone()['total']
                        if existing_count > 0:
                            return {
                                'success': False,
                                'exists': True,
                                'message': 'Record already exists matching the given conditions. Insert skipped.'
                            }
            else:
                condition_keys = list(conditions.keys())
                to_insert = []
                skipped = []

                for record in records:
                    per_record_conditions = {}
                    for key in condition_keys:
                        per_record_conditions[key] = record.get(key, conditions[key])
                        
                    cond_clauses, check_reps = self._build_where_clause(per_record_conditions)
                    if cond_clauses:
                        check_query = f"SELECT COUNT(*) as total FROM {self.q}{self.table_name}{self.q} WHERE " + " AND ".join(cond_clauses)
                        with self.connection.cursor() as cursor:
                            cursor.execute(check_query, check_reps)
                            if cursor.fetchone()['total'] > 0:
                                skipped.append(record)
                            else:
                                to_insert.append(record)
                    else:
                        to_insert.append(record)

                if not to_insert:
                    return {
                        'success': False,
                        'exists': True,
                        'message': f"All {len(records)} records already exist. Insert skipped.",
                        'skipped': len(skipped)
                    }
                records = to_insert # Swap for actual execution
                
        keys = list(records[0].keys())
        columns = ", ".join([f"{self.q}{k}{self.q}" for k in keys])
        
        value_sets = []
        replacements = []
        
        for record in records:
            placeholders = ", ".join(["%s"] * len(keys))
            value_sets.append(f"({placeholders})")
            replacements.extend([record.get(k) for k in keys])

        query = f"INSERT INTO {self.q}{self.table_name}{self.q} ({columns}) VALUES " + ", ".join(value_sets)
        
        with self.connection.cursor() as cursor:
            cursor.execute(query, replacements)
            inserted_rows = cursor.rowcount

        msg = f"{len(records)} record(s) inserted. {len(records) - len(records)} duplicate(s) skipped." if is_bulk and conditions else \
              f"{len(records)} records inserted successfully." if is_bulk else "Record inserted successfully."

        res = {
            'success': True,
            'message': msg,
            'insertedRows': inserted_rows
        }
        
        if is_bulk and conditions:
            res['inserted'] = len(records)
            res['skipped'] = len(data) - len(records)
            
        return res

    def update(self, data: dict, conditions: dict):
        if not conditions:
            raise Exception("Update requires conditions to prevent bulk overwrite.")

        set_clauses = []
        replacements = []
        
        for k, v in data.items():
            set_clauses.append(f"{self.q}{k}{self.q} = %s")
            replacements.append(v)

        cond_clauses, cond_reps = self._build_where_clause(conditions)
        if not cond_clauses:
            raise Exception("Update conditions could not be generated. Aborting to prevent bulk update.")
            
        replacements.extend(cond_reps)

        query = f"UPDATE {self.q}{self.table_name}{self.q} SET {', '.join(set_clauses)} WHERE {' AND '.join(cond_clauses)}"
        
        with self.connection.cursor() as cursor:
            cursor.execute(query, replacements)
            affected = cursor.rowcount

        return {
            'success': True,
            'message': "Record(s) updated successfully.",
            'affectedRows': affected
        }

    def delete(self, conditions: dict):
        if not conditions:
            raise Exception("Delete requires conditions to prevent bulk delete.")

        cond_clauses, replacements = self._build_where_clause(conditions)
        if not cond_clauses:
            raise Exception("Delete conditions could not be generated. Aborting to prevent bulk delete.")

        query = f"DELETE FROM {self.q}{self.table_name}{self.q} WHERE {' AND '.join(cond_clauses)}"
        
        with self.connection.cursor() as cursor:
            cursor.execute(query, replacements)
            affected = cursor.rowcount

        return {
            'success': True,
            'message': "Record(s) deleted successfully.",
            'affectedRows': affected
        }

    def count(self, conditions: dict = None):
        if conditions is None:
            conditions = {}
            
        query = f"SELECT COUNT(*) as count FROM {self.q}{self.table_name}{self.q}"
        cond_clauses, replacements = self._build_where_clause(conditions)
        
        if cond_clauses:
            query += " WHERE " + " AND ".join(cond_clauses)
            
        with self.connection.cursor() as cursor:
            cursor.execute(query, replacements)
            return cursor.fetchone()['count']

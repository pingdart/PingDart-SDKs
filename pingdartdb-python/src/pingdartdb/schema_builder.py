class SchemaBuilder:
    def __init__(self, connection, db_type: str):
        self.connection = connection
        self.db_type = db_type
        self.q = '"' if db_type in ['postgresql', 'pgsql'] else '`'

    def create_table(self, table_name: str, columns: list = None):
        if not columns:
            columns = []
            
        if columns:
            col_strings = [f"{self.q}{col['name']}{self.q} {col['type']}" for col in columns]
            columns_string = ", ".join(col_strings)
            query = f"CREATE TABLE IF NOT EXISTS {self.q}{table_name}{self.q} ({columns_string})"
        else:
            id_type = "SERIAL PRIMARY KEY" if self.db_type in ['postgresql', 'pgsql'] else "INT AUTO_INCREMENT PRIMARY KEY"
            on_update = "ON UPDATE CURRENT_TIMESTAMP" if self.db_type == 'mysql' else ""
            query = f"""
                CREATE TABLE IF NOT EXISTS {self.q}{table_name}{self.q} (
                    {self.q}id{self.q} {id_type},
                    {self.q}created_at{self.q} TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    {self.q}updated_at{self.q} TIMESTAMP DEFAULT CURRENT_TIMESTAMP {on_update}
                )
            """

        with self.connection.cursor() as cursor:
            cursor.execute(query)
            
        return {'success': True, 'message': f"Table {table_name} created successfully."}

    def drop_table(self, table_name: str):
        query = f"DROP TABLE IF EXISTS {self.q}{table_name}{self.q}"
        with self.connection.cursor() as cursor:
            cursor.execute(query)
        return {'success': True, 'message': f"Table {table_name} dropped successfully."}

    def get_columns(self, table_name: str):
        if self.db_type == 'mysql':
            query = f"SHOW COLUMNS FROM `{table_name}`"
        else:
            query = f"SELECT column_name as \"Field\", data_type as \"Type\" FROM information_schema.columns WHERE table_name = '{table_name}'"

        with self.connection.cursor() as cursor:
            cursor.execute(query)
            return cursor.fetchall()

package pingdartdb

import (
	"database/sql"
	"fmt"
	"strings"
)

type ColumnDef struct {
	Name string
	Type string
}

type SchemaBuilder struct {
	DB     *sql.DB
	DbType string
	Q      string
}

func NewSchemaBuilder(db *sql.DB, dbType string) *SchemaBuilder {
	q := "`"
	if dbType == "postgresql" || dbType == "pgsql" {
		q = "\""
	}
	return &SchemaBuilder{
		DB:     db,
		DbType: dbType,
		Q:      q,
	}
}

func (sb *SchemaBuilder) CreateTable(tableName string, columns []ColumnDef) (map[string]interface{}, error) {
	var query string

	if len(columns) > 0 {
		var colStrings []string
		for _, col := range columns {
			colStrings = append(colStrings, fmt.Sprintf("%s%s%s %s", sb.Q, col.Name, sb.Q, col.Type))
		}
		query = fmt.Sprintf("CREATE TABLE IF NOT EXISTS %s%s%s (%s)", sb.Q, tableName, sb.Q, strings.Join(colStrings, ", "))
	} else {
		idType := "INT AUTO_INCREMENT PRIMARY KEY"
		if sb.DbType == "postgresql" || sb.DbType == "pgsql" {
			idType = "SERIAL PRIMARY KEY"
		}
		onUpdate := ""
		if sb.DbType == "mysql" {
			onUpdate = "ON UPDATE CURRENT_TIMESTAMP"
		}

		query = fmt.Sprintf(`CREATE TABLE IF NOT EXISTS %s%s%s (
			%sid%s %s,
			%screated_at%s TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			%supdated_at%s TIMESTAMP DEFAULT CURRENT_TIMESTAMP %s
		)`, sb.Q, tableName, sb.Q, sb.Q, sb.Q, idType, sb.Q, sb.Q, sb.Q, sb.Q, onUpdate)
	}

	_, err := sb.DB.Exec(query)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Table %s created successfully.", tableName),
	}, nil
}

func (sb *SchemaBuilder) DropTable(tableName string) (map[string]interface{}, error) {
	query := fmt.Sprintf("DROP TABLE IF EXISTS %s%s%s", sb.Q, tableName, sb.Q)
	_, err := sb.DB.Exec(query)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Table %s dropped successfully.", tableName),
	}, nil
}

func (sb *SchemaBuilder) GetColumns(tableName string) ([]map[string]interface{}, error) {
	var query string
	if sb.DbType == "mysql" {
		query = fmt.Sprintf("SHOW COLUMNS FROM `%s`", tableName)
	} else {
		query = fmt.Sprintf(`SELECT column_name as "Field", data_type as "Type" FROM information_schema.columns WHERE table_name = '%s'`, tableName)
	}

	rows, err := sb.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	cols, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	var results []map[string]interface{}
	for rows.Next() {
		columns := make([]interface{}, len(cols))
		columnPointers := make([]interface{}, len(cols))
		for i := range columns {
			columnPointers[i] = &columns[i]
		}

		if err := rows.Scan(columnPointers...); err != nil {
			return nil, err
		}

		rowMap := make(map[string]interface{})
		for i, colName := range cols {
			val := columnPointers[i].(*interface{})
			if b, ok := (*val).([]byte); ok {
				rowMap[colName] = string(b)
			} else {
				rowMap[colName] = *val
			}
		}
		results = append(results, rowMap)
	}

	return results, nil
}

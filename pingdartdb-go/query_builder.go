package pingdartdb

import (
	"database/sql"
	"fmt"
	"math"
	"strings"
)

type QueryBuilder struct {
	TableName string
	DB        *sql.DB
	DbType    string
	Q         string
}

func NewQueryBuilder(tableName string, db *sql.DB, dbType string) *QueryBuilder {
	q := "`"
	if dbType == "postgresql" || dbType == "pgsql" {
		q = "\""
	}
	return &QueryBuilder{
		TableName: tableName,
		DB:        db,
		DbType:    dbType,
		Q:         q,
	}
}

func (qb *QueryBuilder) buildWhereClause(conditions map[string]interface{}) ([]string, []interface{}) {
	var clauses []string
	var replacements []interface{}

	for key, value := range conditions {
		switch v := value.(type) {
		case map[string]interface{}:
			if min, okMin := v["min"]; okMin {
				if max, okMax := v["max"]; okMax {
					clauses = append(clauses, fmt.Sprintf("%s%s%s BETWEEN ? AND ?", qb.Q, key, qb.Q))
					replacements = append(replacements, min, max)
				}
			} else if start, okStart := v["start"]; okStart {
				if end, okEnd := v["end"]; okEnd {
					clauses = append(clauses, fmt.Sprintf("%s%s%s BETWEEN ? AND ?", qb.Q, key, qb.Q))
					replacements = append(replacements, start, end)
				}
			}
		case []interface{}:
			if len(v) > 0 {
				placeholders := make([]string, len(v))
				for i := range v {
					placeholders[i] = "?"
					replacements = append(replacements, v[i])
				}
				clauses = append(clauses, fmt.Sprintf("%s%s%s IN (%s)", qb.Q, key, qb.Q, strings.Join(placeholders, ", ")))
			} else {
				clauses = append(clauses, "1=0")
			}
		case string:
			if strings.HasPrefix(v, "!") {
				clauses = append(clauses, fmt.Sprintf("%s%s%s != ?", qb.Q, key, qb.Q))
				replacements = append(replacements, v[1:])
			} else if strings.HasPrefix(v, ">=") {
				clauses = append(clauses, fmt.Sprintf("%s%s%s >= ?", qb.Q, key, qb.Q))
				replacements = append(replacements, v[2:])
			} else if strings.HasPrefix(v, "<=") {
				clauses = append(clauses, fmt.Sprintf("%s%s%s <= ?", qb.Q, key, qb.Q))
				replacements = append(replacements, v[2:])
			} else if strings.HasPrefix(v, ">") {
				clauses = append(clauses, fmt.Sprintf("%s%s%s > ?", qb.Q, key, qb.Q))
				replacements = append(replacements, v[1:])
			} else if strings.HasPrefix(v, "<") {
				clauses = append(clauses, fmt.Sprintf("%s%s%s < ?", qb.Q, key, qb.Q))
				replacements = append(replacements, v[1:])
			} else {
				clauses = append(clauses, fmt.Sprintf("%s%s%s = ?", qb.Q, key, qb.Q))
				replacements = append(replacements, v)
			}
		default:
			clauses = append(clauses, fmt.Sprintf("%s%s%s = ?", qb.Q, key, qb.Q))
			replacements = append(replacements, v)
		}
	}

	return clauses, replacements
}

// Executes arbitrary query and returns list of generic maps
func (qb *QueryBuilder) fetchRows(query string, args []interface{}) ([]map[string]interface{}, error) {
	rows, err := qb.DB.Query(query, args...)
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

func (qb *QueryBuilder) processMargedata(rows []map[string]interface{}, margedataItem map[string]interface{}, search map[string]interface{}) {
	targetTable, _ := margedataItem["target_table"].(string)
	targetColumn, _ := margedataItem["target_column"].(string)
	targetValue, _ := margedataItem["target_value"].(string)
	targetLabel, _ := margedataItem["target_label"].(string)

	if targetTable == "" || targetColumn == "" || targetValue == "" || targetLabel == "" {
		return
	}

	parentIdsMap := make(map[interface{}]bool)
	for _, row := range rows {
		if val, ok := row[targetValue]; ok && val != nil {
			parentIdsMap[val] = true
		}
	}

	if len(parentIdsMap) == 0 {
		for _, row := range rows {
			row[targetLabel] = []map[string]interface{}{}
		}
		return
	}

	var conditions []string
	var replacements []interface{}

	var placeholders []string
	for pid := range parentIdsMap {
		placeholders = append(placeholders, "?")
		replacements = append(replacements, pid)
	}
	conditions = append(conditions, fmt.Sprintf("%s%s%s IN (%s)", qb.Q, targetColumn, qb.Q, strings.Join(placeholders, ", ")))

	query := fmt.Sprintf("SELECT * FROM %s%s%s WHERE %s", qb.Q, targetTable, qb.Q, strings.Join(conditions, " AND "))
	allMatches, err := qb.fetchRows(query, replacements)
	if err != nil {
		for _, row := range rows {
			row[targetLabel] = []map[string]interface{}{}
		}
		return
	}

	groupedMatches := make(map[interface{}][]map[string]interface{})
	for _, match := range allMatches {
		pid := match[targetColumn]
		// Handle string parsing issue if numeric ID was read as string byte
		if b, ok := pid.([]byte); ok {
			pid = string(b)
		}
		
		groupedMatches[pid] = append(groupedMatches[pid], match)
	}

	for _, row := range rows {
		pid := row[targetValue]
		if b, ok := pid.([]byte); ok {
			pid = string(b)
		}
		
		if matches, ok := groupedMatches[pid]; ok {
			row[targetLabel] = matches
		} else {
			row[targetLabel] = []map[string]interface{}{}
		}
	}
}

func (qb *QueryBuilder) Read(options map[string]interface{}) (map[string]interface{}, error) {
	if options == nil {
		options = make(map[string]interface{})
	}

	conditions, _ := options["conditions"].(map[string]interface{})
	search, _ := options["search"].(map[string]interface{})
	orderBy, _ := options["orderBy"].(string)
	pagination, _ := options["pagination"].(map[string]interface{})
	rangeData, _ := options["range"].(map[string]interface{})
	margedata, _ := options["margedata"].([]interface{})

	query := fmt.Sprintf("SELECT * FROM %s%s%s WHERE 1=1", qb.Q, qb.TableName, qb.Q)
	var replacements []interface{}

	condClauses, condReps := qb.buildWhereClause(conditions)
	if len(condClauses) > 0 {
		query += " AND " + strings.Join(condClauses, " AND ")
		replacements = append(replacements, condReps...)
	}

	if len(search) > 0 {
		var searchClauses []string
		for key, value := range search {
			if strVal, ok := value.(string); ok && strVal != "" {
				likeOp := "LIKE"
				if qb.DbType == "postgresql" {
					likeOp = "ILIKE"
				}
				searchClauses = append(searchClauses, fmt.Sprintf("%s%s%s %s ?", qb.Q, key, qb.Q, likeOp))
				replacements = append(replacements, "%"+strVal+"%")
			}
		}
		if len(searchClauses) > 0 {
			query += " AND (" + strings.Join(searchClauses, " OR ") + ")"
		}
	}

	if rangeData != nil {
		if lat, okLat := rangeData["latitude"].(float64); okLat {
			if lng, okLng := rangeData["longitude"].(float64); okLng {
				if rad, okRad := rangeData["radius"].(float64); okRad {
					tLat, _ := rangeData["target_latitude"].(string)
					tLng, _ := rangeData["target_longitude"].(string)

					query += fmt.Sprintf(` AND (
						6371 * ACOS(
							COS(RADIANS(?)) *
							COS(RADIANS(%s%s%s)) *
							COS(RADIANS(%s%s%s) - RADIANS(?)) +
							SIN(RADIANS(?)) *
							SIN(RADIANS(%s%s%s))
						)
					) <= ?`, qb.Q, tLat, qb.Q, qb.Q, tLng, qb.Q, qb.Q, tLat, qb.Q)
					replacements = append(replacements, lat, lng, lat, rad)
				}
			}
		}
	}

	if orderBy != "" {
		query += " ORDER BY " + orderBy
	}

	countQuery := strings.Replace(query, "SELECT *", "SELECT COUNT(*) as total", 1)
	var totalCount int
	err := qb.DB.QueryRow(countQuery, replacements...).Scan(&totalCount)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	var totalPages float64 = 0
	if pagination != nil {
		pageFl, _ := pagination["page"].(float64)
		limitFl, _ := pagination["limit"].(float64)
		
		page := int(pageFl)
		if page < 1 {
			page = 1
		}
		limit := int(limitFl)
		
		if limit > 0 {
			offset := (page - 1) * limit
			query += fmt.Sprintf(" LIMIT %d OFFSET %d", limit, offset)
			totalPages = math.Ceil(float64(totalCount) / float64(limit))
		}
	}

	results, err := qb.fetchRows(query, replacements)
	if err != nil {
		return nil, err
	}

	if len(margedata) > 0 && len(results) > 0 {
		for _, mdItem := range margedata {
			if mdMap, ok := mdItem.(map[string]interface{}); ok {
				qb.processMargedata(results, mdMap, search)
			}
		}
	}

	return map[string]interface{}{
		"success":    true,
		"data":       results,
		"totalCount": totalCount,
		"totalPages": totalPages,
	}, nil
}

func (qb *QueryBuilder) Delete(conditions map[string]interface{}) (map[string]interface{}, error) {
	if len(conditions) == 0 {
		return nil, fmt.Errorf("Delete requires conditions to prevent bulk delete.")
	}

	condClauses, replacements := qb.buildWhereClause(conditions)
	if len(condClauses) == 0 {
		return nil, fmt.Errorf("Delete conditions could not be generated.")
	}

	query := fmt.Sprintf("DELETE FROM %s%s%s WHERE %s", qb.Q, qb.TableName, qb.Q, strings.Join(condClauses, " AND "))
	result, err := qb.DB.Exec(query, replacements...)
	if err != nil {
		return nil, err
	}

	affected, _ := result.RowsAffected()
	return map[string]interface{}{
		"success":      true,
		"message":      "Record(s) deleted successfully.",
		"affectedRows": affected,
	}, nil
}

func (qb *QueryBuilder) Update(data map[string]interface{}, conditions map[string]interface{}) (map[string]interface{}, error) {
	if len(conditions) == 0 {
		return nil, fmt.Errorf("Update requires conditions to prevent bulk overwrite.")
	}

	var setClauses []string
	var replacements []interface{}

	for k, v := range data {
		setClauses = append(setClauses, fmt.Sprintf("%s%s%s = ?", qb.Q, k, qb.Q))
		replacements = append(replacements, v)
	}

	condClauses, condReps := qb.buildWhereClause(conditions)
	if len(condClauses) == 0 {
		return nil, fmt.Errorf("Update conditions could not be generated.")
	}
	replacements = append(replacements, condReps...)

	query := fmt.Sprintf("UPDATE %s%s%s SET %s WHERE %s", qb.Q, qb.TableName, qb.Q, strings.Join(setClauses, ", "), strings.Join(condClauses, " AND "))
	
	result, err := qb.DB.Exec(query, replacements...)
	if err != nil {
		return nil, err
	}

	affected, _ := result.RowsAffected()
	return map[string]interface{}{
		"success":      true,
		"message":      "Record(s) updated successfully.",
		"affectedRows": affected,
	}, nil
}

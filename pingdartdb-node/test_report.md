# PingDartDB Node SDK - Test Report

### 1. Plain Single Insert
**Code Executed:**
```javascript
await db.table('test_users').insert({
  name: 'Alice',
  email: 'alice@example.com',
  age: 25,
  status: 'active',
  lat: 40.7128,
  lng: -74.0060
});
```
**Response / Output:**
```json
{
  "success": true,
  "message": "Record inserted successfully.",
  "insertedRows": 1
}
```
---
### 2. Single Insert with Duplicate Check
**Code Executed:**
```javascript
await db.table('test_users').insert(
  { conditions: { email: 'alice@example.com' } },
  { name: 'Alice Dup', email: 'alice@example.com', age: 30, status: 'active' }
);
```
**Response / Output:**
```json
{
  "success": false,
  "exists": true,
  "message": "Record already exists matching the given conditions. Insert skipped."
}
```
---
### 3. Plain Bulk Insert
**Code Executed:**
```javascript
await db.table('test_users').insert([
  { name: 'Bob', email: 'bob@example.com', age: 30, status: 'active', lat: ... },
  { name: 'Charlie', email: 'charlie@example.com', age: 40, status: 'inactive', lat: ... }
]);
```
**Response / Output:**
```json
{
  "success": true,
  "message": "2 records inserted successfully.",
  "insertedRows": 2
}
```
---
### 4. Bulk Insert with Per-Record Duplicate Check
**Code Executed:**
```javascript
await db.table('test_users').insert(
  { conditions: { email: true } },
  [
    { name: 'David', email: 'david@example.com', age: 22, status: 'active' },
    { name: 'Bob Clone', email: 'bob@example.com', age: 31, status: 'active' } // Skipped
  ]
);
```
**Response / Output:**
```json
{
  "success": true,
  "message": "1 record(s) inserted. 1 duplicate(s) skipped.",
  "inserted": 1,
  "skipped": 1,
  "insertedRows": 4
}
```
---
### 5. Read with Advanced Operators (>= and !)
**Code Executed:**
```javascript
await db.table('test_users').read({
  conditions: { age: '>=25', status: '!inactive' }
});
```
**Response / Output:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Alice",
      "email": "alice@example.com",
      "age": 25,
      "status": "active",
      "lat": "40.71280000",
      "lng": "-74.00600000",
      "created_at": "2026-06-15T04:08:03.000Z"
    },
    {
      "id": 2,
      "name": "Bob",
      "email": "bob@example.com",
      "age": 30,
      "status": "active",
      "lat": "34.05220000",
      "lng": "-118.24370000",
      "created_at": "2026-06-15T04:08:03.000Z"
    }
  ],
  "totalCount": 2,
  "totalPages": 0
}
```
---
### 6. Read with BETWEEN Operator
**Code Executed:**
```javascript
await db.table('test_users').read({
  conditions: { age: { min: 20, max: 35 } }
});
```
**Response / Output:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Alice",
      "email": "alice@example.com",
      "age": 25,
      "status": "active",
      "lat": "40.71280000",
      "lng": "-74.00600000",
      "created_at": "2026-06-15T04:08:03.000Z"
    },
    {
      "id": 2,
      "name": "Bob",
      "email": "bob@example.com",
      "age": 30,
      "status": "active",
      "lat": "34.05220000",
      "lng": "-118.24370000",
      "created_at": "2026-06-15T04:08:03.000Z"
    },
    {
      "id": 4,
      "name": "David",
      "email": "david@example.com",
      "age": 22,
      "status": "active",
      "lat": null,
      "lng": null,
      "created_at": "2026-06-15T04:08:03.000Z"
    }
  ],
  "totalCount": 3,
  "totalPages": 0
}
```
---
### 7. Read with Keyword Search (LIKE)
**Code Executed:**
```javascript
await db.table('test_users').read({
  search: { name: 'ali', email: 'ali' }
});
```
**Response / Output:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Alice",
      "email": "alice@example.com",
      "age": 25,
      "status": "active",
      "lat": "40.71280000",
      "lng": "-74.00600000",
      "created_at": "2026-06-15T04:08:03.000Z"
    }
  ],
  "totalCount": 1,
  "totalPages": 0
}
```
---
### 8. Read with Margedata (Fetching Related Orders)
**Code Executed:**
```javascript
await db.table('test_users').read({
  conditions: { name: 'Alice' },
  margedata: [{
    target_table: 'test_orders',
    target_column: 'user_id',
    target_value: 'id',
    target_label: 'orders'
  }]
});
```
**Response / Output:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Alice",
      "email": "alice@example.com",
      "age": 25,
      "status": "active",
      "lat": "40.71280000",
      "lng": "-74.00600000",
      "created_at": "2026-06-15T04:08:03.000Z",
      "orders": [
        {
          "id": 1,
          "user_id": 1,
          "product": "Laptop",
          "total": "1200.00"
        },
        {
          "id": 2,
          "user_id": 1,
          "product": "Mouse",
          "total": "25.50"
        }
      ]
    }
  ],
  "totalCount": 1,
  "totalPages": 0
}
```
---
### 9. Read with Geolocation Range (Radius Filter)
**Code Executed:**
```javascript
await db.table('test_users').read({
  range: {
    latitude: 40.7128,
    longitude: -74.0060,
    radius: 10000, // KM
    target_latitude: 'lat',
    target_longitude: 'lng'
  }
});
```
**Response / Output:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Alice",
      "email": "alice@example.com",
      "age": 25,
      "status": "active",
      "lat": "40.71280000",
      "lng": "-74.00600000",
      "created_at": "2026-06-15T04:08:03.000Z"
    },
    {
      "id": 2,
      "name": "Bob",
      "email": "bob@example.com",
      "age": 30,
      "status": "active",
      "lat": "34.05220000",
      "lng": "-118.24370000",
      "created_at": "2026-06-15T04:08:03.000Z"
    },
    {
      "id": 3,
      "name": "Charlie",
      "email": "charlie@example.com",
      "age": 40,
      "status": "inactive",
      "lat": "51.50740000",
      "lng": "-0.12780000",
      "created_at": "2026-06-15T04:08:03.000Z"
    }
  ],
  "totalCount": 3,
  "totalPages": 0
}
```
---
### 10. Update Records (Setting inactive to banned)
**Code Executed:**
```javascript
await db.table('test_users').update(
  { status: 'inactive' },
  { status: 'banned' }
);
```
**Response / Output:**
```json
{
  "success": true,
  "message": "Record(s) updated successfully.",
  "affectedRows": 1
}
```
---
### 11. Count Records
**Code Executed:**
```javascript
await db.table('test_users').count({ status: 'banned' });
```
**Response / Output:**
```json
{
  "count": 1
}
```
---
### 12. Delete Records
**Code Executed:**
```javascript
await db.table('test_users').delete({ status: 'banned' });
```
**Response / Output:**
```json
{
  "success": true,
  "message": "Record(s) deleted successfully."
}
```
---
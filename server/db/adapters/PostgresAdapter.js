import pool from '../../config/database.js';

class PostgresAdapter {
  constructor() {
    this.pool = pool;
  }

  async query(sql, params = []) {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  async findAll(table, filter = {}, options = {}) {
    let sql = `SELECT * FROM ${table}`;
    const params = [];
    const whereClauses = [];
    let paramIndex = 1;

    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        whereClauses.push(`${key} = $${paramIndex++}`);
        params.push(value);
      }
    });

    if (whereClauses.length > 0) {
      sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    }

    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    if (options.offset) {
      sql += ` OFFSET ${options.offset}`;
    }

    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  async findOne(table, filter) {
    const rows = await this.findAll(table, filter, { limit: 1 });
    return rows[0] || null;
  }

  async findById(table, id) {
    const result = await this.pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async create(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const result = await this.pool.query(sql, values);
    return result.rows[0];
  }

  async update(table, id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
    const result = await this.pool.query(sql, [...values, id]);
    return result.rows[0];
  }

  async delete(table, id) {
    const result = await this.pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id]);
    return result.rows[0];
  }

  async count(table, filter = {}) {
    let sql = `SELECT COUNT(*) FROM ${table}`;
    const params = [];
    const whereClauses = [];
    let paramIndex = 1;

    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        whereClauses.push(`${key} = $${paramIndex++}`);
        params.push(value);
      }
    });

    if (whereClauses.length > 0) {
      sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    const result = await this.pool.query(sql, params);
    return parseInt(result.rows[0].count);
  }
}

export default PostgresAdapter;

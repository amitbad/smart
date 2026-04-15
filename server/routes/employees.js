import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.*,
        m.name as manager_name
      FROM employees e
      LEFT JOIN employees m ON e.manager_id = m.id
      ORDER BY e.level, e.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

router.get('/hierarchy', async (req, res) => {
  try {
    const result = await pool.query(`
      WITH RECURSIVE employee_hierarchy AS (
        SELECT 
          id, name, email, designation, level, manager_id,
          ARRAY[id] as path,
          0 as depth
        FROM employees
        WHERE manager_id IS NULL
        
        UNION ALL
        
        SELECT 
          e.id, e.name, e.email, e.designation, e.level, e.manager_id,
          eh.path || e.id,
          eh.depth + 1
        FROM employees e
        INNER JOIN employee_hierarchy eh ON e.manager_id = eh.id
      )
      SELECT * FROM employee_hierarchy
      ORDER BY path
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    res.status(500).json({ error: 'Failed to fetch hierarchy' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        e.*,
        m.name as manager_name
      FROM employees e
      LEFT JOIN employees m ON e.manager_id = m.id
      WHERE e.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

router.get('/:id/reportees', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT * FROM employees
      WHERE manager_id = $1
      ORDER BY name
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reportees:', error);
    res.status(500).json({ error: 'Failed to fetch reportees' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, designation, level, manager_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const result = await pool.query(`
      INSERT INTO employees (name, email, designation, level, manager_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, email, designation, level, manager_id]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, designation, level, manager_id } = req.body;
    
    const result = await pool.query(`
      UPDATE employees
      SET name = COALESCE($1, name),
          email = COALESCE($2, email),
          designation = COALESCE($3, designation),
          level = COALESCE($4, level),
          manager_id = COALESCE($5, manager_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [name, email, designation, level, manager_id, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

export default router;

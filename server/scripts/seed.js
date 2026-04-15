import pool from '../config/database.js';

async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...\n');

  try {
    const employees = [
      { name: 'Sarah Williams', email: 'sarah.w@company.com', designation: 'CEO', level: 1, manager_id: null },
      { name: 'Michael Chen', email: 'michael.c@company.com', designation: 'VP Engineering', level: 2, manager_id: 1 },
      { name: 'Emma Davis', email: 'emma.d@company.com', designation: 'VP Product', level: 2, manager_id: 1 },
      { name: 'John Doe', email: 'john.doe@company.com', designation: 'Engineering Manager', level: 3, manager_id: 2 },
      { name: 'Alice Smith', email: 'alice.smith@company.com', designation: 'Senior Developer', level: 4, manager_id: 4 },
      { name: 'Bob Johnson', email: 'bob.j@company.com', designation: 'Developer', level: 4, manager_id: 4 },
      { name: 'Carol White', email: 'carol.w@company.com', designation: 'Junior Developer', level: 5, manager_id: 5 },
      { name: 'David Brown', email: 'david.b@company.com', designation: 'Junior Developer', level: 5, manager_id: 5 },
      { name: 'Eve Martinez', email: 'eve.m@company.com', designation: 'Developer', level: 5, manager_id: 6 },
      { name: 'Frank Wilson', email: 'frank.w@company.com', designation: 'Product Manager', level: 3, manager_id: 3 },
      { name: 'Grace Lee', email: 'grace.l@company.com', designation: 'UX Designer', level: 4, manager_id: 10 },
      { name: 'Henry Taylor', email: 'henry.t@company.com', designation: 'UI Designer', level: 4, manager_id: 10 }
    ];

    for (const emp of employees) {
      const query = `
        INSERT INTO employees (name, email, designation, level, manager_id)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await pool.query(query, [emp.name, emp.email, emp.designation, emp.level, emp.manager_id]);
      console.log(`   ✓ Added: ${emp.name} (${emp.designation})`);
    }

    console.log('\n✅ Database seeded successfully!\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

seedDatabase();

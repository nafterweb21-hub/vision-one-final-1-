const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/vision_one' });

async function main() {
  const users = await pool.query('SELECT email FROM "User"');
  console.log("Users:", users.rows);
}

main().catch(console.error).finally(() => pool.end());

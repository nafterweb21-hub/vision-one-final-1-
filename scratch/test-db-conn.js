const { Client } = require('pg');

async function testConnection(connectionString) {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log(`SUCCESS for: ${connectionString.replace(/:([^:@]+)@/, ':***@')}`);
    // Check if vision_one database exists
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname='vision_one'");
    if (res.rows.length > 0) {
      console.log("Database vision_one exists!");
    } else {
      console.log("Database vision_one does not exist. Creating it...");
      await client.query("CREATE DATABASE vision_one");
      console.log("Database vision_one created successfully!");
    }
    await client.end();
    return true;
  } catch (err) {
    console.log(`FAILED for: ${connectionString.replace(/:([^:@]+)@/, ':***@')} - Error: ${err.message}`);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function run() {
  const urls = [
    "postgresql://postgres:postgres@localhost:5432/postgres",
    "postgresql://postgres@localhost:5432/postgres",
    "postgresql://postgres:admin@localhost:5432/postgres",
    "postgresql://postgres:password@localhost:5432/postgres",
    "postgresql://postgres:root@localhost:5432/postgres"
  ];
  for (const url of urls) {
    if (await testConnection(url)) {
      break;
    }
  }
}

run();

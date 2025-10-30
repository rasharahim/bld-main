const fs = require('fs').promises;
const path = require('path');
const db = require('../config/db');

async function runMigrations() {
  try {
    // Read all SQL files from the migrations directory
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(file => file.endsWith('.sql'));

    // Sort files to ensure consistent order
    sqlFiles.sort();

    // Execute each migration file
    for (const file of sqlFiles) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf8');

      // Split the file content into individual statements
      const statements = sql.split(';').filter(stmt => stmt.trim());

      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          await db.execute(statement);
        }
      }

      console.log(`Completed migration: ${file}`);
    }

    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations(); 
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool } from '@neondatabase/serverless';

// Load environment variables
config();

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
    console.log('Running migrations...');

    await migrate(db, { migrationsFolder: './drizzle' });

    console.log('Migrations completed successfully!');
    await pool.end();
    process.exit(0);
}

main().catch((err) => {
    console.error('Migration failed!');
    console.error(err);
    process.exit(1);
});

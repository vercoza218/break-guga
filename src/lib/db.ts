import Database from 'better-sqlite3';
import path from 'path';

const dataDir = process.env.DATA_DIR || process.cwd();
const dbPath = path.join(dataDir, 'data.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initDb(db);
  }
  return db;
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      price REAL NOT NULL,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_name TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      position INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_name TEXT NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      product_image TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      opened_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: add product_image column if missing (for existing databases)
  const histCols = db.prepare("PRAGMA table_info(history)").all() as { name: string }[];
  if (!histCols.some(c => c.name === 'product_image')) {
    db.exec("ALTER TABLE history ADD COLUMN product_image TEXT");
  }

  // Migration: add coming_soon column if missing
  const prodCols = db.prepare("PRAGMA table_info(products)").all() as { name: string }[];
  if (!prodCols.some(c => c.name === 'coming_soon')) {
    db.exec("ALTER TABLE products ADD COLUMN coming_soon INTEGER NOT NULL DEFAULT 0");
  }
}

export default getDb;

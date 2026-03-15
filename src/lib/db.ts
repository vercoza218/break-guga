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

  // Migration: add collection_url column if missing
  const prodCols2 = db.prepare("PRAGMA table_info(products)").all() as { name: string }[];
  if (!prodCols2.some(c => c.name === 'collection_url')) {
    db.exec("ALTER TABLE products ADD COLUMN collection_url TEXT");
  }

  // Battles system
  db.exec(`
    CREATE TABLE IF NOT EXISTS battles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      boosters_per_player INTEGER NOT NULL DEFAULT 1,
      max_players INTEGER NOT NULL DEFAULT 2,
      status TEXT NOT NULL DEFAULT 'open',
      winner_entry_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS battle_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      battle_id INTEGER NOT NULL,
      player_name TEXT NOT NULL,
      best_card TEXT,
      card_rarity INTEGER,
      card_hp INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (battle_id) REFERENCES battles(id) ON DELETE CASCADE
    );
  `);

  // Migration: add avatar and payment_status to battle_entries
  const beCols = db.prepare("PRAGMA table_info(battle_entries)").all() as { name: string }[];
  if (!beCols.some(c => c.name === 'avatar')) {
    db.exec("ALTER TABLE battle_entries ADD COLUMN avatar TEXT");
  }
  if (!beCols.some(c => c.name === 'payment_status')) {
    db.exec("ALTER TABLE battle_entries ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending'");
  }

  // Migration: add title and creator_entry_id to battles
  const btCols = db.prepare("PRAGMA table_info(battles)").all() as { name: string }[];
  if (!btCols.some(c => c.name === 'title')) {
    db.exec("ALTER TABLE battles ADD COLUMN title TEXT");
  }
  if (!btCols.some(c => c.name === 'creator_entry_id')) {
    db.exec("ALTER TABLE battles ADD COLUMN creator_entry_id INTEGER");
  }

  // Migration: add card_value and card_value_2 to battle_entries (price-based criteria)
  const beCols2 = db.prepare("PRAGMA table_info(battle_entries)").all() as { name: string }[];
  if (!beCols2.some(c => c.name === 'card_value')) {
    db.exec("ALTER TABLE battle_entries ADD COLUMN card_value REAL");
  }
  if (!beCols2.some(c => c.name === 'card_value_2')) {
    db.exec("ALTER TABLE battle_entries ADD COLUMN card_value_2 REAL");
  }
  if (!beCols2.some(c => c.name === 'card_image')) {
    db.exec("ALTER TABLE battle_entries ADD COLUMN card_image TEXT");
  }
}

export default getDb;

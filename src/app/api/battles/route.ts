import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

interface BattleRow {
  id: number;
  product_id: number;
  boosters_per_player: number;
  max_players: number;
  status: string;
  winner_entry_id: number | null;
  created_at: string;
}

interface EntryRow {
  id: number;
  battle_id: number;
  player_name: string;
  best_card: string | null;
  card_rarity: number | null;
  card_hp: number | null;
  created_at: string;
}

interface ProductRow {
  id: number;
  name: string;
  price: number;
  image: string | null;
}

export async function GET() {
  const db = getDb();
  const battles = db.prepare(`
    SELECT b.*, p.name as product_name, p.price as product_price, p.image as product_image
    FROM battles b
    JOIN products p ON b.product_id = p.id
    ORDER BY
      CASE b.status
        WHEN 'open' THEN 0
        WHEN 'ready' THEN 1
        WHEN 'live' THEN 2
        WHEN 'finished' THEN 3
      END,
      b.created_at DESC
  `).all() as (BattleRow & ProductRow)[];

  const entries = db.prepare('SELECT * FROM battle_entries ORDER BY created_at ASC').all() as EntryRow[];

  const result = battles.map((battle) => ({
    ...battle,
    entries: entries.filter((e) => e.battle_id === battle.id),
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const { product_id, boosters_per_player, max_players } = body;

  if (!product_id || !boosters_per_player || !max_players) {
    return NextResponse.json({ error: 'Campos obrigatorios' }, { status: 400 });
  }

  const result = db.prepare(
    'INSERT INTO battles (product_id, boosters_per_player, max_players) VALUES (?, ?, ?)'
  ).run(product_id, boosters_per_player, max_players);

  const battle = db.prepare('SELECT * FROM battles WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(battle, { status: 201 });
}

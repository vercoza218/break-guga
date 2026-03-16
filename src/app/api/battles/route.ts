import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

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
  `).all();

  const entries = db.prepare('SELECT * FROM battle_entries ORDER BY created_at ASC').all();

  const result = (battles as Record<string, unknown>[]).map((battle) => ({
    ...battle,
    entries: (entries as Record<string, unknown>[]).filter((e) => (e as { battle_id: number }).battle_id === (battle as { id: number }).id),
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const { product_id, boosters_per_player, max_players, player_name, avatar, title, battle_date } = body;

  if (!product_id || !boosters_per_player || !max_players) {
    return NextResponse.json({ error: 'Campos obrigatorios' }, { status: 400 });
  }

  const battleResult = db.prepare(
    'INSERT INTO battles (product_id, boosters_per_player, max_players, title, battle_date) VALUES (?, ?, ?, ?, ?)'
  ).run(product_id, boosters_per_player, max_players, title || null, battle_date || null);

  const battleId = battleResult.lastInsertRowid;

  // If player_name provided, create the first entry (creator)
  if (player_name) {
    const entryResult = db.prepare(
      'INSERT INTO battle_entries (battle_id, player_name, avatar, payment_status) VALUES (?, ?, ?, ?)'
    ).run(battleId, player_name, avatar || null, 'pending');

    db.prepare('UPDATE battles SET creator_entry_id = ? WHERE id = ?').run(entryResult.lastInsertRowid, battleId);
  }

  const battle = db.prepare('SELECT * FROM battles WHERE id = ?').get(battleId);
  const battleEntries = db.prepare('SELECT * FROM battle_entries WHERE battle_id = ?').all(battleId);
  return NextResponse.json({ ...battle as Record<string, unknown>, entries: battleEntries }, { status: 201 });
}

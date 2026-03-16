import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM battle_ranking ORDER BY wins DESC, best_card_value DESC, losses ASC, player_name ASC'
  ).all() as { id: number; player_name: string; avatar: string | null; wins: number; losses: number; best_card_name: string | null; best_card_value: number | null }[];

  const ranking = rows.map((r) => ({
    ...r,
    best_card_value: r.best_card_value || 0,
    total: r.wins + r.losses,
    win_rate: (r.wins + r.losses) > 0 ? Math.round((r.wins / (r.wins + r.losses)) * 100) : 0,
  }));

  return NextResponse.json(ranking);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const { player_name, avatar, wins, losses, best_card_name, best_card_value } = body;

  if (!player_name) {
    return NextResponse.json({ error: 'Nome obrigatorio' }, { status: 400 });
  }

  const result = db.prepare(
    'INSERT INTO battle_ranking (player_name, avatar, wins, losses, best_card_name, best_card_value) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(player_name, avatar || null, wins || 0, losses || 0, best_card_name || null, best_card_value || 0);

  const entry = db.prepare('SELECT * FROM battle_ranking WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(entry, { status: 201 });
}

export async function DELETE() {
  const db = getDb();
  db.prepare('DELETE FROM battle_ranking').run();
  return NextResponse.json({ success: true });
}

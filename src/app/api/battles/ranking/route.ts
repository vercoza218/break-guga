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

// Sync ranking from battle history
export async function PUT() {
  const db = getDb();

  // Get all finished battles with their entries
  const battles = db.prepare(
    "SELECT id, winner_entry_id FROM battles WHERE status = 'finished'"
  ).all() as { id: number; winner_entry_id: number | null }[];

  const entries = db.prepare(
    `SELECT be.battle_id, be.id as entry_id, be.player_name, be.avatar, be.best_card, be.card_value, be.card_image,
            b.winner_entry_id
     FROM battle_entries be
     JOIN battles b ON b.id = be.battle_id
     WHERE b.status = 'finished'`
  ).all() as { battle_id: number; entry_id: number; player_name: string; avatar: string | null; best_card: string | null; card_value: number | null; card_image: string | null; winner_entry_id: number | null }[];

  // Aggregate per player (case-insensitive name matching)
  const playerMap = new Map<string, {
    player_name: string;
    avatar: string | null;
    wins: number;
    losses: number;
    best_card_name: string | null;
    best_card_value: number;
  }>();

  for (const entry of entries) {
    const key = entry.player_name.toLowerCase().trim();
    let player = playerMap.get(key);
    if (!player) {
      player = {
        player_name: entry.player_name,
        avatar: entry.avatar,
        wins: 0,
        losses: 0,
        best_card_name: null,
        best_card_value: 0,
      };
      playerMap.set(key, player);
    }

    // Use latest avatar if available
    if (entry.avatar) {
      player.avatar = entry.avatar;
    }

    // Count wins/losses
    if (entry.winner_entry_id === entry.entry_id) {
      player.wins++;
    } else {
      player.losses++;
    }

    // Track best card (highest value across all battles)
    const cardVal = entry.card_value || 0;
    if (cardVal > player.best_card_value) {
      player.best_card_value = cardVal;
      player.best_card_name = entry.best_card || null;
    }
  }

  // Replace ranking table
  const syncAll = db.transaction(() => {
    db.prepare('DELETE FROM battle_ranking').run();
    const insert = db.prepare(
      'INSERT INTO battle_ranking (player_name, avatar, wins, losses, best_card_name, best_card_value) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const player of Array.from(playerMap.values())) {
      insert.run(player.player_name, player.avatar, player.wins, player.losses, player.best_card_name, player.best_card_value);
    }
  });
  syncAll();

  // Return updated ranking
  const rows = db.prepare(
    'SELECT * FROM battle_ranking ORDER BY wins DESC, best_card_value DESC, losses ASC, player_name ASC'
  ).all();

  return NextResponse.json({ success: true, count: playerMap.size, ranking: rows });
}

export async function DELETE() {
  const db = getDb();
  db.prepare('DELETE FROM battle_ranking').run();
  return NextResponse.json({ success: true });
}

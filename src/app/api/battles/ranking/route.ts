import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RankingRow {
  player_name: string;
  avatar: string | null;
  total: number;
  wins: number;
}

export async function GET() {
  const db = getDb();

  // Get all entries from finished battles, grouped by player_name (case-insensitive)
  const rows = db.prepare(`
    SELECT
      be.player_name,
      be.avatar,
      COUNT(*) as total,
      SUM(CASE WHEN b.winner_entry_id = be.id THEN 1 ELSE 0 END) as wins
    FROM battle_entries be
    JOIN battles b ON be.battle_id = b.id
    WHERE b.status = 'finished'
    GROUP BY LOWER(be.player_name)
    ORDER BY wins DESC, total ASC
  `).all() as RankingRow[];

  const ranking = rows.map((r) => ({
    player_name: r.player_name,
    avatar: r.avatar,
    total: r.total,
    wins: r.wins,
    losses: r.total - r.wins,
    win_rate: r.total > 0 ? Math.round((r.wins / r.total) * 100) : 0,
  }));

  return NextResponse.json(ranking);
}

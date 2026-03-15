import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const id = params.id;
  const body = await request.json();
  const { player_name, avatar, wins, losses } = body;

  db.prepare(
    'UPDATE battle_ranking SET player_name = ?, avatar = ?, wins = ?, losses = ? WHERE id = ?'
  ).run(player_name, avatar || null, wins || 0, losses || 0, id);

  const entry = db.prepare('SELECT * FROM battle_ranking WHERE id = ?').get(id);
  return NextResponse.json(entry);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  db.prepare('DELETE FROM battle_ranking WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}

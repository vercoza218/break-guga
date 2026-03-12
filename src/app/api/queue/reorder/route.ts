import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { bumpVersion } from '@/lib/version';

export async function PUT(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const { id, direction } = body; // direction: 'up' or 'down'

  if (!id || !direction) {
    return NextResponse.json({ error: 'Campos obrigatórios: id, direction' }, { status: 400 });
  }

  const current = db.prepare('SELECT * FROM queue WHERE id = ?').get(id) as { id: number; position: number } | undefined;
  if (!current) {
    return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
  }

  const targetPos = direction === 'up' ? current.position - 1 : current.position + 1;
  if (targetPos < 1) {
    return NextResponse.json({ error: 'Já está no topo' }, { status: 400 });
  }

  const target = db.prepare('SELECT * FROM queue WHERE position = ?').get(targetPos) as { id: number; position: number } | undefined;
  if (!target) {
    return NextResponse.json({ error: 'Não pode mover mais' }, { status: 400 });
  }

  const swap = db.transaction(() => {
    db.prepare('UPDATE queue SET position = ? WHERE id = ?').run(targetPos, current.id);
    db.prepare('UPDATE queue SET position = ? WHERE id = ?').run(current.position, target.id);
  });
  swap();

  bumpVersion();

  return NextResponse.json({ success: true });
}

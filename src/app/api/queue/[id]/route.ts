import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const id = params.id;

  const existing = db.prepare('SELECT * FROM queue WHERE id = ?').get(id);
  if (!existing) {
    return NextResponse.json({ error: 'Item não encontrado na fila' }, { status: 404 });
  }

  db.prepare('DELETE FROM queue WHERE id = ?').run(id);

  // Recalculate positions
  const items = db.prepare('SELECT id FROM queue ORDER BY position ASC').all() as { id: number }[];
  const updateStmt = db.prepare('UPDATE queue SET position = ? WHERE id = ?');
  items.forEach((item, index) => {
    updateStmt.run(index + 1, item.id);
  });

  return NextResponse.json({ success: true });
}

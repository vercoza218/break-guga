import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { bumpVersion } from '@/lib/version';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const id = params.id;
  const body = await request.json();
  const { buyer_name, quantity } = body;

  const existing = db.prepare('SELECT * FROM history WHERE id = ?').get(id);
  if (!existing) {
    return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
  }

  if (buyer_name !== undefined) {
    db.prepare('UPDATE history SET buyer_name = ? WHERE id = ?').run(buyer_name, id);
  }
  if (quantity !== undefined) {
    db.prepare('UPDATE history SET quantity = ? WHERE id = ?').run(quantity, id);
  }

  bumpVersion();
  const updated = db.prepare('SELECT * FROM history WHERE id = ?').get(id);
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const id = params.id;

  const existing = db.prepare('SELECT * FROM history WHERE id = ?').get(id);
  if (!existing) {
    return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
  }

  db.prepare('DELETE FROM history WHERE id = ?').run(id);
  bumpVersion();
  return NextResponse.json({ success: true });
}

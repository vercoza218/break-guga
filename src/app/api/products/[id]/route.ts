import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const id = params.id;
  const body = await request.json();
  const { name, stock, price, image } = body;

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  }

  db.prepare(
    'UPDATE products SET name = COALESCE(?, name), stock = COALESCE(?, stock), price = COALESCE(?, price), image = COALESCE(?, image) WHERE id = ?'
  ).run(name, stock, price, image, id);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  return NextResponse.json(product);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const id = params.id;

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  }

  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}

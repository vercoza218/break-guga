import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const id = params.id;
  const body = await request.json();
  const { name, stock, price, image, coming_soon, collection_url } = body;

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  }

  db.prepare(
    'UPDATE products SET name = COALESCE(?, name), stock = COALESCE(?, stock), price = COALESCE(?, price), image = COALESCE(?, image), coming_soon = COALESCE(?, coming_soon), collection_url = COALESCE(?, collection_url) WHERE id = ?'
  ).run(name, stock, price, image, coming_soon !== undefined ? (coming_soon ? 1 : 0) : undefined, collection_url !== undefined ? (collection_url || null) : undefined, id);

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

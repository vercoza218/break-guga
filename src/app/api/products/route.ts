import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const { name, stock, price, image, collection_url } = body;

  if (!name || stock == null || price == null) {
    return NextResponse.json({ error: 'Campos obrigatórios: name, stock, price' }, { status: 400 });
  }

  const result = db.prepare(
    'INSERT INTO products (name, stock, price, image, collection_url) VALUES (?, ?, ?, ?, ?)'
  ).run(name, stock, price, image || null, collection_url || null);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(product, { status: 201 });
}

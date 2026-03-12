import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const queue = db.prepare(`
    SELECT q.*, p.name as product_name
    FROM queue q
    JOIN products p ON q.product_id = p.id
    ORDER BY q.position ASC
  `).all();
  return NextResponse.json(queue);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const { buyer_name, product_id, quantity } = body;

  if (!buyer_name || !product_id || !quantity) {
    return NextResponse.json({ error: 'Campos obrigatórios: buyer_name, product_id, quantity' }, { status: 400 });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id) as { id: number; stock: number } | undefined;
  if (!product) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  }

  const maxPos = db.prepare('SELECT MAX(position) as max_pos FROM queue').get() as { max_pos: number | null };
  const nextPos = (maxPos?.max_pos ?? 0) + 1;

  const result = db.prepare(
    'INSERT INTO queue (buyer_name, product_id, quantity, position) VALUES (?, ?, ?, ?)'
  ).run(buyer_name, product_id, quantity, nextPos);

  const entry = db.prepare(`
    SELECT q.*, p.name as product_name
    FROM queue q
    JOIN products p ON q.product_id = p.id
    WHERE q.id = ?
  `).get(result.lastInsertRowid);

  return NextResponse.json(entry, { status: 201 });
}

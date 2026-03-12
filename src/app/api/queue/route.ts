import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const queue = db.prepare(`
    SELECT q.*, p.name as product_name, p.image as product_image
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

  if (product.stock < quantity) {
    return NextResponse.json({ error: 'Estoque insuficiente' }, { status: 400 });
  }

  const addToQueue = db.transaction(() => {
    const maxPos = db.prepare('SELECT MAX(position) as max_pos FROM queue').get() as { max_pos: number | null };
    const nextPos = (maxPos?.max_pos ?? 0) + 1;

    const result = db.prepare(
      'INSERT INTO queue (buyer_name, product_id, quantity, position) VALUES (?, ?, ?, ?)'
    ).run(buyer_name, product_id, quantity, nextPos);

    db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(quantity, product_id);

    return result.lastInsertRowid;
  });

  const lastId = addToQueue();

  const entry = db.prepare(`
    SELECT q.*, p.name as product_name, p.image as product_image
    FROM queue q
    JOIN products p ON q.product_id = p.id
    WHERE q.id = ?
  `).get(lastId);

  return NextResponse.json(entry, { status: 201 });
}

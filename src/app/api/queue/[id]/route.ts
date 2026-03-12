import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { bumpVersion } from '@/lib/version';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const id = params.id;
  const body = await request.json();
  const { buyer_name, quantity } = body;

  const existing = db.prepare(`
    SELECT q.*, p.name as product_name, p.image as product_image, p.stock as product_stock
    FROM queue q
    JOIN products p ON q.product_id = p.id
    WHERE q.id = ?
  `).get(id) as { id: number; buyer_name: string; product_id: number; quantity: number; product_name: string; product_image: string; product_stock: number } | undefined;

  if (!existing) {
    return NextResponse.json({ error: 'Item não encontrado na fila' }, { status: 404 });
  }

  const updateQueue = db.transaction(() => {
    if (buyer_name !== undefined) {
      db.prepare('UPDATE queue SET buyer_name = ? WHERE id = ?').run(buyer_name, id);
    }

    if (quantity !== undefined && quantity !== existing.quantity) {
      const diff = quantity - existing.quantity;
      if (diff > 0) {
        // Increasing quantity — check stock
        if (existing.product_stock < diff) {
          throw new Error('Estoque insuficiente');
        }
        db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(diff, existing.product_id);
      } else {
        // Decreasing quantity — return stock
        db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(Math.abs(diff), existing.product_id);
      }
      db.prepare('UPDATE queue SET quantity = ? WHERE id = ?').run(quantity, id);
    }
  });

  try {
    updateQueue();
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Estoque insuficiente') {
      return NextResponse.json({ error: 'Estoque insuficiente' }, { status: 400 });
    }
    throw err;
  }

  const updated = db.prepare(`
    SELECT q.*, p.name as product_name, p.image as product_image
    FROM queue q
    JOIN products p ON q.product_id = p.id
    WHERE q.id = ?
  `).get(id);

  bumpVersion();

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const id = params.id;

  const existing = db.prepare(`
    SELECT q.*, p.name as product_name, p.image as product_image
    FROM queue q
    JOIN products p ON q.product_id = p.id
    WHERE q.id = ?
  `).get(id) as { id: number; buyer_name: string; product_id: number; product_name: string; product_image: string | null; quantity: number } | undefined;

  if (!existing) {
    return NextResponse.json({ error: 'Item não encontrado na fila' }, { status: 404 });
  }

  const removeFromQueue = db.transaction(() => {
    // Insert into history
    db.prepare(
      'INSERT INTO history (buyer_name, product_id, product_name, product_image, quantity) VALUES (?, ?, ?, ?, ?)'
    ).run(existing.buyer_name, existing.product_id, existing.product_name, existing.product_image, existing.quantity);

    // Delete from queue
    db.prepare('DELETE FROM queue WHERE id = ?').run(id);

    // Recalculate positions
    const items = db.prepare('SELECT id FROM queue ORDER BY position ASC').all() as { id: number }[];
    const updateStmt = db.prepare('UPDATE queue SET position = ? WHERE id = ?');
    items.forEach((item, index) => {
      updateStmt.run(index + 1, item.id);
    });
  });

  removeFromQueue();
  bumpVersion();

  return NextResponse.json({ success: true });
}

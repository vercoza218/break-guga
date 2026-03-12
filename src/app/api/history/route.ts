import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { bumpVersion } from '@/lib/version';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const history = db.prepare('SELECT * FROM history ORDER BY opened_at DESC').all();
  return NextResponse.json(history);
}

export async function DELETE() {
  const db = getDb();
  db.prepare('DELETE FROM history').run();
  bumpVersion();
  return NextResponse.json({ success: true });
}

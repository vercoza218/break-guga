import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const history = db.prepare('SELECT * FROM history ORDER BY opened_at DESC').all();
  return NextResponse.json(history);
}

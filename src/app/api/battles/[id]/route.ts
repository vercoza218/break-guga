import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

interface EntryRow {
  id: number;
  battle_id: number;
  player_name: string;
  best_card: string | null;
  card_rarity: number | null;
  card_hp: number | null;
  payment_status: string;
}

function checkAndUpdateReady(db: ReturnType<typeof getDb>, battleId: string | number) {
  const battle = db.prepare('SELECT * FROM battles WHERE id = ?').get(battleId) as { max_players: number; status: string } | undefined;
  if (!battle) return;
  const entries = db.prepare('SELECT * FROM battle_entries WHERE battle_id = ?').all(battleId) as EntryRow[];
  const isFull = entries.length >= battle.max_players;
  const allPaid = entries.every((e) => e.payment_status === 'confirmed');

  if (isFull && allPaid && battle.status === 'open') {
    db.prepare("UPDATE battles SET status = 'ready' WHERE id = ?").run(battleId);
  } else if ((!isFull || !allPaid) && battle.status === 'ready') {
    db.prepare("UPDATE battles SET status = 'open' WHERE id = ?").run(battleId);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const id = params.id;
  const body = await request.json();

  const existing = db.prepare('SELECT * FROM battles WHERE id = ?').get(id) as { id: number; max_players: number; status: string } | undefined;
  if (!existing) {
    return NextResponse.json({ error: 'Batalha nao encontrada' }, { status: 404 });
  }

  // Join battle
  if (body.action === 'join') {
    const { player_name, avatar } = body;
    if (!player_name) {
      return NextResponse.json({ error: 'Nome do jogador obrigatorio' }, { status: 400 });
    }

    const entries = db.prepare('SELECT * FROM battle_entries WHERE battle_id = ?').all(id) as EntryRow[];
    if (entries.length >= existing.max_players) {
      return NextResponse.json({ error: 'Batalha lotada' }, { status: 400 });
    }

    db.prepare(
      'INSERT INTO battle_entries (battle_id, player_name, avatar, payment_status) VALUES (?, ?, ?, ?)'
    ).run(id, player_name, avatar || null, 'pending');

    checkAndUpdateReady(db, id);

    const battle = db.prepare('SELECT * FROM battles WHERE id = ?').get(id);
    return NextResponse.json(battle);
  }

  // Confirm payment (admin)
  if (body.action === 'confirm_payment') {
    const { entry_id } = body;
    db.prepare(
      "UPDATE battle_entries SET payment_status = 'confirmed' WHERE id = ? AND battle_id = ?"
    ).run(entry_id, id);

    checkAndUpdateReady(db, id);

    const battle = db.prepare('SELECT * FROM battles WHERE id = ?').get(id);
    return NextResponse.json(battle);
  }

  // Revoke payment (admin)
  if (body.action === 'revoke_payment') {
    const { entry_id } = body;
    db.prepare(
      "UPDATE battle_entries SET payment_status = 'pending' WHERE id = ? AND battle_id = ?"
    ).run(entry_id, id);

    checkAndUpdateReady(db, id);

    const battle = db.prepare('SELECT * FROM battles WHERE id = ?').get(id);
    return NextResponse.json(battle);
  }

  // Register card result
  if (body.action === 'register_card') {
    const { entry_id, best_card, card_rarity, card_hp } = body;
    db.prepare(
      'UPDATE battle_entries SET best_card = ?, card_rarity = ?, card_hp = ? WHERE id = ? AND battle_id = ?'
    ).run(best_card, card_rarity, card_hp, entry_id, id);

    const entry = db.prepare('SELECT * FROM battle_entries WHERE id = ?').get(entry_id);
    return NextResponse.json(entry);
  }

  // Calculate winner
  if (body.action === 'finish') {
    const entries = db.prepare('SELECT * FROM battle_entries WHERE battle_id = ?').all(id) as EntryRow[];
    const allRegistered = entries.every((e) => e.card_rarity !== null);
    if (!allRegistered) {
      return NextResponse.json({ error: 'Todas as cartas devem ser registradas antes de finalizar' }, { status: 400 });
    }

    const sorted = [...entries].sort((a, b) => {
      if ((b.card_rarity || 0) !== (a.card_rarity || 0)) {
        return (b.card_rarity || 0) - (a.card_rarity || 0);
      }
      return (b.card_hp || 0) - (a.card_hp || 0);
    });

    const winner = sorted[0];
    db.prepare("UPDATE battles SET status = 'finished', winner_entry_id = ? WHERE id = ?").run(winner.id, id);

    const battle = db.prepare('SELECT * FROM battles WHERE id = ?').get(id);
    return NextResponse.json(battle);
  }

  // Update status manually
  if (body.status) {
    db.prepare('UPDATE battles SET status = ? WHERE id = ?').run(body.status, id);
    const battle = db.prepare('SELECT * FROM battles WHERE id = ?').get(id);
    return NextResponse.json(battle);
  }

  return NextResponse.json({ error: 'Acao invalida' }, { status: 400 });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const id = params.id;

  const existing = db.prepare('SELECT * FROM battles WHERE id = ?').get(id);
  if (!existing) {
    return NextResponse.json({ error: 'Batalha nao encontrada' }, { status: 404 });
  }

  db.prepare('DELETE FROM battle_entries WHERE battle_id = ?').run(id);
  db.prepare('DELETE FROM battles WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}

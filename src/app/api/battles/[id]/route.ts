import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

interface EntryRow {
  id: number;
  battle_id: number;
  player_name: string;
  best_card: string | null;
  card_rarity: number | null;
  card_hp: number | null;
  card_value: number | null;
  card_value_2: number | null;
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

  // Remove player from battle (admin)
  if (body.action === 'remove_player') {
    const { entry_id } = body;
    const entry = db.prepare('SELECT * FROM battle_entries WHERE id = ? AND battle_id = ?').get(entry_id, id);
    if (!entry) {
      return NextResponse.json({ error: 'Jogador nao encontrado' }, { status: 404 });
    }
    db.prepare('DELETE FROM battle_entries WHERE id = ? AND battle_id = ?').run(entry_id, id);
    // If removed player was creator, clear creator_entry_id
    db.prepare('UPDATE battles SET creator_entry_id = NULL WHERE id = ? AND creator_entry_id = ?').run(id, entry_id);
    checkAndUpdateReady(db, id);
    const battle = db.prepare('SELECT * FROM battles WHERE id = ?').get(id);
    return NextResponse.json(battle);
  }

  // Register card result
  if (body.action === 'register_card') {
    const { entry_id, best_card, card_value, card_value_2 } = body;
    db.prepare(
      'UPDATE battle_entries SET best_card = ?, card_value = ?, card_value_2 = ? WHERE id = ? AND battle_id = ?'
    ).run(best_card, card_value || 0, card_value_2 || 0, entry_id, id);

    const entry = db.prepare('SELECT * FROM battle_entries WHERE id = ?').get(entry_id);
    return NextResponse.json(entry);
  }

  // Calculate winner (by card price, tiebreak = 2nd card price)
  if (body.action === 'finish') {
    const entries = db.prepare('SELECT * FROM battle_entries WHERE battle_id = ?').all(id) as EntryRow[];
    const allRegistered = entries.every((e) => e.card_value !== null);
    if (!allRegistered) {
      return NextResponse.json({ error: 'Todas as cartas devem ser registradas antes de finalizar' }, { status: 400 });
    }

    const sorted = [...entries].sort((a, b) => {
      if ((b.card_value || 0) !== (a.card_value || 0)) {
        return (b.card_value || 0) - (a.card_value || 0);
      }
      return (b.card_value_2 || 0) - (a.card_value_2 || 0);
    });

    const winner = sorted[0];
    db.prepare("UPDATE battles SET status = 'finished', winner_entry_id = ? WHERE id = ?").run(winner.id, id);

    const battle = db.prepare('SELECT * FROM battles WHERE id = ?').get(id);
    return NextResponse.json(battle);
  }

  // Update player avatar
  if (body.action === 'set_avatar') {
    const { entry_id, avatar } = body;
    db.prepare(
      'UPDATE battle_entries SET avatar = ? WHERE id = ? AND battle_id = ?'
    ).run(avatar, entry_id, id);
    const entry = db.prepare('SELECT * FROM battle_entries WHERE id = ?').get(entry_id);
    return NextResponse.json(entry);
  }

  // Upload card image for an entry
  if (body.action === 'set_card_image') {
    const { entry_id, card_image } = body;
    db.prepare(
      'UPDATE battle_entries SET card_image = ? WHERE id = ? AND battle_id = ?'
    ).run(card_image, entry_id, id);
    const entry = db.prepare('SELECT * FROM battle_entries WHERE id = ?').get(entry_id);
    return NextResponse.json(entry);
  }

  // Edit battle details
  if (body.action === 'edit') {
    const updates: string[] = [];
    const values: (string | number)[] = [];
    if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title || null as unknown as string); }
    if (body.boosters_per_player !== undefined) { updates.push('boosters_per_player = ?'); values.push(body.boosters_per_player); }
    if (body.max_players !== undefined) { updates.push('max_players = ?'); values.push(body.max_players); }
    if (body.product_id !== undefined) { updates.push('product_id = ?'); values.push(body.product_id); }
    if (updates.length > 0) {
      values.push(id as unknown as number);
      db.prepare(`UPDATE battles SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    checkAndUpdateReady(db, id);
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

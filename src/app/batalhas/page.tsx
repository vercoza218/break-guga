'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/Toast';

interface BattleEntry {
  id: number;
  player_name: string;
  avatar: string | null;
  best_card: string | null;
  card_value: number | null;
  card_value_2: number | null;
  card_image: string | null;
  payment_status: string;
}

interface Battle {
  id: number;
  product_name: string;
  product_price: number;
  product_image: string | null;
  boosters_per_player: number;
  max_players: number;
  status: string;
  title: string | null;
  battle_date: string | null;
  winner_entry_id: number | null;
  creator_entry_id: number | null;
  entries: BattleEntry[];
}

interface RankingPlayer {
  player_name: string;
  avatar: string | null;
  total: number;
  wins: number;
  losses: number;
  win_rate: number;
  best_card_name: string | null;
  best_card_value: number;
}

export default function BatalhasPage() {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [ranking, setRanking] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [joiningBattleId, setJoiningBattleId] = useState<number | null>(null);
  const [justActedBattle, setJustActedBattle] = useState<{ battleId: number; playerName: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Join form state
  const [joinName, setJoinName] = useState('');
  const [joinAvatar, setJoinAvatar] = useState<string | null>(null);
  const joinFileRef = useRef<HTMLInputElement>(null);

  const fetchBattles = useCallback(async () => {
    const res = await fetch('/api/battles');
    const data = await res.json();
    setBattles(data);
    setLoading(false);
  }, []);

  const fetchRanking = useCallback(async () => {
    const res = await fetch('/api/battles/ranking');
    const data = await res.json();
    setRanking(data);
  }, []);

  useEffect(() => {
    fetchBattles();
    fetchRanking();
    const interval = setInterval(() => { fetchBattles(); fetchRanking(); }, 5000);
    return () => clearInterval(interval);
  }, [fetchBattles, fetchRanking]);

  const handleUploadAvatar = async (file: File): Promise<string | null> => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file, 'avatar.png');
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    return null;
  };

  const handleJoinFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await handleUploadAvatar(file);
    if (url) setJoinAvatar(url);
  };

  const handleJoin = async (battleId: number) => {
    if (!joinName.trim()) return;
    const playerName = joinName.trim();
    await fetch(`/api/battles/${battleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', player_name: playerName, avatar: joinAvatar }),
    });
    setJoiningBattleId(null);
    if (joinFileRef.current) joinFileRef.current.value = '';
    fetchBattles();
    toast('Voce entrou na batalha! Envie o comprovante.');
    setJustActedBattle({ battleId, playerName });
    // Remember player name for "you" highlighting
    try { localStorage.setItem('gugaopkmn_player', playerName); } catch {}
    setJoinName('');
    setJoinAvatar(null);
  };

  const openBattles = battles.filter((b) => b.status === 'open');
  const readyBattles = battles.filter((b) => b.status === 'ready');
  const liveBattles = battles.filter((b) => b.status === 'live');
  const finishedBattles = battles.filter((b) => b.status === 'finished');

  // Get stored player name for "you" highlighting
  let myName = '';
  try { myName = localStorage.getItem('gugaopkmn_player') || ''; } catch {}

  // Group finished battles by date
  const finishedByDate: Record<string, Battle[]> = {};
  finishedBattles.forEach((b) => {
    const key = b.battle_date || 'sem-data';
    if (!finishedByDate[key]) finishedByDate[key] = [];
    finishedByDate[key].push(b);
  });
  const sortedDateKeys = Object.keys(finishedByDate).sort((a, b) => {
    if (a === 'sem-data') return 1;
    if (b === 'sem-data') return -1;
    return b.localeCompare(a);
  });

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText('5a71a958-9f8a-4887-b0ae-3bf96f67a04d');
      toast('Chave PIX copiada!');
    } catch {
      toast('Chave PIX: 5a71a958-9f8a-4887-b0ae-3bf96f67a04d', 'info');
    }
  };

  // Build WhatsApp message with battle details
  const getWhatsappUrl = () => {
    if (!justActedBattle) return '#';
    const b = battles.find(bt => bt.id === justActedBattle.battleId);
    if (!b) {
      return `https://wa.me/5581997492084?text=${encodeURIComponent('Ola! Segue o comprovante de pagamento da batalha de booster:')}`;
    }
    const total = b.boosters_per_player * b.product_price;
    const msg = `Ola! Segue o comprovante de pagamento:\n\n` +
      `Batalha: ${b.title || b.product_name}\n` +
      `Produto: ${b.product_name}\n` +
      `Boosters: ${b.boosters_per_player}\n` +
      `Valor: R$ ${total.toFixed(2).replace('.', ',')}\n` +
      `Jogador: ${justActedBattle.playerName}`;
    return `https://wa.me/5581997492084?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">⚔️</div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Batalhas de Booster</h2>
        <p className="text-gray-500 mb-4">Desafie outros jogadores e leve tudo!</p>
        <button
          onClick={() => setShowRules(!showRules)}
          className="text-primary text-sm font-medium hover:underline"
        >
          {showRules ? 'Ocultar regras' : 'Como funciona?'}
        </button>
      </div>

      {/* Rules */}
      {showRules && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-8 space-y-3 text-sm text-blue-800">
          <h3 className="font-bold text-base">Regras da Batalha</h3>
          <ol className="list-decimal list-inside space-y-1.5">
            <li>Cada jogador compra a mesma quantidade de boosters da mesma colecao.</li>
            <li>Os boosters sao abertos ao vivo na live.</li>
            <li>A <strong>carta mais valiosa</strong> de cada jogador e registrada (menor preco PT-BR Near Mint (NM) da Liga Pokemon no momento da live).</li>
            <li>O jogador com a carta de <strong>maior valor</strong> vence e leva todas as cartas.</li>
            <li>Em caso de empate, vence quem tiver a <strong>segunda carta mais cara</strong>.</li>
          </ol>
        </div>
      )}

      {/* Payment block shown after joining */}
      {justActedBattle && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-8 space-y-3 animate-fade-slide-in">
          <h4 className="text-primary font-bold">Pagamento via PIX</h4>
          <p className="text-sm text-gray-600">Envie o pagamento e depois mande o comprovante pelo WhatsApp. O admin vai confirmar e sua vaga sera garantida!</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 shrink-0">Chave PIX:</span>
            <span className="text-xs text-gray-700 truncate flex-1 font-mono">5a71a958-9f8a-...67a04d</span>
            <button onClick={copyPix} className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-primary-dark transition-colors min-h-[44px] shrink-0 btn-press">Copiar</button>
          </div>
          <a
            href={getWhatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors min-h-[44px] text-sm btn-press"
          >
            Enviar comprovante via WhatsApp
          </a>
          <button onClick={() => setJustActedBattle(null)} className="w-full text-gray-400 text-xs hover:text-gray-600 py-1">Fechar</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-400">Carregando batalhas...</div>
      )}

      {/* Open battles */}
      {!loading && openBattles.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🔓</span> Batalhas Abertas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {openBattles.map((battle) => (
              <BattleCard
                key={battle.id}
                battle={battle}
                myName={myName}
                onJoinClick={() => setJoiningBattleId(joiningBattleId === battle.id ? null : battle.id)}
                isJoining={joiningBattleId === battle.id}
                joinName={joinName}
                setJoinName={setJoinName}
                joinAvatar={joinAvatar}
                joinFileRef={joinFileRef}
                onJoinFileChange={handleJoinFileChange}
                onJoin={() => handleJoin(battle.id)}
                uploading={uploading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Ready battles — waiting to go live */}
      {!loading && readyBattles.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>⏳</span> Aguardando Inicio
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {readyBattles.map((battle) => (
              <BattleCard key={battle.id} battle={battle} myName={myName} />
            ))}
          </div>
        </div>
      )}

      {/* Live battles */}
      {!loading && liveBattles.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🔴</span> Batalhas ao Vivo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {liveBattles.map((battle) => (
              <BattleCard key={battle.id} battle={battle} myName={myName} />
            ))}
          </div>
        </div>
      )}

      {/* Battle history by date */}
      {!loading && finishedBattles.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📅</span> Historico de Batalhas
          </h3>
          <div className="space-y-3">
            {sortedDateKeys.map((dateKey) => {
              const dateLabel = dateKey === 'sem-data' ? 'Sem data' : new Date(dateKey + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
              const battleCount = finishedByDate[dateKey].length;
              return (
                <DateGroup key={dateKey} dateLabel={dateLabel} battleCount={battleCount}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {finishedByDate[dateKey].map((battle) => (
                      <BattleCard key={battle.id} battle={battle} myName={myName} />
                    ))}
                  </div>
                </DateGroup>
              );
            })}
          </div>
        </div>
      )}

      {/* Ranking */}
      {!loading && (
        <div className="mb-10">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🏅</span> Ranking de Batalhas
          </h3>
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-2xl p-4 md:p-6 space-y-3">
            {/* Rewards banner */}
            <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300 rounded-xl p-4 text-sm space-y-3">
              <p className="text-center font-bold text-amber-800">🎁 Premiacoes Mensais</p>
              <div className="grid grid-cols-3 gap-2 text-center items-end">
                <div className="bg-gray-300/20 border border-gray-400 rounded-xl p-3">
                  <div className="text-xl mb-1">🥈</div>
                  <p className="font-bold text-gray-600 text-sm">R$ 100</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">em creditos</p>
                </div>
                <div className="bg-yellow-400/20 border-2 border-yellow-400 rounded-xl p-4 -mt-1 shadow-md">
                  <div className="text-3xl mb-1">🥇</div>
                  <p className="font-bold text-yellow-700 text-lg">R$ 150</p>
                  <p className="text-[10px] text-yellow-600 mt-0.5">em creditos</p>
                </div>
                <div className="bg-orange-300/20 border border-orange-400 rounded-xl p-3">
                  <div className="text-xl mb-1">🥉</div>
                  <p className="font-bold text-orange-700 text-sm">R$ 50</p>
                  <p className="text-[10px] text-orange-600 mt-0.5">em creditos</p>
                </div>
              </div>
              <p className="text-center text-xs text-amber-600">Creditos em produtos na loja • Ranking reseta todo mes</p>
              <p className="text-center text-[10px] text-amber-500 mt-1">Desempate: quem tirou a carta mais cara na temporada fica na frente</p>
            </div>

            {ranking.length > 0 ? (
              <div className="space-y-2">
                {ranking.map((player, i) => (
                  <div key={player.player_name} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    i === 0 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-400 shadow-sm' :
                    i === 1 ? 'bg-gradient-to-r from-gray-50 to-slate-100 border-gray-400 shadow-sm' :
                    i === 2 ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-400 shadow-sm' :
                    'bg-white border-gray-200'
                  }`}>
                    {/* Position */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md' :
                      i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md' :
                      i === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-600 text-white shadow-md' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </div>
                    {/* Avatar */}
                    {player.avatar ? (
                      <img src={player.avatar} alt="" className={`w-11 h-11 rounded-full object-cover shrink-0 ${
                        i === 0 ? 'border-2 border-yellow-400 shadow-md' :
                        i === 1 ? 'border-2 border-gray-400 shadow-md' :
                        i === 2 ? 'border-2 border-orange-400 shadow-md' :
                        'border-2 border-white shadow-sm'
                      }`} />
                    ) : (
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        i === 0 ? 'bg-yellow-200 text-yellow-700 border-2 border-yellow-400' :
                        i === 1 ? 'bg-gray-200 text-gray-600 border-2 border-gray-400' :
                        i === 2 ? 'bg-orange-200 text-orange-700 border-2 border-orange-400' :
                        'bg-orange-200 text-orange-600'
                      }`}>
                        {player.player_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Name + stats */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${
                        i === 0 ? 'text-yellow-800' : i === 1 ? 'text-gray-700' : i === 2 ? 'text-orange-800' : 'text-gray-800'
                      }`}>
                        {player.player_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {player.total} batalha{player.total !== 1 ? 's' : ''} | {player.wins}V {player.losses}D
                      </p>
                      {player.best_card_name && (
                        <p className="text-[10px] text-orange-500 truncate">
                          🃏 {player.best_card_name} — R$ {player.best_card_value.toFixed(2).replace('.', ',')}
                        </p>
                      )}
                    </div>
                    {/* Win rate */}
                    <div className="text-right shrink-0">
                      <p className={`font-bold text-sm ${
                        player.win_rate >= 70 ? 'text-green-600' :
                        player.win_rate >= 50 ? 'text-blue-600' :
                        'text-gray-500'
                      }`}>
                        {player.win_rate}%
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase">win rate</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <p className="text-4xl">🏆</p>
                <p className="text-gray-500 font-medium text-sm">Seja o primeiro a conquistar o ranking!</p>
                <p className="text-gray-400 text-xs">Participe de uma batalha e entre na disputa pelas premiacoes.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && battles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚔️</div>
          <p className="text-gray-500 font-medium mb-2">Nenhuma batalha no momento</p>
          <p className="text-gray-400 text-sm mb-6">Fique ligado nas nossas redes — novas batalhas sao anunciadas nas lives!</p>
          <div className="flex justify-center gap-3">
            <a href="https://www.tiktok.com/@gugaopkmnoficial" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-black text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors btn-press">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.18z"/></svg>
              TikTok
            </a>
            <a href="https://chat.whatsapp.com/BenJb9AKRiN4UfIOuJHd99" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-green-600 transition-colors btn-press">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function DateGroup({ dateLabel, battleCount, children }: { dateLabel: string; battleCount: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
      >
        <span className="text-lg">📅</span>
        <span className="font-bold text-gray-800 text-sm flex-1">{dateLabel}</span>
        <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2.5 py-1 rounded-full">
          {battleCount} batalha{battleCount !== 1 ? 's' : ''}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 animate-fade-slide-in">
          {children}
        </div>
      )}
    </div>
  );
}

function formatCardValue(entry: BattleEntry): string {
  const v1 = (entry.card_value || 0).toFixed(2).replace('.', ',');
  const v2 = entry.card_value_2 || 0;
  if (v2 > 0) {
    return `R$ ${v1} | 2a: R$ ${v2.toFixed(2).replace('.', ',')}`;
  }
  return `R$ ${v1}`;
}

function BattleCard({
  battle,
  myName,
  onJoinClick,
  isJoining,
  joinName,
  setJoinName,
  joinAvatar,
  joinFileRef,
  onJoinFileChange,
  onJoin,
  uploading,
}: {
  battle: Battle;
  myName?: string;
  onJoinClick?: () => void;
  isJoining?: boolean;
  joinName?: string;
  setJoinName?: (v: string) => void;
  joinAvatar?: string | null;
  joinFileRef?: React.RefObject<HTMLInputElement>;
  onJoinFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onJoin?: () => void;
  uploading?: boolean;
}) {
  const slots = Array.from({ length: battle.max_players }, (_, i) => battle.entries[i] || null);
  const pricePerPlayer = battle.product_price * battle.boosters_per_player;
  const winner = battle.entries.find((e) => e.id === battle.winner_entry_id);
  const isLive = battle.status === 'live';
  const isOpen = battle.status === 'open';
  const isReady = battle.status === 'ready';
  const isFinished = battle.status === 'finished';
  const confirmedCount = battle.entries.filter(e => e.payment_status === 'confirmed').length;
  const slotsLeft = battle.max_players - battle.entries.length;

  // Check if winner was decided by tiebreaker (2nd card)
  const wasTiebreak = isFinished && winner && battle.entries.some(
    (e) => e.id !== winner.id && (e.card_value || 0) === (winner.card_value || 0)
  );

  // Status-based styling
  const borderColor = isLive ? 'border-red-400 animate-battle-glow'
    : isReady ? 'border-amber-400'
    : isFinished ? 'border-yellow-400'
    : 'border-orange-300';

  const headerBg = isLive ? 'bg-gradient-to-r from-red-500 to-rose-600'
    : isReady ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
    : isFinished ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
    : 'bg-gradient-to-r from-orange-500 to-orange-600';

  return (
    <div className={`rounded-2xl border-2 overflow-hidden shadow-sm ${borderColor}`}>
      {/* Header */}
      <div className={`text-white px-4 py-3 flex items-center justify-between ${headerBg}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{isFinished ? '🏆' : isLive ? '🔴' : isReady ? '⏳' : '⚔️'}</span>
          <span className="font-bold text-sm">{battle.title || 'BATALHA'}</span>
          {isLive && <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full animate-urgency-pulse">AO VIVO</span>}
          {isReady && <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full">PRONTA</span>}
          {isFinished && <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full">RESULTADO</span>}
        </div>
        <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">
          {battle.boosters_per_player * battle.max_players} boosters ({battle.boosters_per_player} cada)
        </span>
      </div>

      <div className="bg-white p-4 space-y-3">
        {/* Product info */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-18 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
            {battle.product_image ? (
              <img src={battle.product_image} alt={battle.product_name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-2xl">🎴</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-sm truncate">{battle.product_name}</p>
            <p className="text-orange-600 font-bold text-base">
              R$ {pricePerPlayer.toFixed(2).replace('.', ',')}
              <span className="text-xs font-normal text-gray-400 ml-1">por jogador</span>
            </p>
            <p className="text-[11px] text-gray-400">
              {battle.boosters_per_player} booster{battle.boosters_per_player > 1 ? 's' : ''} por jogador • {battle.boosters_per_player * battle.max_players} no total
            </p>
          </div>
        </div>

        {/* Player slots */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jogadores</p>
            <p className="text-xs text-gray-400">{battle.entries.length}/{battle.max_players}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {slots.map((entry, i) => {
              const isMe = entry && myName && entry.player_name.toLowerCase() === myName.toLowerCase();
              return (
                <div key={i} className={`rounded-xl p-2.5 text-center text-sm font-medium border ${
                  entry
                    ? winner?.id === entry.id
                      ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                      : isMe
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-orange-50 border-orange-200 text-orange-700'
                    : 'bg-gray-50 border-dashed border-gray-300 text-gray-400'
                }`}>
                  {entry ? (
                    <div className="flex items-center justify-center gap-1.5">
                      {entry.avatar ? (
                        <img src={entry.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center text-orange-600 text-xs font-bold">
                          {entry.player_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {winner?.id === entry.id && <span>🏆</span>}
                      <span className="truncate text-xs">{isMe ? 'Voce' : entry.player_name}</span>
                      {entry.payment_status === 'confirmed' ? (
                        <span className="text-green-500 text-xs" title="Pago">✓</span>
                      ) : (
                        <span className="text-orange-400 text-xs" title="Pagamento pendente">⏳</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs">Vaga aberta</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment status summary */}
        {battle.entries.length > 0 && !isFinished && (
          <div className="text-xs text-gray-500 text-center">
            {confirmedCount}/{battle.entries.length} pagamentos confirmados
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${isLive ? 'bg-red-500' : isReady ? 'bg-amber-500' : isFinished ? 'bg-yellow-500' : 'bg-orange-500'}`}
            style={{ width: `${(battle.entries.length / battle.max_players) * 100}%` }}
          />
        </div>

        {/* Results — winner + other players' cards */}
        {isFinished && winner && (
          <div className="space-y-2">
            {/* Winner card - celebratory */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 text-6xl opacity-10 -mt-2 -mr-2">🏆</div>
              <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider mb-2">Vencedor</p>
              <div className="flex items-center gap-3">
                {winner.card_image && (
                  <img src={winner.card_image} alt="" className="w-20 h-28 rounded-lg object-cover border-2 border-yellow-400 shadow-md shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {winner.avatar ? (
                      <img src={winner.avatar} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-yellow-400" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-700 font-bold text-sm border-2 border-yellow-400">
                        {winner.player_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <p className="font-bold text-yellow-800 text-base">
                      {myName && winner.player_name.toLowerCase() === myName.toLowerCase() ? 'Voce!' : winner.player_name}
                    </p>
                  </div>
                  {winner.best_card && (
                    <p className="text-sm text-yellow-700 font-medium">
                      {winner.best_card}
                    </p>
                  )}
                  {winner.best_card && (
                    <p className="text-xs text-yellow-600 mt-0.5">
                      {formatCardValue(winner)}
                    </p>
                  )}
                  {wasTiebreak && (
                    <p className="text-[10px] text-yellow-500 mt-1 bg-yellow-100 inline-block px-2 py-0.5 rounded-full">Venceu pelo desempate (2a carta)</p>
                  )}
                </div>
              </div>
            </div>
            {/* Other players' cards */}
            {battle.entries
              .filter((e) => e.id !== winner.id && e.best_card)
              .map((entry) => (
                <div key={entry.id} className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-3">
                    {entry.card_image && (
                      <img src={entry.card_image} alt="" className="w-14 h-20 rounded-lg object-cover border border-gray-200 shrink-0" />
                    )}
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {entry.avatar ? (
                          <img src={entry.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-[10px] font-bold">
                            {entry.player_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-gray-600 text-xs">
                          {myName && entry.player_name.toLowerCase() === myName.toLowerCase() ? 'Voce' : entry.player_name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{entry.best_card} — {formatCardValue(entry)}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Join button */}
        {isOpen && onJoinClick && slotsLeft > 0 && (
          <>
            {!isJoining ? (
              <button
                onClick={onJoinClick}
                className={`w-full text-white font-bold py-3 rounded-xl text-center text-sm transition-colors btn-press ${
                  slotsLeft === 1
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 animate-urgency-pulse'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                }`}
              >
                ENTRAR NA BATALHA {slotsLeft <= 2 && `(${slotsLeft === 1 ? 'Ultima vaga!' : `${slotsLeft} vagas`})`}
              </button>
            ) : (
              <div className="expand-enter">
                <div>
                  <div className="space-y-3 border-t border-orange-200 pt-3">
                    <input
                      type="text"
                      placeholder="Seu nome"
                      value={joinName || ''}
                      onChange={(e) => setJoinName?.(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-orange-500 focus:outline-none min-h-[44px]"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onJoin?.(); } }}
                    />
                    {/* Avatar upload */}
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Foto de perfil <span className="text-gray-300">(opcional)</span></label>
                      <div className="flex gap-3 items-center">
                        {joinAvatar ? (
                          <img src={joinAvatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-orange-300 shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          </div>
                        )}
                        <label className="flex-1 cursor-pointer">
                          <input
                            ref={joinFileRef}
                            type="file"
                            accept="image/*"
                            onChange={onJoinFileChange}
                            className="hidden"
                          />
                          <div className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-center text-sm text-gray-500 hover:bg-gray-100 hover:border-orange-300 transition-colors">
                            {joinAvatar ? 'Trocar foto' : 'Escolher foto'}
                          </div>
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={onJoin}
                        disabled={!joinName?.trim() || uploading}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 rounded-xl text-sm transition-colors btn-press disabled:opacity-50"
                      >
                        {uploading ? 'Enviando...' : 'Confirmar Entrada'}
                      </button>
                      <button onClick={onJoinClick} className="bg-gray-200 text-gray-600 px-4 py-3 rounded-xl hover:bg-gray-300 transition-colors text-sm">✕</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Ready status */}
        {battle.status === 'ready' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center text-sm text-amber-700 font-medium">
            Todos os jogadores confirmados! Aguardando inicio da live...
          </div>
        )}
      </div>
    </div>
  );
}

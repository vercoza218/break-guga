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
    setJoinName('');
    setJoinAvatar(null);
  };

  const openBattles = battles.filter((b) => b.status === 'open');
  const liveBattles = battles.filter((b) => b.status === 'live' || b.status === 'ready');
  const finishedBattles = battles.filter((b) => b.status === 'finished').slice(0, 6);

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

      {/* Live battles */}
      {!loading && liveBattles.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🔴</span> Batalhas ao Vivo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {liveBattles.map((battle) => (
              <BattleCard key={battle.id} battle={battle} />
            ))}
          </div>
        </div>
      )}

      {/* Finished battles */}
      {!loading && finishedBattles.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🏆</span> Batalhas Encerradas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {finishedBattles.map((battle) => (
              <BattleCard key={battle.id} battle={battle} />
            ))}
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
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-yellow-400/20 border border-yellow-400 rounded-xl p-3">
                  <div className="text-2xl mb-1">🥇</div>
                  <p className="font-bold text-yellow-700 text-base">R$ 150</p>
                  <p className="text-[10px] text-yellow-600 mt-0.5">em creditos</p>
                </div>
                <div className="bg-gray-300/20 border border-gray-400 rounded-xl p-3">
                  <div className="text-2xl mb-1">🥈</div>
                  <p className="font-bold text-gray-600 text-base">R$ 100</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">em creditos</p>
                </div>
                <div className="bg-orange-300/20 border border-orange-400 rounded-xl p-3">
                  <div className="text-2xl mb-1">🥉</div>
                  <p className="font-bold text-orange-700 text-base">R$ 50</p>
                  <p className="text-[10px] text-orange-600 mt-0.5">em creditos</p>
                </div>
              </div>
              <p className="text-center text-xs text-amber-600">Creditos em produtos na loja • Ranking reseta todo mes</p>
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
              <div className="text-center py-6 text-gray-400 text-sm">
                Nenhum jogador no ranking ainda.
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
            <a href="https://www.instagram.com/gugaopkmn/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity btn-press">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.088 4.088 0 011.47.957c.453.453.78.898.957 1.47.163.46.35 1.26.404 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.404 2.43a4.088 4.088 0 01-.957 1.47 4.088 4.088 0 01-1.47.957c-.46.163-1.26.35-2.43.404-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.404a4.088 4.088 0 01-1.47-.957 4.088 4.088 0 01-.957-1.47c-.163-.46-.35-1.26-.404-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.404-2.43a4.088 4.088 0 01.957-1.47A4.088 4.088 0 015.064 2.293c.46-.163 1.26-.35 2.43-.404C8.416 1.831 8.796 1.819 12 1.819M12 0C8.741 0 8.333.014 7.053.072 5.775.13 4.903.333 4.14.63a6.21 6.21 0 00-2.246 1.463A6.21 6.21 0 00.43 4.34C.133 5.103-.07 5.975.072 7.253.014 8.533 0 8.941 0 12.2s.014 3.668.072 4.948c.058 1.278.261 2.15.558 2.913a6.21 6.21 0 001.463 2.246 6.21 6.21 0 002.246 1.463c.763.297 1.635.5 2.913.558C8.533 23.986 8.941 24 12 24s3.468-.014 4.748-.072c1.278-.058 2.15-.261 2.913-.558a6.21 6.21 0 002.246-1.463 6.21 6.21 0 001.463-2.246c.297-.763.5-1.635.558-2.913C23.986 15.468 24 15.06 24 12s-.014-3.468-.072-4.748c-.058-1.278-.261-2.15-.558-2.913a6.21 6.21 0 00-1.463-2.246A6.21 6.21 0 0019.661.63C18.898.333 18.026.13 16.748.072 15.468.014 15.06 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              Instagram
            </a>
            <a href="https://www.youtube.com/channel/UCBl_UbQxg1WwXJNXBa_aGlw" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-red-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-red-700 transition-colors btn-press">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              YouTube
            </a>
          </div>
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
  const isFinished = battle.status === 'finished';
  const confirmedCount = battle.entries.filter(e => e.payment_status === 'confirmed').length;
  const slotsLeft = battle.max_players - battle.entries.length;

  // Check if winner was decided by tiebreaker (2nd card)
  const wasTiebreak = isFinished && winner && battle.entries.some(
    (e) => e.id !== winner.id && (e.card_value || 0) === (winner.card_value || 0)
  );

  return (
    <div className={`rounded-2xl border-2 overflow-hidden shadow-sm ${isLive ? 'border-red-400 animate-battle-glow' : isFinished ? 'border-gray-300' : 'border-orange-300'}`}>
      {/* Header */}
      <div className={`text-white px-4 py-3 flex items-center justify-between ${isFinished ? 'bg-gradient-to-r from-gray-500 to-gray-600' : 'bg-gradient-to-r from-orange-500 to-red-500'}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">⚔️</span>
          <span className="font-bold text-sm">{battle.title || 'BATALHA'}</span>
          {isLive && <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full animate-urgency-pulse">AO VIVO</span>}
          {isFinished && <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full">ENCERRADA</span>}
        </div>
        <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">
          {battle.boosters_per_player} booster(s)
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
          </div>
        </div>

        {/* Player slots */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jogadores</p>
            <p className="text-xs text-gray-400">{battle.entries.length}/{battle.max_players}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {slots.map((entry, i) => (
              <div key={i} className={`rounded-xl p-2.5 text-center text-sm font-medium border ${
                entry
                  ? winner?.id === entry.id
                    ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
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
                    <span className="truncate text-xs">{entry.player_name}</span>
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
            ))}
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
            className={`h-2 rounded-full transition-all duration-500 ${isLive ? 'bg-red-500' : isFinished ? 'bg-gray-400' : 'bg-orange-500'}`}
            style={{ width: `${(battle.entries.length / battle.max_players) * 100}%` }}
          />
        </div>

        {/* Results — winner + other players' cards */}
        {isFinished && winner && (
          <div className="space-y-2">
            {/* Winner card */}
            <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3">
              <div className="flex items-center gap-3">
                {winner.card_image && (
                  <img src={winner.card_image} alt="" className="w-16 h-22 rounded-lg object-cover border border-yellow-300 shrink-0" />
                )}
                <div className={`${winner.card_image ? '' : 'text-center w-full'}`}>
                  <p className="font-bold text-yellow-700 flex items-center gap-1 justify-center">
                    🏆 {winner.player_name}
                  </p>
                  {winner.best_card && (
                    <p className="text-xs text-yellow-600 mt-0.5">
                      {winner.best_card} — {formatCardValue(winner)}
                    </p>
                  )}
                  {wasTiebreak && (
                    <p className="text-[10px] text-yellow-500 mt-0.5">Venceu pelo desempate (2a carta)</p>
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
                        <span className="font-medium text-gray-600 text-xs">{entry.player_name}</span>
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

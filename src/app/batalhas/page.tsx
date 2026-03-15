'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/Toast';

interface Product {
  id: number;
  name: string;
  stock: number;
  price: number;
  image: string | null;
  coming_soon: number;
}

interface BattleEntry {
  id: number;
  player_name: string;
  avatar: string | null;
  best_card: string | null;
  card_rarity: number | null;
  card_hp: number | null;
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

const RARITY_LIST = [
  'Illustration Rare / Special Art',
  'Ultra Rare / Full Art',
  'Holo Rare',
  'Rare',
  'Uncommon',
  'Common',
];

export default function BatalhasPage() {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [joiningBattleId, setJoiningBattleId] = useState<number | null>(null);
  const [justActed, setJustActed] = useState<number | null>(null);
  const { toast } = useToast();

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createProduct, setCreateProduct] = useState('');
  const [createBoosters, setCreateBoosters] = useState('1');
  const [createOpponents, setCreateOpponents] = useState('1');
  const [createTitle, setCreateTitle] = useState('');
  const [createAvatar, setCreateAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const fetchProducts = useCallback(async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data.filter((p: Product) => !p.coming_soon && p.stock > 0));
  }, []);

  useEffect(() => {
    fetchBattles();
    fetchProducts();
    const interval = setInterval(fetchBattles, 5000);
    return () => clearInterval(interval);
  }, [fetchBattles, fetchProducts]);

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

  const handleCreateFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await handleUploadAvatar(file);
    if (url) setCreateAvatar(url);
  };

  const handleJoinFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await handleUploadAvatar(file);
    if (url) setJoinAvatar(url);
  };

  const handleCreate = async () => {
    if (!createName.trim() || !createProduct) return;
    await fetch('/api/battles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: parseInt(createProduct),
        boosters_per_player: parseInt(createBoosters),
        max_players: parseInt(createOpponents) + 1,
        player_name: createName,
        avatar: createAvatar,
        title: createTitle || null,
      }),
    });
    setCreateName('');
    setCreateProduct('');
    setCreateBoosters('1');
    setCreateOpponents('1');
    setCreateTitle('');
    setCreateAvatar(null);
    setShowCreateForm(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    fetchBattles();
    toast('Batalha criada! Envie o comprovante de pagamento.');
    setJustActed(Date.now());
  };

  const handleJoin = async (battleId: number) => {
    if (!joinName.trim()) return;
    await fetch(`/api/battles/${battleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', player_name: joinName, avatar: joinAvatar }),
    });
    setJoinName('');
    setJoinAvatar(null);
    setJoiningBattleId(null);
    if (joinFileRef.current) joinFileRef.current.value = '';
    fetchBattles();
    toast('Voce entrou na batalha! Envie o comprovante.');
    setJustActed(Date.now());
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
            <li>A <strong>carta mais rara</strong> de cada jogador e registrada.</li>
            <li>O jogador com a carta de maior raridade vence e leva todas as cartas.</li>
            <li>Em caso de empate na raridade, vence a carta com <strong>maior HP</strong>.</li>
          </ol>
          <div className="pt-2">
            <p className="font-semibold mb-1">Hierarquia de Raridade (da maior pra menor):</p>
            <div className="flex flex-wrap gap-1.5">
              {RARITY_LIST.map((r, i) => (
                <span key={r} className="bg-white border border-blue-200 rounded-full px-2.5 py-0.5 text-xs">
                  {i + 1}. {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create battle CTA */}
      {!showCreateForm ? (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 rounded-2xl text-center transition-colors btn-press mb-8 text-lg shadow-md"
        >
          + Criar Batalha
        </button>
      ) : (
        <div className="bg-white border-2 border-orange-300 rounded-2xl p-5 mb-8 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-orange-600 text-lg">Criar Batalha</h3>
            <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Seu nome"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-orange-500 focus:outline-none min-h-[44px]"
            />
            <div className="flex gap-2 items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCreateFileChange}
                className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 text-sm min-h-[44px] file:mr-2 file:bg-orange-500 file:text-white file:border-0 file:rounded file:px-2 file:py-1 file:text-xs file:cursor-pointer"
              />
              {createAvatar && <img src={createAvatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-orange-300" />}
            </div>
          </div>

          <select
            value={createProduct}
            onChange={(e) => setCreateProduct(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-orange-500 focus:outline-none min-h-[44px]"
          >
            <option value="">Selecione a colecao</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — R$ {p.price.toFixed(2).replace('.', ',')} por booster</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Boosters por jogador</label>
              <input type="number" value={createBoosters} onChange={(e) => setCreateBoosters(e.target.value)} min={1} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-orange-500 focus:outline-none min-h-[44px]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Quantos oponentes</label>
              <input type="number" value={createOpponents} onChange={(e) => setCreateOpponents(e.target.value)} min={1} max={7} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-orange-500 focus:outline-none min-h-[44px]" />
            </div>
          </div>

          <input
            type="text"
            placeholder="Titulo da batalha (opcional)"
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-orange-500 focus:outline-none min-h-[44px]"
          />

          {createProduct && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
              <span className="text-sm text-gray-500">Custo por jogador:</span>
              <span className="text-orange-600 font-bold text-lg ml-2">
                R$ {((products.find(p => p.id === parseInt(createProduct))?.price || 0) * parseInt(createBoosters || '1')).toFixed(2).replace('.', ',')}
              </span>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={!createName.trim() || !createProduct || uploading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 rounded-xl transition-colors btn-press disabled:opacity-50"
          >
            {uploading ? 'Enviando foto...' : 'Criar Batalha'}
          </button>
        </div>
      )}

      {/* Payment block shown after creating/joining */}
      {justActed && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-8 space-y-3 animate-fade-slide-in">
          <h4 className="text-primary font-bold">Pagamento via PIX</h4>
          <p className="text-sm text-gray-600">Envie o pagamento e depois mande o comprovante pelo WhatsApp. O admin vai confirmar e sua vaga sera garantida!</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 shrink-0">Chave PIX:</span>
            <span className="text-xs text-gray-700 truncate flex-1 font-mono">5a71a958-9f8a-...67a04d</span>
            <button onClick={copyPix} className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-primary-dark transition-colors min-h-[44px] shrink-0 btn-press">Copiar</button>
          </div>
          <a
            href={`https://wa.me/5581997492084?text=${encodeURIComponent('Ola! Segue o comprovante de pagamento da batalha de booster:')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors min-h-[44px] text-sm btn-press"
          >
            Enviar comprovante via WhatsApp
          </a>
          <button onClick={() => setJustActed(null)} className="w-full text-gray-400 text-xs hover:text-gray-600 py-1">Fechar</button>
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

      {/* Empty state */}
      {!loading && battles.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">⚔️</div>
          <p className="text-gray-400 mb-2">Nenhuma batalha ainda.</p>
          <p className="text-gray-400 text-sm">Crie a primeira batalha e desafie seus amigos!</p>
        </div>
      )}
    </div>
  );
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
                    {entry.avatar && <img src={entry.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />}
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

        {/* Winner */}
        {isFinished && winner && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-center">
            <p className="font-bold text-yellow-700 flex items-center justify-center gap-1">
              🏆 {winner.player_name}
            </p>
            {winner.best_card && (
              <p className="text-xs text-yellow-600 mt-0.5">{winner.best_card} — {winner.card_hp} HP</p>
            )}
          </div>
        )}

        {/* Join button */}
        {isOpen && onJoinClick && battle.entries.length < battle.max_players && (
          <>
            {!isJoining ? (
              <button
                onClick={onJoinClick}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 rounded-xl text-center text-sm transition-colors btn-press"
              >
                ENTRAR NA BATALHA
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
                    <div className="flex gap-2 items-center">
                      <input
                        ref={joinFileRef}
                        type="file"
                        accept="image/*"
                        onChange={onJoinFileChange}
                        className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 text-sm min-h-[44px] file:mr-2 file:bg-orange-500 file:text-white file:border-0 file:rounded file:px-2 file:py-1 file:text-xs file:cursor-pointer"
                      />
                      {joinAvatar && <img src={joinAvatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-orange-300" />}
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

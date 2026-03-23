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
  collection_url: string | null;
  is_new: number;
  description: string | null;
}


function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm animate-pulse">
      <div className="p-4 flex gap-4">
        <div className="w-24 h-32 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-3 py-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-5 bg-gray-200 rounded-full w-24" />
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="h-12 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [battleCount, setBattleCount] = useState(0);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [liveStatus, setLiveStatus] = useState<boolean | null>(null);
  const { toast } = useToast();
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const fetchProducts = useCallback(async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }, []);

  const fetchBattles = useCallback(async () => {
    const res = await fetch('/api/battles');
    const data = await res.json();
    setBattleCount(data.filter((b: { status: string }) => b.status === 'open' || b.status === 'live').length);
  }, []);

  const fetchLiveStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setLiveStatus(data.live_status === 'on');
    } catch {
      setLiveStatus(true); // default to on if error
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchBattles();
    fetchLiveStatus();
    const interval = setInterval(() => { fetchProducts(); fetchBattles(); fetchLiveStatus(); }, 5000);
    return () => clearInterval(interval);
  }, [fetchProducts, fetchBattles, fetchLiveStatus]);

  const setQty = (productId: number, qty: number) => {
    setQuantities((prev) => ({ ...prev, [productId]: qty }));
  };

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText('5a71a958-9f8a-4887-b0ae-3bf96f67a04d');
      toast('Chave PIX copiada!');
    } catch {
      toast('Chave PIX: 5a71a958-9f8a-4887-b0ae-3bf96f67a04d', 'info');
    }
  };

  const isLiveOff = liveStatus === false;

  return (
    <div>
      {/* Header with logo */}
      <div className="text-center mb-8">
        <img src="/logo.png" alt="Gugaopkmn" className="w-24 h-24 rounded-full object-cover mx-auto mb-4 shadow-lg" />
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Produtos Disponiveis
        </h2>
        <p className="text-gray-500">Escolha seus boosters e participe do break!</p>
      </div>

      {/* Live OFF banner */}
      {isLiveOff && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-6 mb-8 text-center space-y-2 animate-fade-slide-in">
          <span className="text-4xl">📺</span>
          <h3 className="text-lg font-bold text-purple-700">Aguarde a proxima live!</h3>
          <p className="text-purple-600 text-sm">Vitrine atualizada em breve. Fique ligado nas nossas redes para saber quando a proxima live comecar!</p>
          <div className="flex justify-center gap-3 pt-2">
            <a href="https://www.tiktok.com/@gugaopkmnoficial" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-black text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors btn-press">
              TikTok
            </a>
            <a href="https://chat.whatsapp.com/BenJb9AKRiN4UfIOuJHd99" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-green-600 transition-colors btn-press">
              WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Sealed products trust banner */}
      {!isLiveOff && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex gap-3 items-start">
          <span className="text-2xl shrink-0 mt-0.5">📦</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm mb-1">Produto Original e Lacrado</p>
            <p className="text-amber-700 text-sm leading-relaxed">
              Todos os boosters sao retirados de produtos lacrados — seja blister unitario, triplo, quadruplo, mini booster box ou booster box.
            </p>
          </div>
        </div>
      )}

      {!isLiveOff && loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <ProductSkeleton key={i} />)}
        </div>
      )}

      {!isLiveOff && !loading && products.length === 0 && (
        <p className="text-gray-400 text-center py-12">
          Nenhum produto cadastrado ainda.
        </p>
      )}

      {!isLiveOff && <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start ${loading ? 'hidden' : ''}`}>
        {[...products]
          .sort((a, b) => {
            // Order: NOVIDADE >> ULTIMOS PRODUTOS >> DISPONIVEIS >> ESGOTADO >> EM BREVE
            const comingSoonA = isLiveOff ? true : !!a.coming_soon;
            const comingSoonB = isLiveOff ? true : !!b.coming_soon;
            const soldOutA = a.stock <= 0;
            const soldOutB = b.stock <= 0;
            const isNewA = !!a.is_new && !comingSoonA && !soldOutA;
            const isNewB = !!b.is_new && !comingSoonB && !soldOutB;
            const lowStockA = !comingSoonA && !soldOutA && !isNewA && a.stock > 0 && a.stock < 10;
            const lowStockB = !comingSoonB && !soldOutB && !isNewB && b.stock > 0 && b.stock < 10;

            const rank = (isNew: boolean, lowStock: boolean, soldOut: boolean, comingSoon: boolean) => {
              if (isNew) return 0;
              if (lowStock) return 1;
              if (!soldOut && !comingSoon) return 2;
              if (soldOut) return 3;
              return 4; // coming soon
            };

            return rank(isNewA, lowStockA, soldOutA, comingSoonA) - rank(isNewB, lowStockB, soldOutB, comingSoonB);
          })
          .map((product) => {
          const qty = quantities[product.id] || 0;
          const total = qty * product.price;
          const soldOut = product.stock <= 0;
          const comingSoon = isLiveOff ? true : !!product.coming_soon;
          const unavailable = soldOut || comingSoon;
          const isNew = !!product.is_new && !comingSoon && !soldOut;
          const lowStock = !comingSoon && !soldOut && !isNew && product.stock > 0 && product.stock < 10;

          return (
            <div
              key={product.id}
              ref={(el) => { cardRefs.current[product.id] = el; }}
              className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md relative ${
                isNew
                  ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-400 hover:border-blue-500 ring-2 ring-blue-200/50'
                  : lowStock
                    ? 'bg-white border-red-300 hover:border-red-400'
                    : unavailable
                      ? 'bg-white border-gray-200 opacity-70'
                      : 'bg-white border-gray-200 hover:border-primary/30'
              }`}
            >
              {/* Novidade banner */}
              {isNew && (
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-center py-1.5 px-3 text-xs font-bold tracking-wider flex items-center justify-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  NOVIDADE
                  <span className="inline-block w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                </div>
              )}

              {/* Low stock urgency banner */}
              {lowStock && (
                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-center py-1.5 px-3 text-xs font-bold tracking-wider animate-urgency-pulse">
                  ULTIMOS PRODUTOS — Restam apenas {product.stock}!
                </div>
              )}

              <div className="p-4 flex gap-4">
                {/* Product image */}
                <div className={`w-24 h-32 rounded-xl overflow-hidden shrink-0 flex items-center justify-center ${comingSoon ? 'bg-gray-100 grayscale' : isNew ? 'bg-blue-50/50' : 'bg-gray-50'}`}>
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-4xl">🎴</span>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-base mb-1 truncate ${comingSoon ? 'text-gray-400' : isNew ? 'text-blue-800' : 'text-gray-800'}`}>
                    {product.name}
                  </h3>
                  {!isLiveOff && (
                    <p className={`font-bold text-xl mb-1 ${isNew ? 'text-blue-600' : 'text-green-600'}`}>
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </p>
                  )}
                  {product.description && (
                    <p className={`text-xs mb-2 leading-relaxed ${comingSoon ? 'text-gray-400' : isNew ? 'text-blue-600/70' : 'text-gray-500'}`}>
                      {product.description}
                    </p>
                  )}
                  {!product.description && isLiveOff && <div className="mb-2" />}
                  {comingSoon ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                      Em Breve
                    </span>
                  ) : soldOut ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 bg-red-50 border border-red-200 rounded-full px-3 py-1">
                      Esgotado
                    </span>
                  ) : lowStock ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-300 rounded-full px-3 py-1 animate-urgency-badge">
                      🔥 {product.stock} restantes
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1 ${
                      isNew
                        ? 'text-blue-600 bg-blue-50 border border-blue-200'
                        : 'text-green-600 bg-green-50 border border-green-200'
                    }`}>
                      {product.stock} disponiveis
                    </span>
                  )}
                </div>
              </div>

              {/* Action area */}
              <div className="px-4 pb-4">
                {comingSoon ? (
                  <button
                    disabled
                    className="w-full bg-gray-200 text-gray-400 font-bold py-3 rounded-xl cursor-not-allowed text-sm"
                  >
                    EM BREVE
                  </button>
                ) : soldOut ? (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 font-bold py-3 rounded-xl cursor-not-allowed text-sm"
                  >
                    Esgotado
                  </button>
                ) : (
                  <>
                    {qty === 0 ? (
                      <button
                        onClick={() => {
                          setQty(product.id, 1);
                          setTimeout(() => {
                            cardRefs.current[product.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 50);
                        }}
                        className={`w-full font-bold py-3 rounded-xl transition-colors text-sm text-white btn-press ${
                          lowStock
                            ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
                            : isNew
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                              : 'bg-green-500 hover:bg-green-600'
                        }`}
                      >
                        {lowStock ? 'GARANTIR O MEU' : 'QUERO'}
                      </button>
                    ) : (
                      <div className="expand-enter">
                        <div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <label className="text-sm text-gray-500 font-medium">Qtd:</label>
                              <select
                                value={qty}
                                onChange={(e) =>
                                  setQty(product.id, Number(e.target.value))
                                }
                                className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:border-primary focus:outline-none min-h-[44px]"
                              >
                                {Array.from({ length: product.stock }, (_, i) => i + 1).map(
                                  (n) => (
                                    <option key={n} value={n}>
                                      {n}
                                    </option>
                                  )
                                )}
                              </select>
                              <button
                                onClick={() => setQty(product.id, 0)}
                                className="text-gray-400 hover:text-red-500 transition-colors text-lg btn-press"
                                title="Cancelar"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-3 text-center">
                              <span className="text-sm text-gray-500">Total:</span>
                              <span className="text-green-600 font-bold text-xl ml-2">
                                R$ {total.toFixed(2).replace('.', ',')}
                              </span>
                            </div>

                            {product.collection_url && (
                              <a
                                href={product.collection_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 font-medium py-2.5 px-4 rounded-xl hover:bg-purple-100 transition-colors text-sm btn-press"
                              >
                                <span>🃏</span>
                                Ver cartas da colecao
                                <span className="text-purple-400 text-xs">↗</span>
                              </a>
                            )}

                            <PaymentBlock
                              onCopyPix={copyPix}
                              productName={product.name}
                              quantity={qty}
                              total={total}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>}

      {/* Battles banner */}
      <div className="mt-10 mb-4">
        <a
          href="/batalhas"
          className="block bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-center text-white hover:from-orange-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg group"
        >
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">⚔️</div>
          <h3 className="text-lg font-bold mb-1">Batalhas de Booster</h3>
          <p className="text-orange-100 text-sm">
            Crie ou entre em uma batalha e dispute as melhores cartas!
          </p>
          {battleCount > 0 && (
            <span className="inline-block mt-2 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full animate-urgency-pulse">
              {battleCount} batalha{battleCount > 1 ? 's' : ''} aberta{battleCount > 1 ? 's' : ''} agora!
            </span>
          )}
        </a>
      </div>

      {/* Banner to navigate to Fila */}
      <div className="mt-10 mb-4">
        <a
          href="/fila"
          className="block bg-gradient-to-r from-primary to-blue-500 rounded-2xl p-6 text-center text-white hover:from-primary-dark hover:to-blue-600 transition-all shadow-md hover:shadow-lg group"
        >
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📋</div>
          <h3 className="text-lg font-bold mb-1">Acompanhe a ordem de abertura</h3>
          <p className="text-blue-100 text-sm">Veja quem esta na fila e a ordem dos boosters ao vivo</p>
        </a>
      </div>

    </div>
  );
}

function PaymentBlock({
  onCopyPix,
  productName,
  quantity,
  total,
}: {
  onCopyPix: () => void;
  productName: string;
  quantity: number;
  total: number;
}) {
  const [showQR, setShowQR] = useState(false);
  const whatsappMessage = `Ola! Gostaria de participar do break.\n\nProduto: ${productName}\nQuantidade: ${quantity}\nTotal: R$ ${total.toFixed(2).replace('.', ',')}\n\nSegue o comprovante de pagamento:`;
  const whatsappUrl = `https://wa.me/5581997492084?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <h4 className="text-primary font-semibold text-sm">Pagamento via PIX</h4>

      {/* QR Code toggle */}
      <button
        onClick={() => setShowQR(!showQR)}
        className="w-full bg-white border-2 border-primary/20 hover:border-primary/40 rounded-xl py-3 px-4 transition-all text-sm font-medium text-primary flex items-center justify-center gap-2"
      >
        {showQR ? 'Ocultar QR Code' : 'Pagar com QR Code PIX'}
      </button>

      {showQR && (
        <div className="bg-white rounded-xl p-4 flex flex-col items-center gap-2 border border-gray-200">
          <img
            src="/pix-qr.png"
            alt="QR Code PIX"
            className="w-48 h-48 object-contain"
          />
          <p className="text-xs text-gray-500 text-center">
            Escaneie o QR Code com o app do seu banco
          </p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 shrink-0">Chave PIX:</span>
          <span className="text-xs text-gray-700 truncate flex-1 font-mono">
            5a71a958-9f8a-...67a04d
          </span>
          <button
            onClick={onCopyPix}
            className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-primary-dark transition-colors min-h-[44px] shrink-0 btn-press"
          >
            Copiar
          </button>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors min-h-[44px] text-sm btn-press"
        >
          Enviar comprovante via WhatsApp
        </a>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Para pagar no credito em ate 12x (consulte juros), fale no numero acima
        para uma simulacao.
      </p>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/Toast';

interface Product {
  id: number;
  name: string;
  stock: number;
  price: number;
  image: string | null;
  coming_soon: number;
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
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, 5000);
    return () => clearInterval(interval);
  }, [fetchProducts]);

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

  return (
    <div>
      {/* Header with logo */}
      <div className="text-center mb-8">
        <img src="/logo.png" alt="Gugaopkmn" className="w-24 h-24 rounded-full object-cover mx-auto mb-4 shadow-lg" />
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Boosters Disponiveis
        </h2>
        <p className="text-gray-500">Escolha seus boosters e participe do break!</p>
      </div>

      {/* Sealed products trust banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex gap-3 items-start">
        <span className="text-2xl shrink-0 mt-0.5">📦</span>
        <div>
          <p className="font-semibold text-amber-800 text-sm mb-1">Produto Original e Lacrado</p>
          <p className="text-amber-700 text-sm leading-relaxed">
            Todos os boosters sao retirados de produtos lacrados — seja blister unitario, triplo, quadruplo, mini booster box ou booster box.
          </p>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <ProductSkeleton key={i} />)}
        </div>
      )}

      {!loading && products.length === 0 && (
        <p className="text-gray-400 text-center py-12">
          Nenhum produto cadastrado ainda.
        </p>
      )}

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start ${loading ? 'hidden' : ''}`}>
        {[...products].sort((a, b) => (a.coming_soon ? 1 : 0) - (b.coming_soon ? 1 : 0)).map((product) => {
          const qty = quantities[product.id] || 0;
          const total = qty * product.price;
          const soldOut = product.stock <= 0;
          const comingSoon = !!product.coming_soon;
          const unavailable = soldOut || comingSoon;
          const lowStock = !comingSoon && !soldOut && product.stock > 0 && product.stock < 20;

          return (
            <div
              key={product.id}
              className={`bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md relative ${
                lowStock
                  ? 'border-red-300 hover:border-red-400'
                  : unavailable
                    ? 'border-gray-200 opacity-70'
                    : 'border-gray-200 hover:border-primary/30'
              }`}
            >
              {/* Low stock urgency banner */}
              {lowStock && (
                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-center py-1.5 px-3 text-xs font-bold tracking-wider animate-urgency-pulse">
                  ULTIMAS UNIDADES — Restam apenas {product.stock}!
                </div>
              )}

              <div className="p-4 flex gap-4">
                {/* Product image */}
                <div className={`w-24 h-32 rounded-xl overflow-hidden shrink-0 flex items-center justify-center ${comingSoon ? 'bg-gray-100 grayscale' : 'bg-gray-50'}`}>
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
                  <h3 className={`font-bold text-base mb-1 truncate ${comingSoon ? 'text-gray-400' : 'text-gray-800'}`}>
                    {product.name}
                  </h3>
                  <p className={`font-bold text-xl mb-2 ${comingSoon ? 'text-gray-400' : 'text-green-600'}`}>
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </p>
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
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-3 py-1">
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
                        onClick={() => setQty(product.id, 1)}
                        className={`w-full font-bold py-3 rounded-xl transition-colors text-sm text-white ${
                          lowStock
                            ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
                            : 'bg-green-500 hover:bg-green-600'
                        }`}
                      >
                        {lowStock ? 'GARANTIR O MEU' : 'QUERO'}
                      </button>
                    ) : (
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
                            className="text-gray-400 hover:text-red-500 transition-colors text-lg"
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

                        <PaymentBlock
                          onCopyPix={copyPix}
                          productName={product.name}
                          quantity={qty}
                          total={total}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
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

      {/* Social links */}
      <div className="mt-2 mb-6">
        <p className="text-center text-xs text-gray-400 mb-3">Siga a gente nas redes</p>
        <div className="flex justify-center gap-4">
          <a href="https://www.instagram.com/gugaopkmn/" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md" aria-label="Instagram">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.088 4.088 0 011.47.957c.453.453.78.898.957 1.47.163.46.35 1.26.404 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.404 2.43a4.088 4.088 0 01-.957 1.47 4.088 4.088 0 01-1.47.957c-.46.163-1.26.35-2.43.404-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.404a4.088 4.088 0 01-1.47-.957 4.088 4.088 0 01-.957-1.47c-.163-.46-.35-1.26-.404-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.404-2.43a4.088 4.088 0 01.957-1.47A4.088 4.088 0 015.064 2.293c.46-.163 1.26-.35 2.43-.404C8.416 1.831 8.796 1.819 12 1.819M12 0C8.741 0 8.333.014 7.053.072 5.775.13 4.903.333 4.14.63a6.21 6.21 0 00-2.246 1.463A6.21 6.21 0 00.43 4.34C.133 5.103-.07 5.975.072 7.253.014 8.533 0 8.941 0 12.2s.014 3.668.072 4.948c.058 1.278.261 2.15.558 2.913a6.21 6.21 0 001.463 2.246 6.21 6.21 0 002.246 1.463c.763.297 1.635.5 2.913.558C8.533 23.986 8.941 24 12 24s3.468-.014 4.748-.072c1.278-.058 2.15-.261 2.913-.558a6.21 6.21 0 002.246-1.463 6.21 6.21 0 001.463-2.246c.297-.763.5-1.635.558-2.913C23.986 15.468 24 15.06 24 12s-.014-3.468-.072-4.748c-.058-1.278-.261-2.15-.558-2.913a6.21 6.21 0 00-1.463-2.246A6.21 6.21 0 0019.661.63C18.898.333 18.026.13 16.748.072 15.468.014 15.06 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="https://www.tiktok.com/@gugaopkmnoficial" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-black flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md" aria-label="TikTok">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.18z"/></svg>
          </a>
          <a href="https://chat.whatsapp.com/BenJb9AKRiN4UfIOuJHd99" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-green-500 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md" aria-label="WhatsApp">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </a>
          <a href="https://www.youtube.com/channel/UCBl_UbQxg1WwXJNXBa_aGlw" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md" aria-label="YouTube">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
        </div>
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
            className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-primary-dark transition-colors min-h-[44px] shrink-0"
          >
            Copiar
          </button>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors min-h-[44px] text-sm"
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

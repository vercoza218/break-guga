'use client';

import { useEffect, useState, useCallback } from 'react';

interface Product {
  id: number;
  name: string;
  stock: number;
  price: number;
  image: string | null;
  coming_soon: number;
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const fetchProducts = useCallback(async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
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
    await navigator.clipboard.writeText('abracarteiratcg@gmail.com');
    alert('Chave PIX copiada!');
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Boosters Disponiveis
        </h2>
        <p className="text-gray-500">Escolha seus boosters e participe do break!</p>
      </div>

      {products.length === 0 && (
        <p className="text-gray-400 text-center py-12">
          Nenhum produto cadastrado ainda.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((product) => {
          const qty = quantities[product.id] || 0;
          const total = qty * product.price;
          const soldOut = product.stock <= 0;
          const comingSoon = !!product.coming_soon;
          const unavailable = soldOut || comingSoon;

          return (
            <div
              key={product.id}
              className={`bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
                unavailable
                  ? 'border-gray-200 opacity-70'
                  : 'border-gray-200 hover:border-primary/30'
              }`}
            >
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
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors text-sm"
                      >
                        QUERO
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
  const whatsappMessage = `Ola! Gostaria de participar do break.\n\nProduto: ${productName}\nQuantidade: ${quantity}\nTotal: R$ ${total.toFixed(2).replace('.', ',')}\n\nSegue o comprovante de pagamento:`;
  const whatsappUrl = `https://wa.me/5581997492084?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <h4 className="text-primary font-semibold text-sm">Pagamento</h4>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 shrink-0">PIX:</span>
          <span className="text-xs text-gray-700 truncate flex-1">
            abracarteiratcg@gmail.com
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

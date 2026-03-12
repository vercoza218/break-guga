'use client';

import { useEffect, useState, useCallback } from 'react';

interface Product {
  id: number;
  name: string;
  stock: number;
  price: number;
  image: string | null;
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
      <h2 className="text-xl md:text-2xl font-bold text-gold mb-6">
        Produtos Disponíveis
      </h2>

      {products.length === 0 && (
        <p className="text-gray-400 text-center py-12">
          Nenhum produto cadastrado ainda.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => {
          const qty = quantities[product.id] || 0;
          const total = qty * product.price;
          const soldOut = product.stock <= 0;

          return (
            <div
              key={product.id}
              className={`bg-dark-card rounded-xl border transition-all duration-200 overflow-hidden ${
                soldOut
                  ? 'border-gray-700 opacity-60'
                  : 'border-gold/20 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/5'
              }`}
            >
              <div className="aspect-[4/3] bg-dark-surface relative overflow-hidden">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    🎴
                  </div>
                )}
                {soldOut && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <span className="text-red-500 font-bold text-xl tracking-wider">
                      ESGOTADO
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-bold text-lg text-white mb-1 truncate">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gold font-bold text-lg">
                    R$ {product.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400">
                    Estoque: {product.stock}
                  </span>
                </div>

                {!soldOut && (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <label className="text-sm text-gray-400">Qtd:</label>
                      <select
                        value={qty}
                        onChange={(e) =>
                          setQty(product.id, Number(e.target.value))
                        }
                        className="flex-1 bg-dark-surface border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-gold focus:outline-none min-h-[44px]"
                      >
                        <option value={0}>Selecione</option>
                        {Array.from({ length: product.stock }, (_, i) => i + 1).map(
                          (n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {qty > 0 && (
                      <div className="space-y-3">
                        <div className="bg-dark-surface rounded-lg p-3 text-center">
                          <span className="text-sm text-gray-400">Total:</span>
                          <span className="text-gold font-bold text-xl ml-2">
                            R$ {total.toFixed(2)}
                          </span>
                        </div>

                        <PaymentBlock onCopyPix={copyPix} />
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

function PaymentBlock({ onCopyPix }: { onCopyPix: () => void }) {
  return (
    <div className="bg-dark-surface border border-gold/20 rounded-lg p-4 space-y-3">
      <h4 className="text-gold font-semibold text-sm">Pagamento</h4>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 shrink-0">PIX:</span>
          <span className="text-xs text-white truncate flex-1">
            abracarteiratcg@gmail.com
          </span>
          <button
            onClick={onCopyPix}
            className="bg-gold text-black text-xs font-bold px-3 py-2 rounded-lg hover:bg-gold-light transition-colors min-h-[44px] shrink-0"
          >
            Copiar
          </button>
        </div>

        <a
          href="https://wa.me/5581997492084"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition-colors min-h-[44px] text-sm"
        >
          📱 Enviar comprovante via WhatsApp
        </a>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        Para pagar no crédito em até 12x (consulte juros), fale no número acima
        para uma simulação.
      </p>
    </div>
  );
}

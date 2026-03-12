'use client';

import { useEffect, useState, useCallback } from 'react';

interface QueueItem {
  id: number;
  buyer_name: string;
  product_id: number;
  product_name: string;
  product_image: string | null;
  quantity: number;
  position: number;
}

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const fetchQueue = useCallback(async () => {
    const res = await fetch('/api/queue');
    const data = await res.json();
    setQueue(data);
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold text-gold mb-6">
        Fila de Abertura
      </h2>

      {queue.length === 0 && (
        <p className="text-gray-400 text-center py-12">
          Nenhum item na fila de abertura.
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {queue.map((item) => (
          <div
            key={item.id}
            className="bg-dark-card border border-gold/20 rounded-xl overflow-hidden relative"
          >
            {/* Position badge */}
            <div className="absolute top-2 left-2 z-10 bg-gold text-black font-bold text-sm w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
              {item.position}
            </div>

            {/* Quantity badge */}
            <div className="absolute top-2 right-2 z-10 bg-dark/80 backdrop-blur text-gold font-bold text-sm px-2 py-1 rounded-lg border border-gold/30">
              x{item.quantity}
            </div>

            {/* Product image */}
            <div className="aspect-[3/4] bg-dark-surface flex items-center justify-center overflow-hidden">
              {item.product_image ? (
                <img
                  src={item.product_image}
                  alt={item.product_name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-5xl">🎴</span>
              )}
            </div>

            {/* Info */}
            <div className="p-3 text-center">
              <p className="font-bold text-white text-sm md:text-base truncate">
                {item.buyer_name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {item.product_name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

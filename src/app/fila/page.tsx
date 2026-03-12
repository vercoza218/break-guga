'use client';

import { useEffect, useState, useCallback } from 'react';

interface QueueItem {
  id: number;
  buyer_name: string;
  product_id: number;
  product_name: string;
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
    const interval = setInterval(fetchQueue, 15000);
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

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {queue.map((item) => (
          <div
            key={item.id}
            className="bg-dark-card border border-gold/20 rounded-xl p-4 flex items-center gap-4"
          >
            <div className="bg-gold text-black font-bold text-lg w-10 h-10 rounded-full flex items-center justify-center shrink-0">
              {item.position}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate">{item.buyer_name}</p>
              <p className="text-sm text-gray-400 truncate">
                {item.product_name}
              </p>
            </div>
            <div className="text-gold font-bold shrink-0">
              x{item.quantity}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table */}
      {queue.length > 0 && (
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold/30 text-gold text-left">
                <th className="py-3 px-4 w-20">#</th>
                <th className="py-3 px-4">Comprador</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4 w-28 text-center">Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-800 hover:bg-dark-card/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <span className="bg-gold text-black font-bold w-8 h-8 rounded-full inline-flex items-center justify-center text-sm">
                      {item.position}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-white">
                    {item.buyer_name}
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {item.product_name}
                  </td>
                  <td className="py-3 px-4 text-center text-gold font-bold">
                    {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

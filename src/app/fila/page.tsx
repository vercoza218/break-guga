'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface QueueItem {
  id: number;
  buyer_name: string;
  product_id: number;
  product_name: string;
  product_image: string | null;
  quantity: number;
  position: number;
}

interface HistoryItem {
  id: number;
  buyer_name: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  opened_at: string;
}

function QueueContent() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const seenIds = useRef<Set<number>>(new Set());
  const searchParams = useSearchParams();
  const fullscreen = searchParams.get('fullscreen') === 'true';

  const fetchQueue = useCallback(async () => {
    const res = await fetch('/api/queue');
    const data = await res.json();
    setQueue(data);
  }, []);

  const fetchHistory = useCallback(async () => {
    const res = await fetch('/api/history');
    const data = await res.json();
    setHistory(data);
  }, []);

  useEffect(() => {
    // Try SSE first, fallback to polling
    const eventSource = new EventSource('/api/queue/stream');
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setQueue(data);
        fetchHistory();
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      fetchQueue();
      fetchHistory();
      fallbackInterval = setInterval(() => { fetchQueue(); fetchHistory(); }, 5000);
    };

    return () => {
      eventSource.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [fetchQueue, fetchHistory]);

  useEffect(() => {
    if (fullscreen) {
      document.body.style.background = 'transparent';
      return () => { document.body.style.background = ''; };
    }
  }, [fullscreen]);

  // Track new items for animation
  const newIds = new Set<number>();
  queue.forEach((item) => {
    if (!seenIds.current.has(item.id)) {
      newIds.add(item.id);
    }
  });
  // Update seen IDs after render
  useEffect(() => {
    queue.forEach((item) => seenIds.current.add(item.id));
  }, [queue]);

  return (
    <div className={fullscreen ? 'p-4' : ''}>
      {!fullscreen && (
        <h2 className="text-xl md:text-2xl font-bold text-green-400 mb-6">
          Fila de Abertura
        </h2>
      )}

      {queue.length === 0 && !fullscreen && (
        <p className="text-gray-400 text-center py-12">
          Nenhum item na fila de abertura.
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {queue.map((item, index) => {
          const isFirst = item.position === 1;
          const isNew = newIds.has(item.id);

          return (
            <div
              key={item.id}
              className={`bg-dark-card rounded-xl overflow-hidden relative ${
                isFirst
                  ? 'animate-gold-pulse border-2 border-green-500'
                  : 'border border-green-500/30'
              } ${isNew ? 'animate-fade-slide-in' : ''}`}
              style={isNew ? { animationDelay: `${index * 80}ms` } : undefined}
            >
              {/* Position badge */}
              <div className="absolute top-2 left-2 z-10 bg-green-500 text-black font-bold text-sm w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                {item.position}
              </div>

              {/* Quantity badge */}
              <div className="absolute top-2 right-2 z-10 bg-dark/80 backdrop-blur text-green-400 font-bold text-sm px-2 py-1 rounded-lg border border-green-500/30">
                x{item.quantity}
              </div>

              {/* Product image */}
              <div className="aspect-[9/14] bg-dark-surface flex items-center justify-center overflow-hidden">
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
          );
        })}
      </div>

      {/* History section */}
      {!fullscreen && history.length > 0 && (
        <>
          <h2 className="text-xl md:text-2xl font-bold text-red-400 mb-6 mt-10">
            Ja Abertos
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-dark-card border border-red-500/30 rounded-xl overflow-hidden relative"
              >
                {/* Quantity badge */}
                <div className="absolute top-2 right-2 z-10 bg-dark/80 backdrop-blur text-red-400 font-bold text-sm px-2 py-1 rounded-lg border border-red-500/30">
                  x{item.quantity}
                </div>

                {/* Product image */}
                <div className="aspect-[9/14] bg-dark-surface flex items-center justify-center overflow-hidden">
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
        </>
      )}
    </div>
  );
}

export default function QueuePage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-center py-12">Carregando...</div>}>
      <QueueContent />
    </Suspense>
  );
}

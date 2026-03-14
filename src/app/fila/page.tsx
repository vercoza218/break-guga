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

function QueueSkeleton() {
  return (
    <div className="bg-white rounded-2xl border-2 border-green-200 overflow-hidden animate-pulse">
      <div className="aspect-[9/14] bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
        <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
      </div>
    </div>
  );
}

function QueueContent() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
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
    const eventSource = new EventSource('/api/queue/stream');
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setQueue(data);
        setLoading(false);
        fetchHistory();
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      fetchQueue().then(() => setLoading(false));
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
  useEffect(() => {
    queue.forEach((item) => seenIds.current.add(item.id));
  }, [queue]);

  return (
    <div className={fullscreen ? 'p-4' : ''}>
      {!fullscreen && (
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Fila do Break
          </h2>
          <p className="text-gray-500">Ordem de abertura dos boosters</p>
        </div>
      )}

      {loading && !fullscreen && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <QueueSkeleton key={i} />)}
        </div>
      )}

      {!loading && queue.length === 0 && !fullscreen && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-400">Nenhum participante na fila ainda</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {queue.map((item, index) => {
          const isFirst = item.position === 1;
          const isNew = newIds.has(item.id);

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl overflow-hidden relative shadow-sm ${
                isFirst
                  ? 'animate-gold-pulse border-2 border-green-500'
                  : 'border-2 border-green-200'
              } ${isNew ? 'animate-fade-slide-in' : ''}`}
              style={isNew ? { animationDelay: `${index * 80}ms` } : undefined}
            >
              {/* Position badge */}
              <div className="absolute top-2 left-2 z-10 bg-green-500 text-white font-bold text-sm w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                {item.position}
              </div>

              {/* Quantity badge */}
              <div className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur text-green-600 font-bold text-sm px-2 py-1 rounded-lg border border-green-200 shadow-sm">
                x{item.quantity}
              </div>

              {/* Product image */}
              <div className="aspect-[9/14] bg-gray-50 flex items-center justify-center overflow-hidden">
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
                <p className="font-bold text-gray-800 text-sm md:text-base truncate">
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
          <div className="text-center mb-6 mt-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Ja Abertos
            </h2>
            <p className="text-gray-500">Boosters que ja foram abertos</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-white border-2 border-red-200 rounded-2xl overflow-hidden relative shadow-sm"
              >
                {/* Quantity badge */}
                <div className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur text-red-500 font-bold text-sm px-2 py-1 rounded-lg border border-red-200 shadow-sm">
                  x{item.quantity}
                </div>

                {/* Product image */}
                <div className="aspect-[9/14] bg-gray-50 flex items-center justify-center overflow-hidden">
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
                  <p className="font-bold text-gray-800 text-sm md:text-base truncate">
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
      {/* Banner to navigate to Vitrine */}
      {!fullscreen && (
        <div className="mt-10 mb-4">
          <a
            href="/"
            className="block bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-center text-white hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🛒</div>
            <h3 className="text-lg font-bold mb-1">Nao fique de fora!</h3>
            <p className="text-green-100 text-sm">Compre os nossos boosters e participe do break ao vivo</p>
          </a>
        </div>
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

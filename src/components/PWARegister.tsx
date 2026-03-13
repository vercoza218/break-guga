'use client';

import { useEffect, useState } from 'react';

export default function PWARegister() {
  const [showIOSBanner, setShowIOSBanner] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed silently
      });
    }

    // Check if iOS and not in standalone mode
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone);
    const dismissed = localStorage.getItem('pwa-ios-dismissed');

    if (isIOS && !isStandalone && !dismissed) {
      // Show after a short delay so it doesn't appear immediately
      const timer = setTimeout(() => setShowIOSBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShowIOSBanner(false);
    localStorage.setItem('pwa-ios-dismissed', 'true');
  };

  if (!showIOSBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-slide-in">
      <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-2xl shadow-lg p-4 flex items-start gap-3">
        <div className="text-3xl shrink-0">⚡</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-sm">Instalar Gugaopkmn</p>
          <p className="text-xs text-gray-500 mt-1">
            Toque em{' '}
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 inline text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M15 8a1 1 0 01-1 1h-4v4a1 1 0 11-2 0V9H4a1 1 0 110-2h4V3a1 1 0 112 0v4h4a1 1 0 011 1z" />
              </svg>
            </span>{' '}
            e depois em <strong>&quot;Adicionar a Tela de Inicio&quot;</strong>
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-gray-400 hover:text-gray-600 text-lg shrink-0 p-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

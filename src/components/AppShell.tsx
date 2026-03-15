'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const fullscreen = searchParams.get('fullscreen') === 'true';
  const [battleCount, setBattleCount] = useState(0);

  const fetchBattleCount = useCallback(async () => {
    try {
      const res = await fetch('/api/battles');
      const data = await res.json();
      setBattleCount(data.filter((b: { status: string }) => b.status === 'open' || b.status === 'live').length);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchBattleCount();
    const interval = setInterval(fetchBattleCount, 10000);
    return () => clearInterval(interval);
  }, [fetchBattleCount]);

  if (fullscreen) {
    return <main className="min-h-screen">{children}</main>;
  }

  const isVitrine = pathname === '/';
  const isBatalhas = pathname === '/batalhas';
  const isFila = pathname === '/fila';

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Gugaopkmn" className="w-9 h-9 rounded-full object-cover" />
            <h1 className="text-lg md:text-xl font-bold text-primary">
              Gugaopkmn
            </h1>
            <span className="hidden sm:inline text-sm text-gray-400 font-normal">
              — Break ao Vivo
            </span>
          </a>
          <nav className="flex items-center gap-4 text-sm">
            <a
              href="/"
              className={`transition-colors font-medium ${isVitrine ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
            >
              Vitrine
            </a>
            <a
              href="/batalhas"
              className={`transition-colors font-medium relative ${isBatalhas ? 'text-orange-500' : 'text-gray-600 hover:text-orange-500'}`}
            >
              Batalhas
              {battleCount > 0 && (
                <span className="absolute -top-2 -right-4 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-urgency-pulse">
                  {battleCount}
                </span>
              )}
            </a>
            <a
              href="/fila"
              className={`transition-colors font-medium ${isFila ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
            >
              Fila
            </a>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
      {/* Footer with social links */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-center text-xs text-gray-400 mb-3">Siga a gente nas redes</p>
          <div className="flex justify-center gap-4">
            <a href="https://www.instagram.com/gugaopkmn/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md" aria-label="Instagram">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.088 4.088 0 011.47.957c.453.453.78.898.957 1.47.163.46.35 1.26.404 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.404 2.43a4.088 4.088 0 01-.957 1.47 4.088 4.088 0 01-1.47.957c-.46.163-1.26.35-2.43.404-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.404a4.088 4.088 0 01-1.47-.957 4.088 4.088 0 01-.957-1.47c-.163-.46-.35-1.26-.404-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.404-2.43a4.088 4.088 0 01.957-1.47A4.088 4.088 0 015.064 2.293c.46-.163 1.26-.35 2.43-.404C8.416 1.831 8.796 1.819 12 1.819M12 0C8.741 0 8.333.014 7.053.072 5.775.13 4.903.333 4.14.63a6.21 6.21 0 00-2.246 1.463A6.21 6.21 0 00.43 4.34C.133 5.103-.07 5.975.072 7.253.014 8.533 0 8.941 0 12.2s.014 3.668.072 4.948c.058 1.278.261 2.15.558 2.913a6.21 6.21 0 001.463 2.246 6.21 6.21 0 002.246 1.463c.763.297 1.635.5 2.913.558C8.533 23.986 8.941 24 12 24s3.468-.014 4.748-.072c1.278-.058 2.15-.261 2.913-.558a6.21 6.21 0 002.246-1.463 6.21 6.21 0 001.463-2.246c.297-.763.5-1.635.558-2.913C23.986 15.468 24 15.06 24 12s-.014-3.468-.072-4.748c-.058-1.278-.261-2.15-.558-2.913a6.21 6.21 0 00-1.463-2.246A6.21 6.21 0 0019.661.63C18.898.333 18.026.13 16.748.072 15.468.014 15.06 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="https://www.tiktok.com/@gugaopkmnoficial" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md" aria-label="TikTok">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.18z"/></svg>
            </a>
            <a href="https://chat.whatsapp.com/BenJb9AKRiN4UfIOuJHd99" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md" aria-label="WhatsApp">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
            <a href="https://www.youtube.com/channel/UCBl_UbQxg1WwXJNXBa_aGlw" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md" aria-label="YouTube">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
          <p className="text-center text-[10px] text-gray-300 mt-3">Gugaopkmn — Break ao Vivo</p>
        </div>
      </footer>
    </>
  );
}

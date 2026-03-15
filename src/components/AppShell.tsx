'use client';

import { useSearchParams, usePathname } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const fullscreen = searchParams.get('fullscreen') === 'true';

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
              className={`transition-colors font-medium ${isBatalhas ? 'text-orange-500' : 'text-gray-600 hover:text-orange-500'}`}
            >
              Batalhas
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
    </>
  );
}

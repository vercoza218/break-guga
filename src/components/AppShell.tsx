'use client';

import { useSearchParams } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const fullscreen = searchParams.get('fullscreen') === 'true';

  if (fullscreen) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <h1 className="text-lg md:text-xl font-bold text-primary">
              Gugaopkmn
            </h1>
            <span className="hidden sm:inline text-sm text-gray-400 font-normal">
              — Break ao Vivo
            </span>
          </a>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/" className="text-gray-600 hover:text-primary transition-colors font-medium">
              Vitrine
            </a>
            <a href="/fila" className="text-gray-600 hover:text-primary transition-colors font-medium">
              Fila
            </a>
            <a href="/admin" className="text-gray-400 hover:text-primary transition-colors text-xs">
              Admin
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

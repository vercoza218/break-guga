import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Abra Carteira TCG - Break ao Vivo",
  description: "Gerenciamento de breaks de Pokémon TCG durante lives",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="bg-dark-card border-b border-gold/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <h1 className="text-lg md:text-xl font-bold text-gold">
            Abra Carteira TCG
          </h1>
          <span className="hidden sm:inline text-sm text-gold/60 font-normal">
            — Break ao Vivo
          </span>
        </a>
        <nav className="flex items-center gap-4 text-sm">
          <a
            href="/"
            className="text-gray-300 hover:text-gold transition-colors"
          >
            Vitrine
          </a>
          <a
            href="/fila"
            className="text-gray-300 hover:text-gold transition-colors"
          >
            Fila
          </a>
          <a
            href="/admin"
            className="text-gray-400 hover:text-gold transition-colors text-xs"
          >
            Admin
          </a>
        </nav>
      </div>
    </header>
  );
}

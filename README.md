# Abra Carteira TCG - Break ao Vivo

Aplicativo web para gerenciamento de breaks de Pokemon TCG durante lives.

## Stack

- Next.js 14 (App Router)
- SQLite com better-sqlite3
- Tailwind CSS
- TypeScript

## Instalacao

```bash
npm install
```

## Configuracao

Crie um arquivo `.env.local` na raiz:

```
ADMIN_PASSWORD=sua_senha_aqui
```

## Execucao

```bash
npm run dev
```

Acesse http://localhost:3000

## Paginas

- `/` - Vitrine publica dos produtos
- `/fila` - Fila de abertura publica
- `/admin` - Painel administrativo (protegido por senha)

## Funcionalidades

- Cadastro de produtos com imagem, estoque e preco
- Vitrine publica com calculo automatico de valor total
- Informacoes de pagamento via PIX e WhatsApp
- Fila de abertura com reordenacao
- Auto-refresh a cada 15 segundos nas paginas publicas
- Design responsivo (mobile-first)
- Tema escuro com acentos dourados

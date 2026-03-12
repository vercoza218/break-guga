'use client';

import { useEffect, useState, useCallback, FormEvent, useRef } from 'react';
import dynamic from 'next/dynamic';

const ImageCropper = dynamic(() => import('@/components/ImageCropper'), { ssr: false });

interface Product {
  id: number;
  name: string;
  stock: number;
  price: number;
  image: string | null;
}

interface QueueItem {
  id: number;
  buyer_name: string;
  product_id: number;
  product_name: string;
  quantity: number;
  position: number;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'queue'>('products');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthenticated(true);
    } else {
      setError('Senha incorreta');
    }
  };

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <form
          onSubmit={handleLogin}
          className="bg-dark-card border border-gold/20 rounded-xl p-8 w-full max-w-sm space-y-4"
        >
          <h2 className="text-xl font-bold text-gold text-center">
            Admin Login
          </h2>
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full bg-dark-surface border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none min-h-[44px]"
          />
          <button
            type="submit"
            className="w-full bg-gold text-black font-bold py-3 rounded-lg hover:bg-gold-light transition-colors min-h-[44px]"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="md:flex md:gap-6">
      {/* Mobile: Tabs */}
      <div className="md:hidden flex border-b border-gold/30 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'products'
              ? 'text-gold border-b-2 border-gold'
              : 'text-gray-400'
          }`}
        >
          Produtos
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'queue'
              ? 'text-gold border-b-2 border-gold'
              : 'text-gray-400'
          }`}
        >
          Fila de Abertura
        </button>
      </div>

      {/* Desktop: Sidebar */}
      <div className="hidden md:block w-56 shrink-0">
        <nav className="bg-dark-card border border-gold/20 rounded-xl p-2 sticky top-20 space-y-1">
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'products'
                ? 'bg-gold text-black'
                : 'text-gray-300 hover:bg-dark-surface'
            }`}
          >
            Produtos
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'queue'
                ? 'bg-gold text-black'
                : 'text-gray-300 hover:bg-dark-surface'
            }`}
          >
            Fila de Abertura
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'queue' && <QueueTab />}
      </div>
    </div>
  );
}

/* =================== PRODUCTS TAB =================== */

function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [stock, setStock] = useState('');
  const [price, setPrice] = useState('');
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const uploadBlob = async (blob: Blob): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', blob, 'product.png');
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropperSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropDone = (blob: Blob) => {
    setCroppedBlob(blob);
    setImagePreview(URL.createObjectURL(blob));
    setCropperSrc(null);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl: string | null = null;
    if (croppedBlob) {
      imageUrl = await uploadBlob(croppedBlob);
    }

    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        stock: parseInt(stock),
        price: parseFloat(price),
        image: imageUrl,
      }),
    });

    setName('');
    setStock('');
    setPrice('');
    setCroppedBlob(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLoading(false);
    fetchProducts();
  };

  const handleEdit = async (id: number) => {
    await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        stock: parseInt(editStock),
        price: parseFloat(editPrice),
      }),
    });
    setEditingId(null);
    fetchProducts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditName(product.name);
    setEditStock(product.stock.toString());
    setEditPrice(product.price.toString());
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gold">Cadastrar Produto</h3>

      <form
        onSubmit={handleCreate}
        className="bg-dark-card border border-gold/20 rounded-xl p-4 md:p-6 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nome do produto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="bg-dark-surface border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none min-h-[44px]"
          />
          <input
            type="number"
            placeholder="Quantidade em estoque"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
            min={0}
            className="bg-dark-surface border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none min-h-[44px]"
          />
          <input
            type="number"
            placeholder="Valor (R$)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min={0}
            step="0.01"
            className="bg-dark-surface border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none min-h-[44px]"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="bg-dark-surface border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none min-h-[44px] file:mr-3 file:bg-gold file:text-black file:border-0 file:rounded file:px-3 file:py-1 file:font-medium file:cursor-pointer"
          />
        </div>

        {imagePreview && (
          <div className="flex items-center gap-3">
            <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-lg object-contain bg-dark-surface" />
            <span className="text-sm text-green-400">Imagem recortada</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto bg-gold text-black font-bold px-8 py-3 rounded-lg hover:bg-gold-light transition-colors min-h-[44px] disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Cadastrar Produto'}
        </button>
      </form>

      {cropperSrc && (
        <ImageCropper
          imageSrc={cropperSrc}
          onCropComplete={handleCropDone}
          onCancel={() => {
            setCropperSrc(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
        />
      )}

      <h3 className="text-lg font-bold text-gold">Produtos Cadastrados</h3>

      {products.length === 0 && (
        <p className="text-gray-400">Nenhum produto cadastrado.</p>
      )}

      <div className="space-y-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-dark-card border border-gold/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4"
          >
            {product.image && (
              <img
                src={product.image}
                alt={product.name}
                className="w-16 h-16 rounded-lg object-cover shrink-0"
              />
            )}

            {editingId === product.id ? (
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-dark-surface border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-gold focus:outline-none min-h-[44px]"
                  />
                  <input
                    type="number"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    min={0}
                    className="bg-dark-surface border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-gold focus:outline-none min-h-[44px]"
                  />
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    min={0}
                    step="0.01"
                    className="bg-dark-surface border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-gold focus:outline-none min-h-[44px]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product.id)}
                    className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-500 transition-colors min-h-[44px] text-sm"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors min-h-[44px] text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white">{product.name}</p>
                  <p className="text-sm text-gray-400">
                    Estoque: {product.stock} | R$ {product.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(product)}
                    className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors min-h-[44px]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-red-500 transition-colors min-h-[44px]"
                  >
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =================== QUEUE TAB =================== */

function QueueTab() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [buyerName, setBuyerName] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');

  const fetchQueue = useCallback(async () => {
    const res = await fetch('/api/queue');
    const data = await res.json();
    setQueue(data);
  }, []);

  const fetchProducts = useCallback(async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  }, []);

  useEffect(() => {
    fetchQueue();
    fetchProducts();
  }, [fetchQueue, fetchProducts]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    await fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyer_name: buyerName,
        product_id: parseInt(productId),
        quantity: parseInt(quantity),
      }),
    });
    setBuyerName('');
    setProductId('');
    setQuantity('1');
    fetchQueue();
    fetchProducts();
  };

  const handleRemove = async (id: number) => {
    if (!confirm('Remover este item da fila?')) return;
    await fetch(`/api/queue/${id}`, { method: 'DELETE' });
    fetchQueue();
  };

  const handleReorder = async (id: number, direction: 'up' | 'down') => {
    await fetch('/api/queue/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, direction }),
    });
    fetchQueue();
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gold">Adicionar à Fila</h3>

      <form
        onSubmit={handleAdd}
        className="bg-dark-card border border-gold/20 rounded-xl p-4 md:p-6 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Nome do comprador"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            required
            className="bg-dark-surface border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none min-h-[44px]"
          />
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            className="bg-dark-surface border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none min-h-[44px]"
          >
            <option value="">Selecione o produto</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Quantidade"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            min={1}
            className="bg-dark-surface border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none min-h-[44px]"
          />
        </div>
        <button
          type="submit"
          className="w-full md:w-auto bg-gold text-black font-bold px-8 py-3 rounded-lg hover:bg-gold-light transition-colors min-h-[44px]"
        >
          Adicionar à Fila
        </button>
      </form>

      <h3 className="text-lg font-bold text-gold">Fila Atual</h3>

      {queue.length === 0 && (
        <p className="text-gray-400">Nenhum item na fila.</p>
      )}

      <div className="space-y-3">
        {queue.map((item, index) => (
          <div
            key={item.id}
            className="bg-dark-card border border-gold/20 rounded-xl p-4 flex items-center gap-3"
          >
            <div className="bg-gold text-black font-bold text-sm w-8 h-8 rounded-full flex items-center justify-center shrink-0">
              {item.position}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate">{item.buyer_name}</p>
              <p className="text-sm text-gray-400 truncate">
                {item.product_name} (x{item.quantity})
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => handleReorder(item.id, 'up')}
                disabled={index === 0}
                className="bg-dark-surface text-gray-300 w-10 h-10 rounded-lg flex items-center justify-center hover:bg-dark-lighter transition-colors disabled:opacity-30"
                title="Mover para cima"
              >
                ▲
              </button>
              <button
                onClick={() => handleReorder(item.id, 'down')}
                disabled={index === queue.length - 1}
                className="bg-dark-surface text-gray-300 w-10 h-10 rounded-lg flex items-center justify-center hover:bg-dark-lighter transition-colors disabled:opacity-30"
                title="Mover para baixo"
              >
                ▼
              </button>
              <button
                onClick={() => handleRemove(item.id)}
                className="bg-red-600/80 text-white w-10 h-10 rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors"
                title="Remover"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback, FormEvent, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/Toast';

const ImageCropper = dynamic(() => import('@/components/ImageCropper'), { ssr: false });

interface Product {
  id: number;
  name: string;
  stock: number;
  price: number;
  image: string | null;
  coming_soon: number;
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
  const [activeTab, setActiveTab] = useState<'products' | 'queue' | 'history'>('products');

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
          className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm space-y-4 shadow-sm"
        >
          <h2 className="text-xl font-bold text-gray-800 text-center">
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
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-primary focus:outline-none min-h-[44px]"
          />
          <button
            type="submit"
            className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-dark transition-colors min-h-[44px]"
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
      <div className="md:hidden flex border-b border-gray-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'products'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-400'
          }`}
        >
          Produtos
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'queue'
              ? 'text-green-600 border-b-2 border-green-500'
              : 'text-gray-400'
          }`}
        >
          Fila de Abertura
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'history'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-gray-400'
          }`}
        >
          Ja Abertos
        </button>
      </div>

      {/* Desktop: Sidebar */}
      <div className="hidden md:block w-56 shrink-0">
        <nav className="bg-white border border-gray-200 rounded-2xl p-2 sticky top-20 space-y-1 shadow-sm">
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'products'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Produtos
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'queue'
                ? 'bg-green-500 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Fila de Abertura
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-red-500 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Ja Abertos
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'queue' && <QueueTab />}
        {activeTab === 'history' && <HistoryTab />}
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
  const { toast } = useToast();

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
    toast('Produto criado com sucesso!');
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
    toast('Produto atualizado!');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    fetchProducts();
    toast('Produto excluido!', 'info');
  };

  const handleToggleComingSoon = async (product: Product) => {
    await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coming_soon: !product.coming_soon }),
    });
    fetchProducts();
    toast(product.coming_soon ? 'Produto ativado!' : 'Produto marcado como Em Breve');
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditName(product.name);
    setEditStock(product.stock.toString());
    setEditPrice(product.price.toString());
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-800">Cadastrar Produto</h3>

      <form
        onSubmit={handleCreate}
        className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 space-y-4 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nome do produto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-primary focus:outline-none min-h-[44px]"
          />
          <input
            type="number"
            placeholder="Quantidade em estoque"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
            min={0}
            className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-primary focus:outline-none min-h-[44px]"
          />
          <input
            type="number"
            placeholder="Valor (R$)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min={0}
            step="0.01"
            className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-primary focus:outline-none min-h-[44px]"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-primary focus:outline-none min-h-[44px] file:mr-3 file:bg-primary file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:font-medium file:cursor-pointer"
          />
        </div>

        {imagePreview && (
          <div className="flex items-center gap-3">
            <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-xl object-contain bg-gray-50" />
            <span className="text-sm text-green-600">Imagem pronta</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors min-h-[44px] disabled:opacity-50"
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

      <h3 className="text-lg font-bold text-gray-800">Produtos Cadastrados</h3>

      {products.length === 0 && (
        <p className="text-gray-400">Nenhum produto cadastrado.</p>
      )}

      <div className="space-y-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4 shadow-sm"
          >
            {product.image && (
              <img
                src={product.image}
                alt={product.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
            )}

            {editingId === product.id ? (
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:border-primary focus:outline-none min-h-[44px]"
                  />
                  <input
                    type="number"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    min={0}
                    className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:border-primary focus:outline-none min-h-[44px]"
                  />
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    min={0}
                    step="0.01"
                    className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:border-primary focus:outline-none min-h-[44px]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product.id)}
                    className="bg-green-500 text-white font-bold px-4 py-2 rounded-xl hover:bg-green-600 transition-colors min-h-[44px] text-sm"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-300 transition-colors min-h-[44px] text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-800">{product.name}</p>
                    {product.coming_soon ? (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                        Em Breve
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-500">
                    Estoque: {product.stock} | R$ {product.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => handleToggleComingSoon(product)}
                    className={`text-sm font-bold px-4 py-2 rounded-xl transition-colors min-h-[44px] ${
                      product.coming_soon
                        ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {product.coming_soon ? 'Desativar Em Breve' : 'Em Breve'}
                  </button>
                  <button
                    onClick={() => startEdit(product)}
                    className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-primary-dark transition-colors min-h-[44px]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-red-600 transition-colors min-h-[44px]"
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
  const [editingQueueId, setEditingQueueId] = useState<number | null>(null);
  const [editBuyerName, setEditBuyerName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const { toast } = useToast();

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
    toast('Adicionado a fila!');
  };

  const handleRemove = async (id: number) => {
    if (!confirm('Remover este item da fila?')) return;
    await fetch(`/api/queue/${id}`, { method: 'DELETE' });
    fetchQueue();
    fetchProducts();
    toast('Removido da fila', 'info');
  };

  const handleMarkOpened = async (id: number) => {
    await fetch(`/api/queue/${id}`, { method: 'DELETE' });
    fetchQueue();
    fetchProducts();
    toast('Marcado como aberto!');
  };

  const handleReorder = async (id: number, direction: 'up' | 'down') => {
    await fetch('/api/queue/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, direction }),
    });
    fetchQueue();
  };

  const startEditQueue = (item: QueueItem) => {
    setEditingQueueId(item.id);
    setEditBuyerName(item.buyer_name);
    setEditQuantity(item.quantity.toString());
  };

  const handleEditQueue = async (id: number) => {
    await fetch(`/api/queue/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyer_name: editBuyerName,
        quantity: parseInt(editQuantity),
      }),
    });
    setEditingQueueId(null);
    fetchQueue();
    fetchProducts();
    toast('Item atualizado!');
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-green-600">Adicionar a Fila</h3>

      <form
        onSubmit={handleAdd}
        className="bg-white border border-green-200 rounded-2xl p-4 md:p-6 space-y-4 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Nome do comprador"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            required
            className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-green-500 focus:outline-none min-h-[44px]"
          />
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-green-500 focus:outline-none min-h-[44px]"
          >
            <option value="">Selecione o produto</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (estoque: {p.stock})
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
            className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-green-500 focus:outline-none min-h-[44px]"
          />
        </div>
        <button
          type="submit"
          className="w-full md:w-auto bg-green-500 text-white font-bold px-8 py-3 rounded-xl hover:bg-green-600 transition-colors min-h-[44px]"
        >
          Adicionar a Fila
        </button>
      </form>

      <h3 className="text-lg font-bold text-green-600">Fila Atual</h3>

      {queue.length === 0 && (
        <p className="text-gray-400">Nenhum item na fila.</p>
      )}

      <div className="space-y-3">
        {queue.map((item, index) => (
          <div
            key={item.id}
            className="bg-white border border-green-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3 shadow-sm"
          >
            <div className="bg-green-500 text-white font-bold text-sm w-8 h-8 rounded-full flex items-center justify-center shrink-0">
              {item.position}
            </div>

            {editingQueueId === item.id ? (
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={editBuyerName}
                    onChange={(e) => setEditBuyerName(e.target.value)}
                    placeholder="Nome do comprador"
                    className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:border-green-500 focus:outline-none min-h-[44px]"
                  />
                  <input
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    min={1}
                    placeholder="Quantidade"
                    className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:border-green-500 focus:outline-none min-h-[44px]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditQueue(item.id)}
                    className="bg-green-500 text-white font-bold px-4 py-2 rounded-xl hover:bg-green-600 transition-colors min-h-[44px] text-sm"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditingQueueId(null)}
                    className="bg-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-300 transition-colors min-h-[44px] text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{item.buyer_name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {item.product_name} (x{item.quantity})
                  </p>
                </div>
                <div className="flex gap-1 shrink-0 flex-wrap">
                  <button
                    onClick={() => handleReorder(item.id, 'up')}
                    disabled={index === 0}
                    className="bg-gray-100 text-gray-600 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-30"
                    title="Mover para cima"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleReorder(item.id, 'down')}
                    disabled={index === queue.length - 1}
                    className="bg-gray-100 text-gray-600 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-30"
                    title="Mover para baixo"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => startEditQueue(item)}
                    className="bg-primary/10 text-primary w-10 h-10 rounded-xl flex items-center justify-center hover:bg-primary/20 transition-colors"
                    title="Editar"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleMarkOpened(item.id)}
                    className="bg-green-500 text-white h-10 px-3 rounded-xl flex items-center justify-center hover:bg-green-600 transition-colors text-xs font-bold"
                    title="Marcar como aberto"
                  >
                    Ja Aberto
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="bg-red-100 text-red-500 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-red-200 transition-colors"
                    title="Remover"
                  >
                    ✕
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

/* =================== HISTORY TAB =================== */

interface HistoryItem {
  id: number;
  buyer_name: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  opened_at: string;
}

function HistoryTab() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBuyerName, setEditBuyerName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const { toast } = useToast();

  const fetchHistory = useCallback(async () => {
    const res = await fetch('/api/history');
    const data = await res.json();
    setHistory(data);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const startEdit = (item: HistoryItem) => {
    setEditingId(item.id);
    setEditBuyerName(item.buyer_name);
    setEditQuantity(item.quantity.toString());
  };

  const handleEdit = async (id: number) => {
    await fetch(`/api/history/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyer_name: editBuyerName,
        quantity: parseInt(editQuantity),
      }),
    });
    setEditingId(null);
    fetchHistory();
    toast('Historico atualizado!');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este item do historico?')) return;
    await fetch(`/api/history/${id}`, { method: 'DELETE' });
    fetchHistory();
    toast('Item excluido', 'info');
  };

  const handleClearAll = async () => {
    if (!confirm('Tem certeza que deseja limpar todo o historico? Esta acao nao pode ser desfeita.')) return;
    await fetch('/api/history', { method: 'DELETE' });
    fetchHistory();
    toast('Historico limpo!', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-red-500">Ja Abertos</h3>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="bg-red-100 text-red-500 text-sm font-bold px-4 py-2 rounded-xl hover:bg-red-200 transition-colors"
          >
            Limpar Tudo
          </button>
        )}
      </div>

      {history.length === 0 && (
        <p className="text-gray-400">Nenhuma abertura registrada.</p>
      )}

      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-red-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3 shadow-sm"
          >
            {item.product_image && (
              <img
                src={item.product_image}
                alt={item.product_name}
                className="w-12 h-16 rounded-xl object-contain bg-gray-50 shrink-0"
              />
            )}

            {editingId === item.id ? (
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={editBuyerName}
                    onChange={(e) => setEditBuyerName(e.target.value)}
                    placeholder="Nome do comprador"
                    className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:border-red-500 focus:outline-none min-h-[44px]"
                  />
                  <input
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    min={1}
                    placeholder="Quantidade"
                    className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:border-red-500 focus:outline-none min-h-[44px]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item.id)}
                    className="bg-green-500 text-white font-bold px-4 py-2 rounded-xl hover:bg-green-600 transition-colors min-h-[44px] text-sm"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-300 transition-colors min-h-[44px] text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{item.buyer_name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {item.product_name} (x{item.quantity})
                  </p>
                </div>
                <div className="text-xs text-gray-400 shrink-0">
                  {new Date(item.opened_at).toLocaleString('pt-BR')}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(item)}
                    className="bg-primary/10 text-primary text-sm font-bold px-3 py-2 rounded-xl hover:bg-primary/20 transition-colors min-h-[44px]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-100 text-red-500 text-sm font-bold px-3 py-2 rounded-xl hover:bg-red-200 transition-colors min-h-[44px]"
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

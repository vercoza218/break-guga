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
  collection_url: string | null;
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
  const [activeTab, setActiveTab] = useState<'products' | 'queue' | 'history' | 'battles'>('products');

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
          onClick={() => setActiveTab('battles')}
          className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'battles'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-gray-400'
          }`}
        >
          Batalhas
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
            onClick={() => setActiveTab('battles')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'battles'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Batalhas
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
        {activeTab === 'battles' && <BattlesTab />}
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
  const [collectionUrl, setCollectionUrl] = useState('');
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCollectionUrl, setEditCollectionUrl] = useState('');
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
        collection_url: collectionUrl || null,
      }),
    });

    setName('');
    setStock('');
    setPrice('');
    setCollectionUrl('');
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
        collection_url: editCollectionUrl || null,
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
    setEditCollectionUrl(product.collection_url || '');
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
        <input
          type="url"
          placeholder="Link da colecao (Liga Pokemon) — opcional"
          value={collectionUrl}
          onChange={(e) => setCollectionUrl(e.target.value)}
          className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-primary focus:outline-none min-h-[44px]"
        />

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
                <input
                  type="url"
                  value={editCollectionUrl}
                  onChange={(e) => setEditCollectionUrl(e.target.value)}
                  placeholder="Link da colecao (Liga Pokemon)"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:border-primary focus:outline-none min-h-[44px]"
                />
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

/* =================== BATTLES TAB =================== */

interface BattleEntry {
  id: number;
  battle_id: number;
  player_name: string;
  avatar: string | null;
  payment_status: string;
  best_card: string | null;
  card_value: number | null;
  card_value_2: number | null;
}

interface Battle {
  id: number;
  product_id: number;
  product_name: string;
  product_price: number;
  product_image: string | null;
  boosters_per_player: number;
  max_players: number;
  status: string;
  title: string | null;
  creator_entry_id: number | null;
  winner_entry_id: number | null;
  entries: BattleEntry[];
}

function BattlesTab() {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [boostersPerPlayer, setBoostersPerPlayer] = useState('1');
  const [maxPlayers, setMaxPlayers] = useState('2');
  const [battleTitle, setBattleTitle] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joiningBattleId, setJoiningBattleId] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchBattles = useCallback(async () => {
    const res = await fetch('/api/battles');
    const data = await res.json();
    setBattles(data);
  }, []);

  const fetchProducts = useCallback(async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  }, []);

  useEffect(() => {
    fetchBattles();
    fetchProducts();
    const interval = setInterval(fetchBattles, 5000);
    return () => clearInterval(interval);
  }, [fetchBattles, fetchProducts]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    await fetch('/api/battles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: parseInt(productId),
        boosters_per_player: parseInt(boostersPerPlayer),
        max_players: parseInt(maxPlayers),
        title: battleTitle || null,
      }),
    });
    setProductId('');
    setBoostersPerPlayer('1');
    setMaxPlayers('2');
    setBattleTitle('');
    fetchBattles();
    toast('Batalha criada!');
  };

  const handleJoin = async (battleId: number) => {
    if (!playerName.trim()) return;
    await fetch(`/api/battles/${battleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', player_name: playerName }),
    });
    setPlayerName('');
    setJoiningBattleId(null);
    fetchBattles();
    toast('Jogador adicionado!');
  };

  const handleSetStatus = async (battleId: number, status: string) => {
    await fetch(`/api/battles/${battleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchBattles();
    toast(status === 'live' ? 'Batalha ao vivo!' : `Status: ${status}`);
  };

  const handleRegisterCard = async (battleId: number, entryId: number, bestCard: string, cardValue: number, cardValue2: number) => {
    await fetch(`/api/battles/${battleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register_card', entry_id: entryId, best_card: bestCard, card_value: cardValue, card_value_2: cardValue2 }),
    });
    fetchBattles();
    toast('Carta registrada!');
  };

  const handleRemovePlayer = async (battleId: number, entryId: number) => {
    if (!confirm('Remover este jogador da batalha?')) return;
    await fetch(`/api/battles/${battleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove_player', entry_id: entryId }),
    });
    fetchBattles();
    toast('Jogador removido', 'info');
  };

  const handleFinish = async (battleId: number) => {
    const res = await fetch(`/api/battles/${battleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'finish' }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast(data.error || 'Erro ao finalizar', 'error');
      return;
    }
    fetchBattles();
    toast('Batalha finalizada! Vencedor definido!');
  };

  const handleConfirmPayment = async (battleId: number, entryId: number) => {
    await fetch(`/api/battles/${battleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm_payment', entry_id: entryId }),
    });
    fetchBattles();
    toast('Pagamento confirmado!');
  };

  const handleRevokePayment = async (battleId: number, entryId: number) => {
    await fetch(`/api/battles/${battleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'revoke_payment', entry_id: entryId }),
    });
    fetchBattles();
    toast('Pagamento revogado', 'info');
  };

  const handleDelete = async (battleId: number) => {
    if (!confirm('Excluir esta batalha?')) return;
    await fetch(`/api/battles/${battleId}`, { method: 'DELETE' });
    fetchBattles();
    toast('Batalha excluida', 'info');
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case 'open': return 'Aberta';
      case 'ready': return 'Pronta';
      case 'live': return 'Ao Vivo';
      case 'finished': return 'Finalizada';
      default: return s;
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'open': return 'bg-blue-100 text-blue-600';
      case 'ready': return 'bg-amber-100 text-amber-600';
      case 'live': return 'bg-red-100 text-red-600';
      case 'finished': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-orange-500">Criar Batalha</h3>

      <form onSubmit={handleCreate} className="bg-white border border-orange-200 rounded-2xl p-4 md:p-6 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-orange-500 focus:outline-none min-h-[44px]"
          >
            <option value="">Selecione o produto</option>
            {products.filter(p => !p.coming_soon && p.stock > 0).map((p) => (
              <option key={p.id} value={p.id}>{p.name} (R$ {p.price.toFixed(2)})</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Boosters por jogador"
            value={boostersPerPlayer}
            onChange={(e) => setBoostersPerPlayer(e.target.value)}
            required min={1}
            className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-orange-500 focus:outline-none min-h-[44px]"
          />
          <input
            type="number"
            placeholder="Num. jogadores"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            required min={2} max={8}
            className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-orange-500 focus:outline-none min-h-[44px]"
          />
        </div>
        <input
          type="text"
          placeholder="Titulo da batalha (opcional)"
          value={battleTitle}
          onChange={(e) => setBattleTitle(e.target.value)}
          className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-orange-500 focus:outline-none min-h-[44px]"
        />
        <button type="submit" className="w-full md:w-auto bg-orange-500 text-white font-bold px-8 py-3 rounded-xl hover:bg-orange-600 transition-colors min-h-[44px]">
          Criar Batalha
        </button>
      </form>

      <h3 className="text-lg font-bold text-orange-500">Batalhas</h3>

      {battles.length === 0 && <p className="text-gray-400">Nenhuma batalha criada.</p>}

      <div className="space-y-4">
        {battles.map((battle) => {
          const winner = battle.entries.find((e) => e.id === battle.winner_entry_id);
          const paidCount = battle.entries.filter((e) => e.payment_status === 'confirmed').length;
          return (
            <div key={battle.id} className="bg-white border border-orange-200 rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                {battle.product_image && (
                  <img src={battle.product_image} alt="" className="w-12 h-16 rounded-xl object-contain bg-gray-50 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-800">
                      {battle.title || battle.product_name}
                    </p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor(battle.status)}`}>
                      {statusLabel(battle.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {battle.product_name} | {battle.boosters_per_player} booster(s) | {battle.entries.length}/{battle.max_players} jogadores | R$ {(battle.product_price * battle.boosters_per_player).toFixed(2)}/jogador
                  </p>
                  {battle.entries.length > 0 && (
                    <p className="text-xs mt-1">
                      <span className={`font-bold ${paidCount === battle.entries.length ? 'text-green-600' : 'text-amber-600'}`}>
                        {paidCount}/{battle.entries.length} pagamentos confirmados
                      </span>
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap">
                  {battle.status === 'ready' && (
                    <button onClick={() => handleSetStatus(battle.id, 'live')} className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-red-600 transition-colors min-h-[44px]">
                      Iniciar Ao Vivo
                    </button>
                  )}
                  {battle.status === 'live' && (
                    <button onClick={() => handleFinish(battle.id)} className="bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-green-600 transition-colors min-h-[44px]">
                      Finalizar
                    </button>
                  )}
                  <button onClick={() => handleDelete(battle.id)} className="bg-red-100 text-red-500 text-sm font-bold px-3 py-2 rounded-xl hover:bg-red-200 transition-colors min-h-[44px]">
                    Excluir
                  </button>
                </div>
              </div>

              {/* Players */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-600">Jogadores:</p>
                {battle.entries.map((entry) => (
                  <div key={entry.id} className={`flex flex-col md:flex-row md:items-center gap-2 p-3 rounded-xl border ${winner?.id === entry.id ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {entry.avatar ? (
                        <img src={entry.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-sm font-bold shrink-0">
                          {entry.player_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {winner?.id === entry.id && <span className="text-lg">🏆</span>}
                      <span className="font-bold text-gray-800">{entry.player_name}</span>
                      {battle.creator_entry_id === entry.id && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">criador</span>
                      )}
                      {/* Payment badge */}
                      {entry.payment_status === 'confirmed' ? (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold">✓ Pago</span>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold">⏳ Pendente</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Payment actions */}
                      {battle.status !== 'finished' && (
                        entry.payment_status === 'confirmed' ? (
                          <button
                            onClick={() => handleRevokePayment(battle.id, entry.id)}
                            className="bg-amber-100 text-amber-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors min-h-[32px]"
                          >
                            Revogar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleConfirmPayment(battle.id, entry.id)}
                            className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors min-h-[32px]"
                          >
                            Confirmar Pgto
                          </button>
                        )
                      )}
                      {/* Remove player */}
                      {battle.status === 'open' && (
                        <button
                          onClick={() => handleRemovePlayer(battle.id, entry.id)}
                          className="bg-red-100 text-red-500 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors min-h-[32px]"
                        >
                          Remover
                        </button>
                      )}
                      {/* Card info / registration */}
                      {entry.best_card ? (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{entry.best_card}</span>
                          <span className="text-gray-400 mx-1">|</span>
                          <span>R$ {(entry.card_value || 0).toFixed(2)}</span>
                          {(entry.card_value_2 || 0) > 0 && (
                            <>
                              <span className="text-gray-400 mx-1">|</span>
                              <span className="text-gray-400">2a: R$ {(entry.card_value_2 || 0).toFixed(2)}</span>
                            </>
                          )}
                        </div>
                      ) : battle.status === 'live' ? (
                        <CardRegistrationForm battleId={battle.id} entryId={entry.id} onRegister={handleRegisterCard} />
                      ) : (
                        <span className="text-xs text-gray-400">Aguardando carta...</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add player */}
                {battle.status === 'open' && battle.entries.length < battle.max_players && (
                  <div className="flex gap-2 mt-2">
                    {joiningBattleId === battle.id ? (
                      <>
                        <input
                          type="text"
                          placeholder="Nome do jogador"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:border-orange-500 focus:outline-none min-h-[44px]"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleJoin(battle.id); } }}
                        />
                        <button onClick={() => handleJoin(battle.id)} className="bg-orange-500 text-white font-bold px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors min-h-[44px] text-sm">
                          Adicionar
                        </button>
                        <button onClick={() => { setJoiningBattleId(null); setPlayerName(''); }} className="bg-gray-200 text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-300 transition-colors min-h-[44px] text-sm">
                          ✕
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setJoiningBattleId(battle.id)} className="bg-orange-100 text-orange-600 font-bold px-4 py-2 rounded-xl hover:bg-orange-200 transition-colors min-h-[44px] text-sm">
                        + Adicionar Jogador
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Winner announcement */}
              {battle.status === 'finished' && winner && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 text-center">
                  <p className="text-lg font-bold text-yellow-700">🏆 Vencedor: {winner.player_name}</p>
                  <p className="text-sm text-yellow-600">{winner.best_card} — R$ {(winner.card_value || 0).toFixed(2)}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CardRegistrationForm({ battleId, entryId, onRegister }: { battleId: number; entryId: number; onRegister: (bId: number, eId: number, card: string, cardValue: number, cardValue2: number) => void }) {
  const [cardName, setCardName] = useState('');
  const [cardValue, setCardValue] = useState('');
  const [cardValue2, setCardValue2] = useState('');

  return (
    <div className="flex flex-col md:flex-row gap-2">
      <input type="text" placeholder="Nome da carta" value={cardName} onChange={(e) => setCardName(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-800 focus:border-orange-500 focus:outline-none min-h-[36px] w-full md:w-36" />
      <input type="number" placeholder="Valor R$" value={cardValue} onChange={(e) => setCardValue(e.target.value)} min={0} step="0.01" className="bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-800 focus:border-orange-500 focus:outline-none min-h-[36px] w-24" />
      <input type="number" placeholder="2a carta R$" value={cardValue2} onChange={(e) => setCardValue2(e.target.value)} min={0} step="0.01" className="bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-800 focus:border-orange-500 focus:outline-none min-h-[36px] w-24" />
      <button
        onClick={() => { if (cardName && cardValue) onRegister(battleId, entryId, cardName, parseFloat(cardValue), parseFloat(cardValue2 || '0')); }}
        className="bg-orange-500 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors text-sm min-h-[36px] whitespace-nowrap"
      >
        Registrar
      </button>
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

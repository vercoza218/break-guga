'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  toast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const toast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = nextId++;
    setMessages((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white animate-fade-slide-in ${
              msg.type === 'success'
                ? 'bg-green-500'
                : msg.type === 'error'
                  ? 'bg-red-500'
                  : 'bg-primary'
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

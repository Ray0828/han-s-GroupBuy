import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { Button } from './Button';
import { X, Save, Plus } from 'lucide-react';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  initialData?: Order | null;
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [buyerName, setBuyerName] = useState('');
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setBuyerName(initialData.buyerName);
        setItemName(initialData.itemName);
        setPrice(initialData.price.toString());
        setQuantity(initialData.quantity.toString());
        setIsPaid(initialData.isPaid);
      } else {
        // Reset only if not editing (keep previous buyer name for convenience if adding multiple items for same person could be a feature, but here we reset for simplicity)
        // Actually, keeping the buyer name is a nice UX feature for manual entry apps. Let's keep it if it's not empty, otherwise clear. 
        // For now, let's clear to avoid confusion.
        setBuyerName('');
        setItemName('');
        setPrice('');
        setQuantity('1');
        setIsPaid(false);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName || !itemName || !price || !quantity) return;

    onSubmit({
      buyerName,
      itemName,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      isPaid,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity no-print">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl transform transition-all p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? '編輯項目' : '新增項目'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名 (誰買的)</label>
            <input
              type="text"
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="例如: 徐小明"
              className="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">品項</label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="例如: 雙面膠"
              className="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">單價</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  required
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-lg border-gray-300 border p-3 pl-7 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">數量</label>
              <div className="flex items-center">
                 <button 
                  type="button"
                  onClick={() => setQuantity(Math.max(1, parseInt(quantity || '0') - 1).toString())}
                  className="w-10 h-11 bg-gray-100 rounded-l-lg border border-r-0 border-gray-300 flex items-center justify-center text-gray-600 active:bg-gray-200"
                 >-</button>
                <input
                  type="number"
                  inputMode="numeric"
                  required
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full h-11 border-y border-gray-300 text-center focus:ring-0 outline-none"
                />
                 <button 
                  type="button"
                  onClick={() => setQuantity((parseInt(quantity || '0') + 1).toString())}
                  className="w-10 h-11 bg-gray-100 rounded-r-lg border border-l-0 border-gray-300 flex items-center justify-center text-gray-600 active:bg-gray-200"
                 >+</button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 py-2">
            <input
              type="checkbox"
              id="isPaid"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500 border-gray-300"
            />
            <label htmlFor="isPaid" className="text-gray-700 font-medium">
              已經付款?
            </label>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full" size="lg" icon={initialData ? <Save size={20}/> : <Plus size={20} />}>
              {initialData ? '儲存修改' : '加入清單'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
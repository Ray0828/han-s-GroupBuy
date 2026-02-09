import React, { useState, useMemo } from 'react';
import { Plus, Trash2, ChevronRight, ArrowLeft, Printer, CheckCircle, Circle, Edit2, Users, Receipt, Search } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { GroupBuy, Order, ViewState } from './types';
import { Button } from './components/Button';
import { OrderFormModal } from './components/OrderFormModal';

function App() {
  const [groupBuys, setGroupBuys] = useLocalStorage<GroupBuy[]>('groupbuys_v1', []);
  const [view, setView] = useState<ViewState>('LIST');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Derived state
  const activeGroupBuy = useMemo(() => 
    groupBuys.find(g => g.id === activeId), 
  [groupBuys, activeId]);

  const filteredOrders = useMemo(() => {
    if (!activeGroupBuy) return [];
    if (!searchQuery) return activeGroupBuy.orders;
    const lowerQuery = searchQuery.toLowerCase();
    return activeGroupBuy.orders.filter(o => 
      o.buyerName.toLowerCase().includes(lowerQuery) || 
      o.itemName.toLowerCase().includes(lowerQuery)
    );
  }, [activeGroupBuy, searchQuery]);

  // Actions
  const handleCreateGroupBuy = () => {
    const title = prompt("請輸入團購名稱 (例如: 星期五下午茶)");
    if (!title) return;
    
    const newGroupBuy: GroupBuy = {
      id: Date.now().toString(),
      title,
      createdAt: Date.now(),
      orders: []
    };
    
    setGroupBuys([newGroupBuy, ...groupBuys]);
    setActiveId(newGroupBuy.id);
    setView('DETAIL');
  };

  const handleDeleteGroupBuy = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("確定要刪除這個團購單嗎？所有資料將會消失。")) {
      setGroupBuys(groupBuys.filter(g => g.id !== id));
      if (activeId === id) {
        setView('LIST');
        setActiveId(null);
      }
    }
  };

  const handleAddOrder = (orderData: Omit<Order, 'id' | 'createdAt'>) => {
    if (!activeId) return;
    
    setGroupBuys(prev => prev.map(g => {
      if (g.id !== activeId) return g;
      
      if (editingOrder) {
        // Edit mode
        return {
          ...g,
          orders: g.orders.map(o => o.id === editingOrder.id ? { ...o, ...orderData } : o)
        };
      } else {
        // Add mode
        const newOrder: Order = {
          ...orderData,
          id: Date.now().toString(),
          createdAt: Date.now(),
        };
        return { ...g, orders: [newOrder, ...g.orders] };
      }
    }));
    setEditingOrder(null);
  };

  const togglePaymentStatus = (orderId: string) => {
    if (!activeId) return;
    setGroupBuys(prev => prev.map(g => {
      if (g.id !== activeId) return g;
      return {
        ...g,
        orders: g.orders.map(o => o.id === orderId ? { ...o, isPaid: !o.isPaid } : o)
      };
    }));
  };

  const deleteOrder = (orderId: string) => {
    if (!activeId || !confirm("確定刪除此項目?")) return;
    setGroupBuys(prev => prev.map(g => {
      if (g.id !== activeId) return g;
      return {
        ...g,
        orders: g.orders.filter(o => o.id !== orderId)
      };
    }));
  };

  const openEditModal = (order: Order) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculations
  const calculateTotal = (orders: Order[]) => orders.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const calculateCollected = (orders: Order[]) => orders.reduce((acc, curr) => curr.isPaid ? acc + (curr.price * curr.quantity) : acc, 0);

  // -- RENDER: LIST VIEW --
  if (view === 'LIST') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto shadow-xl min-h-screen border-x border-gray-100">
        <header className="bg-primary text-white p-6 sticky top-0 z-10 shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6" />
                阿涵團購小幫手
              </h1>
            </div>
            <button 
              onClick={handleCreateGroupBuy} 
              className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
            >
              <Plus size={24} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-y-auto">
          {groupBuys.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 mt-10">
              <Receipt size={64} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">目前沒有團購單</p>
              <p className="text-sm">點擊右上角的 + 開始新的團購</p>
              <Button onClick={handleCreateGroupBuy} className="mt-6">
                建立第一張單
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {groupBuys.map(group => (
                <div 
                  key={group.id} 
                  onClick={() => { setActiveId(group.id); setView('DETAIL'); }}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center group"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800">{group.title}</h3>
                    <div className="text-gray-500 text-sm mt-1 flex gap-3">
                      <span>{new Date(group.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{group.orders.length} 筆訂單</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full text-sm">
                       ${calculateTotal(group.orders).toLocaleString()}
                    </span>
                    <button 
                      onClick={(e) => handleDeleteGroupBuy(e, group.id)}
                      className="text-gray-300 hover:text-red-500 p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                    <ChevronRight className="text-gray-300" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // -- RENDER: DETAIL VIEW --
  if (!activeGroupBuy) return null;

  const totalAmount = calculateTotal(activeGroupBuy.orders);
  const totalCollected = calculateCollected(activeGroupBuy.orders);
  const progress = totalAmount > 0 ? (totalCollected / totalAmount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Detail Header */}
      <header className="bg-white border-b sticky top-0 z-20 no-print">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setView('LIST'); setActiveId(null); setSearchQuery(''); }}
              className="text-gray-600 hover:bg-gray-100 p-2 rounded-full"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-gray-900 truncate">{activeGroupBuy.title}</h1>
              <p className="text-xs text-gray-500">
                {activeGroupBuy.orders.length} 筆項目 • 總計 <span className="font-bold text-teal-600">${totalAmount.toLocaleString()}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg flex flex-col items-center justify-center"
              title="列印表格"
            >
              <Printer size={20} />
            </button>
          </div>
        </div>

        {/* Progress Bar & Search */}
        <div className="px-4 pb-3 max-w-4xl mx-auto">
          <div className="relative pt-1 mb-3">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-200">
                  收款進度
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-teal-600">
                  {Math.round(progress)}% ({totalCollected}/{totalAmount})
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-teal-100">
              <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-teal-500 transition-all duration-500"></div>
            </div>
          </div>
          
           {/* Search Bar */}
           <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="搜尋姓名或品項..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              />
           </div>
        </div>
      </header>

      {/* Main Content (Table/List) */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 overflow-x-hidden">
        
        {/* Mobile Card View (Screen Only) */}
        <div className="space-y-3 block sm:hidden no-print pb-20">
          {filteredOrders.map(order => (
            <div key={order.id} className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${order.isPaid ? 'border-teal-500' : 'border-amber-400'} flex justify-between items-start`}>
              <div className="flex-1" onClick={() => openEditModal(order)}>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900">{order.buyerName}</h3>
                  <span className="text-gray-900 font-bold">${(order.price * order.quantity).toLocaleString()}</span>
                </div>
                <div className="text-sm text-gray-600 flex justify-between">
                  <span>{order.itemName} x{order.quantity}</span>
                  <span className="text-xs text-gray-400">@{order.price}</span>
                </div>
              </div>
              <div className="ml-4 flex flex-col gap-3 items-end">
                 <button 
                  onClick={() => togglePaymentStatus(order.id)}
                  className={`p-1 rounded-full ${order.isPaid ? 'text-teal-600 bg-teal-50' : 'text-gray-300 bg-gray-50'}`}
                 >
                   {order.isPaid ? <CheckCircle size={24} className="fill-current" /> : <Circle size={24} />}
                 </button>
                 <button onClick={() => deleteOrder(order.id)} className="text-gray-300 hover:text-red-500">
                   <Trash2 size={16} />
                 </button>
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              <p>沒有找到符合的項目</p>
            </div>
          )}
        </div>

        {/* Desktop/Print Table View */}
        <div className="hidden sm:block print:block overflow-x-auto bg-white rounded-lg shadow print:shadow-none">
          <table className="w-full text-left border-collapse print-table">
            <thead className="bg-gray-50 border-b print:bg-gray-100">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600">姓名</th>
                <th className="p-4 text-sm font-semibold text-gray-600">品項</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">單價</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-center">數量</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">總計</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-center print:w-20">付款</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-center no-print">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 group">
                  <td className="p-4 text-gray-900 font-medium">{order.buyerName}</td>
                  <td className="p-4 text-gray-600">{order.itemName}</td>
                  <td className="p-4 text-gray-600 text-right">${order.price}</td>
                  <td className="p-4 text-gray-600 text-center">{order.quantity}</td>
                  <td className="p-4 text-gray-900 font-bold text-right">${(order.price * order.quantity).toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center">
                      <button 
                        onClick={() => togglePaymentStatus(order.id)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors no-print ${order.isPaid ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'}`}
                      >
                         {order.isPaid ? '已付' : '未付'}
                      </button>
                      {/* Print only Checkbox visual */}
                      <span className="hidden print:inline-block w-4 h-4 border border-gray-400 rounded-sm">
                        {order.isPaid ? '✓' : ''}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center no-print">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(order)} className="text-blue-500 hover:bg-blue-50 p-1 rounded">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteOrder(order.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length > 0 && (
                <tr className="bg-gray-50 font-bold print:bg-gray-100 border-t-2 border-gray-200">
                   <td colSpan={3} className="p-4 text-right">總計</td>
                   <td className="p-4 text-center">{filteredOrders.reduce((acc, o) => acc + o.quantity, 0)}</td>
                   <td className="p-4 text-right">${calculateTotal(filteredOrders).toLocaleString()}</td>
                   <td colSpan={2} className="p-4"></td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
             <div className="p-8 text-center text-gray-500">
               暫無資料
             </div>
          )}
        </div>
      </main>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-6 right-6 z-30 no-print">
        <button 
          onClick={() => { setEditingOrder(null); setIsModalOpen(true); }}
          className="bg-secondary hover:bg-amber-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Modals */}
      <OrderFormModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingOrder(null); }}
        onSubmit={handleAddOrder}
        initialData={editingOrder}
      />
    </div>
  );
}

export default App;
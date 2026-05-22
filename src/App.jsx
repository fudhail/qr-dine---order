import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, ChefHat, LayoutDashboard, PackageCheck } from 'lucide-react';
import { socket } from './lib/socket';
import { C } from './constants/theme';
import { GlobalStyles } from './components/styles/GlobalStyles';
import { Card } from './components/ui/Card';

import { GuestApp } from './apps/Guest/GuestApp';
import { KitchenApp } from './apps/Kitchen/KitchenApp';
import { RunnerApp } from './apps/Runner/RunnerApp';
import { AdminApp } from './apps/Admin/AdminApp';
import { CONFIG } from './config';

export default function App() {
  const [activeInterface, setActiveInterface] = useState(null); // 'guest' | 'kitchen' | 'admin' | 'runner'
  const [socketConnected, setSocketConnected] = useState(false);
  const [isQrScanned, setIsQrScanned] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('room') || params.has('table') || params.has('guest')) {
      setActiveInterface('guest');
      setIsQrScanned(true);
    }
  }, []);

  // --- INITIAL DATA (Sree Gokulam Defaults) ---
  const initialMenu = [
    { id: 1, name: 'Continental Breakfast', desc: 'Choice of eggs, toast, juice and coffee', price: 250, category: 'Breakfast', isVeg: false, available: true, image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80' },
    { id: 2, name: 'Pancakes with Syrup', desc: 'Fluffy pancakes served with maple syrup and berries', price: 180, category: 'Breakfast', isVeg: true, available: true, image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400&q=80' },
    { id: 3, name: 'Eggs Benedict', desc: 'Poached eggs on English muffins with hollandaise', price: 320, category: 'Breakfast', isVeg: false, available: true, image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400&q=80' },
    { id: 4, name: 'Garden Salad', desc: 'Fresh seasonal greens with balsamic vinaigrette', price: 150, category: 'Starters', isVeg: true, available: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
    { id: 5, name: 'Buffalo Wings', desc: 'Spicy chicken wings with blue cheese dip', price: 280, category: 'Starters', isVeg: false, available: true, image: 'https://images.unsplash.com/photo-1524114664604-cd8133cd67ad?w=400&q=80' },
    { id: 6, name: 'Mushroom Risotto', desc: 'Creamy arborio rice with wild mushrooms', price: 380, category: 'Mains', isVeg: true, available: true, image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80' },
    { id: 7, name: 'Grilled Salmon', desc: 'Fresh salmon with asparagus and lemon butter', price: 550, category: 'Mains', isVeg: false, available: true, image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=400&q=80' },
    { id: 8, name: 'Chicken Alfredo', desc: 'Fettuccine pasta in rich creamy parmesan sauce', price: 340, category: 'Mains', isVeg: false, available: true, image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400&q=80' },
    { id: 9, name: 'New York Cheesecake', desc: 'Classic creamy cheesecake with berry compote', price: 180, category: 'Desserts', isVeg: true, available: true, image: 'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?w=400&q=80' },
    { id: 10, name: 'Chocolate Lava Cake', desc: 'Warm cake with a molten chocolate center', price: 220, category: 'Desserts', isVeg: true, available: true, image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&q=80' },
    { id: 11, name: 'Freshly Brewed Coffee', desc: 'Artisanal roasted beans', price: 80, category: 'Beverages', isVeg: true, available: true, image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&q=80' },
    { id: 12, name: 'Iced Peach Tea', desc: 'Refreshing house-made tea', price: 110, category: 'Beverages', isVeg: true, available: true, image: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&q=80' },
  ];

  const initialOrders = [
    { id: 10, token: '#10', room: '102', status: 'PREPARING', minutesAgo: 18, deliveryPreference: 'ALL_AT_ONCE', items: [{name: 'Signature Club Sandwich', qty: 1, price: 280, status: 'PENDING'}, {name: 'Fresh Orange Juice', qty: 2, price: 120, status: 'DONE'}], note: 'No onions', subtotal: 520, total: 624 },
    { id: 12, token: '#12', room: '101', status: 'NEW', minutesAgo: 3, deliveryPreference: 'AS_READY', items: [{name: 'Avocado Toast', qty: 1, price: 320, status: 'PENDING'}, {name: 'Cappuccino', qty: 2, price: 150, status: 'PENDING'}], note: '', subtotal: 620, total: 744 },
  ];

  const initialBills = [
    { room: '101', guestName: 'Alexander Knight', checkIn: '2024-05-10', checkOut: '2024-05-12', roomCharge: 4500, roomServiceCharges: [], status: 'OPEN' },
    { room: '102', guestName: 'Sarah Jenkins', checkIn: '2024-05-09', checkOut: '2024-05-11', roomCharge: 4200, roomServiceCharges: [{ orderId: 10, amount: 624, time: '11:30 AM', desc: 'Club Sandwich ×1, Orange Juice ×2' }], status: 'OPEN' },
  ];

  const [orders, setOrdersState] = useState(initialOrders);
  const [menuItems, setMenuItemsState] = useState(initialMenu);
  const [roomBills, setRoomBillsState] = useState(initialBills);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Socket connected');
      setSocketConnected(true);
    });
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
    });
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setSocketConnected(false);
    });
    socket.on('state_update', (data) => {
      if (data.orders) setOrdersState(data.orders);
      if (data.menuItems) setMenuItemsState(data.menuItems);
      if (data.roomBills) setRoomBillsState(data.roomBills);
    });
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('state_update');
    };
  }, []);

  const setOrders = (newOrders) => {
    setOrdersState(prev => {
      const updated = typeof newOrders === 'function' ? newOrders(prev) : newOrders;
      socket.emit('set_orders', updated);
      return updated;
    });
  };

  const setMenuItems = (newMenuItems) => {
    setMenuItemsState(prev => {
      const updated = typeof newMenuItems === 'function' ? newMenuItems(prev) : newMenuItems;
      socket.emit('set_menu_items', updated);
      return updated;
    });
  };

  const setRoomBills = (newRoomBills) => {
    setRoomBillsState(prev => {
      const updated = typeof newRoomBills === 'function' ? newRoomBills(prev) : newRoomBills;
      socket.emit('set_room_bills', updated);
      return updated;
    });
  };

  return (
    <>
      <GlobalStyles />
      
      <div className="animate-fade-up" style={{ minHeight: '100vh', display: activeInterface === null ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.sand, padding: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', background: C.emeraldLight, padding: 16, borderRadius: '50%', marginBottom: 16 }}>
             <UtensilsCrossed size={32} color={C.emerald} />
          </div>
          <h1 className="serif" style={{ fontSize: 32, color: C.emerald, margin: '0 0 8px 0' }}>{CONFIG.hotelName}</h1>
          <p style={{ color: C.textSub, fontSize: 15 }}>{CONFIG.welcomeTagline}</p>
          <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: C.brass, letterSpacing: 2, textTransform: 'uppercase' }}>Unified Management Platform</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 400 }}>
          {[
            { id: 'guest', icon: UtensilsCrossed, title: 'Guest App', desc: 'Browse menu, order & track', color: C.emerald },
            { id: 'kitchen', icon: ChefHat, title: 'Kitchen KDS', desc: 'Manage orders & availability', color: C.brass },
            { id: 'runner', icon: PackageCheck, title: 'Service Runner', desc: 'Room delivery tasks', color: C.info },
            { id: 'admin', icon: LayoutDashboard, title: 'Admin Panel', desc: 'Billing, POS & reports', color: C.text }
          ].map(card => (
            <Card 
              key={card.id} 
              onClick={() => setActiveInterface(card.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ background: card.color + '20', padding: 16, borderRadius: '50%' }}>
                <card.icon size={28} color={card.color} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 4px 0' }}>{card.title}</h3>
                <p style={{ fontSize: 13, color: C.textSub, margin: 0 }}>{card.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div style={{ display: activeInterface === 'guest' ? 'block' : 'none' }}>
        <GuestApp menuItems={menuItems} orders={orders} setOrders={setOrders} socketConnected={socketConnected} />
      </div>
      
      <div style={{ display: activeInterface === 'kitchen' ? 'block' : 'none' }}>
        <KitchenApp orders={orders} setOrders={setOrders} menuItems={menuItems} setMenuItems={setMenuItems} socketConnected={socketConnected} />
      </div>

      <div style={{ display: activeInterface === 'runner' ? 'block' : 'none' }}>
        <RunnerApp orders={orders} setOrders={setOrders} />
      </div>

      <div style={{ display: activeInterface === 'admin' ? 'block' : 'none' }}>
        <AdminApp orders={orders} setOrders={setOrders} menuItems={menuItems} setMenuItems={setMenuItems} roomBills={roomBills} setRoomBills={setRoomBills} socketConnected={socketConnected} />
      </div>
      
      {activeInterface !== null && !isQrScanned && (
        <button 
          onClick={() => setActiveInterface(null)}
          className="no-print animate-fade-up"
          style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: C.white, color: C.text, padding: '10px 24px', borderRadius: 999, fontWeight: 600, fontSize: 13, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8, zIndex: 9999 }}
        >
          ⌂ Switch View
        </button>
      )}
    </>
  );
}

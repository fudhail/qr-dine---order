import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, ChefHat, LayoutDashboard } from 'lucide-react';
import { socket } from './lib/socket';
import { C } from './constants/theme';
import { GlobalStyles } from './components/styles/GlobalStyles';
import { Card } from './components/ui/Card';

import { GuestApp } from './apps/Guest/GuestApp';
import { KitchenApp } from './apps/Kitchen/KitchenApp';
import { AdminApp } from './apps/Admin/AdminApp';
import { CONFIG } from './config';

const getInterfaceFromPathname = (path) => {
  if (path === '/admin') return 'admin';
  if (path === '/kitchen') return 'kitchen';
  if (path === '/guest') return 'guest';
  return null;
};

export default function App() {
  const [activeInterface, setActiveInterfaceState] = useState(() =>
    getInterfaceFromPathname(window.location.pathname)
  );
  const [socketConnected, setSocketConnected] = useState(false);

  const navigateTo = (newInterface) => {
    setActiveInterfaceState(newInterface);
    const path = newInterface ? `/${newInterface}` : '/';
    window.history.pushState(null, '', path);
  };

  // Sync state on browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setActiveInterfaceState(getInterfaceFromPathname(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auto-route to guest when URL has room param (QR code scan)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('room')) {
      setActiveInterfaceState('guest');
      if (window.location.pathname !== '/guest') {
        window.history.replaceState(null, '', '/guest' + window.location.search);
      }
    } else {
      const current = getInterfaceFromPathname(window.location.pathname);
      if (current) setActiveInterfaceState(current);
    }
  }, []);

  const [orders, setOrdersState] = useState([]);
  const [menuItems, setMenuItemsState] = useState([]);
  const [roomBills, setRoomBillsState] = useState([]);

  // Socket listeners
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

      {/* Home — Interface Selector */}
      <div
        className="animate-fade-up"
        style={{
          minHeight: '100vh',
          display: activeInterface === null ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: C.sand,
          padding: 20
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', background: C.emeraldLight, padding: 16, borderRadius: '50%', marginBottom: 16 }}>
            <UtensilsCrossed size={32} color={C.emerald} />
          </div>
          <h1 className="serif" style={{ fontSize: 30, color: C.emerald, margin: '0 0 6px 0' }}>
            {CONFIG.hotelName}
          </h1>
          <p style={{ color: C.textSub, fontSize: 14 }}>{CONFIG.address}</p>
          <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: C.brass, letterSpacing: 2, textTransform: 'uppercase' }}>
            Room Service Management System
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 380 }}>
          {[
            { id: 'guest', icon: UtensilsCrossed, title: 'Guest Menu', desc: 'Browse menu, order & track delivery', color: C.emerald },
            { id: 'kitchen', icon: ChefHat, title: 'Kitchen KDS', desc: 'Manage incoming orders & availability', color: C.brass },
            { id: 'admin', icon: LayoutDashboard, title: 'Admin Console', desc: 'Billing, menu editor & reports', color: C.text },
          ].map(card => (
            <Card
              key={card.id}
              onClick={() => navigateTo(card.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', padding: '14px 20px' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ background: card.color + '20', padding: 12, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon size={24} color={card.color} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 2px 0' }}>{card.title}</h3>
                <p style={{ fontSize: 12, color: C.textSub, margin: 0 }}>{card.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Guest App */}
      <div style={{ display: activeInterface === 'guest' ? 'block' : 'none' }}>
        <GuestApp
          menuItems={menuItems}
          orders={orders}
          setOrders={setOrders}
          socketConnected={socketConnected}
          config={CONFIG}
        />
      </div>

      {/* Kitchen KDS */}
      <div style={{ display: activeInterface === 'kitchen' ? 'block' : 'none' }}>
        <KitchenApp
          orders={orders}
          setOrders={setOrders}
          menuItems={menuItems}
          setMenuItems={setMenuItems}
          socketConnected={socketConnected}
          config={CONFIG}
        />
      </div>

      {/* Admin Console */}
      <div style={{ display: activeInterface === 'admin' ? 'block' : 'none' }}>
        <AdminApp
          orders={orders}
          setOrders={setOrders}
          menuItems={menuItems}
          setMenuItems={setMenuItems}
          roomBills={roomBills}
          setRoomBills={setRoomBills}
          socketConnected={socketConnected}
          config={CONFIG}
        />
      </div>

      {/* Staff navigation back button */}
      {activeInterface !== null && (
        <button
          onClick={() => navigateTo(null)}
          className="no-print animate-fade-up"
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: C.white, color: C.text, padding: '10px 24px', borderRadius: 999,
            fontWeight: 600, fontSize: 13, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'center', gap: 8, zIndex: 9999
          }}
        >
          ⌂ Switch View
        </button>
      )}
    </>
  );
}

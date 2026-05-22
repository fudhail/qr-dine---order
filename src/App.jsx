import React, { useState, useEffect, useMemo } from 'react';
import { UtensilsCrossed, ChefHat, LayoutDashboard, PackageCheck, Shield } from 'lucide-react';
import { socket } from './lib/socket';
import { C } from './constants/theme';
import { GlobalStyles } from './components/styles/GlobalStyles';
import { Card } from './components/ui/Card';

import { GuestApp } from './apps/Guest/GuestApp';
import { KitchenApp } from './apps/Kitchen/KitchenApp';
import { RunnerApp } from './apps/Runner/RunnerApp';
import { AdminApp } from './apps/Admin/AdminApp';
import { SuperadminApp } from './apps/Superadmin/SuperadminApp';
import { CONFIG } from './config';

const getInterfaceFromPathname = (path) => {
  if (path === '/admin') return 'admin';
  if (path === '/kitchen') return 'kitchen';
  if (path === '/runner') return 'runner';
  if (path === '/guest') return 'guest';
  if (path === '/superadmin') return 'superadmin';
  return null;
};

export default function App() {
  const [activeInterface, setActiveInterfaceState] = useState(() => {
    return getInterfaceFromPathname(window.location.pathname);
  });
  const [socketConnected, setSocketConnected] = useState(false);
  const [isQrScanned, setIsQrScanned] = useState(false);

  // Multi-tenant States
  const getTenantIdFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tenant') || 'grand-vista';
  };

  const [tenantId, setTenantId] = useState(getTenantIdFromUrl);
  const [tenants, setTenants] = useState([]);

  // Custom navigate function using HTML5 History API, keeping tenant param intact
  const navigateTo = (newInterface, explicitTenantId = null) => {
    setActiveInterfaceState(newInterface);
    const path = newInterface ? `/${newInterface}` : '/';
    const params = new URLSearchParams(window.location.search);
    
    const targetTenant = explicitTenantId || tenantId;
    if (targetTenant) {
      params.set('tenant', targetTenant);
    }
    
    if (explicitTenantId) {
      setTenantId(explicitTenantId);
    }

    const search = params.toString() ? `?${params.toString()}` : '';
    window.history.pushState(null, '', path + search);
  };

  // Sync state on browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setActiveInterfaceState(getInterfaceFromPathname(window.location.pathname));
      const params = new URLSearchParams(window.location.search);
      setTenantId(params.get('tenant') || 'grand-vista');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Parse location and tenant params from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasParams = params.has('room') || params.has('table') || params.has('guest');
    const urlTenant = params.get('tenant') || 'grand-vista';
    setTenantId(urlTenant);
    
    if (hasParams) {
      setActiveInterfaceState('guest');
      setIsQrScanned(true);
      if (window.location.pathname !== '/guest') {
        window.history.replaceState(null, '', '/guest' + window.location.search);
      }
    } else {
      const currentInterface = getInterfaceFromPathname(window.location.pathname);
      if (currentInterface) {
        setActiveInterfaceState(currentInterface);
      }
    }
  }, []);

  const [orders, setOrdersState] = useState([]);
  const [menuItems, setMenuItemsState] = useState([]);
  const [roomBills, setRoomBillsState] = useState([]);

  // Listen for socket events
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
    socket.on('tenants_update', (updatedTenants) => {
      setTenants(updatedTenants);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('state_update');
      socket.off('tenants_update');
    };
  }, []);

  // Join isolated tenant room upon connection or tenantId change
  useEffect(() => {
    if (socketConnected) {
      console.log('Emitting join_tenant:', tenantId);
      socket.emit('join_tenant', { tenantId });
      socket.emit('get_tenants');
    }
  }, [tenantId, socketConnected]);

  // Compute active tenant config from list, fallback to static CONFIG
  const activeTenantConfig = useMemo(() => {
    const found = tenants.find(t => t.id === tenantId);
    if (found) {
      return {
        hotelName: found.name,
        shortName: found.shortName,
        address: found.address,
        welcomeTagline: found.welcomeTagline,
        deploymentMode: found.deploymentMode,
        defaultRoom: found.defaultRoom,
        defaultTable: found.defaultTable,
        status: found.status
      };
    }
    return CONFIG;
  }, [tenants, tenantId]);

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
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', background: C.emeraldLight, padding: 16, borderRadius: '50%', marginBottom: 16 }}>
             <UtensilsCrossed size={32} color={C.emerald} />
          </div>
          <h1 className="serif" style={{ fontSize: 32, color: C.emerald, margin: '0 0 8px 0' }}>{activeTenantConfig.hotelName}</h1>
          <p style={{ color: C.textSub, fontSize: 15 }}>{activeTenantConfig.welcomeTagline}</p>
          <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: C.brass, letterSpacing: 2, textTransform: 'uppercase' }}>Unified Management Platform</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 400 }}>
          {[
            { id: 'guest', icon: UtensilsCrossed, title: 'Guest App', desc: 'Browse menu, order & track', color: C.emerald },
            { id: 'kitchen', icon: ChefHat, title: 'Kitchen KDS', desc: 'Manage orders & availability', color: C.brass },
            { id: 'runner', icon: PackageCheck, title: 'Service Runner', desc: 'Room delivery tasks', color: C.info },
            { id: 'admin', icon: LayoutDashboard, title: 'Admin Panel', desc: 'Billing, POS & reports', color: C.text },
            { id: 'superadmin', icon: Shield, title: 'Superadmin Portal', desc: 'Manage SaaS hotels & tenants', color: C.textSub }
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

      <div style={{ display: activeInterface === 'guest' ? 'block' : 'none' }}>
        <GuestApp menuItems={menuItems} orders={orders} setOrders={setOrders} socketConnected={socketConnected} config={activeTenantConfig} />
      </div>
      
      <div style={{ display: activeInterface === 'kitchen' ? 'block' : 'none' }}>
        <KitchenApp orders={orders} setOrders={setOrders} menuItems={menuItems} setMenuItems={setMenuItems} socketConnected={socketConnected} config={activeTenantConfig} />
      </div>

      <div style={{ display: activeInterface === 'runner' ? 'block' : 'none' }}>
        <RunnerApp orders={orders} setOrders={setOrders} />
      </div>

      <div style={{ display: activeInterface === 'admin' ? 'block' : 'none' }}>
        <AdminApp orders={orders} setOrders={setOrders} menuItems={menuItems} setMenuItems={setMenuItems} roomBills={roomBills} setRoomBills={setRoomBills} socketConnected={socketConnected} config={activeTenantConfig} />
      </div>

      <div style={{ display: activeInterface === 'superadmin' ? 'block' : 'none' }}>
        <SuperadminApp tenants={tenants} socket={socket} navigateTo={navigateTo} socketConnected={socketConnected} />
      </div>
      
      {activeInterface !== null && !isQrScanned && (
        <button 
          onClick={() => navigateTo(null)}
          className="no-print animate-fade-up"
          style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: C.white, color: C.text, padding: '10px 24px', borderRadius: 999, fontWeight: 600, fontSize: 13, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8, zIndex: 9999 }}
        >
          ⌂ Switch View
        </button>
      )}
    </>
  );
}

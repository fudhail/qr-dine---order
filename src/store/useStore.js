import { create } from 'zustand';
import { socket } from '../lib/socket';

const syncWithServer = async (endpoint, payload) => {
  const token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('kitchenToken');
  if (!token) return;
  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Failed to sync state:', err);
  }
};

export const useStore = create((set, get) => ({
  // State
  socketConnected: false,
  orders: [],
  menuItems: [],
  roomBills: [],
  config: { cgst: 2.5, sgst: 2.5, serviceCharge: 10, adminPin: '', kitchenPin: '' },
  adminAuth: sessionStorage.getItem('adminAuth') === 'true',
  kitchenAuth: sessionStorage.getItem('kitchenAuth') === 'true',

  // Setters (Client-side optimistic + Server sync)
  setOrders: (newOrders) => {
    const orders = typeof newOrders === 'function' ? newOrders(get().orders) : newOrders;
    set({ orders });
    syncWithServer('/api/admin/orders', orders);
  },
  setMenuItems: (newMenuItems) => {
    const menuItems = typeof newMenuItems === 'function' ? newMenuItems(get().menuItems) : newMenuItems;
    set({ menuItems });
    syncWithServer('/api/admin/menu_items', menuItems);
  },
  setRoomBills: (newRoomBills) => {
    const roomBills = typeof newRoomBills === 'function' ? newRoomBills(get().roomBills) : newRoomBills;
    set({ roomBills });
    syncWithServer('/api/admin/room_bills', roomBills);
  },
  setConfig: (newConfig) => {
    const config = typeof newConfig === 'function' ? newConfig(get().config) : newConfig;
    set({ config });
    syncWithServer('/api/admin/config', config);
  },
  
  login: async (role, pin) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, pin })
      });
      const data = await res.json();
      if (data.success) {
        if (role === 'admin') {
          sessionStorage.setItem('adminAuth', 'true');
          sessionStorage.setItem('adminToken', data.token);
          set({ adminAuth: true });
          socket.emit('join_admin', { token: data.token });
        } else {
          sessionStorage.setItem('kitchenAuth', 'true');
          sessionStorage.setItem('kitchenToken', data.token);
          set({ kitchenAuth: true });
          socket.emit('join_admin', { token: data.token });
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
  
  logout: (role) => {
    if (role === 'admin') {
      sessionStorage.removeItem('adminAuth');
      sessionStorage.removeItem('adminToken');
      set({ adminAuth: false });
    } else {
      sessionStorage.removeItem('kitchenAuth');
      sessionStorage.removeItem('kitchenToken');
      set({ kitchenAuth: false });
    }
  },

  // Socket init function
  initSocket: () => {
    socket.on('connect', () => {
      console.log('Socket connected');
      set({ socketConnected: true });
      
      const token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('kitchenToken');
      if (token) {
        socket.emit('join_admin', { token });
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      set({ socketConnected: false });
    });
    
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      set({ socketConnected: false });
    });
    
    const handleStateUpdate = (data) => {
      set((state) => ({
        orders: data.orders || state.orders,
        menuItems: data.menuItems || state.menuItems,
        roomBills: data.roomBills || state.roomBills,
        config: data.config || state.config
      }));
    };
    
    socket.on('guest_state_update', handleStateUpdate);
    socket.on('admin_state_update', handleStateUpdate);
    
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('guest_state_update', handleStateUpdate);
      socket.off('admin_state_update', handleStateUpdate);
    };
  }
}));

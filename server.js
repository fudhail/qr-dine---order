import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow any local IP to connect
    methods: ["GET", "POST"]
  }
});

const TENANTS_FILE = path.join(process.cwd(), 'tenants.json');

const DEFAULT_TENANTS = [
  {
    id: 'grand-vista',
    name: 'Grand Vista Hotel',
    shortName: 'Grand Vista',
    address: '123 Luxury Ave · Downtown City',
    welcomeTagline: 'Premium Hospitality & Services',
    deploymentMode: 'AUTO',
    defaultRoom: '108',
    defaultTable: '12',
    status: 'Active'
  },
  {
    id: 'sree-gokulam',
    name: 'Sree Gokulam Residency',
    shortName: 'Sree Gokulam',
    address: '456 Royal Lane · City Center',
    welcomeTagline: 'Luxury Meets Comfort',
    deploymentMode: 'ROOM_SERVICE',
    defaultRoom: '202',
    defaultTable: '5',
    status: 'Active'
  }
];

// Load tenants from file or seed
let tenants = [];
try {
  if (fs.existsSync(TENANTS_FILE)) {
    tenants = JSON.parse(fs.readFileSync(TENANTS_FILE, 'utf-8'));
  } else {
    tenants = DEFAULT_TENANTS;
    fs.writeFileSync(TENANTS_FILE, JSON.stringify(tenants, null, 2), 'utf-8');
  }
} catch (err) {
  console.error('Error loading tenants, falling back to defaults:', err);
  tenants = DEFAULT_TENANTS;
}

// Initial state templates for newly created tenants
const initialOrders = [
  { id: 10, token: '#10', room: '102', status: 'PREPARING', minutesAgo: 18, deliveryPreference: 'ALL_AT_ONCE', items: [{name: 'Signature Club Sandwich', qty: 1, price: 280, status: 'PENDING'}, {name: 'Fresh Orange Juice', qty: 2, price: 120, status: 'DONE'}], note: 'No onions', subtotal: 520, total: 624 },
  { id: 12, token: '#12', room: '101', status: 'NEW', minutesAgo: 3, deliveryPreference: 'AS_READY', items: [{name: 'Avocado Toast', qty: 1, price: 320, status: 'PENDING'}, {name: 'Cappuccino', qty: 2, price: 150, status: 'PENDING'}], note: '', subtotal: 620, total: 744 },
];

const initialMenuItems = [
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

const initialRoomBills = [
  { room: '101', guestName: 'Alexander Knight', checkIn: '2024-05-10', checkOut: '2024-05-12', roomCharge: 4500, roomServiceCharges: [], status: 'OPEN' },
  { room: '102', guestName: 'Sarah Jenkins', checkIn: '2024-05-09', checkOut: '2024-05-11', roomCharge: 4200, roomServiceCharges: [{ orderId: 10, amount: 624, time: '11:30 AM', desc: 'Club Sandwich ×1, Orange Juice ×2' }], status: 'OPEN' },
];

// Multi-tenant in-memory states mapping tenantId -> state
const tenantStates = {};

const getTenantState = (tenantId) => {
  if (!tenantStates[tenantId]) {
    tenantStates[tenantId] = {
      orders: JSON.parse(JSON.stringify(initialOrders)),
      menuItems: JSON.parse(JSON.stringify(initialMenuItems)),
      roomBills: JSON.parse(JSON.stringify(initialRoomBills))
    };
  }
  return tenantStates[tenantId];
};

const broadcastTenantState = (tenantId) => {
  const state = getTenantState(tenantId);
  io.to(tenantId).emit('state_update', {
    orders: state.orders,
    menuItems: state.menuItems,
    roomBills: state.roomBills
  });
};

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join isolated tenant room
  socket.on('join_tenant', ({ tenantId }) => {
    const resolvedTenant = tenantId || 'grand-vista';
    console.log(`Socket ${socket.id} joining tenant room: ${resolvedTenant}`);
    
    // Leave previous room if any
    if (socket.activeTenantId) {
      socket.leave(socket.activeTenantId);
    }
    
    socket.activeTenantId = resolvedTenant;
    socket.join(resolvedTenant);

    // Send the specific tenant state
    const state = getTenantState(resolvedTenant);
    socket.emit('state_update', {
      orders: state.orders,
      menuItems: state.menuItems,
      roomBills: state.roomBills
    });
  });

  socket.on('set_orders', (newOrders) => {
    const tenantId = socket.activeTenantId || 'grand-vista';
    const state = getTenantState(tenantId);
    state.orders = newOrders;
    broadcastTenantState(tenantId);
  });

  socket.on('set_menu_items', (newMenuItems) => {
    const tenantId = socket.activeTenantId || 'grand-vista';
    const state = getTenantState(tenantId);
    state.menuItems = newMenuItems;
    broadcastTenantState(tenantId);
  });

  socket.on('set_room_bills', (newRoomBills) => {
    const tenantId = socket.activeTenantId || 'grand-vista';
    const state = getTenantState(tenantId);
    state.roomBills = newRoomBills;
    broadcastTenantState(tenantId);
  });

  // --- SUPERADMIN PORTAL COMMANDS ---
  socket.on('get_tenants', () => {
    socket.emit('tenants_update', tenants);
  });

  socket.on('save_tenant', (tenantConfig) => {
    if (!tenantConfig.id) return;
    const index = tenants.findIndex(t => t.id === tenantConfig.id);
    if (index >= 0) {
      tenants[index] = { ...tenants[index], ...tenantConfig };
    } else {
      tenants.push({ ...tenantConfig, status: tenantConfig.status || 'Active' });
      // Trigger data initialization for the new tenant
      getTenantState(tenantConfig.id);
    }
    
    // Save to disk
    try {
      fs.writeFileSync(TENANTS_FILE, JSON.stringify(tenants, null, 2), 'utf-8');
      console.log(`Tenant ${tenantConfig.id} saved successfully.`);
    } catch (e) {
      console.error('Error writing tenants.json:', e);
    }
    
    // Broadcast updated tenant list to all Superadmin instances
    io.emit('tenants_update', tenants);
  });

  socket.on('delete_tenant', ({ tenantId }) => {
    if (!tenantId || tenantId === 'grand-vista') return; // Protect default tenant from deletion
    tenants = tenants.filter(t => t.id !== tenantId);
    delete tenantStates[tenantId];

    try {
      fs.writeFileSync(TENANTS_FILE, JSON.stringify(tenants, null, 2), 'utf-8');
      console.log(`Tenant ${tenantId} deleted successfully.`);
    } catch (e) {
      console.error('Error writing tenants.json:', e);
    }

    io.emit('tenants_update', tenants);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = 3000;
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please kill the other process or use a different port.`);
  } else {
    console.error('Server error:', e);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Backend Socket.io server is live with multi-tenancy!`);
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🏠 Network: http://0.0.0.0:${PORT}\n`);
});

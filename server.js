import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow any local IP to connect
    methods: ["GET", "POST"]
  }
});

let orders = [
  { id: 10, token: '#10', room: '102', status: 'PREPARING', minutesAgo: 18, items: [{name: 'Signature Club Sandwich', qty: 1, price: 280}, {name: 'Fresh Orange Juice', qty: 2, price: 120}], note: 'No onions', subtotal: 520, total: 624 },
  { id: 12, token: '#12', room: '101', status: 'NEW', minutesAgo: 3, items: [{name: 'Avocado Toast', qty: 1, price: 320}, {name: 'Cappuccino', qty: 2, price: 150}], note: '', subtotal: 620, total: 744 },
];

let menuItems = [
  { id: 1, name: 'Continental Breakfast', desc: 'Choice of eggs, toast, juice and coffee', price: 250, category: 'Breakfast', isVeg: false, available: true },
  { id: 2, name: 'Pancakes with Syrup', desc: 'Fluffy pancakes served with maple syrup and berries', price: 180, category: 'Breakfast', isVeg: true, available: true },
  { id: 3, name: 'Eggs Benedict', desc: 'Poached eggs on English muffins with hollandaise', price: 320, category: 'Breakfast', isVeg: false, available: true },
  { id: 4, name: 'Garden Salad', desc: 'Fresh seasonal greens with balsamic vinaigrette', price: 150, category: 'Starters', isVeg: true, available: true },
  { id: 5, name: 'Buffalo Wings', desc: 'Spicy chicken wings with blue cheese dip', price: 280, category: 'Starters', isVeg: false, available: true },
  { id: 6, name: 'Mushroom Risotto', desc: 'Creamy arborio rice with wild mushrooms', price: 380, category: 'Mains', isVeg: true, available: true },
  { id: 7, name: 'Grilled Salmon', desc: 'Fresh salmon with asparagus and lemon butter', price: 550, category: 'Mains', isVeg: false, available: true },
  { id: 8, name: 'Chicken Alfredo', desc: 'Fettuccine pasta in rich creamy parmesan sauce', price: 340, category: 'Mains', isVeg: false, available: true },
  { id: 9, name: 'New York Cheesecake', desc: 'Classic creamy cheesecake with berry compote', price: 180, category: 'Desserts', isVeg: true, available: true },
  { id: 10, name: 'Chocolate Lava Cake', desc: 'Warm cake with a molten chocolate center', price: 220, category: 'Desserts', isVeg: true, available: true },
  { id: 11, name: 'Freshly Brewed Coffee', desc: 'Artisanal roasted beans', price: 80, category: 'Beverages', isVeg: true, available: true },
  { id: 12, name: 'Iced Peach Tea', desc: 'Refreshing house-made tea', price: 110, category: 'Beverages', isVeg: true, available: true },
];

let roomBills = [
  { room: '101', guestName: 'Alexander Knight', checkIn: '2024-05-10', checkOut: '2024-05-12', roomCharge: 4500, roomServiceCharges: [], status: 'OPEN' },
  { room: '102', guestName: 'Sarah Jenkins', checkIn: '2024-05-09', checkOut: '2024-05-11', roomCharge: 4200, roomServiceCharges: [{ orderId: 10, amount: 624, time: '11:30 AM', desc: 'Club Sandwich ×1, Orange Juice ×2' }], status: 'OPEN' },
];

const broadcastState = () => {
  io.emit('state_update', { orders, menuItems, roomBills });
};

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Send initial state to the newly connected client
  socket.emit('state_update', { orders, menuItems, roomBills });

  socket.on('set_orders', (newOrders) => {
    orders = newOrders;
    broadcastState();
  });

  socket.on('set_menu_items', (newMenuItems) => {
    menuItems = newMenuItems;
    broadcastState();
  });

  socket.on('set_room_bills', (newRoomBills) => {
    roomBills = newRoomBills;
    broadcastState();
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
  console.log(`\n🚀 Backend Socket.io server is live!`);
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🏠 Network: http://0.0.0.0:${PORT}\n`);
});

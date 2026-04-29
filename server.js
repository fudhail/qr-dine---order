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
  { id: 10, token: '#10', room: '203', status: 'PREPARING', minutesAgo: 18, items: [{name: 'Chicken Biriyani', qty: 1, price: 320}, {name: 'Filter Coffee', qty: 2, price: 50}], note: 'Less spice please', subtotal: 420, total: 504 },
  { id: 11, token: '#11', room: '315', status: 'PREPARING', minutesAgo: 11, items: [{name: 'Kerala Fish Curry & Rice', qty: 1, price: 280}], note: '', subtotal: 280, total: 336 },
  { id: 12, token: '#12', room: '108', status: 'NEW', minutesAgo: 3, items: [{name: 'Chicken Biriyani', qty: 1, price: 320}, {name: 'Pazham Pori', qty: 2, price: 60}, {name: 'Fresh Lime Soda', qty: 1, price: 80}], note: 'No onion in biriyani', subtotal: 520, total: 624 },
  { id: 13, token: '#13', room: '402', status: 'ON_THE_WAY', minutesAgo: 6, items: [{name: 'Veg Thali', qty: 2, price: 180}, {name: 'Ada Pradhaman', qty: 2, price: 120}], note: '', subtotal: 600, total: 720 },
  { id: 14, token: '#14', room: '210', status: 'DELIVERED', minutesAgo: 42, items: [{name: 'Beef Fry & Porotta', qty: 1, price: 260}, {name: 'Kingfisher Beer', qty: 2, price: 220}], note: '', subtotal: 700, total: 840 },
];

let menuItems = [
  { id: 1, name: 'Kerala Parotta & Egg Curry', desc: 'Flaky layered parotta with spiced egg curry', price: 160, category: 'Breakfast', isVeg: false, available: true },
  { id: 2, name: 'Idiyappam with Coconut Milk', desc: 'Soft string hoppers with sweet coconut milk', price: 120, category: 'Breakfast', isVeg: true, available: true },
  { id: 3, name: 'Puttu & Kadala Curry', desc: 'Steamed rice cake with black chickpea curry', price: 110, category: 'Breakfast', isVeg: true, available: true },
  { id: 7, name: 'Kerala Fish Curry & Rice', desc: 'Kudampuli-based fish curry with steamed rice', price: 280, category: 'Mains', isVeg: false, available: true },
  { id: 8, name: 'Chicken Biriyani (Thalassery)', desc: 'Fragrant Kaima rice with tender chicken', price: 320, category: 'Mains', isVeg: false, available: true },
  { id: 9, name: 'Beef Fry & Porotta', desc: 'Spiced Kerala beef fry with layered porotta', price: 260, category: 'Mains', isVeg: false, available: true },
  { id: 12, name: 'Veg Thali', desc: 'Rice dal sabzi papad pickle and payasam', price: 180, category: 'Mains', isVeg: true, available: true },
  { id: 14, name: 'Pazham Pori', desc: 'Ripe banana in batter golden fried', price: 60, category: 'Snacks', isVeg: true, available: true },
  { id: 19, name: 'Ada Pradhaman', desc: 'Traditional Kerala rice flakes payasam', price: 120, category: 'Desserts', isVeg: true, available: true },
  { id: 24, name: 'Filter Coffee', desc: 'South Indian drip coffee with full cream milk', price: 50, category: 'Beverages', isVeg: true, available: true },
  { id: 27, name: 'Fresh Lime Soda', desc: 'Sweet or salted your choice', price: 80, category: 'Beverages', isVeg: true, available: true },
  { id: 29, name: 'Kingfisher Beer 330ml', desc: 'Chilled lager', price: 220, category: 'Spirits', isVeg: true, available: true },
];

let roomBills = [
  { room: '108', guestName: 'Rahul Menon', checkIn: '2024-01-15', checkOut: '2024-01-17', roomCharge: 3200, roomServiceCharges: [], status: 'OPEN' },
  { room: '203', guestName: 'Priya Nair', checkIn: '2024-01-15', checkOut: '2024-01-18', roomCharge: 2800, roomServiceCharges: [{ orderId: 10, amount: 504, time: '09:30 AM', desc: 'Chicken Biriyani ×1, Filter Coffee ×2' }], status: 'OPEN' },
  { room: '210', guestName: 'Arun Kumar', checkIn: '2024-01-14', checkOut: '2024-01-16', roomCharge: 2800, roomServiceCharges: [{ orderId: 14, amount: 840, time: '10:10 AM', desc: 'Beef Fry & Porotta ×1, Kingfisher Beer ×2' }], status: 'OPEN' },
  { room: '315', guestName: 'Sunitha Varma', checkIn: '2024-01-15', checkOut: '2024-01-17', roomCharge: 3200, roomServiceCharges: [], status: 'OPEN' },
  { room: '402', guestName: 'Mohammed Rafi', checkIn: '2024-01-13', checkOut: '2024-01-16', roomCharge: 3600, roomServiceCharges: [], status: 'OPEN' },
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
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend Socket.io server running on port ${PORT}`);
});

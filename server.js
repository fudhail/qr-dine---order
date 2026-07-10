import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import { rateLimit } from 'express-rate-limit';
import { initDB, getFullState } from './db.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'));
  }
});

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const QR_SECRET = 'elite-hotel-thrissur-2026-secret';
const activeSessions = new Map();

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // limit each IP to 15 login requests per windowMs
  message: { error: 'Too many login attempts, please try again later' }
});

// Helper to calculate minutesAgo for frontend compatibility
const injectMinutesAgo = (orders) => {
  const now = Date.now();
  return orders.map(o => ({
    ...o,
    minutesAgo: Math.floor((now - o.createdAt) / 60000)
  }));
};

let db;

const getSanitizedState = (state) => ({
  menuItems: state.menuItems,
  orders: state.orders, // Kept to allow live order tracking
  config: { 
    cgst: state.config.cgst, 
    sgst: state.config.sgst, 
    serviceCharge: state.config.serviceCharge 
  }
});

// ─── Socket.io Events ─────────────────────────────────────────────────────────

const broadcastState = async () => {
  if (!db) return;
  const state = await getFullState(db);
  state.orders = injectMinutesAgo(state.orders);
  
  io.emit('guest_state_update', getSanitizedState(state));
  io.to('admin_room').emit('admin_state_update', state);
};

io.on('connection', async (socket) => {
  console.log(`Client connected: ${socket.id}`);

  if (db) {
    const state = await getFullState(db);
    state.orders = injectMinutesAgo(state.orders);
    socket.emit('guest_state_update', getSanitizedState(state));
  }

  socket.on('join_admin', async ({ token }) => {
    const adminSig = crypto.createHmac('sha256', QR_SECRET).update('admin').digest('hex');
    const kitchenSig = crypto.createHmac('sha256', QR_SECRET).update('kitchen').digest('hex');
    if (token === adminSig || token === kitchenSig) {
      socket.join('admin_room');
      const state = await getFullState(db);
      state.orders = injectMinutesAgo(state.orders);
      socket.emit('admin_state_update', state);
    }
  });

  // Authenticated guest order placement
  socket.on('place_order', async ({ order, sessionId }) => {
    const session = activeSessions.get(sessionId);
    if (!session) {
      socket.emit('order_rejected', { reason: 'Your session has expired. Please scan your room QR code again.' });
      return;
    }
    if (String(order.room) !== String(session.room)) {
      socket.emit('order_rejected', { reason: 'Room mismatch. Please contact reception.' });
      return;
    }
    
    const roomBill = await db.get('SELECT * FROM room_bills WHERE room = ?', [session.room]);
    if (!roomBill || roomBill.status !== 'OPEN') {
      socket.emit('order_rejected', { reason: 'Room service is not active for this room right now.' });
      return;
    }
    if (roomBill.billId !== session.billId) {
      socket.emit('order_rejected', { reason: 'Your stay has concluded. Room service is no longer available.' });
      activeSessions.delete(sessionId);
      return;
    }

    session.lastActivity = Date.now();
    
    const createdAt = Date.now();
    const token = `#${Math.floor(Math.random() * 90) + 10}`; // simple token gen
    
    await db.run(
      `INSERT INTO orders (token, room, status, createdAt, deliveryPreference, items, note, subtotal, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [token, order.room, 'NEW', createdAt, order.deliveryPreference, JSON.stringify(order.items), order.note, order.subtotal, order.total]
    );

    await broadcastState();
    // Assuming the frontend wants to know it succeeded, though in GuestApp I'll handle tracking via broadcast
    socket.emit('order_accepted', { orderId: order.id });
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ─── Token Helpers & REST API ────────────────────────────────────────────────

const generateRoomToken = (room) => {
  const payload = Buffer.from(String(room)).toString('base64url');
  const sig = crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex');
  return payload + '.' + sig;
};

const validateToken = (token) => {
  try {
    const dotIdx = token.lastIndexOf('.');
    if (dotIdx < 0) return null;
    const payloadB64 = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);
    const room = Buffer.from(payloadB64, 'base64url').toString('utf8').trim();
    if (!room) return null;
    const expectedSig = crypto.createHmac('sha256', QR_SECRET).update(payloadB64).digest('hex');
    if (sig.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) return null;
    return { room };
  } catch { return null; }
};

const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const expectedSig = crypto.createHmac('sha256', QR_SECRET).update('admin').digest('hex');
  if (token !== expectedSig) return res.status(403).json({ error: 'Forbidden' });
  next();
};

const authenticateStaff = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const adminSig = crypto.createHmac('sha256', QR_SECRET).update('admin').digest('hex');
  const kitchenSig = crypto.createHmac('sha256', QR_SECRET).update('kitchen').digest('hex');
  if (token !== adminSig && token !== kitchenSig) return res.status(403).json({ error: 'Forbidden' });
  next();
};

app.post('/api/validate-token', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });

  const result = validateToken(token);
  if (!result) {
    return res.status(401).json({ error: 'Invalid QR code. Please scan the QR code placed in your room.' });
  }

  const roomBill = await db.get('SELECT * FROM room_bills WHERE room = ?', [result.room]);
  if (!roomBill || roomBill.status !== 'OPEN') {
    return res.status(403).json({ error: 'Room service is not active for this room. Please contact reception.' });
  }
  
  const sessionId = crypto.randomBytes(32).toString('hex');
  activeSessions.set(sessionId, { 
    room: String(result.room), 
    billId: roomBill.billId,
    lastActivity: Date.now() 
  });

  console.log(`QR validated for Room ${result.room} [Bill: ${roomBill.billId}] | Session: ${sessionId.slice(0, 8)}...`);
  res.json({ sessionId, room: result.room });
});

app.post('/api/login', loginLimiter, async (req, res) => {
  const { role, pin } = req.body;
  const config = (await db.all('SELECT * FROM config'))[0];
  
  if (role === 'admin' && pin === config.adminPin) {
    const adminToken = crypto.createHmac('sha256', QR_SECRET).update('admin').digest('hex');
    return res.json({ success: true, token: adminToken });
  }
  if (role === 'kitchen' && pin === config.kitchenPin) {
    const kitchenToken = crypto.createHmac('sha256', QR_SECRET).update('kitchen').digest('hex');
    return res.json({ success: true, token: kitchenToken });
  }
  
  res.status(401).json({ error: 'Invalid PIN' });
});

app.post('/api/upload', authenticateAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });
});

app.get('/api/admin/setup-qr', async (req, res) => {
  const host = req.headers.host?.replace(':3000', ':5173') || 'localhost:5173';
  const bills = await db.all('SELECT room FROM room_bills');
  const qrCodes = bills.map(bill => {
    const token = generateRoomToken(bill.room);
    return { room: bill.room, qrUrl: `http://${host}/guest?t=${token}` };
  });
  const html = `<!DOCTYPE html><html><head>
    <title>Hotel Elite International — Room QR Setup</title>
    <style>
      body{font-family:sans-serif;padding:32px;max-width:900px;margin:0 auto;}
      h1{color:#1a3a2a;} p{color:#555;}
      table{border-collapse:collapse;width:100%;margin-top:24px;}
      td,th{border:1px solid #ddd;padding:14px;text-align:left;}
      th{background:#f0f4f0;font-size:12px;text-transform:uppercase;}
      .room{font-size:20px;font-weight:800;color:#1a3a2a;}
      .url{font-size:11px;color:#b8893a;word-break:break-all;margin-top:6px;}
    </style></head><body>
    <h1>Hotel Elite International - Room QR Codes</h1>
    <table>
      <tr><th>Room</th><th>QR URL</th></tr>
      ${qrCodes.map(q => `
        <tr>
          <td><div class="room">Room ${q.room}</div></td>
          <td><div class="url">${q.qrUrl}</div></td>
        </tr>`).join('')}
    </table>
    </body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Staff State Mutations
app.post('/api/admin/orders', authenticateStaff, async (req, res) => {
  const newOrders = req.body;
  if (!Array.isArray(newOrders)) return res.status(400).json({ error: 'Invalid data' });
  for (const o of newOrders) {
    await db.run('UPDATE orders SET status = ?, items = ? WHERE id = ?', [o.status, JSON.stringify(o.items), o.id]);
  }
  await broadcastState();
  res.json({ success: true });
});

app.post('/api/admin/menu_items', authenticateAdmin, async (req, res) => {
  const newMenuItems = req.body;
  if (!Array.isArray(newMenuItems)) return res.status(400).json({ error: 'Invalid data' });
  const existingMenuItems = await db.all('SELECT * FROM menu_items');
  const incomingIds = new Set(newMenuItems.map(item => String(item.id)));

  for (const item of existingMenuItems) {
    if (!incomingIds.has(String(item.id))) {
      await db.run('DELETE FROM menu_items WHERE id = ?', [item.id]);
    }
  }

  for (const item of newMenuItems) {
    await db.run(
      'UPDATE menu_items SET name = ?, desc = ?, price = ?, category = ?, isVeg = ?, available = ?, image = ? WHERE id = ?',
      [item.name, item.desc, item.price, item.category, item.isVeg ? 1 : 0, item.available ? 1 : 0, item.image, item.id]
    );
  }
  await broadcastState();
  res.json({ success: true });
});

app.post('/api/admin/room_bills', authenticateAdmin, async (req, res) => {
  const newRoomBills = req.body;
  if (!Array.isArray(newRoomBills)) return res.status(400).json({ error: 'Invalid data' });
  for (const bill of newRoomBills) {
    const oldBill = await db.get('SELECT status FROM room_bills WHERE room = ?', [bill.room]);
    if (oldBill?.status === 'OPEN' && bill.status === 'CLOSED') {
      for (const [id, s] of activeSessions.entries()) {
        if (String(s.room) === String(bill.room)) activeSessions.delete(id);
      }
    }
    await db.run(
      'UPDATE room_bills SET billId = ?, guestName = ?, checkIn = ?, checkOut = ?, roomCharge = ?, roomServiceCharges = ?, status = ? WHERE room = ?',
      [bill.billId, bill.guestName, bill.checkIn, bill.checkOut, bill.roomCharge, JSON.stringify(bill.roomServiceCharges), bill.status, bill.room]
    );
  }
  await broadcastState();
  res.json({ success: true });
});

app.post('/api/admin/config', authenticateAdmin, async (req, res) => {
  const newConfig = req.body;
  if (!newConfig) return res.status(400).json({ error: 'Invalid data' });
  await db.run(
    'UPDATE config SET adminPin = ?, kitchenPin = ?, cgst = ?, sgst = ?, serviceCharge = ?',
    [newConfig.adminPin, newConfig.kitchenPin, newConfig.cgst, newConfig.sgst, newConfig.serviceCharge]
  );
  await broadcastState();
  res.json({ success: true });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = 3000;

const startServer = async () => {
  try {
    db = await initDB();
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\nHotel Elite International - SQLite Backend Ready`);
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
};

startServer();

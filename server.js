import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import { rateLimit } from 'express-rate-limit';
import { initDB, getFullState } from './db.js';
import { sysconAPI } from './lib/syscon.js';

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
  max: 15,
  message: { error: 'Too many login attempts, please try again later' }
});

const sanitizeKotPart = (value, fallback = 'KOT') => {
  const cleaned = String(value || fallback).replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase();
  return cleaned || fallback;
};

const getAlternativesForItem = async (item) => {
  if (!item) return [];
  return db.all(
    `SELECT id, name, desc, price, category, cuisine, station_id, isVeg, available, image
     FROM menu_items
     WHERE available = 1 AND id <> ? AND category = ?
     ORDER BY 
       CASE WHEN COALESCE(cuisine, '') = COALESCE(?, '') THEN 0 ELSE 1 END,
       ABS(price - ?) ASC,
       name ASC
     LIMIT 4`,
    [item.id, item.category, item.cuisine || '', Number(item.price || 0)]
  );
};

// Helper to calculate minutesAgo for frontend compatibility
const injectMinutesAgo = (orders) => {
  const now = Date.now();
  return orders.map(o => ({
    ...o,
    minutesAgo: Math.floor((now - o.createdAt) / 60000)
  }));
};

const injectAlertMinutesAgo = (alerts) => {
  const now = Date.now();
  return alerts.map(alert => ({
    ...alert,
    minutesAgo: Math.floor((now - alert.createdAt) / 60000)
  }));
};

let db;

// Broadcast updated state to clients
const sendGuestState = async (target, room) => {
  const state = await getFullState(db);
  state.orders = injectMinutesAgo(state.orders);
  state.sosAlerts = injectAlertMinutesAgo(state.sosAlerts || []);
  
  // Filter orders to only include this guest room's orders
  const filteredOrders = state.orders.filter(o => String(o.room) === String(room));
  const filteredSosAlerts = state.sosAlerts.filter(alert => String(alert.room) === String(room));
  
  const guestState = {
    menuItems: state.menuItems,
    orders: filteredOrders,
    sosAlerts: filteredSosAlerts,
    config: { 
      cgst: state.config.cgst, 
      sgst: state.config.sgst, 
      serviceCharge: state.config.serviceCharge 
    }
  };
  
  if (typeof target.emit === 'function') {
    target.emit('guest_state_update', guestState);
  } else {
    io.to(target).emit('guest_state_update', guestState);
  }
};

// Broadcast updated state to clients
const broadcastState = async () => {
  if (!db) return;
  const state = await getFullState(db);
  state.orders = injectMinutesAgo(state.orders);
  state.sosAlerts = injectAlertMinutesAgo(state.sosAlerts || []);
  
  io.to('admin_room').emit('admin_state_update', state);

  // Scoped broadcasts to active rooms
  const activeRooms = new Set();
  activeSessions.forEach(session => {
    activeRooms.add(session.room);
  });
  for (const room of activeRooms) {
    await sendGuestState(`room_${room}`, room);
  }
};

// ─── Socket.io Events ─────────────────────────────────────────────────────────

io.on('connection', async (socket) => {
  console.log(`Client connected: ${socket.id}`);

  if (db) {
    const state = await getFullState(db);
    // Send menu items and config on connection
    socket.emit('guest_state_update', {
      menuItems: state.menuItems,
      orders: [],
      sosAlerts: [],
      config: { 
        cgst: state.config.cgst, 
        sgst: state.config.sgst, 
        serviceCharge: state.config.serviceCharge 
      }
    });
  }

  socket.on('register_guest', async ({ sessionId }) => {
    const session = activeSessions.get(sessionId);
    if (session) {
      socket.join(`room_${session.room}`);
      console.log(`Socket ${socket.id} joined room_${session.room}`);
      await sendGuestState(socket, session.room);
    }
  });

  socket.on('join_admin', async ({ token }) => {
    const adminSig = crypto.createHmac('sha256', QR_SECRET).update('admin').digest('hex');
    const kitchenSig = crypto.createHmac('sha256', QR_SECRET).update('kitchen').digest('hex');
    if (token === adminSig || token === kitchenSig) {
      socket.join('admin_room');
      const state = await getFullState(db);
      state.orders = injectMinutesAgo(state.orders);
      state.sosAlerts = injectAlertMinutesAgo(state.sosAlerts || []);
      socket.emit('admin_state_update', state);
    }
  });

  // Authenticated order placement
  socket.on('place_order', async ({ order, sessionId }) => {
    const orderType = order.type || 'FOOD';
    if (orderType === 'EMERGENCY') {
      socket.emit('order_rejected', { reason: 'SOS alerts must use the emergency alert system, not room-service ordering.' });
      return;
    }
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
    if (roomBill.billId && session.billId && String(roomBill.billId) !== String(session.billId)) {
      socket.emit('order_rejected', { reason: 'Your stay has concluded. Room service is no longer available.' });
      activeSessions.delete(sessionId);
      return;
    }

    session.lastActivity = Date.now();
    
    const createdAt = Date.now();
    const token = `#${Math.floor(Math.random() * 90) + 10}`;
    const orderId = Date.now() + Math.floor(Math.random() * 1000);

    let subtotal = 0;
    let validatedItems = [];

    const sysConfig = await db.get('SELECT * FROM config WHERE id = 1') || { cgst: 2.5, sgst: 2.5, serviceCharge: 10 };
    const cgstRate = sysConfig.cgst;
    const sgstRate = sysConfig.sgst;
    const scRate = sysConfig.serviceCharge;

    if (orderType === 'FOOD') {
      const dbMenuItems = await db.all('SELECT * FROM menu_items');
      const menuItemMap = {};
      dbMenuItems.forEach(i => { menuItemMap[i.id] = i; });

      for (const item of (order.items || [])) {
        const menuItemId = Number(item.id);
        if (Number.isInteger(menuItemId)) {
          const dbItem = menuItemMap[menuItemId];
          if (!dbItem) {
            socket.emit('order_rejected', { reason: `Item "${item.name}" is no longer on the menu.` });
            return;
          }
          if (dbItem.available === 0) {
            socket.emit('order_rejected', { 
              reason: `Item "${item.name}" is out of stock. Please swap it or try something else.`,
              item_out_of_stock_alert: true,
              itemId: item.id
            });
            return;
          }
          const qty = parseInt(item.qty) || 1;
          validatedItems.push({
            id: dbItem.id,
            name: dbItem.name,
            price: dbItem.price,
            qty,
            isVeg: dbItem.isVeg,
            category: dbItem.category,
            cuisine: dbItem.cuisine || dbItem.category,
            station_id: dbItem.station_id || 'indian',
            status: 'PENDING'
          });
          subtotal += dbItem.price * qty;
        } else {
          // Custom requests have ₹0 price initially
          const qty = parseInt(item.qty) || 1;
          const customName = item.desc ? `${item.name} (${item.desc})` : item.name;
          validatedItems.push({
            name: customName,
            price: 0,
            qty,
            category: 'Custom',
            cuisine: 'Custom',
            station_id: 'indian',
            status: 'PENDING'
          });
        }
      }
    } else {
      validatedItems = (order.items || []).map(i => ({
        name: i.name,
        price: 0,
        qty: 1,
        status: 'PENDING'
      }));
    }

    const serviceCharge = parseFloat((subtotal * (scRate / 100)).toFixed(2));
    const cgst = parseFloat(((subtotal + serviceCharge) * (cgstRate / 100)).toFixed(2));
    const sgst = parseFloat(((subtotal + serviceCharge) * (sgstRate / 100)).toFixed(2));
    const total = parseFloat((subtotal + serviceCharge + cgst + sgst).toFixed(2));
    const initialStatus = orderType === 'FOOD' ? 'PREPARING' : 'NEW';

    // Save master order
    await db.run(
      `INSERT INTO orders (id, token, room, status, type, createdAt, deliveryPreference, note, items, subtotal, total, syscon_posted) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, 
        token, 
        session.room, 
        initialStatus, 
        orderType, 
        createdAt, 
        order.deliveryPreference || 'AS_READY', 
        order.note || '', 
        JSON.stringify(validatedItems), 
        subtotal, 
        total, 
        0
      ]
    );

    // Dynamic KOT splitting
    if (orderType === 'FOOD') {
      const stationGroups = {};
      for (const item of validatedItems) {
        const stationId = item.station_id || 'indian';
        const cuisine = item.cuisine || item.category || 'Kitchen';
        const groupKey = `${stationId}::${cuisine}`;
        if (!stationGroups[groupKey]) {
          stationGroups[groupKey] = { stationId, cuisine, items: [] };
        }
        stationGroups[groupKey].items.push(item);
      }

      // Create separate KOT slips for each pantry station and cuisine counter.
      for (const group of Object.values(stationGroups)) {
        const stationSuffix = sanitizeKotPart(group.stationId, 'STA');
        const cuisineSuffix = sanitizeKotPart(group.cuisine, 'FOOD');
        const kotNumber = `KOT-${orderId}-${stationSuffix}-${cuisineSuffix}`;
        await db.run(
          `INSERT INTO kots (order_id, station_id, kot_number, items, status) VALUES (?, ?, ?, ?, ?)`,
          [orderId, group.stationId, kotNumber, JSON.stringify(group.items), 'PENDING']
        );
      }
    }

    await broadcastState();
    socket.emit('order_accepted', { orderId });
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

// Validate token & sync with Syscon HMS
app.post('/api/validate-token', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });

  const result = validateToken(token);
  if (!result) {
    return res.status(401).json({ error: 'Invalid QR code. Please scan the QR code placed in your room.' });
  }

  // Validate room folio directly with Syscon HMS
  const sysconResult = await sysconAPI.validateGuestRoom(result.room);
  if (!sysconResult.success) {
    return res.status(403).json({ error: sysconResult.error });
  }

  // Upsert the room bill locally with validated Syscon info
  await db.run(
    `INSERT INTO room_bills (room, billId, guestName, checkIn, checkOut, roomCharge, status, syscon_guest_id) 
     VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?)
     ON CONFLICT(room) DO UPDATE SET 
       billId = excluded.billId,
       guestName = excluded.guestName,
       checkIn = excluded.checkIn,
       checkOut = excluded.checkOut,
       status = 'OPEN',
       syscon_guest_id = excluded.syscon_guest_id`,
    [result.room, sysconResult.billId, sysconResult.guestName, sysconResult.checkIn, sysconResult.checkOut, 0, sysconResult.sysconGuestId]
  );
  
  const sessionId = crypto.randomBytes(32).toString('hex');
  activeSessions.set(sessionId, { 
    room: String(result.room), 
    billId: sysconResult.billId,
    lastActivity: Date.now() 
  });

  console.log(`QR validated via Syscon for Room ${result.room} [Session: ${sessionId.slice(0, 8)}...]`);
  res.json({ sessionId, room: result.room });
});

app.post('/api/login', loginLimiter, async (req, res) => {
  const { role, pin } = req.body;
  const config = await db.get('SELECT * FROM config WHERE id = 1');
  
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

// Update master orders and push billing to Syscon HMS on DELIVERED
app.post('/api/admin/orders', authenticateStaff, async (req, res) => {
  const newOrders = req.body;
  if (!Array.isArray(newOrders)) return res.status(400).json({ error: 'Invalid data' });
  
  for (const o of newOrders) {
    await db.run('UPDATE orders SET status = ?, items = ? WHERE id = ?', [o.status, JSON.stringify(o.items), o.id]);
    
    // Auto-post only billable dining orders to Syscon HMS when delivered.
    if (o.status === 'DELIVERED') {
      const dbOrder = await db.get('SELECT * FROM orders WHERE id = ?', [o.id]);
      if (dbOrder && dbOrder.type === 'FOOD' && Number(dbOrder.total) > 0 && dbOrder.syscon_posted !== 1) {
        const postRes = await sysconAPI.postFolioCharge(dbOrder);
        if (postRes.success) {
          await db.run('UPDATE orders SET syscon_posted = 1 WHERE id = ?', [o.id]);
        } else {
          await db.run('UPDATE orders SET syscon_posted = -1 WHERE id = ?', [o.id]);
        }
      }
    }
  }
  await broadcastState();
  res.json({ success: true });
});

// Partial dispatch of order items from pantry
app.post('/api/admin/orders/:id/partial-dispatch', authenticateStaff, async (req, res) => {
  const orderId = req.params.id;
  const { items } = req.body;
  
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Items required' });

  const allDispatched = items.length > 0 && items.every(i => i.status === 'DISPATCHED');
  const nextStatus = allDispatched ? 'ON_THE_WAY' : 'PREPARING';
  await db.run(
    "UPDATE orders SET items = ?, status = ? WHERE id = ? AND status NOT IN ('DELIVERED', 'CANCELLED')",
    [JSON.stringify(items), nextStatus, orderId]
  );
  
  await broadcastState();
  res.json({ success: true });
});

// Update specific KOT status (printed/ready)
app.post('/api/admin/kots/:id/status', authenticateStaff, async (req, res) => {
  const kotId = req.params.id;
  const { status } = req.body;
  
  await db.run('UPDATE kots SET status = ? WHERE id = ?', [status, kotId]);
  
  // If all KOTs for a specific order are READY, auto-transition the master order status to PREPARING/ON_THE_WAY
  const kot = await db.get('SELECT order_id FROM kots WHERE id = ?', [kotId]);
  if (kot) {
    const orderKots = await db.all('SELECT status FROM kots WHERE order_id = ?', [kot.order_id]);
    const allReady = orderKots.every(k => k.status === 'READY');
    if (allReady) {
      await db.run("UPDATE orders SET status = 'PREPARING' WHERE id = ? AND status = 'NEW'", [kot.order_id]);
    }
  }
  
  await broadcastState();
  res.json({ success: true });
});

// Cancel an active order from the staff side.
app.post('/api/admin/orders/:id/cancel', authenticateStaff, async (req, res) => {
  const orderId = req.params.id;
  const order = await db.get('SELECT status FROM orders WHERE id = ?', [orderId]);
  
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
    return res.status(400).json({ error: 'Order is already closed and cannot be cancelled' });
  }

  await db.run("UPDATE orders SET status = 'CANCELLED' WHERE id = ?", [orderId]);
  await db.run("DELETE FROM kots WHERE order_id = ?", [orderId]);
  
  await broadcastState();
  res.json({ success: true });
});

// Guest cancellation with session validation
app.post('/api/guest/orders/:id/cancel', async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(401).json({ error: 'Session ID required' });
  
  const session = activeSessions.get(sessionId);
  if (!session) return res.status(401).json({ error: 'Invalid or expired session' });

  const orderId = req.params.id;
  const order = await db.get('SELECT room, status, createdAt FROM orders WHERE id = ?', [orderId]);
  
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (String(order.room) !== String(session.room)) {
    return res.status(403).json({ error: 'Unauthorized to cancel this order' });
  }
  if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
    return res.status(400).json({ error: 'Order is already closed and cannot be cancelled' });
  }
  if (Date.now() - Number(order.createdAt || 0) > 60000) {
    return res.status(400).json({ error: 'The one-minute hassle-free cancellation window has ended. Please call the pantry for help.' });
  }

  await db.run("UPDATE orders SET status = 'CANCELLED' WHERE id = ?", [orderId]);
  await db.run("DELETE FROM kots WHERE order_id = ?", [orderId]);
  
  await broadcastState();
  res.json({ success: true });
});

// Guest SOS alert creation with session validation. This is intentionally
// separate from orders/KOT/billing.
app.post('/api/guest/sos', async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(401).json({ error: 'Session ID required' });

  const session = activeSessions.get(sessionId);
  if (!session) return res.status(401).json({ error: 'Invalid or expired session' });
  session.lastActivity = Date.now();

  const existingAlert = await db.get(
    "SELECT * FROM sos_alerts WHERE room = ? AND status IN ('OPEN', 'ACKNOWLEDGED') ORDER BY createdAt DESC LIMIT 1",
    [session.room]
  );
  if (existingAlert) {
    await broadcastState();
    return res.json({ success: true, alertId: existingAlert.id, existing: true });
  }

  const createdAt = Date.now();
  const result = await db.run(
    `INSERT INTO sos_alerts (room, status, severity, source, message, createdAt) 
     VALUES (?, 'OPEN', 'EMERGENCY', 'GUEST_QR', ?, ?)`,
    [session.room, 'Guest pressed the emergency SOS button', createdAt]
  );

  await broadcastState();
  res.json({ success: true, alertId: result.lastID });
});

// Guest-safe SOS clear with session validation
app.post('/api/guest/sos/:id/safe', async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(401).json({ error: 'Session ID required' });

  const session = activeSessions.get(sessionId);
  if (!session) return res.status(401).json({ error: 'Invalid or expired session' });

  const alertId = req.params.id;
  const alert = await db.get('SELECT * FROM sos_alerts WHERE id = ?', [alertId]);

  if (!alert) return res.status(404).json({ error: 'SOS alert not found' });
  if (String(alert.room) !== String(session.room)) {
    return res.status(403).json({ error: 'Unauthorized to clear this SOS alert' });
  }

  if (!['RESOLVED', 'CANCELLED'].includes(alert.status)) {
    await db.run(
      `UPDATE sos_alerts 
       SET status = 'RESOLVED', resolvedAt = ?, resolvedBy = 'guest', resolutionNote = ? 
       WHERE id = ?`,
      [Date.now(), 'Guest marked themselves safe', alertId]
    );
  }

  await broadcastState();
  res.json({ success: true });
});

app.post('/api/admin/sos/:id/acknowledge', authenticateStaff, async (req, res) => {
  const alertId = req.params.id;
  const alert = await db.get('SELECT status FROM sos_alerts WHERE id = ?', [alertId]);
  if (!alert) return res.status(404).json({ error: 'SOS alert not found' });

  if (alert.status === 'OPEN') {
    await db.run(
      `UPDATE sos_alerts 
       SET status = 'ACKNOWLEDGED', acknowledgedAt = ?, acknowledgedBy = ? 
       WHERE id = ?`,
      [Date.now(), 'staff', alertId]
    );
  }

  await broadcastState();
  res.json({ success: true });
});

app.post('/api/admin/sos/:id/resolve', authenticateStaff, async (req, res) => {
  const alertId = req.params.id;
  const { note } = req.body || {};
  const alert = await db.get('SELECT status FROM sos_alerts WHERE id = ?', [alertId]);
  if (!alert) return res.status(404).json({ error: 'SOS alert not found' });

  if (!['RESOLVED', 'CANCELLED'].includes(alert.status)) {
    await db.run(
      `UPDATE sos_alerts 
       SET status = 'RESOLVED', resolvedAt = ?, resolvedBy = ?, resolutionNote = ? 
       WHERE id = ?`,
      [Date.now(), 'staff', note || 'Staff marked SOS resolved', alertId]
    );
  }

  await broadcastState();
  res.json({ success: true });
});

// Out-of-stock notifier toggle. Pantry/Admin can disable an item and affected
// active guest orders get alternatives scoped to their room session.
app.post('/api/admin/menu_items/out-of-stock', authenticateStaff, async (req, res) => {
  const { itemId, available } = req.body;
  const item = await db.get('SELECT * FROM menu_items WHERE id = ?', [itemId]);
  if (!item) return res.status(404).json({ error: 'Menu item not found' });
  
  await db.run('UPDATE menu_items SET available = ? WHERE id = ?', [available ? 1 : 0, itemId]);
  
  let alternatives = [];
  if (!available) {
    alternatives = await getAlternativesForItem(item);
    const activeOrders = await db.all(
      "SELECT id, room, items FROM orders WHERE type = 'FOOD' AND status NOT IN ('DELIVERED', 'CANCELLED')"
    );

    for (const order of activeOrders) {
      const parsedItems = (() => {
        try {
          return typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
        } catch {
          return [];
        }
      })();
      const hasAffectedItem = parsedItems.some(orderItem => String(orderItem.id) === String(itemId));
      if (hasAffectedItem) {
        io.to(`room_${order.room}`).emit('item_out_of_stock_alert', {
          itemId,
          name: item.name,
          orderId: order.id,
          alternatives
        });
      }
    }
  }
  
  await broadcastState();
  res.json({ success: true, alternatives });
});

// Submit guest feedback
app.post('/api/guest/feedback', async (req, res) => {
  const { sessionId, orderId, serviceRating, foodRating, suggestion } = req.body;
  if (!sessionId || serviceRating === undefined || foodRating === undefined) {
    return res.status(400).json({ error: 'Missing required feedback fields' });
  }

  const session = activeSessions.get(sessionId);
  if (!session) return res.status(401).json({ error: 'Invalid or expired session' });

  const sRating = parseInt(serviceRating);
  const fRating = parseInt(foodRating);
  if (isNaN(sRating) || sRating < 1 || sRating > 5 || isNaN(fRating) || fRating < 1 || fRating > 5) {
    return res.status(400).json({ error: 'Ratings must be integers between 1 and 5' });
  }

  if (orderId) {
    const order = await db.get('SELECT room, status FROM orders WHERE id = ?', [orderId]);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (String(order.room) !== String(session.room)) {
      return res.status(403).json({ error: 'Unauthorized feedback submission' });
    }
    if (order.status !== 'DELIVERED') {
      return res.status(400).json({ error: 'Feedback can only be submitted after delivery' });
    }

    // Prevent duplicates
    const existing = await db.get('SELECT id FROM guest_feedback WHERE order_id = ?', [orderId]);
    if (existing) {
      return res.json({ success: true, message: 'Feedback already submitted for this order' });
    }
  }

  await db.run(
    `INSERT INTO guest_feedback (order_id, room, service_rating, food_rating, suggestion, createdAt) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [orderId || null, session.room, sRating, fRating, suggestion || '', Date.now()]
  );

  await broadcastState(); // Broadcast updated feedback lists
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
      `INSERT INTO menu_items (id, name, desc, price, category, cuisine, station_id, isVeg, available, image) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET 
         name = excluded.name,
         desc = excluded.desc,
         price = excluded.price,
         category = excluded.category,
         cuisine = excluded.cuisine,
         station_id = excluded.station_id,
         isVeg = excluded.isVeg,
         available = excluded.available,
         image = excluded.image`,
      [item.id, item.name, item.desc, item.price, item.category, item.cuisine || item.category, item.station_id || 'indian', item.isVeg ? 1 : 0, item.available ? 1 : 0, item.image]
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
      `INSERT INTO room_bills (room, billId, guestName, checkIn, checkOut, roomCharge, status, syscon_guest_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(room) DO UPDATE SET 
         billId = excluded.billId,
         guestName = excluded.guestName,
         checkIn = excluded.checkIn,
         checkOut = excluded.checkOut,
         roomCharge = excluded.roomCharge,
         status = excluded.status,
         syscon_guest_id = excluded.syscon_guest_id`,
      [bill.room, bill.billId, bill.guestName, bill.checkIn, bill.checkOut, bill.roomCharge, bill.status, bill.syscon_guest_id || `GUEST-${bill.room}`]
    );
  }
  await broadcastState();
  res.json({ success: true });
});

app.post('/api/admin/config', authenticateAdmin, async (req, res) => {
  const newConfig = req.body;
  if (!newConfig) return res.status(400).json({ error: 'Invalid data' });
  await db.run(
    'UPDATE config SET adminPin = ?, kitchenPin = ?, cgst = ?, sgst = ?, serviceCharge = ? WHERE id = 1',
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

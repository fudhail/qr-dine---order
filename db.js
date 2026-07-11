import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.db');
const JSON_DB_FILE = path.join(__dirname, 'database.json');

// Initial seed data for fallback/new setup
const initialData = {
  menu_items: [
    { id: 1, name: 'Truffle Mushroom Risotto', desc: 'Creamy Arborio rice with wild mushrooms and truffle oil', price: 450, category: 'Mains', station_id: 'indian', isVeg: 1, available: 1, image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&q=80' },
    { id: 2, name: 'Margherita Pizza', desc: 'Classic San Marzano tomato sauce, fresh mozzarella, and basil', price: 380, category: 'Mains', station_id: 'chinese', isVeg: 1, available: 1, image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a30536?w=400&q=80' },
    { id: 3, name: 'Eggs Benedict', desc: 'Poached eggs on English muffins with hollandaise', price: 320, category: 'Breakfast', station_id: 'breakfast', isVeg: 0, available: 1, image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400&q=80' },
    { id: 4, name: 'Avocado Toast', desc: 'Smashed avocado on sourdough with cherry tomatoes', price: 290, category: 'Breakfast', station_id: 'breakfast', isVeg: 1, available: 1, image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&q=80' },
    { id: 5, name: 'Buffalo Wings', desc: 'Spicy chicken wings with blue cheese dip', price: 280, category: 'Starters', station_id: 'chinese', isVeg: 0, available: 1, image: 'https://images.unsplash.com/photo-1524114664604-cd8133cd67ad?w=400&q=80' },
    { id: 6, name: 'Caesar Salad', desc: 'Crisp romaine, parmesan, croutons, classic dressing', price: 250, category: 'Starters', station_id: 'chinese', isVeg: 1, available: 1, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
    { id: 7, name: 'Grilled Salmon', desc: 'Atlantic salmon with asparagus and lemon butter', price: 550, category: 'Mains', station_id: 'indian', isVeg: 0, available: 1, image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=400&q=80' },
    { id: 8, name: 'Tiramisu', desc: 'Classic Italian coffee-flavored dessert', price: 260, category: 'Desserts', station_id: 'desserts', isVeg: 1, available: 1, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80' },
    { id: 9, name: 'Fresh Orange Juice', desc: 'Freshly squeezed oranges', price: 150, category: 'Beverages', station_id: 'beverages', isVeg: 1, available: 1, image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80' },
    { id: 10, name: 'Chocolate Lava Cake', desc: 'Warm chocolate cake with molten center', price: 220, category: 'Desserts', station_id: 'desserts', isVeg: 1, available: 1, image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&q=80' }
  ],
  services: [
    { name: 'Make My Room / Cleaning', desc: 'Request standard housekeeping, dusting, and bed tidying.', price: 0, category: 'Services', station_id: 'housekeeping', isVeg: 2, available: 1, image: '' },
    { name: 'Laundry Pick-up & Wash', desc: 'Request laundry collection from your room.', price: 0, category: 'Services', station_id: 'laundry', isVeg: 2, available: 1, image: '' },
    { name: 'Fresh Towels & Linens', desc: 'Request extra or fresh towels, bedsheets, or pillow covers.', price: 0, category: 'Services', station_id: 'housekeeping', isVeg: 2, available: 1, image: '' }
  ],
  room_bills: [
    { room: '101', billId: 'bill_1715000000_1', guestName: 'John Smith', checkIn: '2026-07-10', checkOut: '2026-07-14', roomCharge: 4500, status: 'OPEN', syscon_guest_id: 'GUEST-101' },
    { room: '102', billId: 'bill_1715000000_2', guestName: 'Sarah Connor', checkIn: '2026-07-09', checkOut: '2026-07-12', roomCharge: 3800, status: 'OPEN', syscon_guest_id: 'GUEST-102' },
    { room: '103', billId: 'bill_1715000000_3', guestName: 'Michael Rossi', checkIn: '2026-07-10', checkOut: '2026-07-15', roomCharge: 5200, status: 'OPEN', syscon_guest_id: 'GUEST-103' },
    { room: '104', billId: '', guestName: '', checkIn: '', checkOut: '', roomCharge: 0, status: 'CLOSED', syscon_guest_id: '' }
  ],
  config: {
    adminPin: '1234',
    kitchenPin: '1111',
    cgst: 2.5,
    sgst: 2.5,
    serviceCharge: 10
  }
};

const mapCategoryToStation = (category) => {
  switch (category) {
    case 'Breakfast': return 'breakfast';
    case 'Starters': return 'chinese';
    case 'Mains': return 'indian';
    case 'Desserts': return 'desserts';
    case 'Beverages': return 'beverages';
    case 'Services': return 'housekeeping';
    default: return 'indian';
  }
};

export const initDB = async () => {
  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON;');

  // Check if orders table needs migration to support ON_THE_WAY status
  const ordersTableInfo = await db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='orders'");
  if (ordersTableInfo && !ordersTableInfo.sql.includes('ON_THE_WAY')) {
    console.log('Migrating orders table to support ON_THE_WAY status...');
    await db.exec(`
      PRAGMA foreign_keys = OFF;
      ALTER TABLE orders RENAME TO orders_old;
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        token TEXT NOT NULL,
        room TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('NEW', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED')),
        type TEXT NOT NULL CHECK(type IN ('FOOD', 'SERVICE', 'EMERGENCY')),
        createdAt INTEGER NOT NULL,
        deliveryPreference TEXT,
        note TEXT,
        items TEXT NOT NULL,
        subtotal REAL NOT NULL,
        total REAL NOT NULL,
        syscon_posted INTEGER DEFAULT 0
      );
      INSERT INTO orders SELECT id, token, room, status, type, createdAt, deliveryPreference, note, items, subtotal, total, syscon_posted FROM orders_old;
      DROP TABLE orders_old;
      PRAGMA foreign_keys = ON;
    `);
  }

  // Check if kots or guest_feedback table references the old orders_old table
  const kotsTableInfo = await db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='kots'");
  if (kotsTableInfo && kotsTableInfo.sql.includes('orders_old')) {
    console.log('Migrating kots and guest_feedback tables to point to orders instead of orders_old...');
    await db.exec(`
      PRAGMA foreign_keys = OFF;
      
      ALTER TABLE kots RENAME TO kots_old;
      CREATE TABLE kots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        station_id TEXT REFERENCES service_stations(id),
        kot_number TEXT NOT NULL,
        items TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING'
      );
      INSERT INTO kots SELECT id, order_id, station_id, kot_number, items, status FROM kots_old;
      DROP TABLE kots_old;

      ALTER TABLE guest_feedback RENAME TO guest_feedback_old;
      CREATE TABLE guest_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        room TEXT NOT NULL,
        service_rating INTEGER NOT NULL,
        food_rating INTEGER NOT NULL,
        suggestion TEXT,
        createdAt INTEGER NOT NULL
      );
      INSERT INTO guest_feedback SELECT id, order_id, room, service_rating, food_rating, suggestion, createdAt FROM guest_feedback_old;
      DROP TABLE guest_feedback_old;
      
      PRAGMA foreign_keys = ON;
    `);
  }

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS service_stations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('KITCHEN', 'HOSPITALITY'))
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      desc TEXT,
      price REAL NOT NULL DEFAULT 0.0,
      category TEXT NOT NULL,
      station_id TEXT REFERENCES service_stations(id),
      isVeg INTEGER NOT NULL DEFAULT 0,
      available INTEGER NOT NULL DEFAULT 1,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS room_bills (
      room TEXT PRIMARY KEY,
      billId TEXT,
      guestName TEXT,
      checkIn TEXT,
      checkOut TEXT,
      roomCharge REAL DEFAULT 0.0,
      status TEXT CHECK(status IN ('OPEN', 'CLOSED')),
      syscon_guest_id TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      token TEXT NOT NULL,
      room TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('NEW', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED')),
      type TEXT NOT NULL CHECK(type IN ('FOOD', 'SERVICE', 'EMERGENCY')),
      createdAt INTEGER NOT NULL,
      deliveryPreference TEXT,
      note TEXT,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      total REAL NOT NULL,
      syscon_posted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS kots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      station_id TEXT REFERENCES service_stations(id),
      kot_number TEXT NOT NULL,
      items TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING'
    );

    CREATE TABLE IF NOT EXISTS guest_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      room TEXT NOT NULL,
      service_rating INTEGER NOT NULL,
      food_rating INTEGER NOT NULL,
      suggestion TEXT,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      adminPin TEXT NOT NULL,
      kitchenPin TEXT NOT NULL,
      cgst REAL NOT NULL,
      sgst REAL NOT NULL,
      serviceCharge REAL NOT NULL
    );
  `);

  // Seed default stations if empty
  const stationCount = await db.get('SELECT COUNT(*) as count FROM service_stations');
  if (stationCount.count === 0) {
    const stations = [
      { id: 'indian', name: 'Indian Kitchen', type: 'KITCHEN' },
      { id: 'chinese', name: 'Chinese Kitchen', type: 'KITCHEN' },
      { id: 'tandoor', name: 'Tandoor Kitchen', type: 'KITCHEN' },
      { id: 'breakfast', name: 'Breakfast Station', type: 'KITCHEN' },
      { id: 'beverages', name: 'Beverage Bar', type: 'KITCHEN' },
      { id: 'desserts', name: 'Dessert Pantry', type: 'KITCHEN' },
      { id: 'housekeeping', name: 'Housekeeping Services', type: 'HOSPITALITY' },
      { id: 'laundry', name: 'Laundry Services', type: 'HOSPITALITY' }
    ];
    for (const station of stations) {
      await db.run('INSERT INTO service_stations (id, name, type) VALUES (?, ?, ?)', [station.id, station.name, station.type]);
    }
  }

  // Check if we need to migrate from database.json
  const menuCount = await db.get('SELECT COUNT(*) as count FROM menu_items');
  if (menuCount.count === 0) {
    try {
      const dataContent = await fs.readFile(JSON_DB_FILE, 'utf-8');
      const jsonData = JSON.parse(dataContent);
      console.log('Found database.json, starting migration to SQLite...');

      // Seed config
      const config = jsonData.config || initialData.config;
      await db.run(
        'INSERT OR REPLACE INTO config (id, adminPin, kitchenPin, cgst, sgst, serviceCharge) VALUES (1, ?, ?, ?, ?, ?)',
        [config.adminPin, config.kitchenPin, config.cgst, config.sgst, config.serviceCharge]
      );

      // Seed room bills
      const roomBills = jsonData.room_bills || initialData.room_bills;
      for (const bill of roomBills) {
        await db.run(
          'INSERT OR REPLACE INTO room_bills (room, billId, guestName, checkIn, checkOut, roomCharge, status, syscon_guest_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [bill.room, bill.billId, bill.guestName, bill.checkIn, bill.checkOut, bill.roomCharge || 0, bill.status, bill.room ? `GUEST-${bill.room}` : '']
        );
      }

      // Seed menu items
      const menuItems = jsonData.menu_items || initialData.menu_items;
      for (const item of menuItems) {
        const station = mapCategoryToStation(item.category);
        await db.run(
          'INSERT OR REPLACE INTO menu_items (id, name, desc, price, category, station_id, isVeg, available, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [item.id, item.name, item.desc, item.price, item.category, station, item.isVeg || 0, item.available || 1, item.image || '']
        );
      }

      // Add default hospitality services
      for (const service of initialData.services) {
        await db.run(
          'INSERT INTO menu_items (name, desc, price, category, station_id, isVeg, available, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [service.name, service.desc, service.price, service.category, service.station_id, service.isVeg, service.available, service.image]
        );
      }

      // Seed historical orders if any
      const orders = jsonData.orders || [];
      for (const o of orders) {
        // Items must be stored as serialized json string
        const itemsStr = typeof o.items === 'string' ? o.items : JSON.stringify(o.items || []);
        await db.run(
          'INSERT INTO orders (id, token, room, status, type, createdAt, deliveryPreference, note, items, subtotal, total, syscon_posted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [o.id, o.token, o.room, o.status || 'DELIVERED', 'FOOD', o.createdAt, o.deliveryPreference || 'AS_READY', o.note || '', itemsStr, o.subtotal, o.total, 1]
        );
      }

      // Rename database.json to backup
      await fs.rename(JSON_DB_FILE, `${JSON_DB_FILE}.bak`);
      console.log('Migration complete. Renamed database.json to database.json.bak');

    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.error('Migration failed:', e);
      } else {
        // No database.json found, seed with initialData
        console.log('No database.json found. Seeding database with fresh initialData...');
        const config = initialData.config;
        await db.run(
          'INSERT OR REPLACE INTO config (id, adminPin, kitchenPin, cgst, sgst, serviceCharge) VALUES (1, ?, ?, ?, ?, ?)',
          [config.adminPin, config.kitchenPin, config.cgst, config.sgst, config.serviceCharge]
        );

        for (const bill of initialData.room_bills) {
          await db.run(
            'INSERT OR REPLACE INTO room_bills (room, billId, guestName, checkIn, checkOut, roomCharge, status, syscon_guest_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [bill.room, bill.billId, bill.guestName, bill.checkIn, bill.checkOut, bill.roomCharge, bill.status, bill.syscon_guest_id]
          );
        }

        for (const item of initialData.menu_items) {
          await db.run(
            'INSERT INTO menu_items (id, name, desc, price, category, station_id, isVeg, available, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [item.id, item.name, item.desc, item.price, item.category, item.station_id, item.isVeg, item.available, item.image]
          );
        }

        for (const service of initialData.services) {
          await db.run(
            'INSERT INTO menu_items (name, desc, price, category, station_id, isVeg, available, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [service.name, service.desc, service.price, service.category, service.station_id, service.isVeg, service.available, service.image]
          );
        }
      }
    }
  }

  return db;
};

export const getFullState = async (db) => {
  const menuRows = await db.all('SELECT * FROM menu_items');
  const billsRows = await db.all('SELECT * FROM room_bills');
  const ordersRows = await db.all('SELECT * FROM orders ORDER BY createdAt DESC');
  const configRows = await db.all('SELECT * FROM config');
  
  // Fetch details about active KOTs for orders
  const kots = await db.all('SELECT * FROM kots');

  // Fetch feedback
  const feedback = await db.all('SELECT * FROM guest_feedback ORDER BY createdAt DESC');

  // Fetch service stations
  const stations = await db.all('SELECT * FROM service_stations');

  return {
    menuItems: menuRows.map(row => ({
      ...row,
      isVeg: Number(row.isVeg),
      available: Boolean(row.available)
    })),
    roomBills: billsRows.map(row => {
      const roomOrders = ordersRows.filter(o => String(o.room) === String(row.room) && o.status === 'DELIVERED' && o.type === 'FOOD');
      const roomServiceCharges = roomOrders.map(o => ({
        orderId: o.id,
        amount: o.total
      }));
      return {
        ...row,
        roomServiceCharges
      };
    }),
    orders: ordersRows.map(row => {
      const orderKots = kots.filter(k => k.order_id === row.id);
      return {
        ...row,
        items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
        kots: orderKots.map(k => ({ ...k, items: JSON.parse(k.items) }))
      };
    }),
    feedback,
    stations,
    config: configRows[0]
  };
};

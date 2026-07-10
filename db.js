import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

// Initial seed data
const initialData = {
  menu_items: [
    { id: 1, name: 'Truffle Mushroom Risotto', desc: 'Creamy Arborio rice with wild mushrooms and truffle oil', price: 450, category: 'Mains', isVeg: 1, available: 1, image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&q=80' },
    { id: 2, name: 'Margherita Pizza', desc: 'Classic San Marzano tomato sauce, fresh mozzarella, and basil', price: 380, category: 'Mains', isVeg: 1, available: 1, image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a30536?w=400&q=80' },
    { id: 3, name: 'Eggs Benedict', desc: 'Poached eggs on English muffins with hollandaise', price: 320, category: 'Breakfast', isVeg: 0, available: 1, image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400&q=80' },
    { id: 4, name: 'Avocado Toast', desc: 'Smashed avocado on sourdough with cherry tomatoes', price: 290, category: 'Breakfast', isVeg: 1, available: 1, image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&q=80' },
    { id: 5, name: 'Buffalo Wings', desc: 'Spicy chicken wings with blue cheese dip', price: 280, category: 'Starters', isVeg: 0, available: 1, image: 'https://images.unsplash.com/photo-1524114664604-cd8133cd67ad?w=400&q=80' },
    { id: 6, name: 'Caesar Salad', desc: 'Crisp romaine, parmesan, croutons, classic dressing', price: 250, category: 'Starters', isVeg: 1, available: 1, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
    { id: 7, name: 'Grilled Salmon', desc: 'Atlantic salmon with asparagus and lemon butter', price: 550, category: 'Mains', isVeg: 0, available: 1, image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=400&q=80' },
    { id: 8, name: 'Tiramisu', desc: 'Classic Italian coffee-flavored dessert', price: 260, category: 'Desserts', isVeg: 1, available: 1, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80' },
    { id: 9, name: 'Fresh Orange Juice', desc: 'Freshly squeezed oranges', price: 150, category: 'Beverages', isVeg: 1, available: 1, image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80' },
    { id: 10, name: 'Chocolate Lava Cake', desc: 'Warm chocolate cake with molten center', price: 220, category: 'Desserts', isVeg: 1, available: 1, image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&q=80' }
  ],
  room_bills: [
    { room: '101', billId: 'bill_1715000000_1', guestName: 'John Smith', checkIn: '2026-07-10', checkOut: '2026-07-14', roomCharge: 4500, roomServiceCharges: '[]', status: 'OPEN' },
    { room: '102', billId: 'bill_1715000000_2', guestName: 'Sarah Connor', checkIn: '2026-07-09', checkOut: '2026-07-12', roomCharge: 3800, roomServiceCharges: '[]', status: 'OPEN' },
    { room: '103', billId: 'bill_1715000000_3', guestName: 'Michael Rossi', checkIn: '2026-07-10', checkOut: '2026-07-15', roomCharge: 5200, roomServiceCharges: '[]', status: 'OPEN' },
    { room: '104', billId: '', guestName: '', checkIn: '', checkOut: '', roomCharge: 0, roomServiceCharges: '[]', status: 'CLOSED' }
  ],
  orders: [],
  config: {
    adminPin: '1234',
    kitchenPin: '1111',
    cgst: 2.5,
    sgst: 2.5,
    serviceCharge: 10
  }
};

class JSONDatabase {
  constructor() {
    this.data = null;
  }

  async init() {
    try {
      const content = await fs.readFile(DB_FILE, 'utf-8');
      this.data = JSON.parse(content);
      
      // Migration: Add config if missing in older database files
      if (!this.data.config) {
        this.data.config = { ...initialData.config };
        await this._save();
      }
    } catch (e) {
      if (e.code === 'ENOENT') {
        this.data = { ...initialData };
        await this._save();
      } else {
        throw e;
      }
    }
    return this;
  }

  async _save() {
    await fs.writeFile(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  // Very basic mock of sqlite's `all`
  async all(query, params = []) {
    if (query.includes('FROM menu_items')) return this.data.menu_items;
    if (query.includes('FROM room_bills')) return this.data.room_bills;
    if (query.includes('FROM orders')) return this.data.orders.sort((a,b) => b.createdAt - a.createdAt);
    if (query.includes('FROM config')) return [this.data.config];
    return [];
  }

  // Very basic mock of sqlite's `get`
  async get(query, params = []) {
    if (query.includes('FROM room_bills WHERE room')) {
      return this.data.room_bills.find(b => String(b.room) === String(params[0]));
    }
    return null;
  }

  // Very basic mock of sqlite's `run`
  async run(query, params = []) {
    if (query.startsWith('INSERT INTO orders')) {
      // [token, room, status, createdAt, deliveryPreference, items, note, subtotal, total]
      const [token, room, status, createdAt, deliveryPreference, items, note, subtotal, total] = params;
      const order = {
        id: Date.now() + Math.floor(Math.random() * 1000), // simulate auto-increment
        token, room, status, createdAt, deliveryPreference, items, note, subtotal, total
      };
      this.data.orders.push(order);
    } 
    else if (query.startsWith('UPDATE orders SET status')) {
      const [status, items, id] = params;
      const order = this.data.orders.find(o => String(o.id) === String(id));
      if (order) {
        order.status = status;
        order.items = items;
      }
    }
    else if (query.startsWith('UPDATE menu_items')) {
      const [name, desc, price, category, isVeg, available, image, id] = params;
      let itemIdx = this.data.menu_items.findIndex(i => String(i.id) === String(id));
      if (itemIdx !== -1) {
        Object.assign(this.data.menu_items[itemIdx], { name, desc, price, category, isVeg, available, image });
      } else {
        // Insert — new item added by admin that wasn't in DB yet
        this.data.menu_items.unshift({ id, name, desc, price, category, isVeg, available, image });
      }
    }
    else if (query.startsWith('DELETE FROM menu_items')) {
      const [id] = params;
      this.data.menu_items = this.data.menu_items.filter(item => String(item.id) !== String(id));
    }
    else if (query.startsWith('UPDATE room_bills')) {
      const [billId, guestName, checkIn, checkOut, roomCharge, roomServiceCharges, status, room] = params;
      const billIdx = this.data.room_bills.findIndex(b => String(b.room) === String(room));
      if (billIdx !== -1) {
        // Update existing row
        Object.assign(this.data.room_bills[billIdx], { billId, guestName, checkIn, checkOut, roomCharge, roomServiceCharges, status });
      } else {
        // Insert new room bill row
        this.data.room_bills.push({ room: String(room), billId, guestName, checkIn, checkOut, roomCharge, roomServiceCharges, status });
      }
    }
    else if (query.startsWith('UPDATE config')) {
      const [adminPin, kitchenPin, cgst, sgst, serviceCharge] = params;
      this.data.config = { adminPin, kitchenPin, cgst, sgst, serviceCharge };
    }
    await this._save();
    return { lastID: Date.now(), changes: 1 };
  }
}

export const initDB = async () => {
  const db = new JSONDatabase();
  await db.init();
  return db;
};

export const getFullState = async (db) => {
  const menuRows = await db.all('SELECT * FROM menu_items');
  const billsRows = await db.all('SELECT * FROM room_bills');
  const ordersRows = await db.all('SELECT * FROM orders ORDER BY createdAt DESC');
  const configRows = await db.all('SELECT * FROM config');
  
  return {
    menuItems: menuRows.map(row => ({
      ...row,
      isVeg: Boolean(row.isVeg),
      available: Boolean(row.available)
    })),
    roomBills: billsRows.map(row => ({
      ...row,
      roomServiceCharges: typeof row.roomServiceCharges === 'string' ? JSON.parse(row.roomServiceCharges) : row.roomServiceCharges
    })),
    orders: ordersRows.map(row => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items
    })),
    config: configRows[0]
  };
};

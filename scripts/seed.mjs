import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '../database.db');

const initialMenu = [
  // Breakfast
  { name: 'Masala Dosa', desc: 'Crispy rice crepe filled with spiced potato mixture', price: 250, category: 'Breakfast', cuisine: 'Indian', station_id: 'breakfast', isVeg: 1, image: 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b0?w=400&q=80' },
  { name: 'Chole Bhature', desc: 'Spicy chickpea curry served with fried bread', price: 280, category: 'Breakfast', cuisine: 'Indian', station_id: 'breakfast', isVeg: 1, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80' },
  { name: 'Idli Sambar', desc: 'Steamed rice cakes served with lentil soup', price: 200, category: 'Breakfast', cuisine: 'Indian', station_id: 'breakfast', isVeg: 1, image: 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b0?w=400&q=80' },
  { name: 'Eggs Benedict', desc: 'Poached eggs on English muffins with hollandaise', price: 320, category: 'Breakfast', cuisine: 'Continental', station_id: 'breakfast', isVeg: 0, image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400&q=80' },
  
  // Starters
  { name: 'Paneer Tikka', desc: 'Cottage cheese cubes marinated in yogurt and spices', price: 350, category: 'Starters', cuisine: 'Indian', station_id: 'indian', isVeg: 1, image: 'https://images.unsplash.com/photo-1599487405256-78b1ffbc02b8?w=400&q=80' },
  { name: 'Chicken 65', desc: 'Spicy deep-fried chicken bites', price: 380, category: 'Starters', cuisine: 'Indian', station_id: 'indian', isVeg: 0, image: 'https://images.unsplash.com/photo-1524114664604-cd8133cd67ad?w=400&q=80' },
  { name: 'Chilli Chicken Dry', desc: 'Crispy chicken tossed in spicy soy-garlic sauce', price: 420, category: 'Starters', cuisine: 'Chinese', station_id: 'chinese', isVeg: 0, image: 'https://images.unsplash.com/photo-1524114664604-cd8133cd67ad?w=400&q=80' },
  { name: 'Hara Bhara Kebab', desc: 'Vegetarian kebabs made with spinach, peas, and potatoes', price: 300, category: 'Starters', cuisine: 'Indian', station_id: 'indian', isVeg: 1, image: 'https://images.unsplash.com/photo-1599487405256-78b1ffbc02b8?w=400&q=80' },
  
  // Mains
  { name: 'Butter Chicken', desc: 'Tender chicken cooked in a rich and creamy tomato gravy', price: 550, category: 'Mains', cuisine: 'Indian', station_id: 'indian', isVeg: 0, image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80' },
  { name: 'Paneer Butter Masala', desc: 'Cottage cheese in a rich tomato gravy', price: 450, category: 'Mains', cuisine: 'Indian', station_id: 'indian', isVeg: 1, image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80' },
  { name: 'Dal Makhani', desc: 'Slow-cooked black lentils with butter and cream', price: 380, category: 'Mains', cuisine: 'Indian', station_id: 'indian', isVeg: 1, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80' },
  { name: 'Chicken Hakka Noodles', desc: 'Wok-tossed noodles with shredded chicken and vegetables', price: 350, category: 'Mains', cuisine: 'Chinese', station_id: 'chinese', isVeg: 0, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80' },
  { name: 'Mutton Rogan Josh', desc: 'Classic slow-cooked lamb curry', price: 650, category: 'Mains', cuisine: 'Indian', station_id: 'indian', isVeg: 0, image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80' },
  
  // Breads & Rice
  { name: 'Garlic Naan', desc: 'Soft flatbread baked in tandoor, topped with garlic and butter', price: 120, category: 'Mains', cuisine: 'Indian', station_id: 'indian', isVeg: 1, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80' },
  { name: 'Tandoori Roti', desc: 'Whole wheat flatbread baked in tandoor', price: 60, category: 'Mains', cuisine: 'Indian', station_id: 'indian', isVeg: 1, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80' },
  { name: 'Chicken Dum Biryani', desc: 'Fragrant basmati rice cooked with marinated chicken and aromatic spices', price: 480, category: 'Mains', cuisine: 'Indian', station_id: 'indian', isVeg: 0, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80' },
  { name: 'Steamed Basmati Rice', desc: 'Fluffy steamed basmati rice', price: 150, category: 'Mains', cuisine: 'Indian', station_id: 'indian', isVeg: 1, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80' },
  
  // Desserts
  { name: 'Gulab Jamun', desc: 'Deep-fried milk dumplings soaked in sugar syrup', price: 180, category: 'Desserts', cuisine: 'Indian', station_id: 'desserts', isVeg: 1, image: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=400&q=80' },
  { name: 'Rasmalai', desc: 'Soft cottage cheese patties in sweetened, thickened milk', price: 220, category: 'Desserts', cuisine: 'Indian', station_id: 'desserts', isVeg: 1, image: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=400&q=80' },
  { name: 'Chocolate Lava Cake', desc: 'Warm chocolate cake with a molten center', price: 250, category: 'Desserts', cuisine: 'Continental', station_id: 'desserts', isVeg: 1, image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&q=80' },
  
  // Beverages
  { name: 'Masala Chai', desc: 'Indian spiced tea brewed with milk', price: 120, category: 'Beverages', cuisine: 'Beverages', station_id: 'beverages', isVeg: 1, image: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=400&q=80' },
  { name: 'Sweet Lassi', desc: 'Traditional sweet yogurt drink', price: 150, category: 'Beverages', cuisine: 'Beverages', station_id: 'beverages', isVeg: 1, image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80' },
  { name: 'Fresh Lime Soda', desc: 'Refreshing lime drink, sweet or salted', price: 120, category: 'Beverages', cuisine: 'Beverages', station_id: 'beverages', isVeg: 1, image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80' }
];

const rooms = ['101', '102', '103', '104', '201', '202', '203', '204', '301', '302', '303', '304'];

async function runSeed() {
  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  console.log('Clearing old data...');
  await db.exec(`
    DELETE FROM menu_items;
    DELETE FROM orders;
    DELETE FROM kots;
    DELETE FROM guest_feedback;
    DELETE FROM room_bills;
  `);

  console.log('Seeding full Indian multi-cuisine menu...');
  const insertMenu = await db.prepare('INSERT INTO menu_items (name, desc, price, category, cuisine, station_id, isVeg, available, image) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)');
  for (const item of initialMenu) {
    await insertMenu.run(item.name, item.desc, item.price, item.category, item.cuisine, item.station_id, item.isVeg, item.image);
  }
  await insertMenu.finalize();

  const menuRows = await db.all('SELECT * FROM menu_items');

  console.log('Generating 50 days of historical data...');
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  const insertOrder = await db.prepare('INSERT INTO orders (id, token, room, status, type, createdAt, deliveryPreference, note, items, subtotal, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertFeedback = await db.prepare('INSERT INTO guest_feedback (order_id, room, service_rating, food_rating, suggestion, createdAt) VALUES (?, ?, ?, ?, ?, ?)');
  
  let orderId = 1000;
  
  // Seed past orders
  for (let i = 50; i >= 0; i--) {
    const dateMs = now - (i * dayMs);
    const ordersPerDay = Math.floor(Math.random() * 15) + 5; // 5 to 20 orders per day
    
    for (let j = 0; j < ordersPerDay; j++) {
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      const numItems = Math.floor(Math.random() * 4) + 1;
      const orderItems = [];
      let subtotal = 0;
      
      for (let k = 0; k < numItems; k++) {
        const menuItem = menuRows[Math.floor(Math.random() * menuRows.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        orderItems.push({ ...menuItem, qty, status: 'DONE' });
        subtotal += menuItem.price * qty;
      }
      
      const total = subtotal * 1.05; // ~5% tax
      const status = 'DELIVERED';
      const token = Math.floor(1000 + Math.random() * 9000).toString();
      const orderTime = dateMs + (Math.random() * dayMs * 0.8); // Random time during that day

      await insertOrder.run(orderId, token, room, status, 'FOOD', Math.floor(orderTime), 'ALL_AT_ONCE', '', JSON.stringify(orderItems), subtotal, total);
      
      // Randomly generate feedback for ~30% of completed orders
      if (Math.random() > 0.7) {
        const foodRating = Math.floor(Math.random() * 2) + 4; // 4 or 5
        const serviceRating = Math.floor(Math.random() * 2) + 4; // 4 or 5
        await insertFeedback.run(orderId, room, serviceRating, foodRating, '', Math.floor(orderTime + (1000 * 60 * 30)));
      }
      
      orderId++;
    }
  }

  // Seed active orders for today (for KDS)
  console.log('Seeding active orders for KDS...');
  for (let j = 0; j < 6; j++) {
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      const numItems = Math.floor(Math.random() * 3) + 1;
      const orderItems = [];
      let subtotal = 0;
      
      for (let k = 0; k < numItems; k++) {
        const menuItem = menuRows[Math.floor(Math.random() * menuRows.length)];
        const qty = Math.floor(Math.random() * 2) + 1;
        orderItems.push({ ...menuItem, qty, status: 'PENDING' });
        subtotal += menuItem.price * qty;
      }
      
      const total = subtotal * 1.05;
      const status = j < 3 ? 'NEW' : 'PREPARING'; // Some new, some preparing
      const deliveryPref = j % 2 === 0 ? 'ALL_AT_ONCE' : 'AS_READY';
      const token = Math.floor(1000 + Math.random() * 9000).toString();
      const orderTime = now - (Math.random() * 1000 * 60 * 30); // In the last 30 mins

      await insertOrder.run(orderId, token, room, status, 'FOOD', Math.floor(orderTime), deliveryPref, '', JSON.stringify(orderItems), subtotal, total);
      orderId++;
  }
  await insertOrder.finalize();
  await insertFeedback.finalize();

  console.log('Seeding room bills...');
  const insertBill = await db.prepare('INSERT INTO room_bills (room, billId, guestName, checkIn, checkOut, roomCharge, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const room of rooms) {
    const isActive = Math.random() > 0.3; // 70% rooms occupied
    if (isActive) {
      await insertBill.run(
        room, 
        `bill_${Date.now()}_${room}`, 
        `Guest ${room}`, 
        new Date(now - 2 * dayMs).toISOString().split('T')[0], 
        new Date(now + 2 * dayMs).toISOString().split('T')[0], 
        4500, 
        'OPEN'
      );
    } else {
      await insertBill.run(room, '', '', '', '', 0, 'CLOSED');
    }
  }
  await insertBill.finalize();

  console.log('Database seeded successfully! You can now start the server.');
  await db.close();
}

runSeed().catch(console.error);

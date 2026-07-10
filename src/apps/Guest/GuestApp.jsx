import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, ChevronLeft, CheckCircle, MapPin, Phone,
  Search, SlidersHorizontal, Star, Clock, Flame, Utensils, HelpCircle
} from 'lucide-react';
import { C } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { VegDot } from '../../components/ui/VegDot';
import { CONFIG } from '../../config';

const getMealTimeConfig = (hour) => {
  if (hour >= 5 && hour < 11) {
    return {
      mealName: 'Breakfast',
      tagline: 'Fresh morning start to your day',
      defaultCategory: 'Breakfast',
      special: {
        id: 3,
        name: 'Eggs Benedict',
        desc: 'Poached eggs on toasted English muffins, topped with smoked ham and rich, velvety hollandaise sauce.',
        price: 320,
        isVeg: false,
        image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400&q=80',
        prepTime: '10 min',
        calories: '380 kcal',
        rating: 4.8
      }
    };
  } else if (hour >= 11 && hour < 16) {
    return {
      mealName: 'Lunch',
      tagline: 'Hearty and energizing meals',
      defaultCategory: 'Mains',
      special: {
        id: 7,
        name: 'Grilled Salmon',
        desc: 'Fresh Atlantic salmon fillet, flame-grilled and served with tender grilled asparagus and lemon-butter glaze.',
        price: 550,
        isVeg: false,
        image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=400&q=80',
        prepTime: '15 min',
        calories: '450 kcal',
        rating: 4.9
      }
    };
  } else if (hour >= 16 && hour < 19) {
    return {
      mealName: 'Snacks & Starters',
      tagline: 'Slight bites for perfect evenings',
      defaultCategory: 'Starters',
      special: {
        id: 5,
        name: 'Buffalo Wings',
        desc: 'Crispy chicken wings tossed in spicy buffalo sauce, served with cool celery sticks and rich blue cheese dip.',
        price: 280,
        isVeg: false,
        image: 'https://images.unsplash.com/photo-1524114664604-cd8133cd67ad?w=400&q=80',
        prepTime: '8 min',
        calories: '320 kcal',
        rating: 4.7
      }
    };
  } else if (hour >= 19 && hour < 23) {
    return {
      mealName: 'Dinner',
      tagline: "Chef's signature evening recipes",
      defaultCategory: 'Mains',
      special: {
        id: 'special-1',
        name: "Chef's Butter Chicken",
        desc: 'Tender tandoori chicken simmered in a rich, creamy spiced tomato butter sauce, served with freshly baked butter naan.',
        price: 499,
        isVeg: false,
        image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80',
        prepTime: '12 min',
        calories: '540 kcal',
        rating: 4.9
      }
    };
  } else {
    return {
      mealName: 'Late Night',
      tagline: 'Sweet cravings & late night treats',
      defaultCategory: 'Desserts',
      special: {
        id: 10,
        name: 'Chocolate Lava Cake',
        desc: 'Rich chocolate cake with a warm, gooey molten chocolate core, served with a scoop of vanilla bean ice cream.',
        price: 220,
        isVeg: true,
        image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&q=80',
        prepTime: '6 min',
        calories: '290 kcal',
        rating: 4.8
      }
    };
  }
};

const getItemMeta = (item) => {
  const seed = typeof item.id === 'number' ? item.id : 99;
  const rating = (4.4 + (seed % 6) * 0.1).toFixed(1);
  const time = 8 + (seed % 3) * 4;
  const calories = 120 + (seed % 5) * 85;
  return { rating, time: `${time} min`, calories: `${calories} kcal` };
};

export const GuestApp = ({ menuItems, orders, setOrders, socketConnected, config = CONFIG }) => {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const currentHour = new Date().getHours();
  const mealConfig = getMealTimeConfig(currentHour);

  const [currentScreen, setCurrentScreen] = useState('menu');
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState(mealConfig.defaultCategory);
  const [specialNote, setSpecialNote] = useState('');
  const [lastOrderId, setLastOrderId] = useState(null);
  const [deliveryPreference, setDeliveryPreference] = useState('ALL_AT_ONCE');

  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const [vegOnly, setVegOnly] = useState(false);

  // Room number comes from QR URL parameter (?room=XXX) — locked to ROOM_SERVICE
  const [roomNumber, setRoomNumber] = useState(config?.defaultRoom || '101');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    if (urlRoom) setRoomNumber(urlRoom);
    else setRoomNumber(config?.defaultRoom || '101');
  }, [config]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCustomizations, setSelectedCustomizations] = useState({});
  const [modalInstructions, setModalInstructions] = useState({});

  const categories = ['All', ...new Set(menuItems.map(i => i.category))];

  const displayedItems = menuItems.filter(i => {
    const matchesCategory = activeCategory === 'All' || i.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.desc && i.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesVeg = !vegOnly || i.isVeg;
    return i.available && matchesCategory && matchesSearch && matchesVeg;
  });

  const updateQty = (item, delta) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        const newQty = existing.qty + delta;
        if (newQty <= 0) {
          showToast(`Removed ${item.name} from cart`);
          return prev.filter(i => i.id !== item.id);
        }
        return prev.map(i => i.id === item.id ? { ...i, qty: newQty } : i);
      }
      if (delta > 0) {
        showToast(`Added ${item.name} to cart`);
        return [...prev, { ...item, qty: 1 }];
      }
      return prev;
    });
  };

  const getQty = (id) => cart.find(i => i.id === id)?.qty || 0;

  const getItemUnitPrice = (item) => {
    let price = item.price;
    if (selectedCustomizations[`${item.id}-opt-portions`]) price += Math.round(item.price * 0.4);
    if (selectedCustomizations[`${item.id}-opt-extra`]) price += 40;
    return price;
  };

  const cartTotalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (getItemUnitPrice(item) * item.qty), 0);
  const cgst = cartSubtotal * 0.025;
  const sgst = cartSubtotal * 0.025;
  const serviceCharge = cartSubtotal * 0.10;
  const grandTotal = cartSubtotal + cgst + sgst + serviceCharge;

  const placeOrder = () => {
    if (cart.length === 0) return;
    const newOrder = {
      id: Date.now(),
      token: `#${orders.length + 10}`,
      room: roomNumber,
      status: 'NEW',
      minutesAgo: 0,
      deliveryPreference,
      items: cart.map(i => {
        const itemCustomizations = [];
        if (selectedCustomizations[`${i.id}-opt-spicy`]) itemCustomizations.push('Spicy');
        if (selectedCustomizations[`${i.id}-opt-portions`]) itemCustomizations.push('Double Portion');
        if (selectedCustomizations[`${i.id}-opt-extra`]) itemCustomizations.push('Chef Special Sauce');
        const extraNote = modalInstructions[i.id] ? `(${modalInstructions[i.id]})` : '';
        const customString = itemCustomizations.length > 0 ? ` [${itemCustomizations.join(', ')}]` : '';
        return {
          id: Date.now() + Math.random(),
          name: `${i.name}${customString} ${extraNote}`.trim(),
          qty: i.qty,
          price: getItemUnitPrice(i),
          status: 'PENDING'
        };
      }),
      note: specialNote,
      subtotal: cartSubtotal,
      total: grandTotal
    };

    setOrders([newOrder, ...orders]);
    setLastOrderId(newOrder.id);
    setCart([]);
    setSpecialNote('');
    setSelectedCustomizations({});
    setModalInstructions({});
    setDeliveryPreference('ALL_AT_ONCE');
    showToast('Order sent to kitchen! 🚀');
    setCurrentScreen('tracking');
  };

  const trackingOrder = orders.find(o => o.id === lastOrderId) || orders.find(o => o.room === roomNumber);

  return (
    <div style={{
      maxWidth: 480,
      margin: '0 auto',
      minHeight: '100vh',
      background: C.sand,
      position: 'relative',
      paddingBottom: 110,
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
      color: C.text
    }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#071428', color: '#FFFFFF', padding: '14px 24px', borderRadius: 20,
          boxShadow: '0 12px 36px rgba(0,0,0,0.22)', zIndex: 99999,
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13, fontWeight: 750, width: 'calc(100% - 48px)', maxWidth: 380,
          boxSizing: 'border-box', animation: 'fadeIn 0.2s ease-out'
        }}>
          <CheckCircle size={16} color={C.brass} style={{ flexShrink: 0 }} />
          <span>{toast}</span>
        </div>
      )}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .serif { font-family: 'Playfair Display', Georgia, serif; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.25s ease-out forwards; }
        .bounce-badge { animation: bounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes bounce { 0% { transform: scale(0.3); } 50% { transform: scale(1.1); } 100% { transform: scale(1.0); } }
      `}</style>

      {/* MENU SCREEN */}
      {currentScreen === 'menu' && (
        <div className="animate-fade-in">
          {/* Sticky Header */}
          <div style={{ position: 'sticky', top: 0, zIndex: 100, background: C.white, padding: '18px 20px', boxShadow: '0 6px 24px rgba(6,6,6,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h1 className="serif" style={{ color: C.emerald, fontSize: 20, margin: 0, fontWeight: 800 }}>{config?.shortName}</h1>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: socketConnected ? '#10B981' : C.danger, boxShadow: socketConnected ? '0 0 8px #10B981' : 'none' }}></div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.brass, fontSize: 13, marginTop: 5, background: `${C.brass}12`, padding: '4px 10px', borderRadius: 8 }}>
                  <MapPin size={12} />
                  <span style={{ fontWeight: 750 }}>Room {roomNumber}</span>
                </div>
              </div>
              <button onClick={() => setCurrentScreen('cart')} style={{ position: 'relative', background: `${C.brass}15`, padding: 10, borderRadius: 12, border: 'none', cursor: 'pointer' }}>
                <ShoppingCart size={18} color={C.brass} />
                {cartTotalQty > 0 && (
                  <div className="bounce-badge" style={{ position: 'absolute', top: -5, right: -5, background: C.danger, color: C.white, fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)' }}>
                    {cartTotalQty}
                  </div>
                )}
              </button>
            </div>

            {/* Search */}
            <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} color={C.textMuted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search dishes, drinks, desserts..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px 12px 38px', borderRadius: 14, border: 'none', background: C.borderLight, fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>
              <button
                onClick={() => { setVegOnly(!vegOnly); showToast(vegOnly ? 'Showing all items' : 'Filtered: Vegetarian only 🥬'); }}
                style={{ background: vegOnly ? `${C.brass}20` : C.borderLight, border: `1.5px solid ${vegOnly ? C.brass : 'transparent'}`, borderRadius: 12, padding: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              >
                <SlidersHorizontal size={16} color={vegOnly ? C.brass : C.textSub} />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="hide-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto', marginTop: 16, paddingBottom: 4 }}>
              {categories.map(cat => {
                const isSelected = activeCategory === cat;
                const isRecommended = cat === mealConfig.defaultCategory;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: 16, fontSize: 13, fontWeight: 700, border: 'none', background: isSelected ? C.brass : C.borderLight, color: isSelected ? C.white : C.textSub, boxShadow: isSelected ? `0 6px 16px ${C.brass}30` : 'none', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
                  >
                    {isRecommended && <span>🕒</span>}
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Meal Special Banner */}
            <div style={{ background: `linear-gradient(135deg, ${C.brass} 0%, #C2801E 100%)`, borderRadius: 24, padding: '20px 24px', color: C.white, position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px rgba(184, 139, 58, 0.15)' }}>
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }}></div>
              <div style={{ width: '60%', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                  🕒 {mealConfig.mealName} Special
                </div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1.2, color: C.white }}>{mealConfig.special.name}</h3>
                <p style={{ margin: '6px 0 16px 0', fontSize: 12, opacity: 0.9, lineHeight: 1.3 }}>Limited time recipe crafted by our head chef.</p>
                {(() => {
                  const specialQty = getQty(mealConfig.special.id);
                  return (
                    <button
                      onClick={() => setSelectedItem(mealConfig.special)}
                      style={{ background: C.white, color: C.brass, border: 'none', padding: '10px 18px', borderRadius: 12, fontWeight: 800, fontSize: 12, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'inherit' }}
                    >
                      {specialQty > 0 ? `In Cart (${specialQty}) · Customize` : `Order Now (₹${mealConfig.special.price})`}
                    </button>
                  );
                })()}
              </div>
              {mealConfig.special.image && (
                <div style={{ position: 'absolute', top: '50%', right: 14, transform: 'translateY(-50%)', width: 110, height: 110, borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(255,255,255,0.25)', boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}>
                  <img src={mealConfig.special.image} alt={mealConfig.special.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            {/* Popular Picks Horizontal Slider */}
            {(() => {
              const items = menuItems.filter(i => i.available).slice(0, 3);
              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>Trusted Picks for You</h3>
                    <span style={{ color: C.brass, fontSize: 13, fontWeight: 700 }}>Popular choices</span>
                  </div>
                  <div className="hide-scrollbar" style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6 }}>
                    {items.map((item, idx) => {
                      const meta = getItemMeta(item);
                      const qty = getQty(item.id);
                      return (
                        <div key={idx} style={{ minWidth: 200, maxWidth: 200, display: 'flex', cursor: 'pointer' }} onClick={() => setSelectedItem(item)}>
                          <Card style={{ padding: 0, width: '100%', position: 'relative', overflow: 'hidden', borderRadius: 20, border: qty > 0 ? `1.5px solid ${C.brass}` : '1px solid rgba(0,0,0,0.03)', boxShadow: qty > 0 ? `0 8px 24px ${C.brass}15` : '0 4px 16px rgba(15,27,43,0.03)', background: qty > 0 ? `${C.brass}05` : C.white, transition: 'all 0.2s' }}>
                            <div style={{ height: 120, position: 'relative', background: C.borderLight }}>
                              {item.image ? (
                                <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Utensils size={32} style={{ opacity: 0.2 }} /></div>
                              )}
                              <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                                <Star size={10} color="#F59E0B" fill="#F59E0B" />
                                <span style={{ fontSize: 10, fontWeight: 800, color: C.text }}>{meta.rating}</span>
                              </div>
                            </div>
                            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h4>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: C.textSub }}>
                                <span>{meta.time}</span><span>·</span><span>{meta.calories}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }} onClick={e => e.stopPropagation()}>
                                <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>₹{item.price}</span>
                                {qty === 0 ? (
                                  <button onClick={() => setSelectedItem(item)} style={{ background: C.brass, color: C.white, border: 'none', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, fontWeight: 'bold', boxShadow: `0 4px 10px ${C.brass}30` }}>+</button>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1.5px solid ${C.brass}`, borderRadius: 8, padding: '2px 8px' }}>
                                    <button onClick={() => updateQty(item, -1)} style={{ background: 'none', border: 'none', color: C.brass, fontWeight: 850, fontSize: 12, cursor: 'pointer', padding: 0 }}>−</button>
                                    <span style={{ fontWeight: 800, color: C.text, fontSize: 12, minWidth: 10, textAlign: 'center' }}>{qty}</span>
                                    <button onClick={() => updateQty(item, 1)} style={{ background: 'none', border: 'none', color: C.brass, fontWeight: 850, fontSize: 12, cursor: 'pointer', padding: 0 }}>+</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Full Menu List */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 800, color: C.text }}>Our Menu</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {displayedItems.map((item, idx) => {
                  const qty = getQty(item.id);
                  const meta = getItemMeta(item);
                  const isTimingHighlight = item.category === mealConfig.defaultCategory;
                  return (
                    <Card
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      style={{ padding: 12, display: 'flex', gap: 14, alignItems: 'center', height: 128, boxSizing: 'border-box', animationDelay: `${idx * 0.04}s`, borderRadius: 20, border: qty > 0 ? `1.5px solid ${C.brass}` : (isTimingHighlight ? `1.5px solid ${C.brass}45` : '1px solid rgba(0,0,0,0.03)'), boxShadow: qty > 0 ? `0 8px 24px ${C.brass}15` : (isTimingHighlight ? `0 8px 24px ${C.brass}08` : 'none'), background: qty > 0 ? `${C.brass}05` : C.white, cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}
                      className="animate-fade-in"
                    >
                      <div style={{ width: 104, height: 104, borderRadius: 16, overflow: 'hidden', flexShrink: 0, position: 'relative', background: C.borderLight }}>
                        {item.image ? (
                          <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Utensils size={24} style={{ opacity: 0.2 }} /></div>
                        )}
                        <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(255,255,255,0.95)', padding: '2px 4px', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                          <VegDot isVeg={item.isVeg} />
                        </div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <h3 style={{ fontSize: 15, color: C.text, margin: 0, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{item.name}</h3>
                            <div style={{ fontWeight: 800, color: C.text, fontSize: 15 }}>₹{item.price}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Star size={10} color="#F59E0B" fill="#F59E0B" />
                              <span style={{ fontSize: 10, fontWeight: 700, color: C.textSub }}>{meta.rating}</span>
                            </div>
                            <span style={{ color: C.textMuted, fontSize: 10 }}>·</span>
                            <span style={{ fontSize: 10, color: C.textSub }}>{meta.time}</span>
                          </div>
                          <p style={{ color: C.textSub, fontSize: 11, lineHeight: 1.3, margin: '6px 0 0 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {item.desc || 'Freshly prepared for you.'}
                          </p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                          {isTimingHighlight ? (
                            <span style={{ fontSize: 9, background: `${C.brass}15`, color: C.brass, padding: '2px 6px', borderRadius: 4, fontWeight: 800, textTransform: 'uppercase' }}>
                              🕒 {mealConfig.mealName} Hit
                            </span>
                          ) : <div />}
                          <div onClick={e => e.stopPropagation()}>
                            {qty === 0 ? (
                              <button onClick={() => setSelectedItem(item)} style={{ background: C.brass, color: C.white, padding: '5px 12px', borderRadius: 8, fontWeight: 700, fontSize: 11, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>+ ADD</button>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1.5px solid ${C.brass}`, borderRadius: 8, padding: '2px 8px' }}>
                                <button onClick={() => updateQty(item, -1)} style={{ background: 'none', border: 'none', color: C.brass, fontWeight: 850, fontSize: 12, cursor: 'pointer' }}>−</button>
                                <span style={{ fontWeight: 800, color: C.text, fontSize: 12, minWidth: 10, textAlign: 'center' }}>{qty}</span>
                                <button onClick={() => updateQty(item, 1)} style={{ background: 'none', border: 'none', color: C.brass, fontWeight: 850, fontSize: 12, cursor: 'pointer' }}>+</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART SCREEN */}
      {currentScreen === 'cart' && (
        <div className="animate-fade-in" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
            <button onClick={() => setCurrentScreen('menu')} style={{ border: 'none', padding: 8, background: C.white, borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
              <ChevronLeft size={20} />
            </button>
            <h2 className="serif" style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: 20, fontWeight: 800 }}>Your Order</h2>
            <div style={{ width: 36 }}></div>
          </div>

          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 60, padding: 20 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: C.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                <ShoppingCart size={32} color={C.textMuted} />
              </div>
              <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>Your cart is empty</h3>
              <p style={{ color: C.textSub, fontSize: 14, margin: '0 0 24px 0' }}>Add dishes from the menu to place an order.</p>
              <button onClick={() => setCurrentScreen('menu')} style={{ background: C.brass, color: C.white, border: 'none', padding: '14px 28px', borderRadius: 16, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: `0 6px 20px ${C.brass}30`, fontFamily: 'inherit' }}>
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                {cart.map((item) => {
                  const unitPrice = getItemUnitPrice(item);
                  const itemCustomizations = [];
                  if (selectedCustomizations[`${item.id}-opt-spicy`]) itemCustomizations.push('Spicy');
                  if (selectedCustomizations[`${item.id}-opt-portions`]) itemCustomizations.push('Double Portion');
                  if (selectedCustomizations[`${item.id}-opt-extra`]) itemCustomizations.push('Chef Special Sauce');
                  const itemInstructions = modalInstructions[item.id];
                  return (
                    <Card key={item.id} style={{ padding: 16, border: 'none', borderRadius: 20, boxShadow: '0 4px 16px rgba(15,27,43,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <VegDot isVeg={item.isVeg} />
                            <span style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{item.name}</span>
                          </div>
                          {itemCustomizations.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                              {itemCustomizations.map(c => (
                                <span key={c} style={{ fontSize: 10, background: C.borderLight, color: C.textSub, padding: '2px 6px', borderRadius: 6, fontWeight: 600 }}>{c}</span>
                              ))}
                            </div>
                          )}
                          {itemInstructions && (
                            <p style={{ margin: '6px 0 0 0', fontSize: 12, color: C.brass, fontStyle: 'italic' }}>"{itemInstructions}"</p>
                          )}
                          <div style={{ color: C.textSub, fontSize: 13, marginTop: 8, fontWeight: 600 }}>₹{unitPrice} each</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                          <span style={{ fontWeight: 800, color: C.brass, fontSize: 15 }}>₹{unitPrice * item.qty}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.borderLight, borderRadius: 8, padding: '4px 8px' }}>
                            <button onClick={() => updateQty(item, -1)} style={{ border: 'none', background: 'none', color: C.text, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>−</button>
                            <span style={{ fontWeight: 700, width: 14, textAlign: 'center', fontSize: 13, color: C.text }}>{item.qty}</span>
                            <button onClick={() => updateQty(item, 1)} style={{ border: 'none', background: 'none', color: C.text, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>+</button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Delivery Location (locked) */}
              <Card style={{ padding: 16, border: 'none', borderRadius: 20, marginBottom: 20, boxShadow: '0 4px 16px rgba(15,27,43,0.03)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: C.text, margin: '0 0 12px 0' }}>Delivery Location</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.borderLight, padding: 12, borderRadius: 12 }}>
                  <MapPin size={18} color={C.brass} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>In-room Dining</div>
                    <div style={{ fontSize: 12, color: C.textSub }}>Delivered to Room {roomNumber}</div>
                  </div>
                </div>
              </Card>

              {/* Preferences */}
              <Card style={{ padding: 16, border: 'none', borderRadius: 20, marginBottom: 20, boxShadow: '0 4px 16px rgba(15,27,43,0.03)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 12, marginTop: 0 }}>Preparation Preference</h3>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <button onClick={() => setDeliveryPreference('ALL_AT_ONCE')} style={{ flex: 1, padding: 12, borderRadius: 12, border: `1.5px solid ${deliveryPreference === 'ALL_AT_ONCE' ? C.brass : C.border}`, background: deliveryPreference === 'ALL_AT_ONCE' ? `${C.brass}10` : C.white, color: deliveryPreference === 'ALL_AT_ONCE' ? C.brass : C.textSub, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}>All at once</button>
                  <button onClick={() => setDeliveryPreference('AS_READY')} style={{ flex: 1, padding: 12, borderRadius: 12, border: `1.5px solid ${deliveryPreference === 'AS_READY' ? C.brass : C.border}`, background: deliveryPreference === 'AS_READY' ? `${C.brass}10` : C.white, color: deliveryPreference === 'AS_READY' ? C.brass : C.textSub, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}>As soon as ready</button>
                </div>
                <textarea
                  placeholder="Any allergies, spice level, or special timing instructions?"
                  value={specialNote}
                  onChange={e => setSpecialNote(e.target.value)}
                  style={{ width: '100%', border: 'none', background: C.borderLight, borderRadius: 12, padding: 12, fontSize: 13, minHeight: 60, resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </Card>

              {/* Bill Summary */}
              <Card style={{ padding: 20, border: 'none', borderRadius: 20, marginBottom: 30, boxShadow: '0 4px 16px rgba(15,27,43,0.03)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: C.text, marginTop: 0, marginBottom: 14 }}>Bill Summary</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: C.textSub, fontSize: 13 }}>
                  <span>Item Subtotal</span><span style={{ fontWeight: 600 }}>₹{cartSubtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: C.textSub, fontSize: 13 }}>
                  <span>CGST (2.5%)</span><span style={{ fontWeight: 600 }}>₹{cgst.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: C.textSub, fontSize: 13 }}>
                  <span>SGST (2.5%)</span><span style={{ fontWeight: 600 }}>₹{sgst.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, color: C.textSub, fontSize: 13 }}>
                  <span>Service Charge (10%)</span><span style={{ fontWeight: 600 }}>₹{serviceCharge.toFixed(2)}</span>
                </div>
                <div style={{ borderTop: `1px dashed ${C.border}`, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: C.text }}>Grand Total</span>
                  <span style={{ fontWeight: 900, fontSize: 20, color: C.brass }}>₹{grandTotal.toFixed(0)}</span>
                </div>
              </Card>

              <button
                onClick={placeOrder}
                style={{ width: '100%', background: C.brass, color: C.white, padding: 18, borderRadius: 20, fontWeight: 800, fontSize: 16, border: 'none', cursor: 'pointer', boxShadow: `0 8px 24px ${C.brass}40`, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 40, fontFamily: 'inherit' }}
              >
                Send Order to Kitchen 🚀
              </button>
            </>
          )}
        </div>
      )}

      {/* TRACKING SCREEN */}
      {currentScreen === 'tracking' && (
        <div className="animate-fade-in" style={{ padding: 24, textAlign: 'center' }}>
          {trackingOrder ? (
            <>
              <div style={{ display: 'inline-flex', background: `${C.brass}15`, padding: 16, borderRadius: '50%', marginBottom: 16 }}>
                <CheckCircle size={40} color={C.brass} />
              </div>
              <h2 className="serif" style={{ color: C.text, fontSize: 24, margin: '0 0 4px 0', fontWeight: 800 }}>Order Confirmed</h2>
              <p style={{ color: C.textSub, fontSize: 14, margin: '0 0 24px 0' }}>The kitchen is preparing your dishes.</p>

              <div style={{ background: `linear-gradient(135deg, ${C.emerald} 0%, #152E4B 100%)`, borderRadius: 24, padding: '24px 20px', marginTop: 20, marginBottom: 24, color: C.white, boxShadow: '0 12px 32px rgba(7,20,40,0.15)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, opacity: 0.8, textTransform: 'uppercase' }}>Your Order Token</div>
                <div className="serif" style={{ fontSize: 56, color: C.brass, margin: '6px 0', fontWeight: 700 }}>{trackingOrder.token}</div>
                <div style={{ opacity: 0.2, borderTop: '1px solid rgba(255,255,255,0.4)', margin: '16px 0' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 15, fontWeight: 650 }}>
                  <MapPin size={16} color={C.brass} /> Room {trackingOrder.room}
                </div>
              </div>

              {/* Progress Stepper */}
              <Card style={{ padding: 24, textAlign: 'left', border: 'none', borderRadius: 24, marginBottom: 24, boxShadow: '0 4px 16px rgba(15,27,43,0.03)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 16px 0', color: C.text }}>Live Progress</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 22, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 11, top: 12, bottom: 12, width: 2, background: C.borderLight, zIndex: 0 }}></div>
                  {['NEW', 'PREPARING', 'DELIVERED'].map((step, idx) => {
                    const statuses = ['NEW', 'PREPARING', 'DELIVERED'];
                    const currentIdx = statuses.indexOf(trackingOrder.status === 'ON_THE_WAY' ? 'DELIVERED' : trackingOrder.status);
                    const isPast = idx < currentIdx;
                    const isActive = idx === currentIdx;
                    const labels = { 'NEW': 'Order Placed', 'PREPARING': 'Being Prepared in Kitchen', 'DELIVERED': 'Delivered to Room' };
                    return (
                      <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 16, zIndex: 1, position: 'relative' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: isPast ? C.brass : isActive ? C.brass : C.white, border: `2px solid ${isPast ? C.brass : isActive ? C.brass : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isPast && <CheckCircle size={14} color={C.white} />}
                          {isActive && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.white }}></div>}
                        </div>
                        <span style={{ fontWeight: isActive ? 800 : 600, color: isActive ? C.text : isPast ? C.textSub : C.textMuted, fontSize: 14 }}>{labels[step]}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Items Summary */}
              <Card style={{ padding: 20, textAlign: 'left', border: 'none', borderRadius: 24, marginBottom: 24, boxShadow: '0 4px 16px rgba(15,27,43,0.03)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, color: C.text }}>Items Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {trackingOrder.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                      <span style={{ color: C.text, fontWeight: 600 }}>{item.qty}× {item.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.brass }}>₹{item.price * item.qty}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <button onClick={() => setCurrentScreen('menu')} style={{ background: 'none', border: 'none', color: C.brass, fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
                ← Back to Menu
              </button>
            </>
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: C.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                <Clock size={32} color={C.textMuted} />
              </div>
              <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>No Active Orders</h3>
              <p style={{ color: C.textSub, fontSize: 14, margin: '0 0 24px 0' }}>You don't have any active orders right now.</p>
              <button onClick={() => setCurrentScreen('menu')} style={{ background: C.brass, color: C.white, border: 'none', padding: '14px 28px', borderRadius: 16, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: `0 6px 20px ${C.brass}30`, fontFamily: 'inherit' }}>
                Go to Menu
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUPPORT SCREEN */}
      {currentScreen === 'support' && (
        <div className="animate-fade-in" style={{ padding: 24 }}>
          <h2 className="serif" style={{ margin: '0 0 8px 0', fontSize: 24, fontWeight: 800, color: C.text }}>Hotel Directory</h2>
          <p style={{ color: C.textSub, fontSize: 14, margin: '0 0 24px 0' }}>Need assistance during your stay? We are here to help.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
            <Card style={{ padding: 16, border: 'none', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 16px rgba(15,27,43,0.03)' }}>
              <div style={{ background: `${C.brass}15`, padding: 12, borderRadius: '50%' }}><Phone size={20} color={C.brass} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>In-room Service Desk</div>
                <div style={{ color: C.textSub, fontSize: 13 }}>Dial Extension 9 or Call Reception</div>
              </div>
              <a href="tel:9" style={{ background: C.brass, color: C.white, textDecoration: 'none', padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>Call</a>
            </Card>

            <Card style={{ padding: 16, border: 'none', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 16px rgba(15,27,43,0.03)' }}>
              <div style={{ background: `${C.brass}15`, padding: 12, borderRadius: '50%' }}><Clock size={20} color={C.brass} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>Housekeeping Request</div>
                <div style={{ color: C.textSub, fontSize: 13 }}>Available 24/7 · Extension 3</div>
              </div>
              <button onClick={() => showToast(`Housekeeping requested for Room ${roomNumber}!`)} style={{ background: C.brass, color: C.white, border: 'none', padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Request</button>
            </Card>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: '0 0 16px 0' }}>Useful Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { title: '📶 High-Speed Wi-Fi', desc: `Network: ${config?.shortName}_Guest · Password: ${config?.shortName?.toLowerCase()}2026`, copyText: `${config?.shortName?.toLowerCase()}2026` },
              { title: '🍳 Restaurant Timings', desc: 'Breakfast: 6:30 AM - 10:30 AM · Dinner: 7:00 PM - 11:00 PM' },
              { title: '🏊 Swimming Pool & Gym', desc: 'Located on 4th Floor · Open 6:00 AM - 10:00 PM' },
              { title: '🔑 Express Check-out', desc: 'Standard check-out time is 12:00 PM. Dial reception to request a late checkout.' }
            ].map((info, idx) => (
              <Card
                key={idx}
                onClick={() => {
                  if (info.copyText) { navigator.clipboard.writeText(info.copyText); showToast('Wi-Fi Password copied! 📋'); }
                  else showToast(`Info: ${info.title}`);
                }}
                style={{ padding: 16, border: 'none', borderRadius: 16, background: C.borderLight, boxShadow: 'none', cursor: 'pointer', transition: 'transform 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 4 }}>{info.title}</div>
                <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.4 }}>{info.desc}</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: 448, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderRadius: 24, padding: '10px 14px', boxShadow: '0 10px 30px rgba(15,27,43,0.08)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 999 }}>
        {[
          { id: 'menu', icon: Utensils, label: 'Menu' },
          { id: 'cart', icon: ShoppingCart, label: 'My Order', count: cartTotalQty },
          { id: 'tracking', icon: Clock, label: 'Track' },
          { id: 'support', icon: HelpCircle, label: 'Support' }
        ].map(tab => {
          const isActive = currentScreen === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentScreen(tab.id)}
              style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 16, cursor: 'pointer', position: 'relative', color: isActive ? C.brass : C.textSub, transition: 'all 0.2s', fontFamily: 'inherit' }}
            >
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, background: isActive ? `${C.brass}12` : 'transparent', borderRadius: 16, transform: isActive ? 'scale(1)' : 'scale(0.8)', opacity: isActive ? 1 : 0, transition: 'all 0.2s' }}></div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={isActive ? C.brass : C.textSub} style={{ transition: 'color 0.2s' }} />
                {tab.count > 0 && (
                  <div style={{ position: 'absolute', top: -6, right: -10, background: C.danger, color: C.white, fontSize: 9, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxShadow: '0 2px 6px rgba(239,68,68,0.3)' }}>
                    {tab.count}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, transition: 'color 0.2s', zIndex: 1 }}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Item Detail Modal (Bottom Sheet) */}
      {selectedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,27,43,0.65)', backdropFilter: 'blur(5px)', zIndex: 1100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setSelectedItem(null)}>
          <div className="animate-slide-up" style={{ background: C.white, width: '100%', maxWidth: 480, borderTopLeftRadius: 32, borderTopRightRadius: 32, boxSizing: 'border-box', boxShadow: '0 -10px 40px rgba(0,0,0,0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'relative', height: 240, background: C.borderLight, flexShrink: 0 }}>
              {selectedItem.image ? (
                <img src={selectedItem.image} alt={selectedItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.textSub }}><Utensils size={48} style={{ opacity: 0.3 }} /></div>
              )}
              <button onClick={() => setSelectedItem(null)} style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                <ChevronLeft size={22} color={C.text} />
              </button>
              <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.95)', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                <VegDot isVeg={selectedItem.isVeg} />
              </div>
            </div>

            <div className="hide-scrollbar" style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h2 className="serif" style={{ margin: 0, fontSize: 22, color: C.text, fontWeight: 800 }}>{selectedItem.name}</h2>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.brass }}>₹{selectedItem.price}</div>
              </div>

              {(() => {
                const meta = getItemMeta(selectedItem);
                return (
                  <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.borderLight, padding: '6px 12px', borderRadius: 10 }}>
                      <Star size={14} color="#F59E0B" fill="#F59E0B" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{meta.rating}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.borderLight, padding: '6px 12px', borderRadius: 10 }}>
                      <Clock size={14} color={C.textSub} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.textSub }}>{meta.time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.borderLight, padding: '6px 12px', borderRadius: 10 }}>
                      <Flame size={14} color="#EF4444" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.textSub }}>{meta.calories}</span>
                    </div>
                  </div>
                );
              })()}

              <p style={{ color: C.textSub, fontSize: 14, lineHeight: 1.5, margin: '0 0 24px 0' }}>
                {selectedItem.desc || 'Prepared fresh by our expert chefs using premium ingredients.'}
              </p>

              {/* Customize Options */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: 0.5, color: C.text }}>Customize Options</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { id: 'opt-spicy', label: 'Make it extra spicy', price: 0 },
                    { id: 'opt-portions', label: 'Double portion size', price: Math.round(selectedItem.price * 0.4) },
                    { id: 'opt-extra', label: 'Add Chef Special Sauce', price: 40 }
                  ].map(opt => {
                    const optionKey = `${selectedItem.id}-${opt.id}`;
                    const isChecked = selectedCustomizations[optionKey] || false;
                    return (
                      <label key={opt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 12, background: isChecked ? `${C.brass}08` : C.borderLight, border: `1.5px solid ${isChecked ? C.brass : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input type="checkbox" checked={isChecked} onChange={() => setSelectedCustomizations(prev => ({ ...prev, [optionKey]: !isChecked }))} style={{ accentColor: C.brass, width: 16, height: 16 }} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{opt.label}</span>
                        </div>
                        {opt.price > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: C.brass }}>+₹{opt.price}</span>}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Special Instructions */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: 0.5, color: C.text }}>Special Instructions</h3>
                <textarea
                  placeholder="Allergies, spice preferences, or any other details..."
                  value={modalInstructions[selectedItem.id] || ''}
                  onChange={e => setModalInstructions(prev => ({ ...prev, [selectedItem.id]: e.target.value }))}
                  style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 80, resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, background: C.white, display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
              {(() => {
                const qty = getQty(selectedItem.id);
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, border: `1.5px solid ${C.brass}`, borderRadius: 12, padding: '8px 16px', background: C.white }}>
                    <button onClick={() => { if (qty > 0) updateQty(selectedItem, -1); }} style={{ border: 'none', background: 'none', color: C.brass, fontWeight: 800, fontSize: 20, cursor: 'pointer', padding: '0 4px' }}>−</button>
                    <span style={{ fontWeight: 800, color: C.text, fontSize: 16, minWidth: 20, textAlign: 'center' }}>{qty}</span>
                    <button onClick={() => updateQty(selectedItem, 1)} style={{ border: 'none', background: 'none', color: C.brass, fontWeight: 800, fontSize: 20, cursor: 'pointer', padding: '0 4px' }}>+</button>
                  </div>
                );
              })()}
              {(() => {
                const qty = getQty(selectedItem.id);
                const extraCost = [
                  { id: 'opt-spicy', price: 0 },
                  { id: 'opt-portions', price: Math.round(selectedItem.price * 0.4) },
                  { id: 'opt-extra', price: 40 }
                ].reduce((acc, opt) => acc + (selectedCustomizations[`${selectedItem.id}-${opt.id}`] ? opt.price : 0), 0);
                const itemUnitTotal = selectedItem.price + extraCost;
                return (
                  <button
                    onClick={() => { if (qty === 0) { updateQty(selectedItem, 1); } setSelectedItem(null); }}
                    style={{ flex: 1, background: C.brass, color: C.white, padding: '14px 20px', borderRadius: 16, border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: `0 6px 20px ${C.brass}30`, textAlign: 'center', fontFamily: 'inherit' }}
                  >
                    {qty > 0 ? `Update Order · ₹${(itemUnitTotal * qty).toFixed(0)}` : `Add to Order · ₹${itemUnitTotal.toFixed(0)}`}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

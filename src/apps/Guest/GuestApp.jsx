import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, ChevronLeft, CheckCircle, MapPin, Phone,
  Search, SlidersHorizontal, Star, Clock, Flame, Utensils, HelpCircle, MoreHorizontal,
  ChefHat, Bike, Home, MessageSquare, Check
} from 'lucide-react';
import { C } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { QuantityControl } from '../../components/ui/QuantityControl';
import { VegDot } from '../../components/ui/VegDot';
import { CONFIG } from '../../config';

const ACCENT_BLUE = '#2563EB';
const ACCENT_BLUE_SOFT = 'rgba(37,99,235,0.12)';

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

import { useStore } from '../../store/useStore';
import { socket } from '../../lib/socket';

const getItemMeta = (item) => {
  const seed = typeof item.id === 'number' ? item.id : 99;
  const rating = (4.4 + (seed % 6) * 0.1).toFixed(1);
  const time = 8 + (seed % 3) * 4;
  const calories = 120 + (seed % 5) * 85;
  return { rating, time: `${time} min`, calories: `${calories} kcal` };
};

const FeaturedItemCard = ({ item, meta, qty, updateQty, onCardClick }) => {
  return (
    <div style={{ minWidth: 232, maxWidth: 232, display: 'flex', cursor: 'pointer' }} onClick={() => onCardClick(item)}>
      <Card style={{ padding: 0, width: '100%', height: 332, position: 'relative', overflow: 'hidden', borderRadius: 28, border: qty > 0 ? `1.5px solid ${ACCENT_BLUE}` : '1px solid rgba(0,0,0,0.03)', boxShadow: qty > 0 ? `0 12px 28px ${ACCENT_BLUE}15` : '0 8px 24px rgba(15,27,43,0.04)', background: qty > 0 ? `${ACCENT_BLUE}06` : C.white, transition: 'all 0.2s', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 176, position: 'relative', background: 'linear-gradient(180deg, #FFF9ED 0%, #FFFDF9 100%)', flexShrink: 0 }}>
          {item.image ? (
            <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.02)' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Utensils size={32} style={{ opacity: 0.2 }} /></div>
          )}
          <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.94)', padding: '6px 10px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
            <Star size={12} color={ACCENT_BLUE} fill={ACCENT_BLUE} />
            <span style={{ fontSize: 11, fontWeight: 800, color: C.text }}>{meta.rating}</span>
          </div>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: -0.2 }}>{item.name}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: C.textSub, minHeight: 16 }}>
            <span>{meta.time}</span><span>·</span><span>{meta.calories}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 4 }} onClick={e => e.stopPropagation()}>
            <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>₹{item.price}</span>
            <QuantityControl qty={qty} onAdd={() => updateQty(item, 1)} onIncrease={() => updateQty(item, 1)} onDecrease={() => updateQty(item, -1)} />
          </div>
        </div>
      </Card>
    </div>
  );
};

const MenuItemCard = ({ item, idx, qty, isTimingHighlight, updateQty, onCardClick }) => {
  return (
    <Card
      onClick={() => onCardClick(item)}
      style={{ 
        padding: 0, 
        display: 'flex', 
        height: 140, 
        boxSizing: 'border-box', 
        animationDelay: `${idx * 0.04}s`, 
        borderRadius: 24, 
        border: qty > 0 ? `1.5px solid ${ACCENT_BLUE}` : (isTimingHighlight ? `1.5px solid ${ACCENT_BLUE}45` : '1px solid rgba(0,0,0,0.04)'), 
        boxShadow: '0 8px 24px rgba(15,27,43,0.06)', 
        background: C.white, 
        cursor: 'pointer', 
        position: 'relative', 
        transition: 'all 0.2s',
        overflow: 'hidden'
      }}
      className="animate-fade-in"
    >
      <div style={{ width: '40%', height: '100%', flexShrink: 0, position: 'relative', background: C.borderLight }}>
        {item.image ? (
          <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Utensils size={32} style={{ opacity: 0.2 }} /></div>
        )}
        <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.95)', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
          <VegDot isVeg={item.isVeg} />
        </div>
      </div>
      
      <div style={{ flex: 1, padding: '16px 16px 16px 18px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', boxSizing: 'border-box' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <h3 style={{ fontSize: 17, color: C.text, margin: 0, fontWeight: 800, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', lineHeight: 1.2 }}>{item.name}</h3>
            <button onClick={(e) => { e.stopPropagation(); onCardClick(item); }} style={{ background: 'none', border: 'none', padding: 4, margin: '-4px -4px 0 0', cursor: 'pointer', color: C.text, display: 'flex' }}>
              <MoreHorizontal size={20} strokeWidth={2.5} />
            </button>
          </div>
          <p style={{ color: C.textSub, fontSize: 13, lineHeight: 1.35, margin: '6px 0 0 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {item.desc || 'Freshly prepared for you.'}
          </p>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
          <div style={{ fontWeight: 800, color: ACCENT_BLUE, fontSize: 22, letterSpacing: -0.5 }}>₹{item.price}</div>
          
          <div onClick={e => e.stopPropagation()}>
            <QuantityControl qty={qty} onAdd={() => updateQty(item, 1)} onIncrease={() => updateQty(item, 1)} onDecrease={() => updateQty(item, -1)} />
          </div>
        </div>
      </div>
    </Card>
  );
};

export const GuestApp = ({ config = CONFIG }) => {
  const menuItems = useStore(state => state.menuItems) || [];
  const orders = useStore(state => state.orders) || [];
  const setOrders = useStore(state => state.setOrders);
  const socketConnected = useStore(state => state.socketConnected);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
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

  // Authentication State
  const [roomNumber, setRoomNumber] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('t');
    
    if (!token) {
      setAuthError("Invalid QR code. Please scan the QR code placed in your room.");
      setIsValidating(false);
      return;
    }

    fetch('/api/validate-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        setAuthError(data.error);
      } else {
        setSessionId(data.sessionId);
        setRoomNumber(data.room);
      }
    })
    .catch(() => setAuthError("Network error while validating QR code."))
    .finally(() => setIsValidating(false));
  }, []);

  useEffect(() => {
    const handleRejected = (data) => {
      setAuthError(data.reason || "Order rejected by server.");
    };
    
    const handleAccepted = (data) => {
      setLastOrderId(data.orderId);
      setCart([]);
      setSpecialNote('');
      setDeliveryPreference('ALL_AT_ONCE');
      showToast('Order sent to kitchen!');
      setCurrentScreen('tracking');
    };

    socket.on('order_rejected', handleRejected);
    socket.on('order_accepted', handleAccepted);

    return () => {
      socket.off('order_rejected', handleRejected);
      socket.off('order_accepted', handleAccepted);
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalQty, setModalQty] = useState(1);
  const [modalInstructions, setModalInstructions] = useState({});

  useEffect(() => {
    if (selectedItem) {
      setModalQty(getQty(selectedItem.id) || 1);
    }
  }, [selectedItem]);

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

  const getItemUnitPrice = (item) => item.price;

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
        const extraNote = modalInstructions[i.id] ? `(${modalInstructions[i.id]})` : '';
        return {
          id: Date.now() + Math.random(),
          name: `${i.name} ${extraNote}`.trim(),
          qty: i.qty,
          price: i.price,
          status: 'PENDING'
        };
      }),
      note: specialNote,
      subtotal: cartSubtotal,
      total: grandTotal
    };

    socket.emit('place_order', { order: newOrder, sessionId });
  };

  const trackingOrder = orders.find(o => o.id === lastOrderId) || orders.find(o => o.room === roomNumber);

  if (isValidating) {
    return (
      <div style={{ minHeight: '100vh', background: C.sand, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.textSub }}>
        <div style={{ border: `4px solid ${C.border}`, borderTop: `4px solid ${C.emeraldMid}`, borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite', marginBottom: 16 }} />
        <h3 style={{ margin: 0, fontWeight: 600 }}>Connecting to room...</h3>
      </div>
    );
  }

  if (authError) {
    return (
      <div style={{ minHeight: '100vh', background: C.sand, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', color: C.text }}>
        <div style={{ background: C.dangerLight, color: C.danger, padding: 24, borderRadius: '50%', marginBottom: 24 }}>
          <HelpCircle size={48} />
        </div>
        <h2 style={{ margin: '0 0 12px 0', fontSize: 24, fontWeight: 800 }}>Access Denied</h2>
        <p style={{ margin: 0, color: C.textSub, fontSize: 16, lineHeight: 1.5 }}>{authError}</p>
      </div>
    );
  }

  return (
    <div className="guest-shell" style={{
      maxWidth: 520,
      margin: '0 auto',
      minHeight: '100vh',
      background: 'radial-gradient(circle at top left, #FFF7E8 0%, #F7FAFC 34%, #F5F7FA 100%)',
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
          <CheckCircle size={16} color={ACCENT_BLUE} style={{ flexShrink: 0 }} />
          <span>{toast}</span>
        </div>
      )}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .serif { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.25s ease-out forwards; }
        .bounce-badge { animation: bounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes bounce { 0% { transform: scale(0.3); } 50% { transform: scale(1.1); } 100% { transform: scale(1.0); } }

        @media (max-width: 420px) {
          .guest-shell { max-width: 100% !important; padding-bottom: 94px !important; }
          .guest-header { padding: 16px !important; }
          .guest-body { padding: 16px !important; gap: 20px !important; }
          .guest-special-banner { padding: 18px !important; border-radius: 22px !important; }
          .guest-special-copy { width: 100% !important; }
          .guest-special-image { display: none !important; }
          .guest-picks-row { gap: 12px !important; }
          .guest-menu-list { gap: 12px !important; }
          .guest-bottom-nav { left: 12px !important; right: 12px !important; transform: none !important; width: auto !important; max-width: none !important; padding: 10px 10px !important; }
          .guest-bottom-nav button { padding: 6px 8px !important; }
          .guest-track-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; }
          .guest-track-badge { width: 128px !important; height: 128px !important; }
          .guest-track-cta { padding: 15px 18px !important; }
          .guest-track-card { padding: 18px !important; }
        }

        @media (min-width: 421px) and (max-width: 480px) {
          .guest-header { padding: 18px !important; }
          .guest-body { padding: 18px !important; }
        }
      `}</style>

      {/* MENU SCREEN */}
      {currentScreen === 'menu' && (
        <div className="animate-fade-in">
          {/* Sticky Header */}
          <div className="guest-header" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(14px)', padding: '18px 20px', boxShadow: '0 10px 26px rgba(15,27,43,0.05)', borderBottom: `1px solid ${C.borderLight}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h1 style={{ color: C.text, fontSize: 18, margin: 0, fontWeight: 800, letterSpacing: -0.3 }}>{config?.shortName}</h1>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: socketConnected ? '#10B981' : C.danger, boxShadow: socketConnected ? '0 0 8px rgba(16,185,129,0.55)' : 'none' }}></div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: ACCENT_BLUE, fontSize: 12.5, marginTop: 5, background: `${ACCENT_BLUE}10`, padding: '4px 10px', borderRadius: 999 }}>
                  <MapPin size={12} />
                  <span style={{ fontWeight: 750 }}>Room {roomNumber}</span>
                </div>
              </div>
              <button onClick={() => setCurrentScreen('cart')} style={{ position: 'relative', background: C.white, padding: 10, borderRadius: 999, border: `1px solid ${C.border}`, cursor: 'pointer', boxShadow: '0 8px 18px rgba(15,27,43,0.05)' }}>
                <ShoppingCart size={18} color={C.text} />
                {cartTotalQty > 0 && (
                  <div className="bounce-badge" style={{ position: 'absolute', top: -5, right: -5, background: ACCENT_BLUE, color: C.white, fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 12px rgba(37,99,235,0.25)' }}>
                    {cartTotalQty}
                  </div>
                )}
              </button>
            </div>

            {/* Search */}
            <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
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
                onClick={() => { setVegOnly(!vegOnly); showToast(vegOnly ? 'Showing all items' : 'Filtered: Vegetarian only'); }}
                style={{ background: vegOnly ? `${ACCENT_BLUE}14` : C.white, border: `1.5px solid ${vegOnly ? ACCENT_BLUE : C.border}`, borderRadius: 14, padding: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 8px 18px rgba(15,27,43,0.04)' }}
              >
                <SlidersHorizontal size={16} color={vegOnly ? ACCENT_BLUE : C.textSub} />
              </button>
            </div>

            {/* Category Tabs */}
          </div>

          {/* Body */}
            <div className="guest-body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Meal Special Banner */}
            <div className="guest-special-banner" style={{ background: `linear-gradient(135deg, ${C.emerald} 0%, #15233A 100%)`, borderRadius: 28, padding: '20px 24px', color: C.white, position: 'relative', overflow: 'hidden', boxShadow: '0 16px 32px rgba(7,20,40,0.16)' }}>
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }}></div>
              <div className="guest-special-copy" style={{ width: '60%', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                  <Clock size={11} /> {mealConfig.mealName} Special
                </div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, lineHeight: 1.2, color: C.white }}>{mealConfig.special.name}</h3>
                <p style={{ margin: '8px 0 16px 0', fontSize: 12.5, opacity: 0.9, lineHeight: 1.45 }}>Limited time recipe crafted by our head chef.</p>
                {(() => {
                  const specialQty = getQty(mealConfig.special.id);
                  return (
                    <button
                      onClick={() => setSelectedItem(mealConfig.special)}
                      style={{ background: C.white, color: C.text, border: 'none', padding: '10px 18px', borderRadius: 999, fontWeight: 800, fontSize: 12, cursor: 'pointer', boxShadow: '0 8px 18px rgba(0,0,0,0.10)', fontFamily: 'inherit' }}
                    >
                      {specialQty > 0 ? `In Cart (${specialQty}) · Customize` : `Order Now (₹${mealConfig.special.price})`}
                    </button>
                  );
                })()}
              </div>
              {mealConfig.special.image && (
                <div className="guest-special-image" style={{ position: 'absolute', top: '50%', right: 14, transform: 'translateY(-50%)', width: 120, height: 120, borderRadius: 28, overflow: 'hidden', border: '4px solid rgba(255,255,255,0.18)', boxShadow: '0 14px 24px rgba(0,0,0,0.18)' }}>
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
                    <span style={{ color: ACCENT_BLUE, fontSize: 13, fontWeight: 700 }}>Popular choices</span>
                  </div>
                  <div className="hide-scrollbar guest-picks-row" style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x proximity' }}>
                    {items.map((item, idx) => {
                      const meta = getItemMeta(item);
                      const qty = getQty(item.id);
                      return (
                        <FeaturedItemCard 
                          key={idx} 
                          item={item} 
                          meta={meta} 
                          qty={qty} 
                          updateQty={updateQty} 
                          onCardClick={setSelectedItem}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Full Menu List */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 800, color: C.text }}>Our Menu</h3>
              <div className="hide-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 16, paddingBottom: 6, scrollSnapType: 'x proximity' }}>
                {categories.map(cat => {
                  const isSelected = activeCategory === cat;
                  const isRecommended = cat === mealConfig.defaultCategory;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      style={{ whiteSpace: 'nowrap', padding: '10px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700, border: `1px solid ${isSelected ? C.text : C.border}`, background: isSelected ? C.text : C.white, color: isSelected ? C.white : C.textSub, boxShadow: isSelected ? '0 10px 20px rgba(15,27,43,0.12)' : '0 6px 16px rgba(15,27,43,0.04)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', scrollSnapAlign: 'start' }}
                    >
                      {isRecommended && <Clock size={12} />}
                      {cat}
                    </button>
                  );
                })}
              </div>
              <div className="guest-menu-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {displayedItems.map((item, idx) => {
                  const qty = getQty(item.id);
                  const isTimingHighlight = item.category === mealConfig.defaultCategory;
                  return (
                    <MenuItemCard 
                      key={item.id}
                      item={item}
                      idx={idx}
                      qty={qty}
                      isTimingHighlight={isTimingHighlight}
                      updateQty={updateQty}
                      onCardClick={setSelectedItem}
                    />
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
              <button onClick={() => setCurrentScreen('menu')} style={{ background: ACCENT_BLUE, color: C.white, border: 'none', padding: '14px 28px', borderRadius: 16, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 20px rgba(37,99,235,0.30)', fontFamily: 'inherit' }}>
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                {cart.map((item) => {
                  const unitPrice = getItemUnitPrice(item);
                  const itemInstructions = modalInstructions[item.id];
                  return (
                    <Card key={item.id} style={{ padding: 16, border: 'none', borderRadius: 20, boxShadow: '0 4px 16px rgba(15,27,43,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <VegDot isVeg={item.isVeg} />
                            <span style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{item.name}</span>
                          </div>
                          {itemInstructions && (
                            <p style={{ margin: '6px 0 0 0', fontSize: 12, color: ACCENT_BLUE, fontStyle: 'italic' }}>"{itemInstructions}"</p>
                          )}
                          <div style={{ color: C.textSub, fontSize: 13, marginTop: 8, fontWeight: 600 }}>₹{unitPrice} each</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                          <span style={{ fontWeight: 800, color: ACCENT_BLUE, fontSize: 15 }}>₹{unitPrice * item.qty}</span>
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
                  <MapPin size={18} color={ACCENT_BLUE} />
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
                  <button onClick={() => setDeliveryPreference('ALL_AT_ONCE')} style={{ flex: 1, padding: 12, borderRadius: 12, border: `1.5px solid ${deliveryPreference === 'ALL_AT_ONCE' ? ACCENT_BLUE : C.border}`, background: deliveryPreference === 'ALL_AT_ONCE' ? `${ACCENT_BLUE}10` : C.white, color: deliveryPreference === 'ALL_AT_ONCE' ? ACCENT_BLUE : C.textSub, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}>All at once</button>
                  <button onClick={() => setDeliveryPreference('AS_READY')} style={{ flex: 1, padding: 12, borderRadius: 12, border: `1.5px solid ${deliveryPreference === 'AS_READY' ? ACCENT_BLUE : C.border}`, background: deliveryPreference === 'AS_READY' ? `${ACCENT_BLUE}10` : C.white, color: deliveryPreference === 'AS_READY' ? ACCENT_BLUE : C.textSub, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}>As soon as ready</button>
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
                  <span style={{ fontWeight: 900, fontSize: 20, color: ACCENT_BLUE }}>₹{grandTotal.toFixed(0)}</span>
                </div>
              </Card>

              <button
                onClick={placeOrder}
                style={{ width: '100%', background: ACCENT_BLUE, color: C.white, padding: 18, borderRadius: 20, fontWeight: 800, fontSize: 16, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(37,99,235,0.40)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 40, fontFamily: 'inherit' }}
              >
                Send Order to Kitchen
              </button>
            </>
          )}
        </div>
      )}

      {/* TRACKING SCREEN */}
      {currentScreen === 'tracking' && (
        <div className="animate-fade-in" style={{ padding: 24, textAlign: 'left' }}>
          {trackingOrder ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Card style={{ border: `1px solid ${C.border}`, boxShadow: '0 16px 36px rgba(15,27,43,0.06)', borderRadius: 28, background: 'linear-gradient(180deg, #FFFFFF 0%, #FBFDFF 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <button onClick={() => setCurrentScreen('menu')} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: C.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <ChevronLeft size={20} />
                  </button>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: `${ACCENT_BLUE}12`, color: ACCENT_BLUE, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    Order Tracking
                  </div>
                  <div style={{ width: 40, height: 40 }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <h2 className="serif" style={{ color: C.text, fontSize: 26, margin: 0, fontWeight: 800 }}>Delivery in progress</h2>
                      <p style={{ color: C.textSub, fontSize: 13, margin: '6px 0 0 0' }}>Room {trackingOrder.room} • Token {trackingOrder.token}</p>
                    </div>
                    <div style={{ padding: '8px 12px', borderRadius: 999, background: trackingOrder.status === 'DELIVERED' ? 'rgba(16,185,129,0.12)' : `${ACCENT_BLUE}12`, color: trackingOrder.status === 'DELIVERED' ? '#059669' : ACCENT_BLUE, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>
                      {trackingOrder.status === 'NEW' ? 'Placed' : trackingOrder.status === 'PREPARING' ? 'Preparing' : trackingOrder.status === 'ON_THE_WAY' ? 'On the way' : 'Delivered'}
                    </div>
                  </div>

                  <div style={{ height: 10, borderRadius: 999, background: C.borderLight, overflow: 'hidden' }}>
                    <div style={{ width: trackingOrder.status === 'NEW' ? '25%' : trackingOrder.status === 'PREPARING' ? '50%' : trackingOrder.status === 'ON_THE_WAY' ? '75%' : '100%', height: '100%', background: `linear-gradient(90deg, ${ACCENT_BLUE} 0%, #60A5FA 100%)`, borderRadius: 999, transition: 'width 0.3s ease' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginTop: 4 }}>
                    {[
                      { label: 'Received', active: ['NEW', 'PREPARING', 'ON_THE_WAY', 'DELIVERED'].includes(trackingOrder.status) },
                      { label: 'Kitchen', active: ['PREPARING', 'ON_THE_WAY', 'DELIVERED'].includes(trackingOrder.status) },
                      { label: 'Route', active: ['ON_THE_WAY', 'DELIVERED'].includes(trackingOrder.status) },
                      { label: 'Arrived', active: trackingOrder.status === 'DELIVERED' },
                    ].map(step => (
                      <div key={step.label} style={{ border: `1px solid ${step.active ? ACCENT_BLUE : C.border}`, background: step.active ? `${ACCENT_BLUE}08` : C.white, borderRadius: 18, padding: '12px 10px', textAlign: 'center' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: step.active ? ACCENT_BLUE : C.border, margin: '0 auto 8px auto' }} />
                        <div style={{ fontSize: 12, fontWeight: 800, color: step.active ? C.text : C.textMuted }}>{step.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card style={{ border: `1px solid ${C.border}`, boxShadow: 'none', borderRadius: 24 }}>
                <h3 className="serif" style={{ fontSize: 18, fontWeight: 800, margin: '0 0 14px 0', color: C.text }}>What’s in this order</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {trackingOrder.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: idx === 0 ? 'none' : `1px solid ${C.borderLight}` }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.qty}x {item.name}</div>
                        <div style={{ fontSize: 12, color: C.textSub, marginTop: 4 }}>Prepared for Room {trackingOrder.room}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: ACCENT_BLUE, flexShrink: 0 }}>₹{item.price * item.qty}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card style={{ border: `1px solid ${C.border}`, boxShadow: 'none', borderRadius: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Delivery address</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginTop: 6 }}>In-room dining</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginTop: 6 }}>{trackingOrder.status}</div>
                  </div>
                </div>
              </Card>

              <button onClick={() => setCurrentScreen('menu')} style={{ width: '100%', background: C.text, color: C.white, border: 'none', padding: '16px 20px', borderRadius: 22, fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 12px 28px rgba(15,27,43,0.16)', fontFamily: 'inherit' }}>
                Back to menu
              </button>
            </div>
          ) : (
            <Card style={{ padding: 28, textAlign: 'center', border: `1px solid ${C.border}`, borderRadius: 28, boxShadow: '0 16px 36px rgba(15,27,43,0.06)', background: C.white }}>
              <div style={{ width: 72, height: 72, borderRadius: 18, background: C.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px auto' }}>
                <Clock size={30} color={C.textMuted} />
              </div>
              <h3 style={{ color: C.text, fontSize: 18, fontWeight: 800, margin: '0 0 8px 0' }}>No active orders</h3>
              <p style={{ color: C.textSub, fontSize: 14, margin: '0 0 24px 0' }}>You don't have any active orders right now.</p>
              <button onClick={() => setCurrentScreen('menu')} style={{ background: ACCENT_BLUE, color: C.white, border: 'none', padding: '14px 28px', borderRadius: 16, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 20px rgba(37,99,235,0.30)', fontFamily: 'inherit' }}>
                Go to menu
              </button>
            </Card>
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
              <div style={{ background: `${ACCENT_BLUE}15`, padding: 12, borderRadius: '50%' }}><Phone size={20} color={ACCENT_BLUE} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>In-room Service Desk</div>
                <div style={{ color: C.textSub, fontSize: 13 }}>Dial Extension 9 or Call Reception</div>
              </div>
              <a href="tel:9" style={{ background: ACCENT_BLUE, color: C.white, textDecoration: 'none', padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>Call</a>
            </Card>

            <Card style={{ padding: 16, border: 'none', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 16px rgba(15,27,43,0.03)' }}>
              <div style={{ background: `${ACCENT_BLUE}15`, padding: 12, borderRadius: '50%' }}><Clock size={20} color={ACCENT_BLUE} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>Housekeeping Request</div>
                <div style={{ color: C.textSub, fontSize: 13 }}>Available 24/7 · Extension 3</div>
              </div>
              <button onClick={() => showToast(`Housekeeping requested for Room ${roomNumber}!`)} style={{ background: ACCENT_BLUE, color: C.white, border: 'none', padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Request</button>
            </Card>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: '0 0 16px 0' }}>Useful Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { title: 'High-Speed Wi-Fi', desc: `Network: ${config?.shortName}_Guest · Password: ${config?.shortName?.toLowerCase()}2026`, copyText: `${config?.shortName?.toLowerCase()}2026` },
              { title: 'Restaurant Timings', desc: 'Breakfast: 6:30 AM - 10:30 AM · Dinner: 7:00 PM - 11:00 PM' },
              { title: 'Swimming Pool & Gym', desc: 'Located on 4th Floor · Open 6:00 AM - 10:00 PM' },
              { title: 'Express Check-out', desc: 'Standard check-out time is 12:00 PM. Dial reception to request a late checkout.' }
            ].map((info, idx) => (
              <Card
                key={idx}
                onClick={() => {
                  if (info.copyText) { navigator.clipboard.writeText(info.copyText); showToast('Wi-Fi Password copied!'); }
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
      <div className="guest-bottom-nav" style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: 448, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderRadius: 28, padding: '10px 12px', boxShadow: '0 16px 34px rgba(15,27,43,0.10)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 999, border: `1px solid ${C.borderLight}` }}>
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
              style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 18, cursor: 'pointer', position: 'relative', color: isActive ? C.text : C.textSub, transition: 'all 0.2s', fontFamily: 'inherit', minWidth: 74 }}
            >
              <div style={{ position: 'absolute', inset: 0, background: isActive ? C.text : 'transparent', borderRadius: 18, transform: isActive ? 'scale(1)' : 'scale(0.92)', opacity: isActive ? 1 : 0, transition: 'all 0.2s' }}></div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={isActive ? C.white : C.textSub} style={{ transition: 'color 0.2s' }} />
                {tab.count > 0 && (
                  <div style={{ position: 'absolute', top: -6, right: -10, background: C.danger, color: C.white, fontSize: 9, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxShadow: '0 2px 6px rgba(239,68,68,0.3)' }}>
                    {tab.count}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, transition: 'color 0.2s', zIndex: 1, color: isActive ? C.white : C.textSub }}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {selectedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,27,43,0.4)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setSelectedItem(null)}>
          <div className="animate-slide-up" style={{ background: C.white, width: '100%', maxWidth: 480, borderTopLeftRadius: 36, borderTopRightRadius: 36, boxSizing: 'border-box', boxShadow: '0 -10px 40px rgba(0,0,0,0.12)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ padding: '20px 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setSelectedItem(null)} style={{ background: C.borderLight, border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.text }}>
                <ChevronLeft size={22} style={{ transform: 'rotate(-90deg)' }} />
              </button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text }}>
                <MoreHorizontal size={22} />
              </button>
            </div>
            
            <div className="hide-scrollbar" style={{ overflowY: 'auto', padding: '0 24px 24px', flex: 1 }}>
              
              {/* Circular Food Image Backdrop */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '12px 0 20px' }}>
                <div style={{ width: 220, height: 220, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
                  {selectedItem.image ? (
                    <img src={selectedItem.image} alt={selectedItem.name} style={{ width: 190, height: 190, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 190, height: 190, borderRadius: '50%', background: C.borderLight }}><Utensils size={48} style={{ opacity: 0.3 }} /></div>
                  )}
                </div>
                {/* Page dots indicator */}
                <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT_BLUE }}></div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.border }}></div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.border }}></div>
                </div>
              </div>

              {/* Title & Quantity Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{selectedItem.name}</h2>
                  <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 650, marginTop: 4, display: 'block' }}>Chef's Special Recipe</span>
                </div>
                
                {/* Quantity Selector Pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F3F4F6', borderRadius: 24, padding: '4px 4px 4px 14px' }}>
                  <button onClick={() => setModalQty(q => Math.max(0, q - 1))} style={{ background: 'none', border: 'none', color: C.text, fontWeight: 900, fontSize: 16, cursor: 'pointer', padding: '4px 8px 4px 0' }}>−</button>
                  <span style={{ fontWeight: 800, color: C.text, fontSize: 15, minWidth: 14, textAlign: 'center' }}>{modalQty}</span>
                  <button onClick={() => setModalQty(q => q + 1)} style={{ background: C.text, color: C.white, border: 'none', width: 28, height: 28, borderRadius: '50%', fontWeight: 900, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>

              {/* Badges Row */}
              {(() => {
                const meta = getItemMeta(selectedItem);
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, fontSize: 13, fontWeight: 700, color: C.textSub }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={14} color={ACCENT_BLUE} fill={ACCENT_BLUE} />
                      <span>{meta.rating}</span>
                    </div>
                    <span style={{ color: C.border }}>|</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={14} color={C.textMuted} />
                      <span>{meta.time}</span>
                    </div>
                    <span style={{ color: C.border }}>|</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Flame size={14} color={C.danger} />
                      <span>{meta.calories}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Description */}
              <p style={{ color: C.textSub, fontSize: 14, lineHeight: 1.5, margin: '0 0 20px 0' }}>
                {selectedItem.desc || 'Prepared fresh by our expert chefs using premium ingredients.'}
              </p>

              {/* Special Note Textbox */}
              <div style={{ background: C.sand, borderRadius: 16, padding: 14, border: `1px solid ${C.border}`, marginTop: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: C.textSub, marginBottom: 8, display: 'block' }}>Add note for the kitchen...</label>
                <textarea
                  placeholder="e.g., No onions, extra spicy, sauce on side..."
                  value={modalInstructions[selectedItem.id] || ''}
                  onChange={e => setModalInstructions(prev => ({ ...prev, [selectedItem.id]: e.target.value }))}
                  style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 14, minHeight: 60, resize: 'none', outline: 'none', fontFamily: 'inherit', color: C.text }}
                />
              </div>

            </div>

            {/* Bottom sticky bar */}
            <div style={{ borderTop: `1px solid ${C.border}`, padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.white }}>
              <div>
                <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Price</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: ACCENT_BLUE }}>₹{selectedItem.price * modalQty}</div>
              </div>
              <button
                onClick={() => {
                  updateQty(selectedItem, modalQty - getQty(selectedItem.id));
                  setSelectedItem(null);
                }}
                style={{ background: C.text, color: C.white, padding: '14px 28px', borderRadius: 24, border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 8px 20px rgba(15,27,43,0.15)' }}
              >
                {modalQty === 0 ? 'Remove Item' : getQty(selectedItem.id) > 0 ? 'Update Cart' : 'Add to Cart'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

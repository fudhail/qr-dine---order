import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ShoppingCart, ChevronLeft, CheckCircle, MapPin, Phone,
  Search, SlidersHorizontal, Star, Clock, Utensils, HelpCircle,
  ChefHat, AlertOctagon, Award
} from 'lucide-react';
import { C } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { QuantityControl } from '../../components/ui/QuantityControl';
import { VegDot } from '../../components/ui/VegDot';
import { useStore } from '../../store/useStore';
import { socket } from '../../lib/socket';

const ACCENT_BLUE = '#2563EB';
const ACCENT_RED = '#EF4444';

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
        isVeg: 0,
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
        isVeg: 0,
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
        isVeg: 0,
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
        id: 1,
        name: 'Truffle Mushroom Risotto',
        desc: 'Creamy Arborio rice with wild mushrooms and truffle oil.',
        price: 450,
        isVeg: 1,
        image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&q=80',
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
        desc: 'Warm chocolate cake with a warm, gooey molten chocolate core, served with a scoop of vanilla bean ice cream.',
        price: 220,
        isVeg: 1,
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

const FeaturedItemCard = ({ item, meta, qty, updateQty, onCardClick }) => {
  const isInCart = qty > 0;
  const isUnavailable = !item.available;

  return (
    <div style={{ minWidth: 204, maxWidth: 204, display: 'flex', cursor: 'pointer' }} onClick={() => onCardClick(item)}>
      <Card style={{ padding: 0, width: '100%', height: 244, position: 'relative', overflow: 'hidden', borderRadius: 20, border: isInCart ? `1.5px solid ${ACCENT_BLUE}` : `1px solid ${C.borderLight}`, boxShadow: isInCart ? `0 14px 28px ${ACCENT_BLUE}18` : '0 10px 24px rgba(15,27,43,0.055)', background: C.white, transition: 'all 0.2s', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 112, position: 'relative', background: C.borderLight, flexShrink: 0 }}>
          {item.image ? (
            <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Utensils size={32} style={{ opacity: 0.2 }} /></div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,23,42,0.08) 0%, rgba(15,23,42,0) 46%, rgba(15,23,42,0.22) 100%)' }} />
          <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(15,23,42,0.74)', color: '#FFF', padding: '4px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800, maxWidth: 116, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.category}
          </div>
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.96)', padding: '4px 8px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.10)' }}>
            <Star size={10} color={ACCENT_BLUE} fill={ACCENT_BLUE} />
            <span style={{ fontSize: 10, fontWeight: 800, color: C.text }}>{meta.rating}</span>
          </div>
        </div>
        <div style={{ padding: '11px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minHeight: 0 }}>
          <div style={{ minHeight: 0 }}>
            <h4 style={{ margin: 0, fontSize: 14.5, lineHeight: 1.18, fontWeight: 850, color: C.text, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.name}</h4>
            <p style={{ margin: '5px 0 0', fontSize: 11.5, color: C.textSub, lineHeight: 1.25, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
              {item.desc || `${meta.time} preparation`}
            </p>
          </div>
          <div style={{ display: 'none' }}>
            <span>{meta.time}</span><span>·</span><span>{meta.calories}</span>
          </div>
          <div style={{ display: 'none' }}>
            <span>{meta.time}</span><span>•</span><span>{meta.calories}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: C.textMuted, fontWeight: 700 }}>
            <span>{meta.time}</span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: C.textMuted }} />
            <span>{meta.calories}</span>
          </div>
          <div style={{ display: 'none' }} onClick={e => e.stopPropagation()}>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>₹{item.price}</span>
            {isUnavailable ? (
              <div style={{ height: 34, minWidth: 96, borderRadius: 999, background: '#E2E8F0', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>
                Unavailable
              </div>
            ) : (
              <QuantityControl qty={qty} onAdd={() => updateQty(item, 1)} onIncrease={() => updateQty(item, 1)} onDecrease={() => updateQty(item, -1)} />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }} onClick={e => e.stopPropagation()}>
            <span style={{ fontSize: 17, fontWeight: 900, color: C.text }}>₹{item.price}</span>
            {isInCart ? (
              <div style={{ height: 34, display: 'flex', alignItems: 'center', gap: 10, background: `${ACCENT_BLUE}12`, borderRadius: 999, padding: '3px 5px 3px 10px' }}>
                <button onClick={() => updateQty(item, -1)} style={{ background: 'transparent', border: 'none', color: ACCENT_BLUE, fontSize: 18, fontWeight: 900, cursor: 'pointer', width: 20, height: 26, lineHeight: 1 }}>−</button>
                <span style={{ fontSize: 13, fontWeight: 900, color: C.text, minWidth: 12, textAlign: 'center' }}>{qty}</span>
                <button onClick={() => updateQty(item, 1)} style={{ background: ACCENT_BLUE, border: 'none', color: '#FFF', fontSize: 16, fontWeight: 900, cursor: 'pointer', width: 26, height: 26, borderRadius: '50%', lineHeight: 1 }}>+</button>
              </div>
            ) : (
              <button onClick={() => updateQty(item, 1)} style={{ height: 34, background: `${ACCENT_BLUE}12`, color: C.text, border: 'none', padding: '0 5px 0 12px', borderRadius: 999, fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                Add
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: ACCENT_BLUE, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, lineHeight: 1 }}>+</span>
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

const MenuItemCard = ({ item, qty, isTimingHighlight, updateQty, onCardClick }) => {
  const isUnavailable = !item.available;

  return (
    <Card
      onClick={() => {
        if (!isUnavailable) onCardClick(item);
      }}
      className={isUnavailable ? '' : 'card-interactive'}
      style={{ 
        padding: 0, 
        display: 'flex', 
        height: 120, 
        borderRadius: 20, 
        border: isUnavailable ? '1px solid rgba(148,163,184,0.28)' : qty > 0 ? `1.5px solid ${ACCENT_BLUE}` : (isTimingHighlight ? `1.5px solid ${ACCENT_BLUE}25` : '1px solid rgba(0,0,0,0.04)'), 
        boxShadow: '0 6px 18px rgba(15,27,43,0.04)', 
        background: isUnavailable ? '#F8FAFC' : C.white, 
        cursor: isUnavailable ? 'not-allowed' : 'pointer', 
        position: 'relative', 
        overflow: 'hidden',
        opacity: isUnavailable ? 0.72 : 1
      }}
    >
      <div style={{ width: '35%', height: '100%', flexShrink: 0, position: 'relative', background: C.borderLight }}>
        {item.image ? (
          <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isUnavailable ? 'grayscale(0.75)' : 'none' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Utensils size={24} style={{ opacity: 0.2 }} /></div>
        )}
        <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(255,255,255,0.95)', padding: '3px 5px', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <VegDot isVeg={item.isVeg} />
        </div>
        {isUnavailable && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ background: '#FFF', color: '#64748B', borderRadius: 999, padding: '5px 9px', fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase' }}>Unavailable</span>
          </div>
        )}
      </div>
      
      <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', boxSizing: 'border-box' }}>
        <div>
          <h3 style={{ fontSize: 15, color: isUnavailable ? C.textMuted : C.text, margin: 0, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{item.name}</h3>
          <p style={{ color: C.textSub, fontSize: 12, lineHeight: 1.3, margin: '4px 0 0 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {isUnavailable ? 'Currently unavailable. Please choose another item.' : (item.desc || 'Freshly prepared for you.')}
          </p>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, color: ACCENT_BLUE, fontSize: 16 }}>₹{item.price}</div>
          <div onClick={e => e.stopPropagation()}>
            {isUnavailable ? (
              <div style={{ height: 34, minWidth: 96, borderRadius: 999, background: '#E2E8F0', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>
                Unavailable
              </div>
            ) : (
              <QuantityControl qty={qty} onAdd={() => updateQty(item, 1)} onIncrease={() => updateQty(item, 1)} onDecrease={() => updateQty(item, -1)} />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export const GuestApp = () => {
  const menuItems = useStore(state => state.menuItems);
  const orders = useStore(state => state.orders);
  const sosAlerts = useStore(state => state.sosAlerts);
  const socketConnected = useStore(state => state.socketConnected);
  const billingConfig = useStore(state => state.config);

  const currentHour = new Date().getHours();
  const mealConfig = getMealTimeConfig(currentHour);

  const [currentScreen, setCurrentScreen] = useState('menu'); // menu, cart, services, sos, tracking
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState(mealConfig.defaultCategory);
  const [specialNote, setSpecialNote] = useState('');
  const [lastOrderId, setLastOrderId] = useState(() => {
    const saved = sessionStorage.getItem('lastOrderId');
    return saved ? parseInt(saved, 10) : null;
  });
  
  const updateLastOrderId = (id) => {
    setLastOrderId(id);
    if (id) {
      sessionStorage.setItem('lastOrderId', id);
    } else {
      sessionStorage.removeItem('lastOrderId');
    }
  };
  const [deliveryPreference, setDeliveryPreference] = useState('ALL_AT_ONCE');
  const [toast, setToast] = useState(null);
  const [vegOnly, setVegOnly] = useState(false);
  const [nowTick, setNowTick] = useState(0);

  // Custom Item request state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemNote, setCustomItemNote] = useState('');

  // Feedback State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackOrderId, setFeedbackOrderId] = useState(null);
  const [serviceRating, setServiceRating] = useState(5);
  const [foodRating, setFoodRating] = useState(5);
  const [feedbackSuggestion, setFeedbackSuggestion] = useState('');

  // Out of stock alert state
  const [outOfStockAlert, setOutOfStockAlert] = useState(null);

  // SOS Countdown/Timer State
  const [sosCountdown, setSosCountdown] = useState(0);
  const sosTimerRef = useRef(null);

  // Authentication State
  const [roomNumber, setRoomNumber] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isValidating, setIsValidating] = useState(true);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    setNowTick(Date.now());
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      updateLastOrderId(data.orderId);
      setCart([]);
      setSpecialNote('');
      setDeliveryPreference('ALL_AT_ONCE');
      showToast('Order received at central pantry!');
      setCurrentScreen('tracking');
    };

    const handleOutOfStock = (data) => {
      setOutOfStockAlert(data);
    };

    socket.on('order_rejected', handleRejected);
    socket.on('order_accepted', handleAccepted);
    socket.on('item_out_of_stock_alert', handleOutOfStock);

    return () => {
      socket.off('order_rejected', handleRejected);
      socket.off('order_accepted', handleAccepted);
      socket.off('item_out_of_stock_alert', handleOutOfStock);
    };
  }, []);

  useEffect(() => {
    if (sessionId && socketConnected) {
      socket.emit('register_guest', { sessionId });
    }
  }, [sessionId, socketConnected]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalQty, setModalQty] = useState(1);
  const [modalInstructions, setModalInstructions] = useState({});
  const getQty = useCallback((id) => cart.find(i => i.id === id)?.qty || 0, [cart]);

  useEffect(() => {
    if (selectedItem) {
      setModalQty(getQty(selectedItem.id) || 1);
    }
  }, [selectedItem, getQty]);

  const categories = ['All', ...new Set(menuItems.filter(i => i.category !== 'Services').map(i => i.category))];

  const displayedItems = menuItems.filter(i => {
    if (i.category === 'Services') return false;
    const matchesCategory = activeCategory === 'All' || i.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.desc && i.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesVeg = !vegOnly || i.isVeg === 1;
    return matchesCategory && matchesSearch && matchesVeg;
  });
  const serviceItems = menuItems.filter(i => i.category === 'Services' && i.available);
  const mealSpecialItem = menuItems.find(i => Number(i.id) === Number(mealConfig.special.id) && i.available) || null;

  const updateQty = (item, delta) => {
    const liveItem = menuItems.find(menuItem => String(menuItem.id) === String(item.id));
    if (delta > 0 && (item.available === false || liveItem?.available === false)) {
      showToast(`${item.name} is currently unavailable.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        const newQty = existing.qty + delta;
        if (newQty <= 0) {
          showToast(`Removed ${item.name}`);
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

  const cartTotalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cgstRate = Number(billingConfig?.cgst ?? 2.5);
  const sgstRate = Number(billingConfig?.sgst ?? 2.5);
  const serviceChargeRate = Number(billingConfig?.serviceCharge ?? 10);
  const serviceCharge = cartSubtotal * (serviceChargeRate / 100);
  const cgst = (cartSubtotal + serviceCharge) * (cgstRate / 100);
  const sgst = (cartSubtotal + serviceCharge) * (sgstRate / 100);
  const grandTotal = cartSubtotal + cgst + sgst + serviceCharge;

  const recommendedItems = useMemo(() => {
    const inCartIds = new Set(cart.map(c => c.id));
    const cartCategories = new Set(cart.map(c => c.category).filter(Boolean));
    const cartIsVeg = cart.length > 0 && cart.every(item => Number(item.isVeg) === 1);
    const averageCartPrice = cartTotalQty > 0 ? cartSubtotal / cartTotalQty : 0;
    const popularityById = new Map();
    const popularityByName = new Map();

    orders
      .filter(order => order.type === 'FOOD' && order.status !== 'CANCELLED')
      .forEach(order => {
        (order.items || []).forEach(item => {
          const qty = Number(item.qty) || 1;
          if (item.id) {
            popularityById.set(String(item.id), (popularityById.get(String(item.id)) || 0) + qty);
          }
          if (item.name) {
            const nameKey = item.name.toLowerCase();
            popularityByName.set(nameKey, (popularityByName.get(nameKey) || 0) + qty);
          }
        });
      });

    const pairings = {
      Breakfast: ['Beverages', 'Desserts'],
      Starters: ['Mains', 'Beverages'],
      Mains: ['Desserts', 'Beverages', 'Starters'],
      Desserts: ['Beverages'],
      Beverages: ['Breakfast', 'Starters', 'Desserts'],
      Custom: ['Mains', 'Beverages']
    };

    const preferredCategories = new Set();
    if (cart.length === 0) {
      preferredCategories.add(mealConfig.defaultCategory);
      if (activeCategory !== 'All') preferredCategories.add(activeCategory);
    } else {
      cartCategories.forEach(category => {
        (pairings[category] || []).forEach(pairCategory => preferredCategories.add(pairCategory));
      });
    }

    return menuItems
      .filter(item => item.available && item.category !== 'Services' && !inCartIds.has(item.id) && (!vegOnly || Number(item.isVeg) === 1))
      .map(item => {
        const itemId = String(item.id);
        const itemName = item.name.toLowerCase();
        const popularityScore = popularityById.get(itemId) || popularityByName.get(itemName) || 0;
        let score = 0;

        if (preferredCategories.has(item.category)) score += cart.length > 0 ? 18 : 12;
        if (item.category === mealConfig.defaultCategory) score += 8;
        if (activeCategory !== 'All' && item.category === activeCategory) score += 5;
        if (cartIsVeg && Number(item.isVeg) === 1) score += 6;
        score += Math.min(popularityScore * 2, 16);

        if (averageCartPrice > 0) {
          const priceGap = Math.abs(Number(item.price || 0) - averageCartPrice);
          if (priceGap <= 150) score += 6;
          else if (priceGap <= 300) score += 3;
        }

        if (cartCategories.has('Mains') && ['Desserts', 'Beverages'].includes(item.category)) score += 8;
        if (cartCategories.has('Breakfast') && item.category === 'Beverages') score += 8;
        if (cart.length === 0 && item.available) score += 1;

        return { item, score };
      })
      .sort((a, b) => b.score - a.score || Number(a.item.price || 0) - Number(b.item.price || 0) || String(a.item.name).localeCompare(String(b.item.name)))
      .map(result => result.item)
      .slice(0, 4);
  }, [activeCategory, cart, cartSubtotal, cartTotalQty, mealConfig.defaultCategory, menuItems, orders, vegOnly]);

  const addCustomItemToCart = () => {
    if (!customItemName.trim()) return;
    const customItem = {
      id: 'custom-' + Date.now(),
      name: `[Custom Request] ${customItemName}`,
      desc: customItemNote || 'Custom request prepared by instruction.',
      price: 0,
      category: 'Custom',
      isVeg: 2,
      available: 1
    };
    setCart(prev => [...prev, { ...customItem, qty: 1 }]);
    setCustomItemName('');
    setCustomItemNote('');
    setShowCustomModal(false);
    showToast('Custom request added to cart!');
  };

  const placeOrder = (customPayload = null) => {
    const isService = customPayload && customPayload.type === 'SERVICE';

    if (!isService) {
      const unavailableCartItem = cart.find(item => {
        if (String(item.id).startsWith('custom-')) return false;
        const liveItem = menuItems.find(menuItem => String(menuItem.id) === String(item.id));
        return liveItem?.available === false;
      });
      if (unavailableCartItem) {
        showToast(`${unavailableCartItem.name} is unavailable. Please choose another item.`);
        return;
      }
    }

    const orderPayload = isService ? {
      room: roomNumber,
      type: 'SERVICE',
      deliveryPreference: 'AS_READY',
      items: [{
        name: customPayload.name,
        qty: 1,
        price: 0,
        status: 'PENDING'
      }],
      note: customPayload.note || '',
      subtotal: 0,
      total: 0
    } : {
      room: roomNumber,
      type: 'FOOD',
      deliveryPreference,
      items: cart.map(i => {
        const extraNote = modalInstructions[i.id] ? `(${modalInstructions[i.id]})` : '';
        return {
          id: i.id,
          name: `${i.name} ${extraNote}`.trim(),
          desc: i.desc,
          qty: i.qty,
          price: i.price,
          status: 'PENDING'
        };
      }),
      note: specialNote,
      subtotal: cartSubtotal,
      total: grandTotal
    };

    socket.emit('place_order', { order: orderPayload, sessionId });
  };

  const cancelActiveOrder = async (orderId) => {
    try {
      const res = await fetch(`/api/guest/orders/${orderId}/cancel`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Order cancelled successfully!');
        updateLastOrderId(null);
        setCurrentScreen('menu');
      } else {
        showToast(data.error || 'Failed to cancel order.');
      }
    } catch {
      showToast('Error sending cancellation request.');
    }
  };

  const triggerSosAlert = async () => {
    try {
      const res = await fetch('/api/guest/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.existing ? 'SOS is already active. Staff are responding.' : 'SOS alarm triggered. Staff are responding.');
        setCurrentScreen('sos');
      } else {
        showToast(data.error || 'Could not trigger SOS alert.');
      }
    } catch {
      showToast('Error triggering SOS alert.');
    }
  };

  const clearSosAlert = async (alertId) => {
    try {
      const res = await fetch(`/api/guest/sos/${alertId}/safe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      if (data.success) {
        showToast('SOS cleared. Staff have been notified you are safe.');
        setCurrentScreen('sos');
      } else {
        showToast(data.error || 'Could not clear SOS alert.');
      }
    } catch {
      showToast('Error clearing SOS alert.');
    }
  };

  const submitFeedback = async () => {
    try {
      await fetch('/api/guest/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          orderId: feedbackOrderId,
          serviceRating,
          foodRating,
          suggestion: feedbackSuggestion
        })
      });
      showToast('Thank you for validating our service!');
      setShowFeedbackModal(false);
      setFeedbackSuggestion('');
      updateLastOrderId(null);
      setCurrentScreen('menu');
    } catch {
      showToast('Error submitting feedback.');
    }
  };

  const activeFoodStatuses = ['NEW', 'PREPARING', 'ON_THE_WAY'];
  const trackingOrder =
    orders.find(o => o.id === lastOrderId && o.type === 'FOOD' && activeFoodStatuses.includes(o.status)) ||
    orders.find(o => String(o.room) === String(roomNumber) && o.type === 'FOOD' && activeFoodStatuses.includes(o.status));
  const cancelSecondsLeft = trackingOrder ? Math.max(0, Math.ceil((60000 - ((nowTick || Number(trackingOrder.createdAt || 0)) - Number(trackingOrder.createdAt || 0))) / 1000)) : 0;
  const canCancelTrackingOrder = Boolean(trackingOrder && cancelSecondsLeft > 0 && !['DELIVERED', 'CANCELLED'].includes(trackingOrder.status));

  // Trigger feedback form automatically if order completed/delivered
  useEffect(() => {
    if (lastOrderId) {
      const ord = orders.find(o => o.id === lastOrderId);
      if (ord && ord.status === 'DELIVERED') {
        setFeedbackOrderId(lastOrderId);
        setShowFeedbackModal(true);
      }
    }
  }, [orders, lastOrderId]);

  if (isValidating) {
    return (
      <div style={{ minHeight: '100vh', background: C.sand, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.textSub }}>
        <div style={{ border: `4px solid ${C.border}`, borderTop: `4px solid ${ACCENT_BLUE}`, borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite', marginBottom: 16 }} />
        <h3 style={{ margin: 0, fontWeight: 600 }}>Connecting to Hotel Elite Suite...</h3>
      </div>
    );
  }

  if (authError) {
    return (
      <div style={{ minHeight: '100vh', background: C.sand, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', color: C.text }}>
        <div style={{ background: C.dangerLight, color: C.danger, padding: 24, borderRadius: '50%', marginBottom: 24 }}>
          <AlertOctagon size={48} />
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
      background: '#F9FAFB',
      position: 'relative',
      paddingBottom: 110,
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
      color: C.text
    }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#0F172A', color: '#FFFFFF', padding: '14px 24px', borderRadius: 20,
          boxShadow: '0 12px 36px rgba(0,0,0,0.2)', zIndex: 99999,
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13, fontWeight: 750, width: 'calc(100% - 48px)', maxWidth: 380,
          boxSizing: 'border-box',
        }} className="animate-slide-down">
          <CheckCircle size={16} color={ACCENT_BLUE} />
          <span>{toast}</span>
        </div>
      )}

      {/* Out of Stock Swap Modal */}
      {outOfStockAlert && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 24 }}>
          <Card style={{ padding: 24, borderRadius: 28, background: '#FFF', maxWidth: 400, textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ background: '#FEE2E2', color: '#EF4444', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <AlertOctagon size={32} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 10px 0' }}>Item Out of Stock!</h3>
            <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.5, marginBottom: 20 }}>
              We apologize, but {outOfStockAlert.name} just ran out in the kitchen. Please select an alternative dish.
            </p>
            {Array.isArray(outOfStockAlert.alternatives) && outOfStockAlert.alternatives.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, textAlign: 'left' }}>
                {outOfStockAlert.alternatives.slice(0, 3).map(alt => (
                  <button
                    key={alt.id}
                    onClick={() => {
                      const liveItem = menuItems.find(item => String(item.id) === String(alt.id)) || alt;
                      setOutOfStockAlert(null);
                      setCurrentScreen('menu');
                      setSelectedItem(liveItem);
                    }}
                    style={{ border: `1px solid ${C.borderLight}`, background: '#F8FAFC', color: C.text, borderRadius: 14, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', fontFamily: 'inherit', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alt.name}</span>
                    <span style={{ fontSize: 12, color: ACCENT_BLUE, fontWeight: 900 }}>Rs. {alt.price}</span>
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button 
                onClick={() => {
                  setOutOfStockAlert(null);
                  setCurrentScreen('menu');
                  showToast('Please select another item from the menu.');
                }}
                style={{ background: ACCENT_BLUE, color: '#FFF', border: 'none', padding: '12px 20px', borderRadius: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Browse Alternatives
              </button>
              <button 
                onClick={() => setOutOfStockAlert(null)}
                style={{ background: C.borderLight, color: C.text, border: 'none', padding: '12px 20px', borderRadius: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Dismiss Alert
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Feedback Overlay */}
      {showFeedbackModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,43,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 24, backdropFilter: 'blur(8px)' }}>
          <Card style={{ padding: 24, borderRadius: 28, background: '#FFF', maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ background: '#D1FAE5', color: '#059669', padding: 8, borderRadius: '50%' }}><Award size={24} /></div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Service Validation & Feedback</h2>
            </div>
            <p style={{ fontSize: 13, color: C.textSub, margin: '0 0 20px 0', lineHeight: 1.45 }}>
              Your order has been delivered! Please rate your experience so Elite International can maintain exceptional hospitality.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 750, color: C.text, marginBottom: 8 }}>Service Speed & Quality</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setServiceRating(star)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                      <Star size={24} fill={star <= serviceRating ? '#FBBF24' : 'none'} color={star <= serviceRating ? '#FBBF24' : C.border} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 750, color: C.text, marginBottom: 8 }}>Food Taste & Quality</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setFoodRating(star)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                      <Star size={24} fill={star <= foodRating ? '#FBBF24' : 'none'} color={star <= foodRating ? '#FBBF24' : C.border} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 750, color: C.text, marginBottom: 8 }}>Suggest Future Dishes or Software Improvement</label>
                <textarea
                  placeholder="e.g. Would love to have Tandoori Momos next time! / App works smoothly."
                  value={feedbackSuggestion}
                  onChange={e => setFeedbackSuggestion(e.target.value)}
                  style={{ width: '100%', minHeight: 80, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, fontSize: 13, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <button 
              onClick={submitFeedback}
              style={{ width: '100%', background: ACCENT_BLUE, color: '#FFF', padding: 14, borderRadius: 16, border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Submit Feedback & Close
            </button>
          </Card>
        </div>
      )}

      {/* Custom Item Modal */}
      {showCustomModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 24 }}>
          <Card style={{ padding: 24, borderRadius: 28, background: '#FFF', maxWidth: 400, width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px 0' }}>Request Off-Menu Item</h3>
            <p style={{ fontSize: 13, color: C.textSub, margin: '0 0 20px 0', lineHeight: 1.4 }}>
              Request a custom preparation (e.g. Mashed baby food without salt, warm milk). Our chef will do their best to accommodate you.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <input
                type="text"
                placeholder="What dish/item do you need?"
                value={customItemName}
                onChange={e => setCustomItemName(e.target.value)}
                style={{ width: '100%', padding: 12, borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              <textarea
                placeholder="Any specific cooking instructions? (e.g. boiled, no oil, for kids)"
                value={customItemNote}
                onChange={e => setCustomItemNote(e.target.value)}
                style={{ width: '100%', minHeight: 70, padding: 12, borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 13, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => setShowCustomModal(false)}
                style={{ flex: 1, background: C.borderLight, color: C.text, border: 'none', padding: 12, borderRadius: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button 
                onClick={addCustomItemToCart}
                style={{ flex: 1, background: ACCENT_BLUE, color: '#FFF', border: 'none', padding: 12, borderRadius: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Add Request
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* DINING SCREEN */}
      {currentScreen === 'menu' && (
        <div className="animate-fade-up">
          {/* Sticky Header */}
          <div className="guest-header" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(14px)', padding: '18px 20px', borderBottom: `1px solid ${C.borderLight}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h1 style={{ color: C.text, fontSize: 17, margin: 0, fontWeight: 800 }}>Hotel Elite International</h1>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: socketConnected ? '#10B981' : C.danger }}></div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: ACCENT_BLUE, fontSize: 11, marginTop: 4, background: `${ACCENT_BLUE}10`, padding: '3px 8px', borderRadius: 999 }}>
                  <MapPin size={10} />
                  <span style={{ fontWeight: 750 }}>Room {roomNumber}</span>
                </div>
              </div>
              <button onClick={() => setCurrentScreen('cart')} style={{ position: 'relative', background: C.white, padding: 8, borderRadius: 999, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
                <ShoppingCart size={18} color={C.text} />
                {cartTotalQty > 0 && (
                  <div style={{ position: 'absolute', top: -5, right: -5, background: ACCENT_BLUE, color: C.white, fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {cartTotalQty}
                  </div>
                )}
              </button>
            </div>

            {/* Search */}
            <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={14} color={C.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search dining menu..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 12, border: 'none', background: C.borderLight, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <button
                onClick={() => setVegOnly(!vegOnly)}
                style={{ background: vegOnly ? `${ACCENT_BLUE}14` : C.white, border: `1px solid ${vegOnly ? ACCENT_BLUE : C.border}`, borderRadius: 12, padding: 10, cursor: 'pointer' }}
              >
                <SlidersHorizontal size={14} color={vegOnly ? ACCENT_BLUE : C.textSub} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {mealSpecialItem && (
              <div style={{ background: `linear-gradient(135deg, ${C.emerald} 0%, #111827 100%)`, borderRadius: 24, padding: 20, color: C.white, position: 'relative', overflow: 'hidden' }}>
                <div style={{ width: '60%', position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: 999, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
                    <Clock size={10} /> {mealConfig.mealName} Special
                  </div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.white }}>{mealSpecialItem.name}</h3>
                  <p style={{ margin: '6px 0 14px 0', fontSize: 11.5, opacity: 0.9 }}>{mealSpecialItem.desc || mealConfig.tagline}</p>
                  <button
                    onClick={() => setSelectedItem(mealSpecialItem)}
                    style={{ background: C.white, color: C.text, border: 'none', padding: '8px 14px', borderRadius: 999, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                  >
                    Order Now (₹{mealSpecialItem.price})
                  </button>
                </div>
                {mealSpecialItem.image && (
                  <div style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', width: 100, height: 100, borderRadius: 20, overflow: 'hidden', border: '3px solid rgba(255,255,255,0.2)' }}>
                    <img src={mealSpecialItem.image} alt={mealSpecialItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text }}>Recommended Add-ons</h3>
                <span style={{ color: ACCENT_BLUE, fontSize: 11, fontWeight: 700 }}>Recommended</span>
              </div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }} className="hide-scrollbar">
                {recommendedItems.length === 0 ? (
                  <Card style={{ minWidth: '100%', padding: 18, borderRadius: 18, textAlign: 'center', border: `1px dashed ${C.border}`, color: C.textSub }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>No recommendations right now</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Add a dish or clear filters to see suggestions.</div>
                  </Card>
                ) : recommendedItems.map((item) => {
                  const meta = getItemMeta(item);
                  const qty = getQty(item.id);
                  return (
                    <FeaturedItemCard 
                      key={item.id} 
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

            {/* Custom Request Trigger */}
            <Card style={{ padding: 14, border: `1.5px dashed ${ACCENT_BLUE}40`, background: `${ACCENT_BLUE}04`, borderRadius: 20, textAlign: 'center', cursor: 'pointer' }} onClick={() => setShowCustomModal(true)}>
              <div style={{ fontWeight: 800, fontSize: 13, color: ACCENT_BLUE }}>Can't find what you want?</div>
              <div style={{ fontSize: 11, color: C.textSub, marginTop: 4 }}>Click here to make an off-menu custom food request.</div>
            </Card>

            {/* Full Menu List */}
            <div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 800, color: C.text }}>Full Menu</h3>
              <div className="hide-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14 }}>
                {categories.map(cat => {
                  const isSelected = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      style={{ whiteSpace: 'nowrap', padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, border: `1px solid ${isSelected ? C.text : C.border}`, background: isSelected ? C.text : C.white, color: isSelected ? C.white : C.textSub, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {menuItems.length === 0 ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} style={{ background: C.white, borderRadius: 20, padding: 14, display: 'flex', gap: 14, alignItems: 'center', border: '1px solid rgba(0,0,0,0.04)', height: 120 }}>
                      <div className="shimmer" style={{ width: '35%', height: '100%', borderRadius: 14, flexShrink: 0 }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, height: '100%', justifyContent: 'center' }}>
                        <div className="shimmer" style={{ width: '60%', height: 16, borderRadius: 4 }} />
                        <div className="shimmer" style={{ width: '85%', height: 12, borderRadius: 4 }} />
                        <div className="shimmer" style={{ width: '30%', height: 12, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))
                ) : displayedItems.length === 0 ? (
                  <Card style={{ padding: 20, border: `1.5px dashed ${ACCENT_BLUE}40`, background: `${ACCENT_BLUE}04`, borderRadius: 20, textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: ACCENT_BLUE }}>No items for this category</div>
                    <div style={{ fontSize: 13, color: C.textSub, marginTop: 6 }}>View the full menu or make an off-menu custom food request.</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                      <button
                        onClick={() => {
                          setActiveCategory('All');
                          setSearchQuery('');
                          setVegOnly(false);
                        }}
                        style={{ background: ACCENT_BLUE, color: '#FFF', border: 'none', padding: '9px 14px', borderRadius: 12, fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Go to All Menu
                      </button>
                      <button
                        onClick={() => setShowCustomModal(true)}
                        style={{ background: C.white, color: ACCENT_BLUE, border: `1px solid ${ACCENT_BLUE}30`, padding: '9px 14px', borderRadius: 12, fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Custom Request
                      </button>
                    </div>
                  </Card>
                ) : displayedItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    qty={getQty(item.id)}
                    isTimingHighlight={item.category === mealConfig.defaultCategory}
                    updateQty={updateQty}
                    onCardClick={setSelectedItem}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HOSPITALITY SERVICES SCREEN */}
      {currentScreen === 'services' && (
        <div style={{ padding: 20 }} className="animate-fade-up">
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px 0' }}>Hospitality Services</h2>
          <p style={{ fontSize: 13, color: C.textSub, margin: '0 0 20px 0' }}>Directly request hotel amenities and services in one tap.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {serviceItems.length > 0 ? serviceItems.map(service => (
              <Card key={service.id} style={{ padding: 16, borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>{service.name}</h3>
                  <span style={{ fontSize: 11, color: C.emeraldMid, background: '#D1FAE5', padding: '3px 8px', borderRadius: 999, fontWeight: 700, whiteSpace: 'nowrap' }}>Available</span>
                </div>
                <p style={{ fontSize: 12, color: C.textSub, margin: '0 0 14px 0', lineHeight: 1.4 }}>{service.desc || 'Request this hotel service from your room.'}</p>
                <button 
                  onClick={() => {
                    placeOrder({ type: 'SERVICE', name: service.name, note: service.desc || `${service.name} requested` });
                    showToast('Service request submitted to reception!');
                  }}
                  style={{ background: ACCENT_BLUE, color: '#FFF', border: 'none', width: '100%', padding: 12, borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
                >
                  Request Service
                </button>
              </Card>
            )) : (
              <Card style={{ padding: 18, borderRadius: 20, textAlign: 'center', color: C.textSub }}>
                No room services are available right now. Please call the front desk.
              </Card>
            )}

            <Card style={{ padding: 16, borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ background: '#EFF6FF', padding: 12, borderRadius: '50%', color: ACCENT_BLUE }}><Phone size={20} /></div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Front Desk Call</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: 11, color: C.textSub }}>Dial extension 9 directly from room phone.</p>
              </div>
              <a href="tel:9" style={{ background: C.text, color: '#FFF', textDecoration: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 11, fontWeight: 750 }}>Call</a>
            </Card>
          </div>
        </div>
      )}

      {/* SOS EMERGENCY PANIC SCREEN */}
      {currentScreen === 'sos' && (() => {
        const activeSOSAlert = sosAlerts.find(alert => !['RESOLVED', 'CANCELLED'].includes(alert.status));
        
        const triggerSOS = () => {
          setSosCountdown(3);
          let timeLeft = 3;
          sosTimerRef.current = setInterval(() => {
            timeLeft -= 1;
            setSosCountdown(timeLeft);
            if (timeLeft <= 0) {
              clearInterval(sosTimerRef.current);
              setSosCountdown(0);
              triggerSosAlert();
            }
          }, 1000);
        };

        const cancelSOSCountdown = () => {
          if (sosTimerRef.current) {
            clearInterval(sosTimerRef.current);
          }
          setSosCountdown(0);
          showToast('Emergency alert cancelled.');
        };

        return (
          <div style={{ padding: 24, textAlign: 'center' }} className="animate-fade-up">
            {activeSOSAlert ? (
              // Alert Sent & Active state
              <div style={{ animation: 'pulseSOS 2s infinite' }}>
                <style>{`
                  @keyframes pulseSOS {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                    100% { transform: scale(1); }
                  }
                `}</style>
                <div style={{ background: '#FEE2E2', color: ACCENT_RED, width: 90, height: 90, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '30px auto 20px auto', boxShadow: '0 0 30px rgba(239,68,68,0.4)' }}>
                  <AlertOctagon size={48} />
                </div>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: '#DC2626', margin: '0 0 12px 0', letterSpacing: -0.5 }}>SOS ALERT ACTIVE</h2>
                <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.6, margin: '0 auto 30px auto', maxWidth: 360, fontWeight: 600 }}>
                  Help is on the way to Room {roomNumber}. Hotel management and security have been notified.
                  {activeSOSAlert.status === 'ACKNOWLEDGED' ? ' Staff have acknowledged the alert.' : ''}
                </p>
                
                <button 
                  onClick={() => clearSosAlert(activeSOSAlert.id)}
                  style={{ width: '100%', maxWidth: 280, padding: '16px 24px', borderRadius: 16, background: C.text, color: '#FFF', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
                >
                  I am Safe / Dismiss Alert
                </button>
              </div>
            ) : sosCountdown > 0 ? (
              // Countdown state
              <div>
                <div style={{ background: '#FFFBEB', color: '#D97706', width: 90, height: 90, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '30px auto 20px auto', border: '3px solid #FCD34D' }}>
                  <div style={{ fontSize: 32, fontWeight: 900 }}>{sosCountdown}</div>
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: '0 0 10px 0' }}>Sending SOS Alert...</h2>
                <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.5, margin: '0 auto 30px auto', maxWidth: 360 }}>
                  Emergency panic signal will be sent to the front desk automatically in {sosCountdown} seconds.
                </p>
                
                <button 
                  onClick={cancelSOSCountdown}
                  style={{ width: '100%', maxWidth: 220, padding: '14px 20px', borderRadius: 16, background: '#EF4444', color: '#FFF', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 15px rgba(239,68,68,0.2)' }}
                >
                  CANCEL
                </button>
              </div>
            ) : (
              // Idle state
              <div>
                <div style={{ background: '#FEE2E2', color: ACCENT_RED, width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '30px auto 20px auto', boxShadow: '0 0 24px rgba(239,68,68,0.2)' }}>
                  <AlertOctagon size={44} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: '0 0 10px 0' }}>Emergency SOS Button</h2>
                <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.5, margin: '0 auto 30px auto', maxWidth: 360 }}>
                  Pressing the button below sends an immediate emergency signal to the front desk and pantry, triggering an audio alarm for medical help or urgent assistance.
                </p>

                <button 
                  onClick={triggerSOS}
                  style={{ width: 180, height: 180, borderRadius: '50%', background: ACCENT_RED, color: '#FFF', border: `8px solid #FEE2E2`, fontSize: 22, fontWeight: 900, cursor: 'pointer', boxShadow: '0 12px 30px rgba(239,68,68,0.4)', outline: 'none', transition: 'all 0.15s' }}
                >
                  PANIC / SOS
                </button>
                
                <div style={{ marginTop: 24, fontSize: 12, color: C.textSub }}>
                  Emergency triggers will log Room {roomNumber} instantly.
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* CART SCREEN */}
      {currentScreen === 'cart' && (
        <div className="animate-fade-up" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <button onClick={() => setCurrentScreen('menu')} style={{ border: 'none', padding: 6, background: C.white, borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
              <ChevronLeft size={18} />
            </button>
            <h2 style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: 17, fontWeight: 800 }}>Cart</h2>
            <div style={{ width: 30 }}></div>
          </div>

          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <ShoppingCart size={32} color={C.textMuted} style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: '0 0 4px 0' }}>Your cart is empty</h3>
              <button onClick={() => setCurrentScreen('menu')} style={{ background: ACCENT_BLUE, color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 12, cursor: 'pointer', marginTop: 12 }}>
                Browse Dining Menu
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {cart.map((item) => (
                  <Card key={item.id} style={{ padding: 12, border: 'none', borderRadius: 16, boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: 14 }}>{item.name}</span>
                        <div style={{ color: C.textSub, fontSize: 11, marginTop: 4 }}>₹{item.price} each</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 800, color: ACCENT_BLUE, fontSize: 14 }}>₹{item.price * item.qty}</span>
                        <QuantityControl qty={item.qty} onAdd={() => updateQty(item, 1)} onIncrease={() => updateQty(item, 1)} onDecrease={() => updateQty(item, -1)} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Preferences */}
              <Card style={{ padding: 14, border: 'none', borderRadius: 16, marginBottom: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 10px 0' }}>Preparation Preference</h3>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <button onClick={() => setDeliveryPreference('ALL_AT_ONCE')} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1.5px solid ${deliveryPreference === 'ALL_AT_ONCE' ? ACCENT_BLUE : C.border}`, background: deliveryPreference === 'ALL_AT_ONCE' ? `${ACCENT_BLUE}08` : C.white, color: deliveryPreference === 'ALL_AT_ONCE' ? ACCENT_BLUE : C.textSub, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>All at once</button>
                  <button onClick={() => setDeliveryPreference('AS_READY')} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1.5px solid ${deliveryPreference === 'AS_READY' ? ACCENT_BLUE : C.border}`, background: deliveryPreference === 'AS_READY' ? `${ACCENT_BLUE}08` : C.white, color: deliveryPreference === 'AS_READY' ? ACCENT_BLUE : C.textSub, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>As soon as ready</button>
                </div>
                <textarea
                  placeholder="Allergies, spice levels or baby food details..."
                  value={specialNote}
                  onChange={e => setSpecialNote(e.target.value)}
                  style={{ width: '100%', border: 'none', background: C.borderLight, borderRadius: 10, padding: 10, fontSize: 12, minHeight: 50, resize: 'none', boxSizing: 'border-box' }}
                />
              </Card>

              {/* Bill Summary */}
              <Card style={{ padding: 16, border: 'none', borderRadius: 16, marginBottom: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 10px 0' }}>Bill Summary</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: C.textSub }}>
                  <span>Item Subtotal</span><span>₹{cartSubtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: C.textSub }}>
                  <span>Taxes ({(cgstRate + sgstRate).toFixed(1)}%)</span><span>₹{(cgst + sgst).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 12, color: C.textSub }}>
                  <span>Service Charge ({serviceChargeRate.toFixed(1)}%)</span><span>₹{serviceCharge.toFixed(2)}</span>
                </div>
                <div style={{ borderTop: `1px dashed ${C.border}`, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: 13 }}>Grand Total</span>
                  <span style={{ fontWeight: 900, fontSize: 18, color: ACCENT_BLUE }}>₹{grandTotal.toFixed(0)}</span>
                </div>
              </Card>

              <button
                onClick={() => placeOrder()}
                style={{ width: '100%', background: ACCENT_BLUE, color: '#FFF', padding: 16, borderRadius: 16, fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer' }}
              >
                Send Order to Kitchen
              </button>
            </>
          )}
        </div>
      )}

      {/* TRACKING SCREEN */}
      {currentScreen === 'tracking' && (
        <div className="animate-fade-up" style={{ padding: 20 }}>
          {trackingOrder ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Card style={{ padding: 16, borderRadius: 24, background: '#FFF', border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Order Progress</h3>
                  <span style={{ fontSize: 11, background: `${ACCENT_BLUE}12`, color: ACCENT_BLUE, padding: '3px 8px', borderRadius: 999, fontWeight: 700 }}>
                    Token {trackingOrder.token}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  <div style={{ height: 6, borderRadius: 999, background: C.borderLight, overflow: 'hidden' }}>
                    <div style={{ width: trackingOrder.status === 'NEW' ? '25%' : trackingOrder.status === 'PREPARING' ? '60%' : trackingOrder.status === 'ON_THE_WAY' ? '85%' : '100%', height: '100%', background: ACCENT_BLUE, borderRadius: 999 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.textSub }}>
                    <span>Placed</span>
                    <span>Preparing</span>
                    <span>Dispatched</span>
                    <span>Delivered</span>
                  </div>
                </div>

                {canCancelTrackingOrder && (
                  <button 
                    onClick={() => cancelActiveOrder(trackingOrder.id)}
                    style={{ background: '#FEE2E2', color: ACCENT_RED, border: 'none', width: '100%', padding: 10, borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
                  >
                    Cancel Order ({cancelSecondsLeft}s)
                  </button>
                )}
              </Card>

              {/* Items Summary */}
              <Card style={{ padding: 16, borderRadius: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 12px 0' }}>Ordered Items</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {trackingOrder.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ fontWeight: 650 }}>{item.qty}x {item.name}</span>
                      <span style={{ color: ACCENT_BLUE, fontWeight: 750 }}>
                        {item.status === 'DISPATCHED' ? 'On Way' : item.status === 'PENDING' ? 'Cooking' : 'Ready'}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <Card style={{ padding: 24, textAlign: 'center', borderRadius: 20 }}>
              <HelpCircle size={28} color={C.textMuted} style={{ margin: '0 auto 10px auto' }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px 0' }}>No active orders</h3>
              <p style={{ fontSize: 12, color: C.textSub, margin: '0 0 14px 0' }}>Orders placed will show tracking progress here.</p>
              <button onClick={() => setCurrentScreen('menu')} style={{ background: ACCENT_BLUE, color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: 10, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                Go to Menu
              </button>
            </Card>
          )}
        </div>
      )}

      {/* Bottom Navigation Tabs */}
      {currentScreen !== 'cart' && (
        <div className="guest-bottom-nav" style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: 448, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderRadius: 24, padding: '8px 10px', boxShadow: '0 12px 30px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 999, border: `1px solid ${C.borderLight}` }}>
          {[
            { id: 'menu', icon: Utensils, label: 'Dining' },
            { id: 'services', icon: ChefHat, label: 'Services' },
            { id: 'sos', icon: AlertOctagon, label: 'SOS', color: ACCENT_RED },
            { id: 'tracking', icon: Clock, label: 'Track' }
          ].map(tab => {
            const isActive = currentScreen === tab.id;
            const Icon = tab.icon;
            const color = tab.color || (isActive ? ACCENT_BLUE : C.textSub);
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentScreen(tab.id)}
                style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 10px', borderRadius: 14, cursor: 'pointer', color: color, minWidth: 70 }}
              >
                <Icon size={18} fill={isActive && tab.id === 'sos' ? ACCENT_RED : 'none'} />
                <span style={{ fontSize: 10, fontWeight: 800 }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,43,0.4)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setSelectedItem(null)}>
          <div className="animate-slide-up" style={{ background: C.white, width: '100%', maxWidth: 480, borderTopLeftRadius: 28, borderTopRightRadius: 28, boxSizing: 'border-box', boxShadow: '0 -10px 30px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setSelectedItem(null)} style={{ background: C.borderLight, border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ChevronLeft size={18} style={{ transform: 'rotate(-90deg)' }} />
              </button>
            </div>
            
            <div className="hide-scrollbar" style={{ overflowY: 'auto', padding: '0 20px 20px', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '8px 0 16px' }}>
                <div style={{ width: 180, height: 180, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {selectedItem.image ? (
                    <img src={selectedItem.image} alt={selectedItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Utensils size={40} style={{ opacity: 0.3 }} />
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{selectedItem.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F3F4F6', borderRadius: 16, padding: '3px 8px' }}>
                  <button onClick={() => setModalQty(q => Math.max(0, q - 1))} style={{ background: 'none', border: 'none', fontWeight: 900, cursor: 'pointer' }}>−</button>
                  <span style={{ fontWeight: 800, fontSize: 13 }}>{modalQty}</span>
                  <button onClick={() => setModalQty(q => q + 1)} style={{ background: 'none', border: 'none', fontWeight: 900, cursor: 'pointer' }}>+</button>
                </div>
              </div>

              <p style={{ color: C.textSub, fontSize: 13, lineHeight: 1.4, margin: '0 0 16px 0' }}>
                {selectedItem.desc || 'Prepared fresh by our expert chefs.'}
              </p>

              <div style={{ background: C.sand, borderRadius: 12, padding: 12, border: `1px solid ${C.border}` }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 6, display: 'block' }}>Add special instruction for kitchen...</label>
                <textarea
                  placeholder="e.g. No salt, extra spicy..."
                  value={modalInstructions[selectedItem.id] || ''}
                  onChange={e => setModalInstructions(prev => ({ ...prev, [selectedItem.id]: e.target.value }))}
                  style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 13, minHeight: 40, resize: 'none', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.white }}>
              <div>
                <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700 }}>Total Price</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: ACCENT_BLUE }}>₹{selectedItem.price * modalQty}</div>
              </div>
              <button
                onClick={() => {
                  updateQty(selectedItem, modalQty - getQty(selectedItem.id));
                  setSelectedItem(null);
                }}
                style={{ background: C.text, color: C.white, padding: '10px 20px', borderRadius: 16, border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
              >
                {modalQty === 0 ? 'Remove' : 'Update Cart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

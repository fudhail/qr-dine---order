import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart, ChevronLeft, CheckCircle, MapPin, Phone,
  Search, SlidersHorizontal, Star, Clock, Flame, Utensils, HelpCircle,
  MoreHorizontal, ChefHat, Check, AlertOctagon, HelpCircle as HelpIcon, Trash2, Heart, Award
} from 'lucide-react';
import { C } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { QuantityControl } from '../../components/ui/QuantityControl';
import { VegDot } from '../../components/ui/VegDot';
import { CONFIG } from '../../config';
import { useStore } from '../../store/useStore';
import { socket } from '../../lib/socket';

const ACCENT_BLUE = '#2563EB';
const ACCENT_RED = '#EF4444';
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
  return (
    <div style={{ minWidth: 220, maxWidth: 220, display: 'flex', cursor: 'pointer' }} onClick={() => onCardClick(item)}>
      <Card style={{ padding: 0, width: '100%', height: 300, position: 'relative', overflow: 'hidden', borderRadius: 24, border: qty > 0 ? `1.5px solid ${ACCENT_BLUE}` : '1px solid rgba(0,0,0,0.03)', boxShadow: qty > 0 ? `0 12px 28px ${ACCENT_BLUE}15` : '0 8px 24px rgba(15,27,43,0.04)', background: qty > 0 ? `${ACCENT_BLUE}06` : C.white, transition: 'all 0.2s', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 150, position: 'relative', background: 'linear-gradient(180deg, #FFF9ED 0%, #FFFDF9 100%)', flexShrink: 0 }}>
          {item.image ? (
            <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Utensils size={32} style={{ opacity: 0.2 }} /></div>
          )}
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.94)', padding: '4px 8px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <Star size={10} color={ACCENT_BLUE} fill={ACCENT_BLUE} />
            <span style={{ fontSize: 10, fontWeight: 800, color: C.text }}>{meta.rating}</span>
          </div>
        </div>
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: C.textSub, minHeight: 14 }}>
            <span>{meta.time}</span><span>·</span><span>{meta.calories}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }} onClick={e => e.stopPropagation()}>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>₹{item.price}</span>
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
        height: 120, 
        borderRadius: 20, 
        border: qty > 0 ? `1.5px solid ${ACCENT_BLUE}` : (isTimingHighlight ? `1.5px solid ${ACCENT_BLUE}25` : '1px solid rgba(0,0,0,0.04)'), 
        boxShadow: '0 6px 18px rgba(15,27,43,0.04)', 
        background: C.white, 
        cursor: 'pointer', 
        position: 'relative', 
        overflow: 'hidden'
      }}
    >
      <div style={{ width: '35%', height: '100%', flexShrink: 0, position: 'relative', background: C.borderLight }}>
        {item.image ? (
          <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Utensils size={24} style={{ opacity: 0.2 }} /></div>
        )}
        <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(255,255,255,0.95)', padding: '3px 5px', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <VegDot isVeg={item.isVeg} />
        </div>
      </div>
      
      <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', boxSizing: 'border-box' }}>
        <div>
          <h3 style={{ fontSize: 15, color: C.text, margin: 0, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{item.name}</h3>
          <p style={{ color: C.textSub, fontSize: 12, lineHeight: 1.3, margin: '4px 0 0 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {item.desc || 'Freshly prepared for you.'}
          </p>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, color: ACCENT_BLUE, fontSize: 16 }}>₹{item.price}</div>
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

    const handleSosAccepted = (data) => {
      showToast('SOS ALARM TRIGGERED! Staff are responding.');
    };

    const handleOutOfStock = (data) => {
      setOutOfStockAlert(data);
    };

    socket.on('order_rejected', handleRejected);
    socket.on('order_accepted', handleAccepted);
    socket.on('sos_accepted', handleSosAccepted);
    socket.on('item_out_of_stock_alert', handleOutOfStock);

    return () => {
      socket.off('order_rejected', handleRejected);
      socket.off('order_accepted', handleAccepted);
      socket.off('sos_accepted', handleSosAccepted);
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

  useEffect(() => {
    if (selectedItem) {
      setModalQty(getQty(selectedItem.id) || 1);
    }
  }, [selectedItem]);

  const categories = ['All', ...new Set(menuItems.filter(i => i.category !== 'Services').map(i => i.category))];

  const displayedItems = menuItems.filter(i => {
    if (i.category === 'Services') return false;
    const matchesCategory = activeCategory === 'All' || i.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.desc && i.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesVeg = !vegOnly || i.isVeg === 1;
    return i.available && matchesCategory && matchesSearch && matchesVeg;
  });

  const updateQty = (item, delta) => {
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

  const getQty = (id) => cart.find(i => i.id === id)?.qty || 0;

  const cartTotalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cgstRate = Number(billingConfig?.cgst ?? 2.5);
  const sgstRate = Number(billingConfig?.sgst ?? 2.5);
  const serviceChargeRate = Number(billingConfig?.serviceCharge ?? 10);
  const serviceCharge = cartSubtotal * (serviceChargeRate / 100);
  const cgst = (cartSubtotal + serviceCharge) * (cgstRate / 100);
  const sgst = (cartSubtotal + serviceCharge) * (sgstRate / 100);
  const grandTotal = cartSubtotal + cgst + sgst + serviceCharge;

  // Handle Swiggy-like recommendations
  const getAiRecommendations = () => {
    // Return items that complement what's in cart, or simple popular foods
    const inCartIds = new Set(cart.map(c => c.id));
    return menuItems
      .filter(item => item.available && item.category !== 'Services' && !inCartIds.has(item.id))
      .slice(0, 4);
  };

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
    const isEmergency = customPayload && customPayload.type === 'EMERGENCY';

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
    } : isEmergency ? {
      room: roomNumber,
      type: 'EMERGENCY',
      deliveryPreference: 'AS_READY',
      items: [{
        name: 'SOS Emergency assistance alarm',
        qty: 1,
        price: 0,
        status: 'PENDING'
      }],
      note: 'Emergency panic button triggered!',
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

  const trackingOrder = orders.find(o => o.id === lastOrderId && o.type !== 'EMERGENCY') || orders.find(o => o.room === roomNumber && o.status !== 'DELIVERED' && o.type !== 'EMERGENCY');

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
          boxSizing: 'border-box', animation: 'fadeIn 0.2s ease-out'
        }}>
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
              We apologize, but **{outOfStockAlert.name}** just ran out in the kitchen. Would you like to select an alternative dish or swap it?
            </p>
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
        <div>
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
            {/* Meal Special Banner */}
            <div style={{ background: `linear-gradient(135deg, ${C.emerald} 0%, #111827 100%)`, borderRadius: 24, padding: 20, color: C.white, position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: '60%', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: 999, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
                  <Clock size={10} /> {mealConfig.mealName} Special
                </div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.white }}>{mealConfig.special.name}</h3>
                <p style={{ margin: '6px 0 14px 0', fontSize: 11.5, opacity: 0.9 }}>Fresh morning energy & kitchen specials.</p>
                <button
                  onClick={() => setSelectedItem(mealConfig.special)}
                  style={{ background: C.white, color: C.text, border: 'none', padding: '8px 14px', borderRadius: 999, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                >
                  Order Now (₹{mealConfig.special.price})
                </button>
              </div>
              {mealConfig.special.image && (
                <div style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', width: 100, height: 100, borderRadius: 20, overflow: 'hidden', border: '3px solid rgba(255,255,255,0.2)' }}>
                  <img src={mealConfig.special.image} alt={mealConfig.special.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            {/* AI Recommendations (Swiggy-style) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text }}>Swiggy-Style AI Pairings</h3>
                <span style={{ color: ACCENT_BLUE, fontSize: 11, fontWeight: 700 }}>Recommended</span>
              </div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }} className="hide-scrollbar">
                {getAiRecommendations().map((item, idx) => {
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
                ) : displayedItems.map((item, idx) => (
                  <MenuItemCard 
                    key={item.id}
                    item={item}
                    idx={idx}
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
        <div style={{ padding: 20 }} className="animate-fade-in">
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px 0' }}>Hospitality Services</h2>
          <p style={{ fontSize: 13, color: C.textSub, margin: '0 0 20px 0' }}>Directly request hotel amenities and services in one tap.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card style={{ padding: 16, borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Room Cleaning</h3>
                <span style={{ fontSize: 11, color: C.emeraldMid, background: '#D1FAE5', padding: '3px 8px', borderRadius: 999, fontWeight: 700 }}>24/7 Service</span>
              </div>
              <p style={{ fontSize: 12, color: C.textSub, margin: '0 0 14px 0', lineHeight: 1.4 }}>Request housekeeping to sweep, clean surfaces, and make the bed in your room.</p>
              <button 
                onClick={() => {
                  placeOrder({ type: 'SERVICE', name: 'Make My Room / Cleaning', note: 'Housekeeping requested' });
                  showToast('Cleaning request submitted to reception!');
                }}
                style={{ background: ACCENT_BLUE, color: '#FFF', border: 'none', width: '100%', padding: 12, borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
              >
                Send Make My Room Request
              </button>
            </Card>

            <Card style={{ padding: 16, borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Laundry Service</h3>
                <span style={{ fontSize: 11, color: C.textSub, background: C.borderLight, padding: '3px 8px', borderRadius: 999, fontWeight: 700 }}>Standard pricing</span>
              </div>
              <p style={{ fontSize: 12, color: C.textSub, margin: '0 0 14px 0', lineHeight: 1.4 }}>Request laundry pick-up. Items will be cleaned, folded, and charged to room folio.</p>
              <button 
                onClick={() => {
                  placeOrder({ type: 'SERVICE', name: 'Laundry Pick-up & Wash', note: 'Laundry collection requested' });
                  showToast('Laundry collection request sent!');
                }}
                style={{ background: ACCENT_BLUE, color: '#FFF', border: 'none', width: '100%', padding: 12, borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
              >
                Request Laundry Pick-up
              </button>
            </Card>

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
        const activeSOSOrder = orders.find(o => o.type === 'EMERGENCY' && o.status !== 'DELIVERED');
        
        const triggerSOS = () => {
          setSosCountdown(3);
          let timeLeft = 3;
          sosTimerRef.current = setInterval(() => {
            timeLeft -= 1;
            setSosCountdown(timeLeft);
            if (timeLeft <= 0) {
              clearInterval(sosTimerRef.current);
              setSosCountdown(0);
              placeOrder({ type: 'EMERGENCY' });
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
          <div style={{ padding: 24, textAlign: 'center' }} className="animate-fade-in">
            {activeSOSOrder ? (
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
                  🚨 Help is on the way to Room {roomNumber}. Hotel management and security have been notified.
                </p>
                
                <button 
                  onClick={() => {
                    cancelActiveOrder(activeSOSOrder.id);
                    showToast('Emergency alert dismissed.');
                  }}
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
        <div className="animate-fade-in" style={{ padding: 20 }}>
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
        <div className="animate-fade-in" style={{ padding: 20 }}>
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

                {trackingOrder.status === 'NEW' && (
                  <button 
                    onClick={() => cancelActiveOrder(trackingOrder.id)}
                    style={{ background: '#FEE2E2', color: ACCENT_RED, border: 'none', width: '100%', padding: 10, borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
                  >
                    Cancel Order
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

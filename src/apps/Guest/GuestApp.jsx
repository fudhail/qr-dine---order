import React, { useState } from 'react';
import { ShoppingCart, ChevronRight, ChevronLeft, CheckCircle, MapPin, Phone } from 'lucide-react';
import { C } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { VegDot } from '../../components/ui/VegDot';

export const GuestApp = ({ menuItems, orders, setOrders, socketConnected }) => {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [specialNote, setSpecialNote] = useState('');
  const [lastOrderId, setLastOrderId] = useState(null);
  const [deliveryPreference, setDeliveryPreference] = useState('ALL_AT_ONCE'); // 'ALL_AT_ONCE' | 'AS_READY'

  const categories = ['All', ...new Set(menuItems.map(i => i.category))];
  const displayedItems = menuItems.filter(i => i.available && (activeCategory === 'All' || i.category === activeCategory));
  
  const cartTotalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cgst = cartSubtotal * 0.025;
  const sgst = cartSubtotal * 0.025;
  const serviceCharge = cartSubtotal * 0.10;
  const grandTotal = cartSubtotal + cgst + sgst + serviceCharge;

  const updateQty = (item, delta) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        const newQty = existing.qty + delta;
        if (newQty <= 0) return prev.filter(i => i.id !== item.id);
        return prev.map(i => i.id === item.id ? { ...i, qty: newQty } : i);
      }
      if (delta > 0) return [...prev, { ...item, qty: 1 }];
      return prev;
    });
  };

  const getQty = (id) => cart.find(i => i.id === id)?.qty || 0;

  const placeOrder = () => {
    if (cart.length === 0) return;
    const newOrder = {
      id: Date.now(),
      token: `#${orders.length + 10}`,
      room: '108', // Hardcoded for guest demo
      status: 'NEW',
      minutesAgo: 0,
      deliveryPreference,
      items: cart.map(i => ({ id: Date.now() + Math.random(), name: i.name, qty: i.qty, price: i.price, status: 'PENDING' })),
      note: specialNote,
      subtotal: cartSubtotal,
      total: grandTotal
    };
    setOrders([newOrder, ...orders]);
    setLastOrderId(newOrder.id);
    setCart([]);
    setSpecialNote('');
    setDeliveryPreference('ALL_AT_ONCE');
    setCurrentScreen('tracking');
  };

  const trackingOrder = orders.find(o => o.id === lastOrderId) || orders.find(o => o.room === '108');

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.sand, position: 'relative', paddingBottom: 100 }}>
      {/* MENU SCREEN */}
      {currentScreen === 'menu' && (
        <div className="animate-fade-up">
          <div style={{ position: 'sticky', top: 0, zIndex: 100, background: C.white, padding: '18px 20px', boxShadow: '0 6px 24px rgba(6,6,6,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h1 style={{ color: C.emerald, fontSize: 18, margin: 0 }}>Grand Vista</h1>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: socketConnected ? C.emeraldMid : C.danger, title: socketConnected ? 'Connected' : 'Disconnected' }}></div>
                </div>
                <p style={{ color: C.textSub, fontSize: 13, marginTop: 2 }}>Room 101 · In-room Dining</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setCurrentScreen('cart')} style={{ position: 'relative', background: C.emeraldLight, padding: 10, borderRadius: 12, boxShadow: '0 6px 18px rgba(6,78,59,0.08)' }}>
                  <ShoppingCart size={18} color={C.emerald} />
                  {cartTotalQty > 0 && (
                    <div key={cartTotalQty} className="animate-pulse-badge" style={{ position: 'absolute', top: -6, right: -6, background: C.brass, color: C.white, fontSize: 11, fontWeight: 700, width: 22, height: 22, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {cartTotalQty}
                    </div>
                  )}
                </button>
              </div>
            </div>

            <div style={{ marginTop: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ background: `linear-gradient(90deg, ${C.brassLight}20, ${C.emeraldLight}20)`, padding: 12, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: C.textSub, fontWeight: 700 }}>Today's Special</div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>Chef's Butter Chicken</div>
                    <div style={{ fontSize: 12, color: C.textSub, marginTop: 4 }}>Limited time — served with naan</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: C.brass }}>₹499</div>
                    <button onClick={() => updateQty({ id: 'special-1', name: "Chef's Butter Chicken", price: 499, isVeg: false }, 1)} style={{ marginTop: 8, background: C.brass, color: C.white, padding: '8px 12px', borderRadius: 10, fontWeight: 800 }}>Add</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="hide-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 12, paddingBottom: 4 }}>
              {categories.map(cat => (
                <button 
                  key={cat} onClick={() => setActiveCategory(cat)}
                  style={{ whiteSpace: 'nowrap', padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: activeCategory === cat ? C.emerald : C.borderLight, color: activeCategory === cat ? C.white : C.textSub, boxShadow: activeCategory === cat ? '0 8px 20px rgba(6,78,59,0.08)' : 'none' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Recommended / Upsell strip */}
            {(() => {
              const upsellItems = menuItems.filter(i => i.upsell).slice(0,3);
              const fallback = menuItems.slice(0,3);
              const items = upsellItems.length ? upsellItems : fallback;
              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Recommended for you</h3>
                    <span style={{ color: C.textSub, fontSize: 13 }}>Popular choices</span>
                  </div>
                  <div className="hide-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
                    {items.map((item, idx) => (
                      <div key={idx} style={{ minWidth: 220 }}>
                        <Card style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                          {item.image ? (
                            <div style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                              <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ) : (
                            <div style={{ width: 72, height: 72, borderRadius: 10, background: C.borderLight }} />
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontWeight: 800 }}>{item.name}</div>
                              <div style={{ fontWeight: 800, color: C.brass }}>₹{item.price}</div>
                            </div>
                            <div style={{ color: C.textSub, fontSize: 12, marginTop: 6 }}>{item.desc?.slice(0,60)}</div>
                            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                              <button onClick={() => updateQty(item, 1)} style={{ background: C.emerald, color: C.white, padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>Add</button>
                              <button onClick={() => { setActiveCategory(item.category || 'All'); window.scrollTo({ top: 400, behavior: 'smooth' }); }} style={{ background: C.borderLight, padding: '8px 12px', borderRadius: 10 }}>View</button>
                            </div>
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {displayedItems.map((item, idx) => {
              const qty = getQty(item.id);
              return (
                <Card key={item.id} style={{ padding: 12, display: 'flex', gap: 14, alignItems: 'center', animationDelay: `${idx * 0.04}s`, borderRadius: 16 }} className="animate-fade-up">
                  {item.image && (
                    <div style={{ width: 96, height: 80, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <VegDot isVeg={item.isVeg} />
                        <h3 style={{ fontSize: 16, color: C.text, margin: 0 }}>{item.name}</h3>
                      </div>
                      <div style={{ fontWeight: 800, color: C.emeraldMid }}>₹{item.price}</div>
                    </div>
                    <p style={{ color: C.textSub, fontSize: 13, margin: '8px 0', flex: 1 }}>{item.desc?.slice(0, 100)}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { updateQty(item, 1); }} style={{ background: C.emeraldLight, color: C.emerald, padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>{qty === 0 ? '+ ADD' : 'Add More'}</button>
                        <button onClick={() => { /* quick upsell: suggested combo */ }} style={{ background: 'transparent', border: '1px solid '+C.borderLight, padding: '8px 12px', borderRadius: 10 }}>Suggest Combo</button>
                      </div>
                      <div>
                        {qty > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1.5px solid ${C.emerald}`, borderRadius: 8, padding: '2px 8px' }}>
                            <button onClick={() => updateQty(item, -1)} style={{ color: C.emerald, fontWeight: 700, fontSize: 16, width: 24 }}>−</button>
                            <span style={{ fontWeight: 700, color: C.emerald, width: 20, textAlign: 'center' }}>{qty}</span>
                            <button onClick={() => updateQty(item, 1)} style={{ color: C.emerald, fontWeight: 700, fontSize: 16, width: 24 }}>+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {cartTotalQty > 0 && (
            <div className="animate-fade-up" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 20, background: 'linear-gradient(to top, rgba(253,251,247,1) 70%, rgba(253,251,247,0))', zIndex: 100, maxWidth: 480, margin: '0 auto' }}>
              <button onClick={() => setCurrentScreen('cart')} style={{ width: '100%', background: C.emerald, color: C.white, padding: 16, borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 24px rgba(6, 78, 59, 0.2)' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{cartTotalQty} items added</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>View Cart · ₹{grandTotal.toFixed(0)} <ChevronRight size={18} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/></span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* CART SCREEN */}
      {currentScreen === 'cart' && (
        <div className="animate-fade-up" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
            <button onClick={() => setCurrentScreen('menu')} style={{ padding: 8, background: C.white, borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <ChevronLeft size={20} />
            </button>
            <h2 className="serif" style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: 20 }}>Your Order</h2>
            <div style={{ width: 36 }}></div>
          </div>

          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 60 }}>
              <ShoppingCart size={48} color={C.textMuted} style={{ margin: '0 auto', marginBottom: 16 }} />
              <h3 style={{ color: C.textSub }}>Your cart is empty</h3>
              <button onClick={() => setCurrentScreen('menu')} style={{ marginTop: 24, background: C.emerald, color: C.white, padding: '12px 24px', borderRadius: 12, fontWeight: 600 }}>Browse Menu</button>
            </div>
          ) : (
            <>
              <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
                {cart.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: idx < cart.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <VegDot isVeg={item.isVeg} />
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</span>
                      </div>
                      <div style={{ color: C.textSub, fontSize: 12, marginTop: 4 }}>₹{item.price} each</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.sand, borderRadius: 8, padding: '4px 8px' }}>
                        <button onClick={() => updateQty(item, -1)} style={{ color: C.text, fontWeight: 700, width: 20 }}>−</button>
                        <span style={{ fontWeight: 600, width: 16, textAlign: 'center', fontSize: 14 }}>{item.qty}</span>
                        <button onClick={() => updateQty(item, 1)} style={{ color: C.text, fontWeight: 700, width: 20 }}>+</button>
                      </div>
                      <span style={{ fontWeight: 700, color: C.emerald, width: 40, textAlign: 'right' }}>₹{item.price * item.qty}</span>
                    </div>
                  </div>
                ))}
              </Card>

              <Card style={{ padding: 16, marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Delivery Preference</h3>
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <button onClick={() => setDeliveryPreference('ALL_AT_ONCE')} style={{ flex: 1, padding: 12, borderRadius: 12, border: `2px solid ${deliveryPreference === 'ALL_AT_ONCE' ? C.emerald : C.borderLight}`, background: deliveryPreference === 'ALL_AT_ONCE' ? C.emeraldLight : C.white, color: deliveryPreference === 'ALL_AT_ONCE' ? C.emerald : C.text, fontWeight: 600, fontSize: 13, transition: 'all 0.2s' }}>
                    All at once
                  </button>
                  <button onClick={() => setDeliveryPreference('AS_READY')} style={{ flex: 1, padding: 12, borderRadius: 12, border: `2px solid ${deliveryPreference === 'AS_READY' ? C.emerald : C.borderLight}`, background: deliveryPreference === 'AS_READY' ? C.emeraldLight : C.white, color: deliveryPreference === 'AS_READY' ? C.emerald : C.text, fontWeight: 600, fontSize: 13, transition: 'all 0.2s' }}>
                    As and when ready
                  </button>
                </div>
                <textarea 
                  placeholder="Any special requests? (allergies, spice level...)"
                  value={specialNote}
                  onChange={e => setSpecialNote(e.target.value)}
                  style={{ width: '100%', border: 'none', background: C.borderLight, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 80, resize: 'none' }}
                />
              </Card>

              <Card style={{ padding: 20, marginBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: C.textSub, fontSize: 14 }}>
                  <span>Item Total</span><span>₹{cartSubtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: C.textSub, fontSize: 14 }}>
                  <span>CGST (2.5%)</span><span>₹{cgst.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, color: C.textSub, fontSize: 14 }}>
                  <span>SGST (2.5%)</span><span>₹{sgst.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, color: C.textSub, fontSize: 14 }}>
                  <span>Room Service Charge (10%)</span><span>₹{serviceCharge.toFixed(2)}</span>
                </div>
                <div style={{ borderTop: `1px dashed ${C.border}`, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>Grand Total</span>
                  <span style={{ fontWeight: 700, fontSize: 20, color: C.emerald }}>₹{grandTotal.toFixed(0)}</span>
                </div>
              </Card>

              <button onClick={placeOrder} style={{ width: '100%', background: C.brass, color: C.white, padding: 16, borderRadius: 16, fontWeight: 700, fontSize: 16, boxShadow: '0 8px 24px rgba(180, 83, 9, 0.2)', display: 'flex', justifyContent: 'center', gap: 8 }}>
                Place Order 🙏
              </button>
            </>
          )}
        </div>
      )}

      {/* TRACKING SCREEN */}
      {currentScreen === 'tracking' && trackingOrder && (
        <div className="animate-fade-up" style={{ padding: 20, paddingTop: 40, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', background: C.emeraldLight, padding: 16, borderRadius: '50%', marginBottom: 16 }}>
            <CheckCircle size={40} color={C.emerald} />
          </div>
          <h2 className="serif" style={{ color: C.emerald, fontSize: 24, margin: 0 }}>Order Confirmed!</h2>
          <p style={{ color: C.textSub, fontSize: 14, marginTop: 8 }}>Kitchen is reviewing your order.</p>

          <div className="animate-pop" style={{ background: C.emerald, borderRadius: 24, padding: 32, marginTop: 32, marginBottom: 32, color: C.white, boxShadow: '0 12px 32px rgba(6, 78, 59, 0.2)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, opacity: 0.8, textTransform: 'uppercase' }}>Order Token</div>
            <div className="serif" style={{ fontSize: 64, color: C.brassLight, margin: '8px 0' }}>{trackingOrder.token}</div>
            <div style={{ opacity: 0.5, borderTop: '1px solid rgba(255,255,255,0.2)', margin: '16px 0' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 15 }}>
              <MapPin size={16} /> Room 108
            </div>
          </div>

          <Card style={{ padding: 24, textAlign: 'left', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
               <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Item Progress</h3>
               {trackingOrder.deliveryPreference === 'AS_READY' && (
                 <span style={{ fontSize: 11, background: C.infoLight, color: C.info, padding: '4px 8px', borderRadius: 99, fontWeight: 800 }}>SERVE AS READY</span>
               )}
            </div>
            {trackingOrder.deliveryPreference === 'AS_READY' && (
              <div style={{ fontSize: 13, color: C.info, background: 'rgba(59, 130, 246, 0.05)', padding: '10px 12px', borderRadius: 8, marginBottom: 16, borderLeft: `3px solid ${C.info}` }}>
                Your dishes will be sent to your room individually as soon as they are freshly prepared.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {trackingOrder.items.map((item, idx) => {
                let badgeText, badgeColor, badgeBg, strike;
                if (item.status === 'DISPATCHED' || trackingOrder.status === 'ON_THE_WAY' || trackingOrder.status === 'DELIVERED') { 
                  badgeText = trackingOrder.status === 'DELIVERED' ? 'Delivered ✓' : 'On the way 🚀'; 
                  badgeColor = C.info; 
                  badgeBg = C.infoLight; 
                  strike = true; 
                }
                else if (item.status === 'DONE') { 
                  badgeText = 'Ready ✓'; 
                  badgeColor = C.emerald; 
                  badgeBg = C.emeraldLight; 
                  strike = false; 
                }
                else { 
                  badgeText = 'Preparing'; 
                  badgeColor = C.warning; 
                  badgeBg = C.warningLight; 
                  strike = false; 
                }

                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: strike ? C.textMuted : C.text, textDecoration: strike ? 'line-through' : 'none', fontWeight: 500 }}>{item.qty}× {item.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: badgeBg, color: badgeColor }}>
                      {badgeText}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card style={{ padding: 24, textAlign: 'left', marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, marginBottom: 20, fontWeight: 700 }}>Live Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 11, top: 12, bottom: 12, width: 2, background: C.borderLight, zIndex: 0 }}></div>
              
              {['NEW', 'PREPARING', 'ON_THE_WAY', 'DELIVERED'].map((step, idx) => {
                const statuses = ['NEW', 'PREPARING', 'ON_THE_WAY', 'DELIVERED'];
                const currentIdx = statuses.indexOf(trackingOrder.status);
                const isPast = idx < currentIdx;
                const isActive = idx === currentIdx;
                
                const labels = { 'NEW': 'Order Placed', 'PREPARING': 'Being Prepared', 'ON_THE_WAY': 'On the Way', 'DELIVERED': 'Delivered' };

                return (
                  <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 16, zIndex: 1, position: 'relative' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: isPast ? C.emerald : isActive ? C.brass : C.white, border: `2px solid ${isPast ? C.emerald : isActive ? C.brass : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isPast && <CheckCircle size={14} color={C.white} />}
                      {isActive && <div className="animate-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: C.white }}></div>}
                    </div>
                    <span style={{ fontWeight: isActive ? 700 : 500, color: isActive ? C.text : isPast ? C.textSub : C.textMuted, fontSize: 15 }}>
                      {labels[step]}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: C.emeraldLight, padding: 12, borderRadius: '50%' }}>
              <Phone size={20} color={C.emerald} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Need help?</div>
              <div style={{ color: C.textSub, fontSize: 13 }}>Call Reception at Ext. 9</div>
            </div>
          </Card>
          
          <div style={{ marginTop: 32 }}>
            <button onClick={() => setCurrentScreen('menu')} style={{ color: C.emerald, fontWeight: 600 }}>← Back to Menu</button>
          </div>
        </div>
      )}
    </div>
  );
};

import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChefHat, Circle, MapPin, AlertTriangle, Search, 
  Printer, LayoutDashboard, LogOut, FileText, CheckSquare, 
  ShieldAlert
} from 'lucide-react';
import { C } from '../../constants/theme';
import { PinGate } from '../../components/auth/PinGate';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { buildServeTogetherPlan } from '../../lib/dispatchRules';

const ACCENT_BLUE = '#2563EB';
const ORDER_CARD_MIN_WIDTH = 270;
const ORDER_CARD_GAP = 16;

const estimateOrderCardHeight = (order) => {
  const items = order.items || [];
  const noteHeight = order.note ? 38 : 0;
  const footerHeight = order.status === 'PREPARING' || order.status === 'ON_THE_WAY' ? 58 : 42;

  if (order.deliveryPreference === 'AS_READY') {
    const bundles = buildServeTogetherPlan(items).bundles || [];
    const bundleHeight = bundles.reduce((total, bundle) => {
      const warningHeight = bundle.warnings?.length > 0 ? 32 : 0;
      return total + 58 + warningHeight + (bundle.items.length * 48);
    }, 0);
    return 132 + noteHeight + footerHeight + bundleHeight;
  }

  return 132 + noteHeight + footerHeight + (items.length * 42);
};

export const KitchenApp = () => {
  const orders = useStore(state => state.orders);
  const sosAlerts = useStore(state => state.sosAlerts);
  const kitchenAuth = useStore(state => state.kitchenAuth);
  const login = useStore(state => state.login);
  const logout = useStore(state => state.logout);
  const menuItems = useStore(state => state.menuItems);

  const [activeTab, setActiveTab] = useState('ACTIVE'); // ACTIVE, READY, MENU
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Stock search/category state
  const [activeMenuCategory, setActiveMenuCategory] = useState('All');
  const [menuSearch, setMenuSearch] = useState('');

  // Completed tab pagination and filter
  const [completedFilterDate, setCompletedFilterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [completedPage, setCompletedPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const activeSOS = useMemo(() => {
    return sosAlerts.find(alert => !['RESOLVED', 'CANCELLED'].includes(alert.status)) || null;
  }, [sosAlerts]);
  const sosAudioRef = useRef(null);

  useEffect(() => {
    if (activeSOS?.status === 'OPEN') {
      try {
        if (!sosAudioRef.current) {
          sosAudioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
          sosAudioRef.current.loop = true;
        }
        sosAudioRef.current.play().catch(() => {});
      } catch (err) {
        console.debug('SOS audio could not start automatically:', err);
      }
    } else if (sosAudioRef.current) {
      sosAudioRef.current.pause();
      sosAudioRef.current.currentTime = 0;
    }
  }, [activeSOS]);

  const toggleItemAvailability = async (id, currentAvailable) => {
    try {
      await fetch('/api/admin/menu_items/out-of-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('kitchenToken')}`
        },
        body: JSON.stringify({ itemId: id, available: !currentAvailable })
      });
    } catch (err) {
      console.error('Failed to toggle out of stock:', err);
    }
  };

  const handlePartialDispatch = async (orderId, payload) => {
    try {
      await fetch(`/api/admin/orders/${orderId}/partial-dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('kitchenToken')}`
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('Failed to dispatch items:', err);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const dbOrder = orders.find(o => o.id === id);
      if (!dbOrder) return;
      const updatedItems = dbOrder.items.map(i => {
        if (newStatus === 'ON_THE_WAY' || newStatus === 'DELIVERED') {
          return { ...i, status: 'DISPATCHED' };
        }
        return i;
      });

      await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('kitchenToken')}`
        },
        body: JSON.stringify([{ id, status: newStatus, items: updatedItems }])
      });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const acknowledgeSOS = async (alertId) => {
    try {
      await fetch(`/api/admin/sos/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('kitchenToken')}` }
      });
    } catch (err) {
      console.error('Failed to acknowledge SOS:', err);
    }
  };

  const clearSOS = async (alertId) => {
    try {
      await fetch(`/api/admin/sos/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('kitchenToken')}`
        },
        body: JSON.stringify({ note: 'Kitchen marked SOS resolved' })
      });
    } catch (err) {
      console.error('Failed to resolve SOS:', err);
    }
    if (sosAudioRef.current) {
      sosAudioRef.current.pause();
    }
  };

  const filteredOrders = useMemo(() => {
    const groupedStatuses = activeTab === 'QUEUE'
      ? ['NEW', 'PREPARING']
      : activeTab === 'DELIVERY'
        ? ['ON_THE_WAY']
        : activeTab === 'HISTORY'
          ? ['DELIVERED']
          : [];
    let filtered = activeTab === 'MENU' ? [] : orders.filter(o => groupedStatuses.includes(o.status) && o.type === 'FOOD');
    
    if (activeTab === 'HISTORY') {
      if (completedFilterDate) {
        filtered = filtered.filter(o => {
          const oDate = new Date(o.createdAt).toISOString().split('T')[0];
          return oDate === completedFilterDate;
        });
      }
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(o => 
        o.token.toLowerCase().includes(searchQuery.toLowerCase()) || 
        String(o.room).includes(searchQuery)
      );
    }
    return filtered;
  }, [orders, activeTab, searchQuery, completedFilterDate]);

  const paginatedOrders = useMemo(() => {
    if (activeTab !== 'HISTORY') return filteredOrders;
    const start = (completedPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, activeTab, completedPage]);
  
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

  const activeServiceRequests = useMemo(() => {
    if (activeTab === 'MENU') return [];
    const groupedStatuses = activeTab === 'QUEUE' ? ['NEW', 'PREPARING'] : activeTab === 'DELIVERY' ? ['ON_THE_WAY'] : ['DELIVERED'];
    return orders.filter(o => groupedStatuses.includes(o.status) && o.type === 'SERVICE');
  }, [orders, activeTab]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const query = menuSearch.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(query) ||
        (item.desc && item.desc.toLowerCase().includes(query)) ||
        (item.cuisine && item.cuisine.toLowerCase().includes(query));
      const matchesCategory = activeMenuCategory === 'All' || item.category === activeMenuCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, menuSearch, activeMenuCategory]);

  if (!kitchenAuth) {
    return <PinGate role="kitchen" onLogin={login} />;
  }

  const tabs = [
    { id: 'QUEUE', label: 'Pantry Queue', icon: FileText, count: orders.filter(o => ['NEW', 'PREPARING'].includes(o.status)).length },
    { id: 'DELIVERY', label: 'In Delivery', icon: CheckSquare, count: orders.filter(o => o.status === 'ON_THE_WAY').length },
    { id: 'HISTORY', label: 'Completed', icon: LayoutDashboard, count: orders.filter(o => o.status === 'DELIVERED').length },
    { id: 'MENU', label: 'Stock Control', icon: LayoutDashboard, count: 0 },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: C.sand, overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* SOS High-Alert Flashing Screen */}
      {activeSOS && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(220, 38, 38, 0.9)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFF', animation: 'pulse 1s infinite' }}>
          <style>{`
            @keyframes pulse {
              0% { background-color: rgba(220, 38, 38, 0.9); }
              50% { background-color: rgba(185, 28, 28, 0.95); }
              100% { background-color: rgba(220, 38, 38, 0.9); }
            }
          `}</style>
          <ShieldAlert size={80} style={{ marginBottom: 20 }} />
          <h1 style={{ fontSize: 48, fontWeight: 900, margin: 0, letterSpacing: -1 }}>EMERGENCY SOS ALERT!</h1>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginTop: 10 }}>ROOM {activeSOS.room} IS REQUESTING URGENT ASSISTANCE</h2>
          <div style={{ marginTop: 12, fontSize: 16, fontWeight: 800, background: 'rgba(255,255,255,0.16)', padding: '8px 14px', borderRadius: 999 }}>
            {activeSOS.status === 'ACKNOWLEDGED' ? 'Acknowledged by staff' : 'New emergency alert'}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 30, flexWrap: 'wrap', justifyContent: 'center' }}>
            {activeSOS.status === 'OPEN' && (
              <button
                onClick={() => acknowledgeSOS(activeSOS.id)}
                style={{ background: '#111827', color: '#FFF', border: 'none', padding: '16px 28px', borderRadius: 16, fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
              >
                Acknowledge
              </button>
            )}
            <button 
              onClick={() => clearSOS(activeSOS.id)}
              style={{ background: '#FFF', color: '#DC2626', border: 'none', padding: '16px 28px', borderRadius: 16, fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
            >
              Mark Resolved
            </button>
          </div>
        </div>
      )}

      {/* Sidebar - SmartPOS Style */}
      <div 
        style={{ 
          width: isSidebarCollapsed ? 88 : 280, 
          backgroundColor: C.white, 
          display: 'flex', 
          flexDirection: 'column', 
          borderRight: `1px solid ${C.borderLight}`, 
          padding: isSidebarCollapsed ? '24px 12px' : '24px 16px', 
          zIndex: 10,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}
      >
        <div 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px', marginBottom: 48,
            cursor: 'pointer', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start'
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.brass, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, flexShrink: 0 }}>
            <ChefHat size={24} />
          </div>
          {!isSidebarCollapsed && (
            <div style={{ fontWeight: 800, fontSize: 20, color: C.text, letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>Pantry KDS</div>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={isSidebarCollapsed ? tab.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
                  backgroundColor: isActive ? C.emeraldMid : 'transparent',
                  color: isActive ? C.text : C.textSub,
                  borderRadius: 16, border: 'none', cursor: 'pointer',
                  fontWeight: isActive ? 700 : 500, fontSize: 15,
                  transition: 'all 0.2s',
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start'
                }}
              >
                <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} color={isActive ? C.text : C.textMuted} style={{ flexShrink: 0 }} />
                {!isSidebarCollapsed && <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap' }}>{tab.label}</span>}
                {!isSidebarCollapsed && tab.count > 0 && (
                  <div style={{
                    backgroundColor: isActive ? C.white : C.borderLight,
                    color: isActive ? C.text : C.textSub,
                    padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700
                  }}>
                    {tab.count}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => logout('kitchen')}
          title="Logout"
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
            backgroundColor: 'transparent', color: C.danger,
            borderRadius: 16, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 15, marginTop: 'auto',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start'
          }}
        >
          <LogOut size={20} style={{ flexShrink: 0 }} />
          {!isSidebarCollapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Main Screen */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Topbar */}
        <div style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.text }}>
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            <p style={{ margin: '4px 0 0', color: C.textSub, fontSize: 14 }}>
              {activeTab === 'MENU' ? `${filteredMenuItems.length} of ${menuItems.length} pantry stock controls` : `${filteredOrders.length + activeServiceRequests.length} pantry tasks in this queue`}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {activeTab !== 'MENU' && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: 8, 
                backgroundColor: C.white, padding: '12px 16px', 
                borderRadius: 16, border: `1px solid ${C.border}`, width: 300
              }}>
                <Search size={18} color={C.textMuted} />
                <input 
                  type="text" 
                  placeholder="Search order or room..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent' }}
                />
              </div>
            )}
            <div style={{ 
              backgroundColor: C.white, padding: '12px 24px', 
              borderRadius: 16, border: `1px solid ${C.border}`, 
              fontWeight: 700, color: C.text 
            }}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'MENU' ? (
          /* RESTORED MENU UI DESIGN WITH SWITCHES */
          <div style={{ padding: '0 32px 32px', overflowY: 'auto', flex: 1 }}>
            {/* SEARCH ROW */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 28 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }}><Search size={18} /></span>
                <input 
                  type="text" 
                  placeholder="Search item name..." 
                  value={menuSearch} 
                  onChange={e => setMenuSearch(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 16, border: `1.5px solid ${C.border}`, fontSize: 14, background: C.white, color: C.text }}
                />
              </div>

              {/* CATEGORY SELECTOR */}
              <div style={{ display: 'flex', gap: 8 }}>
                {['All', 'Breakfast', 'Starters', 'Mains', 'Desserts', 'Beverages'].map(category => {
                  const isActive = activeMenuCategory === category;
                  return (
                    <button
                      key={category}
                      onClick={() => setActiveMenuCategory(category)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 12,
                        background: isActive ? C.text : C.white,
                        color: isActive ? C.white : C.textSub,
                        border: `1.5px solid ${isActive ? C.text : C.border}`,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ITEMS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
              {filteredMenuItems.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', background: C.white, borderRadius: 16, padding: 36, textAlign: 'center', color: C.textMuted, border: `1px dashed ${C.border}` }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: C.text, marginBottom: 6 }}>No stock items found</div>
                  <div style={{ fontSize: 13, marginBottom: 16 }}>Try another category or clear the search.</div>
                  <button
                    onClick={() => {
                      setMenuSearch('');
                      setActiveMenuCategory('All');
                    }}
                    style={{ background: ACCENT_BLUE, color: '#FFF', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}
                  >
                    Show All Stock
                  </button>
                </div>
              ) : filteredMenuItems.map(item => (
                  <div key={item.id} style={{ padding: 20, background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 16 }}>{item.name}</h4>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, background: C.borderLight, padding: '4px 8px', borderRadius: 6, fontWeight: 700, color: C.textSub }}>{item.category}</span>
                          <span style={{ fontSize: 11, background: '#EFF6FF', padding: '4px 8px', borderRadius: 6, fontWeight: 800, color: ACCENT_BLUE }}>{item.cuisine || item.category}</span>
                        </div>
                      </div>
                      <div 
                        onClick={() => toggleItemAvailability(item.id, item.available)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: item.available ? `${C.emerald}12` : C.dangerLight, padding: '6px 12px', borderRadius: 20 }}
                      >
                        <div style={{
                          width: 40, height: 22, borderRadius: 11, background: item.available ? C.emerald : C.danger,
                          position: 'relative', transition: '0.3s'
                        }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: '50%', background: C.white,
                            position: 'absolute', top: 2, left: item.available ? 20 : 2, transition: '0.3s'
                          }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: item.available ? C.emerald : C.danger }}>
                          {item.available ? 'IN STOCK' : 'OUT'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          /* ORDERS PIPELINE VIEW */
          <div style={{ flex: 1, padding: '0 32px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* DINING ORDERS */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>
                  {activeTab === 'HISTORY' ? 'Completed Orders' : activeTab === 'DELIVERY' ? 'Orders In Delivery' : 'Pantry Order Queue'}
                </h2>
                {activeTab === 'HISTORY' && (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input 
                      type="date" 
                      value={completedFilterDate}
                      onChange={(e) => { setCompletedFilterDate(e.target.value); setCompletedPage(1); }}
                      style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${C.borderLight}`, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: C.text }}
                    />
                    {totalPages > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFF', padding: '4px', borderRadius: 10, border: `1px solid ${C.borderLight}` }}>
                        <button 
                          onClick={() => setCompletedPage(p => Math.max(1, p - 1))}
                          disabled={completedPage === 1}
                          style={{ background: 'transparent', border: 'none', padding: '4px 8px', cursor: completedPage === 1 ? 'default' : 'pointer', opacity: completedPage === 1 ? 0.4 : 1, fontWeight: 800 }}
                        >
                          &lt;
                        </button>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '0 4px', color: C.textMuted }}>Page {completedPage} of {totalPages}</span>
                        <button 
                          onClick={() => setCompletedPage(p => Math.min(totalPages, p + 1))}
                          disabled={completedPage >= totalPages}
                          style={{ background: 'transparent', border: 'none', padding: '4px 8px', cursor: completedPage >= totalPages ? 'default' : 'pointer', opacity: completedPage >= totalPages ? 0.4 : 1, fontWeight: 800 }}
                        >
                          &gt;
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {orders.length === 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 16, alignItems: 'start' }}>
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} style={{ padding: 20, background: '#FFF', borderRadius: 20, borderTop: '6px solid #CBD5E1', display: 'flex', flexDirection: 'column', gap: 14, height: 260, border: `1px solid ${C.borderLight}` }}>
                      <div>
                        <div className="shimmer" style={{ width: '40%', height: 12, borderRadius: 4, marginBottom: 8 }} />
                        <div className="shimmer" style={{ width: '60%', height: 20, borderRadius: 4 }} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div className="shimmer" style={{ width: '90%', height: 14, borderRadius: 4 }} />
                        <div className="shimmer" style={{ width: '80%', height: 14, borderRadius: 4 }} />
                        <div className="shimmer" style={{ width: '50%', height: 14, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div style={{ background: C.white, borderRadius: 16, padding: 36, textAlign: 'center', color: C.textMuted, border: `1px solid ${C.borderLight}` }}>
                  {activeTab === 'HISTORY' ? 'No completed orders found for this date.' : 'No active orders right now.'}
                </div>
              ) : (
                <MasonryOrderGrid
                  orders={activeTab === 'HISTORY' ? paginatedOrders : filteredOrders}
                  renderOrder={(order) => (
                    <TicketCard
                      key={order.id}
                      order={order}
                      updateStatus={updateStatus}
                      onPartialDispatch={handlePartialDispatch}
                    />
                  )}
                />
              )}
            </div>

            {/* HOSPITALITY REQUESTS */}
            {activeServiceRequests.length > 0 && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 16 }}>Hospitality Requests</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, alignItems: 'start' }}>
                  {activeServiceRequests.map(order => (
                    <Card key={order.id} style={{ padding: 18, border: `1px solid ${C.borderLight}`, borderRadius: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 16 }}>Room {order.room}</div>
                          <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>Hospitality Service Request</div>
                        </div>
                        <span style={{ background: '#EFF6FF', color: ACCENT_BLUE, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 750 }}>
                          {order.status}
                        </span>
                      </div>
                      <div style={{ background: '#F9FAFB', padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 14, fontWeight: 600 }}>
                        Service: {order.items[0]?.name || 'Service request'}
                      </div>
                      {order.status !== 'DELIVERED' && (
                        <button 
                          onClick={() => updateStatus(order.id, 'DELIVERED')}
                          style={{ width: '100%', background: ACCENT_BLUE, color: '#FFF', border: 'none', padding: 10, borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}
                        >
                          Mark Request Completed
                        </button>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

const MasonryOrderGrid = ({ orders, renderOrder }) => {
  return (
    <div style={{
      columnCount: 'auto',
      columnWidth: ORDER_CARD_MIN_WIDTH,
      columnGap: ORDER_CARD_GAP,
      width: '100%'
    }}>
      {orders.map(order => (
        <div key={order.id} style={{ breakInside: 'avoid', marginBottom: ORDER_CARD_GAP }}>
          {renderOrder(order)}
        </div>
      ))}
    </div>
  );
};

const TicketCard = ({ order, updateStatus, onPartialDispatch }) => {
  const isAsReady = order.deliveryPreference === 'AS_READY';
  const isNew = order.status === 'NEW';
  const isPrep = order.status === 'PREPARING';
  const isReady = order.status === 'ON_THE_WAY';
  const isDone = order.status === 'DELIVERED';

  const [printLayoutOpen, setPrintLayoutOpen] = useState(false);
  const orderItems = order.items || [];
  const indexedOrderItems = useMemo(() => (
    orderItems.map((item, index) => ({ ...item, uiItemIndex: index }))
  ), [orderItems]);
  const dispatchPlan = useMemo(() => (
    isAsReady ? buildServeTogetherPlan(indexedOrderItems) : { bundles: [] }
  ), [isAsReady, indexedOrderItems]);
  const dispatchBundles = dispatchPlan.bundles || [];
  const readyBundles = dispatchBundles.filter(bundle => bundle.canDispatch && !bundle.allDispatched);

  // Group items for sequential printing preview
  const splitKOTs = useMemo(() => {
    const groups = {};
    orderItems.forEach(item => {
      const station = item.station_id || item.category || 'Kitchen';
      const cuisine = item.cuisine || item.category || 'Kitchen';
      const key = `${station}::${cuisine}`;
      if (!groups[key]) groups[key] = { station, cuisine, items: [] };
      groups[key].items.push(item);
    });
    return groups;
  }, [orderItems]);
  const printableKots = (order.kots && order.kots.length > 0)
    ? order.kots
    : Object.entries(splitKOTs).map(([key, group], index) => ({
        id: `fallback-${key}-${index}`,
        station_id: group.station,
        cuisine: group.cuisine,
        kot_number: `${order.token}-${String(group.station).toUpperCase()}-${String(group.cuisine).toUpperCase()}`,
        items: group.items
      }));

  // Determine top bar color based on status (Rapid KDS style)
  let topColor = C.warning; // Yellow for NEW
  if (isPrep) topColor = '#3B82F6'; // Blue for preparing
  if (isReady) topColor = '#10B981'; // Green for ready
  if (isDone) topColor = C.textMuted; // Gray for completed

  // Toggling preparation status of individual items
  const toggleItemState = (index) => {
    const item = orderItems[index];
    if (!item || isNew || isDone || item.status === 'DISPATCHED') return;

    const updatedItems = orderItems.map((currentItem, itemIndex) => {
      if (itemIndex !== index) return currentItem;

      return { ...currentItem, status: currentItem.status === 'PENDING' ? 'DONE' : 'PENDING' };
    });

    onPartialDispatch(order.id, { items: updatedItems });
  };

  const allCooked = isAsReady && dispatchBundles.length > 0
    ? dispatchBundles.every(bundle => bundle.allReady)
    : orderItems.every(i => i.status === 'DONE' || i.status === 'DISPATCHED');

  return (
    <Card style={{ 
      padding: 0, 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      alignSelf: 'start',
      borderRadius: 14,
      borderTop: `4px solid ${topColor}`,
      boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
      background: '#FFF'
    }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.borderLight}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', color: topColor, letterSpacing: '0.5px' }}>
                {isNew ? 'PENDING PANTRY' : isPrep ? 'WITH CHEFS' : isReady ? 'DISPATCHED' : 'COMPLETED'}
              </div>
              <div style={{ fontSize: 9, fontWeight: 800, backgroundColor: isAsReady ? '#FEE2E2' : '#EFF6FF', color: isAsReady ? '#EF4444' : ACCENT_BLUE, padding: '2px 5px', borderRadius: 4 }}>
                {isAsReady ? 'AS READY' : 'ALL AT ONCE'}
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 21, color: C.text, lineHeight: 1 }}>{order.token}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.textSub, fontSize: 13, marginTop: 6 }}>
              <MapPin size={12} /> Room {order.room}
            </div>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{orderItems.length} Items</div>
            <button 
              onClick={() => setPrintLayoutOpen(true)}
              style={{ background: C.borderLight, border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', display: 'flex' }}
              title="Print KOT Slips"
            >
              <Printer size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Note */}
      {order.note && (
        <div style={{ padding: '8px 14px', backgroundColor: '#FEF3C7', borderBottom: `1px solid ${C.borderLight}`, display: 'flex', gap: 6 }}>
          <AlertTriangle size={14} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>{order.note}</span>
        </div>
      )}

      {/* Serve Together Groups */}
      {isAsReady && dispatchBundles.length > 0 && (
        <div style={{ padding: '10px 12px 12px', borderBottom: `1px solid ${C.borderLight}`, background: '#F8FAFC' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', color: C.textMuted }}>Serve-together groups</div>
              <div style={{ fontSize: 12.5, color: C.textSub, fontWeight: 600 }}>
                {readyBundles.length} ready, {dispatchBundles.length - readyBundles.length} still cooking
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {dispatchBundles.map(bundle => (
              <div key={bundle.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.textMuted, textTransform: 'uppercase' }}>
                    {bundle.label}
                  </div>
                  {isAsReady && !bundle.allDispatched && bundle.canDispatch && (
                    <button
                      onClick={() => onPartialDispatch(order.id, { bundleKeys: [bundle.key] })}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#10B981',
                        color: '#FFF',
                        fontWeight: 800,
                        fontSize: 10,
                        cursor: 'pointer'
                      }}
                    >
                      SEND GROUP
                    </button>
                  )}
                </div>

                {bundle.warnings?.length > 0 && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#B45309' }}>
                    {bundle.warnings.join(' | ')}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {bundle.items.map((item, itemIndex) => {
                    const isGroupItemDone = item.status === 'DONE';
                    const isGroupItemSent = item.status === 'DISPATCHED' || isDone;
                    const canToggleItem = !isNew && !isDone && !isGroupItemSent;

                    return (
                      <div
                        key={`${bundle.key}-${item.uiItemIndex ?? itemIndex}`}
                        onClick={() => canToggleItem && toggleItemState(item.uiItemIndex)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '6px 0',
                          cursor: canToggleItem ? 'pointer' : 'default',
                          opacity: isGroupItemSent ? 0.5 : 1
                        }}
                      >
                        {isGroupItemSent ? (
                          <CheckSquare size={18} color="#9CA3AF" />
                        ) : isGroupItemDone ? (
                          <CheckSquare size={18} color="#10B981" />
                        ) : (
                          <Circle size={18} color="#CBD5E1" />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 650, color: C.text, textDecoration: isGroupItemSent ? 'line-through' : 'none' }}>
                            {item.qty}x {item.name}
                          </div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: isGroupItemSent ? '#9CA3AF' : isGroupItemDone ? '#10B981' : '#6B7280' }}>
                          {isGroupItemSent ? 'Sent' : isGroupItemDone ? 'Ready' : 'Waiting'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items List */}
      {(!isAsReady || dispatchBundles.length === 0) && (
      <div style={{ padding: '12px 14px', flex: 1, backgroundColor: '#FFF', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {orderItems.map((item, idx) => {
          const isItemDone = item.status === 'DONE';
          const isItemDispatched = item.status === 'DISPATCHED' || isDone;
          
          return (
            <div 
              key={idx} 
              onClick={() => toggleItemState(idx)}
              style={{ 
                display: 'flex', gap: 10, alignItems: 'center',
                cursor: !isNew && !isDone && !isItemDispatched ? 'pointer' : 'default',
                opacity: isItemDispatched ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              <div>
                {isItemDispatched ? (
                  <CheckSquare size={18} color="#9CA3AF" />
                ) : isItemDone ? (
                  <CheckSquare size={18} color="#10B981" />
                ) : (
                  <Circle size={18} color="#CBD5E1" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 650, fontSize: 13.5, color: C.text, textDecoration: isItemDispatched ? 'line-through' : 'none' }}>
                  {item.qty}x {item.name}
                </div>
                <div style={{ marginTop: 3, fontSize: 10.5, color: C.textMuted, fontWeight: 700 }}>
                  {item.cuisine || item.category || 'Kitchen'}
                </div>
                {isAsReady && item.serveTogetherLabel && (
                  <div style={{ marginTop: 4, fontSize: 10, color: ACCENT_BLUE, fontWeight: 800, textTransform: 'uppercase' }}>
                    {item.serveTogetherLabel}{item.serveTogetherWarning ? ` | ${item.serveTogetherWarning}` : ''}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, color: isItemDispatched ? '#9CA3AF' : isItemDone ? '#10B981' : '#6B7280' }}>
                {isItemDispatched ? 'Sent' : isItemDone ? 'Chef ready' : 'Waiting'}
              </span>
            </div>
          );
        })}
      </div>
      )}

      {/* Action Footer */}
      <div style={{ padding: 12, backgroundColor: C.sand, borderTop: `1px solid ${C.borderLight}` }}>
        {isNew && (
          <button 
            onClick={() => setPrintLayoutOpen(true)}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', backgroundColor: '#3B82F6', color: '#FFF', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
          >
            REVIEW & SEND KOT TO CHEFS
          </button>
        )}
        {isPrep && (
          <>
            {isAsReady ? (
              <div style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 800, color: readyBundles.length > 0 ? '#15803D' : C.textMuted, fontSize: 12 }}>
                {readyBundles.length > 0 ? `${readyBundles.length} group${readyBundles.length === 1 ? '' : 's'} ready to send` : 'No groups ready yet'}
              </div>
            ) : (
              <button 
                onClick={() => updateStatus(order.id, 'ON_THE_WAY')}
                disabled={!allCooked}
                style={{ 
                  width: '100%', padding: 12, borderRadius: 10, border: 'none', 
                  backgroundColor: allCooked ? '#10B981' : '#CBD5E1', 
                  color: '#FFF', fontWeight: 800, fontSize: 14, cursor: 'pointer' 
                }}
              >
                DISPATCH FULL ORDER
              </button>
            )}
          </>
        )}
        {isReady && (
          <button 
            onClick={() => updateStatus(order.id, 'DELIVERED')}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', backgroundColor: '#10B981', color: '#FFF', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
          >
            MARK DELIVERED
          </button>
        )}
        {isDone && (
          <div style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 700, color: C.textMuted, fontSize: 13 }}>
            ORDER COMPLETED
          </div>
        )}
      </div>

      {/* Sequential KOT Print Stream Preview */}
      {printLayoutOpen && createPortal(
        <div className="print-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="print-section" style={{ background: '#FFF', padding: 20, borderRadius: 20, maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>KOT Printing Stream</h3>
              <button onClick={() => setPrintLayoutOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}>Close</button>
            </div>

            <div style={{ maxHeight: 'none', overflowY: 'visible', border: 'none', borderRadius: 0, padding: 0, background: 'transparent' }}>
              {printableKots.map((kot, index) => (
                <div key={kot.id} style={{ marginBottom: index < printableKots.length - 1 ? 20 : 0, borderBottom: index < printableKots.length - 1 ? '2px dashed #9CA3AF' : 'none', paddingBottom: 12 }}>
                  <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 950, textTransform: 'uppercase', marginBottom: 6 }}>
                    *** ELITE KOT: {String((kot.items?.[0]?.cuisine || kot.cuisine || kot.station_id)).toUpperCase()} ***
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6, color: '#6B7280' }}>
                    Pantry: {String(kot.station_id || 'kitchen').toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Order: {order.token}</span>
                    <span>Room: {order.room}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 6 }}>
                    KOT: {kot.kot_number} | Time: {new Date(order.createdAt).toLocaleTimeString()}
                  </div>
                  <div style={{ borderTop: '1px solid #D1D5DB', paddingTop: 6 }}>
                    {(kot.items || []).map((item, i) => (
                      <div key={i} style={{ fontSize: 12, fontWeight: 700, margin: '2px 0', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span>{item.name}</span>
                          {isAsReady && item.serveTogetherLabel && (
                            <span style={{ fontSize: 9, fontWeight: 900, color: ACCENT_BLUE, background: '#EFF6FF', padding: '2px 5px', borderRadius: 999, textTransform: 'uppercase' }}>
                              {item.serveTogetherLabel}
                            </span>
                          )}
                        </span>
                        <span>x{item.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              {isNew && (
                <button 
                  className="no-print"
                  onClick={() => {
                    updateStatus(order.id, 'PREPARING');
                    setPrintLayoutOpen(false);
                  }}
                  style={{ flex: 1, background: C.borderLight, color: C.text, padding: 12, borderRadius: 12, border: 'none', fontWeight: 800, cursor: 'pointer' }}
                >
                  Skip Print & Send
                </button>
              )}
              <button 
                className="no-print"
                onClick={() => {
                  window.print();
                  if (isNew) updateStatus(order.id, 'PREPARING');
                  setPrintLayoutOpen(false);
                }}
                style={{ flex: 2, background: ACCENT_BLUE, color: '#FFF', padding: 12, borderRadius: 12, border: 'none', fontWeight: 800, cursor: 'pointer' }}
              >
                {isNew ? 'Print & Send KOT' : 'Print Slips'}
              </button>
            </div>
          </div>
        </div>, document.body)}
    </Card>
  );
};

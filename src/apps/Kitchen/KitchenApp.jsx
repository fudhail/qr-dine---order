import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ChefHat, Circle, MapPin, AlertTriangle, Search, 
  Printer, LayoutDashboard, LogOut, FileText, CheckSquare, 
  ShieldAlert
} from 'lucide-react';
import { C } from '../../constants/theme';
import { PinGate } from '../../components/auth/PinGate';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';

const ACCENT_BLUE = '#2563EB';

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

  const handlePartialDispatch = async (orderId, updatedItems) => {
    try {
      await fetch(`/api/admin/orders/${orderId}/partial-dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('kitchenToken')}`
        },
        body: JSON.stringify({ items: updatedItems })
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
    const groupedStatuses = activeTab === 'ACTIVE'
      ? ['NEW', 'PREPARING']
      : activeTab === 'READY'
        ? ['ON_THE_WAY', 'DELIVERED']
        : [];
    let filtered = activeTab === 'MENU' ? [] : orders.filter(o => groupedStatuses.includes(o.status) && o.type === 'FOOD');
    if (searchQuery) {
      filtered = filtered.filter(o => 
        o.token.toLowerCase().includes(searchQuery.toLowerCase()) || 
        String(o.room).includes(searchQuery)
      );
    }
    return filtered;
  }, [orders, activeTab, searchQuery]);

  const activeServiceRequests = useMemo(() => {
    if (activeTab === 'MENU') return [];
    const groupedStatuses = activeTab === 'ACTIVE' ? ['NEW', 'PREPARING'] : ['DELIVERED'];
    return orders.filter(o => groupedStatuses.includes(o.status) && o.type === 'SERVICE');
  }, [orders, activeTab]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const query = menuSearch.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(query) || (item.desc && item.desc.toLowerCase().includes(query));
      const matchesCategory = activeMenuCategory === 'All' || item.category === activeMenuCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, menuSearch, activeMenuCategory]);

  if (!kitchenAuth) {
    return <PinGate role="kitchen" onLogin={login} />;
  }

  const tabs = [
    { id: 'ACTIVE', label: 'Now', icon: FileText, count: orders.filter(o => ['NEW', 'PREPARING'].includes(o.status)).length },
    { id: 'READY', label: 'Done', icon: CheckSquare, count: orders.filter(o => ['ON_THE_WAY', 'DELIVERED'].includes(o.status)).length },
    { id: 'MENU', label: 'Stock', icon: LayoutDashboard, count: 0 },
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
            <div style={{ fontWeight: 800, fontSize: 20, color: C.text, letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>KDS</div>
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
              {activeTab === 'MENU' ? `${filteredMenuItems.length} of ${menuItems.length} stock controls` : `${filteredOrders.length + activeServiceRequests.length} requests in this queue`}
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
                        <span style={{ fontSize: 11, background: C.borderLight, padding: '4px 8px', borderRadius: 6, fontWeight: 700, color: C.textSub }}>{item.category}</span>
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
              <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 16 }}>Dining Orders Pipeline</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 24 }}>
                {orders.length === 0 ? (
                  Array.from({ length: 3 }).map((_, idx) => (
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
                  ))
                ) : (
                  <>
                    {filteredOrders.map(order => (
                      <TicketCard 
                        key={order.id} 
                        order={order} 
                        updateStatus={updateStatus} 
                        onPartialDispatch={handlePartialDispatch}
                      />
                    ))}
                    {filteredOrders.length === 0 && (
                      <div style={{ gridColumn: '1 / -1', background: C.white, borderRadius: 16, padding: 36, textAlign: 'center', color: C.textMuted, border: `1px solid ${C.borderLight}` }}>
                        No active dining orders right now.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* HOSPITALITY REQUESTS */}
            {activeServiceRequests.length > 0 && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 16 }}>Hospitality Requests</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
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

const TicketCard = ({ order, updateStatus, onPartialDispatch }) => {
  const isAsReady = order.deliveryPreference === 'AS_READY';
  const isNew = order.status === 'NEW';
  const isPrep = order.status === 'PREPARING';
  const isReady = order.status === 'ON_THE_WAY';
  const isDone = order.status === 'DELIVERED';

  const [printLayoutOpen, setPrintLayoutOpen] = useState(false);

  // Group items for sequential printing preview
  const splitKOTs = useMemo(() => {
    const groups = {};
    order.items.forEach(item => {
      const cat = item.category || 'Kitchen';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [order]);
  const printableKots = (order.kots && order.kots.length > 0)
    ? order.kots
    : Object.entries(splitKOTs).map(([station, items], index) => ({
        id: `fallback-${station}-${index}`,
        station_id: station,
        kot_number: `${order.token}-${String(station).toUpperCase()}`,
        items
      }));

  // Determine top bar color based on status (Rapid KDS style)
  let topColor = C.warning; // Yellow for NEW
  if (isPrep) topColor = '#3B82F6'; // Blue for preparing
  if (isReady) topColor = '#10B981'; // Green for ready
  if (isDone) topColor = C.textMuted; // Gray for completed

  // Toggling preparation status of individual items
  const toggleItemState = (index) => {
    const item = order.items[index];
    if (!item || isNew || isDone || item.status === 'DISPATCHED') return;

    const updatedItems = order.items.map((currentItem, itemIndex) => {
      if (itemIndex !== index) return currentItem;

      if (isAsReady) {
        const nextStatus = currentItem.status === 'PENDING'
          ? 'DONE'
          : currentItem.status === 'DONE'
            ? 'DISPATCHED'
            : 'PENDING';
        return { ...currentItem, status: nextStatus };
      }

      return { ...currentItem, status: currentItem.status === 'PENDING' ? 'DONE' : 'PENDING' };
    });

    onPartialDispatch(order.id, updatedItems);
  };

  const allCooked = order.items.every(i => i.status === 'DONE' || i.status === 'DISPATCHED');

  return (
    <Card style={{ 
      padding: 0, 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      borderRadius: 20,
      borderTop: `6px solid ${topColor}`,
      boxShadow: '0 6px 18px rgba(0,0,0,0.03)',
      background: '#FFF'
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.borderLight}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', color: topColor, letterSpacing: '0.5px' }}>
                {order.status}
              </div>
              <div style={{ fontSize: 9, fontWeight: 800, backgroundColor: isAsReady ? '#FEE2E2' : '#EFF6FF', color: isAsReady ? '#EF4444' : ACCENT_BLUE, padding: '2px 5px', borderRadius: 4 }}>
                {isAsReady ? 'AS READY' : 'ALL AT ONCE'}
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 24, color: C.text, lineHeight: 1 }}>{order.token}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.textSub, fontSize: 13, marginTop: 6 }}>
              <MapPin size={12} /> Room {order.room}
            </div>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{order.items.length} Items</div>
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
        <div style={{ padding: '10px 20px', backgroundColor: '#FEF3C7', borderBottom: `1px solid ${C.borderLight}`, display: 'flex', gap: 6 }}>
          <AlertTriangle size={14} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>{order.note}</span>
        </div>
      )}

      {/* Items List */}
      <div style={{ padding: '16px 20px', flex: 1, backgroundColor: '#FFF', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {order.items.map((item, idx) => {
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
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, color: isItemDispatched ? '#9CA3AF' : isItemDone ? '#10B981' : '#6B7280' }}>
                {isItemDispatched ? 'Dispatched' : isItemDone ? 'Done' : 'Pending'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div style={{ padding: 14, backgroundColor: C.sand, borderTop: `1px solid ${C.borderLight}` }}>
        {isNew && (
          <button 
            onClick={() => updateStatus(order.id, 'PREPARING')}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', backgroundColor: '#3B82F6', color: '#FFF', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
          >
            ACCEPT & PREPARE
          </button>
        )}
        {isPrep && (
          <>
            {isAsReady ? (
              <button 
                onClick={() => {
                  const updatedItems = order.items.map(i => i.status === 'DONE' ? { ...i, status: 'DISPATCHED' } : i);
                  onPartialDispatch(order.id, updatedItems);
                }}
                disabled={!order.items.some(i => i.status === 'DONE')}
                style={{ 
                  width: '100%', padding: 12, borderRadius: 10, border: 'none', 
                  backgroundColor: order.items.some(i => i.status === 'DONE') ? '#10B981' : '#CBD5E1', 
                  color: '#FFF', fontWeight: 800, fontSize: 14, cursor: 'pointer' 
                }}
              >
                DISPATCH READY ITEMS
              </button>
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
      {printLayoutOpen && (
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
                    *** ELITE KOT: {String(kot.station_id).toUpperCase()} ***
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
                        <span>{item.name}</span>
                        <span>x{item.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button 
              className="no-print"
              onClick={() => {
                window.print();
                setPrintLayoutOpen(false);
              }}
              style={{ background: ACCENT_BLUE, color: '#FFF', padding: 12, borderRadius: 12, border: 'none', fontWeight: 800, cursor: 'pointer' }}
            >
              Print Slips
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};

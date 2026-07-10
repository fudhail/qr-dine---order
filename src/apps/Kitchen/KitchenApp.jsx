import React, { useState, useMemo } from 'react';
import { ChefHat, CheckCircle, Circle, MapPin, AlertTriangle, Search, Clock, Printer, LayoutDashboard, LogOut, FileText, CheckSquare, XCircle } from 'lucide-react';
import { C } from '../../constants/theme';
import { PinGate } from '../../components/auth/PinGate';
import { useStore } from '../../store/useStore';

export const KitchenApp = ({ config = {} }) => {
  const orders = useStore(state => state.orders);
  const setOrders = useStore(state => state.setOrders);
  const kitchenAuth = useStore(state => state.kitchenAuth);
  const login = useStore(state => state.login);
  const logout = useStore(state => state.logout);
  
  const menuItems = useStore(state => state.menuItems);
  const setMenuItems = useStore(state => state.setMenuItems);

  const [activeTab, setActiveTab] = useState('NEW'); // NEW, PREPARING, ON_THE_WAY, DELIVERED, MENU
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Menu Editor State
  const [activeMenuCategory, setActiveMenuCategory] = useState('All');
  const [menuSearch, setMenuSearch] = useState('');

  const toggleItemAvailability = (id) => {
    setMenuItems(menuItems.map(item => item.id === id ? { ...item, available: !item.available } : item));
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(o => o.status === activeTab);
    if (searchQuery) {
      filtered = filtered.filter(o => 
        o.token.toLowerCase().includes(searchQuery.toLowerCase()) || 
        String(o.room).includes(searchQuery)
      );
    }
    return filtered;
  }, [orders, activeTab, searchQuery]);

  const updateStatus = (id, newStatus) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const toggleItemDone = (orderId, itemIdx) => {
    setOrders(orders.map(o => {
      if (o.id === orderId) {
        const newItems = [...o.items];
        const cur = newItems[itemIdx].status;
        if (cur === 'DISPATCHED') return o;
        newItems[itemIdx] = { ...newItems[itemIdx], status: cur === 'DONE' ? 'PENDING' : 'DONE' };
        return { ...o, items: newItems };
      }
      return o;
    }));
  };

  const dispatchAllDone = (orderId) => {
    setOrders(orders.map(o => {
      if (o.id === orderId) {
        const newItems = o.items.map(item => 
          item.status === 'DONE' ? { ...item, status: 'DISPATCHED' } : item
        );
        const allDispatched = newItems.every(i => i.status === 'DISPATCHED');
        return { ...o, items: newItems, status: allDispatched ? 'ON_THE_WAY' : o.status };
      }
      return o;
    }));
  };

  const markDelivered = (orderId) => {
    setOrders(orders.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'DELIVERED', items: o.items.map(i => ({ ...i, status: 'DISPATCHED' })) };
      }
      return o;
    }));
  };

  if (!kitchenAuth) {
    return <PinGate role="kitchen" onLogin={login} />;
  }

  const tabs = [
    { id: 'NEW', label: 'Open Orders', icon: FileText, count: orders.filter(o => o.status === 'NEW').length },
    { id: 'PREPARING', label: 'In Progress', icon: Clock, count: orders.filter(o => o.status === 'PREPARING').length },
    { id: 'ON_THE_WAY', label: 'Ready / Dispatch', icon: CheckSquare, count: orders.filter(o => o.status === 'ON_THE_WAY').length },
    { id: 'DELIVERED', label: 'Completed', icon: CheckCircle, count: orders.filter(o => o.status === 'DELIVERED').length },
    { id: 'MENU', label: 'Menu Editor', icon: LayoutDashboard, count: 0 },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: C.sand, overflow: 'hidden' }}>
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

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.text }}>
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            <p style={{ margin: '4px 0 0', color: C.textSub, fontSize: 14 }}>
              {activeTab === 'MENU' ? `${menuItems.length} menu items available` : `${filteredOrders.length} orders in this queue`}
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

        {activeTab === 'MENU' ? (
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
              {menuItems
                .filter(item => {
                  const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) || (item.desc && item.desc.toLowerCase().includes(menuSearch.toLowerCase()));
                  const matchesCategory = activeMenuCategory === 'All' || item.category === activeMenuCategory;
                  return matchesSearch && matchesCategory;
                })
                .map(item => (
                  <div key={item.id} style={{ padding: 20, background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 16 }}>{item.name}</h4>
                        <span style={{ fontSize: 11, background: C.borderLight, padding: '4px 8px', borderRadius: 6, fontWeight: 700, color: C.textSub }}>{item.category}</span>
                      </div>
                      <div 
                        onClick={() => toggleItemAvailability(item.id)}
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
          <div style={{
            /* Order Grid (Rapid KDS Style Ticket Cards) */
            flex: 1, overflowY: 'auto', padding: '0 32px 32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 24,
            alignContent: 'start'
          }}>
            {filteredOrders.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px', color: C.textMuted }}>
                <CheckCircle size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <h3 style={{ margin: 0 }}>No orders in this queue</h3>
              </div>
            )}
            
            {filteredOrders.map(order => (
              <TicketCard 
                key={order.id} 
                order={order} 
                updateStatus={updateStatus} 
                toggleItemDone={toggleItemDone} 
                dispatchAllDone={dispatchAllDone}
                markDelivered={markDelivered}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TicketCard = ({ order, updateStatus, toggleItemDone, dispatchAllDone, markDelivered }) => {
  const isAsReady = order.deliveryPreference === 'AS_READY';
  const isNew = order.status === 'NEW';
  const isPrep = order.status === 'PREPARING';
  const isReady = order.status === 'ON_THE_WAY';
  const isDone = order.status === 'DELIVERED';

  // Determine top bar color based on status (Rapid KDS style)
  let topColor = C.emeraldMid; // Yellow for NEW
  if (isPrep) topColor = '#3B82F6'; // Blue for in progress
  if (isReady) topColor = '#10B981'; // Green for ready
  if (isDone) topColor = C.textMuted; // Gray for done

  return (
    <div className="modern-card" style={{ 
      display: 'flex', flexDirection: 'column', 
      overflow: 'hidden', opacity: isDone ? 0.7 : 1,
      borderTop: `6px solid ${topColor}`
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.borderLight}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', color: topColor, letterSpacing: '0.5px' }}>
                {order.status.replace('_', ' ')}
              </div>
              {isAsReady && (
                <div style={{ fontSize: 10, fontWeight: 800, backgroundColor: C.dangerLight, color: C.danger, padding: '2px 6px', borderRadius: 4 }}>
                  AS READY
                </div>
              )}
            </div>
            <div style={{ fontWeight: 800, fontSize: 28, color: C.text, lineHeight: 1 }}>{order.token}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.textSub, fontSize: 14, marginTop: 8 }}>
              <MapPin size={14} /> Room {order.room}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{order.items.length} Items</div>
            <div style={{ fontSize: 13, color: C.textSub, marginTop: 4 }}>{order.minutesAgo}m ago</div>
          </div>
        </div>
      </div>

      {/* Note */}
      {order.note && (
        <div style={{ padding: '12px 24px', backgroundColor: C.warningLight, borderBottom: `1px solid ${C.borderLight}`, display: 'flex', gap: 8 }}>
          <AlertTriangle size={16} color={C.warning} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 13, color: '#925C03', fontWeight: 600 }}>{order.note}</span>
        </div>
      )}

      {/* Items */}
      <div style={{ padding: '16px 24px', flex: 1, backgroundColor: C.white, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {order.items.map((item, idx) => {
          const itemDone = item.status === 'DONE';
          const itemDispatched = item.status === 'DISPATCHED' || isDone;
          
          return (
            <div 
              key={idx} 
              onClick={() => !isNew && !itemDispatched && toggleItemDone(order.id, idx)}
              style={{ 
                display: 'flex', gap: 12, alignItems: 'flex-start',
                cursor: (!isNew && !itemDispatched) ? 'pointer' : 'default',
                opacity: itemDispatched ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ marginTop: 2 }}>
                {itemDispatched ? <CheckSquare size={20} color={C.textMuted} /> 
                  : itemDone ? <CheckSquare size={20} color={C.emeraldMid} fill={C.emeraldLight} />
                  : <Circle size={20} color={C.border} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: C.text, textDecoration: itemDispatched ? 'line-through' : 'none' }}>
                  {item.quantity}x {item.name}
                </div>
                {item.modifications && item.modifications.map((mod, i) => (
                  <div key={i} style={{ fontSize: 13, color: C.textSub, marginTop: 2, paddingLeft: 8, borderLeft: `2px solid ${C.borderLight}` }}>
                    + {mod}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div style={{ padding: 16, backgroundColor: C.sand, borderTop: `1px solid ${C.borderLight}` }}>
        {isNew && (
          <button 
            onClick={() => updateStatus(order.id, 'PREPARING')}
            style={{ 
              width: '100%', padding: '16px', borderRadius: 12, border: 'none',
              backgroundColor: C.emeraldMid, color: C.text, fontWeight: 800, fontSize: 16,
              cursor: 'pointer'
            }}
          >
            ACCEPT & PREPARE
          </button>
        )}
        {isPrep && (
          <button 
            onClick={() => isAsReady ? dispatchAllDone(order.id) : updateStatus(order.id, 'ON_THE_WAY')}
            style={{ 
              width: '100%', padding: '16px', borderRadius: 12, border: 'none',
              backgroundColor: topColor, color: C.white, fontWeight: 800, fontSize: 16,
              cursor: 'pointer'
            }}
          >
            {isAsReady ? 'DISPATCH READY ITEMS' : 'MARK ALL READY'}
          </button>
        )}
        {isReady && (
          <button 
            onClick={() => markDelivered(order.id)}
            style={{ 
              width: '100%', padding: '16px', borderRadius: 12, border: 'none',
              backgroundColor: topColor, color: C.white, fontWeight: 800, fontSize: 16,
              cursor: 'pointer'
            }}
          >
            MARK DELIVERED
          </button>
        )}
        {isDone && (
          <div style={{ textAlign: 'center', padding: '12px', fontWeight: 700, color: C.textMuted, fontSize: 14 }}>
            ORDER COMPLETED
          </div>
        )}
      </div>
    </div>
  );
};

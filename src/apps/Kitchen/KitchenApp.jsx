import React, { useState } from 'react';
import { ChefHat, CheckCircle, Circle, MapPin, AlertTriangle } from 'lucide-react';
import { C } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { VegDot } from '../../components/ui/VegDot';
import { ClockWidget } from '../../components/ui/ClockWidget';
import { CONFIG } from '../../config';

export const KitchenApp = ({ orders, setOrders, menuItems, setMenuItems, socketConnected, config = CONFIG }) => {
  const [activeTab, setActiveTab] = useState('queue');
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Always derive the live order from state — never use a stale prop snapshot
  const selectedOrder = orders.find(o => o.id === selectedOrderId) || null;

  const newOrders = orders.filter(o => o.status === 'NEW');
  const prepOrders = orders.filter(o => o.status === 'PREPARING');
  const otwOrders = orders.filter(o => o.status === 'ON_THE_WAY');

  const updateStatus = (id, newStatus) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    if (selectedOrderId === id) setSelectedOrderId(null);
  };

  // Mark all items as DELIVERED when dispatching
  const markDelivered = (orderId) => {
    setOrders(orders.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'DELIVERED', items: o.items.map(i => ({ ...i, status: 'DISPATCHED' })) };
      }
      return o;
    }));
  };

  // Cycle: PENDING → DONE → PENDING (tapping done item reverts it unless dispatched)
  const toggleItemDone = (orderId, itemIdx) => {
    setOrders(orders.map(o => {
      if (o.id === orderId) {
        const newItems = [...o.items];
        const cur = newItems[itemIdx].status;
        // Can't un-done a dispatched item
        if (cur === 'DISPATCHED') return o;
        newItems[itemIdx] = { ...newItems[itemIdx], status: cur === 'DONE' ? 'PENDING' : 'DONE' };
        return { ...o, items: newItems };
      }
      return o;
    }));
  };

  // Dispatch specific items (by index list) — for AS_READY orders
  const dispatchItems = (orderId, itemIdxList) => {
    setOrders(orders.map(o => {
      if (o.id === orderId) {
        const newItems = o.items.map((item, idx) =>
          itemIdxList.includes(idx) && item.status === 'DONE'
            ? { ...item, status: 'DISPATCHED' }
            : item
        );
        // If every item is dispatched, auto-advance order to ON_THE_WAY
        const allDispatched = newItems.every(i => i.status === 'DISPATCHED');
        return { ...o, items: newItems, status: allDispatched ? 'ON_THE_WAY' : o.status };
      }
      return o;
    }));
  };

  // Dispatch all DONE items at once (batch)
  const dispatchAllDone = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const doneIdxs = order.items.map((item, idx) => item.status === 'DONE' ? idx : -1).filter(i => i >= 0);
    dispatchItems(orderId, doneIdxs);
  };

  const TicketCard = ({ order }) => {
    const isAsReady = order.deliveryPreference === 'AS_READY';
    const dispatchedCount = order.items.filter(i => i.status === 'DISPATCHED').length;
    const doneCount = order.items.filter(i => i.status === 'DONE').length;
    const allDispatched = dispatchedCount === order.items.length;
    const allDone = (doneCount + dispatchedCount) === order.items.length;
    const hasDoneItems = doneCount > 0;
    const isNew = order.status === 'NEW';
    const isCompleted = order.status === 'DELIVERED';

    return (
      <Card
        style={{
          padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          border: isNew ? `2px solid ${C.emerald}` : isCompleted ? `1px solid ${C.borderLight}` : (hasDoneItems && isAsReady) || (allDone && !isAsReady) ? `2px solid ${C.info}` : `1px solid ${C.border}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          opacity: isCompleted ? 0.7 : 1,
        }}
        className="animate-fade-up"
      >
        {/* Ticket Header */}
        <div style={{ background: isNew ? C.emerald : isCompleted ? C.borderLight : C.white, color: isNew ? C.white : C.text, padding: '16px', borderBottom: `1px solid ${C.borderLight}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div className="serif" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{order.token}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginTop: 6, color: isNew ? 'rgba(255,255,255,0.9)' : C.textSub }}>
                <MapPin size={14} /> Room {order.room}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 700, background: isNew ? 'rgba(0,0,0,0.2)' : C.white, padding: '4px 8px', borderRadius: 6 }}>
                {order.minutesAgo}m ago
              </div>
            </div>
          </div>
          {isAsReady && (
            <div style={{ display: 'inline-block', background: isNew ? 'rgba(255,255,255,0.2)' : C.infoLight, color: isNew ? C.white : C.info, fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6, marginTop: 4 }}>
              SERVE AS READY
            </div>
          )}
        </div>

        {/* Notes */}
        {order.note && (
          <div style={{ padding: '12px 16px', background: C.warningLight, color: C.warning, fontSize: 13, fontStyle: 'italic', display: 'flex', gap: 8, borderBottom: `1px solid ${C.borderLight}` }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{order.note}</span>
          </div>
        )}

        {/* Item List */}
        <div style={{ padding: 16, flex: 1, background: C.sand }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {order.items.map((item, idx) => {
              const isDone = item.status === 'DONE';
              const isDispatched = item.status === 'DISPATCHED' || isCompleted;

              return (
                <button
                  key={idx}
                  onClick={() => !isNew && !isDispatched && !isCompleted && toggleItemDone(order.id, idx)}
                  disabled={isNew || isDispatched || isCompleted}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
                    borderRadius: 12, border: `1px solid ${isDispatched ? 'transparent' : isDone ? C.emeraldMid : C.border}`,
                    background: isDispatched ? 'rgba(0,0,0,0.03)' : isDone ? C.emeraldLight : C.white,
                    textAlign: 'left', transition: 'all 0.2s',
                    cursor: isNew || isDispatched || isCompleted ? 'default' : 'pointer',
                    opacity: isDispatched ? 0.6 : 1
                  }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: isDispatched ? C.info : isDone ? C.emeraldMid : C.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isDispatched ? <span style={{ fontSize: 14 }}>🚀</span> : isDone ? <CheckCircle size={16} color={C.white} /> : <Circle size={16} color={C.textMuted} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: isDispatched ? C.textSub : C.text, textDecoration: isDispatched ? 'line-through' : 'none' }}>{item.qty}× {item.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ticket Footer Actions */}
        <div style={{ padding: 16, background: C.white, borderTop: `1px solid ${C.borderLight}` }}>
          {isNew ? (
            <button
              onClick={() => updateStatus(order.id, 'PREPARING')}
              style={{ width: '100%', background: C.emerald, color: C.white, padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 15, boxShadow: `0 4px 12px ${C.emerald}40` }}
            >
              Start Preparing
            </button>
          ) : isCompleted ? (
            <div style={{ textAlign: 'center', color: C.info, fontWeight: 700, fontSize: 14, padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <CheckCircle size={18} /> Delivered to Room
            </div>
          ) : (
            <>
              {isAsReady ? (
                hasDoneItems ? (
                  <button
                    onClick={() => dispatchAllDone(order.id)}
                    style={{ width: '100%', background: C.info, color: C.white, padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 15, display: 'flex', justifyContent: 'center', gap: 8 }}
                  >
                    🚀 Dispatch {doneCount} Ready Item{doneCount > 1 ? 's' : ''}
                  </button>
                ) : allDispatched ? (
                  <div style={{ textAlign: 'center', color: C.info, fontWeight: 700, fontSize: 14, padding: '10px 0' }}>
                    All items dispatched
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: C.textMuted, fontWeight: 600, fontSize: 14, padding: '10px 0' }}>
                    Tap items as they finish
                  </div>
                )
              ) : (
                allDone ? (
                  <button
                    onClick={() => markDelivered(order.id)}
                    style={{ width: '100%', background: C.emeraldMid, color: C.white, padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 15, display: 'flex', justifyContent: 'center', gap: 8 }}
                  >
                    ✅ Mark as Delivered
                  </button>
                ) : (
                  <div style={{ textAlign: 'center', color: C.textMuted, fontWeight: 600, fontSize: 14, padding: '10px 0' }}>
                    Prep remaining items to dispatch
                  </div>
                )
              )}
            </>
          )}
        </div>
      </Card>
    );
  };

  const activeOrders = orders.filter(o => o.status === 'NEW' || o.status === 'PREPARING');
  const completedOrders = orders.filter(o => o.status === 'DELIVERED');

  return (
    <div style={{ height: '100vh', background: C.borderLight, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={{ background: C.white, padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: C.brassLight, padding: 8, borderRadius: 8 }}><ChefHat size={24} color={C.brass} /></div>
          <div>
            <h1 className="serif" style={{ fontSize: 20, color: C.emerald, margin: 0 }}>Kitchen Display System</h1>
            <p style={{ fontSize: 13, color: C.textSub, marginTop: 2 }}>{config?.hotelName}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ display: 'flex', gap: 8, background: C.borderLight, padding: 4, borderRadius: 12 }}>
            <button onClick={() => setActiveTab('queue')} style={{ padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 14, background: activeTab === 'queue' ? C.white : 'transparent', boxShadow: activeTab === 'queue' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>Active Tickets</button>
            <button onClick={() => setActiveTab('completed')} style={{ padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 14, background: activeTab === 'completed' ? C.white : 'transparent', boxShadow: activeTab === 'completed' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>Completed</button>
            <button onClick={() => setActiveTab('menu')} style={{ padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 14, background: activeTab === 'menu' ? C.white : 'transparent', boxShadow: activeTab === 'menu' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>Menu Manager</button>
          </div>
          <ClockWidget />
        </div>
      </header>

      {activeTab === 'queue' && (
        <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
          {activeOrders.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.textMuted }}>
              <ChefHat size={64} style={{ marginBottom: 24, opacity: 0.2 }} />
              <h2 style={{ fontSize: 24, fontWeight: 700 }}>Kitchen clear!</h2>
              <p style={{ fontSize: 16 }}>No active orders in the queue.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
              {activeOrders.map(o => <TicketCard key={o.id} order={o} />)}
            </div>
          )}
        </div>
      )}

      {activeTab === 'completed' && (
        <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
          {completedOrders.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.textMuted }}>
              <CheckCircle size={64} style={{ marginBottom: 24, opacity: 0.2 }} />
              <h2 style={{ fontSize: 24, fontWeight: 700 }}>No completed orders</h2>
              <p style={{ fontSize: 16 }}>Dispatched orders will appear here for reference.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
              {completedOrders.map(o => <TicketCard key={o.id} order={o} />)}
            </div>
          )}
        </div>
      )}

      {activeTab === 'menu' && (
        <div style={{ padding: 32, maxWidth: 800, margin: '0 auto', width: '100%' }} className="animate-fade-up">
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: C.borderLight, fontSize: 13, color: C.textSub, textTransform: 'uppercase' }}>
                <tr>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Item Name</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Price</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Availability</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: item.available ? C.text : C.textMuted, textDecoration: item.available ? 'none' : 'line-through' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><VegDot isVeg={item.isVeg} /> {item.name}</div>
                    </td>
                    <td style={{ padding: '16px 24px', color: C.textSub, fontSize: 14 }}>{item.category}</td>
                    <td style={{ padding: '16px 24px', fontWeight: 700, color: C.emerald }}>
                      ₹{item.price}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button 
                        onClick={() => setMenuItems(menuItems.map(i => i.id === item.id ? { ...i, available: !i.available } : i))}
                        style={{ width: 48, height: 26, borderRadius: 13, background: item.available ? C.emerald : C.textMuted, position: 'relative', transition: '0.2s ease' }}
                      >
                        <div style={{ position: 'absolute', top: 3, left: item.available ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: C.white, transition: '0.2s ease' }}></div>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
};

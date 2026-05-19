import React from 'react';
import { PackageCheck, MapPin, Package, CheckCircle } from 'lucide-react';
import { C } from '../../constants/theme';
import { Card } from '../../components/ui/Card';

export const RunnerApp = ({ orders, setOrders }) => {
  // We need to show:
  // 1. Full orders that are ON_THE_WAY
  // 2. Partial items that are DISPATCHED for PREPARING AS_READY orders
  
  const markOrderDelivered = (orderId) => {
    setOrders(orders.map(o => {
      if (o.id === orderId) {
        // Mark all dispatched items as delivered
        const newItems = o.items.map(i => i.status === 'DISPATCHED' || i.status === 'DONE' ? { ...i, status: 'DELIVERED' } : i);
        return { ...o, status: 'DELIVERED', items: newItems };
      }
      return o;
    }));
  };

  const markItemsDelivered = (orderId) => {
    setOrders(orders.map(o => {
      if (o.id === orderId) {
        const newItems = o.items.map(i => i.status === 'DISPATCHED' ? { ...i, status: 'DELIVERED' } : i);
        return { ...o, items: newItems };
      }
      return o;
    }));
  };

  // Find deliveries needed
  const deliveries = [];
  orders.forEach(o => {
    if (o.status === 'ON_THE_WAY') {
      deliveries.push({ type: 'FULL_ORDER', order: o, items: o.items });
    } else if (o.status === 'PREPARING' && o.deliveryPreference === 'AS_READY') {
      const dispatchedItems = o.items.filter(i => i.status === 'DISPATCHED');
      if (dispatchedItems.length > 0) {
        deliveries.push({ type: 'PARTIAL', order: o, items: dispatchedItems });
      }
    }
  });

  return (
    <div style={{ height: '100vh', background: C.sand, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={{ background: C.emerald, padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: C.white }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: '50%' }}><PackageCheck size={28} /></div>
          <div>
            <h1 className="serif" style={{ fontSize: 22, margin: 0 }}>Service Runner</h1>
            <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>Room Delivery Tasks</p>
          </div>
        </div>
      </header>

      <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
        {deliveries.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.textMuted }}>
            <div className="animate-fade-up" style={{ textAlign: 'center' }}>
              <Package size={64} style={{ marginBottom: 24, opacity: 0.2 }} />
              <h2 style={{ fontSize: 24, fontWeight: 700 }}>All caught up!</h2>
              <p style={{ fontSize: 16 }}>No pending room deliveries.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {deliveries.map((del, idx) => (
              <Card key={`${del.order.id}-${idx}`} className="animate-fade-up" style={{ padding: 0, overflow: 'hidden', border: `2px solid ${C.info}` }}>
                <div style={{ padding: 16, background: C.infoLight, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: C.info, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MapPin size={24} /> Room {del.order.room}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.info, marginTop: 4 }}>
                      {del.type === 'FULL_ORDER' ? `Full Order ${del.order.token}` : `Partial Delivery ${del.order.token}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, background: C.white, color: C.info, padding: '4px 8px', borderRadius: 6 }}>
                      {del.order.minutesAgo}m ago
                    </div>
                  </div>
                </div>

                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Items to Deliver</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {del.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: C.borderLight, borderRadius: 12 }}>
                        <div style={{ width: 32, height: 32, background: C.white, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: C.text }}>
                          {item.qty}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 16 }}>{item.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: 16, background: C.white, borderTop: `1px solid ${C.borderLight}` }}>
                  <button
                    onClick={() => del.type === 'FULL_ORDER' ? markOrderDelivered(del.order.id) : markItemsDelivered(del.order.id)}
                    style={{ width: '100%', background: C.emerald, color: C.white, padding: '16px', borderRadius: 12, fontWeight: 700, fontSize: 18, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, boxShadow: `0 8px 24px ${C.emerald}40` }}
                  >
                    <CheckCircle size={24} /> Handed to Guest
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

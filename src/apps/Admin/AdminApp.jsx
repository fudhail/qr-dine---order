import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, UtensilsCrossed, Printer, X, Plus, ClipboardList, 
  TrendingUp, Package, Star, Clock, Trash2, 
  AlertCircle, DollarSign, Edit3, ShieldCheck, ArrowRight,
  Award, Search, Wrench
} from 'lucide-react';
import { C } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { VegDot } from '../../components/ui/VegDot';
import { PinGate } from '../../components/auth/PinGate';
import { CONFIG } from '../../config';

const ACCENT_BLUE = '#2563EB';

// Unsplash presets for beautiful food pictures
const IMAGE_PRESETS = [
  { name: 'Breakfast/Pancakes', url: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400&q=80' },
  { name: 'Gourmet Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
  { name: 'Fresh Salad', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
  { name: 'Fettuccine Pasta', url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400&q=80' },
  { name: 'Chocolate Dessert', url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&q=80' },
  { name: 'Premium Coffee', url: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&q=80' },
];
import { useStore } from '../../store/useStore';

export const AdminApp = ({ config = CONFIG }) => {
  const orders = useStore(state => state.orders);
  const menuItems = useStore(state => state.menuItems);
  const setMenuItems = useStore(state => state.setMenuItems);
  const roomBills = useStore(state => state.roomBills);
  const setRoomBills = useStore(state => state.setRoomBills);
  const socketConnected = useStore(state => state.socketConnected);
  const adminAuth = useStore(state => state.adminAuth);
  const login = useStore(state => state.login);
  const logout = useStore(state => state.logout);
  const configObj = useStore(state => state.config);
  const setConfig = useStore(state => state.setConfig);
  const feedback = useStore(state => state.feedback) || [];
  const stations = useStore(state => state.stations);

  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [showAddChargeModal, setShowAddChargeModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [billSearch, setBillSearch] = useState('');
  const [activeMenuCategory, setActiveMenuCategory] = useState('All');
  
  // New menu item form state
  const [newItem, setNewItem] = useState({ 
    name: '', 
    desc: '', 
    price: '', 
    category: 'Mains', 
    station_id: 'indian',
    isVeg: true, 
    image: IMAGE_PRESETS[0].url 
  });

  const stationOptions = useMemo(() => {
    return stations.length > 0 ? stations : [
      { id: 'indian', name: 'Indian Kitchen' },
      { id: 'continental', name: 'Continental Kitchen' },
      { id: 'bar', name: 'Beverage Station' },
      { id: 'housekeeping', name: 'Housekeeping Services' },
      { id: 'laundry', name: 'Laundry Services' }
    ];
  }, [stations]);

  // Inject font assets inside useEffect
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Initialize selected location on load
  useEffect(() => {
    if (roomBills && roomBills.length > 0 && !selectedRoom) {
      setSelectedRoom(roomBills[0].room);
    }
  }, [roomBills, selectedRoom]);

  const activeBill = useMemo(() => {
    return roomBills.find(b => b.room === selectedRoom) || null;
  }, [roomBills, selectedRoom]);

  // Determine if location mode is hotel
  const isHotel = true;
  const locationLabel = 'Room';

  const calculateBillTotals = useCallback((bill) => {
    if (!bill) return { roomTotal: 0, serviceTotal: 0, roomTax: 0, serviceTax: 0, grandTotal: 0 };
    const roomTotal = bill.roomCharge || 0;
    const roomTax = roomTotal * 0.12;
    
    const cgst = configObj?.cgst || 2.5;
    const sgst = configObj?.sgst || 2.5;
    const sc = configObj?.serviceCharge || 10;
    const totalTaxAndServiceRate = (cgst + sgst + sc) / 100;
    
    const serviceTotalInclusive = bill.roomServiceCharges ? bill.roomServiceCharges.reduce((sum, c) => sum + c.amount, 0) : 0;
    const serviceTotalBase = serviceTotalInclusive / (1 + totalTaxAndServiceRate);
    const serviceTax = serviceTotalInclusive - serviceTotalBase;
    
    return {
      roomTotal,
      serviceTotal: serviceTotalBase,
      roomTax,
      serviceTax,
      grandTotal: roomTotal + roomTax + serviceTotalInclusive
    };
  }, [configObj?.cgst, configObj?.sgst, configObj?.serviceCharge]);

  const activeTotals = useMemo(() => {
    return calculateBillTotals(activeBill);
  }, [activeBill, calculateBillTotals]);

  // Get orders that are delivered but not attached to the current room bill yet
  const unbilledDeliveredOrders = useMemo(() => {
    if (!selectedRoom || !orders) return [];
    return orders.filter(o => 
      o.status === 'DELIVERED' && 
      o.room === selectedRoom && 
      (!activeBill?.roomServiceCharges || !activeBill.roomServiceCharges.some(c => c.orderId === o.id))
    );
  }, [orders, selectedRoom, activeBill]);

  // Add Item to Menu Handler
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;
    const createdItem = {
      ...newItem,
      id: Date.now(),
      price: Number(newItem.price),
      station_id: newItem.station_id || stationOptions[0]?.id || 'indian',
      available: true
    };
    setMenuItems([createdItem, ...menuItems]);
    setShowAddItemModal(false);
    setNewItem({
      name: '',
      desc: '',
      price: '',
      category: 'Mains',
      station_id: stationOptions[0]?.id || 'indian',
      isVeg: true,
      image: IMAGE_PRESETS[0].url
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = sessionStorage.getItem('adminToken');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setNewItem({ ...newItem, image: data.imageUrl });
      } else {
        alert('Image upload failed');
      }
    } catch (err) {
      console.error('Error uploading image', err);
      alert('Upload failed: ' + err.message);
    }
  };

  // Toggle item availability
  const toggleItemAvailability = async (itemId) => {
    const item = menuItems.find(menuItem => menuItem.id === itemId);
    if (!item) return;

    try {
      const response = await fetch('/api/admin/menu_items/out-of-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ itemId, available: !item.available })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error || 'Could not update stock status.');
      }
    } catch {
      alert('Network error while updating stock status.');
    }
  };

  // Delete menu item
  const handleDeleteItem = (itemId) => {
    const item = menuItems.find(menuItem => menuItem.id === itemId);
    const confirmed = window.confirm(`Delete ${item?.name || 'this menu item'}? This removes it from the guest menu.`);
    if (!confirmed) return;
    setMenuItems(menuItems.filter(item => item.id !== itemId));
  };

  // Link delivered order charge to the selected bill
  const attachOrderToBill = (order) => {
    const newCharge = {
      orderId: order.id,
      amount: order.total,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      desc: order.items.map(i => `${i.name} ×${i.qty}`).join(', ')
    };
    setRoomBills(roomBills.map(b => 
      b.room === selectedRoom 
        ? { ...b, roomServiceCharges: [...(b.roomServiceCharges || []), newCharge] }
        : b
    ));
    setShowAddChargeModal(false);
  };

  // Lock or unlock bill status
  const toggleBillStatus = () => {
    setRoomBills(roomBills.map(b => {
      if (b.room === selectedRoom) {
        const newStatus = b.status === 'OPEN' ? 'CLOSED' : 'OPEN';
        // When opening a new bill, generate a new billId to bind to guest sessions
        const newBillId = newStatus === 'OPEN' ? `bill_${Date.now()}_${Math.floor(Math.random()*1000)}` : undefined;
        return { ...b, status: newStatus, billId: newStatus === 'OPEN' ? newBillId : b.billId };
      }
      return b;
    }));
  };

  // Update specific order status in the active pipeline
  const updateOrderStatus = async (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = (order.items || []).map(item => (
      newStatus === 'ON_THE_WAY' || newStatus === 'DELIVERED'
        ? { ...item, status: 'DISPATCHED' }
        : item
    ));

    try {
      const response = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify([{ id: orderId, status: newStatus, items: updatedItems }])
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error || 'Could not update order status.');
      }
    } catch {
      alert('Network error while updating order status.');
    }
  };

  // Cancel/Refund order
  const cancelOrder = async (orderId) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        }
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error || 'Only new orders can be cancelled.');
      }
    } catch {
      alert('Network error while cancelling order.');
    }
  };

  // Analytics derivations
  const totalSalesFB = useMemo(() => {
    return orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const salesByCategory = useMemo(() => {
    const stats = {};
    orders.filter(o => o.status !== 'CANCELLED').forEach(order => {
      order.items.forEach(item => {
        // Resolve item category from menuItems or fallback
        const category = menuItems.find(m => m.name === item.name)?.category || 'Mains';
        stats[category] = (stats[category] || 0) + (item.price * item.qty);
      });
    });
    return Object.entries(stats).map(([category, value]) => ({ category, value }));
  }, [orders, menuItems]);

  const topDishes = useMemo(() => {
    const counts = {};
    orders.filter(o => o.status !== 'CANCELLED').forEach(order => {
      order.items.forEach(item => {
        counts[item.name] = (counts[item.name] || 0) + item.qty;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [orders]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) || (item.desc && item.desc.toLowerCase().includes(menuSearch.toLowerCase()));
      const matchesCategory = activeMenuCategory === 'All' || item.category === activeMenuCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, menuSearch, activeMenuCategory]);

  const menuStats = useMemo(() => {
    const total = menuItems.length;
    const available = menuItems.filter(item => item.available).length;
    const veg = menuItems.filter(item => item.isVeg).length;
    const avgPrice = total > 0 ? Math.round(menuItems.reduce((sum, item) => sum + Number(item.price || 0), 0) / total) : 0;

    return [
      { label: 'Total dishes', value: total },
      { label: 'Available now', value: available },
      { label: 'Veg dishes', value: veg },
      { label: 'Avg price', value: `₹${avgPrice}` },
    ];
  }, [menuItems]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'billing', label: 'Billing & POS', icon: ClipboardList },
    { id: 'orders', label: 'Dining Orders', icon: Package, badge: orders.filter(o => o.type === 'FOOD' && (o.status === 'NEW' || o.status === 'PREPARING')).length },
    { id: 'services', label: 'Hospitality Requests', icon: Wrench, badge: orders.filter(o => o.type === 'SERVICE' && (o.status === 'NEW' || o.status === 'PREPARING')).length },
    { id: 'menu', label: 'Menu Editor', icon: UtensilsCrossed },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Edit3 },
  ];

  if (!adminAuth) {
    return <PinGate role="admin" onLogin={login} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.sand, fontFamily: '"Plus Jakarta Sans", sans-serif', color: C.text }}>
      
      {/* SIDEBAR */}
      <div 
        style={{ 
          width: isSidebarCollapsed ? 88 : 280, 
          background: C.emerald, 
          color: C.white, 
          display: 'flex', 
          flexDirection: 'column', 
          padding: isSidebarCollapsed ? '32px 12px' : '32px 24px', 
          position: 'sticky', 
          top: 0, 
          height: '100vh', 
          boxShadow: '4px 0 24px rgba(7,20,40,0.05)',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }} 
        className="no-print"
      >
        <div 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{ 
            display: 'flex', gap: 14, alignItems: 'center', marginBottom: 48, 
            cursor: 'pointer',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start'
          }}
        >
          <div style={{ background: 'rgba(255,255,255,0.08)', padding: 12, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
            <LayoutDashboard size={26} color={C.brassLight} />
          </div>
          {!isSidebarCollapsed && (
            <div style={{ whiteSpace: 'nowrap', opacity: isSidebarCollapsed ? 0 : 1, transition: 'opacity 0.3s' }}>
              <h1 className="serif" style={{ fontSize: 20, color: C.brassLight, fontWeight: 700, margin: 0, lineHeight: 1.2, letterSpacing: 0.5 }}>{config?.shortName}</h1>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>Console</div>
            </div>
          )}
        </div>

        {/* NAVIGATION LINKS */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => setActiveSection(item.id)}
                title={isSidebarCollapsed ? item.label : undefined}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
                  padding: isSidebarCollapsed ? '14px 0' : '14px 18px', 
                  borderRadius: 16, 
                  background: isActive ? C.emeraldMid : 'transparent', 
                  color: isActive ? C.text : 'rgba(255,255,255,0.65)', 
                  border: 'none',
                  textAlign: 'left', 
                  fontWeight: isActive ? 800 : 500, 
                  fontSize: 14.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = C.white;
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center' }}>
                  <Icon size={20} color={isActive ? C.text : 'currentColor'} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
                  {!isSidebarCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                </div>
                {!isSidebarCollapsed && item.badge > 0 && (
                  <span style={{ background: C.brass, color: C.emerald, fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, minWidth: 20, textAlign: 'center' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* SYSTEM STATUS FOOTER */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: isSidebarCollapsed ? '14px 0' : '14px 16px', display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', gap: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: socketConnected ? '#10B981' : C.danger, boxShadow: socketConnected ? '0 0 10px #10B981' : '0 0 10px ' + C.danger, flexShrink: 0 }}></div>
          {!isSidebarCollapsed && (
            <div style={{ whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.white }}>{socketConnected ? 'Console Online' : 'Offline Mode'}</div>
              <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>{socketConnected ? 'Live Connection Sync' : 'Reconnecting...'}</div>
            </div>
          )}
        </div>
        <button onClick={() => logout('admin')} title="Logout" style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#FCA5A5', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
          Lock Console
        </button>
      </div>

      {/* MAIN VIEWPORT */}
      <div style={{ flex: 1, padding: '40px 48px', minHeight: '100vh', overflowY: 'visible' }} className="no-print">
        
        {/* DASHBOARD SECTION */}
        {activeSection === 'dashboard' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
              <div>
                <h2 className="serif" style={{ fontSize: 32, fontWeight: 800, color: C.text, margin: 0 }}>Executive Overview</h2>
                <p style={{ color: C.textSub, fontSize: 14, marginTop: 6 }}>Real-time service occupancy, room dining telemetry, and billing status.</p>
              </div>
              <div style={{ display: 'flex', gap: 12, background: C.white, padding: '6px 12px', borderRadius: 12, border: `1px solid ${C.border}` }}>
                <Clock size={16} color={C.textMuted} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.textSub }}>Live State Updated</span>
              </div>
            </div>

            {/* DASHBOARD KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 36 }}>
              {[
                { label: 'F&B Gross revenue', value: `₹${totalSalesFB.toLocaleString()}`, sub: 'From guest orders', icon: DollarSign, color: C.emerald },
                { label: 'Total Orders Placed', value: orders.length, sub: 'All statuses combined', icon: Package, color: C.brass },
                { label: 'Active Service Bills', value: roomBills.filter(b => b.status === 'OPEN').length, sub: `${locationLabel} service open`, icon: ClipboardList, color: C.info },
                { label: 'Average Ticket Size', value: `₹${orders.length > 0 ? Math.round(totalSalesFB / orders.length).toLocaleString() : 0}`, sub: 'Gross cart average', icon: Star, color: '#8B5CF6' }
              ].map((stat, i) => (
                <Card key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, border: `1px solid ${C.border}`, boxShadow: 'none' }}>
                  <div style={{ background: stat.color + '12', padding: 16, borderRadius: 20 }}>
                    <stat.icon size={26} color={stat.color} />
                  </div>
                  <div>
                    <div style={{ color: C.textMuted, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: C.text, marginTop: 6, letterSpacing: -0.5 }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: C.textSub, marginTop: 4 }}>{stat.sub}</div>
                  </div>
                </Card>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '5fr 4fr', gap: 32 }}>
              {/* OCCUPANCY TRACKER GRID */}
              <Card style={{ border: `1px solid ${C.border}`, boxShadow: 'none' }}>
                <h3 className="serif" style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 8px 0' }}>{locationLabel} Occupancy Grid</h3>
                <p style={{ color: C.textSub, fontSize: 13, margin: '0 0 24px 0' }}>Visual tracker of active rooms or dining tables in the database.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  {roomBills.map(bill => {
                    const roomOrders = orders.filter(o => o.room === bill.room);
                    const pendingOrders = roomOrders.filter(o => o.status === 'NEW' || o.status === 'PREPARING');
                    return (
                      <div 
                        key={bill.room}
                        onClick={() => {
                          setSelectedRoom(bill.room);
                          setActiveSection('billing');
                        }}
                        style={{
                          background: bill.status === 'OPEN' ? `${C.brass}05` : C.sand,
                          border: `1.5px solid ${bill.status === 'OPEN' ? C.brass : C.border}`,
                          borderRadius: 18,
                          padding: 16,
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.03)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{locationLabel} {bill.room}</span>
                          <span style={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            background: bill.status === 'OPEN' ? C.brass : C.textMuted 
                          }}></span>
                        </div>
                        <div style={{ fontSize: 12, color: C.textSub, marginTop: 8, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {bill.status === 'OPEN' ? bill.guestName : 'Vacant / Ready'}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                          {pendingOrders.length > 0 && (
                            <span style={{ background: C.warningLight, color: C.warning, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>
                              ⏳ {pendingOrders.length} Order
                            </span>
                          )}
                          <span style={{ 
                            background: bill.status === 'OPEN' ? `${C.emerald}10` : C.borderLight, 
                            color: bill.status === 'OPEN' ? C.emerald : C.textSub, 
                            fontSize: 10, 
                            fontWeight: 700, 
                            padding: '2px 6px', 
                            borderRadius: 6 
                          }}>
                            {bill.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* RECENT ORDERS PANEL */}
              <Card style={{ border: `1px solid ${C.border}`, boxShadow: 'none', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 className="serif" style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Recent F&B Orders</h3>
                  <button onClick={() => setActiveSection('orders')} style={{ color: C.brass, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                    View Pipeline <ArrowRight size={14} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, overflowY: 'auto' }}>
                  {orders.slice(0, 4).map(order => {
                    let statusBg = C.borderLight;
                    let statusColor = C.textSub;
                    if (order.status === 'NEW') { statusBg = C.warningLight; statusColor = C.warning; }
                    else if (order.status === 'PREPARING') { statusBg = `${C.info}15`; statusColor = C.info; }
                    else if (order.status === 'DELIVERED') { statusBg = `${C.emerald}10`; statusColor = C.emerald; }

                    return (
                      <div key={order.id} style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', borderBottom: `1px solid ${C.borderLight}`, paddingBottom: 14 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 800, fontSize: 14 }}>{order.token}</span>
                            <span style={{ fontSize: 12, color: C.textSub }}>· {locationLabel} {order.room}</span>
                          </div>
                          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4, maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {order.items.map(i => `${i.name} ×${i.qty}`).join(', ')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>₹{order.total}</div>
                          <span style={{ alignSelf: 'flex-end', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: statusBg, color: statusColor, textTransform: 'uppercase' }}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* BILLING & POS SECTION */}
        {activeSection === 'billing' && (
          <div className="animate-fade-in">
            {/* 3-COLUMN POS BILLING LAYOUT */}
            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 32, alignItems: 'start', minHeight: 'calc(100vh - 120px)' }}>
              
              {/* COLUMN 2: BILLS LIST */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: C.white, borderRadius: 24, padding: 20, border: `1px solid ${C.border}`, boxShadow: '0 8px 24px rgba(15,27,43,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="serif" style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>Bills</h2>
                  <button 
                    onClick={() => {
                      const nextRoom = prompt('Enter Room Number to Open:');
                      if (nextRoom) {
                        const check = roomBills.find(b => String(b.room) === String(nextRoom));
                        if (check) {
                          setRoomBills(roomBills.map(b => String(b.room) === String(nextRoom) ? { ...b, status: 'OPEN', billId: `bill_${Date.now()}` } : b));
                          setSelectedRoom(nextRoom);
                        } else {
                          const name = prompt('Guest Name:');
                          const checkIn = new Date().toISOString().split('T')[0];
                          setRoomBills([...roomBills, { room: nextRoom, billId: `bill_${Date.now()}`, guestName: name || 'Guest', checkIn, checkOut: '', roomCharge: 0, roomServiceCharges: [], status: 'OPEN' }]);
                          setSelectedRoom(nextRoom);
                        }
                      }
                    }} 
                    style={{ background: C.borderLight, color: C.text, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: C.textSub, fontSize: 13, fontWeight: 700, margin: '4px 0' }}>
                  <div style={{ cursor: 'pointer' }}>All rooms ▾</div>
                  <div style={{ cursor: 'pointer' }}>Today ▾</div>
                </div>

                {/* SCROLLABLE BILLS LIST */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 'calc(100vh - 270px)', overflowY: 'auto', paddingRight: 4 }}>
                  {roomBills
                    .filter(b => String(b.room).includes(billSearch) || (b.guestName && b.guestName.toLowerCase().includes(billSearch.toLowerCase())))
                    .map(bill => {
                      const isSelected = selectedRoom === bill.room;
                      const totals = calculateBillTotals(bill);
                      const checkInDate = bill.checkIn ? new Date(bill.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';
                      
                      return (
                        <div
                          key={bill.room}
                          onClick={() => setSelectedRoom(bill.room)}
                          style={{
                            background: isSelected ? `${C.emerald}02` : C.white,
                            border: `1.5px solid ${isSelected ? C.brass : C.border}`,
                            borderLeft: `4px solid ${isSelected ? C.brass : C.border}`,
                            borderRadius: 18,
                            padding: '16px 20px',
                            cursor: 'pointer',
                            boxShadow: isSelected ? '0 8px 24px rgba(15,27,43,0.06)' : 'none',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Room {bill.room}</span>
                              <span style={{ 
                                fontSize: 10, 
                                fontWeight: 800, 
                                padding: '2px 8px', 
                                borderRadius: 8,
                                background: bill.status === 'OPEN' ? '#FEF3C7' : C.borderLight,
                                color: bill.status === 'OPEN' ? '#D97706' : C.textSub
                              }}>{bill.status === 'OPEN' ? 'Active' : 'Closed'}</span>
                            </div>
                            <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>₹{totals.grandTotal.toFixed(0)}</span>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13, color: C.textSub }}>
                            <span>{bill.guestName || 'Vacant'}</span>
                            <span style={{ fontSize: 12, color: C.textMuted }}>{checkInDate}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* SEARCH BAR AT BOTTOM */}
                <div style={{ position: 'relative', marginTop: 4 }}>
                  <Search size={16} color={C.textMuted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    placeholder="Search room..." 
                    value={billSearch} 
                    onChange={e => setBillSearch(e.target.value)} 
                    style={{ width: '100%', padding: '12px 14px 12px 38px', borderRadius: 14, border: `1.5px solid ${C.border}`, fontSize: 13, background: C.sand, color: C.text }}
                  />
                </div>
              </div>

              {/* COLUMN 3: BILL DETAILS */}
              <div style={{ flex: 1, background: C.white, borderRadius: 24, padding: 24, border: `1px solid ${C.border}`, boxShadow: '0 8px 24px rgba(15,27,43,0.03)', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {activeBill ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 className="serif" style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>Room {activeBill.room} Folio</h2>
                      <span style={{ 
                        fontSize: 12, 
                        fontWeight: 800, 
                        padding: '6px 16px', 
                        borderRadius: 12,
                        background: activeBill.status === 'OPEN' ? '#FEF3C7' : C.borderLight,
                        color: activeBill.status === 'OPEN' ? '#D97706' : C.textSub
                      }}>{activeBill.status === 'OPEN' ? 'Active' : 'Closed'}</span>
                    </div>

                    {/* DETAILS GRID */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '16px 0', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
                      <div>
                        <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Room</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginTop: 4 }}>{activeBill.room}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Check In</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginTop: 4 }}>{activeBill.checkIn || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Customer</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeBill.guestName || 'Vacant'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Check Out</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginTop: 4 }}>{activeBill.checkOut || 'Active'}</div>
                      </div>
                    </div>

                    {/* ITEMISED CHARGES */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text }}>Itemised Charges</h4>
                        {activeBill.status === 'OPEN' && (
                          <button 
                            onClick={() => setShowAddChargeModal(true)}
                            style={{ background: C.borderLight, color: C.text, border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >
                            + Link Order
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 'calc(100vh - 490px)', overflowY: 'auto', paddingRight: 4 }}>
                        {isHotel && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: C.sand, borderRadius: 16 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E6FBFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏨</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 750, fontSize: 14 }}>Room Accommodation</div>
                              <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>Daily stay room charges</div>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: 14 }}>₹{activeTotals.roomTotal.toFixed(0)}</div>
                          </div>
                        )}

                        {!activeBill.roomServiceCharges || activeBill.roomServiceCharges.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '32px 0', color: C.textSub, border: `1px dashed ${C.border}`, borderRadius: 16 }}>
                            <AlertCircle size={32} color={C.border} style={{ margin: '0 auto 8px' }} />
                            <div style={{ fontWeight: 700, fontSize: 13 }}>No Food & Beverage Charges Linked</div>
                          </div>
                        ) : (
                          activeBill.roomServiceCharges.map((charge, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: C.sand, borderRadius: 16 }}>
                              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFF7E6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🍔</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 750, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span>Order #{charge.orderId}</span>
                                  <span style={{ fontSize: 10, color: C.textMuted }}>{charge.time}</span>
                                </div>
                                <div style={{ fontSize: 11, color: C.textSub, marginTop: 2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 300 }}>{charge.desc}</div>
                              </div>
                              <div style={{ fontWeight: 800, fontSize: 14, marginRight: 8 }}>₹{charge.amount.toFixed(0)}</div>
                              {activeBill.status === 'OPEN' && (
                                <button 
                                  onClick={() => {
                                    setRoomBills(roomBills.map(b => 
                                      b.room === selectedRoom 
                                        ? { ...b, roomServiceCharges: b.roomServiceCharges.filter((_, i) => i !== idx) }
                                        : b
                                    ));
                                  }}
                                  style={{ color: C.danger, padding: 4, cursor: 'pointer' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* TOTALS & BILL LEDGER */}
                    <div style={{ background: C.sand, borderRadius: 20, padding: 20, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.textSub }}>
                        <span>Room Charges Subtotal</span>
                        <span>₹{activeTotals.roomTotal.toFixed(0)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.textSub }}>
                        <span>Room Dining Subtotal</span>
                        <span>₹{activeTotals.serviceTotal.toFixed(0)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.textMuted }}>
                        <span>Taxes (12% Accommodation + 15% F&B)</span>
                        <span>₹{(activeTotals.roomTax + activeTotals.serviceTax).toFixed(0)}</span>
                      </div>
                      
                      <div style={{ borderTop: `1.5px dashed ${C.border}`, margin: '8px 0' }}></div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 800, fontSize: 14, color: C.text }}>Grand Total</span>
                        </div>
                        <span style={{ fontWeight: 900, fontSize: 24, color: C.emerald }}>₹{activeTotals.grandTotal.toFixed(0)}</span>
                      </div>
                    </div>

                    {/* ACTIONS BAR */}
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button 
                        onClick={() => setShowPrintModal(true)} 
                        style={{ 
                          padding: '16px', 
                          borderRadius: 16, 
                          background: 'none',
                          border: `1.5px solid ${C.border}`, 
                          color: C.text, 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center', 
                          cursor: 'pointer'
                        }}
                      >
                        <Printer size={20} />
                      </button>
                      <button 
                        onClick={toggleBillStatus} 
                        style={{ 
                          flex: 1,
                          padding: '16px', 
                          borderRadius: 16, 
                          background: activeBill.status === 'OPEN' ? '#FCD34D' : C.borderLight, 
                          color: activeBill.status === 'OPEN' ? '#1E293B' : C.text, 
                          border: 'none',
                          fontWeight: 800,
                          fontSize: 15,
                          cursor: 'pointer',
                          boxShadow: activeBill.status === 'OPEN' ? '0 4px 12px rgba(252, 211, 77, 0.2)' : 'none'
                        }}
                      >
                        {activeBill.status === 'OPEN' ? `Charge Customer & Check-out ₹${activeTotals.grandTotal.toFixed(0)}` : 'Reopen Bill Folio'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '64px 0', textAlign: 'center', color: C.textMuted }}>
                    <AlertCircle size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                    <h3 style={{ margin: 0 }}>Select a bill from the side to view ledger</h3>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LIVE ORDERS PIPELINE BOARD */}
        {activeSection === 'orders' && (
          <div className="animate-fade-up">
            <div style={{ marginBottom: 28 }}>
              <h2 className="serif" style={{ fontSize: 32, fontWeight: 800, color: C.text, margin: 0 }}>Order Dispatch Pipeline</h2>
              <p style={{ color: C.textSub, fontSize: 14, marginTop: 6 }}>Drag or tap statuses to progress room/table delivery requests.</p>
            </div>

            {/* COLUMNS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              {[
                { title: 'New Requests', status: 'NEW', color: C.warning, badgeColor: C.warningLight },
                { title: 'In Kitchen', status: 'PREPARING', color: C.info, badgeColor: C.infoLight },
                { title: 'On the Way', status: 'ON_THE_WAY', color: '#8B5CF6', badgeColor: '#F5F3FF' },
                { title: 'Delivered', status: 'DELIVERED', color: C.emerald, badgeColor: `${C.emerald}12` }
              ].map(column => {
                const columnOrders = orders.filter(o => o.status === column.status && o.type === 'FOOD');
                return (
                  <div key={column.status} style={{ background: 'rgba(255,255,255,0.4)', borderRadius: 24, padding: 18, border: `1.5px solid ${C.border}`, display: 'flex', flexDirection: 'column', minHeight: '65vh' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h4 style={{ fontWeight: 800, fontSize: 14, color: C.text, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>{column.title}</h4>
                      <span style={{ background: column.badgeColor, color: column.color, fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 8 }}>{columnOrders.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1 }}>
                      {columnOrders.length === 0 ? (
                        <div style={{ border: `1px dashed ${C.border}`, borderRadius: 16, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, fontSize: 12, fontWeight: 500 }}>
                          No Orders
                        </div>
                      ) : (
                        columnOrders.map(order => (
                          <div 
                            key={order.id}
                            style={{
                              background: C.white,
                              border: `1px solid ${C.border}`,
                              borderRadius: 18,
                              padding: 16,
                              boxShadow: '0 4px 12px rgba(7,20,40,0.02)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <span style={{ fontWeight: 800, fontSize: 14 }}>{order.token}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: C.brass, background: C.brassLight, padding: '2px 6px', borderRadius: 4 }}>
                                {locationLabel} {order.room}
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderBottom: `1px solid ${C.borderLight}`, paddingBottom: 10, marginBottom: 12 }}>
                              {order.items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyItems: 'space-between', fontSize: 12.5, color: C.textSub }}>
                                  <span style={{ flex: 1 }}>{item.name}</span>
                                  <span style={{ fontWeight: 700 }}>×{item.qty}</span>
                                </div>
                              ))}
                              {order.note && (
                                <div style={{ fontSize: 11, color: C.danger, background: C.dangerLight, padding: '4px 8px', borderRadius: 6, marginTop: 4 }}>
                                  💬 {order.note}
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 800, fontSize: 14, color: C.emerald }}>₹{order.total}</span>
                              
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button 
                                  onClick={() => cancelOrder(order.id)}
                                  title="Cancel/Refund Order"
                                  style={{ background: C.dangerLight, border: 'none', color: C.danger, padding: 8, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                  <Trash2 size={13} />
                                </button>
                                {order.status === 'NEW' && (
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                                    style={{ background: C.emerald, border: 'none', color: C.white, fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}
                                  >
                                    Accept
                                  </button>
                                )}
                                {order.status === 'PREPARING' && (
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'ON_THE_WAY')}
                                    style={{ background: C.emerald, border: 'none', color: C.white, fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}
                                  >
                                    Ship
                                  </button>
                                )}
                                {order.status === 'ON_THE_WAY' && (
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                                    style={{ background: C.emerald, border: 'none', color: C.white, fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}
                                  >
                                    Deliver
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HOSPITALITY REQUESTS PIPELINE BOARD */}
        {activeSection === 'services' && (
          <div className="animate-fade-up">
            <div style={{ marginBottom: 28 }}>
              <h2 className="serif" style={{ fontSize: 32, fontWeight: 800, color: C.text, margin: 0 }}>Hospitality Service Board</h2>
              <p style={{ color: C.textSub, fontSize: 14, marginTop: 6 }}>Process and dispatch non-food housekeeping, cleanings, and room utilities requests.</p>
            </div>

            {/* COLUMNS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[
                { title: 'New Requests', status: 'NEW', color: C.warning, badgeColor: C.warningLight },
                { title: 'In Progress', status: 'PREPARING', color: C.info, badgeColor: C.infoLight },
                { title: 'Completed', status: 'DELIVERED', color: C.emerald, badgeColor: `${C.emerald}12` }
              ].map(column => {
                const columnOrders = orders.filter(o => o.status === column.status && o.type === 'SERVICE');
                return (
                  <div key={column.status} style={{ background: 'rgba(255,255,255,0.4)', borderRadius: 24, padding: 18, border: `1.5px solid ${C.border}`, display: 'flex', flexDirection: 'column', minHeight: '65vh' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h4 style={{ fontWeight: 800, fontSize: 14, color: C.text, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>{column.title}</h4>
                      <span style={{ background: column.badgeColor, color: column.color, fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 8 }}>{columnOrders.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1 }}>
                      {columnOrders.length === 0 ? (
                        <div style={{ border: `1px dashed ${C.border}`, borderRadius: 16, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, fontSize: 12, fontWeight: 500 }}>
                          No Requests
                        </div>
                      ) : (
                        columnOrders.map(order => (
                          <div 
                            key={order.id}
                            style={{
                              background: C.white,
                              border: `1px solid ${C.border}`,
                              borderRadius: 18,
                              padding: 16,
                              boxShadow: '0 4px 12px rgba(7,20,40,0.02)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <span style={{ fontWeight: 850, fontSize: 14, color: ACCENT_BLUE }}>Room {order.room}</span>
                              <span style={{ fontSize: 11, color: C.textSub }}>{order.minutesAgo || 0}m ago</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderBottom: `1px solid ${C.borderLight}`, paddingBottom: 10, marginBottom: 12 }}>
                              {order.items.map((item, idx) => (
                                <div key={idx} style={{ fontWeight: 700, fontSize: 13, color: C.text }}>
                                  🛠️ {item.name}
                                </div>
                              ))}
                              {order.note && (
                                <div style={{ fontSize: 11.5, color: '#92400E', background: '#FEF3C7', padding: '6px 10px', borderRadius: 8, marginTop: 4 }}>
                                  💬 {order.note}
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 700 }}>Service Req</span>
                              
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button 
                                  onClick={() => cancelOrder(order.id)}
                                  title="Cancel Request"
                                  style={{ background: C.dangerLight, border: 'none', color: C.danger, padding: 8, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                  <Trash2 size={13} />
                                </button>
                                {order.status === 'NEW' && (
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                                    style={{ background: C.emerald, border: 'none', color: C.white, fontSize: 11, fontWeight: 750, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}
                                  >
                                    Accept
                                  </button>
                                )}
                                {order.status === 'PREPARING' && (
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                                    style={{ background: C.emerald, border: 'none', color: C.white, fontSize: 11, fontWeight: 750, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}
                                  >
                                    Complete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MENU EDITOR SECTION */}
        {activeSection === 'menu' && (
          <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Card style={{ border: `1px solid ${C.border}`, boxShadow: '0 20px 48px rgba(15,27,43,0.04)', borderRadius: 28, background: 'linear-gradient(180deg, #FFFFFF 0%, #FBFDFF 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
                <div style={{ maxWidth: 700 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: C.emeraldLight, color: C.brass, fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 14 }}>
                    Menu Management
                  </div>
                  <h2 className="serif" style={{ fontSize: 34, fontWeight: 800, color: C.text, margin: 0, letterSpacing: -0.8 }}>All Menu</h2>
                  <p style={{ color: C.textSub, fontSize: 14, marginTop: 8, maxWidth: 560, lineHeight: 1.6 }}>
                    Manage dish images, availability, categories, and pricing from one polished workspace.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddItemModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #FF7A3D 0%, #F97316 100%)',
                    color: C.white,
                    border: 'none',
                    borderRadius: 999,
                    padding: '14px 22px',
                    fontSize: 14,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    boxShadow: '0 14px 28px rgba(249,115,22,0.26)'
                  }}
                >
                  <Plus size={18} strokeWidth={2.5} /> Add Menu
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 24 }}>
                {menuStats.map(stat => (
                  <div key={stat.label} style={{ border: `1px solid ${C.border}`, borderRadius: 20, background: C.white, padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 }}>{stat.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginTop: 8 }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 14, alignItems: 'center', marginBottom: 18 }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }}><ClipboardList size={18} /></span>
                  <input
                    type="text"
                    placeholder="Search menu items or recipe details"
                    value={menuSearch}
                    onChange={e => setMenuSearch(e.target.value)}
                    style={{ width: '100%', padding: '15px 18px 15px 50px', borderRadius: 18, border: `1.5px solid ${C.border}`, fontSize: 14, background: C.sand, color: C.text }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {['All', 'Breakfast', 'Starters', 'Mains', 'Desserts', 'Beverages'].map(category => {
                    const isActive = activeMenuCategory === category;
                    return (
                      <button
                        key={category}
                        onClick={() => setActiveMenuCategory(category)}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 999,
                          background: isActive ? C.text : C.white,
                          color: isActive ? C.white : C.textSub,
                          border: `1.5px solid ${isActive ? C.text : C.border}`,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))', gap: 18 }}>
              {filteredMenuItems.map(item => (
                <Card key={item.id} style={{ padding: 0, overflow: 'hidden', border: `1px solid ${C.border}`, boxShadow: '0 12px 24px rgba(15,27,43,0.05)', borderRadius: 22, display: 'flex', flexDirection: 'column', background: C.white }}>
                  <div style={{ position: 'relative', minHeight: 146, maxHeight: 146, background: C.emeraldLight }}>
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(7,20,40,0.72)', backdropFilter: 'blur(8px)', color: C.white, fontSize: 10, fontWeight: 800, padding: '5px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {item.category}
                      </span>
                      <span style={{ background: item.available ? 'rgba(16,185,129,0.9)' : 'rgba(148,163,184,0.95)', color: C.white, fontSize: 10, fontWeight: 800, padding: '5px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {item.available ? 'Available' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <h4 style={{ fontWeight: 800, fontSize: 16, margin: 0, color: C.text, lineHeight: 1.2 }}>{item.name}</h4>
                        <VegDot isVeg={item.isVeg} />
                      </div>
                      <p style={{ fontSize: 12.5, color: C.textSub, margin: '6px 0 0 0', lineHeight: 1.45 }}>{item.desc}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 'auto' }}>
                      <div style={{ padding: '10px 12px', borderRadius: 14, background: C.borderLight }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>Item Type</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginTop: 4 }}>{item.isVeg ? 'Veg' : 'Non-Veg'}</div>
                      </div>
                      <div style={{ padding: '10px 12px', borderRadius: 14, background: C.borderLight }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>Pricing</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginTop: 4 }}>₹{item.price}</div>
                      </div>
                      <div style={{ padding: '10px 12px', borderRadius: 14, background: C.borderLight }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>Station</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {stationOptions.find(station => station.id === item.station_id)?.name || item.station_id || 'Indian Kitchen'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 2 }}>
                      <button
                        onClick={() => toggleItemAvailability(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 12px',
                          borderRadius: 999,
                          background: item.available ? 'rgba(34,197,94,0.10)' : 'rgba(148,163,184,0.12)',
                          color: item.available ? '#15803D' : C.textMuted,
                          border: 'none',
                          fontSize: 12.5,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ width: 28, height: 16, borderRadius: 999, background: item.available ? '#16A34A' : '#CBD5E1', padding: 2, display: 'flex', alignItems: 'center' }}>
                          <div style={{ width: 14, height: 14, borderRadius: '50%', background: C.white, transform: `translateX(${item.available ? 12 : 0}px)`, transition: 'transform 0.2s ease' }} />
                        </div>
                        {item.available ? 'Available' : 'Disabled'}
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        style={{ background: C.dangerLight, border: 'none', color: C.danger, padding: '9px 10px', borderRadius: 12, cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredMenuItems.length === 0 && (
              <Card style={{ textAlign: 'center', padding: '52px 24px', border: `1px dashed ${C.border}`, background: C.white, borderRadius: 24 }}>
                <h3 className="serif" style={{ fontSize: 22, margin: 0, color: C.text }}>No menu items found</h3>
                <p style={{ color: C.textSub, fontSize: 14, marginTop: 8 }}>Try a different search or category, or add a new dish.</p>
              </Card>
            )}
          </div>
        )}

        {/* REPORTS & ANALYTICS SECTION */}
        {activeSection === 'reports' && (
          <div className="animate-fade-up">
            <div style={{ marginBottom: 28 }}>
              <h2 className="serif" style={{ fontSize: 32, fontWeight: 800, color: C.text, margin: 0 }}>Business Analytics & Sales</h2>
              <p style={{ color: C.textSub, fontSize: 14, marginTop: 6 }}>Understand product sales performance and kitchen prep timing statistics.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 32, marginBottom: 32 }}>
              {/* REVENUE LINE CHART */}
              <Card style={{ border: `1px solid ${C.border}`, boxShadow: 'none' }}>
                <h3 className="serif" style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 6px 0' }}>F&B Sales Trend (₹)</h3>
                <p style={{ color: C.textSub, fontSize: 13, margin: '0 0 24px 0' }}>Cumulative revenue tracking based on the chronological order sequence.</p>

                {/* SVG Line Chart */}
                {orders.filter(o => o.status !== 'CANCELLED').length === 0 ? (
                  <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, fontSize: 14 }}>
                    No sales data available.
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <svg viewBox="0 0 500 240" style={{ width: '100%', height: 260 }}>
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.brass} stopOpacity="0.4" />
                          <stop offset="100%" stopColor={C.brass} stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      <line x1="40" y1="200" x2="480" y2="200" stroke={C.border} strokeWidth="1.5" />
                      <line x1="40" y1="140" x2="480" y2="140" stroke={C.border} strokeWidth="1" strokeDasharray="4" />
                      <line x1="40" y1="80" x2="480" y2="80" stroke={C.border} strokeWidth="1" strokeDasharray="4" />
                      <line x1="40" y1="20" x2="480" y2="20" stroke={C.border} strokeWidth="1" strokeDasharray="4" />

                      {/* Cumulative calculation */}
                      {(() => {
                        const validOrders = orders.filter(o => o.status !== 'CANCELLED');
                        let cumulativeTotal = 0;
                        const dataPoints = validOrders.map((o, idx) => {
                          cumulativeTotal += o.total;
                          return { val: cumulativeTotal, idx };
                        });
                        const maxVal = Math.max(...dataPoints.map(d => d.val), 1000);
                        
                        // Map helper: x is idx, y is val mapped between ranges
                        const getCoords = (idx, val) => {
                          const x = 40 + (idx / Math.max(dataPoints.length - 1, 1)) * 440;
                          const y = 200 - (val / maxVal) * 170;
                          return { x, y };
                        };

                        const pointsString = dataPoints.map(d => {
                          const { x, y } = getCoords(d.idx, d.val);
                          return `${x},${y}`;
                        }).join(' ');

                        const areaPath = dataPoints.length > 0 
                          ? `M 40,200 ` + dataPoints.map(d => {
                              const { x, y } = getCoords(d.idx, d.val);
                              return `L ${x},${y}`;
                            }).join(' ') + ` L ${getCoords(dataPoints.length - 1, dataPoints[dataPoints.length - 1].val).x},200 Z`
                          : '';

                        return (
                          <>
                            {/* Area fill */}
                            {areaPath && <path d={areaPath} fill="url(#chartGrad)" />}
                            
                            {/* Trend Line */}
                            {pointsString && <polyline points={pointsString} fill="none" stroke={C.brass} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}
                            
                            {/* Dots */}
                            {dataPoints.map((d, idx) => {
                              const { x, y } = getCoords(d.idx, d.val);
                              return (
                                <circle 
                                  key={idx} 
                                  cx={x} 
                                  cy={y} 
                                  r="5" 
                                  fill={C.emerald} 
                                  stroke={C.white} 
                                  strokeWidth="2" 
                                />
                              );
                            })}

                            {/* X/Y Axes texts */}
                            <text x="35" y="218" fill={C.textMuted} fontSize="10" textAnchor="middle">0</text>
                            <text x="480" y="218" fill={C.textMuted} fontSize="10" textAnchor="middle">{dataPoints.length}</text>
                            <text x="25" y="25" fill={C.textMuted} fontSize="9" textAnchor="end">₹{maxVal.toLocaleString()}</text>
                            <text x="25" y="110" fill={C.textMuted} fontSize="9" textAnchor="end">₹{Math.round(maxVal/2).toLocaleString()}</text>
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                )}
              </Card>

              {/* SALES BY CATEGORY BAR CHART */}
              <Card style={{ border: `1px solid ${C.border}`, boxShadow: 'none' }}>
                <h3 className="serif" style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 6px 0' }}>Sales by Category</h3>
                <p style={{ color: C.textSub, fontSize: 13, margin: '0 0 24px 0' }}>Distribution of food revenue across dish categories.</p>

                {salesByCategory.length === 0 ? (
                  <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, fontSize: 14 }}>
                    No product categories sold yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18, height: 260, justifyContent: 'center' }}>
                    {(() => {
                      const maxVal = Math.max(...salesByCategory.map(s => s.value), 100);
                      return salesByCategory.map((item, idx) => {
                        const pct = (item.value / maxVal) * 100;
                        return (
                          <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                              <span>{item.category}</span>
                              <span style={{ color: C.emerald }}>₹{item.value.toLocaleString()}</span>
                            </div>
                            <div style={{ width: '100%', height: 10, background: C.borderLight, borderRadius: 5, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: C.brass, borderRadius: 5 }}></div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </Card>
            </div>

            {/* PERFORMANCE METRICS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
              <Card style={{ border: `1px solid ${C.border}`, boxShadow: 'none', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: '#FFFbeb', padding: 14, borderRadius: '50%' }}>
                  <Award size={24} color="#D97706" />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>Top Seller Item</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 4 }}>
                    {topDishes[0] ? topDishes[0].name : 'N/A'}
                  </div>
                  <div style={{ fontSize: 11, color: C.textSub, marginTop: 4 }}>
                    {topDishes[0] ? `${topDishes[0].count} plates ordered` : 'No orders logged'}
                  </div>
                </div>
              </Card>

              <Card style={{ border: `1px solid ${C.border}`, boxShadow: 'none', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: '#ecfdf5', padding: 14, borderRadius: '50%' }}>
                  <Star size={24} color="#10B981" />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>Avg Food Rating</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 4 }}>
                    {feedback.length > 0 ? (feedback.reduce((sum, f) => sum + f.food_rating, 0) / feedback.length).toFixed(1) : 'N/A'} / 5.0
                  </div>
                  <div style={{ fontSize: 11, color: C.textSub, marginTop: 4 }}>
                    From {feedback.length} guest submissions
                  </div>
                </div>
              </Card>

              <Card style={{ border: `1px solid ${C.border}`, boxShadow: 'none', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: '#EFF6FF', padding: 14, borderRadius: '50%' }}>
                  <Clock size={24} color={ACCENT_BLUE} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>Avg Service Rating</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 4 }}>
                    {feedback.length > 0 ? (feedback.reduce((sum, f) => sum + f.service_rating, 0) / feedback.length).toFixed(1) : 'N/A'} / 5.0
                  </div>
                  <div style={{ fontSize: 11, color: C.textSub, marginTop: 4 }}>
                    Evaluates service delivery speed
                  </div>
                </div>
              </Card>
            </div>

            {/* FEEDBACK & FUTURE DISH SUGGESTIONS LIST */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
              <Card style={{ border: `1px solid ${C.border}`, boxShadow: 'none' }}>
                <h3 className="serif" style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 10px 0' }}>Future Dish Suggestions</h3>
                <p style={{ color: C.textSub, fontSize: 13, margin: '0 0 20px 0' }}>Dishes and menu items requested by guests in checkout feedback.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto' }}>
                  {feedback.filter(f => f.suggestion && f.suggestion.trim() !== '').length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 32, color: C.textMuted, fontSize: 13 }}>
                      No dish suggestions logged yet.
                    </div>
                  ) : (
                    feedback.filter(f => f.suggestion && f.suggestion.trim() !== '').map((f, idx) => (
                      <div key={idx} style={{ padding: 14, background: C.sand, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 800 }}>Room {f.room}</span>
                          <span style={{ fontSize: 11, color: C.textMuted }}>{new Date(f.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div style={{ fontSize: 13, color: C.text, fontStyle: 'italic' }}>
                          "{f.suggestion}"
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* SYSCON INTEGRATION POSTING LOGS */}
              <Card style={{ border: `1px solid ${C.border}`, boxShadow: 'none' }}>
                <h3 className="serif" style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 10px 0' }}>Syscon Folio Post Audit</h3>
                <p style={{ color: C.textSub, fontSize: 13, margin: '0 0 20px 0' }}>Live charge postings to Syscon HMS folios upon order deliveries.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto' }}>
                  {orders.filter(o => o.status === 'DELIVERED').length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 32, color: C.textMuted, fontSize: 13 }}>
                      No delivered orders to post yet.
                    </div>
                  ) : (
                    orders.filter(o => o.status === 'DELIVERED').map((order, idx) => (
                      <div key={idx} style={{ padding: 14, background: C.sand, borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800 }}>Order {order.token} (Room {order.room})</div>
                          <div style={{ fontSize: 11, color: C.textSub, marginTop: 4 }}>Total: ₹{order.total}</div>
                        </div>
                        <div>
                          {order.syscon_posted === 1 ? (
                            <span style={{ fontSize: 11, background: '#D1FAE5', color: '#059669', padding: '4px 10px', borderRadius: 8, fontWeight: 750 }}>
                              SUCCESS POSTED
                            </span>
                          ) : order.syscon_posted === -1 ? (
                            <span style={{ fontSize: 11, background: '#FEE2E2', color: '#EF4444', padding: '4px 10px', borderRadius: 8, fontWeight: 750 }}>
                              SYNC TIMEOUT
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, background: '#FEF3C7', color: '#D97706', padding: '4px 10px', borderRadius: 8, fontWeight: 750 }}>
                              PENDING SYNC
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* SETTINGS SECTION */}
        {activeSection === 'settings' && (
          <div className="animate-fade-up">
            <div style={{ marginBottom: 28 }}>
              <h2 className="serif" style={{ fontSize: 32, fontWeight: 800, color: C.text, margin: 0 }}>System Settings</h2>
              <p style={{ color: C.textSub, fontSize: 14, marginTop: 6 }}>Configure application behavior, security PINs, and tax rates.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600 }}>
              <Card style={{ border: `1px solid ${C.border}`, boxShadow: 'none' }}>
                <h3 className="serif" style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 20px 0' }}>Security PINs</h3>
                
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 6, textTransform: 'uppercase' }}>Admin Console PIN</label>
                  <input 
                    type="text" 
                    value={configObj?.adminPin || ''}
                    onChange={e => setConfig({ adminPin: e.target.value })}
                    style={{ width: '100%', padding: 12, borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14 }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 6, textTransform: 'uppercase' }}>Kitchen Display PIN</label>
                  <input 
                    type="text" 
                    value={configObj?.kitchenPin || ''}
                    onChange={e => setConfig({ kitchenPin: e.target.value })}
                    style={{ width: '100%', padding: 12, borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14 }}
                  />
                </div>
              </Card>

              <Card style={{ border: `1px solid ${C.border}`, boxShadow: 'none' }}>
                <h3 className="serif" style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 20px 0' }}>Tax & Service Configuration</h3>
                
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 6, textTransform: 'uppercase' }}>F&B Service Charge (%)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={configObj?.serviceCharge || 10}
                    onChange={e => setConfig({ serviceCharge: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: 12, borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14 }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 6, textTransform: 'uppercase' }}>CGST (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={configObj?.cgst || 2.5}
                      onChange={e => setConfig({ cgst: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: 12, borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 6, textTransform: 'uppercase' }}>SGST (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={configObj?.sgst || 2.5}
                      onChange={e => setConfig({ sgst: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: 12, borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14 }}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* TAX INVOICE PRINT VIEW COMPONENT (Only shown in DOM when print modal is open) */}
      {showPrintModal && activeBill && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7,20,40,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(6px)' }}>
          {/* Close button for UI */}
          <button 
            onClick={() => setShowPrintModal(false)} 
            className="no-print" 
            style={{ 
              position: 'absolute', 
              top: 24, 
              right: 24, 
              color: C.white, 
              background: 'rgba(255,255,255,0.1)', 
              border: 'none', 
              padding: 10, 
              borderRadius: '50%',
              cursor: 'pointer' 
            }}
          >
            <X size={26} />
          </button>
          
          <div 
            className="print-section animate-pop" 
            style={{ 
              background: C.white, 
              width: '100%', 
              maxWidth: 640, 
              padding: 48, 
              borderRadius: 24, 
              color: C.text, 
              boxShadow: '0 32px 80px rgba(0,0,0,0.25)', 
              fontFamily: '"Plus Jakarta Sans", sans-serif'
            }}
          >
             {/* Invoice Header */}
             <div style={{ textAlign: 'center', borderBottom: `2.5px solid ${C.text}`, paddingBottom: 24, marginBottom: 32 }}>
                <h2 className="serif" style={{ fontSize: 30, fontWeight: 800, margin: 0, color: C.emerald }}>{config?.hotelName?.toUpperCase()}</h2>
                <p style={{ fontSize: 13, color: C.textSub, marginTop: 6, fontWeight: 500 }}>{config?.address}</p>
                <div style={{ marginTop: 16, display: 'inline-block', border: `1.5px solid ${C.text}`, padding: '4px 18px', fontWeight: 800, fontSize: 11, letterSpacing: 2, borderRadius: 4 }}>TAX INVOICE</div>
             </div>

             {/* Guest and Date Details */}
             <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16, marginBottom: 32, fontSize: 13.5 }}>
               <div>
                 <div style={{ color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', fontSize: 10 }}>Guest Name</div>
                 <div style={{ fontWeight: 800, fontSize: 16, marginTop: 4 }}>{activeBill.guestName}</div>
               </div>
               <div style={{ textAlign: 'right' }}>
                 <div style={{ color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', fontSize: 10 }}>{locationLabel} / Check Dates</div>
                 <div style={{ fontWeight: 800, fontSize: 16, marginTop: 4 }}>{locationLabel} {activeBill.room} · {activeBill.checkIn} to {activeBill.checkOut}</div>
               </div>
             </div>

             {/* Ledger Itemization */}
             <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32, fontSize: 13.5 }}>
               <thead>
                 <tr style={{ borderBottom: `1.5px solid ${C.text}` }}>
                   <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: 800, textTransform: 'uppercase', fontSize: 11, color: C.textSub }}>Ledger Item Description</th>
                   <th style={{ textAlign: 'right', padding: '12px 0', fontWeight: 800, textTransform: 'uppercase', fontSize: 11, color: C.textSub }}>Amount (₹)</th>
                 </tr>
               </thead>
               <tbody>
                 {isHotel && (
                   <tr style={{ borderBottom: `1px dashed ${C.border}` }}>
                     <td style={{ padding: '14px 0', fontWeight: 700 }}>Room Accommodation Charge</td>
                     <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: 800 }}>{activeTotals.roomTotal.toFixed(2)}</td>
                   </tr>
                 )}
                 {activeBill.roomServiceCharges && activeBill.roomServiceCharges.map((c, i) => {
                     const totalTaxAndServiceRate = ((configObj?.cgst || 2.5) + (configObj?.sgst || 2.5) + (configObj?.serviceCharge || 10)) / 100;
                     const baseAmount = c.amount / (1 + totalTaxAndServiceRate);
                     return (
                       <tr key={i} style={{ borderBottom: `1px dashed ${C.border}` }}>
                         <td style={{ padding: '14px 0', color: C.textSub }}>Room dining charge (Order #{c.orderId})</td>
                         <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: 600 }}>{baseAmount.toFixed(2)}</td>
                       </tr>
                     );
                  })}
                 
                 {isHotel && (
                   <tr>
                     <td style={{ padding: '12px 0 6px', color: C.textMuted, fontSize: 12.5 }}>Room Accommodation Tax (12%)</td>
                     <td style={{ padding: '12px 0 6px', textAlign: 'right', color: C.textSub, fontSize: 12.5 }}>{activeTotals.roomTax.toFixed(2)}</td>
                   </tr>
                 )}
                 <tr>
                   <td style={{ padding: '6px 0 12px', color: C.textMuted, fontSize: 12.5, borderBottom: `1.5px solid ${C.text}` }}>Food & Beverage SGST+CGST (15%)</td>
                   <td style={{ padding: '6px 0 12px', textAlign: 'right', color: C.textSub, fontSize: 12.5, borderBottom: `1.5px solid ${C.text}` }}>{activeTotals.serviceTax.toFixed(2)}</td>
                 </tr>

                 <tr>
                   <td style={{ padding: '20px 0', fontWeight: 800, fontSize: 16 }}>GRAND NET TOTAL</td>
                   <td style={{ padding: '20px 0', textAlign: 'right', fontWeight: 900, fontSize: 22, color: C.emerald }}>₹{activeTotals.grandTotal.toFixed(0)}</td>
                 </tr>
               </tbody>
             </table>

             {/* Footer Sign-off */}
             <div style={{ textAlign: 'center', color: C.textMuted, fontSize: 12.5, fontStyle: 'italic', marginTop: 40, borderTop: `1px solid ${C.borderLight}`, paddingTop: 24 }}>
               Thank you for dining with {config?.shortName}! 🙏<br/>
               <span style={{ fontSize: 10, textTransform: 'uppercase', fontStyle: 'normal', letterSpacing: 0.5, marginTop: 4, display: 'inline-block' }}>Have a pleasant & safe journey</span>
             </div>

             <div className="no-print" style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={() => window.print()} 
                  style={{ 
                    background: C.emerald, 
                    color: C.white, 
                    border: 'none',
                    padding: '14px 40px', 
                    borderRadius: 14, 
                    fontWeight: 700, 
                    fontSize: 15,
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(7,20,40,0.1)'
                  }}
                >
                  Print Document
                </button>
             </div>
          </div>
        </div>
      )}

      {/* ADD CHARGE MODAL */}
      {showAddChargeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7,20,40,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="animate-pop animate-pop-in" style={{ background: C.white, borderRadius: 24, padding: 32, width: 520, maxWidth: '90%', boxShadow: '0 24px 64px rgba(7,20,40,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="serif" style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Link F&B Order to {locationLabel} {selectedRoom}</h3>
              <button onClick={() => setShowAddChargeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color={C.textMuted} /></button>
            </div>
            
            <div style={{ fontSize: 13, color: C.textSub, marginBottom: 20 }}>Select a completed order to link onto this bill folio.</div>
            
            <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {unbilledDeliveredOrders.length === 0 ? (
                <div style={{ padding: 36, background: C.sand, borderRadius: 18, textAlign: 'center', color: C.textMuted }}>
                  <ShieldCheck size={32} color={C.textMuted} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 700, fontSize: 14 }}>All Orders Already Billed</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>No unbilled delivered orders exist for {locationLabel} {selectedRoom}.</div>
                </div>
              ) : (
                unbilledDeliveredOrders.map(o => (
                  <div key={o.id} style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>Order {o.token}</div>
                      <div style={{ fontSize: 12, color: C.textSub, marginTop: 4, maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {o.items.map(i => `${i.name}`).join(', ')}
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{o.minutesAgo} min ago</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ fontWeight: 800, color: C.emerald, fontSize: 15 }}>₹{o.total}</div>
                      <button 
                        onClick={() => attachOrderToBill(o)}
                        style={{ background: C.emerald, color: C.white, border: 'none', padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD DISH DRAWER */}
      {showAddItemModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7,20,40,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(4px)' }}>
          <div className="animate-fade-up" style={{ background: C.white, padding: '40px 32px', width: 480, height: '100%', boxShadow: '-8px 0 32px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 className="serif" style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Add New Dish</h3>
              <button onClick={() => setShowAddItemModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color={C.textMuted} /></button>
            </div>

            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 6, textTransform: 'uppercase' }}>Item Name</label>
                <input required autoFocus value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14 }} placeholder="e.g. Gourmet Club Sandwich" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 6, textTransform: 'uppercase' }}>Description / Recipe Details</label>
                <input value={newItem.desc} onChange={e => setNewItem({...newItem, desc: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14 }} placeholder="e.g. Double layered bread with smoked bacon, eggs, poultry..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 6, textTransform: 'uppercase' }}>Price (₹)</label>
                  <input required type="number" min="0" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14 }} placeholder="0" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 6, textTransform: 'uppercase' }}>Category</label>
                  <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14, background: C.white }}>
                    {['Breakfast', 'Starters', 'Mains', 'Desserts', 'Beverages'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 6, textTransform: 'uppercase' }}>Kitchen / Service Station</label>
                <select value={newItem.station_id} onChange={e => setNewItem({...newItem, station_id: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14, background: C.white }}>
                  {stationOptions.map(station => (
                    <option key={station.id} value={station.id}>{station.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 6, textTransform: 'uppercase' }}>Upload Food Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ width: '100%', padding: 12, borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 13, marginBottom: 12 }}
                />
                {newItem.image && (
                  <div style={{ height: 100, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}`, position: 'relative' }}>
                    <img src={newItem.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <input type="radio" checked={newItem.isVeg} onChange={() => setNewItem({...newItem, isVeg: true})} /> Veg Dot
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <input type="radio" checked={!newItem.isVeg} onChange={() => setNewItem({...newItem, isVeg: false})} /> Non-Veg Dot
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowAddItemModal(false)} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'none', color: C.textSub, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: C.emerald, color: C.white, border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Publish Dish</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

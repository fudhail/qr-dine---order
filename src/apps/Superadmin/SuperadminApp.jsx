import React, { useState, useEffect } from 'react';
import { 
  Shield, Plus, Edit, Trash2, ExternalLink, Activity, 
  Building2, Server, CheckCircle, AlertTriangle, HelpCircle, Save, X
} from 'lucide-react';
import { C } from '../../constants/theme';
import { Card } from '../../components/ui/Card';

export const SuperadminApp = ({ tenants, socket, navigateTo, socketConnected }) => {
  const [editingTenant, setEditingTenant] = useState(null);
  
  // Form State
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formWelcomeTagline, setFormWelcomeTagline] = useState('');
  const [formDeploymentMode, setFormDeploymentMode] = useState('AUTO');
  const [formDefaultRoom, setFormDefaultRoom] = useState('101');
  const [formDefaultTable, setFormDefaultTable] = useState('1');
  const [formStatus, setFormStatus] = useState('Active');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successToast, setSuccessToast] = useState(null);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const resetForm = () => {
    setFormId('');
    setFormName('');
    setFormShortName('');
    setFormAddress('');
    setFormWelcomeTagline('');
    setFormDeploymentMode('AUTO');
    setFormDefaultRoom('101');
    setFormDefaultTable('1');
    setFormStatus('Active');
    setEditingTenant(null);
  };

  const handleEdit = (tenant) => {
    setEditingTenant(tenant.id);
    setFormId(tenant.id);
    setFormName(tenant.name || '');
    setFormShortName(tenant.shortName || '');
    setFormAddress(tenant.address || '');
    setFormWelcomeTagline(tenant.welcomeTagline || '');
    setFormDeploymentMode(tenant.deploymentMode || 'AUTO');
    setFormDefaultRoom(tenant.defaultRoom || '101');
    setFormDefaultTable(tenant.defaultTable || '1');
    setFormStatus(tenant.status || 'Active');
    setIsFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formId.trim()) return;

    // Validate ID slug format
    const slugifiedId = formId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');

    const tenantConfig = {
      id: slugifiedId,
      name: formName.trim() || 'Unnamed Hotel',
      shortName: formShortName.trim() || 'Hotel',
      address: formAddress.trim() || 'No address specified',
      welcomeTagline: formWelcomeTagline.trim() || 'Premium Services',
      deploymentMode: formDeploymentMode,
      defaultRoom: formDefaultRoom.trim() || '101',
      defaultTable: formDefaultTable.trim() || '1',
      status: formStatus
    };

    socket.emit('save_tenant', tenantConfig);
    showToast(editingTenant ? 'Tenant updated successfully! ✨' : 'New tenant registered successfully! 🏢');
    setIsFormOpen(false);
    resetForm();
  };

  const handleDelete = (tenantId) => {
    if (tenantId === 'grand-vista') {
      alert('The core system tenant "grand-vista" cannot be deleted.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete the tenant "${tenantId}" and all its F&B orders, menu data, and POS billing history? This cannot be undone.`)) {
      socket.emit('delete_tenant', { tenantId });
      showToast(`Tenant "${tenantId}" removed from platform.`);
    }
  };

  return (
    <div style={{ background: '#0F172A', minHeight: '100vh', color: '#F8FAFC', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      
      {/* HEADER SECTION */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#1E293B', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: `${C.brass}20`, padding: 10, borderRadius: 12, border: `1px solid ${C.brass}40` }}>
            <Shield size={24} color={C.brass} />
          </div>
          <div>
            <h1 className="serif" style={{ fontSize: 20, color: '#FFFFFF', margin: 0, fontWeight: 700, letterSpacing: 0.5 }}>
              SaaS Multi-Tenant Superadmin
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#94A3B8' }}>Platform Management & Onboarding Suite</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Connection Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: socketConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '6px 12px', borderRadius: 99, border: `1.5px solid ${socketConnected ? '#10B981' : '#EF4444'}40` }}>
            <Activity size={12} className="animate-pulse" color={socketConnected ? '#10B981' : '#EF4444'} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: socketConnected ? '#34D399' : '#F87171', textTransform: 'uppercase' }}>
              {socketConnected ? 'Server Live' : 'Offline'}
            </span>
          </div>
          
          <button 
            onClick={() => navigateTo(null)}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#F8FAFC', padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            ← Leave Superadmin
          </button>
        </div>
      </header>

      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        
        {/* KPI WIDGETS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
          {[
            { title: 'Total Registered Tenants', value: tenants.length, desc: 'Active hotel properties onboarded', icon: Building2, color: C.brass },
            { title: 'Platform Subscription Status', value: 'Healthy', desc: '100% core microservices active', icon: Server, color: '#10B981' },
            { title: 'Connected Client Hubs', value: socketConnected ? tenants.length * 3 + 2 : 0, desc: 'KDS, POS and Guest socket relays', icon: Activity, color: '#3B82F6' },
            { title: 'Database Sync Engine', value: 'File JSON', desc: 'Auto-persistence to tenants.json', icon: CheckCircle, color: C.brass }
          ].map((widget, i) => (
            <Card key={i} style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', padding: 18, color: '#FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>{widget.title}</span>
                <div style={{ background: widget.color + '15', padding: 8, borderRadius: 10 }}>
                  <widget.icon size={16} color={widget.color} />
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>{widget.value}</div>
              <div style={{ fontSize: 11, color: '#64748B' }}>{widget.desc}</div>
            </Card>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isFormOpen ? '1fr 1fr' : '1fr', gap: 28, alignItems: 'start', transition: 'all 0.3s' }}>
          
          {/* TENANTS MANAGEMENT BOARD */}
          <div style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 20, boxShadow: '0 6px 18px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 className="serif" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Registered Client Properties</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#94A3B8' }}>Onboard new restaurants, activate table service, or check KDS configuration keys.</p>
              </div>

              {!isFormOpen && (
                <button 
                  onClick={() => { resetForm(); setIsFormOpen(true); }}
                  style={{ background: C.brass, color: '#FFFFFF', border: 'none', padding: '10px 18px', borderRadius: 12, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'transform 0.2s', boxShadow: `0 4px 12px ${C.brass}40` }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Plus size={14} /> Onboard New Tenant
                </button>
              )}
            </div>

            {tenants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)' }}>
                <Building2 size={36} color="#64748B" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8' }}>No tenants registered yet</div>
                <p style={{ fontSize: 12, color: '#64748B', maxWidth: 300, margin: '6px auto 0 auto' }}>Deploy your first tenant structure or connect backend socket layers to get started.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Hotel / Restaurant Name</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Slug ID</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Mode</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Fallbacks</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map(tenant => (
                      <tr key={tenant.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}>
                        <td style={{ padding: '16px 16px', fontWeight: 700 }}>
                          <div>{tenant.name}</div>
                          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{tenant.address}</span>
                        </td>
                        <td style={{ padding: '16px 16px', fontFamily: 'monospace', color: C.brass }}>{tenant.id}</td>
                        <td style={{ padding: '16px 16px' }}>
                          <span style={{ background: tenant.deploymentMode === 'ROOM_SERVICE' ? 'rgba(59, 130, 246, 0.1)' : tenant.deploymentMode === 'TABLE_DINING' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: tenant.deploymentMode === 'ROOM_SERVICE' ? '#60A5FA' : tenant.deploymentMode === 'TABLE_DINING' ? '#34D399' : '#FBBF24', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                            {tenant.deploymentMode}
                          </span>
                        </td>
                        <td style={{ padding: '16px 16px', color: '#94A3B8' }}>
                          Room: {tenant.defaultRoom} / Table: {tenant.defaultTable}
                        </td>
                        <td style={{ padding: '16px 16px' }}>
                          <span style={{ color: tenant.status === 'Active' ? '#34D399' : '#F87171', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: tenant.status === 'Active' ? '#10B981' : '#EF4444' }}></span>
                            {tenant.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 8 }}>
                            {/* Launch portal drop menu */}
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <button 
                                onClick={(e) => {
                                  const dropdown = e.currentTarget.nextElementSibling;
                                  dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                                }}
                                style={{ background: 'rgba(255,255,255,0.05)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                              >
                                Launch Portal <ExternalLink size={10} />
                              </button>
                              <div style={{ display: 'none', position: 'absolute', right: 0, top: '100%', background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', padding: 6, zIndex: 1000, width: 140, marginTop: 4 }}>
                                {[
                                  { label: 'Guest Ordering', path: '/guest' },
                                  { label: 'Kitchen KDS', path: '/kitchen' },
                                  { label: 'Admin POS', path: '/admin' }
                                ].map((portal, idx) => (
                                  <a 
                                    key={idx}
                                    href={`${portal.path}?tenant=${tenant.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ display: 'block', padding: '6px 10px', color: '#F8FAFC', textDecoration: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, textAlign: 'left', cursor: 'pointer', transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      // Switch client view directly in current tab using navigateTo
                                      const interfaceName = portal.path.substring(1);
                                      navigateTo(interfaceName, tenant.id);
                                    }}
                                  >
                                    {portal.label}
                                  </a>
                                ))}
                              </div>
                            </div>

                            <button 
                              onClick={() => handleEdit(tenant)}
                              style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: '#60A5FA', padding: 8, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Edit config"
                            >
                              <Edit size={14} />
                            </button>

                            <button 
                              onClick={() => handleDelete(tenant.id)}
                              disabled={tenant.id === 'grand-vista'}
                              style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: tenant.id === 'grand-vista' ? '#475569' : '#F87171', padding: 8, borderRadius: 8, cursor: tenant.id === 'grand-vista' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Delete tenant"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* DYNAMIC REGISTER / EDIT PANEL */}
          {isFormOpen && (
            <div className="animate-fade-up" style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 20, boxShadow: '0 6px 18px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
                <h2 className="serif" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                  {editingTenant ? `Edit Configuration: ${formName}` : 'Onboard New Property'}
                </h2>
                <button 
                  onClick={() => { resetForm(); setIsFormOpen(false); }}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* ID Slug Field */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
                    Tenant ID Slug
                  </label>
                  <input 
                    required 
                    type="text" 
                    disabled={editingTenant !== null}
                    value={formId}
                    onChange={e => setFormId(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: editingTenant ? 'rgba(255,255,255,0.02)' : '#0F172A', color: editingTenant ? '#64748B' : '#F8FAFC', fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box' }}
                    placeholder="e.g. marriott-resort (alphanumeric & dashes only)"
                  />
                  {!editingTenant && <span style={{ fontSize: 10, color: '#64748B', marginTop: 4, display: 'block' }}>This forms the dynamic URL parameter: `?tenant=slug`</span>}
                </div>

                {/* Hotel Name Field */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
                      Full Property Name
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#0F172A', color: '#F8FAFC', fontSize: 13, boxSizing: 'border-box' }}
                      placeholder="e.g. Grand Marriott Resort & Spa"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
                      Abbreviation
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={formShortName}
                      onChange={e => setFormShortName(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#0F172A', color: '#F8FAFC', fontSize: 13, boxSizing: 'border-box' }}
                      placeholder="e.g. Marriott"
                    />
                  </div>
                </div>

                {/* Address Field */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
                    Physical Address (Prints on Tax Invoices)
                  </label>
                  <input 
                    required 
                    type="text" 
                    value={formAddress}
                    onChange={e => setFormAddress(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#0F172A', color: '#F8FAFC', fontSize: 13, boxSizing: 'border-box' }}
                    placeholder="e.g. 777 Promenade Blvd, Beachfront Sector"
                  />
                </div>

                {/* Welcome Tagline */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
                    Welcome Tagline
                  </label>
                  <input 
                    required 
                    type="text" 
                    value={formWelcomeTagline}
                    onChange={e => setFormWelcomeTagline(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#0F172A', color: '#F8FAFC', fontSize: 13, boxSizing: 'border-box' }}
                    placeholder="e.g. Exquisite coastal dining at your fingertips"
                  />
                </div>

                {/* Configuration Options */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
                      Deployment Mode
                    </label>
                    <select 
                      value={formDeploymentMode}
                      onChange={e => setFormDeploymentMode(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#0F172A', color: '#F8FAFC', fontSize: 13, cursor: 'pointer', boxSizing: 'border-box' }}
                    >
                      <option value="AUTO">AUTO (Detect from QR)</option>
                      <option value="ROOM_SERVICE">ROOM SERVICE ONLY</option>
                      <option value="TABLE_DINING">TABLE SERVICE ONLY</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
                      Default Room
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={formDefaultRoom}
                      onChange={e => setFormDefaultRoom(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#0F172A', color: '#F8FAFC', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
                      Default Table
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={formDefaultTable}
                      onChange={e => setFormDefaultTable(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#0F172A', color: '#F8FAFC', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Status Toggle */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
                    Tenant Platform Status
                  </label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {['Active', 'Suspended'].map(status => (
                      <button 
                        key={status}
                        type="button"
                        onClick={() => setFormStatus(status)}
                        style={{ flex: 1, padding: 10, borderRadius: 10, border: `1.5px solid ${formStatus === status ? (status === 'Active' ? '#10B981' : '#EF4444') : 'rgba(255,255,255,0.1)'}`, background: formStatus === status ? (status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') : 'none', color: formStatus === status ? (status === 'Active' ? '#34D399' : '#F87171') : '#94A3B8', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button 
                    type="button" 
                    onClick={() => { resetForm(); setIsFormOpen(false); }}
                    style={{ flex: 1, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', padding: '12px 18px', borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    style={{ flex: 1, background: C.brass, color: '#FFFFFF', border: 'none', padding: '12px 18px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 12px ${C.brass}40` }}
                  >
                    <Save size={16} /> Save Settings
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* TOAST SUCCESS DIALOG */}
      {successToast && (
        <div className="animate-fade-up" style={{ position: 'fixed', bottom: 24, right: 24, background: '#10B981', color: '#FFFFFF', padding: '12px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700, boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: 8, zIndex: 99999 }}>
          <CheckCircle size={16} /> {successToast}
        </div>
      )}

    </div>
  );
};

import { useState } from 'react';
import { Lock, ArrowRight, Shield } from 'lucide-react';
import { C } from '../../constants/theme';
import { Card } from '../ui/Card';

export const PinGate = ({ role, onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin) return;
    setLoading(true);
    const success = await onLogin(role, pin);
    if (!success) {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 2000);
    }
    setLoading(false);
  };

  const name = role === 'admin' ? 'Admin Console' : 'Kitchen KDS';
  const color = role === 'admin' ? C.text : C.emerald;

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.sand }}>
      <Card style={{ width: 340, padding: 32, textAlign: 'center', border: `1.5px solid ${C.border}`, boxShadow: '0 24px 64px rgba(7,20,40,0.06)' }} className="animate-fade-up">
        <div style={{ display: 'inline-flex', background: `${color}15`, padding: 16, borderRadius: '50%', marginBottom: 20 }}>
          <Shield size={32} color={color} />
        </div>
        <h2 className="serif" style={{ fontSize: 24, fontWeight: 800, margin: 0, color: C.text }}>{name}</h2>
        <p style={{ color: C.textSub, fontSize: 13, margin: '8px 0 24px 0' }}>Enter your staff PIN to access this dashboard.</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Lock size={18} color={error ? C.danger : C.textMuted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="password"
              placeholder="Staff PIN"
              value={pin}
              onChange={e => setPin(e.target.value)}
              style={{
                width: '100%', padding: '14px 14px 14px 40px', borderRadius: 14, border: `1.5px solid ${error ? C.danger : C.border}`,
                background: C.borderLight, fontSize: 16, outline: 'none', letterSpacing: 4, fontFamily: 'inherit', boxSizing: 'border-box',
                transition: 'border-color 0.2s', fontWeight: 'bold', color: C.text
              }}
              autoFocus
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: color, color: C.white, border: 'none', padding: 14, borderRadius: 14,
              fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Verifying...' : 'Unlock Dashboard'} <ArrowRight size={18} />
          </button>
        </form>
      </Card>
    </div>
  );
};

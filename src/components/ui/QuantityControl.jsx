import React from 'react';
import { C } from '../../constants/theme';

const ACCENT = '#2563EB';
const ACCENT_SOFT = 'rgba(37,99,235,0.12)';

export const QuantityControl = ({ qty, onIncrease, onDecrease, onAdd }) => {
  if (qty === 0) {
    return (
      <button
        onClick={onAdd}
        style={{ background: ACCENT_SOFT, color: C.text, padding: '6px 6px 6px 14px', borderRadius: 24, fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
      >
        ADD <div style={{ background: ACCENT, color: C.white, width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16 }}>+</div>
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: ACCENT_SOFT, borderRadius: 24, padding: '4px 4px 4px 14px' }}>
      <button onClick={onDecrease} style={{ background: 'none', border: 'none', color: C.text, fontWeight: 900, fontSize: 16, cursor: 'pointer', padding: '4px 8px 4px 0' }}>−</button>
      <span style={{ fontWeight: 800, color: C.text, fontSize: 15, minWidth: 14, textAlign: 'center' }}>{qty}</span>
      <button onClick={onIncrease} style={{ background: ACCENT, color: C.white, border: 'none', width: 28, height: 28, borderRadius: '50%', fontWeight: 900, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
    </div>
  );
};
import { C } from '../../constants/theme';

export const VegDot = ({ isVeg }) => (
  <div style={{ width: 14, height: 14, border: `1px solid ${isVeg ? C.emeraldMid : C.danger}`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isVeg ? C.emeraldMid : C.danger }} />
  </div>
);

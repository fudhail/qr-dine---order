import os

with open("src/App.backup.jsx", "r", encoding="utf-8") as f:
    content = f.read()

def get_block(start_marker, end_marker=None):
    start_idx = content.find(start_marker)
    if start_idx == -1: return ""
    if end_marker:
        end_idx = content.find(end_marker, start_idx)
        if end_idx == -1: end_idx = len(content)
        return content[start_idx:end_idx].strip()
    return content[start_idx:].strip()

theme_js = """export const C = {  
  emerald: '#064E3B', emeraldMid: '#059669', emeraldLight: '#D1FAE5',  
  brass: '#B45309', brassLight: '#FEF3C7',  
  sand: '#FDFBF7', white: '#FFFFFF',  
  text: '#1F2937', textSub: '#4B5563', textMuted: '#9CA3AF',  
  border: '#E5E7EB', borderLight: '#F3F4F6',  
  danger: '#DC2626', dangerLight: '#FEE2E2',  
  warning: '#D97706', warningLight: '#FEF3C7',  
  info: '#2563EB', infoLight: '#DBEAFE',
};
"""
with open("src/constants/theme.js", "w", encoding="utf-8") as f: f.write(theme_js)

socket_js = """import { io } from 'socket.io-client';

export const socket = io(`http://${window.location.hostname}:3000`);
"""
with open("src/lib/socket.js", "w", encoding="utf-8") as f: f.write(socket_js)

global_styles = f"""import React from 'react';
import {{ C }} from '../../constants/theme';

export {get_block('const GlobalStyles = () => (', '// --- SHARED UI COMPONENTS ---')}
"""
with open("src/components/styles/GlobalStyles.jsx", "w", encoding="utf-8") as f: f.write(global_styles)

card_jsx = f"""import React from 'react';
import {{ C }} from '../../constants/theme';

export {get_block('const Card =', 'const VegDot')}
"""
with open("src/components/ui/Card.jsx", "w", encoding="utf-8") as f: f.write(card_jsx)

vegdot_jsx = f"""import React from 'react';
import {{ C }} from '../../constants/theme';

export {get_block('const VegDot =', '// --- GUEST APP ---')}
"""
with open("src/components/ui/VegDot.jsx", "w", encoding="utf-8") as f: f.write(vegdot_jsx)

clock_jsx = f"""import React, {{ useState, useEffect }} from 'react';
import {{ C }} from '../../constants/theme';

export {get_block('const ClockWidget =', '// --- KITCHEN APP (KDS) ---')}
"""
with open("src/components/ui/ClockWidget.jsx", "w", encoding="utf-8") as f: f.write(clock_jsx)

guest_app = f"""import React, {{ useState }} from 'react';
import {{ ShoppingCart, ChevronRight, ChevronLeft, CheckCircle, MapPin, Phone }} from 'lucide-react';
import {{ C }} from '../../constants/theme';
import {{ Card }} from '../../components/ui/Card';
import {{ VegDot }} from '../../components/ui/VegDot';

export {get_block('const GuestApp =', '// --- CLOCK WIDGET ---')}
"""
with open("src/apps/Guest/GuestApp.jsx", "w", encoding="utf-8") as f: f.write(guest_app)

kitchen_app = f"""import React, {{ useState }} from 'react';
import {{ ChefHat, CheckCircle, Circle, MapPin, AlertTriangle, Plus, Trash2, PackageCheck }} from 'lucide-react';
import {{ C }} from '../../constants/theme';
import {{ Card }} from '../../components/ui/Card';
import {{ VegDot }} from '../../components/ui/VegDot';
import {{ ClockWidget }} from '../../components/ui/ClockWidget';

export {get_block('const KitchenApp =', '// --- ADMIN APP ---')}
"""
with open("src/apps/Kitchen/KitchenApp.jsx", "w", encoding="utf-8") as f: f.write(kitchen_app)

admin_app = f"""import React, {{ useState, useMemo }} from 'react';
import {{ LayoutDashboard, Search, Settings, ChevronRight, Printer, X, Plus, ClipboardList, TrendingUp, Package, Star, Clock }} from 'lucide-react';
import {{ C }} from '../../constants/theme';
import {{ Card }} from '../../components/ui/Card';
import {{ VegDot }} from '../../components/ui/VegDot';

export {get_block('const AdminApp =', '// --- RUNNER APP (ROOM SERVICE) ---')}
"""
with open("src/apps/Admin/AdminApp.jsx", "w", encoding="utf-8") as f: f.write(admin_app)

runner_app = f"""import React from 'react';
import {{ PackageCheck, MapPin, Package, CheckCircle }} from 'lucide-react';
import {{ C }} from '../../constants/theme';
import {{ Card }} from '../../components/ui/Card';

export {get_block('const RunnerApp =', '// --- ROOT APP COMPONENT ---')}
"""
with open("src/apps/Runner/RunnerApp.jsx", "w", encoding="utf-8") as f: f.write(runner_app)


app_jsx = f"""import React, {{ useState, useEffect }} from 'react';
import {{ UtensilsCrossed, ChefHat, LayoutDashboard, PackageCheck }} from 'lucide-react';
import {{ socket }} from './lib/socket';
import {{ C }} from './constants/theme';
import {{ GlobalStyles }} from './components/styles/GlobalStyles';
import {{ Card }} from './components/ui/Card';

import {{ GuestApp }} from './apps/Guest/GuestApp';
import {{ KitchenApp }} from './apps/Kitchen/KitchenApp';
import {{ RunnerApp }} from './apps/Runner/RunnerApp';
import {{ AdminApp }} from './apps/Admin/AdminApp';

{get_block('export default function App() {')}
"""
with open("src/App.jsx", "w", encoding="utf-8") as f: f.write(app_jsx)
print("Refactoring complete.")

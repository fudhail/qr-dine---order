import { C } from '../../constants/theme';

export const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    h1, h2, h3, .serif { font-family: inherit; font-weight: 700; }
    body { background: ${C.sand}; color: ${C.text}; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
    
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-thumb { background: ${C.brass}; border-radius: 6px; }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    
    @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { 0% { transform: scale(0.9); opacity: 0; } 60% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
    @keyframes pulseBadge { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
    @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes bounceIn { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.15); } 70% { transform: scale(0.95); } 100% { transform: scale(1); opacity: 1; } }
    @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    
    .animate-fade-up { animation: fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-fade-in { animation: fadeIn 0.25s ease-out forwards; }
    .animate-pop { animation: popIn 0.3s ease-out forwards; }
    .animate-pulse-badge { animation: pulseBadge 0.3s ease-out; }
    .animate-pulse-dot { animation: pulseDot 1.5s infinite; }
    .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-slide-down { animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-bounce-in { animation: bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    
    .shimmer { background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite linear; }
    
    .card-interactive { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .card-interactive:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(15,27,43,0.06) !important; }
    .card-interactive:active { transform: translateY(0) scale(0.97); }

    button { cursor: pointer; border: none; background: none; outline: none; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    button:active { transform: scale(0.95); }
    button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    
    input, textarea, select { font-family: inherit; outline: none; }
    
    @media print {
      body * { visibility: hidden; }
      .print-section, .print-section * { visibility: visible; }
      .print-section { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; margin: 0 !important; }
      .no-print { display: none !important; }
      .print-backdrop { background: none !important; position: absolute !important; inset: 0 !important; display: block !important; }
    }
  `}</style>
);

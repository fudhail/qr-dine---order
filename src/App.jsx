import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { GlobalStyles } from './components/styles/GlobalStyles';
import { CONFIG } from './config';
import { useStore } from './store/useStore';

import { GuestApp } from './apps/Guest/GuestApp';
import { KitchenApp } from './apps/Kitchen/KitchenApp';
import { AdminApp } from './apps/Admin/AdminApp';

export default function App() {
  const initSocket = useStore(state => state.initSocket);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const cleanup = initSocket();
    return cleanup;
  }, [initSocket]);

  // Handle URL tokens instantly at the root level (so the router doesn't get confused)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has('t') && !location.pathname.includes('/guest')) {
      navigate('/guest' + location.search, { replace: true });
    }
  }, [location, navigate]);

  return (
    <>
      <GlobalStyles />
      <Routes>
        <Route path="/" element={<div style={{ padding: 20, textAlign: 'center' }}>Please navigate to /guest, /kitchen, or /admin.</div>} />
        <Route path="/guest" element={<GuestApp config={CONFIG} />} />
        <Route path="/kitchen" element={<KitchenApp config={CONFIG} />} />
        <Route path="/admin" element={<AdminApp config={CONFIG} />} />
      </Routes>
    </>
  );
}

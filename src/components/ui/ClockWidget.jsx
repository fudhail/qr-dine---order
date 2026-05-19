import React, { useState, useEffect } from 'react';
import { C } from '../../constants/theme';

export const ClockWidget = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString('en-US', { hour12: false })), 1000);
    return () => clearInterval(timer);
  }, []);
  return <div style={{ fontSize: 24, fontWeight: 700, color: C.text, fontFamily: 'monospace' }}>{time}</div>;
};

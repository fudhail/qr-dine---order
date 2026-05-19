import React from 'react';
import { C } from '../../constants/theme';

export const Card = ({ children, className = '', style = {}, onClick, onMouseEnter, onMouseLeave }) => (
  <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} className={className} style={{ background: C.white, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', padding: 24, ...style }}>
    {children}
  </div>
);

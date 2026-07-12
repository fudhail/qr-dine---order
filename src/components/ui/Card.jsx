export const Card = ({ children, className = '', style = {}, onClick, onMouseEnter, onMouseLeave }) => (
  <div 
    onClick={onClick} 
    onMouseEnter={onMouseEnter} 
    onMouseLeave={onMouseLeave} 
    className={`modern-card ${className}`} 
    style={{ padding: 24, ...style }}
  >
    {children}
  </div>
);

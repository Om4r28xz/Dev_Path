import React from 'react';

type AlertVariant = 'info' | 'success' | 'error' | 'warning';

interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({ variant = 'info', children }) => {
  return (
    <div role="alert" className={`alert alert--${variant}`}>
      {children}
    </div>
  );
};

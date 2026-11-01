import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  className = '',
  type = 'button',
  ...rest
}) => {
  const variantClass = `btn--${variant}`;
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${className}`.trim()}
      disabled={isDisabled}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading ? <span aria-live="polite">Cargando…</span> : children}
    </button>
  );
};

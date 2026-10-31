import React from 'react';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  error?: string;
  required?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  id,
  label,
  type = 'text',
  error,
  required = false,
  className = '',
  ...rest
}) => {
  const errorId = `${id}-error`;

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="field__required">
            {' '}
            *
          </span>
        )}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`field__input ${className}`.trim()}
        {...rest}
      />
      {error && (
        <span id={errorId} role="alert" className="field__error">
          {error}
        </span>
      )}
    </div>
  );
};

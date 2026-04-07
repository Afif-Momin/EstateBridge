import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className = '', ...props }, ref) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="flex flex-col">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {props.required && <span className="text-error-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={[
            'w-full px-4 py-2.5 rounded-lg border text-base',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            'placeholder:text-gray-400',
            error 
              ? 'border-error-500 text-error-900 focus:ring-error-500 focus:border-error-500' 
              : 'border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500',
            className,
          ].join(' ')}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-sm text-error-600">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;

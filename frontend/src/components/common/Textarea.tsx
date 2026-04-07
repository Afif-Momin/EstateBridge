import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, id, className = '', ...props }, ref) => {
    const textareaId = id ?? `textarea-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="flex flex-col">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {props.required && <span className="text-error-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          className={[
            'w-full px-4 py-2.5 rounded-lg border text-base resize-y',
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
          <p id={`${textareaId}-error`} role="alert" className="mt-1.5 text-sm text-error-600">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${textareaId}-helper`} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;

'use client';

import React from 'react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled';
  leftIcon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    options, 
    placeholder, 
    label, 
    error, 
    size = 'md', 
    variant = 'default',
    leftIcon,
    className = '', 
    id,
    ...props 
  }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    
    // Size styles
    const sizeStyles = {
      sm: 'px-2 py-1 text-sm',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base'
    };

    // Variant styles
    const variantStyles = {
      default: 'bg-white border-gray-300',
      filled: 'bg-gray-50 border-gray-200'
    };

    // Icon padding
    const iconPadding = {
      sm: leftIcon ? 'pl-8' : '',
      md: leftIcon ? 'pl-10' : '',
      lg: leftIcon ? 'pl-12' : ''
    };

    const baseStyles = `
      w-full border rounded-md shadow-sm
      text-gray-900 placeholder-gray-500
      focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none
      appearance-none cursor-pointer
      hover:border-gray-400 transition-colors duration-200
      disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${iconPadding[size]}
      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
    `;

    // Custom dropdown arrow
    const dropdownIcon = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={selectId} 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <select
            ref={ref}
            id={selectId}
            className={`${baseStyles} ${className}`.trim()}
            style={{
              backgroundImage: dropdownIcon,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: size === 'sm' ? '1.2em 1.2em' : '1.5em 1.5em',
              paddingRight: size === 'sm' ? '2rem' : '2.5rem'
            }}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-gray-500">
                {placeholder}
              </option>
            )}
            
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="py-2 px-3 text-gray-900 bg-white disabled:text-gray-400 disabled:bg-gray-100"
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
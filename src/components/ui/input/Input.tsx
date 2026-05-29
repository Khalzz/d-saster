import { forwardRef } from "react";

const Input = forwardRef<HTMLInputElement, { value: string, onChange: (value: string) => void, placeholder?: string, className?: string, onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void, autoFocus?: boolean }>(
  ({ value, onChange, placeholder, className, onKeyDown, autoFocus }, ref) => {
    return (
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className={`bg-base border border-gold-500/30 h-full w-full caret-gold-500 rounded-md p-2 text-gold-500 focus:ring-0 focus:border-gold-500! outline-none ${className}`}
      />
    );
  }
);

export default Input;
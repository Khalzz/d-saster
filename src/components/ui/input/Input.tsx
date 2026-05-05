import { forwardRef } from "react";

const Input = forwardRef<HTMLInputElement, { value: string, onChange: (value: string) => void, placeholder?: string, className?: string }>(
  ({ value, onChange, placeholder, className }, ref) => {
    return (
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`bg-surface border border-transparent h-full w-full caret-gold-500 rounded-md p-2 text-gold-500 focus:ring-0 focus:border-gold-500! outline-none ${className}`}
      />
    );
  }
);

export default Input;
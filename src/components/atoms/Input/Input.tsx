import type { InputHTMLAttributes } from "react";
import React from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full bg-transparent px-3 py-2 text-lg outline-none dark:text-white ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };

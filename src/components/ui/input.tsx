import * as React from "react";
import { cn } from "@/src/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-8 w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors font-mono",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

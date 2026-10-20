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
          "flex h-9 w-full rounded-md border border-[#e2e5de] bg-white px-3 py-1.5 text-sm text-[#20312d] placeholder:text-[#a0aaa2] focus:outline-none focus:border-[#246b55] focus:ring-2 focus:ring-[#246b55]/10 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
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

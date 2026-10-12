import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-100 text-zinc-950 hover:bg-white font-medium shadow-sm",
        destructive:
          "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20",
        outline:
          "border border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white",
        secondary:
          "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700/60",
        ghost: "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100",
        link: "text-zinc-100 underline-offset-4 hover:underline",
        gradient: "bg-zinc-100 text-zinc-950 hover:bg-white font-medium shadow-sm",
        platinum: "border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800",
        gold: "bg-zinc-100 text-zinc-950 hover:bg-white font-medium",
      },
      size: {
        default: "h-8 px-3 text-xs rounded",
        sm: "h-7 px-2.5 text-xs rounded",
        lg: "h-9 px-4 text-xs rounded font-medium",
        icon: "h-8 w-8 rounded",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

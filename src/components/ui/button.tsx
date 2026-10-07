import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-600 text-white shadow-lg shadow-emerald-950/30 hover:bg-emerald-500 hover:shadow-emerald-900/40 border border-emerald-500/30",
        destructive:
          "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 shadow-sm",
        outline:
          "border border-slate-700/80 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:border-slate-600 hover:text-white backdrop-blur-sm",
        secondary:
          "bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/50 shadow-sm",
        ghost: "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100",
        link: "text-emerald-400 underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-md shadow-emerald-950/40 hover:brightness-110 border border-emerald-400/20",
        platinum: "bg-gradient-to-r from-slate-800 via-slate-750 to-slate-800 text-slate-100 border border-slate-600/60 shadow-md hover:border-slate-400/80",
        gold: "bg-gradient-to-r from-amber-600 to-amber-500 text-amber-950 font-bold border border-amber-400/40 shadow-md shadow-amber-950/20 hover:brightness-110",
      },
      size: {
        default: "h-10 px-4 py-2 text-xs sm:text-sm",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-xl px-7 text-base font-bold",
        icon: "h-9 w-9",
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

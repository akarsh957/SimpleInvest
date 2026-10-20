import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#246b55]/30 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#246b55] text-white hover:bg-[#1d5b48] font-medium",
        destructive:
          "bg-[#f8ece9] text-[#a7463b] hover:bg-[#f1deda] border border-[#edd4cf]",
        outline:
          "border border-[#e2e5de] bg-white text-[#596a63] hover:bg-[#f5f7f3] hover:text-[#20312d]",
        secondary:
          "bg-[#eef1ec] text-[#44574f] hover:bg-[#e5eae4] border border-[#dce2dc]",
        ghost: "text-[#596a63] hover:bg-[#f0f1eb] hover:text-[#20312d]",
        link: "text-[#20312d] underline-offset-4 hover:underline",
        gradient: "bg-[#246b55] text-white hover:bg-[#1d5b48] font-medium",
        platinum: "border border-[#dce2dc] bg-white text-[#44574f] hover:bg-[#f5f7f3]",
        gold: "bg-[#246b55] text-white hover:bg-[#1d5b48] font-medium",
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

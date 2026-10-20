import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors border",
  {
    variants: {
      variant: {
        default:
          "border-[#e2e5de] bg-[#f5f7f3] text-[#44574f]",
        secondary:
          "border-[#e2e5de] bg-white text-[#7c8981]",
        destructive:
          "border-[#edd4cf] bg-[#f8ece9] text-[#a7463b]",
        outline:
          "border-[#dce2dc] text-[#596a63]",
        success:
          "border-[#d4e5d9] bg-[#e8f1eb] text-[#246b55]",
        warning:
          "border-[#ebdfc3] bg-[#fbf6e9] text-[#796335]",
        info:
          "border-[#d8e4e1] bg-[#e9f0ed] text-[#3c716c]",
        purple:
          "border-[#e2e5de] bg-[#f5f7f3] text-[#596a63]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-mono font-medium transition-colors border",
  {
    variants: {
      variant: {
        default:
          "border-zinc-800 bg-zinc-900 text-zinc-200",
        secondary:
          "border-zinc-800 bg-zinc-900/60 text-zinc-400",
        destructive:
          "border-rose-500/20 bg-rose-500/10 text-rose-400",
        outline:
          "border-zinc-800 text-zinc-300",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-400",
        info:
          "border-blue-500/20 bg-blue-500/10 text-blue-400",
        purple:
          "border-zinc-800 bg-zinc-900 text-zinc-300",
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

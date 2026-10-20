"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#173b3b]/35 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150"
        onClick={() => onOpenChange(false)}
      />
      {/* Content Container */}
      <div className="relative z-50 w-full max-w-md overflow-hidden rounded-lg border border-[#e2e5de] bg-white p-5 text-[#20312d] shadow-[0_12px_40px_rgba(28,48,39,0.14)] animate-in zoom-in-95 duration-150">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3.5 top-3.5 rounded p-1 text-[#7c8981] hover:bg-[#f0f1eb] hover:text-[#20312d] focus:outline-none transition-colors"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1 text-left mb-3", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-sm font-semibold tracking-tight text-[#20312d]", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-[#7c8981]", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-[#e2e5de]", className)} {...props} />;
}

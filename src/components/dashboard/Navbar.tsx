"use client";

import { TerminalHeader, TerminalHeaderProps } from "@/src/components/terminal/TerminalHeader";

export { TerminalHeader };
export type { TerminalHeaderProps as NavbarProps };

export function Navbar(props: TerminalHeaderProps) {
  return <TerminalHeader {...props} />;
}

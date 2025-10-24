"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, ...props }, ref) => (
    <aside
      ref={ref}
      className={cn(
        "flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground",
        className
      )}
      {...props}
    />
  )
);
Sidebar.displayName = "Sidebar";

interface SidebarBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarBody = React.forwardRef<HTMLDivElement, SidebarBodyProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 overflow-auto", className)} {...props} />
  )
);
SidebarBody.displayName = "SidebarBody";

interface SidebarLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
  activeClassName?: string;
}

const SidebarLink = React.forwardRef<HTMLAnchorElement, SidebarLinkProps>(
  ({ className, activeClassName = "bg-sidebar-primary text-sidebar-primary-foreground", href, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive ? activeClassName : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          className
        )}
        {...props}
      />
    );
  }
);
SidebarLink.displayName = "SidebarLink";

export { Sidebar, SidebarBody, SidebarLink };
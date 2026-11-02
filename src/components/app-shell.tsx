"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CommandPalette } from "./command-palette";
import { Sidebar } from "./sidebar";
import { IconButton, cn } from "./ui";

const ShellCtx = createContext<{ openSearch: () => void; openSidebar: () => void }>({
  openSearch: () => {},
  openSidebar: () => {},
});
export const useShell = () => useContext(ShellCtx);

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ShellCtx.Provider value={{ openSearch: () => setSearchOpen(true), openSidebar: () => setMobileOpen(true) }}>
      <div className="flex h-dvh">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-line bg-sidebar md:flex md:flex-col">
          <Sidebar onSearch={() => setSearchOpen(true)} />
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-[90] md:hidden">
            <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setMobileOpen(false)} />
            <aside className="absolute inset-y-0 left-0 flex w-[82%] max-w-72 animate-slide-in flex-col bg-sidebar shadow-pop">
              <Sidebar onSearch={() => setSearchOpen(true)} onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-3 md:hidden">
            <IconButton label="Open menu" onClick={() => setMobileOpen(true)}>
              <Menu className="size-4" />
            </IconButton>
            <span className="text-sm font-medium">Interview Prep</span>
          </header>
          <main id="main" className={cn("min-h-0 flex-1 overflow-y-auto")}>
            {children}
          </main>
        </div>
      </div>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </ShellCtx.Provider>
  );
}

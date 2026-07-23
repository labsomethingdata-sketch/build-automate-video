"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mockWorkspace } from "@/lib/mock";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Panel", icon: "▦" },
  { href: "/clients", label: "Clientes", icon: "◑" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
      {/* Marca + workspace */}
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span>🎬</span>
          <span>Motor de Videos</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{mockWorkspace.name}</p>
      </div>

      {/* Acción principal */}
      <div className="p-3">
        <Link
          href="/projects/new"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          <span className="text-base leading-none">+</span> Nuevo proyecto
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className="w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Usuario (mock) */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            JT
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Johannes</p>
            <p className="truncate text-xs text-muted-foreground">Owner</p>
          </div>
          <Link
            href="/login"
            className="text-xs text-muted-foreground hover:text-foreground"
            title="Salir"
          >
            ⏻
          </Link>
        </div>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, BarChart3, Users, Settings, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", icon: MapPin, label: "Today" },
  { href: "/week", icon: CalendarDays, label: "Week" },
  { href: "/stats", icon: BarChart3, label: "Stats" },
  { href: "/clients", icon: Users, label: "Clients" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-full h-full text-xs",
                active ? "text-primary font-semibold" : "text-muted"
              )}
            >
              <tab.icon className={cn("w-5 h-5", active && "text-primary")} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

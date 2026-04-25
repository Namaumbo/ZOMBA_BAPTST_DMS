"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Church,
  LayoutDashboard,
  Users,
  Building2,
  FileBarChart2,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "data-entry", "viewer"] },
  { href: "/members", label: "Members", icon: Users, roles: ["admin", "data-entry", "viewer"] },
  { href: "/departments", label: "Departments", icon: Building2, roles: ["admin", "data-entry", "viewer"] },
  { href: "/reports", label: "Reports", icon: FileBarChart2, roles: ["admin", "data-entry", "viewer"] },
  { href: "/settings/users", label: "User Management", icon: Settings, roles: ["admin"] },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-full bg-blue-900 text-white w-64">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-blue-800">
        <Church className="w-8 h-8 text-blue-300 shrink-0" />
        <div>
          <p className="font-bold text-sm leading-tight">ZBC Church DMS</p>
          <p className="text-blue-300 text-xs">Data Management</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav
          .filter((item) => user && item.roles.includes(user.role))
          .map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
                pathname.startsWith(href)
                  ? "bg-blue-700 text-white"
                  : "text-blue-200 hover:bg-blue-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
      </nav>

      <div className="px-3 py-4 border-t border-blue-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold uppercase shrink-0">
            {user?.username?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.username}</p>
            <p className="text-blue-300 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-blue-800 hover:text-white transition"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

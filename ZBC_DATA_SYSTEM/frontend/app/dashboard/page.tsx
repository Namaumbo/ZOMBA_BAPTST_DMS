"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Users, UserCheck, UserX, UserPlus, TrendingUp } from "lucide-react";
import api from "@/lib/api";
import type { Stats } from "@/lib/types";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: async () => {
      const { data } = await api.get("/reports/stats");
      return data;
    },
  });

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Overview of church membership</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Total Members" value={stats?.total ?? 0} icon={Users} color="bg-purple-600" />
            <StatCard label="Active Members" value={stats?.active ?? 0} icon={UserCheck} color="bg-emerald-600" />
            <StatCard label="Inactive Members" value={stats?.inactive ?? 0} icon={UserX} color="bg-slate-500" />
            <StatCard label="Visitors" value={stats?.visitors ?? 0} icon={TrendingUp} color="bg-amber-500" />
            <StatCard label="New This Month" value={stats?.new_this_month ?? 0} icon={UserPlus} color="bg-violet-600" />
          </div>
        )}

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-800 mb-1">Quick Actions</h2>
          <div className="flex flex-wrap gap-3 mt-4">
            <a
              href="/members/new"
              className="bg-purple-800 hover:bg-purple-900 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              + Register Member
            </a>
            <a
              href="/members"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              View All Members
            </a>
            <a
              href="/reports"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              Download Reports
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

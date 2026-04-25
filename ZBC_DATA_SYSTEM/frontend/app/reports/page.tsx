"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { FileText, FileSpreadsheet, Download, Loader2 } from "lucide-react";

export default function ReportsPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState<"pdf" | "excel" | null>(null);

  const buildParams = () => {
    const p = new URLSearchParams();
    if (status) p.append("status", status);
    if (search) p.append("search", search);
    return p.toString();
  };

  const download = async (type: "pdf" | "excel") => {
    setDownloading(type);
    try {
      const token = localStorage.getItem("access_token");
      const endpoint = type === "pdf" ? "pdf" : "excel";
      const params = buildParams();
      const url = `/api/v1/reports/${endpoint}${params ? `?${params}` : ""}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = type === "pdf" ? "members_report.pdf" : "members_report.xlsx";
      a.click();
      URL.revokeObjectURL(href);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Generate and download member data reports</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-5">
          <h2 className="font-semibold text-slate-800">Filter Options</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input-field"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="visitor">Visitor</option>
              </select>
            </div>
            <div>
              <label className="field-label">Search (name / number)</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
                placeholder="Optional filter…"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-3">
            <p className="text-sm text-slate-500 mb-4">
              Click a button below to download the filtered report.
            </p>

            <button
              onClick={() => download("pdf")}
              disabled={downloading !== null}
              className="w-full flex items-center justify-between px-5 py-4 border-2 border-blue-100 hover:border-blue-300 rounded-xl group transition disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 rounded-lg group-hover:bg-red-100 transition">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-800">PDF Report</p>
                  <p className="text-xs text-slate-400">Printable A4 landscape member list</p>
                </div>
              </div>
              {downloading === "pdf" ? (
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              ) : (
                <Download className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition" />
              )}
            </button>

            <button
              onClick={() => download("excel")}
              disabled={downloading !== null}
              className="w-full flex items-center justify-between px-5 py-4 border-2 border-blue-100 hover:border-blue-300 rounded-xl group transition disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-800">Excel Report</p>
                  <p className="text-xs text-slate-400">Spreadsheet with full member data</p>
                </div>
              </div>
              {downloading === "excel" ? (
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              ) : (
                <Download className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition" />
              )}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

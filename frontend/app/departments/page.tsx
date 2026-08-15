"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { AppShell } from "@/components/layout/AppShell";
import { Plus, Trash2, Loader2, Building2 } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { hasRole } from "@/lib/auth";
import type { Department } from "@/lib/types";

export default function DepartmentsPage() {
  const { user } = useAuth();
  const isAdmin = hasRole(user, "admin");
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: departments, isLoading } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await api.get("/departments");
      return data;
    },
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ name: string; description: string }>();

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const { data: dept } = await api.post("/departments", data);
      return dept;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      reset();
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/departments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
            <p className="text-slate-500 text-sm">Ministries and cell groups</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-2 bg-purple-800 hover:bg-purple-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
            >
              <Plus className="w-4 h-4" /> Add Department
            </button>
          )}
        </div>

        {showForm && isAdmin && (
          <form
            onSubmit={handleSubmit((data) => createMutation.mutate(data))}
            className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-5 space-y-3"
          >
            <h2 className="font-semibold text-slate-800">New Department</h2>
            <div>
              <label className="field-label">Name *</label>
              <input {...register("name", { required: true })} className="input-field" placeholder="e.g. Choir" />
            </div>
            <div>
              <label className="field-label">Description</label>
              <input {...register("description")} className="input-field" placeholder="Brief description" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={isSubmitting || createMutation.isPending} className="px-4 py-2 bg-purple-800 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center gap-2">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-50">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                </div>
              ))
            : departments?.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-purple-300 shrink-0" />
                    <div>
                      <p className="font-medium text-slate-800">{dept.name}</p>
                      {dept.description && <p className="text-xs text-slate-400">{dept.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400">{dept.member_count} members</span>
                    {isAdmin && (
                      <button
                        onClick={() => { if (confirm(`Delete "${dept.name}"?`)) deleteMutation.mutate(dept.id); }}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
          {!isLoading && departments?.length === 0 && (
            <p className="text-center py-10 text-slate-400 text-sm">No departments yet.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}

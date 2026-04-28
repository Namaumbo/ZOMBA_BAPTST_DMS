"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppShell } from "@/components/layout/AppShell";
import { Plus, Trash2, Loader2, ShieldCheck, Edit2, X, Save } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { hasRole } from "@/lib/auth";
import type { SystemUser } from "@/lib/types";

const schema = z.object({
  username: z.string().min(2, "Min 2 characters"),
  email: z.string().email("Invalid email"),
  role: z.enum(["admin", "data-entry", "viewer"]),
  password: z.string().min(6, "Min 6 characters"),
});
const editSchema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(["admin", "data-entry", "viewer"]),
  password: z.string().optional(),
  is_active: z.boolean(),
});

type CreateData = z.infer<typeof schema>;
type EditData = z.infer<typeof editSchema>;

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-violet-100 text-violet-700",
  "data-entry": "bg-purple-100 text-purple-700",
  viewer: "bg-slate-100 text-slate-600",
};

export default function UsersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  if (!hasRole(user, "admin")) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <ShieldCheck className="w-12 h-12 mb-3" />
          <p>Admin access required.</p>
        </div>
      </AppShell>
    );
  }

  const { data: users, isLoading } = useQuery<SystemUser[]>({
    queryKey: ["system-users"],
    queryFn: async () => {
      const { data } = await api.get("/users");
      return data;
    },
  });

  const createForm = useForm<CreateData>({ resolver: zodResolver(schema), defaultValues: { role: "viewer" } });
  const editForm = useForm<EditData>({ resolver: zodResolver(editSchema) });

  const createMutation = useMutation({
    mutationFn: async (data: CreateData) => {
      const { data: u } = await api.post("/users", data);
      return u;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system-users"] });
      createForm.reset();
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EditData }) => {
      const { data: u } = await api.put(`/users/${id}`, {
        ...data,
        password: data.password || undefined,
      });
      return u;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system-users"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["system-users"] }),
  });

  const startEdit = (u: SystemUser) => {
    editForm.reset({ email: u.email, role: u.role, password: "", is_active: u.is_active });
    setEditingId(u.id);
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            <p className="text-slate-500 text-sm">Manage system access and roles</p>
          </div>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="flex items-center gap-2 bg-purple-800 hover:bg-purple-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>

        {showCreate && (
          <form
            onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))}
            className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-5 space-y-3"
          >
            <h2 className="font-semibold text-slate-800">New System User</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">Username *</label>
                <input {...createForm.register("username")} className="input-field" />
                {createForm.formState.errors.username && <p className="text-red-500 text-xs mt-1">{createForm.formState.errors.username.message}</p>}
              </div>
              <div>
                <label className="field-label">Email *</label>
                <input {...createForm.register("email")} type="email" className="input-field" />
                {createForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{createForm.formState.errors.email.message}</p>}
              </div>
              <div>
                <label className="field-label">Role *</label>
                <select {...createForm.register("role")} className="input-field">
                  <option value="viewer">Viewer</option>
                  <option value="data-entry">Data Entry</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="field-label">Password *</label>
                <input {...createForm.register("password")} type="password" className="input-field" />
                {createForm.formState.errors.password && <p className="text-red-500 text-xs mt-1">{createForm.formState.errors.password.message}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-purple-800 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center gap-2">
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Create User
              </button>
            </div>
            {createMutation.isError && (
              <p className="text-red-500 text-xs">
                {(createMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create user"}
              </p>
            )}
          </form>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-50">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 animate-pulse"><div className="h-4 bg-slate-100 rounded w-1/3" /></div>
              ))
            : users?.map((u) => (
                <div key={u.id}>
                  {editingId === u.id ? (
                    <form
                      onSubmit={editForm.handleSubmit((data) => updateMutation.mutate({ id: u.id, data }))}
                      className="p-5 space-y-3"
                    >
                      <p className="font-medium text-slate-800">{u.username}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="field-label">Email</label>
                          <input {...editForm.register("email")} type="email" className="input-field" />
                        </div>
                        <div>
                          <label className="field-label">Role</label>
                          <select {...editForm.register("role")} className="input-field">
                            <option value="viewer">Viewer</option>
                            <option value="data-entry">Data Entry</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div>
                          <label className="field-label">New Password (leave blank to keep)</label>
                          <input {...editForm.register("password")} type="password" className="input-field" placeholder="••••••" />
                        </div>
                        <div className="flex items-center gap-2 pt-5">
                          <input {...editForm.register("is_active")} type="checkbox" id={`active-${u.id}`} className="w-4 h-4" />
                          <label htmlFor={`active-${u.id}`} className="text-sm text-slate-700">Active account</label>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"><X className="w-4 h-4" /> Cancel</button>
                        <button type="submit" disabled={updateMutation.isPending} className="flex items-center gap-1 px-3 py-1.5 bg-purple-800 text-white rounded-lg text-sm font-medium disabled:opacity-60">
                          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm uppercase shrink-0">
                          {u.username[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{u.username}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                        {!u.is_active && <span className="text-xs text-slate-400">Inactive</span>}
                        <button onClick={() => startEdit(u)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><Edit2 className="w-4 h-4" /></button>
                        <button
                          onClick={() => { if (confirm(`Delete user "${u.username}"?`)) deleteMutation.mutate(u.id); }}
                          disabled={u.id === user?.id}
                          className="p-1.5 rounded hover:bg-red-50 text-red-400 disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
        </div>
      </div>
    </AppShell>
  );
}

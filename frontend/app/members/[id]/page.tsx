"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { AppShell } from "@/components/layout/AppShell";
import { ChevronLeft, Edit2, Save, X, Trash2, Upload, UserCircle2, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { hasRole } from "@/lib/auth";
import type { Member, Department } from "@/lib/types";

const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  dob: z.string().optional(),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  disability: z.string().optional(),
  join_date: z.string().optional(),
  status: z.enum(["active", "inactive", "visitor"]),
  membership_type: z.enum(["full", "associate"]).optional(),
  department_ids: z.array(z.number()).optional(),
});
type FormData = z.infer<typeof schema>;

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
  visitor: "bg-amber-100 text-amber-700",
};

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const canEdit = hasRole(user, "admin", "data-entry");
  const canDelete = hasRole(user, "admin");
  const [editing, setEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: member, isLoading } = useQuery<Member>({
    queryKey: ["member", id],
    queryFn: async () => {
      const { data } = await api.get(`/members/${id}`);
      return data;
    },
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await api.get("/departments");
      return data;
    },
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const startEditing = () => {
    if (!member) return;
    reset({
      first_name: member.first_name,
      last_name: member.last_name,
      dob: member.dob ?? "",
      gender: (member.gender as FormData["gender"]) ?? "",
      phone: member.phone ?? "",
      email: member.email ?? "",
      address: member.address ?? "",
      disability: member.disability ?? "",
      join_date: member.join_date ?? "",
      status: member.status,
      membership_type: (member.membership_type as FormData["membership_type"]) ?? "full",
      department_ids: member.departments?.map((d) => d.id) ?? [],
    });
    setEditing(true);
  };

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: updated } = await api.put(`/members/${id}`, {
        ...data,
        gender: data.gender || undefined,
      });
      return updated;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["member", id] });
      qc.invalidateQueries({ queryKey: ["members"] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/members/${id}`),
    onSuccess: () => router.push("/members"),
  });

  const photoMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("photo", file);
      const { data } = await api.post(`/members/${id}/photo`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["member", id] }),
  });

  const selectedDepts = watch("department_ids") ?? [];
  const toggleDept = (deptId: number) => {
    const current = watch("department_ids") ?? [];
    setValue(
      "department_ids",
      current.includes(deptId) ? current.filter((d) => d !== deptId) : [...current, deptId]
    );
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  if (!member) return null;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{member.full_name}</h1>
            <p className="text-slate-500 text-sm">{member.member_number}</p>
          </div>
          {canEdit && !editing && (
            <button onClick={startEditing} className="flex items-center gap-2 px-4 py-2 bg-purple-800 text-white rounded-lg text-sm font-medium hover:bg-purple-900">
              <Edit2 className="w-4 h-4" /> Edit
            </button>
          )}
          {canDelete && !editing && (
            <button
              onClick={() => { if (confirm("Delete this member?")) deleteMutation.mutate(); }}
              className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Photo card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col items-center gap-4 md:col-span-1">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-4 border-purple-50">
              {member.photo_url ? (
                <Image
                  src={member.photo_url}
                  alt={member.full_name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircle2 className="w-32 h-32 text-slate-300" />
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[member.status]}`}>
              {member.status}
            </span>
            {canEdit && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"
                >
                  {photoMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {member.photo_url ? "Change Photo" : "Upload Photo"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) photoMutation.mutate(file);
                  }}
                />
              </>
            )}
            <div className="text-center">
              <p className="text-xs text-slate-400">Member since</p>
              <p className="text-sm font-medium text-slate-700">
                {member.join_date ? new Date(member.join_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-2 space-y-5">
            {!editing ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h2 className="font-semibold text-slate-800 mb-4">Personal Details</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {[
                    ["Gender", member.gender ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1) : "—"],
                    ["Date of Birth", member.dob ? new Date(member.dob).toLocaleDateString("en-GB") : "—"],
                    ["Phone", member.phone || "—"],
                    ["Email", member.email || "—"],
                    ["Address", member.address || "—"],
                    ["Disability", member.disability || "None"],
                    ["Membership Type", member.membership_type === "associate" ? "Associate Member" : member.membership_type === "full" ? "Full Member" : "—"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-slate-400 text-xs mb-0.5">{label}</dt>
                      <dd className="text-slate-800 font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
                {member.departments && member.departments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-50">
                    <p className="text-xs text-slate-400 mb-2">Departments</p>
                    <div className="flex flex-wrap gap-2">
                      {member.departments.map((d) => (
                        <span key={d.id} className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                          {d.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
                <h2 className="font-semibold text-slate-800 mb-2">Edit Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">First Name *</label>
                    <input {...register("first_name")} className="input-field" />
                    {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
                  </div>
                  <div>
                    <label className="field-label">Last Name *</label>
                    <input {...register("last_name")} className="input-field" />
                  </div>
                  <div>
                    <label className="field-label">Date of Birth</label>
                    <input {...register("dob")} type="date" className="input-field" />
                  </div>
                  <div>
                    <label className="field-label">Gender</label>
                    <select {...register("gender")} className="input-field">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Phone</label>
                    <input {...register("phone")} type="tel" className="input-field" />
                  </div>
                  <div>
                    <label className="field-label">Email</label>
                    <input {...register("email")} type="email" className="input-field" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label">Address</label>
                    <textarea {...register("address")} rows={2} className="input-field resize-none" />
                  </div>
                  <div>
                    <label className="field-label">Disability</label>
                    <select {...register("disability")} className="input-field">
                      <option value="">None</option>
                      <option value="Physical">Physical</option>
                      <option value="Visual">Visual</option>
                      <option value="Hearing">Hearing</option>
                      <option value="Speech">Speech</option>
                      <option value="Intellectual">Intellectual</option>
                      <option value="Multiple">Multiple</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Join Date</label>
                    <input {...register("join_date")} type="date" className="input-field" />
                  </div>
                  <div>
                    <label className="field-label">Status</label>
                    <select {...register("status")} className="input-field">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="visitor">Visitor</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Membership Type</label>
                    <select {...register("membership_type")} className="input-field">
                      <option value="full">Full Member</option>
                      <option value="associate">Associate Member</option>
                    </select>
                  </div>
                </div>

                {departments && departments.length > 0 && (
                  <div>
                    <label className="field-label mb-2 block">Departments</label>
                    <div className="flex flex-wrap gap-2">
                      {departments.map((dept) => (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => toggleDept(dept.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                            selectedDepts.includes(dept.id)
                              ? "bg-purple-800 text-white border-purple-800"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {dept.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-800 text-white rounded-lg text-sm font-medium hover:bg-purple-900 disabled:opacity-60"
                  >
                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

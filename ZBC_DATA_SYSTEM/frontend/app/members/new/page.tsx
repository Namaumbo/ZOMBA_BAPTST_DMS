"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import Webcam from "react-webcam";
import { AppShell } from "@/components/layout/AppShell";
import {
  Camera,
  Upload,
  X,
  Loader2,
  ChevronLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  RefreshCw,
  Globe,
  Home,
} from "lucide-react";
import api from "@/lib/api";
import type { Department } from "@/lib/types";

const schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  dob: z.string().optional(),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  join_date: z.string().optional(),
  status: z.enum(["active", "inactive", "visitor"]),
  department_ids: z.array(z.number()).optional(),
  nationality_current: z.string().optional(),
  nationality_at_birth: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const BLANK_5 = (): string[] => ["", "", "", "", ""];

function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
  step,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  step: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-100 text-purple-800 shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-400 mb-0.5">
          Step {step}
        </p>
        <h2 className="text-base font-bold text-slate-800 leading-none">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function FieldWrap({
  label,
  required,
  error,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}
        {required && <span className="text-purple-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
          {error}
        </p>
      )}
    </div>
  );
}

export default function NewMemberPage() {
  const router = useRouter();
  const [photoMode, setPhotoMode] = useState<"none" | "webcam">("none");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Household name lists (5 slots each)
  const [zbcMembers12Plus, setZbcMembers12Plus] = useState<string[]>(BLANK_5());
  const [nonZbcMembers12Plus, setNonZbcMembers12Plus] = useState<string[]>(BLANK_5());
  const [childrenNurturedZbc, setChildrenNurturedZbc] = useState<string[]>(BLANK_5());
  const [childrenNurturedNoParents, setChildrenNurturedNoParents] = useState<string[]>(BLANK_5());

  const updateName = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => setter((prev) => prev.map((v, i) => (i === index ? value : v)));
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await api.get("/departments");
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "active", department_ids: [] },
  });

  const selectedDepts = watch("department_ids") ?? [];

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: created } = await api.post("/members", {
        ...formData,
        gender: formData.gender || undefined,
        household_zbc_members_12plus: zbcMembers12Plus.filter(Boolean),
        household_non_zbc_members_12plus: nonZbcMembers12Plus.filter(Boolean),
        children_nurtured_by_zbc: childrenNurturedZbc.filter(Boolean),
        children_nurtured_parents_not_zbc: childrenNurturedNoParents.filter(Boolean),
      });

      const photoFile = capturedPhoto
        ? new File([dataURLtoBlob(capturedPhoto)], "photo.jpg", { type: "image/jpeg" })
        : uploadedFile;

      if (photoFile) {
        const fd = new FormData();
        fd.append("photo", photoFile);
        await api.post(`/members/${created.id}/photo`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      return created;
    },
    onSuccess: (member) => {
      router.push(`/members/${member.id}`);
    },
  });

  const captureWebcam = useCallback(() => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) {
      setCapturedPhoto(screenshot);
      setPhotoMode("none");
    }
  }, []);

  const toggleDept = (id: number) => {
    const current = watch("department_ids") ?? [];
    setValue(
      "department_ids",
      current.includes(id) ? current.filter((d) => d !== id) : [...current, id]
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setUploadedFile(file);
      setCapturedPhoto(null);
    }
  };

  const photoPreview = capturedPhoto ?? (uploadedFile ? URL.createObjectURL(uploadedFile) : null);

  const inputClass =
    "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition bg-white";

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto pb-10">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Register New Member</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Fill in all details to create a new church membership record
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">

          {/* ── Step 1: Photo ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <SectionHeading icon={Camera} step={1} title="Member Photo" subtitle="Passport-style face photo" />

            {photoMode === "webcam" ? (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden border-2 border-purple-200">
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full"
                    videoConstraints={{ facingMode: "user" }}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={captureWebcam}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-800 hover:bg-purple-900 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                  >
                    <Camera className="w-4 h-4" /> Capture Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoMode("none")}
                    className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Preview */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  className={`relative flex-shrink-0 w-36 h-36 rounded-2xl overflow-hidden border-2 border-dashed transition ${
                    dragOver ? "border-purple-400 bg-purple-50" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  {photoPreview ? (
                    <>
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setCapturedPhoto(null); setUploadedFile(null); }}
                        className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-300">
                      <User className="w-10 h-10" />
                      <span className="text-[10px] font-medium">Drag & drop</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2.5 w-full">
                  <button
                    type="button"
                    onClick={() => setPhotoMode("webcam")}
                    className="flex items-center gap-2.5 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-purple-200 transition"
                  >
                    <Camera className="w-4 h-4 text-purple-600" />
                    Take Photo with Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2.5 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-purple-200 transition"
                  >
                    <Upload className="w-4 h-4 text-purple-600" />
                    Upload from Device
                  </button>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={() => { setCapturedPhoto(null); setUploadedFile(null); }}
                      className="flex items-center gap-2.5 px-4 py-2.5 border border-red-100 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Remove & Re-take
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) { setUploadedFile(file); setCapturedPhoto(null); }
                    }}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Accepted: JPG, PNG, WEBP · Max size 5 MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Step 2: Personal Details ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <SectionHeading icon={User} step={2} title="Personal Details" subtitle="Member's personal information" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldWrap label="First Name" required error={errors.first_name?.message}>
                <input
                  {...register("first_name")}
                  className={inputClass}
                  placeholder="e.g. Daelo"
                />
              </FieldWrap>

              <FieldWrap label="Last Name" required error={errors.last_name?.message}>
                <input
                  {...register("last_name")}
                  className={inputClass}
                  placeholder="e.g. Namaumbo"
                />
              </FieldWrap>

              <FieldWrap label="Date of Birth">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                  <input
                    {...register("dob")}
                    type="date"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </FieldWrap>

              <FieldWrap label="Gender">
                <select {...register("gender")} className={inputClass}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </FieldWrap>

              <FieldWrap label="Phone Number">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                  <input
                    {...register("phone")}
                    type="tel"
                    className={`${inputClass} pl-9`}
                    placeholder="+265 999 000 000"
                  />
                </div>
              </FieldWrap>

              <FieldWrap label="Email Address" error={errors.email?.message}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                  <input
                    {...register("email")}
                    type="email"
                    className={`${inputClass} pl-9`}
                    placeholder="email@example.com"
                  />
                </div>
              </FieldWrap>

              <FieldWrap label="Home Address" className="sm:col-span-2">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-300 pointer-events-none" />
                  <textarea
                    {...register("address")}
                    rows={2}
                    className={`${inputClass} pl-9 resize-none`}
                    placeholder="Street, Area, City"
                  />
                </div>
              </FieldWrap>
            </div>
          </div>

          {/* ── Step 3: Church Details ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <SectionHeading icon={Users} step={3} title="Church Details" subtitle="Membership status and ministry" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <FieldWrap label="Date Joined">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                  <input
                    {...register("join_date")}
                    type="date"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </FieldWrap>

              <FieldWrap label="Membership Status">
                <select {...register("status")} className={inputClass}>
                  <option value="active">✅ Active Member</option>
                  <option value="visitor">👋 Visitor</option>
                  <option value="inactive">⏸ Inactive</option>
                </select>
              </FieldWrap>
            </div>

            {departments && departments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Departments / Ministries
                </p>
                <div className="flex flex-wrap gap-2">
                  {departments.map((dept) => {
                    const active = selectedDepts.includes(dept.id);
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => toggleDept(dept.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                          active
                            ? "bg-purple-800 text-white border-purple-800 shadow-sm"
                            : "border-slate-200 text-slate-600 hover:border-purple-300 hover:bg-purple-50"
                        }`}
                      >
                        {active && <CheckCircle2 className="w-3 h-3" />}
                        {dept.name}
                      </button>
                    );
                  })}
                </div>
                {selectedDepts.length > 0 && (
                  <p className="text-xs text-purple-600 mt-2">
                    {selectedDepts.length} department{selectedDepts.length > 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Step 4: Nationality ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <SectionHeading icon={Globe} step={4} title="Nationality" subtitle="Member's citizenship information" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldWrap label="Current Nationality(ies)">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                  <input
                    {...register("nationality_current")}
                    className={`${inputClass} pl-9`}
                    placeholder="e.g. Malawian, British"
                  />
                </div>
              </FieldWrap>

              <FieldWrap label="Nationality at Birth">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                  <input
                    {...register("nationality_at_birth")}
                    className={`${inputClass} pl-9`}
                    placeholder="e.g. Malawian"
                  />
                </div>
              </FieldWrap>
            </div>
          </div>

          {/* ── Step 5: Household Members ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <SectionHeading
              icon={Home}
              step={5}
              title="Household Members"
              subtitle="Names of household and children in your care"
            />

            <div className="space-y-8">

              {/* 5a – ZBC members 12+ */}
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Household Members Aged 12 &amp; Above Who Are ZBC Members
                </p>
                <p className="text-[11px] text-slate-400 mb-3">Enter up to 5 names</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {zbcMembers12Plus.map((name, i) => (
                    <div key={i} className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-purple-400 select-none">
                        {i + 1}.
                      </span>
                      <input
                        value={name}
                        onChange={(e) => updateName(setZbcMembers12Plus, i, e.target.value)}
                        className={`${inputClass} pl-8`}
                        placeholder={`Full name ${i + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* 5b – Non-ZBC members 12+ */}
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Household Members Aged 12 &amp; Above Who Are <span className="text-red-500">NOT</span> ZBC Members
                </p>
                <p className="text-[11px] text-slate-400 mb-3">Enter up to 5 names</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {nonZbcMembers12Plus.map((name, i) => (
                    <div key={i} className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 select-none">
                        {i + 1}.
                      </span>
                      <input
                        value={name}
                        onChange={(e) => updateName(setNonZbcMembers12Plus, i, e.target.value)}
                        className={`${inputClass} pl-8`}
                        placeholder={`Full name ${i + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* 5c – Children <12 nurtured by ZBC */}
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Children Aged Under 12 In Your Care Who Receive Spiritual Nurture From ZBC
                </p>
                <p className="text-[11px] text-slate-400 mb-3">Enter up to 5 names</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {childrenNurturedZbc.map((name, i) => (
                    <div key={i} className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-purple-400 select-none">
                        {i + 1}.
                      </span>
                      <input
                        value={name}
                        onChange={(e) => updateName(setChildrenNurturedZbc, i, e.target.value)}
                        className={`${inputClass} pl-8`}
                        placeholder={`Child's full name ${i + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* 5d – Children nurtured by ZBC, parents NOT ZBC */}
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Children Receiving Nurture From ZBC Whose Parents Are <span className="text-red-500">NOT</span> ZBC Members
                </p>
                <p className="text-[11px] text-slate-400 mb-3">Enter up to 5 names</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {childrenNurturedNoParents.map((name, i) => (
                    <div key={i} className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 select-none">
                        {i + 1}.
                      </span>
                      <input
                        value={name}
                        onChange={(e) => updateName(setChildrenNurturedNoParents, i, e.target.value)}
                        className={`${inputClass} pl-8`}
                        placeholder={`Child's full name ${i + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ── Error ── */}
          {mutation.isError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-red-200 flex items-center justify-center text-red-600 text-[10px] font-bold">!</span>
              Failed to register member. Please check all fields and try again.
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="order-2 sm:order-1 px-6 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="order-1 sm:order-2 flex-1 sm:flex-none flex items-center justify-center gap-2 bg-purple-800 hover:bg-purple-900 disabled:opacity-60 text-white px-8 py-3 rounded-xl text-sm font-bold transition shadow-sm shadow-purple-200"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Member…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Register Member
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

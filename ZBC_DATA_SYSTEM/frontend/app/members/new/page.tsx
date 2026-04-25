"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import Webcam from "react-webcam";
import { AppShell } from "@/components/layout/AppShell";
import { Camera, Upload, X, Loader2, ChevronLeft } from "lucide-react";
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
});
type FormData = z.infer<typeof schema>;

function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

export default function NewMemberPage() {
  const router = useRouter();
  const [photoMode, setPhotoMode] = useState<"none" | "webcam" | "upload">("none");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
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

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Register Member</h1>
            <p className="text-slate-500 text-sm">Add a new church member</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-6"
        >
          {/* Photo capture */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Member Photo</h2>

            {photoMode === "webcam" && (
              <div className="space-y-3">
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full rounded-lg"
                  videoConstraints={{ facingMode: "user" }}
                />
                <div className="flex gap-3">
                  <button type="button" onClick={captureWebcam} className="flex-1 bg-blue-800 text-white py-2 rounded-lg text-sm font-medium">
                    Capture
                  </button>
                  <button type="button" onClick={() => setPhotoMode("none")} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {photoMode !== "webcam" && (
              <div className="flex flex-col items-center gap-4">
                {capturedPhoto || uploadedFile ? (
                  <div className="relative">
                    <img
                      src={capturedPhoto ?? (uploadedFile ? URL.createObjectURL(uploadedFile) : "")}
                      alt="Member photo"
                      className="w-32 h-32 object-cover rounded-full border-4 border-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => { setCapturedPhoto(null); setUploadedFile(null); }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-slate-300" />
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setPhotoMode("webcam")} className="flex items-center gap-2 text-sm px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <Camera className="w-4 h-4" /> Use Camera
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-sm px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <Upload className="w-4 h-4" /> Upload Photo
                  </button>
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
                </div>
              </div>
            )}
          </div>

          {/* Personal details */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Personal Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                <input {...register("first_name")} className="input-field" placeholder="First name" />
                {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                <input {...register("last_name")} className="input-field" placeholder="Last name" />
                {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                <input {...register("dob")} type="date" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                <select {...register("gender")} className="input-field">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input {...register("phone")} type="tel" className="input-field" placeholder="+265 999 000 000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input {...register("email")} type="email" className="input-field" placeholder="email@example.com" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <textarea {...register("address")} rows={2} className="input-field resize-none" placeholder="Home address" />
              </div>
            </div>
          </div>

          {/* Church details */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Church Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Join Date</label>
                <input {...register("join_date")} type="date" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select {...register("status")} className="input-field">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="visitor">Visitor</option>
                </select>
              </div>
            </div>

            {departments && departments.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Departments / Ministries</label>
                <div className="flex flex-wrap gap-2">
                  {departments.map((dept) => (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => toggleDept(dept.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        selectedDepts.includes(dept.id)
                          ? "bg-blue-800 text-white border-blue-800"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {dept.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {mutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              Failed to register member. Please try again.
            </div>
          )}

          <div className="flex gap-3 pb-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 sm:flex-none px-6 py-2.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 sm:flex-none bg-blue-800 hover:bg-blue-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Register Member"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

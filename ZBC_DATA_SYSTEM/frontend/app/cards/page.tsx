"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Church, Printer, CreditCard, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import api from "@/lib/api";
import type { Member } from "@/lib/types";

const CHURCH_URL = "https://www.zombabaptistchurch.org";

const PURPLE = "linear-gradient(135deg, #5b1a8a 0%, #7c3aed 100%)";
const GOLD   = "#92400e";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: "4.5pt", color: "#1e1b4b", textTransform: "uppercase", lineHeight: 1.2 }}>
        {label}:
      </div>
      <div style={{ fontSize: "5pt", color: "#374151", lineHeight: 1.3 }}>{value}</div>
    </div>
  );
}

function MemberCard({
  member,
  issueDate,
  expiryDate,
}: {
  member: Member;
  issueDate: string;
  expiryDate: string;
}) {
  const fellowship =
    member.departments && member.departments.length > 0
      ? member.departments.map((d) => d.name).join(", ")
      : "—";

  const membershipLabel =
    member.membership_type === "associate" ? "ASSOCIATE" : "FULL MEMBER";

  const dob = member.dob
    ? new Date(member.dob + "T00:00:00").toLocaleDateString("en-GB")
    : "—";

  const gender = member.gender
    ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1)
    : "—";

  return (
    <div
      style={{
        width: "85.60mm",
        height: "53.98mm",
        borderRadius: "3mm",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, Helvetica, sans-serif",
        pageBreakInside: "avoid",
        breakInside: "avoid",
        boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          background: PURPLE,
          padding: "1.5mm 2mm",
          display: "flex",
          alignItems: "center",
          gap: "1.5mm",
          flexShrink: 0,
        }}
      >
        {/* Circular gold logo */}
        <div
          style={{
            width: "12mm",
            height: "12mm",
            borderRadius: "50%",
            background: "linear-gradient(145deg, #b45309, #f59e0b, #d97706)",
            border: "0.5mm solid #fde68a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 3mm rgba(253,230,138,0.5)",
          }}
        >
          <Church style={{ width: "7mm", height: "7mm", color: "white" }} />
        </div>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "white", fontWeight: 900, fontSize: "8.5pt", letterSpacing: "0.5px", lineHeight: 1.1 }}>
            MEMBERSHIP CARD
          </div>
          <div style={{ color: "#e9d5ff", fontSize: "5.5pt", fontWeight: 700, lineHeight: 1.2 }}>
            ZOMBA BAPTIST CHURCH
          </div>
          <div style={{ color: "#c4b5fd", fontSize: "4pt", fontStyle: "italic", lineHeight: 1.2 }}>
            To Serve and to Give
          </div>
        </div>

        {/* ID number */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ color: "#c4b5fd", fontSize: "4pt", lineHeight: 1.2 }}>ID NO:</div>
          <div style={{ color: "white", fontSize: "5.5pt", fontWeight: 800, letterSpacing: "0.3px", lineHeight: 1.2 }}>
            {member.member_number}
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, background: "white", display: "flex", position: "relative", overflow: "hidden" }}>

        {/* World-map watermark (blob continents) */}
        <svg
          viewBox="0 0 200 120"
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "40%",
            transform: "translate(-50%,-50%)",
            width: "70%",
            height: "70%",
            opacity: 0.05,
            pointerEvents: "none",
          }}
        >
          {/* simplified continent blobs */}
          <ellipse cx="40"  cy="35" rx="28" ry="20" fill="#4c1d95" />
          <ellipse cx="55"  cy="55" rx="22" ry="16" fill="#4c1d95" />
          <ellipse cx="95"  cy="28" rx="30" ry="22" fill="#4c1d95" />
          <ellipse cx="90"  cy="62" rx="20" ry="13" fill="#4c1d95" />
          <ellipse cx="148" cy="38" rx="26" ry="19" fill="#4c1d95" />
          <ellipse cx="152" cy="68" rx="18" ry="12" fill="#4c1d95" />
          <ellipse cx="28"  cy="75" rx="14" ry="10" fill="#4c1d95" />
        </svg>

        {/* Left column: type + info grid */}
        <div
          style={{
            flex: 1,
            padding: "1.5mm 1mm 1mm 2mm",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {/* Membership type — large gold bold text */}
          <div
            style={{
              color: GOLD,
              fontWeight: 900,
              fontSize: "10pt",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              lineHeight: 1.1,
              marginBottom: "1.2mm",
            }}
          >
            {membershipLabel}
          </div>

          {/* 2-column info grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.8mm 1.5mm",
              flex: 1,
            }}
          >
            <Field label="DOB"        value={dob} />
            <Field label="Issued"     value={issueDate} />
            <Field label="Gender"     value={gender} />
            <Field label="Expiry"     value={expiryDate} />
            <div style={{ gridColumn: "span 2" }}>
              <Field label="Fellowship" value={fellowship} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <Field label="Contact"  value={member.phone || "—"} />
            </div>
          </div>
        </div>

        {/* Right column: QR code (where the face/photo was) */}
        <div
          style={{
            width: "23mm",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5mm 2mm 1.5mm 0",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              border: "0.5mm solid #7c3aed",
              borderRadius: "1mm",
              padding: "0.8mm",
              background: "white",
              boxShadow: "0 0.5mm 3mm rgba(109,40,217,0.2)",
            }}
          >
            <QRCodeSVG
              value={CHURCH_URL}
              size={68}
              bgColor="#ffffff"
              fgColor="#3b0764"
              level="M"
              style={{ display: "block", width: "18mm", height: "18mm" }}
            />
          </div>
          <div style={{ fontSize: "3.5pt", color: "#6b7280", marginTop: "0.8mm", textAlign: "center", lineHeight: 1.3 }}>
            Scan to visit
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div
        style={{
          background: PURPLE,
          padding: "1.2mm 2mm",
          display: "flex",
          alignItems: "center",
          gap: "2mm",
          flexShrink: 0,
        }}
      >
        {/* White signature box */}
        <div
          style={{
            flex: 1,
            background: "white",
            borderRadius: "0.5mm",
            height: "7mm",
            display: "flex",
            alignItems: "flex-end",
            padding: "0.5mm 1.5mm",
          }}
        >
          <span style={{ fontSize: "3.5pt", color: "#9ca3af" }}>Pastor&apos;s Signature</span>
        </div>

        {/* Member name */}
        <div style={{ textAlign: "right", flexShrink: 0, maxWidth: "32mm" }}>
          <div
            style={{
              color: "white",
              fontWeight: 900,
              fontSize: "6pt",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              lineHeight: 1.3,
            }}
          >
            {member.full_name}
          </div>
        </div>
      </div>
    </div>
  );
}

const PRINT_STYLES = `
@media print {
  body > * { display: none !important; }
  #card-print-root { display: block !important; position: fixed; inset: 0; background: white; z-index: 99999; }
  @page { margin: 8mm; size: A4; }
}
#card-print-root { display: none; }
`;

export default function CardGenerationPage() {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [issueDate, setIssueDate] = useState("2026-04-01");
  const [expiryDate, setExpiryDate] = useState("2027-04-30");
  const [cards, setCards] = useState<Member[]>([]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.get<Member[]>("/members/cards", {
        params: { from_id: Number(fromId), to_id: Number(toId) },
      });
      return data;
    },
    onSuccess: (data) => setCards(data),
  });

  const handlePrint = () => {
    const root = document.getElementById("card-print-root");
    if (root) {
      root.style.display = "block";
      window.print();
      root.style.display = "none";
    }
  };

  const issueDateFormatted = issueDate
    ? new Date(issueDate + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const expiryDateFormatted = expiryDate
    ? new Date(expiryDate + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <AppShell>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-6 h-6 text-purple-700" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Card Generation</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Generate and print membership cards for a range of members
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4 text-sm">Generation Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                From Member ID
              </label>
              <input
                type="number"
                min="1"
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                placeholder="e.g. 1"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                To Member ID
              </label>
              <input
                type="number"
                min="1"
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                placeholder="e.g. 50"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Date of Issue
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => mutation.mutate()}
              disabled={!fromId || !toId || mutation.isPending}
              className="flex items-center gap-2 bg-purple-800 hover:bg-purple-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-50"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Generate Cards
            </button>

            {cards.length > 0 && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-5 py-2.5 rounded-xl transition"
              >
                <Printer className="w-4 h-4" />
                Print {cards.length} Card{cards.length !== 1 ? "s" : ""}
              </button>
            )}
          </div>

          {mutation.isError && (
            <p className="text-red-500 text-sm mt-3">
              Failed to load members. Check the ID range and try again.
            </p>
          )}
        </div>

        {/* Preview area */}
        {cards.length > 0 ? (
          <div>
            <p className="text-sm text-slate-500 mb-4">
              Showing {cards.length} card{cards.length !== 1 ? "s" : ""} — preview below
            </p>
            <div className="flex flex-wrap gap-4">
              {cards.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  issueDate={issueDateFormatted}
                  expiryDate={expiryDateFormatted}
                />
              ))}
            </div>
          </div>
        ) : (
          !mutation.isPending && (
            <div className="text-center py-16 text-slate-400">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Enter a member ID range and click Generate Cards</p>
              <p className="text-xs mt-1 text-slate-300">
                You can find member IDs by viewing a member record (ID shown in the URL)
              </p>
            </div>
          )
        )}
      </div>

      {/* Hidden print-only area */}
      <div id="card-print-root">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4mm", padding: "0" }}>
          {cards.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              issueDate={issueDateFormatted}
              expiryDate={expiryDateFormatted}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { ImageUploadField } from "@/components/ImageUploadField";
import { BiometricScanner } from "@/components/BiometricScanner";
import { DEPARTMENTS } from "@/constants/departments";

type AdminStudent = {
  usn: string;
  fullName: string;
  email: string | null;
  program: string | null;
  section: string | null;
  phoneNumber: string | null;
  biometricId: string | null;
  hallRoom: string | null;
  seatNumber: string | null;
  hallTicket: string | null;
  profileImageUrl?: string | null;
};

type AdminTeacher = {
  username: string;
  fullName: string;
  email: string | null;
  department: string;
  profileImageUrl: string | null;
};

export function ExamAdminDesk() {
  const [invigCsv, setInvigCsv] = useState(
    [
      "Hall A-101,Dr. A. Verma,https://atria.edu/averma",
      "Hall B-204,Prof. B. Rao,https://atria.edu/brao",
      "Hall C-305,,https://atria.edu",
    ].join("\n")
  );
  const [stuCsv, setStuCsv] = useState(
    [
      "USN,Name,Email,Program,Section,Hall,SeatNumber,HallTicket,Barcode,Phone,Biometric",
      "21CS099,Sample Student,sample@atria.edu,CSE,A,Hall A-101,A12,HT-21CS099,ANS-21CS099,+919876543210,BIOMETRIC-001",
      "21CS100,Another Student,other@atria.edu,CSE,B,Hall B-204,B18,HT-21CS100,ANS-21CS100,+919876543211,BIOMETRIC-002",
    ].join("\n")
  );
  const [stuPassword, setStuPassword] = useState("demo123");
  const [replacePool, setReplacePool] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [studentRows, setStudentRows] = useState<AdminStudent[]>([]);
  const [teacherRows, setTeacherRows] = useState<AdminTeacher[]>([]);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [studentEdit, setStudentEdit] = useState<Partial<AdminStudent> | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<string | null>(null);
  const [teacherEdit, setTeacherEdit] = useState<Partial<AdminTeacher> | null>(null);

  const [sUsn, setSUsn] = useState("");
  const [sName, setSName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sProgram, setSProgram] = useState("");
  const [sSection, setSSection] = useState("");
  const [sPhone, setSPhone] = useState("");
  const [sBiometric, setSBiometric] = useState("");
  const [kycScanFor, setKycScanFor] = useState<string | null>(null);
  const [sHall, setSHall] = useState("");
  const [sSeatNumber, setSSeatNumber] = useState("");
  const [sTicket, setSTicket] = useState("");
  const [sBarcode, setSBarcode] = useState("");
  const [sPhoto, setSPhoto] = useState("");
  const [sPass, setSPass] = useState("demo123");
  const [isScanningBiometric, setIsScanningBiometric] = useState(false);

  const [tUser, setTUser] = useState("TCH-Teacher");
  const [tPass, setTPass] = useState("demo123");
  const [tName, setTName] = useState("Prof. New Teacher");
  const [tDept, setTDept] = useState("Computer Science & Engineering");
  const [tDeptPick, setTDeptPick] = useState("Computer Science & Engineering");
  const [tImg, setTImg] = useState("");
  const [tEmail, setTEmail] = useState("");

  async function loadRegistry() {
    const [studentsRes, teachersRes] = await Promise.all([
      fetch("/api/admin/students"),
      fetch("/api/admin/teachers"),
    ]);

    if (studentsRes.ok) {
      const data = (await studentsRes.json()) as { students: AdminStudent[] };
      setStudentRows(data.students);
    }
    if (teachersRes.ok) {
      const data = (await teachersRes.json()) as { teachers: AdminTeacher[] };
      setTeacherRows(data.teachers);
    }
  }

  useEffect(() => {
    void loadRegistry();
  }, []);

  function startStudentEdit(student: AdminStudent) {
    setEditingStudent(student.usn);
    setStudentEdit(student);
    setMessage(null);
  }

  function cancelStudentEdit() {
    setEditingStudent(null);
    setStudentEdit(null);
  }

  function updateStudentEdit(field: keyof AdminStudent, value: string | null) {
    setStudentEdit((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveStudentEdit() {
    if (!editingStudent || !studentEdit) return;
    setBusy(true);
    setMessage(null);

    const res = await fetch("/api/admin/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usn: editingStudent,
        fullName: studentEdit.fullName?.trim() || "",
        email: studentEdit.email?.trim() || "",
        program: studentEdit.program?.trim() || undefined,
        section: studentEdit.section?.trim() || undefined,
        phoneNumber: studentEdit.phoneNumber?.trim() || undefined,
        biometricId: studentEdit.biometricId?.trim() || undefined,
        hallRoom: studentEdit.hallRoom?.trim() || undefined,
        seatNumber: studentEdit.seatNumber?.trim() || undefined,
        hallTicket: studentEdit.hallTicket?.trim() || undefined,
        profileImageUrl: studentEdit.profileImageUrl || undefined,
      }),
    });

    const json = (await res.json()) as { ok?: boolean; error?: string; message?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage(json.error ?? "Could not update student");
      return;
    }

    setMessage(json.message ?? `Updated ${editingStudent}`);
    setEditingStudent(null);
    setStudentEdit(null);
    void loadRegistry();
  }

  function startTeacherEdit(teacher: AdminTeacher) {
    setEditingTeacher(teacher.username);
    setTeacherEdit(teacher);
    setMessage(null);
  }

  function cancelTeacherEdit() {
    setEditingTeacher(null);
    setTeacherEdit(null);
  }

  function updateTeacherEdit(field: keyof AdminTeacher, value: string | null) {
    setTeacherEdit((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveTeacherEdit() {
    if (!editingTeacher || !teacherEdit) return;
    setBusy(true);
    setMessage(null);

    const res = await fetch("/api/admin/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: editingTeacher,
        fullName: teacherEdit.fullName?.trim() || "",
        department: teacherEdit.department?.trim() || "",
        email: teacherEdit.email?.trim() || undefined,
        profileImageUrl: teacherEdit.profileImageUrl || undefined,
      }),
    });

    const json = (await res.json()) as { ok?: boolean; error?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage(json.error ?? "Could not update teacher");
      return;
    }

    setMessage(`Updated ${editingTeacher}`);
    setEditingTeacher(null);
    setTeacherEdit(null);
    void loadRegistry();
  }

  async function createStudent(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usn: sUsn.trim(),
        fullName: sName.trim(),
        email: sEmail.trim(),
        program: sProgram.trim() || undefined,
        section: sSection.trim() || undefined,
        hallRoom: sHall.trim() || undefined,
        seatNumber: sSeatNumber.trim() || undefined,
        hallTicket: sTicket.trim() || undefined,
        barcode: sBarcode.trim() || undefined,
        profileImageUrl: sPhoto || undefined,
        phoneNumber: sPhone.trim() || undefined,
        biometricId: sBiometric.trim() || undefined,
        password: sPass,
      }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string; message?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage(json.error ?? "Could not create student login");
      return;
    }
    setMessage(json.message ?? `Student login created for ${sUsn}`);
    setSUsn("");
    setSName("");
    setSEmail("");
    setSProgram("");
    setSSection("");
    setSPhone("");
    setSBiometric("");
    setSSeatNumber("");
    setSHall("");
    setSTicket("");
    setSBarcode("");
    setSPhoto("");
    void loadRegistry();
  }

  async function saveKycFor(usn: string, biometricVal: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/students/biometric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usn, biometricId: biometricVal }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok) {
        setMessage(json?.error ?? "Could not save biometric");
        setBusy(false);
        return;
      }
      // update local rows
      setStudentRows((rows) => rows.map((r) => (r.usn === usn ? { ...r, biometricId: biometricVal } : r)));
      setMessage(`KYC saved for ${usn}`);
    } catch (e) {
      setMessage("Could not save biometric");
    } finally {
      setBusy(false);
      setKycScanFor(null);
    }
  }

  async function uploadInvigilation() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/invigilation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: invigCsv, replace: replacePool }),
    });
    const json = (await res.json()) as { imported?: number; error?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage(json.error ?? "Upload failed");
      return;
    }
    setMessage(`Imported ${json.imported} invigilation rows.`);
  }

  async function uploadStudents() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/students-bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: stuCsv, password: stuPassword }),
    });
    const json = (await res.json()) as { imported?: number; error?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage(json.error ?? "Upload failed");
      return;
    }
    const warn = (json as { warnings?: string[] }).warnings;
    setMessage(
      `Imported ${json.imported} students.${warn?.length ? ` ${warn.length} warning(s)—see console.` : ""}`
    );
    if (warn?.length) console.warn("Bulk import warnings:", warn);
    void loadRegistry();
  }

  async function createTeacher(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: tUser,
        password: tPass,
        fullName: tName,
        department: tDept,
        email: tEmail.trim() || undefined,
        profileImageUrl: tImg || undefined,
      }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage(json.error ?? "Could not create teacher");
      return;
    }
    setMessage("Teacher account created.");
    void loadRegistry();
  }

  async function resetDraws() {
    if (!window.confirm("Release all claimed halls so teachers can spin again?")) return;
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/reset-invigilation", { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      setMessage("Reset failed");
      return;
    }
    setMessage("All hall draws cleared (teachers can spin again).");
  }

  const inputClass =
    "neu-input w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand-teal)]";

  return (
    <DashboardShell
      title="Examination section"
      subtitle="Publish seating, invigilation pools, and manage logins"
    >
      {message ? (
        <p className="neu-panel mb-6 px-4 py-3 text-center text-sm text-[var(--brand-teal)]">{message}</p>
      ) : null}

      <section className="neu-panel mb-8 p-6">
        <h2 className="text-lg font-bold text-[var(--brand-maroon)]">Create student login</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Add a new student with USN (login username), name, biometric ID, program, hall details, and answer-sheet barcode.
        </p>
        <form onSubmit={createStudent} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">USN (User ID) *</span>
            <input className={inputClass} value={sUsn} onChange={(e) => setSUsn(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Full name *</span>
            <input className={inputClass} value={sName} onChange={(e) => setSName(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Email * (for login &amp; forgot password)</span>
            <input
              type="email"
              className={inputClass}
              value={sEmail}
              onChange={(e) => setSEmail(e.target.value)}
              placeholder="student@atria.edu"
              required
            />
          </label>
          <div className="sm:col-span-2">
            <ImageUploadField
              label="Student photo (shown on student portal)"
              value={sPhoto}
              onChange={setSPhoto}
              disabled={busy}
            />
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Program / branch</span>
            <input
              className={inputClass}
              value={sProgram}
              onChange={(e) => setSProgram(e.target.value)}
              placeholder="e.g. CSE"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Section</span>
            <input
              className={inputClass}
              value={sSection}
              onChange={(e) => setSSection(e.target.value)}
              placeholder="e.g. A"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Phone number</span>
            <input
              className={inputClass}
              value={sPhone}
              onChange={(e) => setSPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Biometric scan *</span>
            <input
              className={inputClass}
              value={sBiometric}
              onChange={(e) => setSBiometric(e.target.value)}
              placeholder="Use biometric scanner to capture the value"
              required
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="neu-btn rounded-xl px-3 py-2 text-xs"
                onClick={() => setIsScanningBiometric(true)}
              >
                Scan biometric
              </button>
              <span className="text-xs text-[var(--text-muted)]">
                Scan with a connected keyboard wedge or use device fingerprint.
              </span>
            </div>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Password</span>
            <input
              type="password"
              className={inputClass}
              value={sPass}
              onChange={(e) => setSPass(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Hall room</span>
            <input
              className={inputClass}
              value={sHall}
              onChange={(e) => setSHall(e.target.value)}
              placeholder="Hall A-101"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Seat number</span>
            <input
              className={inputClass}
              value={sSeatNumber}
              onChange={(e) => setSSeatNumber(e.target.value)}
              placeholder="A12"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Hall ticket number</span>
            <input
              className={inputClass}
              value={sTicket}
              onChange={(e) => setSTicket(e.target.value)}
              placeholder="HT-USN"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Answer sheet barcode</span>
            <input
              className={inputClass}
              value={sBarcode}
              onChange={(e) => setSBarcode(e.target.value)}
              placeholder="ANS-USN"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="login-btn rounded-xl px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2"
          >
            Create student login
          </button>
        </form>
      </section>

      <section className="neu-panel mb-8 p-6">
        <h2 className="text-lg font-semibold">Invigilation pool (Hall, Teacher label)</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          One row per assignment. Use comma or tab-separated columns: <code className="font-mono">HallRoom,Teacher Name,Teacher Website</code>. The draw will assign teachers randomly to open halls.
        </p>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={replacePool} onChange={(e) => setReplacePool(e.target.checked)} />
          Replace existing pool
        </label>
        <textarea
          className={`${inputClass} mt-3 h-36 font-mono text-xs`}
          value={invigCsv}
          onChange={(e) => setInvigCsv(e.target.value)}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void uploadInvigilation()}
            className="login-btn rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Upload invigilation sheet
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void resetDraws()}
            className="neu-btn rounded-xl px-4 py-2 text-sm font-semibold text-[var(--text-muted)] disabled:opacity-50"
          >
            Reset teacher draws
          </button>
        </div>
      </section>

      <section className="neu-panel mb-8 p-6">
        <h2 className="text-lg font-semibold">Bulk student upload</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Columns: <code className="font-mono">USN,Name,Email,Program,Section,Hall,SeatNumber,HallTicket,Barcode,Phone,Biometric</code> (quoted fields allowed)
        </p>
        <label className="mt-4 flex flex-col gap-1 text-sm">
          <span className="font-medium">Default password for bulk import</span>
          <input className={inputClass} value={stuPassword} onChange={(e) => setStuPassword(e.target.value)} />
        </label>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Example row: <code className="font-mono">21CS099,Sample Student,sample@atria.edu,A,Hall A-101,HT-21CS099,ANS-21CS099</code>
        </p>
        <textarea
          className={`${inputClass} mt-3 h-36 font-mono text-xs`}
          value={stuCsv}
          onChange={(e) => setStuCsv(e.target.value)}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void uploadStudents()}
          className="login-btn mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Upload students (bulk)
        </button>
      </section>

      <section className="neu-panel p-6">
        <h2 className="text-lg font-semibold">Create teacher login</h2>
        <form onSubmit={createTeacher} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Username
            <input className={inputClass} value={tUser} onChange={(e) => setTUser(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Password
            <input
              type="password"
              className={inputClass}
              value={tPass}
              onChange={(e) => setTPass(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Full name
            <input className={inputClass} value={tName} onChange={(e) => setTName(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Email (optional, for forgot password)
            <input
              type="email"
              className={inputClass}
              value={tEmail}
              onChange={(e) => setTEmail(e.target.value)}
              placeholder="teacher@atria.edu"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Choose department
            <select
              className={inputClass}
              value={tDeptPick}
              onChange={(e) => {
                setTDeptPick(e.target.value);
                setTDept(e.target.value);
              }}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Department (editable)
            <input className={inputClass} value={tDept} onChange={(e) => setTDept(e.target.value)} required />
          </label>
          <div className="sm:col-span-2">
            <ImageUploadField
              label="Teacher profile photo"
              value={tImg}
              onChange={setTImg}
              disabled={busy}
            />
          </div>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Or paste image URL
            <input
              className={inputClass}
              value={tImg}
              onChange={(e) => setTImg(e.target.value)}
              placeholder="/uploads/… or https://…"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="neu-btn rounded-xl px-4 py-2 text-sm font-semibold sm:col-span-2"
          >
            Create teacher
          </button>
        </form>
      </section>

      {studentRows.length > 0 ? (
        <section className="neu-panel mb-8 p-6">
          <h2 className="text-lg font-semibold">Student section roster</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Students are grouped by section and include seating, phone number, and biometric registration.
          </p>
          {Object.entries(
            studentRows.reduce<Record<string, AdminStudent[]>>((acc, student) => {
              const key = student.section || "Unassigned";
              acc[key] = [...(acc[key] || []), student];
              return acc;
            }, {})
          ).map(([section, students]) => (
            <div key={section} className="mt-6 rounded-3xl border border-[var(--neu-shadow)] bg-[var(--surface)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-md font-semibold">Section {section}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{students.length} students</p>
                </div>
                <a
                  href={`/api/admin/students/section-roster?section=${encodeURIComponent(section)}`}
                  className="neu-btn rounded-xl px-3 py-2 text-sm"
                >
                  Download Excel
                </a>
              </div>
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full divide-y divide-[var(--neu-shadow)] text-sm">
                  <thead className="bg-[var(--surface)]/80">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">USN</th>
                      <th className="px-3 py-2 text-left font-medium">Name</th>
                      <th className="px-3 py-2 text-left font-medium">Section</th>
                      <th className="px-3 py-2 text-left font-medium">KYC</th>
                      <th className="px-3 py-2 text-left font-medium">Program</th>
                      <th className="px-3 py-2 text-left font-medium">Email</th>
                      <th className="px-3 py-2 text-left font-medium">Phone</th>
                      <th className="px-3 py-2 text-left font-medium">Biometric scan</th>
                      <th className="px-3 py-2 text-left font-medium">Hall</th>
                      <th className="px-3 py-2 text-left font-medium">Seat</th>
                      <th className="px-3 py-2 text-left font-medium">Hall ticket</th>
                      <th className="px-3 py-2 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--neu-shadow)]">
                    {students.map((student) => (
                      <tr key={student.usn}>
                        <td className="px-3 py-2 font-mono text-xs">{student.usn}</td>
                        <td className="px-3 py-2">
                          {editingStudent === student.usn ? (
                            <input
                              className="neu-input w-full rounded-xl border px-2 py-1 text-xs"
                              value={studentEdit?.fullName ?? ""}
                              onChange={(e) => updateStudentEdit("fullName", e.target.value)}
                            />
                          ) : (
                            student.fullName
                          )}
                        </td>
                        <td className="px-3 py-2">
                            {editingStudent === student.usn ? (
                            <input
                              className="neu-input w-full rounded-xl border px-2 py-1 text-xs"
                              value={studentEdit?.section ?? ""}
                              onChange={(e) => updateStudentEdit("section", e.target.value)}
                            />
                          ) : (
                            student.section ?? "—"
                          )}
                        </td>
                          <td className="px-3 py-2">
                            {student.biometricId ? (
                              <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">Verified</span>
                            ) : (
                              <button
                                type="button"
                                className="neu-btn rounded-xl px-2 py-1 text-xs"
                                onClick={() => setKycScanFor(student.usn)}
                              >
                                Verify KYC
                              </button>
                            )}
                          </td>
                        <td className="px-3 py-2">
                          {editingStudent === student.usn ? (
                            <input
                              className="neu-input w-full rounded-xl border px-2 py-1 text-xs"
                              value={studentEdit?.program ?? ""}
                              onChange={(e) => updateStudentEdit("program", e.target.value)}
                            />
                          ) : (
                            student.program ?? "—"
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {editingStudent === student.usn ? (
                            <input
                              className="neu-input w-full rounded-xl border px-2 py-1 text-xs"
                              value={studentEdit?.email ?? ""}
                              onChange={(e) => updateStudentEdit("email", e.target.value)}
                            />
                          ) : (
                            student.email ?? "—"
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {editingStudent === student.usn ? (
                            <input
                              className="neu-input w-full rounded-xl border px-2 py-1 text-xs"
                              value={studentEdit?.phoneNumber ?? ""}
                              onChange={(e) => updateStudentEdit("phoneNumber", e.target.value)}
                            />
                          ) : (
                            student.phoneNumber ?? "—"
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {editingStudent === student.usn ? (
                            <input
                              className="neu-input w-full rounded-xl border px-2 py-1 text-xs"
                              value={studentEdit?.biometricId ?? ""}
                              onChange={(e) => updateStudentEdit("biometricId", e.target.value)}
                            />
                          ) : (
                            student.biometricId ?? "—"
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {editingStudent === student.usn ? (
                            <input
                              className="neu-input w-full rounded-xl border px-2 py-1 text-xs"
                              value={studentEdit?.hallRoom ?? ""}
                              onChange={(e) => updateStudentEdit("hallRoom", e.target.value)}
                            />
                          ) : (
                            student.hallRoom ?? "—"
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {editingStudent === student.usn ? (
                            <input
                              className="neu-input w-full rounded-xl border px-2 py-1 text-xs"
                              value={studentEdit?.seatNumber ?? ""}
                              onChange={(e) => updateStudentEdit("seatNumber", e.target.value)}
                            />
                          ) : (
                            student.seatNumber ?? "—"
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {editingStudent === student.usn ? (
                            <input
                              className="neu-input w-full rounded-xl border px-2 py-1 text-xs"
                              value={studentEdit?.hallTicket ?? ""}
                              onChange={(e) => updateStudentEdit("hallTicket", e.target.value)}
                            />
                          ) : (
                            student.hallTicket ?? "—"
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {editingStudent === student.usn ? (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={saveStudentEdit}
                                className="login-btn rounded-xl px-3 py-1 text-xs text-white disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={cancelStudentEdit}
                                className="neu-btn rounded-xl px-3 py-1 text-xs font-semibold text-[var(--text-muted)] disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startStudentEdit(student)}
                              className="neu-btn rounded-xl px-3 py-1 text-xs font-semibold text-[var(--text-muted)]"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {teacherRows.length > 0 ? (
        <section className="neu-panel mb-8 p-6">
          <h2 className="text-lg font-semibold">Teacher registry</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            A quick view of the registered exam teachers and their departments.
          </p>
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full divide-y divide-[var(--neu-shadow)] text-sm">
              <thead className="bg-[var(--surface)]/80">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Username</th>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Department</th>
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">Photo</th>
                  <th className="px-3 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neu-shadow)]">
                {teacherRows.map((teacher) => (
                  <tr key={teacher.username}>
                    <td className="px-3 py-2 font-mono text-xs">{teacher.username}</td>
                    <td className="px-3 py-2">
                      {editingTeacher === teacher.username ? (
                        <input
                          className="neu-input w-full rounded-xl border px-2 py-1 text-xs"
                          value={teacherEdit?.fullName ?? ""}
                          onChange={(e) => updateTeacherEdit("fullName", e.target.value)}
                        />
                      ) : (
                        teacher.fullName
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editingTeacher === teacher.username ? (
                        <input
                          className="neu-input w-full rounded-xl border px-2 py-1 text-xs"
                          value={teacherEdit?.department ?? ""}
                          onChange={(e) => updateTeacherEdit("department", e.target.value)}
                        />
                      ) : (
                        teacher.department
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editingTeacher === teacher.username ? (
                        <input
                          className="neu-input w-full rounded-xl border px-2 py-1 text-xs"
                          value={teacherEdit?.email ?? ""}
                          onChange={(e) => updateTeacherEdit("email", e.target.value)}
                        />
                      ) : (
                        teacher.email ?? "—"
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editingTeacher === teacher.username ? (
                        <input
                          className="neu-input w-full rounded-xl border px-2 py-1 text-xs"
                          value={teacherEdit?.profileImageUrl ?? ""}
                          onChange={(e) => updateTeacherEdit("profileImageUrl", e.target.value)}
                          placeholder="Photo URL"
                        />
                      ) : teacher.profileImageUrl ? (
                        <img
                          src={teacher.profileImageUrl}
                          alt={teacher.fullName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">No photo</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editingTeacher === teacher.username ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={saveTeacherEdit}
                            className="login-btn rounded-xl px-3 py-1 text-xs text-white disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={cancelTeacherEdit}
                            className="neu-btn rounded-xl px-3 py-1 text-xs font-semibold text-[var(--text-muted)] disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startTeacherEdit(teacher)}
                          className="neu-btn rounded-xl px-3 py-1 text-xs font-semibold text-[var(--text-muted)]"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      {kycScanFor ? (
        <BiometricScanner
          prompt="Scan student's biometric for KYC (scanner or device fingerprint)."
          onCaptured={(val) => {
            void saveKycFor(kycScanFor, val);
          }}
          onClose={() => setKycScanFor(null)}
        />
      ) : null}
      {isScanningBiometric ? (
        <BiometricScanner
          prompt="Scan biometric for the new student login."
          onCaptured={(val) => {
            setSBiometric(val);
            setIsScanningBiometric(false);
          }}
          onClose={() => setIsScanningBiometric(false)}
        />
      ) : null}
    </DashboardShell>
  );
}

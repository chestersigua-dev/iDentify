'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  EnrollmentApplication,
  enrollmentApi,
  AcademicSection,
  UserAccount,
  Student,
  getSchoolEnabledGrades,
} from '@/lib/api';
import { useTenant } from '@/lib/tenant-context';
import {
  FileText,
  UserCheck,
  UserX,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Eye,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  GraduationCap,
  Calendar,
  Phone,
  MapPin,
  ExternalLink,
  ChevronRight,
  X,
  RefreshCw,
  PlusCircle,
  Tag,
} from 'lucide-react';

interface EnrollmentManagementViewProps {
  sections: AcademicSection[];
  currentUser?: UserAccount | null;
  onRefreshStudents?: () => void;
  onRosterRefresh?: () => void;
}

export default function EnrollmentManagementView({
  sections,
  currentUser,
  onRefreshStudents,
  onRosterRefresh,
}: EnrollmentManagementViewProps) {
  const { school } = useTenant();

  const [applications, setApplications] = useState<EnrollmentApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Modal inspection & approval states
  const [inspectingApp, setInspectingApp] = useState<EnrollmentApplication | null>(null);
  const [approvingApp, setApprovingApp] = useState<EnrollmentApplication | null>(null);
  const [rejectingApp, setRejectingApp] = useState<EnrollmentApplication | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [assignedRfidTag, setAssignedRfidTag] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('Incomplete PSA Birth Certificate copy.');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  // Batch selection
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const data = await enrollmentApi.getAll(school.id);
      setApplications(data);
    } catch (err) {
      console.error('Error loading enrollment applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [school.id]);

  // Grade levels available for sorting and grouping
  const GRADE_LEVELS = [
    'ALL',
    'Kindergarten',
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
    'Grade 7',
    'Grade 8',
    'Grade 9',
    'Grade 10',
    'Grade 11',
    'Grade 12',
  ];

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    // Grade filter
    if (selectedGrade !== 'ALL' && app.grade_level !== selectedGrade) {
      return false;
    }
    // Status filter
    if (statusFilter !== 'ALL' && app.status !== statusFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = `${app.first_name} ${app.middle_name || ''} ${app.last_name}`.toLowerCase().includes(q);
      const matchTracking = app.tracking_number.toLowerCase().includes(q);
      const matchLrn = (app.lrn || '').toLowerCase().includes(q);
      const matchBarangay = app.current_barangay.toLowerCase().includes(q);
      return matchName || matchTracking || matchLrn || matchBarangay;
    }
    return true;
  });

  // Calculate statistics
  const totalCount = applications.length;
  const pendingCount = applications.filter((a) => a.status === 'PENDING').length;
  const approvedCount = applications.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = applications.filter((a) => a.status === 'REJECTED').length;

  // Open Approval Dialog for an application
  const handleOpenApproval = (app: EnrollmentApplication) => {
    setApprovingApp(app);
    // Find candidate sections matching this grade level
    const candidates = sections.filter(
      (s) =>
        String(s.grade_level).toLowerCase() === String(app.grade_level).toLowerCase() ||
        String(s.name).toLowerCase().includes(String(app.grade_level).toLowerCase())
    );
    if (candidates.length > 0) {
      setSelectedSectionId(candidates[0].id);
    } else if (sections.length > 0) {
      setSelectedSectionId(sections[0].id);
    }
    // Auto-generate realistic 10-digit RFID UID
    const rfidSuggest = (app.tracking_number.replace(/\D/g, '') + '882001').slice(0, 10);
    setAssignedRfidTag(rfidSuggest);
  };

  // Confirm Approval & Insert to Student Database
  const handleConfirmApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingApp || !selectedSectionId) return;

    setIsProcessing(true);
    setActionSuccessMsg('');

    try {
      const matchedSection = sections.find((s) => s.id === selectedSectionId);
      const sectionName = matchedSection ? matchedSection.name : 'General Section';
      const facultyName = currentUser?.full_name || currentUser?.name || 'Admissions Faculty';
      const facultyId = currentUser?.id || 'faculty-001';

      const res = await enrollmentApi.approveAndAssign({
        applicationId: approvingApp.id,
        sectionId: selectedSectionId,
        sectionName,
        assignedByUserId: facultyId,
        assignedByName: facultyName,
        rfidTag: assignedRfidTag.trim(),
      });

      setActionSuccessMsg(
        `Learner ${res.student.last_name}, ${res.student.first_name} officially enrolled into ${sectionName} and inserted into Student BEEF Database!`
      );
      setApprovingApp(null);
      await fetchEnrollments();
      if (onRefreshStudents) {
        onRefreshStudents();
      }
      if (onRosterRefresh) {
        onRosterRefresh();
      }
    } catch (err: any) {
      alert(err.message || 'Error approving application.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm Rejection
  const handleConfirmRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingApp) return;

    setIsProcessing(true);
    try {
      await enrollmentApi.reject(rejectingApp.id, rejectReason);
      setRejectingApp(null);
      await fetchEnrollments();
    } catch (err: any) {
      alert(err.message || 'Error rejecting application.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch Select / Deselect All
  const handleToggleSelectAll = () => {
    const pendingIds = filteredApps.filter((a) => a.status === 'PENDING').map((a) => a.id);
    if (selectedAppIds.length === pendingIds.length) {
      setSelectedAppIds([]);
    } else {
      setSelectedAppIds(pendingIds);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedAppIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER & SUMMARY METRICS                                   */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
              Admissions &amp; BEEF Queue
            </span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-xs text-slate-400">All Faculty Access Enabled</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mt-1">
            DepEd Online Enrollment &amp; Section Assignment
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Review online applications submitted via <code className="text-blue-400 font-mono">/enroll</code>, verify credentials, and approve learners to insert them into the active Student Database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/enroll"
            target="_blank"
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
            <span>Open Public Portal (/enroll)</span>
          </Link>
          <button
            type="button"
            onClick={fetchEnrollments}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Refresh Enrollment Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg('')} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Total Applications</span>
            <span className="text-2xl font-black text-white font-mono mt-0.5 block">{totalCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-400 block">Pending Sectioning</span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-0.5 block">{pendingCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 block">Approved &amp; Enrolled</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5 block">{approvedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-rose-400 block">Incomplete / Rejected</span>
            <span className="text-2xl font-black text-rose-400 font-mono mt-0.5 block">{rejectedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. GRADE LEVEL SORTING & FILTERING BAR                        */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        {/* Grade Level Pills (Horizontal Scrollable) */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Sort &amp; Group by Grade Level:
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {school?.school_type === 'ELEMENTARY' && 'School Scope: Elementary Only (K-6)'}
              {school?.school_type === 'HIGH_SCHOOL' && 'School Scope: High School Only (7-12)'}
              {school?.school_type === 'INTEGRATED' && 'School Scope: Integrated (K-12)'}
              {school?.school_type === 'CUSTOM' && `School Scope: ${getSchoolEnabledGrades(school).length} Grades Active`}
              {!school?.school_type && `School Scope: ${getSchoolEnabledGrades(school).length} Grades Active`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
            {GRADE_LEVELS.map((g) => {
              const isOffered = g === 'ALL' || getSchoolEnabledGrades(school).includes(g);
              const countInGrade = applications.filter((a) => (g === 'ALL' ? true : a.grade_level === g)).length;
              const pendingInGrade = applications.filter(
                (a) => (g === 'ALL' ? true : a.grade_level === g) && a.status === 'PENDING'
              ).length;
              const isActive = selectedGrade === g;

              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGrade(g)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                      : isOffered
                      ? 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      : 'bg-slate-950/50 text-slate-500 hover:bg-slate-900 border border-slate-800/60 opacity-70'
                  }`}
                  title={!isOffered && g !== 'ALL' ? `${g} is currently disabled in School Settings` : undefined}
                >
                  {!isOffered && g !== 'ALL' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" title="Not currently offered for enrollment" />
                  )}
                  {isOffered && g !== 'ALL' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Active enrollment grade" />
                  )}
                  <span>{g === 'ALL' ? 'All Grade Levels' : g}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {countInGrade}
                  </span>
                  {pendingInGrade > 0 && !isActive && (
                    <span className="w-2 h-2 rounded-full bg-amber-400" title={`${pendingInGrade} Pending`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Status Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Learner Name, LRN, or Tracking..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 shrink-0">Status:</span>
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-800 text-white font-bold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. ENROLLMENT APPLICATIONS TABLE / LIST                       */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
              <input
                type="checkbox"
                checked={
                  filteredApps.filter((a) => a.status === 'PENDING').length > 0 &&
                  selectedAppIds.length === filteredApps.filter((a) => a.status === 'PENDING').length
                }
                onChange={handleToggleSelectAll}
                className="rounded accent-blue-600"
              />
              <span>Select Pending Enrollees</span>
            </label>
            {selectedAppIds.length > 0 && (
              <span className="text-xs text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                {selectedAppIds.length} Selected
              </span>
            )}
          </div>

          <span className="text-xs text-slate-500 font-mono">
            Showing {filteredApps.length} of {applications.length} applications
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
            Loading enrollment database records...
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-600" />
            <p className="font-semibold text-slate-400">No enrollment applications match your filter.</p>
            <p className="text-[11px]">
              Learners who submit via <Link href="/enroll" className="text-blue-400 underline">/enroll</Link> will immediately appear in this admissions queue.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-10"></th>
                  <th className="py-3 px-4">Tracking &amp; Learner</th>
                  <th className="py-3 px-4">Grade &amp; Modality</th>
                  <th className="py-3 px-4">LRN / PSA Cert</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Status &amp; Section</th>
                  <th className="py-3 px-4 text-right">Faculty Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredApps.map((app) => {
                  const isPending = app.status === 'PENDING';
                  const isApproved = app.status === 'APPROVED';
                  const isRejected = app.status === 'REJECTED';

                  return (
                    <tr key={app.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="py-3 px-4">
                        {isPending && (
                          <input
                            type="checkbox"
                            checked={selectedAppIds.includes(app.id)}
                            onChange={() => handleToggleSelect(app.id)}
                            className="rounded accent-blue-600"
                          />
                        )}
                      </td>

                      {/* Learner & Tracking */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
                            {app.first_name[0]}
                            {app.last_name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-blue-400 transition-colors">
                              {app.last_name}, {app.first_name} {app.middle_name} {app.extension_name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
                              <span className="font-mono text-yellow-400 font-semibold">{app.tracking_number}</span>
                              <span className="text-slate-600">&bull;</span>
                              <span className="text-slate-400">
                                {app.sex}, {app.age} yrs
                              </span>
                              {app.is_4ps_beneficiary && (
                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded border border-emerald-500/20">
                                  4Ps
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Grade Level */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{app.grade_level}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {app.preferred_modality || 'Face-to-Face'}
                        </div>
                      </td>

                      {/* LRN / PSA */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {app.lrn ? (
                          <div className="text-cyan-400 font-bold">{app.lrn}</div>
                        ) : (
                          <div className="text-slate-500 italic">No LRN yet (New)</div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[130px]" title={app.psa_birth_cert_no}>
                          {app.psa_birth_cert_no || 'No PSA copy'}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-300 text-[11px]">{app.primary_sms_phone}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                          {app.guardian_name || app.mother_name || app.father_name || 'Parent'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                            <Clock className="w-3 h-3" /> Pending Review
                          </span>
                        )}
                        {isApproved && (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Enrolled
                            </span>
                            {app.assigned_section_name && (
                              <div className="text-[11px] font-semibold text-slate-300 mt-1 flex items-center gap-1">
                                <GraduationCap className="w-3 h-3 text-blue-400" />
                                <span>{app.assigned_section_name}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                            <UserX className="w-3 h-3" /> Incomplete
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectingApp(app)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                            title="Inspect Complete BEEF Form"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenApproval(app)}
                                className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 transition-all"
                                title="Approve & Assign Section"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Approve &amp; Assign</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectingApp(app)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
                                title="Reject / Flag Documents"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL: APPROVE & ASSIGN SECTION (INSERTS INTO STUDENT DB)  */}
      {/* ------------------------------------------------------------- */}
      {approvingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative z-10 text-white animate-scale-up">
            <button
              onClick={() => setApprovingApp(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Approve &amp; Assign to Classroom</h3>
                <p className="text-xs text-slate-400">Inserts applicant into official DepEd Student Database</p>
              </div>
            </div>

            {/* Applicant Summary */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-5 text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-slate-400">Enrollee Name:</span>
                <span className="font-bold text-white">
                  {approvingApp.last_name}, {approvingApp.first_name} {approvingApp.middle_name} {approvingApp.extension_name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Grade Level:</span>
                <span className="font-mono font-bold text-cyan-400">{approvingApp.grade_level}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tracking Code:</span>
                <span className="font-mono text-yellow-400">{approvingApp.tracking_number}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">PSA / LRN:</span>
                <span className="font-mono text-slate-300">{approvingApp.lrn || approvingApp.psa_birth_cert_no}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Assign Classroom Section *
                </label>
                <select
                  required
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="">-- Choose Section --</option>
                  {sections
                    .filter((s) => String(s.grade_level).toLowerCase() === String(approvingApp.grade_level).toLowerCase())
                    .map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name} &bull; Adviser: {sec.adviser_name || 'TBD'} ({sec.student_count || 0}/
                        {sec.max_capacity || 40})
                      </option>
                    ))}
                  {/* Fallback to all sections if no exact grade match */}
                  {sections
                    .filter((s) => String(s.grade_level).toLowerCase() !== String(approvingApp.grade_level).toLowerCase())
                    .map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        [{sec.grade_level}] {sec.name} &bull; Adviser: {sec.adviser_name || 'TBD'}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Learner attendance and grade metrics will be assigned to this section adviser.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Assign RFID Card Tag UID (Gate Turnstile)
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    maxLength={10}
                    value={assignedRfidTag}
                    onChange={(e) => setAssignedRfidTag(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit RFID (e.g. 0008522401)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono placeholder-slate-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Can be updated or scanned later via RFID pairing station.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-900/40 text-[11px] text-emerald-200 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Immediate synchronization: Record is removed from pending queue and inserted into the official Student BEEF roster.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isProcessing || !selectedSectionId}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isProcessing ? 'Enrolling Learner...' : 'Confirm Enrollment & Insert into Database'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setApprovingApp(null)}
                  className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. MODAL: INSPECT COMPLETE BEEF DETAILS                       */}
      {/* ------------------------------------------------------------- */}
      {inspectingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative z-10 text-white animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setInspectingApp(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-yellow-400 font-bold uppercase">
                  {inspectingApp.tracking_number}
                </span>
                <h3 className="text-base font-bold text-white">DepEd BEEF Application Record</h3>
                <p className="text-xs text-slate-400">Submitted on {new Date(inspectingApp.submitted_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Learner Personal */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Learner Information</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Full Name</span>
                    <span className="text-white font-bold">
                      {inspectingApp.last_name}, {inspectingApp.first_name} {inspectingApp.middle_name} {inspectingApp.extension_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Grade Level</span>
                    <span className="text-cyan-400 font-bold font-mono">{inspectingApp.grade_level}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Sex &amp; Age</span>
                    <span className="text-slate-200">
                      {inspectingApp.sex}, {inspectingApp.age} years old ({inspectingApp.birthdate})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">LRN</span>
                    <span className="text-slate-200 font-mono">{inspectingApp.lrn || 'None (New)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">PSA Certificate</span>
                    <span className="text-slate-200 font-mono">{inspectingApp.psa_birth_cert_no || 'Pending'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Mother Tongue</span>
                    <span className="text-slate-200">{inspectingApp.mother_tongue}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">4Ps Beneficiary</span>
                    <span className="text-slate-200 font-mono">
                      {inspectingApp.is_4ps_beneficiary ? `Yes (${inspectingApp.household_4ps_id || 'Active'})` : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Learner Modality</span>
                    <span className="text-slate-200">{inspectingApp.preferred_modality || 'Face-to-Face'}</span>
                  </div>
                </div>
              </div>

              {/* Residential Address */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Residential Address</span>
                <p className="text-slate-200">
                  {inspectingApp.current_house_no} {inspectingApp.current_street}, Brgy. {inspectingApp.current_barangay},{' '}
                  {inspectingApp.current_municipality_city}, {inspectingApp.current_province} ({inspectingApp.current_region})
                </p>
              </div>

              {/* Parents / Guardians */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Parent &amp; Guardian Contacts</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Father</span>
                    <span className="text-slate-200 font-semibold">{inspectingApp.father_name || 'N/A'}</span>
                    <span className="text-slate-400 block font-mono text-[11px]">{inspectingApp.father_contact}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Mother (Maiden)</span>
                    <span className="text-slate-200 font-semibold">{inspectingApp.mother_name || 'N/A'}</span>
                    <span className="text-slate-400 block font-mono text-[11px]">{inspectingApp.mother_contact}</span>
                  </div>
                  <div className="sm:col-span-2 pt-2 border-t border-slate-900">
                    <span className="text-slate-500 block text-[11px]">Primary Automated Turnstile SMS Recipient</span>
                    <span className="text-emerald-400 font-bold font-mono text-sm">{inspectingApp.primary_sms_phone}</span>
                  </div>
                </div>
              </div>

              {/* Prior School */}
              {inspectingApp.last_school_attended && inspectingApp.last_school_attended !== 'None' && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Prior School History</span>
                  <p className="text-slate-200 font-medium">{inspectingApp.last_school_attended}</p>
                  <p className="text-slate-400 text-[11px]">
                    School ID: {inspectingApp.last_school_id || 'N/A'} &bull; Completed: {inspectingApp.last_grade_level_completed} (SY {inspectingApp.last_school_year_completed})
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              {inspectingApp.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={() => {
                    const toApprove = inspectingApp;
                    setInspectingApp(null);
                    handleOpenApproval(toApprove);
                  }}
                  className="py-2.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Proceed to Section Assignment</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setInspectingApp(null)}
                className="py-2.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. MODAL: REJECT / FLAG APPLICATION                           */}
      {/* ------------------------------------------------------------- */}
      {rejectingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative z-10 text-white animate-scale-up">
            <button
              onClick={() => setRejectingApp(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Flag / Reject Application</h3>
                <p className="text-xs text-slate-400">Mark application as incomplete or rejected</p>
              </div>
            </div>

            <form onSubmit={handleConfirmRejection} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Reason for Flagging</label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Reject / Incomplete'}
                </button>
                <button
                  type="button"
                  onClick={() => setRejectingApp(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

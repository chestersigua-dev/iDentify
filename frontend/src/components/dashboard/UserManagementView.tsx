'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '@/lib/tenant-context';
import {
  UserAccount,
  POSITIONS_LIST,
  apiClient,
  AcademicSection,
  GradeSubject,
  ModulePermissions,
  FacultyTapLog,
  MonthlyDtrReport,
} from '@/lib/api';
import CivilServiceForm48 from './CivilServiceForm48';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Search,
  Filter,
  ShieldCheck,
  Check,
  X,
  BookOpen,
  KeyRound,
  CheckCircle2,
  Sparkles,
  Layers,
  Settings,
  Shield,
  BadgeCheck,
  FileText,
  Printer,
  Calendar,
  CreditCard,
  History,
  Lock,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Download,
  Clock,
  UserCheck,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface UserManagementViewProps {
  users: UserAccount[];
  sections: AcademicSection[];
  subjects: GradeSubject[];
  onRefresh: () => void;
  currentUser?: UserAccount | null;
  canManageUsers?: boolean;
}

const MODULES_LIST = [
  { id: 'metrics', label: 'Dashboard & Metrics' },
  { id: 'enrollment', label: 'Enrollment Portal' },
  { id: 'students', label: 'Student Database (BEEF)' },
  { id: 'promotion', label: 'Student Promotion' },
  { id: 'import_csv', label: 'Import DepEd CSV' },
  { id: 'academic', label: 'Sections & Subjects' },
  { id: 'attendance', label: 'Classroom Roll Call' },
  { id: 'users', label: 'Faculty & Staff Users' },
  { id: 'settings', label: 'School Settings & Branding' },
  { id: 'audit', label: 'Immutable Audit Ledger' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function UserManagementView({
  users,
  sections,
  subjects,
  onRefresh,
  currentUser,
  canManageUsers = true,
}: UserManagementViewProps) {
  const { school, currentRole, isSuperAdminSession, spoofUser } = useTenant();

  const isSuperAdmin = currentRole === 'SUPER_ADMIN';
  const isPrincipal = currentRole === 'PRINCIPAL';
  const isAdminAssistant = currentRole === 'ADMIN_ASSISTANT';
  const isTeacherOrMaster = currentRole === 'TEACHER' || currentRole === 'MASTER_TEACHER';
  const canAdminister = isSuperAdmin || isPrincipal || isAdminAssistant;

  // View Tabs: 'dtr' | 'directory' | 'gate_logs'
  const [activeTab, setActiveTab] = useState<'dtr' | 'directory' | 'gate_logs'>(
    isTeacherOrMaster && !canAdminister ? 'dtr' : 'directory'
  );

  // ---------------------------------------------------------------------------
  // DTR STATE & CALCULATIONS
  // ---------------------------------------------------------------------------
  // Determine effective selected employee
  // If teacher, strictly lock to currentUser id; exclude superadmin account
  const myUserId =
    currentUser?.id && currentUser.role !== 'SUPER_ADMIN'
      ? currentUser.id
      : users.find((u) => u.email === currentUser?.email && u.role !== 'SUPER_ADMIN')?.id ||
        users.find((u) => u.role !== 'SUPER_ADMIN')?.id ||
        users[0]?.id;
  const [selectedDtrUserId, setSelectedDtrUserId] = useState<string>(myUserId || users.find((u) => u.role !== 'SUPER_ADMIN')?.id || users[0]?.id || '');

  useEffect(() => {
    if (isTeacherOrMaster && !canAdminister && myUserId) {
      setSelectedDtrUserId(myUserId);
    } else if (!selectedDtrUserId && users.length > 0) {
      const defaultUser = users.find((u) => u.role !== 'SUPER_ADMIN') || users[0];
      setSelectedDtrUserId(defaultUser.id);
    }
  }, [isTeacherOrMaster, canAdminister, myUserId, users, selectedDtrUserId]);

  // Date selection mode: 'MONTH' or 'RANGE'
  const [dtrSelectionMode, setDtrSelectionMode] = useState<'MONTH' | 'RANGE'>('MONTH');
  const [dtrFormat, setDtrFormat] = useState<'EHRIS' | 'SARAH'>('EHRIS');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // 1-12 (October 2026 default)

  // Custom date range state
  const [startDateStr, setStartDateStr] = useState<string>('2026-09-01');
  const [endDateStr, setEndDateStr] = useState<string>('2026-10-31');

  // Month navigation within multi-month results
  const [activeMonthIndex, setActiveMonthIndex] = useState<number>(0);
  const [viewAllMonthsContinuous, setViewAllMonthsContinuous] = useState<boolean>(false);

  // Batch Print Mode (all faculty members)
  const [isBatchExporting, setIsBatchExporting] = useState<boolean>(false);

  // DTR Modal State - shows DTR in modal to eliminate browser back button issues
  const [showDtrModal, setShowDtrModal] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDtrModal) {
        setShowDtrModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDtrModal]);

  // Generate DTR reports for the currently selected user
  const generatedReports: MonthlyDtrReport[] = useMemo(() => {
    if (!selectedDtrUserId) return [];
    if (dtrSelectionMode === 'MONTH') {
      const rep = apiClient.generateFacultyMonthlyDtr(selectedDtrUserId, selectedYear, selectedMonth);
      return [rep];
    } else {
      return apiClient.generateMultiMonthDtr(selectedDtrUserId, startDateStr, endDateStr);
    }
  }, [selectedDtrUserId, dtrSelectionMode, selectedYear, selectedMonth, startDateStr, endDateStr, users]);

  // Generate Batch DTR reports for ALL personnel (for AO & Principal batch print)
  const allPersonnelBatchReports: { user: UserAccount; reports: MonthlyDtrReport[] }[] = useMemo(() => {
    if (!canAdminister) return [];
    const facultyList = users.filter((u) => u.role !== 'SUPER_ADMIN');
    return facultyList.map((u) => ({
      user: u,
      reports:
        dtrSelectionMode === 'MONTH'
          ? [apiClient.generateFacultyMonthlyDtr(u.id, selectedYear, selectedMonth)]
          : apiClient.generateMultiMonthDtr(u.id, startDateStr, endDateStr),
    }));
  }, [canAdminister, users, dtrSelectionMode, selectedYear, selectedMonth, startDateStr, endDateStr]);

  const currentReport = generatedReports[activeMonthIndex] || generatedReports[0];

  const handlePrintDtr = () => {
    setIsBatchExporting(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleBatchPrintAll = () => {
    setIsBatchExporting(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setIsBatchExporting(false);
      }, 1000);
    }, 200);
  };

  // ---------------------------------------------------------------------------
  // FACULTY TAP LOGS (SEPARATE DATABASE)
  // ---------------------------------------------------------------------------
  const [facultyLogs, setFacultyLogs] = useState<FacultyTapLog[]>([]);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState('ALL');
  const [logDateFilter, setLogDateFilter] = useState('ALL');

  const refreshFacultyLogs = () => {
    const logs = apiClient.getFacultyTapLogs();
    setFacultyLogs(logs);
  };

  useEffect(() => {
    refreshFacultyLogs();
  }, []);

  const filteredFacultyLogs = useMemo(() => {
    return facultyLogs.filter((log) => {
      const q = logSearchQuery.toLowerCase();
      const matchQ =
        !q ||
        log.name.toLowerCase().includes(q) ||
        log.rfid.includes(q) ||
        (log.position && log.position.toLowerCase().includes(q));

      const matchStatus = logStatusFilter === 'ALL' || log.status === logStatusFilter;
      const matchDate = logDateFilter === 'ALL' || log.dateStr === logDateFilter;

      return matchQ && matchStatus && matchDate;
    });
  }, [facultyLogs, logSearchQuery, logStatusFilter, logDateFilter]);

  // Unique dates in faculty logs for dropdown
  const uniqueLogDates = useMemo(() => {
    const set = new Set<string>();
    facultyLogs.forEach((l) => set.add(l.dateStr));
    return Array.from(set).sort().reverse();
  }, [facultyLogs]);

  // ---------------------------------------------------------------------------
  // DIRECTORY & FORM MODAL STATE
  // ---------------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserForAssign, setSelectedUserForAssign] = useState<UserAccount | null>(null);

  // Form State (includes RFID tag assignment & DepEd Plantilla / eHRIS metadata)
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    role: 'TEACHER' as UserAccount['role'],
    position: 'Teacher I',
    photo_url: '',
    active_rfid_uid: '',
    employee_number: '',
    plantilla_item_no: '',
    salary_grade: 'SG-11',
    station: '',
    employment_status: 'Permanent',
    assigned_tier: 'JUNIOR_HIGH' as 'ELEMENTARY' | 'JUNIOR_HIGH' | 'SENIOR_HIGH',
    two_factor_enabled: false,
    rbac_permissions: {
      users: { view: true, create: false, edit: false, delete: false },
      students: { view: true, create: false, edit: false, delete: false },
      attendance: { view: true, create: true, edit: true, delete: false },
      academic: { view: true, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      audit: { view: false, create: false, edit: false, delete: false },
      metrics: { view: true, create: false, edit: false, delete: false },
    } as Record<string, ModulePermissions>,
  });

  // Assign Classes Modal State
  const [assignGrade, setAssignGrade] = useState('Grade 10');
  const [assignSection, setAssignSection] = useState('Bonifacio');
  const [assignSubjects, setAssignSubjects] = useState<string[]>(['English 10']);

  // Filtered Users (Hide superadmin account in the faculty list)
  const filteredUsers = users.filter((u) => {
    if (u.role === 'SUPER_ADMIN') return false;

    const query = searchQuery.toLowerCase();
    const matchSearch =
      !searchQuery ||
      u.full_name?.toLowerCase().includes(query) ||
      u.username?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.position?.toLowerCase().includes(query) ||
      (u.employee_number && u.employee_number.toLowerCase().includes(query)) ||
      (u.plantilla_item_no && u.plantilla_item_no.toLowerCase().includes(query)) ||
      (u.active_rfid_uid && u.active_rfid_uid.includes(query)) ||
      (u.rfid_tag && u.rfid_tag.includes(query));

    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchPosition = positionFilter === 'ALL' || u.position === positionFilter;

    return matchSearch && matchRole && matchPosition;
  });

  const generateNextRfid = () => {
    // Generate next 10-digit sequential RFID tag starting with 00085224xx
    const rfidNumbers = users
      .filter((u) => u.role !== 'SUPER_ADMIN')
      .map((u) => parseInt(u.active_rfid_uid || u.rfid_tag || '0', 10))
      .filter((n) => !isNaN(n) && n > 8522000);

    const maxVal = rfidNumbers.length > 0 ? Math.max(...rfidNumbers) : 8522406;
    const nextVal = String(maxVal + 1).padStart(10, '0');
    setFormData((prev) => ({ ...prev, active_rfid_uid: nextVal }));
  };

  const handleOpenCreate = () => {
    setEditingUserId(null);
    setFormData({
      username: '',
      full_name: '',
      email: '',
      phone_number: '',
      password: '',
      role: 'TEACHER',
      position: 'Teacher I',
      photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      active_rfid_uid: '',
      employee_number: `DEPED-${Math.floor(1000000 + Math.random() * 9000000)}`,
      plantilla_item_no: `OSEC-DECSB-TCH1-00${Math.floor(100 + Math.random() * 900)}-2024`,
      salary_grade: 'SG-11, Step 1',
      station: school.name || 'Sawat Elementary School',
      employment_status: 'Permanent',
      assigned_tier: 'JUNIOR_HIGH',
      two_factor_enabled: false,
      rbac_permissions: {
        users: { view: true, create: false, edit: false, delete: false },
        students: { view: true, create: false, edit: false, delete: false },
        attendance: { view: true, create: true, edit: true, delete: false },
        academic: { view: true, create: false, edit: false, delete: false },
        settings: { view: false, create: false, edit: false, delete: false },
        audit: { view: false, create: false, edit: false, delete: false },
        metrics: { view: true, create: false, edit: false, delete: false },
      },
    });
    setShowModal(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUserId(user.id);
    setFormData({
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number || '',
      password: '',
      role: user.role,
      position: user.position || 'Teacher I',
      photo_url: user.photo_url || '',
      active_rfid_uid: user.active_rfid_uid || user.rfid_tag || '',
      employee_number: user.employee_number || '',
      plantilla_item_no: user.plantilla_item_no || '',
      salary_grade: user.salary_grade || 'SG-11',
      station: user.station || school.name || 'Sawat Elementary School',
      employment_status: user.employment_status || 'Permanent',
      assigned_tier: user.assigned_tier || 'JUNIOR_HIGH',
      two_factor_enabled: user.two_factor_enabled,
      rbac_permissions: user.rbac_permissions || {
        users: { view: true, create: false, edit: false, delete: false },
        students: { view: true, create: false, edit: false, delete: false },
        attendance: { view: true, create: true, edit: true, delete: false },
        academic: { view: true, create: false, edit: false, delete: false },
        settings: { view: false, create: false, edit: false, delete: false },
        audit: { view: false, create: false, edit: false, delete: false },
        metrics: { view: true, create: false, edit: false, delete: false },
      },
    });
    setShowModal(true);
  };

  const handleRoleChange = (role: UserAccount['role']) => {
    let position = formData.position;
    if (role === 'PRINCIPAL') position = 'Principal I';
    if (role === 'HEAD_TEACHER') position = 'Head Teacher I';
    if (role === 'MASTER_TEACHER') position = 'Master Teacher I';
    if (role === 'TEACHER') position = 'Teacher I';
    if (role === 'ADMIN_ASSISTANT') position = 'Administrative Assistant II';
    if (role === 'STAFF') position = 'Staff';

    const isPrincipalLike = role === 'PRINCIPAL' || role === 'SUPER_ADMIN';
    const isAo = role === 'ADMIN_ASSISTANT';

    const defaultPerms: Record<string, ModulePermissions> = {
      users: { view: isPrincipalLike || isAo, create: isPrincipalLike || isAo, edit: isPrincipalLike || isAo, delete: isPrincipalLike || isAo },
      students: { view: true, create: isPrincipalLike || isAo, edit: isPrincipalLike || isAo, delete: isPrincipalLike || isAo },
      attendance: { view: true, create: true, edit: true, delete: isPrincipalLike },
      academic: { view: true, create: isPrincipalLike || isAo, edit: isPrincipalLike || isAo, delete: isPrincipalLike || isAo },
      settings: { view: isPrincipalLike, create: isPrincipalLike, edit: isPrincipalLike, delete: isPrincipalLike },
      audit: { view: isPrincipalLike, create: false, edit: false, delete: false },
      metrics: { view: true, create: isPrincipalLike, edit: isPrincipalLike, delete: isPrincipalLike },
    };

    setFormData({
      ...formData,
      role,
      position,
      rbac_permissions: defaultPerms,
    });
  };

  const handlePermissionToggle = (moduleId: string, action: keyof ModulePermissions) => {
    const curr = formData.rbac_permissions[moduleId] || { view: false, create: false, edit: false, delete: false };
    setFormData({
      ...formData,
      rbac_permissions: {
        ...formData.rbac_permissions,
        [moduleId]: {
          ...curr,
          [action]: !curr[action],
        },
      },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUserId) {
      await apiClient.updateUser(editingUserId, {
        ...formData,
        rfid_tag: formData.active_rfid_uid,
        school_id: school.id,
      });
    } else {
      await apiClient.createUser({
        ...formData,
        rfid_tag: formData.active_rfid_uid,
        school_id: school.id,
      });
    }

    setShowModal(false);
    onRefresh();
    refreshFacultyLogs();
  };

  const handleDelete = async (user: UserAccount) => {
    if (confirm(`Are you sure you want to remove ${user.full_name} (${user.position || user.role})?`)) {
      await apiClient.deleteUser(user.id);
      onRefresh();
      refreshFacultyLogs();
    }
  };

  // Class & Subject Assignment
  const handleOpenAssignModal = (user: UserAccount) => {
    setSelectedUserForAssign(user);
    if (user.assigned_classes && user.assigned_classes.length > 0) {
      setAssignGrade(String(user.assigned_classes[0].grade_level));
      setAssignSection(user.assigned_classes[0].section_name || user.assigned_classes[0].section || 'Bonifacio');
      setAssignSubjects(user.assigned_classes[0].subjects || (user.assigned_classes[0].subject ? [user.assigned_classes[0].subject!] : ['English 10']));
    } else {
      setAssignGrade('Grade 10');
      setAssignSection('Bonifacio');
      setAssignSubjects(['English 10']);
    }
    setShowAssignModal(true);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAssign) return;

    const newClassAssignment = [
      {
        grade_level: assignGrade,
        section_id: sections.find((s) => s.name === assignSection)?.id || 'sec-assigned',
        section_name: assignSection,
        subjects: assignSubjects,
      },
    ];

    await apiClient.updateUser(selectedUserForAssign.id, {
      assigned_classes: newClassAssignment,
    });

    setShowAssignModal(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* BATCH PRINT CONTAINER (VISIBLE ONLY IN BATCH PRINT MODE)      */}
      {/* ------------------------------------------------------------- */}
      {isBatchExporting && (
        <div className="hidden print:block">
          {allPersonnelBatchReports.map((item, pIdx) => (
            <React.Fragment key={item.user.id}>
              {item.reports.map((rep, rIdx) => (
                <div key={`${item.user.id}-${rep.year}-${rep.month}`} className="dtr-page-break">
                  <CivilServiceForm48 report={rep} formatType={dtrFormat} />
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. MODULE BANNER & TOP NAVIGATION TABS                         */}
      {/* ------------------------------------------------------------- */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
              Civil Service Form No. 48 &bull; Faculty Gate Biometrics
            </span>
            <span className="text-xs text-slate-400 font-mono">School: {school.name}</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1 flex items-center space-x-2">
            <span>Faculty &amp; Staff Daily Time Record (DTR)</span>
            <span className="text-xs font-mono font-normal bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/40">
              DepEd CS Form 48
            </span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {isTeacherOrMaster && !canAdminister
              ? 'View your automated Daily Time Record (CS Form No. 48) generated directly from your RFID gate taps. Export monthly DTRs to PDF.'
              : 'Automated DepEd Daily Time Records based on RFID turnstile gate taps. View any employee, assign RFID tags, and export individual or batch monthly DTRs.'}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setActiveTab('dtr')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
                activeTab === 'dtr'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>{isTeacherOrMaster && !canAdminister ? 'My CS Form 48 (DTR)' : 'CS Form 48 (DTR)'}</span>
            </button>

            {canAdminister && (
              <>
                <button
                  onClick={() => setActiveTab('directory')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
                    activeTab === 'directory'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Faculty Directory &amp; RFID</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('gate_logs');
                    refreshFacultyLogs();
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
                    activeTab === 'gate_logs'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <History className="w-4 h-4 text-cyan-400" />
                  <span>Faculty RFID Gate Logs</span>
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => {
              if (isTeacherOrMaster && !canAdminister && myUserId) {
                setSelectedDtrUserId(myUserId);
              }
              setShowDtrModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all border border-blue-400/30"
            title="Open DTR as a dedicated modal dialog (no browser back button needed)"
          >
            <Maximize2 className="w-4 h-4 text-white" />
            <span>{isTeacherOrMaster && !canAdminister ? 'View My DTR (Modal)' : 'Open DTR Modal'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: CIVIL SERVICE FORM NO. 48 (DTR)                        */}
      {/* ============================================================= */}
      {activeTab === 'dtr' && (
        <div className="space-y-6">
          {/* Controls Card */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 no-print">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Employee Selection & Navigation */}
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {canAdminister && (
                  <button
                    onClick={() => setActiveTab('directory')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center space-x-1.5 transition-colors border border-slate-700 shrink-0"
                    title="Return to Faculty Directory without using browser back button"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Directory</span>
                  </button>
                )}

                <button
                  onClick={() => setShowDtrModal(true)}
                  className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white text-xs font-bold flex items-center space-x-1.5 transition-colors border border-indigo-500/30 shrink-0"
                  title="Open DTR in dedicated modal window"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Open in Modal</span>
                </button>

                {canAdminister ? (
                  <div className="w-full sm:w-72">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Select Personnel / Faculty:
                    </label>
                    <select
                      value={selectedDtrUserId}
                      onChange={(e) => setSelectedDtrUserId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-blue-500 shadow-inner"
                    >
                      {users
                        .filter((u) => u.role !== 'SUPER_ADMIN')
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.full_name} ({u.position || u.role}) &bull; RFID: {u.active_rfid_uid || u.rfid_tag || 'None'}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-mono text-blue-300 font-bold">
                        Personal DepEd Daily Time Record
                      </div>
                      <div className="text-sm font-black text-white">
                        {currentReport?.userName || currentUser?.full_name || 'My DTR'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {currentReport?.position || 'Teacher'} &bull; RFID Tag: {currentReport?.rfidTag || 'Assigned'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mode Toggle & Date Selectors */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Mode Selector */}
                <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setDtrSelectionMode('MONTH')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      dtrSelectionMode === 'MONTH' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Select Month
                  </button>
                  <button
                    onClick={() => setDtrSelectionMode('RANGE')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      dtrSelectionMode === 'RANGE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Custom Date Range
                  </button>
                </div>

                {dtrSelectionMode === 'MONTH' ? (
                  <div className="flex items-center space-x-2">
                    {/* Month Picker */}
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(Number(e.target.value));
                        setActiveMonthIndex(0);
                      }}
                      className="bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 font-medium"
                    >
                      {MONTH_NAMES.map((mName, idx) => (
                        <option key={mName} value={idx + 1}>
                          {mName}
                        </option>
                      ))}
                    </select>

                    {/* Year Picker */}
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(Number(e.target.value));
                        setActiveMonthIndex(0);
                      }}
                      className="bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 font-medium"
                    >
                      <option value={2026}>2026</option>
                      <option value={2025}>2025</option>
                      <option value={2027}>2027</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Start Date:</span>
                      <input
                        type="date"
                        value={startDateStr}
                        onChange={(e) => {
                          setStartDateStr(e.target.value);
                          setActiveMonthIndex(0);
                        }}
                        className="bg-slate-950 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">End Date:</span>
                      <input
                        type="date"
                        value={endDateStr}
                        onChange={(e) => {
                          setEndDateStr(e.target.value);
                          setActiveMonthIndex(0);
                        }}
                        className="bg-slate-950 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* DTR Format Selector (DepEd eHRIS vs DepEd SARAH) */}
                <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5 hidden sm:inline">
                    Format:
                  </span>
                  <button
                    onClick={() => setDtrFormat('EHRIS')}
                    title="Export in official DepEd Enterprise Human Resource Information System (eHRIS) layout"
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                      dtrFormat === 'EHRIS'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>DepEd eHRIS</span>
                  </button>
                  <button
                    onClick={() => setDtrFormat('SARAH')}
                    title="Export in official DepEd Standard Automated Recording of Attendance Host (SARAH) biometric terminal layout"
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                      dtrFormat === 'SARAH'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>DepEd SARAH</span>
                  </button>
                </div>

                {/* Print & Export Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrintDtr}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Export to PDF</span>
                  </button>

                  {canAdminister && (
                    <button
                      onClick={handleBatchPrintAll}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                      title="Generate and print CS Form 48 for all faculty and staff members for the selected month/date range"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Batch Export All (PDF)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Multi-Month Tab Strip (if multiple months are generated) */}
            {generatedReports.length > 1 && (
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-medium">Monthly Breakdown:</span>
                  <div className="flex space-x-1.5">
                    {generatedReports.map((rep, idx) => (
                      <button
                        key={`${rep.year}-${rep.month}`}
                        onClick={() => {
                          setActiveMonthIndex(idx);
                          setViewAllMonthsContinuous(false);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          !viewAllMonthsContinuous && activeMonthIndex === idx
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {rep.monthName} {rep.year}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setViewAllMonthsContinuous(!viewAllMonthsContinuous)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                    viewAllMonthsContinuous
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {viewAllMonthsContinuous ? 'Showing All Months (Continuous)' : 'View All Months Continuous'}
                </button>
              </div>
            )}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* THE CIVIL SERVICE FORM 48 DOCUMENT CONTAINER                  */}
          {/* ------------------------------------------------------------- */}
          <div className="bg-slate-950 p-4 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col items-center">
            {/* Notice Bar */}
            <div className="w-full max-w-[580px] mb-4 p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs text-blue-200 no-print">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  Auto-populated from <strong>RFID gate logs</strong>. Prescribed hours: <strong>8:00 AM - 5:00 PM</strong>.
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 font-bold shrink-0">
                {currentReport?.totalDaysPresent || 0} Days Present
              </span>
            </div>

            {/* CS Form 48 Presentation */}
            {viewAllMonthsContinuous ? (
              <div className="space-y-10 w-full flex flex-col items-center">
                {generatedReports.map((rep) => (
                  <div key={`${rep.year}-${rep.month}`} className="w-full flex justify-center dtr-page-break">
                    <CivilServiceForm48 report={rep} formatType={dtrFormat} />
                  </div>
                ))}
              </div>
            ) : (
              currentReport && (
                <div className="w-full flex justify-center">
                  <CivilServiceForm48 report={currentReport} formatType={dtrFormat} />
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: FACULTY & STAFF DIRECTORY & RFID ASSIGNMENT            */}
      {/* ============================================================= */}
      {activeTab === 'directory' && canAdminister && (
        <div className="space-y-6">
          {/* Top Actions & Filters */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between shadow-lg">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, position, RFID tag, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto text-xs">
              {/* Role Filter */}
              <div className="flex items-center space-x-1.5 text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                <span>Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="PRINCIPAL">Principal</option>
                  <option value="ADMIN_ASSISTANT">Admin Assistant (AO)</option>
                  <option value="HEAD_TEACHER">Head Teacher</option>
                  <option value="MASTER_TEACHER">Master Teacher</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="STAFF">Staff</option>
                </select>
              </div>

              {/* Add Faculty Button */}
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center space-x-1.5 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Faculty / Staff</span>
              </button>
            </div>
          </div>

          {/* Directory Table */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">User Identity &amp; Position</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Assigned RFID Tag</th>
                    <th className="p-3.5">Assigned Classes</th>
                    <th className="p-3.5">Security / 2FA</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredUsers.map((user) => {
                    const rfidTag = user.active_rfid_uid || user.rfid_tag;
                    return (
                      <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* User Identity */}
                        <td className="p-3.5">
                          <div className="flex items-center space-x-3">
                            <img
                              src={user.photo_url || '/avatars/teacher-default.svg'}
                              alt={user.full_name}
                              className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700 bg-slate-950 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-white text-sm truncate flex items-center space-x-1.5">
                                <span>{user.full_name}</span>
                                {user.role === 'PRINCIPAL' && (
                                  <BadgeCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                )}
                              </div>
                              <div className="text-[11px] text-cyan-300 font-medium truncate">
                                {user.position || user.role}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono truncate flex flex-wrap items-center gap-1 mt-0.5">
                                {user.employee_number && (
                                  <span className="text-amber-400 font-bold bg-amber-400/10 px-1 py-0.5 rounded border border-amber-400/20 text-[9px]">
                                    {user.employee_number}
                                  </span>
                                )}
                                {user.plantilla_item_no && (
                                  <span className="text-slate-400 text-[9px] hidden xl:inline">
                                    &bull; {user.plantilla_item_no}
                                  </span>
                                )}
                                <span>&bull; {user.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase border ${
                              user.role === 'PRINCIPAL'
                                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                : user.role === 'ADMIN_ASSISTANT'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : user.role === 'MASTER_TEACHER' || user.role === 'HEAD_TEACHER'
                                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                : user.role === 'TEACHER'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-700/30 text-slate-300 border-slate-600/40'
                            }`}
                          >
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Assigned RFID Tag */}
                        <td className="p-3.5">
                          {rfidTag ? (
                            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="font-mono text-xs font-bold">{rfidTag}</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                            >
                              <AlertCircle className="w-3 h-3 text-amber-400" />
                              <span>Assign RFID</span>
                            </button>
                          )}
                        </td>

                        {/* Assigned Classes */}
                        <td className="p-3.5">
                          {user.assigned_classes && user.assigned_classes.length > 0 ? (
                            <div className="space-y-1">
                              {user.assigned_classes.map((cls, cIdx) => (
                                <div key={cIdx} className="text-[11px] text-slate-300 flex items-center space-x-1">
                                  <span className="font-semibold text-white">{cls.grade_level}</span>
                                  <span className="text-slate-500">&bull;</span>
                                  <span className="text-blue-400">{cls.section_name || cls.section}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">No classes assigned</span>
                          )}
                        </td>

                        {/* 2FA */}
                        <td className="p-3.5">
                          {user.two_factor_enabled ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-400 text-[11px] font-bold">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>2FA Active</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Disabled</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Superadmin Spoof Persona Button */}
                            {isSuperAdminSession && user.role !== 'SUPER_ADMIN' && (
                              <button
                                onClick={() => spoofUser(user)}
                                className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors flex items-center space-x-1"
                                title={`Simulate & Spoof as ${user.full_name} (${user.role})`}
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-[10px] font-bold hidden sm:inline">Spoof</span>
                              </button>
                            )}

                            {/* Shortcut to DTR Modal */}
                            <button
                              onClick={() => {
                                setSelectedDtrUserId(user.id);
                                setShowDtrModal(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-colors flex items-center space-x-1"
                              title="View DTR (CS Form 48) as Modal Dialog"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold hidden sm:inline">DTR</span>
                            </button>

                            {/* Assign Classes */}
                            {(user.role === 'TEACHER' || user.role === 'MASTER_TEACHER') && (
                              <button
                                onClick={() => handleOpenAssignModal(user)}
                                className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-colors"
                                title="Assign Sections &amp; Subjects"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Edit Profile &amp; RFID"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            {user.role !== 'SUPER_ADMIN' && (
                              <button
                                onClick={() => handleDelete(user)}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                title="Remove User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: FACULTY RFID GATE TAP LOGS (SEPARATE DATABASE)         */}
      {/* ============================================================= */}
      {activeTab === 'gate_logs' && canAdminister && (
        <div className="space-y-6">
          {/* Gate Logs Header & Search */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between shadow-lg">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search faculty taps by name or RFID tag..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto text-xs">
              {/* Date Filter */}
              <div className="flex items-center space-x-1.5 text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>Date:</span>
                <select
                  value={logDateFilter}
                  onChange={(e) => setLogDateFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Dates</option>
                  {uniqueLogDates.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-1.5 text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                <span>Event:</span>
                <select
                  value={logStatusFilter}
                  onChange={(e) => setLogStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Events</option>
                  <option value="CLOCK_IN">Clock In (Gate Entry)</option>
                  <option value="CLOCK_OUT">Clock Out (Gate Exit)</option>
                  <option value="DEBOUNCED">Debounced</option>
                </select>
              </div>

              <button
                onClick={refreshFacultyLogs}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors"
              >
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span>Refresh Logs</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-mono">Total Recorded Gate Taps</div>
                <div className="text-xl font-black text-white">{facultyLogs.length} Taps</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-mono">Assigned Faculty RFID Cards</div>
                <div className="text-xl font-black text-white">
                  {users.filter((u) => u.role !== 'SUPER_ADMIN' && !!(u.active_rfid_uid || u.rfid_tag)).length} Cards
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-mono">Database Partition</div>
                <div className="text-xs font-mono font-bold text-purple-300 mt-1">
                  identify_faculty_tap_logs (Segregated)
                </div>
              </div>
            </div>
          </div>

          {/* Gate Logs Table */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Date &amp; Timestamp</th>
                    <th className="p-3.5">Personnel Name &amp; Position</th>
                    <th className="p-3.5">RFID Card UID</th>
                    <th className="p-3.5">Gate Event</th>
                    <th className="p-3.5">Turnstile Station</th>
                    <th className="p-3.5 text-right">DTR Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredFacultyLogs.slice(0, 100).map((log) => {
                    const isClockIn = log.status === 'CLOCK_IN';
                    const isClockOut = log.status === 'CLOCK_OUT';

                    return (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-white text-xs">{log.timeStr}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.dateStr}</div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-white">{log.name}</div>
                          <div className="text-[11px] text-cyan-300 font-medium">{log.position || log.role}</div>
                        </td>

                        <td className="p-3.5">
                          <span className="font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-emerald-400 text-[11px]">
                            {log.rfid}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border ${
                              isClockIn
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : isClockOut
                                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                : 'bg-slate-700/30 text-slate-300 border-slate-600/40'
                            }`}
                          >
                            {isClockIn ? 'Clock In (Arrival)' : isClockOut ? 'Clock Out (Departure)' : 'Debounced'}
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-400 text-[11px]">
                          {isClockIn ? 'Main Entrance Turnstile #1' : 'Main Exit Turnstile #2'}
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedDtrUserId(log.userId);
                              setShowDtrModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-bold transition-colors"
                            title="View DTR (CS Form 48) as Modal Dialog"
                          >
                            View CS Form 48
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredFacultyLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        No faculty RFID logs found matching the filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* CREATE / EDIT USER MODAL (WITH RFID TAG ASSIGNMENT)          */}
      {/* ============================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 glass-modal-backdrop bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-black text-white">
                {editingUserId ? 'Edit Faculty / Staff Member' : 'Add New Faculty / Staff Member'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Danilo Ramos, LPT"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. teacher.ramos"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@deped.gov.ph"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+639198765432"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* RFID Tag Input with Generator */}
                <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-emerald-300 font-bold flex items-center space-x-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span>10-Digit RFID Card UID (Gate Pass)</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateNextRfid}
                      className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-mono text-[10px] font-bold border border-emerald-500/40 transition-colors"
                    >
                      ⚡ Generate Next Tag
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.active_rfid_uid}
                    onChange={(e) => setFormData({ ...formData, active_rfid_uid: e.target.value.trim() })}
                    placeholder="e.g. 0008522407"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 leading-tight">
                    When this RFID card is scanned at the kiosk, it automatically clocks the staff member in/out and populates their Civil Service Form 48.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="PRINCIPAL">Principal</option>
                    <option value="ADMIN_ASSISTANT">Admin Assistant (AO)</option>
                    <option value="HEAD_TEACHER">Head Teacher</option>
                    <option value="MASTER_TEACHER">Master Teacher</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="STAFF">Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Official Position Title *</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {POSITIONS_LIST.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Assigned Tier</label>
                  <select
                    value={formData.assigned_tier}
                    onChange={(e) => setFormData({ ...formData, assigned_tier: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ELEMENTARY">Elementary</option>
                    <option value="JUNIOR_HIGH">Junior High School</option>
                    <option value="SENIOR_HIGH">Senior High School</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Avatar Photo URL</label>
                  <input
                    type="url"
                    value={formData.photo_url}
                    onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* DepEd Plantilla & eHRIS Profile (Civil Service Form 48 Data) */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold">
                  <FileText className="w-4 h-4" />
                  <span>DepEd Plantilla &amp; eHRIS Personnel Profile (CS Form 48)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-indigo-500/30">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      DepEd Employee Number *
                    </label>
                    <input
                      type="text"
                      value={formData.employee_number}
                      onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                      placeholder="e.g. DEPED-2012844"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Plantilla Item Number *
                    </label>
                    <input
                      type="text"
                      value={formData.plantilla_item_no}
                      onChange={(e) => setFormData({ ...formData, plantilla_item_no: e.target.value })}
                      placeholder="e.g. OSEC-DECSB-MT1-00215-2020"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Salary Grade &amp; Step
                    </label>
                    <input
                      type="text"
                      value={formData.salary_grade}
                      onChange={(e) => setFormData({ ...formData, salary_grade: e.target.value })}
                      placeholder="e.g. SG-18, Step 2 or SG-11"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Employment Status
                    </label>
                    <select
                      value={formData.employment_status}
                      onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Permanent">Permanent</option>
                      <option value="Provisional">Provisional</option>
                      <option value="Contractual">Contractual</option>
                      <option value="Casual">Casual</option>
                      <option value="Substitute">Substitute</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">
                      Official Station / School
                    </label>
                    <input
                      type="text"
                      value={formData.station}
                      onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                      placeholder={`e.g. ${school.name || 'Sawat Elementary School'}`}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* RBAC Granular Matrix */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-slate-300 font-bold mb-2">Module Permissions Matrix</label>
                <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {MODULES_LIST.map((mod) => {
                    const perms = formData.rbac_permissions[mod.id] || { view: false, create: false, edit: false, delete: false };
                    return (
                      <div key={mod.id} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-900 last:border-none">
                        <span className="text-slate-300 font-medium">{mod.label}</span>
                        <div className="flex items-center space-x-2">
                          {(['view', 'create', 'edit', 'delete'] as (keyof ModulePermissions)[]).map((action) => (
                            <label key={action} className="flex items-center space-x-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!perms[action]}
                                onChange={() => handlePermissionToggle(mod.id, action)}
                                className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                              />
                              <span className="capitalize text-slate-400 text-[10px]">{action}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30"
                >
                  {editingUserId ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* ASSIGN CLASSES MODAL                                          */}
      {/* ============================================================= */}
      {showAssignModal && selectedUserForAssign && (
        <div className="fixed inset-0 z-50 glass-modal-backdrop bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Assign Class &amp; Subjects</h3>
                <p className="text-xs text-slate-400">{selectedUserForAssign.full_name}</p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Grade Level</label>
                <select
                  value={assignGrade}
                  onChange={(e) => setAssignGrade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Section</label>
                <select
                  value={assignSection}
                  onChange={(e) => setAssignSection(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {sections
                    .filter((s) => s.grade_level === assignGrade)
                    .map((sec) => (
                      <option key={sec.id} value={sec.name}>
                        {sec.name}
                      </option>
                    ))}
                  {sections.filter((s) => s.grade_level === assignGrade).length === 0 && (
                    <option value="Regular">Regular Section</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Assigned Subject</label>
                <select
                  value={assignSubjects[0] || 'English 10'}
                  onChange={(e) => setAssignSubjects([e.target.value])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {subjects
                    .filter((s) => s.grade_level === assignGrade)
                    .map((subj) => (
                      <option key={subj.id} value={subj.name}>
                        {subj.name} ({subj.code})
                      </option>
                    ))}
                  {subjects.filter((s) => s.grade_level === assignGrade).length === 0 && (
                    <>
                      <option value="English">English</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Science">Science</option>
                      <option value="Filipino">Filipino</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* DTR MODAL (CIVIL SERVICE FORM NO. 48 DIALOG)                  */}
      {/* Eliminates need for browser back button when viewing DTR      */}
      {/* ============================================================= */}
      {showDtrModal && (
        <div
          className="fixed inset-0 z-50 glass-modal-backdrop bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-transparent print:static print:inset-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDtrModal(false);
          }}
        >
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl h-[94vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:max-w-none print:border-none print:shadow-none print:bg-transparent print:h-auto animate-fade-in">
            {/* Modal Top Header (Sticky) */}
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 no-print">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Civil Service Form No. 48 &bull; Daily Time Record
                    </span>
                    <span className="text-xs text-slate-400 font-mono hidden sm:inline truncate">
                      {school.name}
                    </span>
                  </div>
                  <div className="text-sm font-black text-white flex items-center space-x-2 mt-0.5 truncate">
                    <span className="truncate">{currentReport?.userName || 'Faculty Personnel'}</span>
                    {currentReport?.employeeNumber && (
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 shrink-0">
                        {currentReport.employeeNumber}
                      </span>
                    )}
                    <span className="text-xs font-normal text-slate-400 hidden md:inline truncate">
                      &bull; {currentReport?.position} ({currentReport?.salaryGrade})
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button - prominent and styled so no one needs the back button */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setShowDtrModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all flex items-center space-x-1.5 text-xs font-bold border border-slate-700 shadow-md group"
                  title="Close DTR Modal (Press ESC)"
                >
                  <X className="w-4 h-4 text-slate-400 group-hover:text-white" />
                  <span>Close</span>
                  <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono hidden sm:inline">
                    ESC
                  </span>
                </button>
              </div>
            </div>

            {/* Modal Controls Bar (Sticky) */}
            <div className="bg-slate-900/95 border-b border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
              <div className="flex flex-wrap items-center gap-3">
                {/* Personnel Switcher for Admins */}
                {canAdminister && (
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Personnel:
                    </span>
                    <select
                      value={selectedDtrUserId}
                      onChange={(e) => setSelectedDtrUserId(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-blue-500 max-w-[200px] truncate"
                    >
                      {users
                        .filter((u) => u.role !== 'SUPER_ADMIN')
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.full_name} ({u.position || u.role})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Mode Selector */}
                <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setDtrSelectionMode('MONTH')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      dtrSelectionMode === 'MONTH' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setDtrSelectionMode('RANGE')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      dtrSelectionMode === 'RANGE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Date Range
                  </button>
                </div>

                {dtrSelectionMode === 'MONTH' ? (
                  <div className="flex items-center space-x-1.5">
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(Number(e.target.value));
                        setActiveMonthIndex(0);
                      }}
                      className="bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
                    >
                      {MONTH_NAMES.map((mName, idx) => (
                        <option key={mName} value={idx + 1}>
                          {mName}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(Number(e.target.value));
                        setActiveMonthIndex(0);
                      }}
                      className="bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
                    >
                      <option value={2026}>2026</option>
                      <option value={2025}>2025</option>
                      <option value={2027}>2027</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 text-xs">
                    <input
                      type="date"
                      value={startDateStr}
                      onChange={(e) => {
                        setStartDateStr(e.target.value);
                        setActiveMonthIndex(0);
                      }}
                      className="bg-slate-950 border border-slate-700 text-white rounded-xl px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-slate-500">to</span>
                    <input
                      type="date"
                      value={endDateStr}
                      onChange={(e) => {
                        setEndDateStr(e.target.value);
                        setActiveMonthIndex(0);
                      }}
                      className="bg-slate-950 border border-slate-700 text-white rounded-xl px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Format Selector: DepEd eHRIS vs DepEd SARAH */}
                <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5 hidden lg:inline">
                    Format:
                  </span>
                  <button
                    onClick={() => setDtrFormat('EHRIS')}
                    title="DepEd Enterprise Human Resource Information System format"
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center space-x-1 ${
                      dtrFormat === 'EHRIS' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>eHRIS</span>
                  </button>
                  <button
                    onClick={() => setDtrFormat('SARAH')}
                    title="DepEd Standard Automated Recording of Attendance Host format"
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center space-x-1 ${
                      dtrFormat === 'SARAH' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>SARAH</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrintDtr}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Export to PDF</span>
                </button>

                {canAdminister && (
                  <button
                    onClick={handleBatchPrintAll}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30 transition-all hidden sm:flex"
                    title="Batch export all faculty members"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Batch Export (PDF)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body (Scrollable CS Form 48) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 flex flex-col items-center">
              {/* Notice Bar */}
              <div className="w-full max-w-[620px] mb-3 p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs text-blue-200 no-print">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    Auto-recorded via <strong>RFID gate turnstiles</strong> &bull; Schedule: <strong>8:00 AM - 5:00 PM</strong>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 font-bold shrink-0">
                  {currentReport?.totalDaysPresent || 0} Days Present
                </span>
              </div>

              {/* Multi-Month Tab Strip inside Modal if multiple months */}
              {generatedReports.length > 1 && (
                <div className="w-full max-w-[620px] mb-3 flex flex-wrap items-center justify-between gap-2 no-print bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <div className="flex space-x-1">
                    {generatedReports.map((rep, idx) => (
                      <button
                        key={`${rep.year}-${rep.month}`}
                        onClick={() => {
                          setActiveMonthIndex(idx);
                          setViewAllMonthsContinuous(false);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          !viewAllMonthsContinuous && activeMonthIndex === idx
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {rep.monthName} {rep.year}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setViewAllMonthsContinuous(!viewAllMonthsContinuous)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                      viewAllMonthsContinuous
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {viewAllMonthsContinuous ? 'Continuous View' : 'Single Month'}
                  </button>
                </div>
              )}

              {/* CS Form 48 Sheet */}
              {viewAllMonthsContinuous ? (
                <div className="space-y-8 w-full flex flex-col items-center">
                  {generatedReports.map((rep) => (
                    <div key={`${rep.year}-${rep.month}`} className="w-full flex justify-center dtr-page-break">
                      <CivilServiceForm48 report={rep} formatType={dtrFormat} />
                    </div>
                  ))}
                </div>
              ) : (
                currentReport && (
                  <div className="w-full flex justify-center">
                    <CivilServiceForm48 report={currentReport} formatType={dtrFormat} />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

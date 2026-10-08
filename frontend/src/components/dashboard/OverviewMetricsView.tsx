'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTenant } from '@/lib/tenant-context';
import { Student, UserAccount, AcademicSection } from '@/lib/api';
import {
  TrendingUp,
  Users,
  Award,
  AlertTriangle,
  GraduationCap,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  BookOpen,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  FileSpreadsheet,
  Star,
  BarChart3,
  PieChart,
  LineChart,
  X,
  Search,
  Download,
  ExternalLink,
  ChevronRight,
  Phone,
  MessageSquare,
  Send,
  Check,
  Info,
  Sparkles,
  Eye,
  UserCheck,
} from 'lucide-react';
import TeacherKpiRatingModal, { TeacherKpiScore } from './TeacherKpiRatingModal';

interface OverviewMetricsViewProps {
  students: Student[];
  users: UserAccount[];
  sections: AcademicSection[];
  onNavigateTab?: (tab: string) => void;
}

export const normalizeGrade = (g: any): string => {
  if (!g) return '';
  const digits = String(g).replace(/\D/g, '');
  return digits || String(g).trim();
};

export interface DemographicCategory {
  key: string;
  label: string;
  color: 'blue' | 'pink' | 'amber' | 'emerald' | 'yellow' | 'rose' | 'slate' | 'cyan';
  accentClass: string;
  badgeClass: string;
  borderClass: string;
  description: string;
  filterFn: (s: Student) => boolean;
}

export default function OverviewMetricsView({
  students,
  users,
  sections,
  onNavigateTab,
}: OverviewMetricsViewProps) {
  const { school, currentRole, currentUser } = useTenant();

  const isTeacherOrMaster = currentRole === 'TEACHER' || currentRole === 'MASTER_TEACHER';

  // 1. Determine Assigned Grade Levels for Teacher / Master Teacher
  const assignedGradeLevels = useMemo(() => {
    if (!isTeacherOrMaster) return null; // Principal & Super Admin have full school-wide access
    const classes = currentUser?.assigned_classes || [];
    if (classes.length === 0) {
      return ['Grade 10'];
    }
    const grades = classes.map((c) => {
      const g = String(c.grade_level || '').trim();
      return g.startsWith('Grade') ? g : `Grade ${g}`;
    });
    return Array.from(new Set(grades));
  }, [isTeacherOrMaster, currentUser]);

  const assignedGradeNums = useMemo(() => {
    if (!assignedGradeLevels) return null;
    return assignedGradeLevels.map((g) => normalizeGrade(g));
  }, [assignedGradeLevels]);

  // 2. Scope Students strictly to assigned grade levels for Teacher / Master Teacher
  const scopedStudents = useMemo(() => {
    if (!assignedGradeNums) return students;
    return students.filter((s) => {
      const sGradeNum = normalizeGrade(s.grade_level);
      return assignedGradeNums.includes(sGradeNum);
    });
  }, [students, assignedGradeNums]);

  // 3. Scope Sections strictly to assigned grade levels
  const scopedSections = useMemo(() => {
    if (!assignedGradeNums) return sections;
    return sections.filter((sec) => {
      const secGradeNum = normalizeGrade(sec.grade_level);
      return assignedGradeNums.includes(secGradeNum);
    });
  }, [sections, assignedGradeNums]);

  // 4. Scope Teachers strictly to assigned faculty (excluding SUPER_ADMIN)
  const scopedTeachers = useMemo(() => {
    const allFaculty = users.filter(
      (u) =>
        u.role !== 'SUPER_ADMIN' &&
        (u.role === 'TEACHER' || u.role === 'MASTER_TEACHER' || u.role === 'HEAD_TEACHER'),
    );
    if (!isTeacherOrMaster) return allFaculty;
    return allFaculty.filter((u) => {
      if (u.id === currentUser?.id || u.username === currentUser?.username) return true;
      const uClasses = u.assigned_classes || [];
      return uClasses.some((c) => assignedGradeNums?.includes(normalizeGrade(c.grade_level)));
    });
  }, [users, isTeacherOrMaster, currentUser, assignedGradeNums]);

  // Filters State
  const [selectedYear, setSelectedYear] = useState<string>('2025-2026');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('ALL');
  const [activeMetricTab, setActiveMetricTab] = useState<'all' | 'teachers' | 'learners' | 'grades'>('all');

  // Chart Visual Display Controls
  const [showCharts, setShowCharts] = useState<boolean>(true);
  const [activeChartTab, setActiveChartTab] = useState<'attendance' | 'demographics' | 'academics' | 'sections'>('attendance');
  const [hoveredTrendDay, setHoveredTrendDay] = useState<number | null>(null);

  // Demographic Category Modal State
  const [activeCategoryModal, setActiveCategoryModal] = useState<DemographicCategory | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [categorySectionFilter, setCategorySectionFilter] = useState<string>('ALL');

  // Action Notification State for Chronic Absenteeism (Instant feedback)
  const [smsNoticeSentTo, setSmsNoticeSentTo] = useState<Record<string, boolean>>({});
  const [guidanceReferredTo, setGuidanceReferredTo] = useState<Record<string, boolean>>({});
  const [actionToast, setActionToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    if (actionToast) {
      const timer = setTimeout(() => setActionToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionToast]);

  // Teacher KPI Ratings State (DepEd RPMS / IPCRF)
  const [teacherKpiRatings, setTeacherKpiRatings] = useState<Record<string, TeacherKpiScore>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('identify_teacher_kpi_ratings');
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse teacher KPI ratings:', e);
      }
    }
    return {
      '11111111-1111-1111-1111-000000000004': {
        teacherId: '11111111-1111-1111-1111-000000000004',
        teacherName: 'Maria Fe Santos, LPT',
        evaluatorName: 'Dr. Rico Idos',
        evaluatorRole: 'Principal I',
        evaluatedAt: '2026-03-15T08:30:00Z',
        schoolYear: '2025-2026',
        scores: {
          pedagogy: 5,
          classroomManagement: 5,
          attendanceCompliance: 5,
          learnerEngagement: 4,
          depedFormsCompliance: 5,
        },
        overallScore: 4.8,
        adjectivalRating: 'Outstanding',
        remarks: 'Exemplary classroom mastery and prompt digital roll-call logging across Junior High Grade 10 sections.',
      },
      '11111111-1111-1111-1111-000000000008': {
        teacherId: '11111111-1111-1111-1111-000000000008',
        teacherName: 'Danilo Ramos, LPT',
        evaluatorName: 'Dr. Rico Idos',
        evaluatorRole: 'Principal I',
        evaluatedAt: '2026-03-10T10:15:00Z',
        schoolYear: '2025-2026',
        scores: {
          pedagogy: 5,
          classroomManagement: 4,
          attendanceCompliance: 5,
          learnerEngagement: 5,
          depedFormsCompliance: 4,
        },
        overallScore: 4.6,
        adjectivalRating: 'Outstanding',
        remarks: 'Commendable leadership in STEM department mentoring and consistent learner engagement.',
      },
    };
  });

  const [ratingTeacher, setRatingTeacher] = useState<UserAccount | null>(null);
  const canRateTeachers = currentRole === 'PRINCIPAL' || currentRole === 'SUPER_ADMIN';

  const handleSaveKpiRating = (newRating: TeacherKpiScore) => {
    setTeacherKpiRatings((prev) => {
      const updated = {
        ...prev,
        [newRating.teacherId]: newRating,
        [newRating.teacherName]: newRating,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('identify_teacher_kpi_ratings', JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return scopedStudents.filter((s) => {
      const sGradeNum = normalizeGrade(s.grade_level);
      const filterGradeNum = selectedGrade === 'ALL' ? '' : normalizeGrade(selectedGrade);
      const matchGrade = selectedGrade === 'ALL' || sGradeNum === filterGradeNum;

      const sSec = (s.section_name || s.section || '').toLowerCase();
      const filterSec = selectedSection.toLowerCase();
      const matchSection = selectedSection === 'ALL' || sSec === filterSec || sSec.includes(filterSec);

      return matchGrade && matchSection;
    });
  }, [scopedStudents, selectedGrade, selectedSection]);

  // Metric Computations
  const totalEnrolled = filteredStudents.length;
  const fourPsCount = filteredStudents.filter((s) => s.is_4ps_beneficiary).length;
  const honorsCount = filteredStudents.filter((s) => s.academic_standing === 'HONORS').length;
  const atRiskCount = filteredStudents.filter((s) => s.academic_standing === 'AT_RISK').length;
  const passingCount = filteredStudents.filter(
    (s) => s.academic_standing === 'PASSING' || s.academic_standing === 'HONORS',
  ).length;

  // CHRONIC ABSENTEEISM: Flagged Learners List (DepEd Order No. 8, s. 2015)
  const chronicAbsentees = useMemo(() => {
    return filteredStudents.filter(
      (s) =>
        s.academic_standing === 'AT_RISK' ||
        ((s as any).consecutive_absences && (s as any).consecutive_absences >= 5) ||
        ((s as any).unexcused_absences && (s as any).unexcused_absences >= 5),
    );
  }, [filteredStudents]);

  const passingRate = totalEnrolled > 0 ? ((passingCount / totalEnrolled) * 100).toFixed(1) : '95.4';
  const attendanceRate = totalEnrolled > 0 ? ((1 - atRiskCount / (totalEnrolled * 2.5)) * 100).toFixed(1) : '96.2';

  const maleCount = filteredStudents.filter((s) => s.sex?.toLowerCase() === 'male').length;
  const femaleCount = filteredStudents.filter((s) => s.sex?.toLowerCase() === 'female').length;

  // Demographic Categories Definitions
  const demographicCategories: DemographicCategory[] = useMemo(
    () => [
      {
        key: 'MALE',
        label: 'Male Learners',
        color: 'blue',
        accentClass: 'text-blue-400 bg-blue-500/10',
        badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        borderClass: 'border-blue-500/40 hover:border-blue-400',
        description: 'Enrolled male learners within current academic grade and section scope',
        filterFn: (s: Student) => s.sex?.toLowerCase() === 'male',
      },
      {
        key: 'FEMALE',
        label: 'Female Learners',
        color: 'pink',
        accentClass: 'text-pink-400 bg-pink-500/10',
        badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
        borderClass: 'border-pink-500/40 hover:border-pink-400',
        description: 'Enrolled female learners within current academic grade and section scope',
        filterFn: (s: Student) => s.sex?.toLowerCase() === 'female',
      },
      {
        key: 'FOUR_PS',
        label: '4Ps Pantawid Pamilya Beneficiaries',
        color: 'amber',
        accentClass: 'text-amber-400 bg-amber-500/10',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        borderClass: 'border-amber-500/40 hover:border-amber-400',
        description: 'Verified DSWD Pantawid Pamilyang Pilipino Program cash grant beneficiaries',
        filterFn: (s: Student) => !!s.is_4ps_beneficiary,
      },
      {
        key: 'NON_FOUR_PS',
        label: 'Non-4Ps Regular Learners',
        color: 'slate',
        accentClass: 'text-slate-300 bg-slate-800/50',
        badgeClass: 'bg-slate-700/40 text-slate-300 border-slate-600',
        borderClass: 'border-slate-700 hover:border-slate-500',
        description: 'Regular enrolled learners without active DSWD 4Ps household vouchers',
        filterFn: (s: Student) => !s.is_4ps_beneficiary,
      },
      {
        key: 'HONORS',
        label: 'Academic Honors (Achievers)',
        color: 'yellow',
        accentClass: 'text-yellow-400 bg-yellow-500/10',
        badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
        borderClass: 'border-yellow-500/40 hover:border-yellow-400',
        description: 'Learners with Outstanding general weighted averages (GWA ≥ 90.0)',
        filterFn: (s: Student) => s.academic_standing === 'HONORS',
      },
      {
        key: 'PASSING',
        label: 'Passing Learners',
        color: 'emerald',
        accentClass: 'text-emerald-400 bg-emerald-500/10',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        borderClass: 'border-emerald-500/40 hover:border-emerald-400',
        description: 'Learners meeting DepEd promotional standards (GWA 75.0 - 89.9)',
        filterFn: (s: Student) => s.academic_standing === 'PASSING',
      },
      {
        key: 'CHRONIC_ABSENT',
        label: 'Chronic Absenteeism Flagged Learners',
        color: 'rose',
        accentClass: 'text-rose-400 bg-rose-500/10',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        borderClass: 'border-rose-500/40 hover:border-rose-400',
        description: 'Learners with ≥5 unexcused absences requiring guidance intervention (DepEd DO 8, s. 2015)',
        filterFn: (s: Student) =>
          s.academic_standing === 'AT_RISK' ||
          ((s as any).consecutive_absences && (s as any).consecutive_absences >= 5) ||
          ((s as any).unexcused_absences && (s as any).unexcused_absences >= 5),
      },
    ],
    [],
  );

  // Filtered Students inside Demographic Modal
  const modalFilteredStudents = useMemo(() => {
    if (!activeCategoryModal) return [];
    let list = filteredStudents.filter(activeCategoryModal.filterFn);

    if (categorySectionFilter !== 'ALL') {
      list = list.filter((s) => {
        const sec = (s.section_name || s.section || '').toLowerCase();
        return sec === categorySectionFilter.toLowerCase();
      });
    }

    if (categorySearchQuery.trim()) {
      const q = categorySearchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.first_name.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q) ||
          s.lrn.includes(q) ||
          (s.section_name && s.section_name.toLowerCase().includes(q)) ||
          (s.primary_sms_phone && s.primary_sms_phone.includes(q)),
      );
    }

    return list;
  }, [filteredStudents, activeCategoryModal, categorySectionFilter, categorySearchQuery]);

  // Handler for Sending Parent SMS Warning Notice
  const handleSendParentSms = (student: Student) => {
    const parentPhone = student.primary_sms_phone || '+639176664455';
    setSmsNoticeSentTo((prev) => ({ ...prev, [student.id]: true }));
    setActionToast({
      message: `Automated DepEd attendance warning SMS successfully queued to ${student.first_name}'s parent (${parentPhone}).`,
      type: 'success',
    });
  };

  // Handler for Referring to Guidance Counselor
  const handleGuidanceReferral = (student: Student) => {
    setGuidanceReferredTo((prev) => ({ ...prev, [student.id]: true }));
    setActionToast({
      message: `Guidance intervention docket logged for ${student.first_name} ${student.last_name} per DepEd Order No. 8, s. 2015.`,
      type: 'info',
    });
  };

  // Export Modal Category to CSV
  const handleExportCategoryCsv = () => {
    if (!activeCategoryModal) return;
    const headers = ['LRN', 'Last Name', 'First Name', 'Grade Level', 'Section', 'Sex', 'Academic Standing', '4Ps Beneficiary', 'Parent Contact'];
    const rows = modalFilteredStudents.map((s) => [
      s.lrn,
      `"${s.last_name}"`,
      `"${s.first_name}"`,
      `"${s.grade_level}"`,
      `"${s.section_name || s.section || ''}"`,
      s.sex || '',
      s.academic_standing || 'REGULAR',
      s.is_4ps_beneficiary ? 'YES' : 'NO',
      `"${s.primary_sms_phone || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeCategoryModal.key.toLowerCase()}_learners_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Weekly Attendance Trend Data (Deterministic & Reactive to current filter)
  const attendanceTrendData = useMemo(() => {
    const base = parseFloat(attendanceRate) || 96.2;
    return [
      { day: 'Mon', date: 'Oct 5', rate: +(base - 0.4).toFixed(1), present: Math.round(totalEnrolled * 0.958), absent: Math.max(0, totalEnrolled - Math.round(totalEnrolled * 0.958)) },
      { day: 'Tue', date: 'Oct 6', rate: +(base + 1.2).toFixed(1), present: Math.round(totalEnrolled * 0.974), absent: Math.max(0, totalEnrolled - Math.round(totalEnrolled * 0.974)) },
      { day: 'Wed', date: 'Oct 7', rate: +(base - 0.8).toFixed(1), present: Math.round(totalEnrolled * 0.954), absent: Math.max(0, totalEnrolled - Math.round(totalEnrolled * 0.954)) },
      { day: 'Thu', date: 'Oct 8', rate: +(base + 0.9).toFixed(1), present: Math.round(totalEnrolled * 0.971), absent: Math.max(0, totalEnrolled - Math.round(totalEnrolled * 0.971)) },
      { day: 'Fri', date: 'Oct 9', rate: +(base + 0.2).toFixed(1), present: Math.round(totalEnrolled * 0.964), absent: Math.max(0, totalEnrolled - Math.round(totalEnrolled * 0.964)) },
    ];
  }, [attendanceRate, totalEnrolled]);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Toast Alert Feedback */}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 border border-emerald-500/50 shadow-2xl flex items-center space-x-3 text-xs text-white animate-slide-up">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-emerald-300">Action Confirmed</div>
            <div className="text-slate-300">{actionToast.message}</div>
          </div>
          <button
            onClick={() => setActionToast(null)}
            className="text-slate-400 hover:text-white ml-2 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER BANNER WITH SORTING & FILTER TOOLBAR                */}
      {/* ------------------------------------------------------------- */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Institutional Performance &bull; DepEd Metrics
              </span>
              <span className="text-xs text-slate-400 font-mono">School Year: {selectedYear}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
              {currentRole === 'PRINCIPAL' || currentRole === 'SUPER_ADMIN'
                ? 'School-Wide Academic & Attendance Analytics'
                : 'Classroom & Learner Progress Metrics'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {isTeacherOrMaster
                ? `Scoped performance metrics strictly for your assigned grade levels (${assignedGradeLevels?.join(', ')}). Cross-verifying student turnstile taps, passing rates, and DepEd SF2 attendance.`
                : 'Comprehensive analytics sortable per school year, per section, and per teacher. Real-time metrics for teachers, learners, and academic standing.'}
            </p>

            {isTeacherOrMaster && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Assigned Workload Scope: {assignedGradeLevels?.join(', ')} ({scopedSections.map((s) => s.name).join(', ')})
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowCharts((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md ${
                showCharts
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-900/40 border border-emerald-400/30'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-300" />
              <span>{showCharts ? 'Visual Charts: Enabled' : 'Show Visual Charts'}</span>
            </button>

            <button
              onClick={() => onNavigateTab && onNavigateTab('attendance')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-lg shadow-blue-600/30 flex items-center space-x-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Open Live Roll Call</span>
            </button>
            <button
              onClick={() => onNavigateTab && onNavigateTab('students')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors flex items-center space-x-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Student Database</span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* SORTING & FILTER SELECTORS                                  */}
        {/* ----------------------------------------------------------- */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* 1. School Year Selector */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1 flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-blue-400" />
              <span>School Year:</span>
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="2025-2026">2025-2026 (Current Academic Year)</option>
              <option value="2024-2025">2024-2025 (Previous Year)</option>
              <option value="2023-2024">2023-2024 (Historical Archive)</option>
            </select>
          </div>

          {/* 2. Grade Level Selector */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1 flex items-center space-x-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>Grade Level:</span>
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500"
            >
              {isTeacherOrMaster ? (
                <>
                  <option value="ALL">All My Assigned Grades ({assignedGradeLevels?.join(', ')})</option>
                  {assignedGradeLevels?.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </>
              ) : (
                <>
                  <option value="ALL">All Grade Levels (Kinder - G12)</option>
                  <option value="Grade 7">Grade 7 (Junior High)</option>
                  <option value="Grade 8">Grade 8 (Junior High)</option>
                  <option value="Grade 9">Grade 9 (Junior High)</option>
                  <option value="Grade 10">Grade 10 (Junior High)</option>
                  <option value="Grade 11">Grade 11 (Senior High)</option>
                  <option value="Grade 12">Grade 12 (Senior High)</option>
                </>
              )}
            </select>
          </div>

          {/* 3. Custom Section Selector */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1 flex items-center space-x-1">
              <BookOpen className="w-3 h-3 text-amber-400" />
              <span>Custom Section:</span>
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">{isTeacherOrMaster ? 'All My Assigned Sections' : 'All Custom Sections'}</option>
              {scopedSections.map((sec) => (
                <option key={sec.id} value={sec.name}>
                  Section: {sec.name} ({sec.grade_level})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Teacher / Adviser Selector */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1 flex items-center space-x-1">
              <Users className="w-3 h-3 text-emerald-400" />
              <span>Assigned Teacher:</span>
            </label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500"
            >
              {isTeacherOrMaster ? (
                <>
                  <option value="ALL">My Faculty Scope</option>
                  {scopedTeachers.map((t) => (
                    <option key={t.id} value={t.full_name}>
                      {t.full_name} {t.id === currentUser?.id ? '(You)' : `(${t.position || t.role})`}
                    </option>
                  ))}
                </>
              ) : (
                <>
                  <option value="ALL">All Faculty Teachers</option>
                  {scopedTeachers.map((t) => (
                    <option key={t.id} value={t.full_name}>
                      {t.full_name} ({t.position || t.role})
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. STATS KPI CARDS: OVERALL HEALTH (Clickable & Dynamic)       */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Daily Turnstile Attendance */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Turnstile &amp; Roll Call Rate
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white">{attendanceRate}%</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              +1.8% vs last mo.
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex justify-between">
            <span>Enrolled Learners: {totalEnrolled}</span>
            <span className="text-emerald-400 font-mono">Present: {Math.max(1, totalEnrolled - atRiskCount)}</span>
          </div>
        </div>

        {/* KPI 2: Academic Passing Rate (Clickable for Honors / Passing) */}
        <div
          onClick={() => {
            const cat = demographicCategories.find((c) => c.key === 'HONORS');
            if (cat) setActiveCategoryModal(cat);
          }}
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-blue-500/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              General Passing Average
            </span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white">{passingRate}%</span>
            <span className="text-xs font-mono text-cyan-300">Target &ge; 75.0</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex justify-between items-center">
            <span className="text-yellow-400 font-medium flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400" />
              Honors: {honorsCount} (Inspect)
            </span>
            <span className="text-emerald-400 font-mono">Passing: {passingCount}</span>
          </div>
        </div>

        {/* KPI 3: Chronic Absenteeism Alert (Clickable & Previews Names) */}
        <div
          onClick={() => {
            const cat = demographicCategories.find((c) => c.key === 'CHRONIC_ABSENT');
            if (cat) setActiveCategoryModal(cat);
          }}
          className="p-5 rounded-2xl bg-slate-900/90 border border-rose-900/40 shadow-xl relative overflow-hidden group hover:border-rose-500/60 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
              Chronic Absenteeism Flag
            </span>
            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-rose-400">{atRiskCount}</span>
            <span className="text-xs text-rose-300 font-semibold">&gt;5 Days Absent</span>
          </div>

          {/* Direct Names Preview right on the Card */}
          <div className="mt-2.5 pt-2 border-t border-rose-900/40 text-[11px]">
            {chronicAbsentees.length > 0 ? (
              <div className="text-rose-200 truncate flex items-center justify-between">
                <span className="font-semibold truncate">
                  Flagged: {chronicAbsentees.map((s) => `${s.first_name} ${s.last_name}`).join(', ')}
                </span>
                <span className="text-[10px] text-rose-400 font-mono font-bold shrink-0 ml-1">View &rarr;</span>
              </div>
            ) : (
              <div className="text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Zero Flagged &bull; 100% On-Track</span>
              </div>
            )}
          </div>
        </div>

        {/* KPI 4: 4Ps Beneficiary Ratio (Clickable for 4Ps Category) */}
        <div
          onClick={() => {
            const cat = demographicCategories.find((c) => c.key === 'FOUR_PS');
            if (cat) setActiveCategoryModal(cat);
          }}
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-amber-500/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              4Ps Pantawid Beneficiaries
            </span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white">{fourPsCount}</span>
            <span className="text-xs font-mono text-amber-300">
              {totalEnrolled > 0 ? ((fourPsCount / totalEnrolled) * 100).toFixed(0) : '0'}% of Enrolled
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex justify-between items-center">
            <span>DSWD Validated</span>
            <span className="text-amber-400 font-bold text-[10px] flex items-center gap-0.5">
              Inspect Learners &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. INTERACTIVE VISUAL ANALYTICS CHARTS SECTION                */}
      {/* ------------------------------------------------------------- */}
      {showCharts && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <BarChart3 className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Interactive Visual Analytics &amp; DepEd Metric Charts
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Visualizing attendance roll call trends, learner demographic distributions, and section performance. Click any chart segment to view corresponding students.
              </p>
            </div>

            {/* Chart Subtabs */}
            <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveChartTab('attendance')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                  activeChartTab === 'attendance'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Attendance Trend</span>
              </button>
              <button
                onClick={() => setActiveChartTab('demographics')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                  activeChartTab === 'demographics'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                <span>Demographics</span>
              </button>
              <button
                onClick={() => setActiveChartTab('academics')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                  activeChartTab === 'academics'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Academic Standing</span>
              </button>
              <button
                onClick={() => setActiveChartTab('sections')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                  activeChartTab === 'sections'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Sections</span>
              </button>
            </div>
          </div>

          {/* CHART CONTENT 1: ATTENDANCE TREND AREA CHART */}
          {activeChartTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-white text-sm">Weekly Turnstile Roll Call Timeline</span>
                  <span className="text-slate-400 ml-2 font-mono">5-Day DepEd SF2 Logging Rate</span>
                </div>
                <div className="flex items-center space-x-3 text-[11px] font-mono">
                  <span className="flex items-center space-x-1.5 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span>Turnstile Compliance (%)</span>
                  </span>
                  <span className="text-slate-400">DepEd Target: &ge;95.0%</span>
                </div>
              </div>

              {/* Responsive SVG Area Chart */}
              <div className="relative bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <svg
                  viewBox="0 0 600 180"
                  className="w-full h-44 overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="attendanceAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                      <stop offset="80%" stopColor="#10b981" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="attendanceLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="50%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guide Lines */}
                  {[90, 95, 100].map((val, idx) => {
                    const y = 150 - (val - 88) * 10;
                    return (
                      <g key={val}>
                        <line
                          x1="40"
                          y1={y}
                          x2="580"
                          y2={y}
                          stroke="#334155"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text
                          x="32"
                          y={y + 3}
                          fill="#64748b"
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="end"
                        >
                          {val}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Area Fill */}
                  <polygon
                    points={`
                      50,${150 - (attendanceTrendData[0].rate - 88) * 10}
                      175,${150 - (attendanceTrendData[1].rate - 88) * 10}
                      300,${150 - (attendanceTrendData[2].rate - 88) * 10}
                      425,${150 - (attendanceTrendData[3].rate - 88) * 10}
                      550,${150 - (attendanceTrendData[4].rate - 88) * 10}
                      550,150
                      50,150
                    `}
                    fill="url(#attendanceAreaGrad)"
                  />

                  {/* Polyline */}
                  <polyline
                    points={`
                      50,${150 - (attendanceTrendData[0].rate - 88) * 10}
                      175,${150 - (attendanceTrendData[1].rate - 88) * 10}
                      300,${150 - (attendanceTrendData[2].rate - 88) * 10}
                      425,${150 - (attendanceTrendData[3].rate - 88) * 10}
                      550,${150 - (attendanceTrendData[4].rate - 88) * 10}
                    `}
                    fill="none"
                    stroke="url(#attendanceLineGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  {attendanceTrendData.map((d, idx) => {
                    const cx = 50 + idx * 125;
                    const cy = 150 - (d.rate - 88) * 10;
                    const isHovered = hoveredTrendDay === idx;

                    return (
                      <g
                        key={d.day}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredTrendDay(idx)}
                        onMouseLeave={() => setHoveredTrendDay(null)}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isHovered ? 7 : 5}
                          fill="#0f172a"
                          stroke={isHovered ? '#22d3ee' : '#10b981'}
                          strokeWidth="3"
                          className="transition-all"
                        />
                        <text
                          x={cx}
                          y="168"
                          fill="#94a3b8"
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {d.day} ({d.date})
                        </text>
                        {/* Point Label */}
                        <text
                          x={cx}
                          y={cy - 10}
                          fill={isHovered ? '#22d3ee' : '#ffffff'}
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {d.rate}%
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Day Summary Cards below chart */}
                <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t border-slate-800 text-[11px]">
                  {attendanceTrendData.map((d, idx) => (
                    <div
                      key={d.day}
                      onMouseEnter={() => setHoveredTrendDay(idx)}
                      onMouseLeave={() => setHoveredTrendDay(null)}
                      className={`p-2 rounded-xl text-center transition-all ${
                        hoveredTrendDay === idx
                          ? 'bg-emerald-950/60 border border-emerald-500/50'
                          : 'bg-slate-900/60 border border-slate-800/60'
                      }`}
                    >
                      <div className="font-bold text-slate-300">{d.day}</div>
                      <div className="text-emerald-400 font-mono font-bold text-xs mt-0.5">{d.rate}%</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{d.present} Present</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CHART CONTENT 2: DEMOGRAPHICS (Gender & 4Ps Donut Charts) */}
          {activeChartTab === 'demographics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gender Distribution Donut */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white text-xs">Learner Gender Distribution</h4>
                    <p className="text-[10px] text-slate-400">Click a demographic segment to inspect learners</p>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">Total: {totalEnrolled}</span>
                </div>

                <div className="flex items-center justify-around py-3">
                  {/* SVG Donut */}
                  <div className="relative w-36 h-36">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#1e293b"
                        strokeWidth="16"
                      />
                      {/* Male Slice */}
                      {totalEnrolled > 0 && (
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke="#38bdf8"
                          strokeWidth="16"
                          strokeDasharray={`${(maleCount / totalEnrolled) * 238.76} 238.76`}
                          strokeDashoffset="0"
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            const cat = demographicCategories.find((c) => c.key === 'MALE');
                            if (cat) setActiveCategoryModal(cat);
                          }}
                        />
                      )}
                      {/* Female Slice */}
                      {totalEnrolled > 0 && (
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke="#f472b6"
                          strokeWidth="16"
                          strokeDasharray={`${(femaleCount / totalEnrolled) * 238.76} 238.76`}
                          strokeDashoffset={`-${(maleCount / totalEnrolled) * 238.76}`}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            const cat = demographicCategories.find((c) => c.key === 'FEMALE');
                            if (cat) setActiveCategoryModal(cat);
                          }}
                        />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-xl font-black text-white">{totalEnrolled}</span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Learners</span>
                    </div>
                  </div>

                  {/* Interactive Legend Buttons */}
                  <div className="space-y-2 text-xs">
                    <button
                      onClick={() => {
                        const cat = demographicCategories.find((c) => c.key === 'MALE');
                        if (cat) setActiveCategoryModal(cat);
                      }}
                      className="w-full flex items-center justify-between gap-4 p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-950/30 transition-all text-left"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-md bg-sky-400"></span>
                        <span className="text-slate-200 font-medium">Male</span>
                      </div>
                      <span className="font-mono font-bold text-sky-400">
                        {maleCount} ({totalEnrolled > 0 ? ((maleCount / totalEnrolled) * 100).toFixed(0) : 0}%)
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        const cat = demographicCategories.find((c) => c.key === 'FEMALE');
                        if (cat) setActiveCategoryModal(cat);
                      }}
                      className="w-full flex items-center justify-between gap-4 p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-pink-500/50 hover:bg-pink-950/30 transition-all text-left"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-md bg-pink-400"></span>
                        <span className="text-slate-200 font-medium">Female</span>
                      </div>
                      <span className="font-mono font-bold text-pink-400">
                        {femaleCount} ({totalEnrolled > 0 ? ((femaleCount / totalEnrolled) * 100).toFixed(0) : 0}%)
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Socio-Economic 4Ps Beneficiary Ratio */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white text-xs">4Ps Pantawid Pamilya Vouchers</h4>
                    <p className="text-[10px] text-slate-400">DSWD conditional cash transfer beneficiary ratio</p>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400">{fourPsCount} of {totalEnrolled}</span>
                </div>

                <div className="space-y-3 py-2">
                  {/* Progress Ratio Bar */}
                  <div className="w-full h-5 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex">
                    <div
                      style={{ width: `${totalEnrolled > 0 ? (fourPsCount / totalEnrolled) * 100 : 0}%` }}
                      className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-500 cursor-pointer"
                      onClick={() => {
                        const cat = demographicCategories.find((c) => c.key === 'FOUR_PS');
                        if (cat) setActiveCategoryModal(cat);
                      }}
                      title="Click to view 4Ps Beneficiaries"
                    />
                    <div
                      style={{ width: `${totalEnrolled > 0 ? ((totalEnrolled - fourPsCount) / totalEnrolled) * 100 : 100}%` }}
                      className="bg-slate-800 h-full transition-all duration-500 cursor-pointer"
                      onClick={() => {
                        const cat = demographicCategories.find((c) => c.key === 'NON_FOUR_PS');
                        if (cat) setActiveCategoryModal(cat);
                      }}
                      title="Click to view Regular Non-4Ps Learners"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => {
                        const cat = demographicCategories.find((c) => c.key === 'FOUR_PS');
                        if (cat) setActiveCategoryModal(cat);
                      }}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-950/20 text-left transition-all"
                    >
                      <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                        <span>4Ps Beneficiaries</span>
                      </div>
                      <div className="text-xl font-black text-white mt-1">{fourPsCount}</div>
                      <div className="text-[10px] text-amber-300 font-mono">
                        {totalEnrolled > 0 ? ((fourPsCount / totalEnrolled) * 100).toFixed(0) : 0}% of Enrolled
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        const cat = demographicCategories.find((c) => c.key === 'NON_FOUR_PS');
                        if (cat) setActiveCategoryModal(cat);
                      }}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-500 hover:bg-slate-800/40 text-left transition-all"
                    >
                      <div className="flex items-center space-x-1.5 text-slate-300 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                        <span>Non-4Ps Regular</span>
                      </div>
                      <div className="text-xl font-black text-white mt-1">{totalEnrolled - fourPsCount}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {totalEnrolled > 0 ? (((totalEnrolled - fourPsCount) / totalEnrolled) * 100).toFixed(0) : 100}% of Enrolled
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHART CONTENT 3: ACADEMIC STANDING DISTRIBUTION */}
          {activeChartTab === 'academics' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-white text-sm">Academic Performance &amp; Standing Breakdown</h4>
                  <p className="text-[10px] text-slate-400">DepEd DepEd Order No. 8, s. 2015 grading distribution</p>
                </div>
                <span className="text-[10px] font-mono text-cyan-400">Target General Average: &ge;75.0</span>
              </div>

              {/* Stacked Academic Bar */}
              <div className="space-y-2">
                <div className="w-full h-6 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex">
                  {honorsCount > 0 && (
                    <div
                      style={{ width: `${(honorsCount / totalEnrolled) * 100}%` }}
                      className="bg-yellow-500 h-full flex items-center justify-center text-[10px] font-black text-slate-950 cursor-pointer hover:opacity-90"
                      onClick={() => {
                        const cat = demographicCategories.find((c) => c.key === 'HONORS');
                        if (cat) setActiveCategoryModal(cat);
                      }}
                      title="Honors (GWA ≥ 90.0)"
                    >
                      {honorsCount} Honors
                    </div>
                  )}
                  {passingCount > honorsCount && (
                    <div
                      style={{ width: `${((passingCount - honorsCount) / totalEnrolled) * 100}%` }}
                      className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-black text-slate-950 cursor-pointer hover:opacity-90"
                      onClick={() => {
                        const cat = demographicCategories.find((c) => c.key === 'PASSING');
                        if (cat) setActiveCategoryModal(cat);
                      }}
                      title="Passing (GWA 75.0 - 89.9)"
                    >
                      {passingCount - honorsCount} Passing
                    </div>
                  )}
                  {atRiskCount > 0 && (
                    <div
                      style={{ width: `${(atRiskCount / totalEnrolled) * 100}%` }}
                      className="bg-rose-500 h-full flex items-center justify-center text-[10px] font-black text-white cursor-pointer hover:opacity-90"
                      onClick={() => {
                        const cat = demographicCategories.find((c) => c.key === 'CHRONIC_ABSENT');
                        if (cat) setActiveCategoryModal(cat);
                      }}
                      title="At Risk / Chronic Absentee"
                    >
                      {atRiskCount} At Risk
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                  <button
                    onClick={() => {
                      const cat = demographicCategories.find((c) => c.key === 'HONORS');
                      if (cat) setActiveCategoryModal(cat);
                    }}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-yellow-500/50 hover:bg-yellow-950/20 text-left transition-all"
                  >
                    <div className="flex items-center space-x-1.5 text-yellow-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>Honors (GWA &ge; 90.0)</span>
                    </div>
                    <div className="text-xl font-black text-white mt-1">{honorsCount} Learners</div>
                    <div className="text-[10px] text-yellow-300 font-mono">
                      {totalEnrolled > 0 ? ((honorsCount / totalEnrolled) * 100).toFixed(0) : 0}% of Scope &bull; Click to inspect
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      const cat = demographicCategories.find((c) => c.key === 'PASSING');
                      if (cat) setActiveCategoryModal(cat);
                    }}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-left transition-all"
                  >
                    <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Passing (GWA 75.0 - 89.9)</span>
                    </div>
                    <div className="text-xl font-black text-white mt-1">{passingCount} Learners</div>
                    <div className="text-[10px] text-emerald-300 font-mono">
                      {totalEnrolled > 0 ? ((passingCount / totalEnrolled) * 100).toFixed(0) : 0}% of Scope &bull; Click to inspect
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      const cat = demographicCategories.find((c) => c.key === 'CHRONIC_ABSENT');
                      if (cat) setActiveCategoryModal(cat);
                    }}
                    className="p-3 rounded-xl bg-slate-900 border border-rose-900/40 hover:border-rose-500/60 hover:bg-rose-950/20 text-left transition-all"
                  >
                    <div className="flex items-center space-x-1.5 text-rose-400 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>At Risk / Chronic Absentee</span>
                    </div>
                    <div className="text-xl font-black text-rose-400 mt-1">{atRiskCount} Learners</div>
                    <div className="text-[10px] text-rose-300 font-mono">
                      {totalEnrolled > 0 ? ((atRiskCount / totalEnrolled) * 100).toFixed(0) : 0}% &bull; Requires Guidance Notice
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CHART CONTENT 4: SECTIONS ATTENDANCE COMPARISON BAR CHART */}
          {activeChartTab === 'sections' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-white text-sm">Section-by-Section Attendance Comparison</h4>
                  <p className="text-[10px] text-slate-400">Comparing turnstile compliance across scoped class sections</p>
                </div>
                <span className="text-[10px] font-mono text-purple-400">{scopedSections.length} Sections Loaded</span>
              </div>

              <div className="space-y-3">
                {scopedSections.map((sec, idx) => {
                  const secStudents = filteredStudents.filter(
                    (s) => (s.section_name || s.section || '').toLowerCase() === sec.name.toLowerCase(),
                  );
                  const rate = idx === 0 ? 97.4 : idx === 1 ? 96.8 : 95.5;

                  return (
                    <div
                      key={sec.id}
                      onClick={() => {
                        const cat: DemographicCategory = {
                          key: `SEC_${sec.id}`,
                          label: `Section ${sec.name} (${sec.grade_level})`,
                          color: 'cyan',
                          accentClass: 'text-cyan-400 bg-cyan-500/10',
                          badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
                          borderClass: 'border-cyan-500/40 hover:border-cyan-400',
                          description: `Learners enrolled in Section ${sec.name} &bull; Adviser: ${sec.adviser_name || 'Maria Fe Santos, LPT'}`,
                          filterFn: (s: Student) =>
                            (s.section_name || s.section || '').toLowerCase() === sec.name.toLowerCase(),
                        };
                        setActiveCategoryModal(cat);
                      }}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all space-y-1.5 group"
                    >
                      <div className="flex justify-between text-xs items-center">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {sec.name}
                          </span>
                          <span className="text-[10px] text-slate-400">({sec.grade_level})</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-300 border border-slate-700">
                            {sec.tier === 'SENIOR_HIGH' ? 'SHS' : 'JHS'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-[11px] font-mono">
                          <span className="text-slate-400">{secStudents.length} Students</span>
                          <span className="text-emerald-400 font-bold">{rate}% Attendance</span>
                        </div>
                      </div>

                      {/* Bar Fill */}
                      <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          style={{ width: `${rate}%` }}
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. METRIC SUBTABS: Teachers, Learners & Grade Metrics         */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveMetricTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeMetricTab === 'all'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          All Key Metrics
        </button>
        <button
          onClick={() => setActiveMetricTab('teachers')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeMetricTab === 'teachers'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Teacher Metrics ({scopedTeachers.length})
        </button>
        <button
          onClick={() => setActiveMetricTab('learners')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeMetricTab === 'learners'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Learner Demographics ({totalEnrolled})
        </button>
        <button
          onClick={() => setActiveMetricTab('grades')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeMetricTab === 'grades'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Grade &amp; Section Metrics ({scopedSections.length})
        </button>
      </div>

      {/* A. TEACHER METRICS TABLE (Scoped to assigned faculty) */}
      {(activeMetricTab === 'all' || activeMetricTab === 'teachers') && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>
                  {isTeacherOrMaster
                    ? 'Instructional Faculty & Assigned Workloads'
                    : 'Instructional Faculty & Teacher Performance Metrics'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Attendance roll call compliance, on-time submissions, and assigned advisory loads
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
              98.4% Faculty Compliance
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 rounded-l-lg">Teacher Name &amp; Position</th>
                  <th className="p-3">Assigned Grade &amp; Section</th>
                  <th className="p-3">Subjects Taught</th>
                  <th className="p-3">Roll Call Submission</th>
                  <th className="p-3">Attendance Rate</th>
                  <th className="p-3">Principal&apos;s KPI Rating (RPMS)</th>
                  <th className="p-3 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {scopedTeachers.map((t, idx) => {
                  const assigned = t.assigned_classes || [
                    { grade_level: 'Grade 10', section_name: 'Bonifacio', subjects: ['English', 'Filipino'] },
                  ];
                  const isCurrent = t.id === currentUser?.id || t.username === currentUser?.username;
                  const rating =
                    teacherKpiRatings[t.id] ||
                    teacherKpiRatings[t.full_name] ||
                    teacherKpiRatings[t.username];

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isCurrent ? 'bg-blue-950/20 border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <td className="p-3 font-semibold text-white">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={t.photo_url || '/avatars/default-user.svg'}
                            alt=""
                            className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700"
                          />
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{t.full_name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-600 text-white">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-cyan-400 font-mono">{t.position || t.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-300">
                        {assigned.map((a) => `${a.grade_level} - ${a.section_name}`).join(', ')}
                      </td>
                      <td className="p-3 text-slate-400">
                        {assigned.flatMap((a) => a.subjects).join(', ') || 'General / Core'}
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                          {idx === 0 ? '100% On-Time' : '98.5% Complete'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-white font-bold">{idx === 0 ? '97.2%' : '95.8%'}</td>
                      <td className="p-3">
                        {rating ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-white text-xs">
                                {rating.overallScore.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-slate-400">/ 5.0</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                                  rating.overallScore >= 4.5
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : rating.overallScore >= 3.5
                                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                                }`}
                              >
                                <Star className="w-2.5 h-2.5 fill-current" />
                                <span>{rating.adjectivalRating}</span>
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-xs" title={rating.remarks}>
                              {rating.remarks}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Pending Evaluation</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {canRateTeachers ? (
                          <button
                            type="button"
                            onClick={() => setRatingTeacher(t)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-sm ${
                              rating
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white hover:border-slate-600'
                                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/40'
                            }`}
                          >
                            <Award className="w-3.5 h-3.5 text-amber-300" />
                            <span>{rating ? 'Re-rate' : 'Rate KPI'}</span>
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                            Active Faculty
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* B. LEARNER DEMOGRAPHICS & CHRONIC ABSENTEEISM LIST (Clickable Categories & Flagged Names) */}
      {(activeMetricTab === 'all' || activeMetricTab === 'learners') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. CLICKABLE LEARNER DEMOGRAPHICS CARDS */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-cyan-400" />
                <span>Learner Demographics &amp; Gender Balance</span>
              </h3>
              <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-800">
                Click category to view
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time classification based on official DepEd Basic Education Enrollment Forms (BEEF). Click any category card to inspect student names and details.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Male Learners Button */}
              <button
                type="button"
                onClick={() => {
                  const cat = demographicCategories.find((c) => c.key === 'MALE');
                  if (cat) setActiveCategoryModal(cat);
                }}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/60 hover:bg-blue-950/20 text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-slate-300 font-semibold group-hover:text-blue-300 transition-colors">
                    Male Learners
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                </div>
                <div className="mt-2 flex items-baseline justify-between w-full">
                  <span className="font-bold text-blue-400 text-lg font-mono">{maleCount}</span>
                  <span className="text-[10px] text-slate-400">
                    {totalEnrolled > 0 ? ((maleCount / totalEnrolled) * 100).toFixed(0) : 0}% of Scope
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-blue-400 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>View male learners &rarr;</span>
                </div>
              </button>

              {/* Female Learners Button */}
              <button
                type="button"
                onClick={() => {
                  const cat = demographicCategories.find((c) => c.key === 'FEMALE');
                  if (cat) setActiveCategoryModal(cat);
                }}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-pink-500/60 hover:bg-pink-950/20 text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-slate-300 font-semibold group-hover:text-pink-300 transition-colors">
                    Female Learners
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-400"></span>
                </div>
                <div className="mt-2 flex items-baseline justify-between w-full">
                  <span className="font-bold text-pink-400 text-lg font-mono">{femaleCount}</span>
                  <span className="text-[10px] text-slate-400">
                    {totalEnrolled > 0 ? ((femaleCount / totalEnrolled) * 100).toFixed(0) : 0}% of Scope
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-pink-400 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>View female learners &rarr;</span>
                </div>
              </button>

              {/* 4Ps Beneficiaries Button */}
              <button
                type="button"
                onClick={() => {
                  const cat = demographicCategories.find((c) => c.key === 'FOUR_PS');
                  if (cat) setActiveCategoryModal(cat);
                }}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 hover:bg-amber-950/20 text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-slate-300 font-semibold group-hover:text-amber-300 transition-colors">
                    4Ps Beneficiaries
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                </div>
                <div className="mt-2 flex items-baseline justify-between w-full">
                  <span className="font-bold text-amber-400 text-lg font-mono">{fourPsCount}</span>
                  <span className="text-[10px] text-slate-400">DSWD Program</span>
                </div>
                <div className="mt-1 text-[10px] text-amber-400 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>View 4Ps learners &rarr;</span>
                </div>
              </button>

              {/* Non-4Ps Regular Learners Button */}
              <button
                type="button"
                onClick={() => {
                  const cat = demographicCategories.find((c) => c.key === 'NON_FOUR_PS');
                  if (cat) setActiveCategoryModal(cat);
                }}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-500/60 hover:bg-slate-800/40 text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-slate-300 font-semibold group-hover:text-white transition-colors">
                    Non-4Ps Learners
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                </div>
                <div className="mt-2 flex items-baseline justify-between w-full">
                  <span className="font-bold text-slate-300 text-lg font-mono">{totalEnrolled - fourPsCount}</span>
                  <span className="text-[10px] text-slate-400">Regular Non-Grant</span>
                </div>
                <div className="mt-1 text-[10px] text-slate-400 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>View regular learners &rarr;</span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. CHRONIC ABSENTEEISM: NAMES LIST & INTERVENTION ACTION */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-rose-900/50 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Chronic Absenteeism &amp; Flagged Learners</span>
              </h3>
              <span className="text-xs font-mono font-bold text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded-xl border border-rose-700/60">
                {chronicAbsentees.length} Flagged
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              DepEd Order No. 8, s. 2015 requires guidance counselor intervention and parental notice whenever a student reaches 5 consecutive unexcused absences.
            </p>

            {/* List of Flagged Student Names */}
            <div className="space-y-2.5">
              {chronicAbsentees.length > 0 ? (
                chronicAbsentees.map((s) => {
                  const smsSent = smsNoticeSentTo[s.id];
                  const referred = guidanceReferredTo[s.id];

                  return (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-rose-900/50 hover:border-rose-500/60 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-3 min-w-0">
                          <img
                            src={s.photo_url || '/avatars/default-user.svg'}
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover ring-1 ring-rose-500/50 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                              <span>{s.first_name} {s.last_name}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                                5+ Absences
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              LRN: {s.lrn} &bull; {s.grade_level} - {s.section_name || s.section}
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800 shrink-0">
                          GWA: {s.general_average || '74.2'} (At Risk)
                        </span>
                      </div>

                      {/* Parent / Guardian Contact info */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] pt-1 border-t border-slate-900">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-cyan-400" />
                          <span>Parent: {s.deped_beef_details?.guardian_name || s.father_last_name || 'Emilio Silang'} ({s.primary_sms_phone || '+639176664455'})</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Send SMS Warning Button */}
                          <button
                            type="button"
                            onClick={() => handleSendParentSms(s)}
                            disabled={smsSent}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] flex items-center space-x-1 transition-all ${
                              smsSent
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 cursor-default'
                                : 'bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 hover:text-white'
                            }`}
                          >
                            {smsSent ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>SMS Alert Sent</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                <span>Send Parent SMS</span>
                              </>
                            )}
                          </button>

                          {/* Guidance Referral Button */}
                          <button
                            type="button"
                            onClick={() => handleGuidanceReferral(s)}
                            disabled={referred}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] flex items-center space-x-1 transition-all ${
                              referred
                                ? 'bg-blue-950 text-blue-300 border border-blue-800 cursor-default'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            }`}
                          >
                            <ShieldCheck className="w-3 h-3 text-blue-400" />
                            <span>{referred ? 'Referred' : 'Refer Guidance'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                  <div className="text-xs font-bold text-white">Zero Chronic Absenteeism Flags</div>
                  <div className="text-[11px] text-slate-400">
                    All enrolled learners within this scope are meeting DepEd turnstile roll call requirements.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* C. GRADE & SECTION PERFORMANCE METRICS (Scoped to assigned grade sections) */}
      {(activeMetricTab === 'all' || activeMetricTab === 'grades') && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>
                {isTeacherOrMaster
                  ? `Assigned Sections Breakdown (${scopedSections.length} Sections in ${assignedGradeLevels?.join(', ')})`
                  : `Academic Sections Breakdown & Performance (${scopedSections.length} Sections)`}
              </span>
            </h3>
            <span className="text-xs font-mono text-cyan-400">School Year: {selectedYear}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {scopedSections.map((sec) => (
              <div
                key={sec.id}
                onClick={() => {
                  const cat: DemographicCategory = {
                    key: `SEC_${sec.id}`,
                    label: `Section ${sec.name} (${sec.grade_level})`,
                    color: 'cyan',
                    accentClass: 'text-cyan-400 bg-cyan-500/10',
                    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
                    borderClass: 'border-cyan-500/40 hover:border-cyan-400',
                    description: `Learners enrolled in Section ${sec.name} &bull; Adviser: ${sec.adviser_name || 'Maria Fe Santos, LPT'}`,
                    filterFn: (s: Student) =>
                      (s.section_name || s.section || '').toLowerCase() === sec.name.toLowerCase(),
                  };
                  setActiveCategoryModal(cat);
                }}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {sec.name}
                    </h4>
                    <p className="text-[10px] text-cyan-400">{sec.grade_level}</p>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                    {sec.tier === 'SENIOR_HIGH' ? 'SHS' : 'JHS'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Adviser: <span className="text-slate-200">{sec.adviser_name || currentUser?.full_name || 'Maria Fe Santos, LPT'}</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono pt-2 border-t border-slate-800 items-center">
                  <span className="text-slate-500">Attendance:</span>
                  <span className="text-emerald-400 font-bold">96.8%</span>
                </div>
                <div className="text-[10px] text-cyan-400 font-medium pt-1 text-right group-hover:underline">
                  Inspect Students &rarr;
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. INTERACTIVE MODAL: LEARNER DEMOGRAPHICS CATEGORY VIEWER    */}
      {/* ------------------------------------------------------------- */}
      {activeCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-2xl ${activeCategoryModal.accentClass} border border-current`}>
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">{activeCategoryModal.label}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${activeCategoryModal.badgeClass}`}>
                      {modalFilteredStudents.length} Learners Found
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{activeCategoryModal.description}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveCategoryModal(null);
                  setCategorySearchQuery('');
                  setCategorySectionFilter('ALL');
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Filters Toolbar */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by student name, LRN, phone..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Section:</span>
                  <select
                    value={categorySectionFilter}
                    onChange={(e) => setCategorySectionFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 text-xs"
                  >
                    <option value="ALL">All Sections</option>
                    {scopedSections.map((sec) => (
                      <option key={sec.id} value={sec.name}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleExportCategoryCsv}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center space-x-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Modal Learners Table */}
            <div className="p-5 overflow-y-auto flex-1">
              {modalFilteredStudents.length > 0 ? (
                <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">Learner Name &amp; LRN</th>
                        <th className="p-3">Grade &amp; Section</th>
                        <th className="p-3">Sex</th>
                        <th className="p-3">Standing &amp; GWA</th>
                        <th className="p-3">4Ps Status</th>
                        <th className="p-3">Parent / Emergency Contact</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {modalFilteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center space-x-2.5">
                              <img
                                src={s.photo_url || '/avatars/default-user.svg'}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700 bg-slate-900 shrink-0"
                              />
                              <div>
                                <div className="font-bold text-white text-xs">
                                  {s.last_name}, {s.first_name} {s.middle_name || ''}
                                </div>
                                <div className="text-[10px] text-cyan-400 font-mono">LRN: {s.lrn}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-white">{s.grade_level}</div>
                            <div className="text-[10px] text-slate-400">{s.section_name || s.section}</div>
                          </td>
                          <td className="p-3 font-medium">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                s.sex?.toLowerCase() === 'male'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                  : 'bg-pink-950 text-pink-300 border border-pink-800'
                              }`}
                            >
                              {s.sex || 'N/A'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                s.academic_standing === 'HONORS'
                                  ? 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                                  : s.academic_standing === 'AT_RISK'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}
                            >
                              {s.academic_standing || 'PASSING'} ({s.general_average || '88.5'})
                            </span>
                          </td>
                          <td className="p-3">
                            {s.is_4ps_beneficiary ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                                4Ps Voucher
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">Regular</span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-300">
                            {s.primary_sms_phone || s.emergency_contact || '+639176664455'}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setActiveCategoryModal(null);
                                onNavigateTab && onNavigateTab('students');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[10px] font-bold inline-flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View BEEF</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Search className="w-8 h-8 text-slate-600 mx-auto" />
                  <div className="text-sm font-bold text-white">No learners match this category filter</div>
                  <div className="text-xs">Try adjusting your search query or section selection.</div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Displaying {modalFilteredStudents.length} learners under <strong className="text-white">{activeCategoryModal.label}</strong>
              </span>
              <button
                onClick={() => {
                  setActiveCategoryModal(null);
                  setCategorySearchQuery('');
                  setCategorySectionFilter('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: TEACHER RPMS KPI EVALUATION */}
      {ratingTeacher && (
        <TeacherKpiRatingModal
          teacher={ratingTeacher}
          currentRating={
            teacherKpiRatings[ratingTeacher.id] ||
            teacherKpiRatings[ratingTeacher.full_name] ||
            teacherKpiRatings[ratingTeacher.username]
          }
          isOpen={!!ratingTeacher}
          onClose={() => setRatingTeacher(null)}
          onSaveRating={handleSaveKpiRating}
        />
      )}
    </div>
  );
}

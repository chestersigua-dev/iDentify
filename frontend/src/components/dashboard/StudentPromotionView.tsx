'use client';

import React, { useState, useMemo } from 'react';
import {
  Student,
  AcademicSection,
  UserAccount,
  promotionApi,
  StudentGradeHistory,
} from '@/lib/api';
import { useTenant } from '@/lib/tenant-context';
import {
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Square,
  Search,
  Filter,
  History,
  AlertCircle,
  Users,
  Calendar,
  Sparkles,
  School,
  X,
  ChevronRight,
  Award,
  BookOpen,
  TrendingUp,
} from 'lucide-react';

interface StudentPromotionViewProps {
  students: Student[];
  sections: AcademicSection[];
  currentUser?: UserAccount | null;
  onRefreshStudents?: () => void;
  onPromotionComplete?: () => void;
}

export default function StudentPromotionView({
  students,
  sections,
  currentUser,
  onRefreshStudents,
  onPromotionComplete,
}: StudentPromotionViewProps) {
  const { school } = useTenant();

  // Filter State
  const [sourceSchoolYear, setSourceSchoolYear] = useState<string>('2025-2026');
  const [selectedGrade, setSelectedGrade] = useState<string>('Grade 10');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Target Promotion State
  const [targetSchoolYear, setTargetSchoolYear] = useState<string>('2026-2027');
  const [targetGradeLevel, setTargetGradeLevel] = useState<string>('Grade 11');
  const [targetSectionId, setTargetSectionId] = useState<string>('');

  // Selected Student IDs (Checkbox selection)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isPromoting, setIsPromoting] = useState<boolean>(false);
  const [promotionSuccessMsg, setPromotionSuccessMsg] = useState<string>('');

  // Modal to inspect a student's prior grade history
  const [inspectingHistoryStudent, setInspectingHistoryStudent] = useState<Student | null>(null);

  const GRADE_PROGRESSION_MAP: Record<string, string> = {
    Kindergarten: 'Grade 1',
    'Grade 1': 'Grade 2',
    'Grade 2': 'Grade 3',
    'Grade 3': 'Grade 4',
    'Grade 4': 'Grade 5',
    'Grade 5': 'Grade 6',
    'Grade 6': 'Grade 7',
    'Grade 7': 'Grade 8',
    'Grade 8': 'Grade 9',
    'Grade 9': 'Grade 10',
    'Grade 10': 'Grade 11',
    'Grade 11': 'Grade 12',
    'Grade 12': 'Graduated / Completed',
  };

  // When selectedGrade changes, automatically determine logical next grade level
  const handleGradeChange = (newGrade: string) => {
    setSelectedGrade(newGrade);
    setSelectedSectionId('ALL');
    const nextGrade = GRADE_PROGRESSION_MAP[newGrade] || 'Grade 2';
    setTargetGradeLevel(nextGrade);

    // Pick first candidate section matching next grade
    const targetCandidates = sections.filter(
      (s) =>
        String(s.grade_level).toLowerCase() === nextGrade.toLowerCase() ||
        String(s.name).toLowerCase().includes(nextGrade.toLowerCase())
    );
    if (targetCandidates.length > 0) {
      setTargetSectionId(targetCandidates[0].id);
    } else {
      setTargetSectionId('');
    }
  };

  // Filter students by selected grade and optional section
  const currentGradeStudents = useMemo(() => {
    return students.filter((s) => {
      const matchGrade = String(s.grade_level).toLowerCase() === selectedGrade.toLowerCase();
      const matchSection = selectedSectionId === 'ALL' ? true : s.section_id === selectedSectionId;
      const matchSearch = searchQuery.trim()
        ? `${s.first_name} ${s.last_name} ${s.lrn}`.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchGrade && matchSection && matchSearch;
    });
  }, [students, selectedGrade, selectedSectionId, searchQuery]);

  // Candidate target sections for the promoted grade level
  const targetCandidateSections = useMemo(() => {
    return sections.filter(
      (s) =>
        String(s.grade_level).toLowerCase() === targetGradeLevel.toLowerCase() ||
        String(s.name).toLowerCase().includes(targetGradeLevel.toLowerCase())
    );
  }, [sections, targetGradeLevel]);

  // Master Toggle: Select all / Deselect all in the active filtered view
  const handleToggleSelectAll = () => {
    const currentIds = currentGradeStudents.map((s) => s.id);
    if (selectedStudentIds.length === currentIds.length && currentIds.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(currentIds);
    }
  };

  // Toggle individual student
  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Execute Batch Promotion
  const handleExecutePromotion = async () => {
    if (selectedStudentIds.length === 0) {
      alert('Please select at least one student to promote.');
      return;
    }

    const matchedSection = sections.find((s) => s.id === targetSectionId);
    const targetSectionName = matchedSection ? matchedSection.name : 'Unassigned Section';

    const confirmMsg = `Are you sure you want to promote ${selectedStudentIds.length} student(s) from ${selectedGrade} to ${targetGradeLevel} (${targetSectionName}) for SY ${targetSchoolYear}?\n\nTheir academic record in ${selectedGrade} (SY ${sourceSchoolYear}) will be permanently preserved in their grade history.`;
    if (!window.confirm(confirmMsg)) return;

    setIsPromoting(true);
    setPromotionSuccessMsg('');

    try {
      const res = await promotionApi.promoteBatch({
        studentIds: selectedStudentIds,
        sourceSchoolYear,
        targetSchoolYear,
        targetGradeLevel,
        targetSectionId,
        targetSectionName,
      });

      setPromotionSuccessMsg(
        `Successfully promoted ${res.promotedCount} student(s) to ${targetGradeLevel} (${targetSectionName}). Historical prior grade records have been archived into each learner's educational history.`
      );
      setSelectedStudentIds([]);
      if (onRefreshStudents) onRefreshStudents();
      if (onPromotionComplete) onPromotionComplete();
    } catch (err: any) {
      alert(err.message || 'Error executing promotion.');
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER BANNER                                              */}
      {/* ------------------------------------------------------------- */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
              End-of-School-Year Module
            </span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-xs text-slate-400">DepEd Order No. 08, s. 2015 Compliant</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-purple-400" />
            <span>Student Promotion &amp; Grade History Progression</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            Advance eligible learners to the next grade level with batch selection. Prior year attendance and academic achievements stay permanently archived in their grade level history.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 text-xs">
          <Calendar className="w-4 h-4 text-purple-400" />
          <span className="text-slate-400">Source Year:</span>
          <span className="font-mono font-bold text-white">{sourceSchoolYear}</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-400">Target:</span>
          <span className="font-mono font-bold text-emerald-400">{targetSchoolYear}</span>
        </div>
      </div>

      {promotionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{promotionSuccessMsg}</span>
          </div>
          <button onClick={() => setPromotionSuccessMsg('')} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. PROMOTION WORKSPACE GRID (LEFT: ROSTER, RIGHT: ACTIONS)    */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (2 COLS): SELECT STUDENTS TO PROMOTE */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" />
                <span>1. Select Grade Level &amp; Section to Advance</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {currentGradeStudents.length} Students Available
              </span>
            </div>

            {/* Select Grade & Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Current Grade Level</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-purple-500"
                >
                  {Object.keys(GRADE_PROGRESSION_MAP).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Section Filter</label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="ALL">All Sections in {selectedGrade}</option>
                  {sections
                    .filter((s) => String(s.grade_level).toLowerCase() === selectedGrade.toLowerCase())
                    .map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name} ({sec.student_count || 0} students)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Search Student</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name or LRN..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Student Roster Table with Master Checkbox */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-200">
                <input
                  type="checkbox"
                  checked={
                    currentGradeStudents.length > 0 &&
                    selectedStudentIds.length === currentGradeStudents.length
                  }
                  onChange={handleToggleSelectAll}
                  className="rounded accent-purple-600 w-4 h-4 cursor-pointer"
                />
                <span>Select All for Promotion</span>
              </label>

              <span className="text-xs text-purple-400 font-mono font-bold bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                {selectedStudentIds.length} of {currentGradeStudents.length} Selected
              </span>
            </div>

            {currentGradeStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs space-y-1">
                <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-slate-400">No students found in {selectedGrade}.</p>
                <p className="text-[11px]">Select another grade level or enroll new students first.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider font-semibold sticky top-0 z-10 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 w-10"></th>
                      <th className="py-3 px-4">Learner Name &amp; LRN</th>
                      <th className="py-3 px-4">Current Section</th>
                      <th className="py-3 px-4">General Avg</th>
                      <th className="py-3 px-4">Academic History</th>
                      <th className="py-3 px-4 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {currentGradeStudents.map((st) => {
                      const isChecked = selectedStudentIds.includes(st.id);
                      const historyCount = st.grade_history ? st.grade_history.length : 0;
                      const avg = st.general_average || 88.5;

                      return (
                        <tr
                          key={st.id}
                          className={`hover:bg-slate-800/50 transition-colors ${
                            isChecked ? 'bg-purple-950/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleStudent(st.id)}
                              className="rounded accent-purple-600 w-4 h-4 cursor-pointer"
                            />
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-white">
                              {st.last_name}, {st.first_name} {st.middle_name || ''} {st.extension_name || ''}
                            </div>
                            <div className="font-mono text-[11px] text-cyan-400">{st.lrn}</div>
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-300">
                            {st.section_name || st.section || 'Unassigned'}
                          </td>

                          <td className="py-3 px-4 font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 rounded ${
                                avg >= 90
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : avg >= 75
                                  ? 'text-blue-400 bg-blue-500/10'
                                  : 'text-rose-400 bg-rose-500/10'
                              }`}
                            >
                              {avg.toFixed(2)}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            {historyCount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                                <History className="w-3 h-3" />
                                <span>{historyCount} Past Grades</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">No prior history</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setInspectingHistoryStudent(st)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                              title="View Grade History Timeline"
                            >
                              <History className="w-3.5 h-3.5 text-purple-400" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (1 COL): TARGET PROMOTION CONTROL PANEL */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-purple-900/40 shadow-xl space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">2. Target Promotion Target</h3>
                <p className="text-[11px] text-slate-400">Next curriculum grade level &amp; section</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Target Next School Year</label>
                <input
                  type="text"
                  value={targetSchoolYear}
                  onChange={(e) => setTargetSchoolYear(e.target.value)}
                  placeholder="e.g. 2026-2027"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Target Next Grade Level</label>
                <select
                  value={targetGradeLevel}
                  onChange={(e) => setTargetGradeLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-500/50 rounded-xl px-3 py-2 text-white font-bold text-cyan-400 focus:outline-none"
                >
                  {Object.keys(GRADE_PROGRESSION_MAP).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                  <option value="Graduated / Completed">Graduated / Completed</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Automatically set to next chronological grade
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Target Section</label>
                <select
                  value={targetSectionId}
                  onChange={(e) => setTargetSectionId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Unassigned Section (Pool) --</option>
                  {targetCandidateSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name} &bull; Adviser: {sec.adviser_name || 'TBD'}
                    </option>
                  ))}
                  {/* Fallback to other sections */}
                  {sections
                    .filter((s) => !targetCandidateSections.some((c) => c.id === s.id))
                    .map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        [{sec.grade_level}] {sec.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Selected for Promotion:</span>
                  <span className="font-mono font-bold text-white text-sm">{selectedStudentIds.length}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>From:</span>
                  <span className="font-semibold text-slate-300">
                    {selectedGrade} (SY {sourceSchoolYear})
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>To:</span>
                  <span className="font-semibold text-emerald-400">
                    {targetGradeLevel} (SY {targetSchoolYear})
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-900/40 text-[11px] text-purple-200 flex items-start gap-2">
                <Award className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  Permanent Grade Preservation: Each student’s prior year performance in {selectedGrade} remains in their record and is displayed chronologically.
                </span>
              </div>

              <button
                type="button"
                disabled={isPromoting || selectedStudentIds.length === 0}
                onClick={handleExecutePromotion}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <GraduationCap className="w-4 h-4" />
                <span>
                  {isPromoting
                    ? 'Executing Promotion...'
                    : `Promote Selected Students (${selectedStudentIds.length})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. MODAL: HISTORICAL GRADE PROGRESSION TIMELINE               */}
      {/* ------------------------------------------------------------- */}
      {inspectingHistoryStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative z-10 text-white animate-scale-up">
            <button
              onClick={() => setInspectingHistoryStudent(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <History className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                  LRN: {inspectingHistoryStudent.lrn}
                </span>
                <h3 className="text-base font-bold text-white">
                  {inspectingHistoryStudent.last_name}, {inspectingHistoryStudent.first_name} {inspectingHistoryStudent.middle_name || ''}
                </h3>
                <p className="text-xs text-slate-400">Complete Educational Grade History Timeline</p>
              </div>
            </div>

            {/* Current Active Grade Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 mb-4 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Current Active Placement</span>
                <span className="font-bold text-white text-sm">
                  {inspectingHistoryStudent.grade_level} &bull; {inspectingHistoryStudent.section_name || 'Section General'}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            {/* Timeline of Prior Grades */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Preserved Historical Records (Sorted by Grade Level):
              </span>

              {(!inspectingHistoryStudent.grade_history || inspectingHistoryStudent.grade_history.length === 0) ? (
                <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-slate-500 text-xs">
                  This learner was admitted in the current academic year. No prior promotions recorded yet.
                </div>
              ) : (
                inspectingHistoryStudent.grade_history
                  .slice()
                  .sort((a, b) => {
                    const numA = parseInt(String(a.grade_level).replace(/\D/g, '') || '0', 10);
                    const numB = parseInt(String(b.grade_level).replace(/\D/g, '') || '0', 10);
                    return numA - numB;
                  })
                  .map((hist, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 relative pl-8 text-xs hover:border-slate-700 transition-colors"
                    >
                      {/* Timeline dot */}
                      <span className="absolute left-3 top-5 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-purple-950" />

                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-sm">{hist.grade_level}</span>
                        <span className="font-mono text-[11px] text-purple-300 font-semibold">{hist.school_year}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400 text-[11px] mb-1">
                        <span>Section: {hist.section_name || 'N/A'}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          Gen Avg: {hist.general_average?.toFixed(2) || '88.00'}
                        </span>
                        <span>&bull;</span>
                        <span className="text-slate-300 uppercase font-bold text-[10px]">{hist.status}</span>
                      </div>

                      {hist.remarks && (
                        <p className="text-[11px] text-slate-400 italic mt-1.5 pt-1.5 border-t border-slate-900">
                          &ldquo;{hist.remarks}&rdquo;
                        </p>
                      )}
                    </div>
                  ))
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingHistoryStudent(null)}
                className="py-2.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

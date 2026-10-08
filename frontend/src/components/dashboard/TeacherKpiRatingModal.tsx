'use client';

import React, { useState } from 'react';
import {
  X,
  Star,
  Award,
  CheckCircle2,
  AlertCircle,
  User,
  Building2,
  Calendar,
  Save,
  MessageSquare,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { UserAccount, formatUserDisplayName } from '@/lib/api';
import { useTenant } from '@/lib/tenant-context';

export interface TeacherKpiScore {
  teacherId: string;
  teacherName: string;
  evaluatorName: string;
  evaluatorRole: string;
  evaluatedAt: string;
  schoolYear: string;
  scores: {
    pedagogy: number;
    classroomManagement: number;
    attendanceCompliance: number;
    learnerEngagement: number;
    depedFormsCompliance: number;
  };
  overallScore: number;
  adjectivalRating: 'Outstanding' | 'Very Satisfactory' | 'Satisfactory' | 'Unsatisfactory' | 'Poor';
  remarks: string;
}

interface TeacherKpiRatingModalProps {
  teacher: UserAccount;
  currentRating?: TeacherKpiScore;
  isOpen: boolean;
  onClose: () => void;
  onSaveRating: (rating: TeacherKpiScore) => void;
}

const CRITERIA = [
  {
    key: 'pedagogy' as const,
    title: 'Content Knowledge & Pedagogy',
    desc: 'Mastery of subject matter, teaching strategies, and curriculum standard alignment (DepEd RPMS KRA 1).',
  },
  {
    key: 'classroomManagement' as const,
    title: 'Learning Environment & Management',
    desc: 'Fair learning environment, student discipline, safety protocols, and conducive classroom atmosphere (KRA 2).',
  },
  {
    key: 'attendanceCompliance' as const,
    title: 'Roll Call & Attendance Promptness',
    desc: 'Timely daily subject roll calls, gate turnstile cross-referencing, and early warning for at-risk students.',
  },
  {
    key: 'learnerEngagement' as const,
    title: 'Learner Diversity & Engagement',
    desc: 'Addressing diversity of learners (4Ps, IP, SNED), student motivation, and participatory instruction (KRA 3).',
  },
  {
    key: 'depedFormsCompliance' as const,
    title: 'DepEd Standard Forms Compliance',
    desc: 'Accurate and prompt submission of School Forms (SF1 Register, SF2 Daily Attendance, SF5 Promotion).',
  },
];

export const calculateAdjectival = (
  score: number
): 'Outstanding' | 'Very Satisfactory' | 'Satisfactory' | 'Unsatisfactory' | 'Poor' => {
  if (score >= 4.5) return 'Outstanding';
  if (score >= 3.5) return 'Very Satisfactory';
  if (score >= 2.5) return 'Satisfactory';
  if (score >= 1.5) return 'Unsatisfactory';
  return 'Poor';
};

export default function TeacherKpiRatingModal({
  teacher,
  currentRating,
  isOpen,
  onClose,
  onSaveRating,
}: TeacherKpiRatingModalProps) {
  const { currentUser, school } = useTenant();

  const [scores, setScores] = useState({
    pedagogy: currentRating?.scores.pedagogy || 5,
    classroomManagement: currentRating?.scores.classroomManagement || 5,
    attendanceCompliance: currentRating?.scores.attendanceCompliance || 5,
    learnerEngagement: currentRating?.scores.learnerEngagement || 5,
    depedFormsCompliance: currentRating?.scores.depedFormsCompliance || 5,
  });

  const [remarks, setRemarks] = useState(
    currentRating?.remarks ||
      'Exemplary classroom instruction, consistent on-time attendance roll call submissions, and active adherence to DepEd order guidelines.'
  );

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Calculate live average
  const totalScore =
    scores.pedagogy +
    scores.classroomManagement +
    scores.attendanceCompliance +
    scores.learnerEngagement +
    scores.depedFormsCompliance;
  const overallScore = parseFloat((totalScore / 5).toFixed(2));
  const adjectival = calculateAdjectival(overallScore);

  const handleScoreChange = (key: keyof typeof scores, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const evaluatorName =
      formatUserDisplayName(currentUser) || currentUser?.display_name || currentUser?.full_name || currentUser?.name || 'Dr. Chester Sigua';
    const evaluatorRole =
      currentUser?.position || 'Principal / Evaluator';

    const newRating: TeacherKpiScore = {
      teacherId: teacher.id,
      teacherName: teacher.full_name,
      evaluatorName,
      evaluatorRole,
      evaluatedAt: new Date().toISOString(),
      schoolYear: '2025-2026',
      scores,
      overallScore,
      adjectivalRating: adjectival,
      remarks,
    };

    setTimeout(() => {
      onSaveRating(newRating);
      setSaving(false);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 900);
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 glass-modal-backdrop bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto custom-scrollbar animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Rate Teacher KPI &amp; Performance
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Department of Education Results-Based Performance Management System (RPMS / IPCRF) Evaluation
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>Teacher KPI evaluation successfully saved and recorded!</span>
          </div>
        )}

        {/* Evaluator & Target Teacher Summary Card */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target Teacher */}
          <div className="flex items-center gap-3">
            <img
              src={teacher.photo_url || '/avatars/default-user.svg'}
              alt={teacher.full_name}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-500/40 shrink-0 bg-slate-200 dark:bg-slate-800"
            />
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Faculty Member</span>
              <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{teacher.full_name}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
                {teacher.position || teacher.role}
              </div>
            </div>
          </div>

          {/* Evaluator / School Head */}
          <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-3 md:pt-0 md:pl-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Authorized Evaluator</span>
              <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                {formatUserDisplayName(currentUser) || currentUser?.display_name || currentUser?.full_name || 'Dr. Chester Sigua'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {currentUser?.position || 'Principal / School Head'} &bull; {school.short_name || school.name}
              </div>
            </div>
          </div>
        </div>

        {/* Overall Score Live Banner */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider block">
              Calculated RPMS KPI Metric
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-blue-700 dark:text-blue-400">
                {overallScore}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                / 5.00
              </span>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                overallScore >= 4.5
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : overallScore >= 3.5
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{adjectival}</span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
              DepEd Scale: 4.50-5.00 Outstanding
            </span>
          </div>
        </div>

        {/* Evaluation Criteria Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Evaluation Criteria &amp; Rating (Scale: 1 Poor to 5 Outstanding)
            </span>

            {CRITERIA.map((crit) => {
              const currentVal = scores[crit.key];
              return (
                <div
                  key={crit.key}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 dark:hover:border-slate-700 transition"
                >
                  <div className="flex-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{crit.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {crit.desc}
                    </p>
                  </div>

                  {/* 1-5 Rating Button Group */}
                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const isActive = currentVal === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleScoreChange(crit.key, val)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/40 scale-105'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Evaluator Remarks & Action Plan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
              <span>Principal Evaluator Remarks &amp; Growth Plan</span>
            </label>
            <textarea
              rows={3}
              required
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter commendations, classroom observation notes, or corrective feedback..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving Rating...' : 'Save & Record KPI Rating'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
